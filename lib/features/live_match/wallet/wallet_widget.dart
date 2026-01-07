import '/core/backend/backend.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_widgets.dart';
import '/features/live_match/services/wallet_service.dart';
import '/features/live_match/wallet/withdrawal_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import 'wallet_model.dart';
export 'wallet_model.dart';

class WalletWidget extends StatefulWidget {
  const WalletWidget({super.key});

  static String routeName = 'Wallet';
  static String routePath = 'wallet';

  @override
  State<WalletWidget> createState() => _WalletWidgetState();
}

class _WalletWidgetState extends State<WalletWidget>
    with TickerProviderStateMixin {
  late WalletModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => WalletModel());
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
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF208050),
        title: Text(
          'Mon Portefeuille',
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
      body: FutureBuilder<WalletStats>(
        future: WalletService.instance.getWalletStats(),
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
          return _buildWalletContent(stats);
        },
      ),
    );
  }

  Widget _buildWalletContent(WalletStats stats) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Carte de solde principal
          _buildBalanceCard(stats)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms)
              .slideY(begin: -0.3, end: 0),

          const SizedBox(height: 24),

          // Statistiques du mois
          _buildMonthlyStats(stats)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 200.ms)
              .slideY(begin: 0.3, end: 0),

          const SizedBox(height: 24),

          // Actions rapides
          _buildQuickActions()
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 400.ms)
              .slideY(begin: 0.3, end: 0),

          const SizedBox(height: 24),

          // Historique des transactions
          _buildTransactionHistory()
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 600.ms)
              .slideY(begin: 0.3, end: 0),
        ],
      ),
    );
  }

  Widget _buildBalanceCard(WalletStats stats) {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Solde disponible',
                style: GoogleFonts.readexPro(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 14,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.account_balance_wallet,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${stats.availableBalance.toStringAsFixed(2)} €',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                '${stats.currentPoints} points',
                style: GoogleFonts.readexPro(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 14,
                ),
              ),
              if (stats.pendingWithdrawals > 0) ...[
                const SizedBox(width: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange, width: 1),
                  ),
                  child: Text(
                    '${stats.pendingWithdrawals.toStringAsFixed(2)}€ en attente',
                    style: GoogleFonts.readexPro(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMonthlyStats(WalletStats stats) {
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
            'Statistiques du mois',
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
                child: _buildStatItem(
                  'Gains',
                  '${stats.monthlyEarnings.toStringAsFixed(2)} €',
                  Icons.trending_up,
                  const Color(0xFF19DB8A),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatItem(
                  'Pronostics corrects',
                  '${stats.correctPredictions}',
                  Icons.check_circle,
                  Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  'Taux de réussite',
                  '${stats.successRate.toStringAsFixed(1)}%',
                  Icons.percent,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatItem(
                  'Solde total',
                  '${stats.currentBalance.toStringAsFixed(2)} €',
                  Icons.account_balance,
                  const Color(0xFF208050),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
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
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
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
          Text(
            'Actions rapides',
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
                child: FFButtonWidget(
                  onPressed: () => _navigateToWithdrawal(),
                  text: 'Retirer',
                  icon: const Icon(Icons.money_off, size: 18),
                  options: FFButtonOptions(
                    height: 48,
                    padding: const EdgeInsetsDirectional.fromSTEB(0, 0, 0, 0),
                    iconPadding: const EdgeInsetsDirectional.fromSTEB(0, 0, 8, 0),
                    color: const Color(0xFF208050),
                    textStyle: GoogleFonts.readexPro(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                    elevation: 0,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FFButtonWidget(
                  onPressed: () => _navigateToHistory(),
                  text: 'Historique',
                  icon: const Icon(Icons.history, size: 18),
                  options: FFButtonOptions(
                    height: 48,
                    padding: const EdgeInsetsDirectional.fromSTEB(0, 0, 0, 0),
                    iconPadding: const EdgeInsetsDirectional.fromSTEB(0, 0, 8, 0),
                    color: Colors.transparent,
                    textStyle: GoogleFonts.readexPro(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                    elevation: 0,
                    borderSide: const BorderSide(
                      color: Color(0xFF19DB8A),
                      width: 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionHistory() {
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Transactions récentes',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () => _navigateToHistory(),
                child: Text(
                  'Voir tout',
                  style: GoogleFonts.readexPro(
                    color: const Color(0xFF19DB8A),
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          StreamBuilder<List<TransactionRecord>>(
            stream: WalletService.instance.getTransactionHistory(),
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

              final transactions = snapshot.data!.take(5).toList();
              
              if (transactions.isEmpty) {
                return Container(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Aucune transaction pour le moment',
                    style: GoogleFonts.readexPro(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                );
              }

              return Column(
                children: transactions.map((transaction) => 
                    _buildTransactionItem(transaction)).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(TransactionRecord transaction) {
    IconData icon;
    Color color;
    String prefix;

    switch (transaction.type) {
      case 'credit':
        icon = Icons.add_circle;
        color = const Color(0xFF19DB8A);
        prefix = '+';
        break;
      case 'debit':
        icon = Icons.remove_circle;
        color = Colors.red;
        prefix = '-';
        break;
      default:
        icon = Icons.circle;
        color = Colors.grey;
        prefix = '';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: GoogleFonts.readexPro(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (transaction.rewardType.isNotEmpty)
                  Text(
                    _getRewardTypeLabel(transaction.rewardType),
                    style: GoogleFonts.readexPro(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$prefix${transaction.amount.toStringAsFixed(2)} €',
                style: GoogleFonts.inter(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (transaction.createdAt != null)
                Text(
                  DateFormat('dd/MM HH:mm').format(transaction.createdAt!),
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

  String _getRewardTypeLabel(String rewardType) {
    switch (rewardType) {
      case 'correct_prediction':
        return 'Pronostic correct';
      case 'participation':
        return 'Participation';
      case 'bonus':
        return 'Bonus';
      default:
        return rewardType;
    }
  }

  void _navigateToWithdrawal() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const WithdrawalWidget(),
      ),
    );
  }

  void _navigateToHistory() {
    // TODO: Implémenter la page d'historique détaillé
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Page d\'historique à implémenter',
          style: GoogleFonts.readexPro(color: Colors.white),
        ),
        backgroundColor: const Color(0xFF208050),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}