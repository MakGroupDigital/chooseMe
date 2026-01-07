import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '/core/backend/backend.dart';

import '/core/auth/base_auth_user_provider.dart';

import '/core/flutter_flow/flutter_flow_util.dart';

import '/index.dart';

export 'package:go_router/go_router.dart';
export 'serialization_util.dart';

const kTransitionInfoKey = '__transition_info__';

GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

class AppStateNotifier extends ChangeNotifier {
  AppStateNotifier._();

  static AppStateNotifier? _instance;
  static AppStateNotifier get instance => _instance ??= AppStateNotifier._();

  BaseAuthUser? initialUser;
  BaseAuthUser? user;
  bool showSplashImage = true;
  String? _redirectLocation;

  /// Determines whether the app will refresh and build again when a sign
  /// in or sign out happens. This is useful when the app is launched or
  /// on an unexpected logout. However, this must be turned off when we
  /// intend to sign in/out and then navigate or perform any actions after.
  /// Otherwise, this will trigger a refresh and interrupt the action(s).
  bool notifyOnAuthChange = true;

  bool get loading => user == null || showSplashImage;
  bool get loggedIn => user?.loggedIn ?? false;
  bool get initiallyLoggedIn => initialUser?.loggedIn ?? false;
  bool get shouldRedirect => loggedIn && _redirectLocation != null;

  String getRedirectLocation() => _redirectLocation!;
  bool hasRedirect() => _redirectLocation != null;
  void setRedirectLocationIfUnset(String loc) => _redirectLocation ??= loc;
  void clearRedirectLocation() => _redirectLocation = null;

  /// Mark as not needing to notify on a sign in / out when we intend
  /// to perform subsequent actions (such as navigation) afterwards.
  void updateNotifyOnAuthChange(bool notify) => notifyOnAuthChange = notify;

  void update(BaseAuthUser newUser) {
    final shouldUpdate =
        user?.uid == null || newUser.uid == null || user?.uid != newUser.uid;
    initialUser ??= newUser;
    user = newUser;
    // Refresh the app on auth change unless explicitly marked otherwise.
    // No need to update unless the user has changed.
    if (notifyOnAuthChange && shouldUpdate) {
      notifyListeners();
    }
    // Once again mark the notifier as needing to update on auth change
    // (in order to catch sign in / out events).
    updateNotifyOnAuthChange(true);
  }

  void stopShowingSplashImage() {
    showSplashImage = false;
    notifyListeners();
  }
}

GoRouter createRouter(AppStateNotifier appStateNotifier) => GoRouter(
      initialLocation: '/',
      debugLogDiagnostics: true,
      refreshListenable: appStateNotifier,
      navigatorKey: appNavigatorKey,
      errorBuilder: (context, state) =>
          appStateNotifier.loggedIn ? const ChargementWidget() : const ModernOnboardingWidget(),
      routes: [
        FFRoute(
          name: '_initialize',
          path: '/',
          builder: (context, _) =>
              appStateNotifier.loggedIn ? const ChargementWidget() : const ModernOnboardingWidget(),
          routes: [
            FFRoute(
              name: ChooseMeWidget.routeName,
              path: ChooseMeWidget.routePath,
              builder: (context, params) => const ChooseMeWidget(),
            ),
            FFRoute(
              name: ModernOnboardingWidget.routeName,
              path: ModernOnboardingWidget.routePath,
              builder: (context, params) => const ModernOnboardingWidget(),
            ),
            FFRoute(
              name: ConnexionWidget.routeName,
              path: ConnexionWidget.routePath,
              builder: (context, params) => const ConnexionWidget(),
            ),
            FFRoute(
              name: CompleteinfosjouereWidget.routeName,
              path: CompleteinfosjouereWidget.routePath,
              builder: (context, params) => const CompleteinfosjouereWidget(),
            ),
            FFRoute(
              name: RecruteurinfosWidget.routeName,
              path: RecruteurinfosWidget.routePath,
              builder: (context, params) => const RecruteurinfosWidget(),
            ),
            FFRoute(
              name: ClubcreationprofilWidget.routeName,
              path: ClubcreationprofilWidget.routePath,
              builder: (context, params) => const ClubcreationprofilWidget(),
            ),
            FFRoute(
              name: AffichebasketjouerWidget.routeName,
              path: AffichebasketjouerWidget.routePath,
              builder: (context, params) => const AffichebasketjouerWidget(),
            ),
            FFRoute(
              name: AffichetennisWidget.routeName,
              path: AffichetennisWidget.routePath,
              builder: (context, params) => const AffichetennisWidget(),
            ),
            FFRoute(
              name: AffichecyclisteWidget.routeName,
              path: AffichecyclisteWidget.routePath,
              builder: (context, params) => const AffichecyclisteWidget(),
            ),
            FFRoute(
              name: AffichetennispersoWidget.routeName,
              path: AffichetennispersoWidget.routePath,
              builder: (context, params) => const AffichetennispersoWidget(),
            ),
            FFRoute(
              name: AffichebasketjouerpersoWidget.routeName,
              path: AffichebasketjouerpersoWidget.routePath,
              builder: (context, params) => const AffichebasketjouerpersoWidget(),
            ),
            FFRoute(
              name: ParametreWidget.routeName,
              path: ParametreWidget.routePath,
              builder: (context, params) => const ParametreWidget(),
            ),
            FFRoute(
              name: PressecreatWidget.routeName,
              path: PressecreatWidget.routePath,
              builder: (context, params) => const PressecreatWidget(),
            ),
            FFRoute(
              name: TbdpresseWidget.routeName,
              path: TbdpresseWidget.routePath,
              builder: (context, params) => const TbdpresseWidget(),
            ),
            FFRoute(
              name: ProfilUTWidget.routeName,
              path: ProfilUTWidget.routePath,
              builder: (context, params) => const ProfilUTWidget(),
            ),
            FFRoute(
              name: RwandarestructionWidget.routeName,
              path: RwandarestructionWidget.routePath,
              builder: (context, params) => const RwandarestructionWidget(),
            ),
            FFRoute(
              name: ChargementWidget.routeName,
              path: ChargementWidget.routePath,
              builder: (context, params) => const ChargementWidget(),
            ),
            FFRoute(
              name: StatutcompteWidget.routeName,
              path: StatutcompteWidget.routePath,
              builder: (context, params) => const StatutcompteWidget(),
            ),
            FFRoute(
              name: TbclubWidget.routeName,
              path: TbclubWidget.routePath,
              builder: (context, params) => const TbclubWidget(),
            ),
            FFRoute(
              name: CreatWidget.routeName,
              path: CreatWidget.routePath,
              builder: (context, params) => const CreatWidget(),
            ),
            FFRoute(
              name: ErreurprofilWidget.routeName,
              path: ErreurprofilWidget.routePath,
              builder: (context, params) => const ErreurprofilWidget(),
            ),
            FFRoute(
              name: ChoisirtypeWidget.routeName,
              path: ChoisirtypeWidget.routePath,
              builder: (context, params) => const ChoisirtypeWidget(),
            ),
            FFRoute(
              name: TbdmanagereWidget.routeName,
              path: TbdmanagereWidget.routePath,
              builder: (context, params) => const TbdmanagereWidget(),
            ),
            FFRoute(
              name: TbdrecruteurWidget.routeName,
              path: TbdrecruteurWidget.routePath,
              builder: (context, params) => const TbdrecruteurWidget(),
            ),
            FFRoute(
              name: PayEquipeWidget.routeName,
              path: PayEquipeWidget.routePath,
              builder: (context, params) => const PayEquipeWidget(),
            ),
            FFRoute(
              name: PayWidget.routeName,
              path: PayWidget.routePath,
              builder: (context, params) => const PayWidget(),
            ),
            FFRoute(
              name: OkWidget.routeName,
              path: OkWidget.routePath,
              builder: (context, params) => const OkWidget(),
            ),
            FFRoute(
              name: PaimentsecureWidget.routeName,
              path: PaimentsecureWidget.routePath,
              builder: (context, params) => const PaimentsecureWidget(),
            ),
            FFRoute(
              name: PaimentcardWidget.routeName,
              path: PaimentcardWidget.routePath,
              builder: (context, params) => const PaimentcardWidget(),
            ),
            FFRoute(
              name: ChoosestarterWidget.routeName,
              path: ChoosestarterWidget.routePath,
              builder: (context, params) => const ChoosestarterWidget(),
            ),
            FFRoute(
              name: ErreurWidget.routeName,
              path: ErreurWidget.routePath,
              builder: (context, params) => const ErreurWidget(),
            ),
            FFRoute(
              name: RedirectionWidget.routeName,
              path: RedirectionWidget.routePath,
              builder: (context, params) => const RedirectionWidget(),
            ),
            FFRoute(
              name: AjoutPubWidget.routeName,
              path: AjoutPubWidget.routePath,
              builder: (context, params) => const AjoutPubWidget(),
            ),
            FFRoute(
              name: PubsuccesWidget.routeName,
              path: PubsuccesWidget.routePath,
              builder: (context, params) => const PubsuccesWidget(),
            ),
            FFRoute(
              name: SearcheTalentWidget.routeName,
              path: SearcheTalentWidget.routePath,
              builder: (context, params) => const SearcheTalentWidget(),
            ),
            FFRoute(
              name: ProfilUTedtWidget.routeName,
              path: ProfilUTedtWidget.routePath,
              builder: (context, params) => const ProfilUTedtWidget(),
            ),
            FFRoute(
              name: MessageWidget.routeName,
              path: MessageWidget.routePath,
              builder: (context, params) => const MessageWidget(),
            ),
            FFRoute(
              name: AjoutArticleWidget.routeName,
              path: AjoutArticleWidget.routePath,
              builder: (context, params) => const AjoutArticleWidget(),
            ),
            FFRoute(
              name: AjoutNoteWidget.routeName,
              path: AjoutNoteWidget.routePath,
              builder: (context, params) => const AjoutNoteWidget(),
            ),
            FFRoute(
              name: ReportageWidget.routeName,
              path: ReportageWidget.routePath,
              builder: (context, params) => const ReportageWidget(),
            ),
            FFRoute(
              name: ChatPageWidget.routeName,
              path: ChatPageWidget.routePath,
              builder: (context, params) => const ChatPageWidget(),
            ),
            FFRoute(
              name: FonctionNoDispoWidget.routeName,
              path: FonctionNoDispoWidget.routePath,
              builder: (context, params) => const FonctionNoDispoWidget(),
            ),
            FFRoute(
              name: AfficheTalent2Widget.routeName,
              path: AfficheTalent2Widget.routePath,
              asyncParams: {
                'refTalent': getDoc(
                    ['user', 'infosTalent'], InfosTalentRecord.fromSnapshot),
              },
              builder: (context, params) => AfficheTalent2Widget(
                refTalent: params.getParam(
                  'refTalent',
                  ParamType.Document,
                ),
              ),
            ),
            FFRoute(
              name: ArticleWidget.routeName,
              path: ArticleWidget.routePath,
              requireAuth: true,
              builder: (context, params) => const ArticleWidget(),
            ),
            FFRoute(
              name: ProfilTaWidget.routeName,
              path: ProfilTaWidget.routePath,
              builder: (context, params) => const ProfilTaWidget(),
            ),
            FFRoute(
              name: AfficheTalentprofilWidget.routeName,
              path: AfficheTalentprofilWidget.routePath,
              builder: (context, params) => const AfficheTalentprofilWidget(),
            ),
            FFRoute(
              name: AerticlesuccesWidget.routeName,
              path: AerticlesuccesWidget.routePath,
              builder: (context, params) => const AerticlesuccesWidget(),
            ),
            FFRoute(
              name: PolitiqueWidget.routeName,
              path: PolitiqueWidget.routePath,
              builder: (context, params) => const PolitiqueWidget(),
            ),
            FFRoute(
              name: AccesblokedWidget.routeName,
              path: AccesblokedWidget.routePath,
              builder: (context, params) => const AccesblokedWidget(),
            ),
            FFRoute(
              name: InfosmodificationWidget.routeName,
              path: InfosmodificationWidget.routePath,
              builder: (context, params) => const InfosmodificationWidget(),
            ),
            FFRoute(
              name: NoaccesWidget.routeName,
              path: NoaccesWidget.routePath,
              builder: (context, params) => const NoaccesWidget(),
            ),
            FFRoute(
              name: RecruteuconditionsWidget.routeName,
              path: RecruteuconditionsWidget.routePath,
              builder: (context, params) => const RecruteuconditionsWidget(),
            ),
            FFRoute(
              name: NoathleteWidget.routeName,
              path: NoathleteWidget.routePath,
              builder: (context, params) => const NoathleteWidget(),
            ),
            FFRoute(
              name: PassforwarWidget.routeName,
              path: PassforwarWidget.routePath,
              builder: (context, params) => const PassforwarWidget(),
            ),
            FFRoute(
              name: PressenoaccesWidget.routeName,
              path: PressenoaccesWidget.routePath,
              builder: (context, params) => const PressenoaccesWidget(),
            ),
            FFRoute(
              name: AddreportageWidget.routeName,
              path: AddreportageWidget.routePath,
              builder: (context, params) => const AddreportageWidget(),
            ),
            FFRoute(
              name: ReporsuccesWidget.routeName,
              path: ReporsuccesWidget.routePath,
              builder: (context, params) => const ReporsuccesWidget(),
            ),
            FFRoute(
              name: ReportagehomeWidget.routeName,
              path: ReportagehomeWidget.routePath,
              requireAuth: true,
              builder: (context, params) => const ReportagehomeWidget(),
            ),
            FFRoute(
              name: TBDgeneralADMWidget.routeName,
              path: TBDgeneralADMWidget.routePath,
              builder: (context, params) => const TBDgeneralADMWidget(),
            ),
            FFRoute(
              name: UtilisateurathleteADMWidget.routeName,
              path: UtilisateurathleteADMWidget.routePath,
              builder: (context, params) => const UtilisateurathleteADMWidget(),
            ),
            FFRoute(
              name: UtilisateurADMmanagereWidget.routeName,
              path: UtilisateurADMmanagereWidget.routePath,
              builder: (context, params) => const UtilisateurADMmanagereWidget(),
            ),
            FFRoute(
              name: UtilisateurADMclubWidget.routeName,
              path: UtilisateurADMclubWidget.routePath,
              builder: (context, params) => const UtilisateurADMclubWidget(),
            ),
            FFRoute(
              name: ADMutilisateursWidget.routeName,
              path: ADMutilisateursWidget.routePath,
              builder: (context, params) => const ADMutilisateursWidget(),
            ),
            FFRoute(
              name: UtilisateurTBDpresseWidget.routeName,
              path: UtilisateurTBDpresseWidget.routePath,
              builder: (context, params) => const UtilisateurTBDpresseWidget(),
            ),
            FFRoute(
              name: PubADMWidget.routeName,
              path: PubADMWidget.routePath,
              builder: (context, params) => const PubADMWidget(),
            ),
            FFRoute(
              name: ModerationWidget.routeName,
              path: ModerationWidget.routePath,
              builder: (context, params) => const ModerationWidget(),
            ),
            FFRoute(
              name: ConfigADMWidget.routeName,
              path: ConfigADMWidget.routePath,
              builder: (context, params) => const ConfigADMWidget(),
            ),
            FFRoute(
              name: HOMEchooseWidget.routeName,
              path: HOMEchooseWidget.routePath,
              builder: (context, params) => const HOMEchooseWidget(),
            ),
            FFRoute(
              name: Home8Widget.routeName,
              path: Home8Widget.routePath,
              builder: (context, params) => const Home8Widget(),
            ),
            FFRoute(
              name: NotificationWidget.routeName,
              path: NotificationWidget.routePath,
              builder: (context, params) => const NotificationWidget(),
            ),
            // === LIVE MATCH ROUTES ===
            FFRoute(
              name: MatchesListWidget.routeName,
              path: MatchesListWidget.routePath,
              requireAuth: true,
              builder: (context, params) => const MatchesListWidget(),
            ),
            FFRoute(
              name: MatchDetailWidget.routeName,
              path: MatchDetailWidget.routePath,
              requireAuth: true,
              builder: (context, params) => MatchDetailWidget(
                matchId: params.getParam('matchId', ParamType.String),
                showPrediction: params.getParam('showPrediction', ParamType.String),
              ),
            ),
            FFRoute(
              name: WalletWidget.routeName,
              path: WalletWidget.routePath,
              requireAuth: true,
              builder: (context, params) => const WalletWidget(),
            ),
            FFRoute(
              name: WithdrawalWidget.routeName,
              path: WithdrawalWidget.routePath,
              requireAuth: true,
              builder: (context, params) => const WithdrawalWidget(),
            ),
            FFRoute(
              name: LeaderboardWidget.routeName,
              path: LeaderboardWidget.routePath,
              builder: (context, params) => const LeaderboardWidget(),
            )
          ].map((r) => r.toRoute(appStateNotifier)).toList(),
        ),
      ].map((r) => r.toRoute(appStateNotifier)).toList(),
      observers: [routeObserver],
    );

extension NavParamExtensions on Map<String, String?> {
  Map<String, String> get withoutNulls => Map.fromEntries(
        entries
            .where((e) => e.value != null)
            .map((e) => MapEntry(e.key, e.value!)),
      );
}

extension NavigationExtensions on BuildContext {
  void goNamedAuth(
    String name,
    bool mounted, {
    Map<String, String> pathParameters = const <String, String>{},
    Map<String, String> queryParameters = const <String, String>{},
    Object? extra,
    bool ignoreRedirect = false,
  }) =>
      !mounted || GoRouter.of(this).shouldRedirect(ignoreRedirect)
          ? null
          : goNamed(
              name,
              pathParameters: pathParameters,
              queryParameters: queryParameters,
              extra: extra,
            );

  void pushNamedAuth(
    String name,
    bool mounted, {
    Map<String, String> pathParameters = const <String, String>{},
    Map<String, String> queryParameters = const <String, String>{},
    Object? extra,
    bool ignoreRedirect = false,
  }) =>
      !mounted || GoRouter.of(this).shouldRedirect(ignoreRedirect)
          ? null
          : pushNamed(
              name,
              pathParameters: pathParameters,
              queryParameters: queryParameters,
              extra: extra,
            );

  void safePop() {
    // If there is only one route on the stack, navigate to the initial
    // page instead of popping.
    if (canPop()) {
      pop();
    } else {
      go('/');
    }
  }
}

extension GoRouterExtensions on GoRouter {
  AppStateNotifier get appState => AppStateNotifier.instance;
  void prepareAuthEvent([bool ignoreRedirect = false]) =>
      appState.hasRedirect() && !ignoreRedirect
          ? null
          : appState.updateNotifyOnAuthChange(false);
  bool shouldRedirect(bool ignoreRedirect) =>
      !ignoreRedirect && appState.hasRedirect();
  void clearRedirectLocation() => appState.clearRedirectLocation();
  void setRedirectLocationIfUnset(String location) =>
      appState.updateNotifyOnAuthChange(false);
}

extension _GoRouterStateExtensions on GoRouterState {
  Map<String, dynamic> get extraMap =>
      extra != null ? extra as Map<String, dynamic> : {};
  Map<String, dynamic> get allParams => <String, dynamic>{}
    ..addAll(pathParameters)
    ..addAll(uri.queryParameters)
    ..addAll(extraMap);
  TransitionInfo get transitionInfo => extraMap.containsKey(kTransitionInfoKey)
      ? extraMap[kTransitionInfoKey] as TransitionInfo
      : TransitionInfo.appDefault();
}

class FFParameters {
  FFParameters(this.state, [this.asyncParams = const {}]);

  final GoRouterState state;
  final Map<String, Future<dynamic> Function(String)> asyncParams;

  Map<String, dynamic> futureParamValues = {};

  // Parameters are empty if the params map is empty or if the only parameter
  // present is the special extra parameter reserved for the transition info.
  bool get isEmpty =>
      state.allParams.isEmpty ||
      (state.allParams.length == 1 &&
          state.extraMap.containsKey(kTransitionInfoKey));
  bool isAsyncParam(MapEntry<String, dynamic> param) =>
      asyncParams.containsKey(param.key) && param.value is String;
  bool get hasFutures => state.allParams.entries.any(isAsyncParam);
  Future<bool> completeFutures() => Future.wait(
        state.allParams.entries.where(isAsyncParam).map(
          (param) async {
            final doc = await asyncParams[param.key]!(param.value)
                .onError((_, __) => null);
            if (doc != null) {
              futureParamValues[param.key] = doc;
              return true;
            }
            return false;
          },
        ),
      ).onError((_, __) => [false]).then((v) => v.every((e) => e));

  dynamic getParam<T>(
    String paramName,
    ParamType type, {
    bool isList = false,
    List<String>? collectionNamePath,
  }) {
    if (futureParamValues.containsKey(paramName)) {
      return futureParamValues[paramName];
    }
    if (!state.allParams.containsKey(paramName)) {
      return null;
    }
    final param = state.allParams[paramName];
    // Got parameter from `extras`, so just directly return it.
    if (param is! String) {
      return param;
    }
    // Return serialized value.
    return deserializeParam<T>(
      param,
      type,
      isList,
      collectionNamePath: collectionNamePath,
    );
  }
}

class FFRoute {
  const FFRoute({
    required this.name,
    required this.path,
    required this.builder,
    this.requireAuth = false,
    this.asyncParams = const {},
    this.routes = const [],
  });

  final String name;
  final String path;
  final bool requireAuth;
  final Map<String, Future<dynamic> Function(String)> asyncParams;
  final Widget Function(BuildContext, FFParameters) builder;
  final List<GoRoute> routes;

  GoRoute toRoute(AppStateNotifier appStateNotifier) => GoRoute(
        name: name,
        path: path,
        redirect: (context, state) {
          if (appStateNotifier.shouldRedirect) {
            final redirectLocation = appStateNotifier.getRedirectLocation();
            appStateNotifier.clearRedirectLocation();
            return redirectLocation;
          }

          if (requireAuth && !appStateNotifier.loggedIn) {
            appStateNotifier.setRedirectLocationIfUnset(state.uri.toString());
            return '/chooseMe';
          }
          return null;
        },
        pageBuilder: (context, state) {
          fixStatusBarOniOS16AndBelow(context);
          final ffParams = FFParameters(state, asyncParams);
          final page = ffParams.hasFutures
              ? FutureBuilder(
                  future: ffParams.completeFutures(),
                  builder: (context, _) => builder(context, ffParams),
                )
              : builder(context, ffParams);
          final child = appStateNotifier.loading
              ? Container(
                  color: Colors.transparent,
                  child: Image.asset(
                    'assets/images/Untitled.gif',
                    fit: BoxFit.contain,
                  ),
                )
              : page;

          final transitionInfo = state.transitionInfo;
          return transitionInfo.hasTransition
              ? CustomTransitionPage(
                  key: state.pageKey,
                  child: child,
                  transitionDuration: transitionInfo.duration,
                  transitionsBuilder:
                      (context, animation, secondaryAnimation, child) =>
                          PageTransition(
                    type: transitionInfo.transitionType,
                    duration: transitionInfo.duration,
                    reverseDuration: transitionInfo.duration,
                    alignment: transitionInfo.alignment,
                    child: child,
                  ).buildTransitions(
                    context,
                    animation,
                    secondaryAnimation,
                    child,
                  ),
                )
              : MaterialPage(key: state.pageKey, child: child);
        },
        routes: routes,
      );
}

class TransitionInfo {
  const TransitionInfo({
    required this.hasTransition,
    this.transitionType = PageTransitionType.fade,
    this.duration = const Duration(milliseconds: 300),
    this.alignment,
  });

  final bool hasTransition;
  final PageTransitionType transitionType;
  final Duration duration;
  final Alignment? alignment;

  static TransitionInfo appDefault() => const TransitionInfo(hasTransition: false);
}

class RootPageContext {
  const RootPageContext(this.isRootPage, [this.errorRoute]);
  final bool isRootPage;
  final String? errorRoute;

  static bool isInactiveRootPage(BuildContext context) {
    final rootPageContext = context.read<RootPageContext?>();
    final isRootPage = rootPageContext?.isRootPage ?? false;
    final location = GoRouterState.of(context).uri.toString();
    return isRootPage &&
        location != '/' &&
        location != rootPageContext?.errorRoute;
  }

  static Widget wrap(Widget child, {String? errorRoute}) => Provider.value(
        value: RootPageContext(true, errorRoute),
        child: child,
      );
}

extension GoRouterLocationExtension on GoRouter {
  String getCurrentLocation() {
    final RouteMatch lastMatch = routerDelegate.currentConfiguration.last;
    final RouteMatchList matchList = lastMatch is ImperativeRouteMatch
        ? lastMatch.matches
        : routerDelegate.currentConfiguration;
    return matchList.uri.toString();
  }
}
