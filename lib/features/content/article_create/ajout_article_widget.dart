import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_widgets.dart';
import '/index.dart';
import 'ajout_article_model.dart';
export 'ajout_article_model.dart';

class AjoutArticleWidget extends StatefulWidget {
  const AjoutArticleWidget({super.key});

  static String routeName = 'ajoutArticle';
  static String routePath = 'ajoutArticle';

  @override
  State<AjoutArticleWidget> createState() => _AjoutArticleWidgetState();
}

class _AjoutArticleWidgetState extends State<AjoutArticleWidget> {
  late AjoutArticleModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => AjoutArticleModel());
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: () => context.safePop(),
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.close, color: Colors.white, size: 22),
                        ),
                      ),
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(colors: [Colors.purple, Colors.purpleAccent]).createShader(bounds),
                        child: Text('Nouvel Article', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Colors.purple, Colors.purpleAccent]),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text('Publier', style: GoogleFonts.readexPro(color: Colors.white, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 400.ms),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Image upload
                        Container(
                          width: double.infinity,
                          height: 200,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.purple.withOpacity(0.3), style: BorderStyle.solid),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_photo_alternate, color: Colors.purple.withOpacity(0.5), size: 48),
                              const SizedBox(height: 12),
                              Text('Ajouter une image de couverture', style: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.5))),
                            ],
                          ),
                        ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

                        const SizedBox(height: 24),

                        // Title field
                        _buildInputField(
                          controller: _model.textController1!,
                          focusNode: _model.textFieldFocusNode1!,
                          label: 'Titre de l\'article',
                          hint: 'Un titre accrocheur...',
                          icon: Icons.title,
                        ).animate().fadeIn(delay: 300.ms, duration: 400.ms),

                        const SizedBox(height: 20),

                        // Content field
                        _buildInputField(
                          controller: _model.textController2!,
                          focusNode: _model.textFieldFocusNode2!,
                          label: 'Contenu',
                          hint: 'Rédigez votre article...',
                          icon: Icons.article,
                          maxLines: 10,
                        ).animate().fadeIn(delay: 400.ms, duration: 400.ms),
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
    required String hint,
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
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            maxLines: maxLines,
            style: GoogleFonts.readexPro(color: Colors.white, fontSize: 16),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.4)),
              prefixIcon: maxLines == 1 ? Icon(icon, color: Colors.purple.withOpacity(0.7)) : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
        ),
      ],
    );
  }
}
