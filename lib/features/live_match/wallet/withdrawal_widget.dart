import '/core/backend/backend.dart';
import '/core/auth/firebase_auth/auth_util.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_widgets.dart';
import '/core/flutter_flow/form_field_controller.dart';
import '/features/live_match/services/wallet_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import 'withdrawal_model.dart';
export 'withdrawal_model.dart';

class WithdrawalWidget extends StatefulWidget {
  const WithdrawalWidget({super.key});

  static String routeName = 'Withdrawal';
  static String routePath = 'withdrawal';

  @override
  State<WithdrawalWidget> createState() => _WithdrawalWidgetState();
}

class _WithdrawalWidgetState extends State<WithdrawalWidget>
    with TickerProviderStateMixin {
  late WithdrawalModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => WithdrawalModel());
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _animationController.forward();

    _model.amountTextController ??= TextEditingController();
    _model.amountFocusNode ??= FocusNode();

    _model.phoneTextController ??= TextEditingController();
    _model.phoneFocusNode ??= FocusNode();
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
          'Demande de retrait',
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
          return _buildWithdrawalForm(stats);
        },
      ),
    );
  }

  Widget _buildWithdrawalForm(WalletStats stats) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Solde disponible
          _buildBalanceInfo(stats)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms)
              .slideY(begin: -0.3, end: 0),

          const SizedBox(height: 24),

          // Formulaire de retrait
          _buildWithdrawalFormCard(stats)
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 200.ms)
              .slideY(begin: 0.3, end: 0),

          const SizedBox(height: 24),

          // Informations importantes
          _buildImportantInfo()
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 400.ms)
              .slideY(begin: 0.3, end: 0),

          const SizedBox(height: 24),

          // Historique des retraits
          _buildWithdrawalHistory()
              .animate(controller: _animationController)
              .fadeIn(duration: 600.ms, delay: 600.ms)
              .slideY(begin: 0.3, end: 0),
        ],
      ),
    );
  }

  Widget _buildBalanceInfo(WalletStats stats) {
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF19DB8A).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.account_balance_wallet,
                  color: Color(0xFF19DB8A),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Solde disponible pour retrait',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            '${stats.availableBalance.toStringAsFixed(2)} €',
            style: GoogleFonts.inter(
              color: const Color(0xFF19DB8A),
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (stats.pendingWithdrawals > 0) ...[
            const SizedBox(height: 8),
            Text(
              '${stats.pendingWithdrawals.toStringAsFixed(2)} € en attente de traitement',
              style: GoogleFonts.readexPro(
                color: Colors.orange,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildWithdrawalFormCard(WalletStats stats) {
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
            'Nouvelle demande de retrait',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),

          // Montant
          Text(
            'Montant à retirer',
            style: GoogleFonts.readexPro(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _model.amountTextController,
            focusNode: _model.amountFocusNode,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
            ],
            decoration: InputDecoration(
              hintText: 'Ex: 25.00',
              hintStyle: GoogleFonts.readexPro(
                color: Colors.white54,
                fontSize: 14,
              ),
              suffixText: '€',
              suffixStyle: GoogleFonts.readexPro(
                color: const Color(0xFF19DB8A),
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              filled: true,
              fillColor: const Color(0xFF2A2A2A),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: Color(0xFF19DB8A),
                  width: 2,
                ),
              ),
            ),
            style: GoogleFonts.readexPro(
              color: Colors.white,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Montant minimum: ${WalletService.minWithdrawalAmount.toStringAsFixed(2)}€ - Maximum: ${WalletService.maxWithdrawalAmount.toStringAsFixed(2)}€',
            style: GoogleFonts.readexPro(
              color: Colors.white70,
              fontSize: 12,
            ),
          ),

          const SizedBox(height: 20),

          // Méthode de retrait
          Text(
            'Méthode de retrait',
            style: GoogleFonts.readexPro(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _model.selectedMethod,
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF2A2A2A),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: Color(0xFF19DB8A),
                  width: 2,
                ),
              ),
            ),
            dropdownColor: const Color(0xFF2A2A2A),
            style: GoogleFonts.readexPro(
              color: Colors.white,
              fontSize: 14,
            ),
            items: const [
              DropdownMenuItem(
                value: 'mobile_money',
                child: Text('Mobile Money'),
              ),
              DropdownMenuItem(
                value: 'bank_transfer',
                child: Text('Virement bancaire'),
              ),
            ],
            onChanged: (value) {
              setState(() {
                _model.selectedMethod = value;
              });
            },
          ),

          const SizedBox(height: 20),

          // Numéro de téléphone
          Text(
            'Numéro de téléphone',
            style: GoogleFonts.readexPro(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _model.phoneTextController,
            focusNode: _model.phoneFocusNode,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9+\-\s\(\)]')),
            ],
            decoration: InputDecoration(
              hintText: '+33 6 12 34 56 78',
              hintStyle: GoogleFonts.readexPro(
                color: Colors.white54,
                fontSize: 14,
              ),
              prefixIcon: const Icon(
                Icons.phone,
                color: Color(0xFF19DB8A),
                size: 20,
              ),
              filled: true,
              fillColor: const Color(0xFF2A2A2A),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: Color(0xFF19DB8A),
                  width: 2,
                ),
              ),
            ),
            style: GoogleFonts.readexPro(
              color: Colors.white,
              fontSize: 16,
            ),
          ),

          const SizedBox(height: 24),

          // Bouton de soumission
          FFButtonWidget(
            onPressed: _model.isSubmitting ? null : () => _submitWithdrawal(stats),
            text: _model.isSubmitting ? 'Traitement...' : 'Demander le retrait',
            icon: _model.isSubmitting 
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Icons.send, size: 18),
            options: FFButtonOptions(
              width: double.infinity,
              height: 48,
              padding: const EdgeInsetsDirectional.fromSTEB(0, 0, 0, 0),
              iconPadding: const EdgeInsetsDirectional.fromSTEB(0, 0, 8, 0),
              color: const Color(0xFF208050),
              textStyle: GoogleFonts.readexPro(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              elevation: 0,
              borderRadius: BorderRadius.circular(12),
            ),
          ),

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
      ),
    );
  }

  Widget _buildImportantInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.blue.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.info, color: Colors.blue, size: 20),
              const SizedBox(width: 8),
              Text(
                'Informations importantes',
                style: GoogleFonts.inter(
                  color: Colors.blue,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '• Les retraits sont traités sous 24-48h ouvrées\n'
            '• Montant minimum: ${WalletService.minWithdrawalAmount.toStringAsFixed(2)}€\n'
            '• Montant maximum: ${WalletService.maxWithdrawalAmount.toStringAsFixed(2)}€ par demande\n'
            '• Une seule demande en attente autorisée\n'
            '• Vérifiez vos coordonnées avant validation',
            style: GoogleFonts.readexPro(
              color: Colors.white70,
              fontSize: 12,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWithdrawalHistory() {
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
            'Historique des retraits',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          StreamBuilder<List<WithdrawalRecord>>(
            stream: WalletService.instance.getWithdrawalHistory(),
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

              final withdrawals = snapshot.data!;
              
              if (withdrawals.isEmpty) {
                return Container(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Aucune demande de retrait pour le moment',
                    style: GoogleFonts.readexPro(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                );
              }

              return Column(
                children: withdrawals.map((withdrawal) => 
                    _buildWithdrawalItem(withdrawal)).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildWithdrawalItem(WithdrawalRecord withdrawal) {
    Color statusColor;
    String statusText;
    IconData statusIcon;

    switch (withdrawal.status) {
      case 'pending':
        statusColor = Colors.orange;
        statusText = 'En attente';
        statusIcon = Icons.schedule;
        break;
      case 'approved':
        statusColor = const Color(0xFF19DB8A);
        statusText = 'Approuvé';
        statusIcon = Icons.check_circle;
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusText = 'Rejeté';
        statusIcon = Icons.cancel;
        break;
      default:
        statusColor = Colors.grey;
        statusText = withdrawal.status;
        statusIcon = Icons.help;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A2A),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Row(
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
                        '${withdrawal.amount.toStringAsFixed(2)} € - ${withdrawal.method}',
                        style: GoogleFonts.readexPro(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        withdrawal.phoneNumber,
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
            if (withdrawal.rejectionReason.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info, color: Colors.red, size: 14),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Raison du rejet: ${withdrawal.rejectionReason}',
                        style: GoogleFonts.readexPro(
                          color: Colors.red,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _submitWithdrawal(WalletStats stats) async {
    // Validation des champs
    final amountText = _model.amountTextController.text.trim();
    final phoneText = _model.phoneTextController.text.trim();

    if (amountText.isEmpty) {
      setState(() {
        _model.errorMessage = 'Veuillez saisir un montant';
      });
      return;
    }

    final amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) {
      setState(() {
        _model.errorMessage = 'Montant invalide';
      });
      return;
    }

    if (_model.selectedMethod == null) {
      setState(() {
        _model.errorMessage = 'Veuillez sélectionner une méthode de retrait';
      });
      return;
    }

    if (phoneText.isEmpty) {
      setState(() {
        _model.errorMessage = 'Veuillez saisir un numéro de téléphone';
      });
      return;
    }

    setState(() {
      _model.isSubmitting = true;
      _model.errorMessage = null;
    });

    final result = await WalletService.instance.requestWithdrawal(
      amount: amount,
      method: _model.selectedMethod!,
      phoneNumber: phoneText,
    );

    setState(() {
      _model.isSubmitting = false;
      if (result.isError) {
        _model.errorMessage = result.error;
      }
    });

    if (result.isSuccess) {
      // Réinitialiser le formulaire
      _model.amountTextController?.clear();
      _model.phoneTextController?.clear();
      _model.selectedMethod = null;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Demande de retrait soumise avec succès !',
            style: GoogleFonts.readexPro(color: Colors.white),
          ),
          backgroundColor: const Color(0xFF208050),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}