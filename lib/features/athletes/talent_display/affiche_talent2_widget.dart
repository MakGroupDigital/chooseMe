import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '/core/backend/backend.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_widgets.dart';
import '/index.dart';
import 'affiche_talent2_model.dart';
export 'affiche_talent2_model.dart';

class AfficheTalent2Widget extends StatefulWidget {
  const AfficheTalent2Widget({super.key, this.refTalent});

  final InfosTalentRecord? refTalent;
  static String routeName = 'afficheTalent2';
  static String routePath = 'afficheTalent2';

  @override
  State<AfficheTalent2Widget> createState() => _AfficheTalent2WidgetState();
}

class _AfficheTalent2WidgetState extends State<AfficheTalent2Widget> {
  late AfficheTalent2Model _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => AfficheTalent2Model());
  }

  @override
  void dispose() {
    _model.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final talent = widget.refTalent;
    if (talent == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0A0A),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.person_off, size: 64, color: Colors.white.withOpacity(0.5)),
              const SizedBox(height: 16),
              Text('Talent non trouvé', style: GoogleFonts.inter(color: Colors.white, fontSize: 18)),
            ],
          ),
        ),
      );
    }
    return _buildContent(talent);
  }

  Widget _buildContent(InfosTalentRecord talent) {
    final theme = FlutterFlowTheme.of(context);
    
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: const Color(0xFF0A0A0A),
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF208050), Color(0xFF0A0A0A), Color(0xFF0A0A0A)],
                stops: [0.0, 0.4, 1.0],
              ),
            ),
          ),
          
          SafeArea(
            child: CustomScrollView(
              slivers: [
                // App Bar
                SliverToBoxAdapter(child: _buildAppBar(theme)),
                
                // Profile Header
                SliverToBoxAdapter(child: _buildProfileHeader(talent, theme)),
                
                // Stats Cards
                SliverToBoxAdapter(child: _buildStatsSection(talent, theme)),
                
                // Info Cards
                SliverToBoxAdapter(child: _buildInfoSection(talent, theme)),
                
                // Palmares
                if (talent.palmares.isNotEmpty)
                  SliverToBoxAdapter(child: _buildPalmaresSection(talent, theme)),
                
                // Contact Section
                SliverToBoxAdapter(child: _buildContactSection(talent, theme)),
                
                const SliverToBoxAdapter(child: SizedBox(height: 100)),
              ],
            ),
          ),
          
          // Bottom Action Button
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildBottomAction(talent, theme),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar(FlutterFlowTheme theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildGlassButton(
            icon: Icons.arrow_back_ios_new,
            onTap: () => context.safePop(),
          ),
          Text(
            'Profil Talent',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          _buildGlassButton(
            icon: Icons.share,
            onTap: () {},
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.2, end: 0);
  }

  Widget _buildGlassButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildProfileHeader(InfosTalentRecord talent, FlutterFlowTheme theme) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Photo avec glow effect
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF19DB8A).withOpacity(0.4),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF19DB8A), width: 3),
              ),
              child: ClipOval(
                child: talent.photo.isNotEmpty
                    ? Image.network(talent.photo, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildPlaceholderAvatar())
                    : _buildPlaceholderAvatar(),
              ),
            ),
          ).animate().scale(begin: const Offset(0.8, 0.8), duration: 500.ms, curve: Curves.easeOut),
          
          const SizedBox(height: 20),
          
          // Nom
          Text(
            talent.nomComplet.isNotEmpty ? talent.nomComplet : 'Nom inconnu',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 200.ms),
          
          const SizedBox(height: 8),
          
          // Discipline & Poste
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF208050), Color(0xFF19DB8A)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${talent.discipline.isNotEmpty ? talent.discipline : "Sport"} • ${talent.poste.isNotEmpty ? talent.poste : "Poste"}',
              style: GoogleFonts.readexPro(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0),
          
          const SizedBox(height: 12),
          
          // Localisation
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.location_on, color: Colors.white.withOpacity(0.7), size: 18),
              const SizedBox(width: 4),
              Text(
                '${talent.ville.isNotEmpty ? talent.ville : ""} ${talent.pays.isNotEmpty ? ", ${talent.pays}" : ""}',
                style: GoogleFonts.readexPro(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
            ],
          ).animate().fadeIn(delay: 400.ms),
        ],
      ),
    );
  }

  Widget _buildPlaceholderAvatar() {
    return Container(
      color: const Color(0xFF208050).withOpacity(0.3),
      child: const Icon(Icons.person, color: Colors.white54, size: 60),
    );
  }

  Widget _buildStatsSection(InfosTalentRecord talent, FlutterFlowTheme theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: [
          Expanded(child: _buildStatCard('Taille', talent.taille.isNotEmpty ? '${talent.taille} cm' : '-', Icons.height, 0)),
          const SizedBox(width: 12),
          Expanded(child: _buildStatCard('Poids', talent.poids.isNotEmpty ? '${talent.poids} kg' : '-', Icons.fitness_center, 1)),
          const SizedBox(width: 12),
          Expanded(child: _buildStatCard('Exp.', talent.anneeExperience.isNotEmpty ? '${talent.anneeExperience} ans' : '-', Icons.timeline, 2)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, int index) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF208050), Color(0xFF19DB8A)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.readexPro(
              color: Colors.white.withOpacity(0.6),
              fontSize: 12,
            ),
          ),
        ],
      ),
    ).animate(delay: Duration(milliseconds: 500 + index * 100))
      .fadeIn(duration: 400.ms)
      .slideY(begin: 0.2, end: 0);
  }

  Widget _buildInfoSection(InfosTalentRecord talent, FlutterFlowTheme theme) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Informations',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ).animate(delay: 700.ms).fadeIn(),
          const SizedBox(height: 16),
          
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Column(
              children: [
                _buildInfoRow(Icons.sports_soccer, 'Discipline', talent.discipline),
                _buildDivider(),
                _buildInfoRow(Icons.sports, 'Poste', talent.poste),
                _buildDivider(),
                _buildInfoRow(Icons.flag, 'Nationalité', talent.nationalite),
                _buildDivider(),
                _buildInfoRow(Icons.cake, 'Date de naissance', talent.dateDeNaissance),
                _buildDivider(),
                _buildInfoRow(Icons.groups, 'Club actuel', talent.club),
              ],
            ),
          ).animate(delay: 800.ms).fadeIn().slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF208050).withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: const Color(0xFF19DB8A), size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.readexPro(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value.isNotEmpty ? value : 'Non renseigné',
                  style: GoogleFonts.readexPro(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(color: Colors.white.withOpacity(0.1), height: 1);
  }

  Widget _buildPalmaresSection(InfosTalentRecord talent, FlutterFlowTheme theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.emoji_events, color: Color(0xFFFFD700), size: 24),
              const SizedBox(width: 8),
              Text(
                'Palmarès',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ).animate(delay: 900.ms).fadeIn(),
          const SizedBox(height: 16),
          
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  const Color(0xFFFFD700).withOpacity(0.15),
                  const Color(0xFFFFD700).withOpacity(0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFFFD700).withOpacity(0.3)),
            ),
            child: Text(
              talent.palmares,
              style: GoogleFonts.readexPro(
                color: Colors.white.withOpacity(0.9),
                fontSize: 14,
                height: 1.6,
              ),
            ),
          ).animate(delay: 1000.ms).fadeIn().slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }

  Widget _buildContactSection(InfosTalentRecord talent, FlutterFlowTheme theme) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Contact',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ).animate(delay: 1100.ms).fadeIn(),
          const SizedBox(height: 16),
          
          Row(
            children: [
              if (talent.numeroPhone.isNotEmpty)
                Expanded(
                  child: _buildContactButton(
                    icon: Icons.phone,
                    label: 'Appeler',
                    color: const Color(0xFF208050),
                    onTap: () => launchURL('tel:${talent.numeroPhone}'),
                  ),
                ),
              if (talent.numeroPhone.isNotEmpty && talent.lienWhatsapp.isNotEmpty)
                const SizedBox(width: 12),
              if (talent.lienWhatsapp.isNotEmpty)
                Expanded(
                  child: _buildContactButton(
                    icon: Icons.chat,
                    label: 'WhatsApp',
                    color: const Color(0xFF25D366),
                    onTap: () => launchURL(talent.lienWhatsapp),
                  ),
                ),
            ],
          ).animate(delay: 1200.ms).fadeIn().slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }

  Widget _buildContactButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.4)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.readexPro(
                color: color,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomAction(InfosTalentRecord talent, FlutterFlowTheme theme) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            const Color(0xFF0A0A0A).withOpacity(0.9),
            const Color(0xFF0A0A0A),
          ],
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF208050), Color(0xFF19DB8A)],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF19DB8A).withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: FFButtonWidget(
          onPressed: () {
            // Navigate to message or contact
            context.pushNamed(MessageWidget.routeName);
          },
          text: 'Contacter ce talent',
          icon: const Icon(Icons.send, color: Colors.white, size: 20),
          options: FFButtonOptions(
            width: double.infinity,
            height: 60,
            color: Colors.transparent,
            textStyle: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 17,
              fontWeight: FontWeight.w600,
            ),
            elevation: 0,
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      ),
    ).animate(delay: 1300.ms).fadeIn().slideY(begin: 0.3, end: 0);
  }
}
