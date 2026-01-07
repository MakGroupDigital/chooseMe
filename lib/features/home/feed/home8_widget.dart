import '/app_state.dart';
import '/core/auth/firebase_auth/auth_util.dart';
import '/core/backend/backend.dart';
import '/core/flutter_flow/flutter_flow_icon_button.dart';
import '/core/flutter_flow/flutter_flow_theme.dart';
import '/core/flutter_flow/flutter_flow_toggle_icon.dart';
import '/core/flutter_flow/flutter_flow_util.dart';
import '/core/flutter_flow/flutter_flow_video_player.dart';
import 'dart:async';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'home8_model.dart';
export 'home8_model.dart';

class Home8Widget extends StatefulWidget {
  const Home8Widget({super.key});

  static String routeName = 'Home8';
  static String routePath = 'home8';

  @override
  State<Home8Widget> createState() => _Home8WidgetState();
}

class _Home8WidgetState extends State<Home8Widget> with TickerProviderStateMixin {
  late Home8Model _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();
  
  // Couleurs ChooseMe
  final List<Color> _primaryGradient = const [Color(0xFF208050), Color(0xFF19DB8A)];
  
  // Cache des publications pour éviter les rechargements
  List<PublicationRecord>? _cachedPublications;
  bool _isLoading = true;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => Home8Model());
    _loadPublications();
    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  Future<void> _loadPublications() async {
    try {
      final snapshot = await queryPublicationRecordOnce(
        queryBuilder: (q) => q.orderBy('time_posted', descending: true).limit(50),
      );
      if (mounted) {
        setState(() {
          _cachedPublications = snapshot;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Erreur chargement publications: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _refreshPublications() async {
    setState(() => _isLoading = true);
    await _loadPublications();
  }

  @override
  void dispose() {
    _model.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();
    final theme = FlutterFlowTheme.of(context);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: const Color(0xFF0A0A0A),
        body: Stack(
          children: [
            // Contenu principal
            if (_isLoading)
              _buildLoadingState(theme)
            else if (_cachedPublications == null || _cachedPublications!.isEmpty)
              _buildEmptyState(theme)
            else
              _buildVideoFeed(theme),
            // Header
            _buildHeader(theme),
            // Bottom Navigation
            _buildBottomNav(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState(FlutterFlowTheme theme) {
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
            'Chargement des talents...',
            style: GoogleFonts.readexPro(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(FlutterFlowTheme theme) {
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
            'Aucune publication',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Soyez le premier à partager votre talent !',
            style: GoogleFonts.readexPro(
              color: Colors.white60,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoFeed(FlutterFlowTheme theme) {
    return PageView.builder(
      controller: _model.pageViewController ??= PageController(),
      scrollDirection: Axis.vertical,
      itemCount: _cachedPublications!.length,
      onPageChanged: (index) => setState(() => _currentIndex = index),
      itemBuilder: (context, index) {
        final publication = _cachedPublications![index];
        return _buildVideoItem(publication, index, theme);
      },
    );
  }

  Widget _buildVideoItem(PublicationRecord publication, int index, FlutterFlowTheme theme) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Vidéo
        if (publication.postVido.isNotEmpty)
          FlutterFlowVideoPlayer(
            path: publication.postVido,
            videoType: VideoType.network,
            width: double.infinity,
            height: double.infinity,
            autoPlay: index == _currentIndex,
            looping: true,
            showControls: true,
            allowFullScreen: true,
            allowPlaybackSpeedMenu: false,
            lazyLoad: false,
          )
        else
          Container(
            color: const Color(0xFF0A0A0A),
            child: Center(
              child: Icon(Icons.videocam_off, color: Colors.white38, size: 60),
            ),
          ),
        
        // Overlay gradient moderne
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.3),
                Colors.transparent,
                Colors.transparent,
                Colors.black.withOpacity(0.8),
              ],
              stops: const [0.0, 0.2, 0.6, 1.0],
            ),
          ),
        ),
        
        // Contenu overlay
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 60, 16, 100),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Infos publication
                    Expanded(
                      child: _buildPublicationInfo(publication, theme),
                    ),
                    // Actions
                    _buildActionButtons(publication, theme),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPublicationInfo(PublicationRecord publication, FlutterFlowTheme theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Auteur
        InkWell(
          onTap: () => _handleAuthorTap(),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: _primaryGradient[1], width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: _primaryGradient[0].withOpacity(0.5),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                  image: const DecorationImage(
                    fit: BoxFit.cover,
                    image: AssetImage('assets/images/Sans_titre-4.png'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            publication.nomPoster,
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(colors: _primaryGradient),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            publication.sporttype,
                            style: GoogleFonts.readexPro(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      publication.postTitle,
                      style: GoogleFonts.readexPro(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1, end: 0),
        const SizedBox(height: 12),
        // Description
        if (publication.postDescription.isNotEmpty)
          Text(
            publication.postDescription,
            style: GoogleFonts.readexPro(
              color: Colors.white.withOpacity(0.9),
              fontSize: 14,
              height: 1.4,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ).animate(delay: 100.ms).fadeIn(duration: 400.ms),
      ],
    );
  }

  Widget _buildActionButtons(PublicationRecord publication, FlutterFlowTheme theme) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Mute/Unmute
        _buildActionButton(
          child: ToggleIcon(
            onPressed: () async {
              safeSetState(() => FFAppState().isMuted = !FFAppState().isMuted);
            },
            value: FFAppState().isMuted,
            onIcon: const Icon(Icons.volume_off_rounded, color: Colors.white, size: 26),
            offIcon: const Icon(Icons.volume_up_rounded, color: Colors.white, size: 26),
          ),
        ).animate(delay: 200.ms).fadeIn().scale(begin: const Offset(0.8, 0.8)),
        const SizedBox(height: 20),
        // Like
        _buildActionButton(
          child: ToggleIcon(
            onPressed: () async {
              final likesElement = currentUserReference;
              final likesUpdate = publication.likes.contains(likesElement)
                  ? FieldValue.arrayRemove([likesElement])
                  : FieldValue.arrayUnion([likesElement]);
              await publication.reference.update({
                ...mapToFirestore({'likes': likesUpdate}),
              });
            },
            value: publication.likes.contains(currentUserReference),
            onIcon: const Icon(Icons.favorite_rounded, color: Color(0xFFFF4757), size: 28),
            offIcon: Icon(Icons.favorite_border_rounded, color: Colors.white.withOpacity(0.9), size: 28),
          ),
        ).animate(delay: 250.ms).fadeIn().scale(begin: const Offset(0.8, 0.8)),
        const SizedBox(height: 4),
        Text(
          _formatCount(publication.likes.length),
          style: GoogleFonts.readexPro(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 20),
        // WhatsApp
        _buildActionButton(
          onTap: () => _handleWhatsAppTap(),
          child: const FaIcon(FontAwesomeIcons.whatsapp, color: Color(0xFF25D366), size: 26),
        ).animate(delay: 300.ms).fadeIn().scale(begin: const Offset(0.8, 0.8)),
        const SizedBox(height: 20),
        // Share
        Builder(
          builder: (context) => _buildActionButton(
            onTap: () async {
              await Share.share(
                '🔥 Regarde ce talent sur ChooseMe !\n\n🎬 ${publication.postTitle}\n📝 ${publication.postDescription}\n\n👉 https://www.choose-me.net/home8',
                sharePositionOrigin: getWidgetBoundingBox(context),
              );
            },
            child: const Icon(Icons.share_rounded, color: Colors.white, size: 26),
          ),
        ).animate(delay: 350.ms).fadeIn().scale(begin: const Offset(0.8, 0.8)),
      ],
    );
  }

  Widget _buildActionButton({Widget? child, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.black.withOpacity(0.4),
          border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
            ),
          ],
        ),
        child: Center(child: child),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }

  Widget _buildHeader(FlutterFlowTheme theme) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.7),
              Colors.transparent,
            ],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Logo
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(colors: _primaryGradient),
                        boxShadow: [
                          BoxShadow(
                            color: _primaryGradient[0].withOpacity(0.5),
                            blurRadius: 12,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/Sans_titre-4.png',
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ShaderMask(
                      shaderCallback: (bounds) => LinearGradient(
                        colors: [Colors.white, _primaryGradient[1]],
                      ).createShader(bounds),
                      child: Text(
                        'ChooseMe',
                        style: GoogleFonts.inter(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ).animate().fadeIn(duration: 500.ms),
                // Actions
                Row(
                  children: [
                    _buildHeaderButton(
                      icon: Icons.search_rounded,
                      onTap: () => _handleSearchTap(),
                    ),
                    const SizedBox(width: 12),
                    _buildHeaderButton(
                      icon: Icons.notifications_none_rounded,
                      onTap: () => context.pushNamed(NotificationWidget.routeName),
                    ),
                  ],
                ).animate(delay: 100.ms).fadeIn(duration: 500.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.black.withOpacity(0.4),
          border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
        ),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }

  Widget _buildBottomNav(FlutterFlowTheme theme) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.9),
              Colors.black.withOpacity(0.6),
              Colors.transparent,
            ],
          ),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
            child: Container(
              height: 70,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(35),
                border: Border.all(color: Colors.white.withOpacity(0.1), width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildNavItem(
                    icon: Icons.home_rounded,
                    label: 'Choose',
                    isActive: true,
                    onTap: () {},
                  ),
                  _buildNavItem(
                    icon: Icons.sports_soccer,
                    label: 'Live Match',
                    onTap: () => context.pushNamed(MatchesListWidget.routeName),
                  ),
                  _buildAddButton(theme),
                  _buildNavItem(
                    icon: FontAwesomeIcons.newspaper,
                    label: 'Reportage',
                    onTap: () => context.pushNamed(ReportagehomeWidget.routeName),
                  ),
                  _buildNavItem(
                    icon: Icons.person_rounded,
                    label: 'Profil',
                    onTap: () => _handleProfileTap(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.2, end: 0),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    bool isActive = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: isActive ? _primaryGradient[1] : Colors.white.withOpacity(0.6),
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.readexPro(
              color: isActive ? _primaryGradient[1] : Colors.white.withOpacity(0.6),
              fontSize: 11,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddButton(FlutterFlowTheme theme) {
    return GestureDetector(
      onTap: () => _handleAddTap(),
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: _primaryGradient,
          ),
          boxShadow: [
            BoxShadow(
              color: _primaryGradient[0].withOpacity(0.5),
              blurRadius: 15,
              spreadRadius: 2,
            ),
          ],
        ),
        child: const Icon(
          Icons.add_rounded,
          color: Colors.white,
          size: 32,
        ),
      ).animate(onPlay: (c) => c.repeat(reverse: true))
        .scale(
          begin: const Offset(1, 1),
          end: const Offset(1.05, 1.05),
          duration: 1500.ms,
        ),
    );
  }

  // Navigation handlers
  void _handleSearchTap() {
    final userType = valueOrDefault(currentUserDocument?.type, '');
    if (userType == 'recruteur' || userType == 'equipe' || userType == 'journaliste') {
      context.pushNamed(SearcheTalentWidget.routeName);
    } else {
      context.pushNamed(NoathleteWidget.routeName);
    }
  }

  void _handleDiscoverTap() {
    final userType = valueOrDefault(currentUserDocument?.type, '');
    if (userType == 'recruteur' || userType == 'equipe' || userType == 'journaliste') {
      context.pushNamed(SearcheTalentWidget.routeName);
    } else {
      context.pushNamed(NoathleteWidget.routeName);
    }
  }

  void _handleAddTap() {
    final userType = valueOrDefault(currentUserDocument?.type, '');
    if (userType == 'joueur') {
      context.pushNamed(AjoutPubWidget.routeName);
    } else if (userType == 'journaliste') {
      context.pushNamed(AjoutArticleWidget.routeName);
    } else {
      context.pushNamed(AccesblokedWidget.routeName);
    }
  }

  void _handleProfileTap() {
    final userType = valueOrDefault(currentUserDocument?.type, '');
    switch (userType) {
      case 'joueur':
        context.pushNamed(AfficheTalentprofilWidget.routeName);
        break;
      case 'journaliste':
        context.pushNamed(TbdpresseWidget.routeName);
        break;
      case 'equipe':
        context.pushNamed(TbclubWidget.routeName);
        break;
      case 'recruteur':
        context.pushNamed(TbdmanagereWidget.routeName);
        break;
      case 'visiteur':
        context.pushNamed(ProfilUTWidget.routeName);
        break;
      default:
        context.pushNamed(ProfilUTWidget.routeName);
    }
  }

  void _handleAuthorTap() {
    final userType = valueOrDefault(currentUserDocument?.type, '');
    if (userType == 'recruteur' || userType == 'equipe') {
      launchURL(FFAppState().whatsaap);
    } else {
      context.pushNamed(NoathleteWidget.routeName);
    }
  }

  void _handleWhatsAppTap() {
    final userType = valueOrDefault(currentUserDocument?.type, '');
    if (userType == 'recruteur' || userType == 'equipe') {
      launchURL(FFAppState().whatsaap);
    } else {
      context.pushNamed(NoathleteWidget.routeName);
    }
  }
}
