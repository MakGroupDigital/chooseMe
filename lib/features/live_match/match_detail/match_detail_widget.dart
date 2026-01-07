import '/core/backend/backend.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_widgets.dart';
import '/features/live_match/services/pronostic_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import 'match_detail_model.dart';
export 'match_detail_model.dart';

class MatchDetailWidget extends StatefulWidget {
  const MatchDetailWidget({
    super.key,
    this.matchId,
    this.showPrediction,
  });

  final String? matchId;
  final String? showPrediction;

  static String routeName = 'MatchDetail';
  static String routePath = 'match-detail/:matchId';

  @override
  State<MatchDetailWidget> createState() => _MatchDetailWidgetState();
}

class _MatchDetailWidgetState extends State<MatchDetailWidget>
    with TickerProviderStateMixin {
  late MatchDetailModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => MatchDetailModel());
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _model.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.matchId == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0A0A),
        body: const Center(
          child: Text(
            'Match ID manquant',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    return Scaffold(
      key: scaffoldKey,
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF208050),
        title: Text(
          'Détail du Match',
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
      ),
      body: StreamBuilder<MatchRecord>(
        stream: MatchRecord.getDocument(
          FirebaseFirestore.instance.collection('matches').doc(widget.matchId),
        ),
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

          final match = snapshot.data!;
          
          // Vérifier que les données essentielles sont présentes
          if (match.teamAName.isEmpty || match.teamBName.isEmpty) {
            return const Center(
              child: Text(
                'Données du match non disponibles',
                style: TextStyle(color: Colors.white),
              ),
            );
          }
          
          return _buildMatchDetail(match);
        },
      ),
    );
  }

  Widget _buildMatchDetail(MatchRecord match) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // En-tête du match
          _buildMatchHeader(match)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms)
              .slideY(begin: -0.3, end: 0),

          const SizedBox(height: 24),

          // Informations du match
          _buildMatchInfo(match)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 200.ms)
              .slideY(begin: 0.3, end: 0),

          const SizedBox(height: 24),

          // Section pronostic
          if (match.predictionsEnabled && match.status == 'scheduled')
            _buildPredictionSection(match)
                .animate(controller: _animationController)
                .fadeIn(duration: 600.ms, delay: 400.ms)
                .slideY(begin: 0.3, end: 0),

          const SizedBox(height: 24),

          // Statistiques des pronostics
          _buildPredictionStats(match)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 600.ms)
              .slideY(begin: 0.3, end: 0),
        ],
      ),
    );
  }

  Widget _buildMatchHeader(MatchRecord match) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF208050).withOpacity(0.2),
            const Color(0xFF19DB8A).withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF208050).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          // Compétition et statut
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF208050),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  match.competition,
                  style: GoogleFonts.readexPro(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              _buildStatusBadge(match.status),
            ],
          ),

          const SizedBox(height: 20),

          // Équipes et score
          Row(
            children: [
              // Équipe A
              Expanded(
                child: Column(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF19DB8A).withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: match.teamALogo.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(30),
                              child: Image.network(
                                match.teamALogo,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(Icons.sports_soccer, size: 30),
                              ),
                            )
                          : const Icon(Icons.sports_soccer, size: 30),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      match.teamAName,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              // Score ou heure
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0A0A0A).withOpacity(0.5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF19DB8A).withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: match.status == 'live' || match.status == 'finished'
                    ? Text(
                        '${match.scoreA} - ${match.scoreB}',
                        style: GoogleFonts.inter(
                          color: const Color(0xFF19DB8A),
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : Column(
                        children: [
                          Text(
                            DateFormat('HH:mm').format(match.startTime!),
                            style: GoogleFonts.inter(
                              color: const Color(0xFF19DB8A),
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            DateFormat('dd/MM').format(match.startTime!),
                            style: GoogleFonts.readexPro(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
              ),

              // Équipe B
              Expanded(
                child: Column(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF19DB8A).withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: match.teamBLogo.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(30),
                              child: Image.network(
                                match.teamBLogo,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(Icons.sports_soccer, size: 30),
                              ),
                            )
                          : const Icon(Icons.sports_soccer, size: 30),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      match.teamBName,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Minute de jeu pour les matchs en cours
          if (match.status == 'live' && match.matchMinute > 0)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${match.matchMinute}\'',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String text;
    
    switch (status) {
      case 'live':
        color = Colors.red;
        text = 'EN DIRECT';
        break;
      case 'finished':
        color = Colors.grey;
        text = 'TERMINÉ';
        break;
      case 'scheduled':
        color = const Color(0xFF19DB8A);
        text = 'PROGRAMMÉ';
        break;
      default:
        color = Colors.orange;
        text = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (status == 'live')
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ).animate(onPlay: (controller) => controller.repeat())
                .fadeIn(duration: 500.ms)
                .then()
                .fadeOut(duration: 500.ms),
          if (status == 'live') const SizedBox(width: 4),
          Text(
            text,
            style: GoogleFonts.readexPro(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchInfo(MatchRecord match) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF208050).withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Informations du match',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          _buildInfoRow('Compétition', match.competition),
          _buildInfoRow('Date', DateFormat('dd/MM/yyyy à HH:mm').format(match.startTime!)),
          _buildInfoRow('Statut', _getStatusText(match.status)),
          if (match.rewardAmount > 0)
            _buildInfoRow('Récompense', '${match.rewardAmount.toStringAsFixed(0)} points'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.readexPro(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.readexPro(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'live':
        return 'En direct';
      case 'finished':
        return 'Terminé';
      case 'scheduled':
        return 'Programmé';
      default:
        return status;
    }
  }

  Widget _buildPredictionSection(MatchRecord match) {
    return StreamBuilder<PronosticRecord?>(
      stream: PronosticService.instance.getUserPrediction(match.reference.id)
          .asStream(),
      builder: (context, snapshot) {
        final userPrediction = snapshot.data;
        final hasPrediction = userPrediction != null;

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                const Color(0xFF19DB8A).withOpacity(0.1),
                const Color(0xFF208050).withOpacity(0.05),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: const Color(0xFF19DB8A).withOpacity(0.3),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF19DB8A).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.sports_soccer,
                      color: Color(0xFF19DB8A),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    hasPrediction ? 'Votre pronostic' : 'Faire un pronostic',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              if (hasPrediction)
                _buildExistingPrediction(userPrediction, match)
              else
                _buildPredictionForm(match),
            ],
          ),
        );
      },
    );
  }

  Widget _buildExistingPrediction(PronosticRecord prediction, MatchRecord match) {
    String predictionText;
    switch (prediction.prediction) {
      case 'team_a':
        predictionText = 'Victoire ${match.teamAName}';
        break;
      case 'draw':
        predictionText = 'Match nul';
        break;
      case 'team_b':
        predictionText = 'Victoire ${match.teamBName}';
        break;
      default:
        predictionText = prediction.prediction;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF208050).withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF208050),
          width: 2,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(
                Icons.check_circle,
                color: Color(0xFF19DB8A),
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  predictionText,
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Soumis le ${DateFormat('dd/MM à HH:mm').format(prediction.submittedAt!)}',
                style: GoogleFonts.readexPro(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(prediction.status),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _getStatusLabel(prediction.status),
                  style: GoogleFonts.readexPro(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPredictionForm(MatchRecord match) {
    return Column(
      children: [
        Text(
          'Qui va gagner ce match ?',
          style: GoogleFonts.readexPro(
            color: Colors.white70,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 16),
        
        // Options de pronostic
        Column(
          children: [
            _buildPredictionOption(
              'team_a',
              'Victoire ${match.teamAName}',
              Icons.trending_up,
            ),
            const SizedBox(height: 8),
            _buildPredictionOption(
              'draw',
              'Match nul',
              Icons.remove,
            ),
            const SizedBox(height: 8),
            _buildPredictionOption(
              'team_b',
              'Victoire ${match.teamBName}',
              Icons.trending_up,
            ),
          ],
        ),

        if (_model.isSubmitting) ...[
          const SizedBox(height: 16),
          const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF19DB8A)),
          ),
        ],

        if (_model.errorMessage != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.red, width: 1),
            ),
            child: Row(
              children: [
                const Icon(Icons.error, color: Colors.red, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _model.errorMessage!,
                    style: GoogleFonts.readexPro(
                      color: Colors.red,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPredictionOption(String value, String label, IconData icon) {
    return FFButtonWidget(
      onPressed: _model.isSubmitting ? null : () => _submitPrediction(value),
      text: label,
      icon: Icon(icon, size: 18),
      options: FFButtonOptions(
        width: double.infinity,
        height: 48,
        padding: const EdgeInsetsDirectional.fromSTEB(0, 0, 0, 0),
        iconPadding: const EdgeInsetsDirectional.fromSTEB(0, 0, 8, 0),
        color: Colors.transparent,
        textStyle: GoogleFonts.readexPro(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        elevation: 0,
        borderSide: const BorderSide(
          color: Color(0xFF19DB8A),
          width: 1,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }

  Widget _buildPredictionStats(MatchRecord match) {
    return FutureBuilder<PredictionStats>(
      future: PronosticService.instance.getMatchPredictionStats(match.reference.id),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const SizedBox.shrink();
        }

        final stats = snapshot.data!;
        if (stats.totalPredictions == 0) {
          return const SizedBox.shrink();
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFF208050).withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Statistiques des pronostics',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                '${stats.totalPredictions} pronostic${stats.totalPredictions > 1 ? 's' : ''}',
                style: GoogleFonts.readexPro(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 12),
              _buildStatBar('${match.teamAName}', stats.teamAPercentage, stats.teamACount),
              const SizedBox(height: 8),
              _buildStatBar('Match nul', stats.drawPercentage, stats.drawCount),
              const SizedBox(height: 8),
              _buildStatBar('${match.teamBName}', stats.teamBPercentage, stats.teamBCount),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatBar(String label, double percentage, int count) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.readexPro(
                color: Colors.white,
                fontSize: 12,
              ),
            ),
            Text(
              '$count (${percentage.toStringAsFixed(1)}%)',
              style: GoogleFonts.readexPro(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Container(
          height: 4,
          decoration: BoxDecoration(
            color: const Color(0xFF2A2A2A),
            borderRadius: BorderRadius.circular(2),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: percentage / 100,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF19DB8A),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _submitPrediction(String prediction) async {
    setState(() {
      _model.isSubmitting = true;
      _model.errorMessage = null;
    });

    final result = await PronosticService.instance.submitPrediction(
      matchId: widget.matchId!,
      prediction: prediction,
    );

    setState(() {
      _model.isSubmitting = false;
      if (result.isError) {
        _model.errorMessage = result.error;
      }
    });

    if (result.isSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Pronostic enregistré avec succès !',
            style: GoogleFonts.readexPro(color: Colors.white),
          ),
          backgroundColor: const Color(0xFF208050),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'won':
        return const Color(0xFF19DB8A);
      case 'lost':
        return Colors.red;
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'won':
        return 'GAGNÉ';
      case 'lost':
        return 'PERDU';
      case 'pending':
        return 'EN ATTENTE';
      default:
        return status.toUpperCase();
    }
  }
}