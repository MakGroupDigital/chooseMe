import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '/core/backend/backend.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'searche_talent_model.dart';
export 'searche_talent_model.dart';

class SearcheTalentWidget extends StatefulWidget {
  const SearcheTalentWidget({super.key});

  static String routeName = 'searcheTalent';
  static String routePath = 'searcheTalent';

  @override
  State<SearcheTalentWidget> createState() => _SearcheTalentWidgetState();
}

class _SearcheTalentWidgetState extends State<SearcheTalentWidget> {
  late SearcheTalentModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();
  String _selectedSport = 'Tous';

  final List<String> _sports = ['Tous', 'Football', 'Basketball', 'Tennis', 'Cyclisme', 'Natation'];

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => SearcheTalentModel());
    _model.textController ??= TextEditingController();
    _model.textFieldFocusNode ??= FocusNode();
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
                _buildHeader(),
                _buildSearchBar(),
                _buildSportFilters(),
                Expanded(child: _buildTalentsList()),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
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
              'Recherche Talents',
              style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.tune, color: Colors.white, size: 22),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.2);
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [const Color(0xFF208050).withOpacity(0.2), const Color(0xFF19DB8A).withOpacity(0.1)],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF19DB8A).withOpacity(0.3)),
        ),
        child: TextField(
          controller: _model.textController,
          focusNode: _model.textFieldFocusNode,
          style: GoogleFonts.readexPro(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Rechercher par nom, sport, position...',
            hintStyle: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.4)),
            prefixIcon: const Icon(Icons.search, color: Color(0xFF19DB8A)),
            suffixIcon: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.mic, color: Colors.white, size: 20),
            ),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ),
    ).animate().fadeIn(delay: 200.ms, duration: 400.ms);
  }

  Widget _buildSportFilters() {
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _sports.length,
        itemBuilder: (context, index) {
          final sport = _sports[index];
          final isSelected = sport == _selectedSport;
          return GestureDetector(
            onTap: () => setState(() => _selectedSport = sport),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                gradient: isSelected ? const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]) : null,
                color: isSelected ? null : Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(25),
                border: Border.all(color: isSelected ? Colors.transparent : Colors.white.withOpacity(0.1)),
                boxShadow: isSelected ? [BoxShadow(color: const Color(0xFF19DB8A).withOpacity(0.3), blurRadius: 10)] : null,
              ),
              child: Text(
                sport,
                style: GoogleFonts.readexPro(
                  color: Colors.white,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
          ).animate(delay: Duration(milliseconds: 50 * index)).fadeIn(duration: 300.ms).slideX(begin: 0.2);
        },
      ),
    );
  }

  Widget _buildTalentsList() {
    return StreamBuilder<List<UserRecord>>(
      stream: queryUserRecord(
        queryBuilder: (userRecord) => userRecord.where('type', isEqualTo: 'athlete').limit(20),
      ),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                ),
                const SizedBox(height: 16),
                Text('Chargement des talents...', style: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.6))),
              ],
            ),
          );
        }

        final talents = snapshot.data!;
        if (talents.isEmpty) {
          return _buildEmptyState();
        }

        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: talents.length,
          itemBuilder: (context, index) => _buildTalentCard(talents[index], index),
        );
      },
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
              color: Colors.white.withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.search_off, color: Colors.white.withOpacity(0.3), size: 48),
          ),
          const SizedBox(height: 24),
          Text('Aucun talent trouvé', style: GoogleFonts.inter(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('Essayez avec d\'autres filtres', style: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.5))),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms);
  }

  Widget _buildTalentCard(UserRecord talent, int index) {
    return GestureDetector(
      onTap: () => context.pushNamed(AfficheTalent2Widget.routeName, queryParameters: {'userRef': serializeParam(talent.reference, ParamType.DocumentReference)}),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  image: DecorationImage(
                    image: talent.photoUrl.isNotEmpty
                        ? NetworkImage(talent.photoUrl)
                        : const AssetImage('assets/images/Sans_titre-4.png') as ImageProvider,
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                    ),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Sport badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF208050), Color(0xFF19DB8A)]),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          talent.discipline.isNotEmpty ? talent.discipline : 'Football',
                          style: GoogleFonts.readexPro(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                        ),
                      ),
                      // Rating
                      Row(
                        children: [
                          const Icon(Icons.star, color: Color(0xFFFFD700), size: 14),
                          const SizedBox(width: 4),
                          Text('4.8', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      talent.displayName.isNotEmpty ? talent.displayName : 'Talent',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.location_on, color: Colors.white.withOpacity(0.5), size: 12),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            talent.pays.isNotEmpty ? talent.pays : 'Afrique',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.readexPro(color: Colors.white.withOpacity(0.5), fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF19DB8A).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text('Voir profil', style: GoogleFonts.readexPro(color: const Color(0xFF19DB8A), fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate(delay: Duration(milliseconds: 100 * index)).fadeIn(duration: 400.ms).scale(begin: const Offset(0.9, 0.9));
  }
}
