import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_icon_button.dart';
import '/features/live_match/services/football_api_service.dart';
import '/features/live_match/match_detail/match_detail_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'matches_list_model.dart';
export 'matches_list_model.dart';

class MatchesListWidget extends StatefulWidget {
  const MatchesListWidget({super.key});

  static String routeName = 'MatchesList';
  static String routePath = 'live-match';

  @override
  State<MatchesListWidget> createState() => _MatchesListWidgetState();
}

class _MatchesListWidgetState extends State<MatchesListWidget> 
    with TickerProviderStateMixin {
  late MatchesListModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  // Couleurs ChooseMe
  final List<Color> _primaryGradient = const [Color(0xFF208050), Color(0xFF19DB8A)];
  final Color _darkBackground = const Color(0xFF0A0A0A);

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => MatchesListModel());
    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: _darkBackground,
        body: SafeArea(
          child: Column(
            children: [
              _buildHeader(theme),
              Expanded(
                child: _buildContent(theme),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(FlutterFlowTheme theme) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            _primaryGradient[0].withOpacity(0.1),
            _primaryGradient[1].withOpacity(0.05),
          ],
        ),
        border: Border(
          bottom: BorderSide(
            color: _primaryGradient[1].withOpacity(0.2),
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Bouton retour
              FlutterFlowIconButton(
                borderColor: Colors.transparent,
                borderRadius: 12,
                buttonSize: 44,
                fillColor: Colors.white.withOpacity(0.1),
                icon: Icon(
                  Icons.arrow_back_rounded,
                  color: Colors.white,
                  size: 24,
                ),
                onPressed: () => context.pop(),
              ).animate().fadeIn(duration: 300.ms).slideX(begin: -0.2),
              const SizedBox(width: 16),
              // Titre
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFFFF4757),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF4757).withOpacity(0.5),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ).animate(onPlay: (c) => c.repeat())
                          .scale(
                            begin: const Offset(1, 1),
                            end: const Offset(1.2, 1.2),
                            duration: 1000.ms,
                          ),
                        const SizedBox(width: 12),
                        Text(
                          'Matchs en Direct',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Faites vos pronostics et gagnez des récompenses',
                      style: GoogleFonts.readexPro(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ).animate(delay: 100.ms).fadeIn(duration: 400.ms),
              // Bouton refresh
              FlutterFlowIconButton(
                borderColor: Colors.transparent,
                borderRadius: 12,
                buttonSize: 44,
                fillColor: _primaryGradient[0].withOpacity(0.2),
                icon: Icon(
                  Icons.refresh_rounded,
                  color: _primaryGradient[1],
                  size: 24,
                ),
                onPressed: () async {
                  await _model.refreshMatches();
                  safeSetState(() {});
                },
              ).animate(delay: 200.ms).fadeIn(duration: 300.ms).slideX(begin: 0.2),
            ],
          ),
          const SizedBox(height: 16),
          // Indicateur de statut
          _buildStatusIndicator(),
        ],
      ),
    );
  }

  Widget _buildStatusIndicator() {
    if (_model.isLoading) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(_primaryGradient[1]),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Chargement...',
              style: GoogleFonts.readexPro(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      );
    }

    if (_model.isFromCache) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFFA502).withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFFFA502).withOpacity(0.5),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off_rounded,
              color: const Color(0xFFFFA502),
              size: 16,
            ),
            const SizedBox(width: 8),
            Text(
              'Données en cache',
              style: GoogleFonts.readexPro(
                color: const Color(0xFFFFA502),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: _primaryGradient[1].withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _primaryGradient[1].withOpacity(0.5),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.check_circle_rounded,
            color: _primaryGradient[1],
            size: 16,
          ),
          const SizedBox(width: 8),
          Text(
            'Données à jour',
            style: GoogleFonts.readexPro(
              color: _primaryGradient[1],
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(FlutterFlowTheme theme) {
    if (_model.isLoading) {
      return _buildLoadingState();
    }

    if (_model.matches.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      key: _model.refreshIndicatorKey,
      onRefresh: () async {
        await _model.refreshMatches();
        safeSetState(() {});
      },
      color: _primaryGradient[1],
      backgroundColor: _darkBackground,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: _model.matches.length,
        itemBuilder: (context, index) {
          final match = _model.matches[index];
          return _buildMatchCard(match, index);
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(colors: _primaryGradient),
            ),
            child: const Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 3,
              ),
            ),
          ).animate(onPlay: (c) => c.repeat())
            .rotate(duration: 1500.ms),
          const SizedBox(height: 24),
          Text(
            'Chargement des matchs...',
            style: GoogleFonts.readexPro(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _primaryGradient[0].withOpacity(0.2),
            ),
            child: Icon(
              Icons.sports_soccer,
              size: 50,
              color: _primaryGradient[1],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Aucun match aujourd\'hui',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Revenez plus tard pour voir les prochains matchs',
            style: GoogleFonts.readexPro(
              color: Colors.white60,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () async {
              await _model.refreshMatches();
              safeSetState(() {});
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryGradient[0],
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
            ),
            child: Text(
              'Actualiser',
              style: GoogleFonts.readexPro(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchCard(MatchData match, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _handleMatchTap(match),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Header avec compétition et statut
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        match.competition,
                        style: GoogleFonts.readexPro(
                          color: _primaryGradient[1],
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    _buildStatusBadge(match),
                  ],
                ),
                const SizedBox(height: 16),
                // Équipes et score
                Row(
                  children: [
                    // Équipe domicile
                    Expanded(
                      child: _buildTeam(
                        name: match.homeTeamName,
                        logo: match.homeTeamLogo,
                        score: match.homeScore,
                        isHome: true,
                      ),
                    ),
                    // Score central
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _buildCenterScore(match),
                    ),
                    // Équipe extérieure
                    Expanded(
                      child: _buildTeam(
                        name: match.awayTeamName,
                        logo: match.awayTeamLogo,
                        score: match.awayScore,
                        isHome: false,
                      ),
                    ),
                  ],
                ),
                // Actions
                if (_model.canMakePrediction(match)) ...[
                  const SizedBox(height: 16),
                  _buildPredictionButton(match),
                ],
              ],
            ),
          ),
        ),
      ),
    ).animate(delay: (index * 100).ms)
      .fadeIn(duration: 400.ms)
      .slideY(begin: 0.2, end: 0);
  }

  Widget _buildStatusBadge(MatchData match) {
    final status = _model.getFormattedStatus(match);
    final color = _model.getStatusColor(match);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5), width: 1),
      ),
      child: Text(
        status,
        style: GoogleFonts.readexPro(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildTeam({
    required String name,
    required String logo,
    required int score,
    required bool isHome,
  }) {
    return Column(
      children: [
        // Logo
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withOpacity(0.1),
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: ClipOval(
            child: logo.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: logo,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: Colors.white.withOpacity(0.1),
                      child: Icon(
                        Icons.sports_soccer,
                        color: Colors.white.withOpacity(0.5),
                        size: 30,
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: Colors.white.withOpacity(0.1),
                      child: Icon(
                        Icons.sports_soccer,
                        color: Colors.white.withOpacity(0.5),
                        size: 30,
                      ),
                    ),
                  )
                : Icon(
                    Icons.sports_soccer,
                    color: Colors.white.withOpacity(0.5),
                    size: 30,
                  ),
          ),
        ),
        const SizedBox(height: 12),
        // Nom de l'équipe
        Text(
          name,
          style: GoogleFonts.readexPro(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildCenterScore(MatchData match) {
    if (match.status == 'scheduled') {
      return Column(
        children: [
          Text(
            'VS',
            style: GoogleFonts.inter(
              color: Colors.white.withOpacity(0.6),
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            DateFormat('HH:mm').format(match.startTime),
            style: GoogleFonts.readexPro(
              color: _primaryGradient[1],
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (_model.getTimeUntilStart(match).isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              _model.getTimeUntilStart(match),
              style: GoogleFonts.readexPro(
                color: Colors.white.withOpacity(0.6),
                fontSize: 11,
              ),
            ),
          ],
        ],
      );
    }

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${match.homeScore}',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 16),
            Text(
              '-',
              style: GoogleFonts.inter(
                color: Colors.white.withOpacity(0.6),
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 16),
            Text(
              '${match.awayScore}',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        if (match.status == 'live' && match.minute != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFF4757).withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              "${match.minute}'",
              style: GoogleFonts.readexPro(
                color: const Color(0xFFFF4757),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPredictionButton(MatchData match) {
    return Container(
      width: double.infinity,
      height: 48,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: _primaryGradient),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: _primaryGradient[0].withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: () => _handlePredictionTap(match),
          child: Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.sports_esports_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Faire un pronostic',
                  style: GoogleFonts.readexPro(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleMatchTap(MatchData match) {
    // Navigation vers la page de détail du match
    context.pushNamed(
      MatchDetailWidget.routeName,
      pathParameters: {'matchId': match.id},
    );
  }

  void _handlePredictionTap(MatchData match) {
    // Navigation directe vers la page de pronostic
    context.pushNamed(
      MatchDetailWidget.routeName,
      pathParameters: {'matchId': match.id},
      queryParameters: {'showPrediction': 'true'},
    );
  }
}