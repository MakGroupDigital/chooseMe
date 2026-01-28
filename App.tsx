
import React, { useState, useEffect } from 'react';
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
import ProfileViewPage from './features/profile/ProfileViewPage';
import ProfileEditPage from './features/profile/ProfileEditPage';
import ExplorerPage from './features/explorer/ExplorerPage';
import ReportageDetailPage from './features/explorer/ReportageDetailPage';
import CreateContentPage from './features/content/CreateContentPage';
import SharedVideoPage from './features/content/SharedVideoPage';
import BottomNav from './components/BottomNav';
import { UserType, UserProfile } from './types';
import { MOCK_USER } from './constants';
import { getFirebaseAuth, getFirestoreDb } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const DeviceMockup: React.FC<{ children: React.ReactNode, showNav: boolean, userType?: UserType }> = ({ children, showNav, userType }) => {
  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-0 md:p-12 font-sans overflow-hidden">
      <div className="hidden md:block absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#208050] opacity-[0.08] blur-[200px] pointer-events-none animate-pulse" />
      <div className="hidden md:block absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#FF8A3C] opacity-[0.05] blur-[200px] pointer-events-none" />

      <div className="relative w-full h-screen md:w-[430px] md:h-[932px] md:max-h-[95vh] bg-black md:rounded-[60px] md:border-[10px] md:border-[#1c1c1e] md:shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] flex flex-col transition-all duration-700 select-none overflow-hidden border-zinc-800">
        
        <div className="hidden md:flex absolute top-4 left-0 right-0 h-10 items-center justify-center z-[100] pointer-events-none">
          <div className="w-[125px] h-8 bg-black rounded-[24px] flex items-center justify-end pr-5 shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-white/5">
             <div className="w-2 h-2 bg-[#0a0a0c] rounded-full mr-1 ring-1 ring-white/10 opacity-60 shadow-inner" />
          </div>
        </div>

        <div className="hidden md:flex absolute top-6 left-12 right-12 justify-between items-center text-[12px] font-bold text-white z-[90] pointer-events-none tracking-tight">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <svg width="18" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20a1 1 0 0 1-1-1v-4a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1zm5 0a1 1 0 0 1-1-1v-8a1 1 0 0 1 2 0v8a1 1 0 0 1-1 1zm5 0a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v16a1 1 0 0 1-1 1zM7 20a1 1 0 0 1-1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1-1 1z"/></svg>
            <div className="w-6 h-3 border border-white/30 rounded-sm relative flex items-center px-0.5">
              <div className="bg-white h-1.5 w-[80%] rounded-[1px]" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-[#050505] md:pt-12">
          {children}
        </div>

        {showNav && <BottomNav userType={userType || UserType.ATHLETE} />}

        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none z-[110]">
          <div className="w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
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
        const unsubscribeSnapshot = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
          const data = snap.data() as any | undefined;
          
          console.log('🔍 Données Firebase brutes:', data);

          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || data?.email || '',
            displayName: data?.displayName || data?.display_name || fbUser.displayName || fbUser.email || '',
            type: (data?.type as UserType) || UserType.VISITOR,
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
          };
          
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

    return () => unsub();
  }, []);

  const handleSelectType = (type: UserType) => {
    // utilisé temporairement pendant l'onboarding avant création du doc Firestore
    setUser({ ...(user || MOCK_USER), type });
  };

  const handleLogin = () => {
    // l'état utilisateur est maintenant géré par Firebase (onAuthStateChanged)
  };

  if (loading) return <SplashPage />;

  const hideNavOn = ['/onboarding', '/login', '/onboarding/type', '/onboarding/register', '/splash', '/create-content'];
  const showNav = !hideNavOn.includes(location.pathname) && location.pathname !== '/';

  return (
    <DeviceMockup showNav={showNav} userType={user?.type}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={user ? <Navigate to="/home" replace /> : <ModernOnboardingPage />} />
        <Route path="/onboarding/register" element={<OnboardingCreateAccountPage selectedType={user?.type} />} />
        <Route path="/onboarding/type" element={<OnboardingChooseTypePage onSelect={handleSelectType} />} />
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage onLogin={handleLogin} />} />
        
        <Route path="/home" element={<DashboardRouter userType={user?.type || UserType.ATHLETE} />} />
        <Route path="/dashboard/athlete" element={<AthleteDashboard />} />
        <Route path="/dashboard/recruiter" element={<RecruiterDashboard />} />
        <Route path="/dashboard/club" element={<ClubDashboard />} />
        <Route path="/dashboard/press" element={<PressDashboard />} />
        <Route path="/explorer" element={<ExplorerPage userType={user?.type || UserType.ATHLETE} />} />
        <Route path="/explorer/reportage/:id" element={<ReportageDetailPage />} />
        <Route path="/create-content" element={<CreateContentPage userType={user?.type || UserType.ATHLETE} />} />
        <Route path="/live-match" element={<LiveMatchesPage />} />
        <Route path="/live-match/:id" element={<MatchDetailPage />} />
        <Route path="/my-predictions" element={<MyPredictionsPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/profile" element={<ProfileViewPage user={user || MOCK_USER} />} />
        <Route path="/profile/edit" element={<ProfileEditPage user={user || MOCK_USER} />} />
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
