
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
import BottomNav from './components/BottomNav';
import PermissionModal from './components/PermissionModal';
import { UserType, UserProfile, normalizeUserType } from './types';
import { MOCK_USER } from './constants';
import { getFirebaseAuth, getFirestoreDb } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { usePermissions } from './hooks/usePermissions';
import { applyLanguage, applyTheme, loadAppSettings, SETTINGS_EVENT } from './services/appSettingsService';
import { ensureBrowserNotificationPermission, listenUserNotifications, notifyBrowser } from './services/notificationService';

const DeviceMockup: React.FC<{ children: React.ReactNode, showNav: boolean, userType?: UserType }> = ({ children, showNav, userType }) => {
  return (
    <div className="h-[100dvh] bg-[#050505] flex flex-col font-sans overflow-hidden">
      <div className={`flex-1 min-h-0 overflow-y-auto relative custom-scrollbar bg-[#050505] ${showNav ? 'pb-24' : ''}`}>
        {children}
      </div>
      {showNav && <BottomNav userType={userType || UserType.ATHLETE} />}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedOnboardingType, setSelectedOnboardingType] = useState<UserType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
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

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        // Utiliser onSnapshot pour écouter les changements en temps réel
        const usersDocRef = doc(db, 'users', fbUser.uid);
        const userDocRef = doc(db, 'user', fbUser.uid);

        const mapProfile = (data: any | undefined): UserProfile => ({
          uid: fbUser.uid,
          email: fbUser.email || data?.email || '',
          displayName: data?.displayName || data?.display_name || fbUser.displayName || fbUser.email || '',
          type: normalizeUserType(data?.type, UserType.VISITOR),
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

        const unsubscribeSnapshot = onSnapshot(usersDocRef, async (snap) => {
          let data = snap.data() as any | undefined;
          if (!data) {
            const legacySnap = await getDoc(userDocRef);
            data = legacySnap.data() as any | undefined;
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
        });

        return () => unsubscribeSnapshot();
      } catch (e) {
        console.error('❌ Erreur chargement profil utilisateur:', e);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleSettingsChanged as EventListener);
      window.removeEventListener('storage', handleStorage);
      unsub();
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

  const handleSelectType = (type: UserType) => {
    // utilisé temporairement pendant l'onboarding avant création du compte Firebase
    setSelectedOnboardingType(type);
  };

  const handleLogin = () => {
    // l'état utilisateur est maintenant géré par Firebase (onAuthStateChanged)
  };

  if (loading) return <SplashPage />;

  const hideNavOn = ['/onboarding', '/login', '/onboarding/type', '/onboarding/register', '/splash', '/video-description', '/record-performance', '/settings', '/settings/become-athlete'];
  const hideNavByPrefix: string[] = [];
  const showNav =
    !hideNavOn.includes(location.pathname) &&
    !hideNavByPrefix.some((prefix) => location.pathname.startsWith(prefix)) &&
    location.pathname !== '/';

  return (
    <DeviceMockup showNav={showNav} userType={user?.type}>
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
        <Route path="/onboarding" element={user ? <Navigate to="/home" replace /> : <ModernOnboardingPage />} />
        <Route path="/onboarding/register" element={<OnboardingCreateAccountPage selectedType={selectedOnboardingType} />} />
        <Route path="/onboarding/type" element={<OnboardingChooseTypePage onSelect={handleSelectType} />} />
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage onLogin={handleLogin} />} />
        
        <Route path="/home" element={<DashboardRouter userType={user?.type || UserType.ATHLETE} />} />
        <Route path="/dashboard/athlete" element={<AthleteDashboard />} />
        <Route path="/dashboard/recruiter" element={<RecruiterDashboard />} />
        <Route path="/dashboard/press" element={<PressDashboard />} />
        <Route path="/explorer" element={<ExplorerPage userType={user?.type || UserType.ATHLETE} />} />
        <Route path="/explorer/reportage/:id" element={<ReportageDetailPage />} />
        <Route path="/create-content" element={<CreateContentPage userType={user?.type || UserType.ATHLETE} />} />
        <Route path="/video-description" element={<VideoDescriptionPage />} />
        <Route path="/record-performance" element={<PerformanceRecordingPage userType={user?.type || UserType.ATHLETE} />} />
        <Route path="/live-match" element={<LiveMatchesPage />} />
        <Route path="/live-match/:id" element={<MatchDetailPage />} />
        <Route path="/my-predictions" element={<MyPredictionsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/profile" element={<ProfileViewPage user={user || MOCK_USER} />} />
        <Route path="/profile/edit" element={<ProfileEditPage user={user || MOCK_USER} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/become-athlete" element={<BecomeAthletePage />} />
        <Route path="/athlete/:athleteId" element={<AthletePublicProfilePage viewerType={user?.type} />} />
        <Route path="/video/:videoId" element={<SharedVideoPage />} />
        
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </DeviceMockup>
  );
};

const Root: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default Root;
