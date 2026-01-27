
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { Mail, Lock, LogIn, ChevronLeft } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseAuth } from '../../services/firebase';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onLogin();
      navigate('/home');
    } catch (err: any) {
      const message =
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password'
          ? 'Email ou mot de passe incorrect.'
          : 'Impossible de vous connecter pour le moment.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔵 Début connexion Google...');
      const auth = getFirebaseAuth();
      console.log('✅ Auth instance récupérée');
      const provider = new GoogleAuthProvider();
      console.log('✅ Provider Google créé');
      console.log('🔵 Ouverture popup Google...');
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Popup fermée, résultat:', result.user.email);
      
      // Créer ou mettre à jour le document utilisateur dans Firestore
      const { getFirestoreDb } = await import('../../services/firebase');
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const userRef = doc(db, 'users', result.user.uid);
      
      // Vérifier si le document existe déjà
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Créer le document pour un nouvel utilisateur
        console.log('🆕 Première connexion - Création du document utilisateur pour:', result.user.email);
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Utilisateur',
          photoUrl: result.user.photoURL,
          type: 'visitor', // Type temporaire
          statut: 'no',
          etat: 'nv',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Document créé - Redirection vers choix du profil');
        onLogin();
        // Rediriger vers le choix du type de profil pour les nouveaux utilisateurs
        navigate('/onboarding/type');
      } else {
        console.log('✅ Utilisateur existant - Connexion directe');
        onLogin();
        // Rediriger vers l'accueil pour les utilisateurs existants
        navigate('/home');
      }
    } catch (err: any) {
      console.error('❌ Erreur connexion Google:', err);
      console.error('Code erreur:', err.code);
      console.error('Message:', err.message);
      
      let errorMessage = 'Impossible de vous connecter avec Google.';
      if (err.code === 'auth/popup-blocked') {
        errorMessage = 'La popup a été bloquée. Autorisez les popups pour ce site.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Connexion annulée.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domaine non autorisé. Contactez l\'administrateur.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-[#208050] opacity-20 blur-[120px]" />
      <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 bg-[#FF8A3C] opacity-10 blur-[120px]" />

      <button onClick={() => navigate(-1)} className="absolute top-12 left-6 text-white/50 hover:text-white">
        <ChevronLeft size={32} />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-block p-4 rounded-3xl bg-gradient-to-tr from-[#208050] to-[#19DB8A] mb-6 shadow-xl shadow-green-900/20">
            <img 
              src="/assets/images/app_launcher_icon.png" 
              alt="Choose Me Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-readex font-bold text-white">Ravi de vous revoir</h1>
          <p className="text-white/40 mt-2">Connectez-vous pour continuer l'aventure</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#19DB8A] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1 flex justify-between">
              Mot de passe
              <button type="button" className="text-[#19DB8A] text-xs hover:underline">Oublié ?</button>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#19DB8A] transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center -mt-2">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full py-4 text-lg">
            <LogIn size={20} />
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#050505] text-white/40">ou</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="ghost" 
            disabled={loading} 
            onClick={handleGoogleLogin}
            className="w-full py-4 text-lg border border-white/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </Button>
        </form>

        <div className="mt-8 text-center text-white/40 text-sm">
          Pas encore membre ?{' '}
          <button onClick={() => navigate('/onboarding/type')} className="text-[#19DB8A] font-bold hover:underline">
            S'inscrire gratuitement
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
