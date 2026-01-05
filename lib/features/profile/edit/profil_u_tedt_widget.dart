import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '/core/auth/firebase_auth/auth_util.dart';
import '/core/backend/backend.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_widgets.dart';
import '/index.dart';
import 'profil_u_tedt_model.dart';
export 'profil_u_tedt_model.dart';

class ProfilUTedtWidget extends StatefulWidget {
  const ProfilUTedtWidget({super.key});

  static String routeName = 'profilUTedt';
  static String routePath = 'profilUTedt';

  @override
  State<ProfilUTedtWidget> createState() => _ProfilUTedtWidgetState();
}

class _ProfilUTedtWidgetState extends State<ProfilUTedtWidget> {
  late ProfilUTedtModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => ProfilUTedtModel());
    _model.textFieldnomTextController ??= TextEditingController(text: currentUserDisplayName);
    _model.textFieldnomFocusNode ??= FocusNode();
    _model.textFieldpaysTextController ??= TextEditingController();
    _model.textFieldpaysFocusNode ??= FocusNode();
  }

  @override
  void dispose() {
    _model.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: const Color(0xFF0A0A0A),
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF0A0A0A), Color(0xFF1A1A2E), Color(0xFF0A0A0A)],
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: () => context.safePop(),
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                        ),
                      ),
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [Color(0xFF208050), Color(0xFF19DB8A)],
                        ).createShader(bounds),
                        child: Text(
                          'Modifier Profil',
                          style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 44),
                    ],
                  ),
                ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.2),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Avatar
                        Stack(
                          children: [
                            Container(
                              width: 120,
                              height: 120,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]),
                                boxShadow: [BoxShadow(color: const Color(0xFF19DB8A).withOpacity(0.4), blurRadius: 30)],
                              ),
                              padding: const EdgeInsets.all(3),
                              child: Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: const Color(0xFF0A0A0A),
                                  image: DecorationImage(
                                    image: currentUserPhoto.isNotEmpty
                                        ? NetworkImage(currentUserPhoto)
                                        : const AssetImage('assets/images/Sans_titre-4.png') as ImageProvider,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: const Color(0xFF0A0A0A), width: 3),
                                ),
                                child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                              ),
                            ),
                          ],
                        ).animate().fadeIn(delay: 200.ms, duration: 500.ms).scale(begin: const Offset(0.8, 0.8)),

                        const SizedBox(height: 40),

                        // Form fields
                        _buildInputField(
                          controller: _model.textFieldnomTextController!,
                          focusNode: _model.textFieldnomFocusNode!,
                          label: 'Nom complet',
                          icon: Icons.person_outline,
                        ).animate().fadeIn(delay: 300.ms, duration: 400.ms),

                        const SizedBox(height: 20),

                        _buildInputField(
                          controller: _model.textFieldpaysTextController!,
                          focusNode: _model.textFieldpaysFocusNode!,
                          label: 'Pays',
                          icon: Icons.flag_outlined,
                          maxLines: 1,
                        ).animate().fadeIn(delay: 400.ms, duration: 400.ms),

                        const SizedBox(height: 40),

                        // Save button
                        Container(
                          width: double.infinity,
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [BoxShadow(color: const Color(0xFF19DB8A).withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 8))],
                          ),
                          child: FFButtonWidget(
                            onPressed: () async {
                              await currentUserReference!.update(createUserRecordData(
                                displayName: _model.textFieldnomTextController!.text,
                              ));
                              context.safePop();
                            },
                            text: 'Enregistrer',
                            icon: const Icon(Icons.check, color: Colors.white, size: 20),
                            options: FFButtonOptions(
                              height: 56,
                              color: Colors.transparent,
                              textStyle: GoogleFonts.readexPro(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16),
                              elevation: 0,
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ).animate().fadeIn(delay: 500.ms, duration: 400.ms).slideY(begin: 0.2),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String label,
    required IconData icon,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.9), fontWeight: FontWeight.w500, fontSize: 14)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Row(
            crossAxisAlignment: maxLines > 1 ? CrossAxisAlignment.start : CrossAxisAlignment.center,
            children: [
              Container(
                width: 56,
                height: maxLines > 1 ? 80 : 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [const Color(0xFF208050).withOpacity(0.3), const Color(0xFF19DB8A).withOpacity(0.3)]),
                  borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
                ),
                child: Icon(icon, color: const Color(0xFF19DB8A), size: 22),
              ),
              Expanded(
                child: TextFormField(
                  controller: controller,
                  focusNode: focusNode,
                  maxLines: maxLines,
                  style: GoogleFonts.readexPro(color: Colors.white, fontSize: 16),
                  decoration: InputDecoration(
                    hintText: 'Entrez votre $label',
                    hintStyle: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.4)),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
