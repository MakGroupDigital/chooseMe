import '/core/backend/backend.dart';
import '/core/auth/firebase_auth/auth_util.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_widgets.dart';
import '/features/live_match/services/leaderboard_service.dart';
import '/features/live_match/services/pronostic_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import 'leaderboard_model.dart';
export 'leaderboard_model.dart';

class LeaderboardWidget extends StatefulWidget {
  const LeaderboardWidget({super.key});

  static String routeName = 'Leaderboard';
  static String routePath = 'leaderboard';

  @override
  State<LeaderboardWidget> createState() => _LeaderboardWidgetState();
}

class _LeaderboardWidgetState extends State<LeaderboardWidget>
    with TickerProviderStateMixin {
  late LeaderboardModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  late AnimationController _animationController;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => LeaderboardModel());
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _tabController = TabController(length: 3, vsync: this);
    _animationController.forward();
  }

  @override
  void dispose() {
    _model.dispose();
    _animationController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF208050),
        title: Text(
          'Classement',
          style: GoogleFonts.inter(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF19DB8A),
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: GoogleFonts.readexPro(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          tabs: const [
            Tab(text: 'Classement'),
            Tab(text: 'Mes Stats'),
            Tab(text: 'Historique'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildLeaderboardTab(),
          _buildUserStatsTab(),
          _buildHistoryTab(),
        ],
      ),
    );
  }

  Widget _buildLeaderboardTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Sélecteur de période
          _buildPeriodSelector()
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms)
              .slideY(begin: -0.3, end: 0),

          const SizedBox(height: 24),

          // Classement
          _buildLeaderboard()
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 200.ms)
              .slideY(begin: 0.3, end: 0),
        ],
      ),
    );
  }

  Widget _buildPeriodSelector() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF208050).withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildPeriodButton('Tout temps', 'all_time'),
          ),
          Expanded(
            child: _buildPeriodButton('Ce mois', 'monthly'),
          ),
          Expanded(
            child: _buildPeriodButton('Cette semaine', 'weekly'),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodButton(String label, String period) {
    final isSelected = _model.selectedPeriod == period;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _model.selectedPeriod = period;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF208050) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: GoogleFonts.readexPro(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildLeaderboard() {
    return FutureBuilder<List<LeaderboardEntry>>(
      future: LeaderboardService.instance.getGlobalLeaderboard(
        period: _model.selectedPeriod,
        limit: 50,
      ),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Container(
            padding: const EdgeInsets.all(20),
            child: Text(
              'Erreur: ${snapshot.error}',
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          );
        }

        if (!snapshot.hasData) {
          return const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF19DB8A)),
            ),
          );
        }

        final leaderboard = snapshot.data!;
        
        if (leaderboard.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFF208050).withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Column(
              children: [
                const Icon(
                  Icons.emoji_events,
                  color: Color(0xFF19DB8A),
                  size: 48,
                ),
                const SizedBox(height: 16),
                Text(
                  'Aucun classement disponible',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Faites vos premiers pronostics pour apparaître dans le classement !',
                  style: GoogleFonts.readexPro(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: const Color(0xFF208050).withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Icon(
                      Icons.emoji_events,
                      color: Color(0xFF19DB8A),
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Top ${leaderboard.length}',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              ...leaderboard.asMap().entries.map((entry) {
                final index = entry.key;
                final leaderboardEntry = entry.value;
                return _buildLeaderboardItem(leaderboardEntry, index == leaderboard.length - 1);
              }).toList(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLeaderboardItem(LeaderboardEntry entry, bool isLast) {
    Color rankColor;
    IconData? rankIcon;

    switch (entry.rank) {
      case 1:
        rankColor = const Color(0xFFFFD700); // Or
        rankIcon = Icons.emoji_events;
        break;
      case 2:
        rankColor = const Color(0xFFC0C0C0); // Argent
        rankIcon = Icons.emoji_events;
        break;
      case 3:
        rankColor = const Color(0xFFCD7F32); // Bronze
        rankIcon = Icons.emoji_events;
        break;
      default:
        rankColor = Colors.white70;
        rankIcon = null;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        border: isLast ? null : Border(
          bottom: BorderSide(
            color: const Color(0xFF2A2A2A),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Rang
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: rankColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: rankColor, width: 1),
            ),
            child: Center(
              child: rankIcon != null
                  ? Icon(rankIcon, color: rankColor, size: 20)
                  : Text(
                      '${entry.rank}',
                      style: GoogleFonts.inter(
                        color: rankColor,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 16),

          // Nom et stats
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.userName,
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      '${entry.correctPredictions} correct${entry.correctPredictions > 1 ? 's' : ''}',
                      style: GoogleFonts.readexPro(
                        color: const Color(0xFF19DB8A),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '${entry.successRate.toStringAsFixed(1)}% réussite',
                      style: GoogleFonts.readexPro(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Gains
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${entry.totalEarnings.toStringAsFixed(0)} €',
                style: GoogleFonts.inter(
                  color: const Color(0xFF19DB8A),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${entry.totalPredictions} total',
                style: GoogleFonts.readexPro(
                  color: Colors.white70,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUserStatsTab() {
    if (!loggedIn) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.login,
                color: Color(0xFF19DB8A),
                size: 48,
              ),
              const SizedBox(height: 16),
              Text(
                'Connexion requise',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Connectez-vous pour voir vos statistiques',
                style: GoogleFonts.readexPro(
                  color: Colors.white70,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return FutureBuilder<UserLeaderboardStats>(
      future: LeaderboardService.instance.getUserStats(currentUserUid),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(
            child: Text(
              'Erreur: ${snapshot.error}',
              style: const TextStyle(color: Colors.red),
            ),
          );
        }

        if (!snapshot.hasData) {
          return const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF19DB8A)),
            ),
          );
        }

        final stats = snapshot.data!;
        return _buildUserStatsContent(stats);
      },
    );
  }

  Widget _buildUserStatsContent(UserLeaderboardStats stats) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Rang global
          if (stats.globalRank != null)
            _buildRankCard(stats)
                .animate(controller: _animationController)
                .fadeIn(duration: 600.ms)
                .slideY(begin: -0.3, end: 0),

          const SizedBox(height: 24),

          // Statistiques générales
          _buildGeneralStats(stats)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 200.ms)
              .slideY(begin: 0.3, end: 0),

          const SizedBox(height: 24),

          // Statistiques mensuelles
          _buildMonthlyStats(stats)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 400.ms)
              .slideY(begin: 0.3, end: 0),
        ],
      ),
    );
  }

  Widget _buildRankCard(UserLeaderboardStats stats) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF208050),
            const Color(0xFF19DB8A),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF19DB8A).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.emoji_events,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Votre rang global',
                      style: GoogleFonts.readexPro(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      '#${stats.globalRank}',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGeneralStats(UserLeaderboardStats stats) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF208050).withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Statistiques générales',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Total pronostics',
                  '${stats.totalPredictions}',
                  Icons.sports_soccer,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Corrects',
                  '${stats.correctPredictions}',
                  Icons.check_circle,
                  const Color(0xFF19DB8A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Taux de réussite',
                  '${stats.successRate.toStringAsFixed(1)}%',
                  Icons.percent,
                  Colors.orange,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Gains totaux',
                  '${stats.totalEarnings.toStringAsFixed(0)} €',
                  Icons.euro,
                  const Color(0xFF208050),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMonthlyStats(UserLeaderboardStats stats) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF208050).withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Ce mois-ci',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Pronostics',
                  '${stats.monthlyPredictions}',
                  Icons.calendar_month,
                  Colors.purple,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Corrects',
                  '${stats.monthlyCorrect}',
                  Icons.star,
                  Colors.yellow,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildStatCard(
            'Taux de réussite mensuel',
            '${stats.monthlySuccessRate.toStringAsFixed(1)}%',
            Icons.trending_up,
            const Color(0xFF19DB8A),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.readexPro(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTab() {
    if (!loggedIn) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.login,
                color: Color(0xFF19DB8A),
                size: 48,
              ),
              const SizedBox(height: 16),
              Text(
                'Connexion requise',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFF208050).withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Historique des pronostics',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                StreamBuilder<List<PronosticRecord>>(
                  stream: PronosticService.instance.getUserPredictions(),
                  builder: (context, snapshot) {
                    if (snapshot.hasError) {
                      return Text(
                        'Erreur: ${snapshot.error}',
                        style: const TextStyle(color: Colors.red),
                      );
                    }

                    if (!snapshot.hasData) {
                      return const Center(
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF19DB8A)),
                        ),
                      );
                    }

                    final predictions = snapshot.data!;
                    
                    if (predictions.isEmpty) {
                      return Container(
                        padding: const EdgeInsets.all(20),
                        child: Text(
                          'Aucun pronostic pour le moment',
                          style: GoogleFonts.readexPro(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      );
                    }

                    return Column(
                      children: predictions.map((prediction) => 
                          _buildPredictionHistoryItem(prediction)).toList(),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPredictionHistoryItem(PronosticRecord prediction) {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (prediction.status) {
      case 'won':
        statusColor = const Color(0xFF19DB8A);
        statusIcon = Icons.check_circle;
        statusText = 'Gagné';
        break;
      case 'lost':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        statusText = 'Perdu';
        break;
      case 'pending':
        statusColor = Colors.orange;
        statusIcon = Icons.schedule;
        statusText = 'En attente';
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.help;
        statusText = prediction.status;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A2A),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(statusIcon, color: statusColor, size: 16),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getPredictionLabel(prediction.prediction),
                    style: GoogleFonts.readexPro(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (prediction.submittedAt != null)
                    Text(
                      DateFormat('dd/MM/yyyy à HH:mm').format(prediction.submittedAt!),
                      style: GoogleFonts.readexPro(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                statusText,
                style: GoogleFonts.readexPro(
                  color: statusColor,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getPredictionLabel(String prediction) {
    switch (prediction) {
      case 'team_a':
        return 'Victoire équipe A';
      case 'draw':
        return 'Match nul';
      case 'team_b':
        return 'Victoire équipe B';
      default:
        return prediction;
    }
  }
}