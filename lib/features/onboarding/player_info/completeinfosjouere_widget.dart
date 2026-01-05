import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_widgets.dart';
import '/index.dart';
import 'completeinfosjouere_model.dart';
export 'completeinfosjouere_model.dart';

class CompleteinfosjouereWidget extends StatefulWidget {
  const CompleteinfosjouereWidget({super.key});

  static String routeName = 'completeinfosjouere';
  static String routePath = 'completeinfosjouere';

  @override
  State<CompleteinfosjouereWidget> createState() => _CompleteinfosjouereWidgetState();
}

class _CompleteinfosjouereWidgetState extends State<CompleteinfosjouereWidget> {
  late CompleteinfosjouereModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();
  String _selectedSport = 'Football';
  String _selectedPosition = 'Attaquant';

  final List<String> _sports = ['Football', 'Basketball', 'Tennis', 'Cyclisme', 'Natation', 'Athlétisme'];
  final List<String> _positions = ['Attaquant', 'Milieu', 'Défenseur', 'Gardien'];

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CompleteinfosjouereModel());
    _model.textController1 ??= TextEditingController();
    _model.textFieldFocusNode1 ??= FocusNode();
    _model.textController2 ??= TextEditingController();
    _model.textFieldFocusNode2 ??= FocusNode();
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
                    children: [
                      GestureDetector(
                        onTap: () => context.safePop(),
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ShaderMask(
                          shaderCallback: (bounds) => const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]).createShader(bounds),
                          child: Text('Informations Sportives', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 400.ms),

                // Progress indicator
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    children: List.generate(3, (index) => Expanded(
                      child: Container(
                        height: 4,
                        margin: EdgeInsets.only(right: index < 2 ? 8 : 0),
                        decoration: BoxDecoration(
                          gradient: index <= 1 ? const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]) : null,
                          color: index > 1 ? Colors.white.withOpacity(0.2) : null,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    )),
                  ),
                ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Quel est votre sport ?', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 18)),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _sports.map((sport) => _buildChip(sport, _selectedSport == sport, () => setState(() => _selectedSport = sport))).toList(),
                        ).animate().fadeIn(delay: 300.ms, duration: 400.ms),

                        const SizedBox(height: 32),

                        Text('Votre position', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 18)),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _positions.map((pos) => _buildChip(pos, _selectedPosition == pos, () => setState(() => _selectedPosition = pos))).toList(),
                        ).animate().fadeIn(delay: 400.ms, duration: 400.ms),

                        const SizedBox(height: 32),

                        Row(
                          children: [
                            Expanded(child: _buildInputField(_model.textController1!, _model.textFieldFocusNode1!, 'Taille (cm)', Icons.height)),
                            const SizedBox(width: 16),
                            Expanded(child: _buildInputField(_model.textController2!, _model.textFieldFocusNode2!, 'Poids (kg)', Icons.fitness_center)),
                          ],
                        ).animate().fadeIn(delay: 500.ms, duration: 400.ms),

                        const SizedBox(height: 40),

                        Container(
                          width: double.infinity,
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [BoxShadow(color: const Color(0xFF19DB8A).withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 8))],
                          ),
                          child: FFButtonWidget(
                            onPressed: () => context.pushNamed(RedirectionWidget.routeName),
                            text: 'Continuer',
                            icon: const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                            options: FFButtonOptions(
                              height: 56,
                              color: Colors.transparent,
                              textStyle: GoogleFonts.readexPro(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16),
                              elevation: 0,
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ).animate().fadeIn(delay: 600.ms, duration: 400.ms),
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

  Widget _buildChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          gradient: isSelected ? const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]) : null,
          color: isSelected ? null : Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(25),
          border: Border.all(color: isSelected ? Colors.transparent : Colors.white.withOpacity(0.1)),
        ),
        child: Text(label, style: GoogleFonts.readexPro(color: Colors.white, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400)),
      ),
    );
  }

  Widget _buildInputField(TextEditingController controller, FocusNode focusNode, String label, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.9), fontSize: 14)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            keyboardType: TextInputType.number,
            style: GoogleFonts.readexPro(color: Colors.white),
            decoration: InputDecoration(
              prefixIcon: Icon(icon, color: const Color(0xFF19DB8A).withOpacity(0.7)),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ),
      ],
    );
  }
}
