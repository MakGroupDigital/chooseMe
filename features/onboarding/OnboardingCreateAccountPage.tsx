
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Globe, ChevronLeft, Search } from 'lucide-react';
import Button from '../../components/Button';
import { UserType } from '../../types';
import { getFirebaseAuth, getFirestoreDb } from '../../services/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getPhoneCountries, Country } from '../../utils/phoneCountries';

interface Props {
  selectedType?: UserType | null;
}

const OnboardingCreateAccountPage: React.FC<Props> = ({ selectedType }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'SN', // Sénégal par défaut
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const countries = useMemo(() => getPhoneCountries(), []);
  const selectedCountry = useMemo(() => 
    countries.find(c => c.code === formData.country),
    [formData.country, countries]
  );

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    return countries.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch)
    );
  }, [countrySearch, countries]);

  const createUserProfile = async (uid: string, email: string, displayName: string, photoUrl?: string) => {
    const db = getFirestoreDb();
    await setDoc(doc(db, 'users', uid), {
      email: email.trim(),
      displayName: displayName.trim(),
      phoneNumber: formData.phone.trim(),
      pays: formData.country,
      type: UserType.VISITOR, // Type temporaire, sera défini après choix du profil
      statut: 'no',
      etat: 'nv',
      photoUrl: photoUrl,
      createdAt: serverTimestamp()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!formData.terms) {
      setError('Vous devez accepter les conditions générales.');
      return;
    }

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      const uid = cred.user.uid;
      await createUserProfile(uid, formData.email, formData.name);
      
      // Rediriger vers le choix du profil
      navigate('/onboarding/type');
    } catch (err: any) {
      const message =
        err?.code === 'auth/email-already-in-use'
          ? 'Un compte existe déjà avec cet email.'
          : 'Impossible de créer votre compte pour le moment.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const uid = result.user.uid;
      const email = result.user.email || '';
      const displayName = result.user.displayName || email.split('@')[0];
      const photoUrl = result.user.photoURL || undefined;

      // Vérifier si l'utilisateur existe déjà
      const db = getFirestoreDb();
      const { doc, getDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Créer le profil utilisateur pour un nouvel utilisateur
        console.log('🆕 Première inscription Google - Création du profil');
        await createUserProfile(uid, email, displayName, photoUrl);
        // Rediriger vers le choix du profil
        navigate('/onboarding/type');
      } else {
        // Utilisateur existant qui essaie de s'inscrire à nouveau
        console.log('✅ Utilisateur existant - Redirection vers accueil');
        navigate('/home');
      }
    } catch (err: any) {
      console.error('❌ Erreur inscription Google:', err);
      setError('Impossible de créer un compte avec Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 flex flex-col">
      <button onClick={() => navigate(-1)} className="mt-8 mb-6 text-white/50 hover:text-white">
        <ChevronLeft size={32} />
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-readex font-bold text-white">Créer un compte</h1>
        <p className="text-white/40 mt-1">Rejoignez la communauté Choose-Me</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/50 ml-1 uppercase text-[10px] tracking-widest">Nom Complet</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="text"
              required
              placeholder="Ex: Ismael Diallo"
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#19DB8A]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-white/50 ml-1 uppercase text-[10px] tracking-widest">Pays</label>
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#19DB8A] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Globe className="absolute left-4 text-white/30" size={18} />
                <span>{selectedCountry?.flag} {selectedCountry?.name}</span>
              </div>
            </button>
            
            {showCountryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-2xl z-50 max-h-64 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-white/10">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div className="overflow-y-auto custom-scrollbar">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, country: country.code });
                        setShowCountryDropdown(false);
                        setCountrySearch('');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                    >
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                      <span className="text-white/40 ml-auto">{country.dialCode}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/50 ml-1 uppercase text-[10px] tracking-widest">Téléphone</label>
            <div className="relative flex">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-sm font-medium">
                {selectedCountry?.dialCode}
              </div>
              <input
                type="tel"
                placeholder="77 000 00 00"
                className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl py-4 pl-24 pr-4 text-white focus:outline-none focus:border-[#19DB8A]"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/50 ml-1 uppercase text-[10px] tracking-widest">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="email"
              required
              placeholder="nom@email.com"
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#19DB8A]"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/50 ml-1 uppercase text-[10px] tracking-widest">Mot de Passe</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#19DB8A]"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
           <input 
              type="checkbox" 
              className="w-5 h-5 rounded-lg border-white/10 bg-[#0A0A0A] text-[#19DB8A] focus:ring-[#19DB8A]" 
              checked={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
           />
           <span className="text-xs text-white/40">J'accepte les conditions générales d'utilisation.</span>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" disabled={!formData.terms || loading} className="w-full py-4 mt-4">
          {loading ? 'Création du compte...' : 'Créer mon compte'}
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
          onClick={handleGoogleSignUp}
          className="w-full py-4 border border-white/10"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          S'inscrire avec Google
        </Button>
      </form>
    </div>
  );
};

export default OnboardingCreateAccountPage;
