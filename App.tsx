
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SplashPage from './features/onboarding/SplashPage';
import ModernOnboardingPage from './features/onboarding/ModernOnboardingPage';
import OnboardingChooseTypePage from './features/onboarding/OnboardingChooseTypePage';
import OnboardingCreateAccountPage from './features/onboarding/OnboardingCreateAccountPage';
import LoginPage from './features/auth/LoginPage';
import DashboardRouter from './features/home/DashboardRouter';
import AthleteDashboard from './features/home/dashboards/AthleteDashboard';
import RecruiterDashboard from './features/home/dashboards/RecruiterDashboard';
import ClubDashboard from './features/home/dashboards/ClubDashboard';
import PressDashboard from './features/home/dashboards/PressDashboard';
import LiveMatchesPage from './features/live_match/LiveMatchesPage';
import MatchDetailPage from './features/live_match/MatchDetailPage';
import MyPredictionsPage from './features/live_match/MyPredictionsPage';
import WalletPage from './features/wallet/WalletPage';
import MessagesPage from './features/messages/MessagesPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import ProfileViewPage from './features/profile/ProfileViewPage';
import ProfileEditPage from './features/profile/ProfileEditPage';
import AthletePublicProfilePage from './features/profile/AthletePublicProfilePage';
import SettingsPage from './features/profile/SettingsPage';
import BecomeAthletePage from './features/profile/BecomeAthletePage';
import ExplorerPage from './features/explorer/ExplorerPage';
import ReportageDetailPage from './features/explorer/ReportageDetailPage';
import CreateContentPage from './features/content/CreateContentPage';
import VideoDescriptionPage from './features/content/VideoDescriptionPage';
import PerformanceRecordingPage from './features/content/PerformanceRecordingPage';
import SharedVideoPage from './features/content/SharedVideoPage';
import AdminDashboardPage from './features/admin/AdminDashboardPage';
import BottomNav from './components/BottomNav';
import PermissionModal from './components/PermissionModal';
import PwaInstallBanner from './components/PwaInstallBanner';
import { UserType, UserProfile } from './types';
import { getFirebaseAuth, getFirestoreDb } from './services/firebase';
import { onAuthStateChanged, type Unsubscribe, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { usePermissions } from './hooks/usePermissions';
import { applyLanguage, applyTheme, loadAppSettings, SETTINGS_EVENT } from './services/appSettingsService';
import { ensureBrowserNotificationPermission, listenUserNotifications, notifyBrowser } from './services/notificationService';
import { hasExplicitUserType, resolveUserTypeFromData, resolveUserTypeValue } from './utils/userType';

const DeviceMockup: React.FC<{ children: React.ReactNode, showNav: boolean, userType?: UserType }> = ({ children, showNav, userType }) => {
  return (
    <div className="relative h-[100dvh] bg-[#050505] flex flex-col font-sans overflow-hidden">
      <div className={`flex-1 min-h-0 overflow-y-auto relative custom-scrollbar bg-[#050505] ${showNav ? 'pb-32' : ''}`}>
        {children}
      </div>
      {showNav && <BottomNav userType={userType || UserType.ATHLETE} />}
    </div>
  );
};

const isAdminProfile = (profile: UserProfile | null): boolean =>
  profile?.type === UserType.ADMIN || profile?.role === 'admin' || profile?.isAdmin === true;

const ONBOARDING_TYPE_KEY = 'chooseMe.selectedUserType';

const readStoredOnboardingType = (): UserType | undefined => {
  try {
    const value = sessionStorage.getItem(ONBOARDING_TYPE_KEY);
    const resolved = resolveUserTypeValue(value);
    if (resolved && resolved !== UserType.ADMIN) return resolved;
  } catch {
    return undefined;
  }
  return undefined;
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedOnboardingType, setSelectedOnboardingType] = useState<UserType | undefined>(() => readStoredOnboardingType());
  const [loading, setLoading] = useState(true);
  const [feedClearView, setFeedClearView] = useState(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const location = useLocation();
  const { isModalOpen, currentPermission, handleAllow, handleDeny } = usePermissions();

  useEffect(() => {
    const currentSettings = loadAppSettings();
    applyTheme(currentSettings.theme);
    applyLanguage(currentSettings.language);

    const handleSettingsChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const next = customEvent.detail || loadAppSettings();
      applyTheme(next.theme);
      applyLanguage(next.language);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key) {
        const next = loadAppSettings();
        applyTheme(next.theme);
        applyLanguage(next.language);
      }
    };

    window.addEventListener(SETTINGS_EVENT, handleSettingsChanged as EventListener);
    window.addEventListener('storage', handleStorage);

    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    let profileUnsub: Unsubscribe | null = null;

    const handleFirebaseUser = (fbUser: FirebaseUser | null) => {
      profileUnsub?.();
      profileUnsub = null;

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        // Utiliser onSnapshot pour écouter les changements en temps réel
        const usersDocRef = doc(db, 'users', fbUser.uid);
        const userDocRef = doc(db, 'user', fbUser.uid);

        const hasChosenType = (data: any | undefined) => {
          const resolvedType = resolveUserTypeFromData(data);
          if (resolvedType === UserType.ADMIN) return true;
          const validType = hasExplicitUserType(data);
          if (!validType || data?.needsProfileType === true) return false;
          const legacyTemporaryVisitor = resolvedType === UserType.VISITOR && (data?.statut === 'no' || data?.etat === 'nv');
          return !legacyTemporaryVisitor;
        };

        const mapProfile = (data: any | undefined): UserProfile => ({
          uid: fbUser.uid,
          email: fbUser.email || data?.email || '',
          displayName: data?.displayName || data?.display_name || fbUser.displayName || fbUser.email || '',
          type: resolveUserTypeFromData(data),
          role: data?.role || (resolveUserTypeFromData(data) === UserType.ADMIN ? 'admin' : undefined),
          isAdmin: resolveUserTypeFromData(data) === UserType.ADMIN || data?.isAdmin === true || data?.admin === true,
          needsProfileType: !hasChosenType(data),
          country: data?.country || data?.pays || '',
          city: data?.city || data?.ville || '',
          avatarUrl: data?.avatarUrl || data?.photoUrl || data?.photo_url || data?.avatar_url || fbUser.photoURL || undefined,
          sport: data?.sport || data?.sporttype || data?.sport_type || undefined,
          position: data?.position || data?.poste || undefined,
          height: data?.height || data?.taille || undefined,
          weight: data?.weight || data?.poids || undefined,
          stats: {
            matchesPlayed: data?.stats?.matchesPlayed || data?.matchesPlayed || data?.matches_played || 0,
            goals: data?.stats?.goals || data?.goals || data?.buts || 0,
            assists: data?.stats?.assists || data?.assists || data?.passes || 0
          }
        });

        profileUnsub = onSnapshot(
          usersDocRef,
          async (snap) => {
            try {
              let data = snap.data() as any | undefined;
              if (!data) {
                const legacySnap = await getDoc(userDocRef);
                data = legacySnap.data() as any | undefined;

                if (data) {
                  void setDoc(usersDocRef, {
                    ...data,
                    migratedFrom: 'user',
                    updatedAt: serverTimestamp()
                  }, { merge: true }).catch((error) => {
                    console.warn('Migration douce user -> users impossible:', error);
                  });
                }
              }

              if (!data) {
                const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilisateur';
                data = {
                  email: fbUser.email || '',
                  displayName,
                  avatarUrl: fbUser.photoURL || '',
                  photoUrl: fbUser.photoURL || '',
                  authProvider: fbUser.providerData[0]?.providerId || 'firebase',
                  needsProfileType: true,
                  statut: 'no',
                  etat: 'nv'
                };

                try {
                  await setDoc(usersDocRef, {
                    ...data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                } catch (profileWriteError) {
                  console.warn('Création du profil utilisateur différée:', profileWriteError);
                }
              }

              console.log('🔍 Données Firebase brutes:', data);

              const profile: UserProfile = mapProfile(data);

              console.log('✅ Profil mappé:', profile);
              console.log('📸 Avatar URL:', profile.avatarUrl);
              console.log('🏃 Sport:', profile.sport);
              console.log('📍 Position:', profile.position);
              console.log('🌍 Pays:', profile.country);

              setUser(profile);
              setLoading(false);
            } catch (profileError) {
              console.error('❌ Erreur chargement profil utilisateur:', profileError);
              setUser(mapProfile({
                email: fbUser.email || '',
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilisateur',
                avatarUrl: fbUser.photoURL || '',
                photoUrl: fbUser.photoURL || '',
                needsProfileType: true
              }));
              setLoading(false);
            }
          },
          (snapshotError) => {
            console.error('❌ Erreur écoute profil utilisateur:', snapshotError);
            setUser(mapProfile({
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilisateur',
              avatarUrl: fbUser.photoURL || '',
              photoUrl: fbUser.photoURL || '',
              needsProfileType: true
            }));
            setLoading(false);
          }
        );

      } catch (e) {
        console.error('❌ Erreur chargement profil utilisateur:', e);
        setUser(null);
        setLoading(false);
      }
    };

    const authUnsub = onAuthStateChanged(auth, handleFirebaseUser);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleSettingsChanged as EventListener);
      window.removeEventListener('storage', handleStorage);
      authUnsub();
      profileUnsub?.();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    seenNotificationIdsRef.current = new Set();

    void ensureBrowserNotificationPermission();
    const unsub = listenUserNotifications(user.uid, (items) => {
      items.forEach((item) => {
        if (seenNotificationIdsRef.current.has(item.id)) return;
        seenNotificationIdsRef.current.add(item.id);
        if (!item.read) {
          notifyBrowser(item.title, item.body);
        }
      });
    });

    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const handleFeedClearView = (event: Event) => {
      const customEvent = event as CustomEvent<{ hidden?: boolean }>;
      setFeedClearView(Boolean(customEvent.detail?.hidden));
    };

    window.addEventListener('chooseme:feed-clear-view', handleFeedClearView as EventListener);
    return () => {
      window.removeEventListener('chooseme:feed-clear-view', handleFeedClearView as EventListener);
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== '/home') {
      setFeedClearView(false);
    }
  }, [location.pathname]);

  const handleSelectType = (type: UserType) => {
    // utilisé temporairement pendant l'onboarding avant création du compte Firebase
    try {
      sessionStorage.setItem(ONBOARDING_TYPE_KEY, type);
    } catch {
      // Le state React suffit si le stockage session n'est pas disponible.
    }
    setSelectedOnboardingType(type);
  };

  const handleLogin = () => {
    // l'état utilisateur est maintenant géré par Firebase (onAuthStateChanged)
  };

  if (loading) return <SplashPage />;

  const hideNavOn = ['/onboarding', '/login', '/onboarding/type', '/onboarding/register', '/splash', '/create-content', '/video-description', '/record-performance', '/settings', '/settings/become-athlete'];
  const hideNavByPrefix: string[] = [];
  const isOnboardingPath = location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/');
  const showNav =
    Boolean(user) &&
    !hideNavOn.includes(location.pathname) &&
    !hideNavByPrefix.some((prefix) => location.pathname.startsWith(prefix)) &&
    location.pathname !== '/' &&
    !feedClearView;
  const navigationUserType = user && isAdminProfile(user) ? UserType.ADMIN : user?.type;

  const RequireAuth: React.FC<{ children: React.ReactNode; allowIncompleteProfile?: boolean }> = ({ children, allowIncompleteProfile = false }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.needsProfileType && !allowIncompleteProfile) return <Navigate to="/onboarding/type" replace />;
    return <>{children}</>;
  };

  const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (!isAdminProfile(user)) return <Navigate to="/home" replace />;
    return <>{children}</>;
  };

  return (
    <DeviceMockup showNav={showNav} userType={navigationUserType}>
      {currentPermission && (
        <PermissionModal
          isOpen={isModalOpen}
          title={currentPermission.title}
          description={currentPermission.description}
          icon={currentPermission.icon}
          onAllow={handleAllow}
          onDeny={handleDeny}
        />
      )}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={user ? <Navigate to={user.needsProfileType ? '/onboarding/type' : '/home'} replace /> : <ModernOnboardingPage />} />
        <Route path="/onboarding/register" element={user ? <Navigate to={user.needsProfileType ? '/onboarding/type' : '/home'} replace /> : <OnboardingCreateAccountPage selectedType={selectedOnboardingType} />} />
        <Route path="/onboarding/type" element={user && !user.needsProfileType ? <Navigate to="/home" replace /> : <OnboardingChooseTypePage onSelect={handleSelectType} />} />
        <Route path="/login" element={user ? <Navigate to={user.needsProfileType ? '/onboarding/type' : '/home'} replace /> : <LoginPage onLogin={handleLogin} />} />
        
        <Route path="/home" element={<RequireAuth><DashboardRouter userType={user?.type || UserType.VISITOR} /></RequireAuth>} />
        <Route path="/dashboard/athlete" element={<RequireAuth><AthleteDashboard /></RequireAuth>} />
        <Route path="/dashboard/recruiter" element={<RequireAuth><RecruiterDashboard /></RequireAuth>} />
        <Route path="/dashboard/club" element={<RequireAuth><ClubDashboard /></RequireAuth>} />
        <Route path="/dashboard/press" element={<RequireAuth>{user ? <PressDashboard user={user} /> : null}</RequireAuth>} />
        <Route path="/explorer" element={<RequireAuth><ExplorerPage userType={user?.type || UserType.VISITOR} /></RequireAuth>} />
        <Route path="/explorer/reportage/:id" element={<ReportageDetailPage />} />
        <Route path="/create-content" element={<RequireAuth>{!isAdminProfile(user) && user?.type === UserType.PRESS ? <Navigate to="/dashboard/press" replace /> : <CreateContentPage userType={navigationUserType || UserType.VISITOR} />}</RequireAuth>} />
        <Route path="/video-description" element={<RequireAuth><VideoDescriptionPage /></RequireAuth>} />
        <Route path="/record-performance" element={<RequireAuth><PerformanceRecordingPage userType={user?.type || UserType.VISITOR} /></RequireAuth>} />
        <Route path="/live-match" element={<LiveMatchesPage />} />
        <Route path="/live-match/:id" element={<MatchDetailPage />} />
        <Route path="/my-predictions" element={<RequireAuth><MyPredictionsPage /></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
        <Route path="/messages/:conversationId" element={<RequireAuth><MessagesPage /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/wallet" element={<RequireAuth><WalletPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth>{user ? <ProfileViewPage user={user} /> : null}</RequireAuth>} />
        <Route path="/profile/edit" element={<RequireAuth>{user ? <ProfileEditPage user={user} /> : null}</RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/settings/become-athlete" element={<RequireAuth><BecomeAthletePage /></RequireAuth>} />
        <Route path="/athlete/:athleteId" element={<AthletePublicProfilePage viewerType={user?.type} />} />
        <Route path="/video/:videoId" element={<SharedVideoPage />} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
        
        <Route path="*" element={<Navigate to={user ? '/home' : '/onboarding'} replace />} />
      </Routes>
      <PwaInstallBanner hasBottomNav={showNav} isOnboarding={isOnboardingPath} />
    </DeviceMockup>
  );
};

const Root: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default Root;
