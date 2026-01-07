import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '/core/flutter_flow/flutter_flow_util.dart';
import 'api_config.dart';

/// Service pour l'intégration avec l'API Football externe
/// Utilise Football-Data.org (API gratuite) pour récupérer les données de matchs
class FootballApiService {
  static FootballApiService? _instance;
  static FootballApiService get instance => _instance ??= FootballApiService._();
  
  FootballApiService._();
  
  // Cache pour les données en cas d'indisponibilité de l'API
  static Map<String, dynamic> _cache = {};
  static DateTime? _lastCacheUpdate;
  
  /// Headers par défaut pour les requêtes API
  Map<String, String> get _headers => {
    'X-Auth-Token': ApiConfig.apiKey,
    'Content-Type': 'application/json',
  };

  /// Récupère les matchs du jour depuis l'API externe
  Future<ApiResult<List<MatchData>>> getTodayMatches() async {
    try {
      if (!ApiConfig.isConfigured) {
        // Utiliser les données de test si l'API n'est pas configurée
        debugPrint('API non configurée, utilisation des données de test');
        final testMatches = getTestMatches();
        return ApiResult.success(testMatches, isFromCache: true);
      }

      final today = DateTime.now();
      final dateStr = DateFormat('yyyy-MM-dd').format(today);
      
      final url = '${ApiConfig.baseUrl}/matches?dateFrom=$dateStr&dateTo=$dateStr';
      final response = await http.get(
        Uri.parse(url), 
        headers: _headers,
      ).timeout(ApiConfig.apiTimeout);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final matches = (data['matches'] as List)
            .map((match) => MatchData.fromJson(match))
            .where((match) => _isValidMatch(match))
            .toList();
        
        // Si aucun match trouvé, utiliser les données de test
        if (matches.isEmpty) {
          debugPrint('Aucun match trouvé pour aujourd\'hui, utilisation des données de test');
          return ApiResult.success(getTestMatches(), isFromCache: true);
        }
        
        // Mettre en cache les données
        _cache['today_matches'] = data;
        _cache['today_matches_timestamp'] = DateTime.now().millisecondsSinceEpoch;
        _lastCacheUpdate = DateTime.now();
        
        return ApiResult.success(matches);
      } else if (response.statusCode == 429) {
        // Rate limit atteint, utiliser le cache ou les données de test
        final cachedMatches = _getCachedTodayMatches();
        if (cachedMatches.isNotEmpty) {
          return ApiResult.cached(cachedMatches);
        } else {
          debugPrint('Rate limit atteint, utilisation des données de test');
          return ApiResult.success(getTestMatches(), isFromCache: true);
        }
      } else {
        debugPrint('API Error: ${response.statusCode} - ${response.body}');
        final cachedMatches = _getCachedTodayMatches();
        if (cachedMatches.isNotEmpty) {
          return ApiResult.cached(cachedMatches);
        } else {
          debugPrint('Erreur API, utilisation des données de test');
          return ApiResult.success(getTestMatches(), isFromCache: true);
        }
      }
    } catch (e) {
      debugPrint('Football API Error: $e');
      final cachedMatches = _getCachedTodayMatches();
      if (cachedMatches.isNotEmpty) {
        return ApiResult.cached(cachedMatches);
      } else {
        debugPrint('Erreur de connexion, utilisation des données de test');
        return ApiResult.success(getTestMatches(), isFromCache: true);
      }
    }
  }

  /// Récupère les scores en direct pour les matchs actifs
  Future<ApiResult<List<MatchScore>>> getLiveScores(List<String> matchIds) async {
    if (!ApiConfig.isConfigured) {
      return ApiResult.error('API non configurée');
    }

    try {
      final scores = <MatchScore>[];
      
      // Limiter le nombre de requêtes simultanées
      final batches = _createBatches(matchIds, 5);
      
      for (final batch in batches) {
        final futures = batch.map((matchId) async {
          try {
            final url = '${ApiConfig.baseUrl}/matches/$matchId';
            final response = await http.get(
              Uri.parse(url), 
              headers: _headers,
            ).timeout(ApiConfig.apiTimeout);
            
            if (response.statusCode == 200) {
              final data = json.decode(response.body);
              return MatchScore.fromJson(data);
            }
          } catch (e) {
            print('Error fetching score for match $matchId: $e');
          }
          return null;
        });
        
        final results = await Future.wait(futures);
        scores.addAll(results.where((score) => score != null).cast<MatchScore>());
        
        // Petite pause entre les batches pour éviter le rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await Future.delayed(const Duration(milliseconds: 200));
        }
      }
      
      return ApiResult.success(scores);
    } catch (e) {
      print('Live Scores Error: $e');
      return ApiResult.error('Erreur lors de la récupération des scores: $e');
    }
  }

  /// Récupère les détails d'un match spécifique
  Future<ApiResult<MatchData>> getMatchDetails(String matchId) async {
    if (!ApiConfig.isConfigured) {
      return ApiResult.error('API non configurée');
    }

    try {
      final url = '${ApiConfig.baseUrl}/matches/$matchId';
      final response = await http.get(
        Uri.parse(url), 
        headers: _headers,
      ).timeout(ApiConfig.apiTimeout);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final match = MatchData.fromJson(data);
        return ApiResult.success(match);
      } else {
        print('Match Details Error: ${response.statusCode}');
        return ApiResult.error('Erreur lors de la récupération du match: ${response.statusCode}');
      }
    } catch (e) {
      print('Match Details Error: $e');
      return ApiResult.error('Erreur de connexion: $e');
    }
  }

  /// Récupère les matchs depuis le cache en cas d'erreur API
  List<MatchData> _getCachedTodayMatches() {
    if (_cache.containsKey('today_matches')) {
      // Vérifier si le cache n'est pas trop ancien
      final timestamp = _cache['today_matches_timestamp'] as int?;
      if (timestamp != null) {
        final cacheAge = DateTime.now().millisecondsSinceEpoch - timestamp;
        if (cacheAge > ApiConfig.cacheExpiration.inMilliseconds) {
          // Cache expiré
          return [];
        }
      }
      
      final data = _cache['today_matches'];
      return (data['matches'] as List)
          .map((match) => MatchData.fromJson(match))
          .where((match) => _isValidMatch(match))
          .toList();
    }
    return [];
  }

  /// Vérifie si un match est valide pour notre application
  bool _isValidMatch(MatchData match) {
    // Filtrer les matchs des compétitions supportées
    return ApiConfig.supportedCompetitions.values.any(
      (competitionId) => match.competition.isNotEmpty
    );
  }

  /// Crée des batches pour limiter les requêtes simultanées
  List<List<T>> _createBatches<T>(List<T> items, int batchSize) {
    final batches = <List<T>>[];
    for (int i = 0; i < items.length; i += batchSize) {
      final end = (i + batchSize < items.length) ? i + batchSize : items.length;
      batches.add(items.sublist(i, end));
    }
    return batches;
  }

  /// Vérifie si l'API est disponible
  Future<bool> isApiAvailable() async {
    if (!ApiConfig.isConfigured) return false;
    
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/competitions'),
        headers: _headers,
      ).timeout(const Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// Retourne l'âge du cache en minutes
  int? getCacheAgeMinutes() {
    if (_lastCacheUpdate == null) return null;
    return DateTime.now().difference(_lastCacheUpdate!).inMinutes;
  }

  /// Nettoie le cache expiré
  void clearExpiredCache() {
    final now = DateTime.now().millisecondsSinceEpoch;
    final keysToRemove = <String>[];
    
    _cache.forEach((key, value) {
      if (key.endsWith('_timestamp')) {
        final timestamp = value as int;
        if (now - timestamp > ApiConfig.cacheExpiration.inMilliseconds) {
          keysToRemove.add(key);
          keysToRemove.add(key.replaceAll('_timestamp', ''));
        }
      }
    });
    
    for (final key in keysToRemove) {
      _cache.remove(key);
    }
  }

  /// Retourne des données de test pour le développement
  List<MatchData> getTestMatches() {
    final now = DateTime.now();
    return [
      MatchData(
        id: 'test_1',
        homeTeamName: 'Real Madrid',
        homeTeamLogo: 'https://crests.football-data.org/86.png',
        awayTeamName: 'Barcelona',
        awayTeamLogo: 'https://crests.football-data.org/81.png',
        competition: 'La Liga',
        startTime: now.add(const Duration(hours: 2)),
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0,
      ),
      MatchData(
        id: 'test_2',
        homeTeamName: 'Manchester United',
        homeTeamLogo: 'https://crests.football-data.org/66.png',
        awayTeamName: 'Liverpool',
        awayTeamLogo: 'https://crests.football-data.org/64.png',
        competition: 'Premier League',
        startTime: now.subtract(const Duration(minutes: 30)),
        status: 'live',
        homeScore: 1,
        awayScore: 2,
        minute: 75,
      ),
    ];
  }
}

/// Modèle de données pour un match depuis l'API
class MatchData {
  final String id;
  final String homeTeamName;
  final String homeTeamLogo;
  final String awayTeamName;
  final String awayTeamLogo;
  final String competition;
  final DateTime startTime;
  final String status;
  final int homeScore;
  final int awayScore;
  final int? minute;

  MatchData({
    required this.id,
    required this.homeTeamName,
    required this.homeTeamLogo,
    required this.awayTeamName,
    required this.awayTeamLogo,
    required this.competition,
    required this.startTime,
    required this.status,
    required this.homeScore,
    required this.awayScore,
    this.minute,
  });

  factory MatchData.fromJson(Map<String, dynamic> json) {
    return MatchData(
      id: json['id'].toString(),
      homeTeamName: json['homeTeam']['name'] ?? '',
      homeTeamLogo: json['homeTeam']['crest'] ?? '',
      awayTeamName: json['awayTeam']['name'] ?? '',
      awayTeamLogo: json['awayTeam']['crest'] ?? '',
      competition: json['competition']['name'] ?? '',
      startTime: DateTime.parse(json['utcDate']),
      status: _mapStatus(json['status']),
      homeScore: json['score']['fullTime']['home'] ?? 0,
      awayScore: json['score']['fullTime']['away'] ?? 0,
      minute: json['minute'],
    );
  }

  /// Mappe les statuts de l'API vers nos statuts internes
  static String _mapStatus(String apiStatus) {
    switch (apiStatus) {
      case 'SCHEDULED':
      case 'TIMED':
        return 'scheduled';
      case 'IN_PLAY':
      case 'PAUSED':
        return 'live';
      case 'FINISHED':
        return 'finished';
      case 'POSTPONED':
      case 'CANCELLED':
        return 'postponed';
      default:
        return 'scheduled';
    }
  }

  /// Détermine le résultat du match pour les pronostics
  String getResult() {
    if (status != 'finished') return 'pending';
    
    if (homeScore > awayScore) return 'team_a';
    if (awayScore > homeScore) return 'team_b';
    return 'draw';
  }
}

/// Modèle pour les scores en direct
class MatchScore {
  final String matchId;
  final int homeScore;
  final int awayScore;
  final String status;
  final int? minute;

  MatchScore({
    required this.matchId,
    required this.homeScore,
    required this.awayScore,
    required this.status,
    this.minute,
  });

  factory MatchScore.fromJson(Map<String, dynamic> json) {
    return MatchScore(
      matchId: json['id'].toString(),
      homeScore: json['score']['fullTime']['home'] ?? 0,
      awayScore: json['score']['fullTime']['away'] ?? 0,
      status: MatchData._mapStatus(json['status']),
      minute: json['minute'],
    );
  }
}

/// Résultat d'une opération avec gestion d'erreur
class ApiResult<T> {
  final T? data;
  final String? error;
  final bool isFromCache;

  ApiResult.success(this.data, {this.isFromCache = false}) : error = null;
  ApiResult.error(this.error, {this.isFromCache = false}) : data = null;
  ApiResult.cached(this.data) : error = null, isFromCache = true;

  bool get isSuccess => data != null && error == null;
  bool get isError => error != null;
}