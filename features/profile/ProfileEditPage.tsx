
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Check, Loader, X } from 'lucide-react';
import { UserProfile, UserType } from '../../types';
import Button from '../../components/Button';
import { getFirebaseAuth, getFirestoreDb } from '../../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { uploadProfileImage } from '../../services/imageUploadService';
import { SPORTS_POSITIONS, MAJOR_CITIES } from '../../utils/sportsData';
import { getPhoneCountries } from '../../utils/phoneCountries';

const ProfileEditPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(user.displayName || '');
  const [country, setCountry] = useState(user.country || '');
  const [city, setCity] = useState('');
  const [sport, setSport] = useState(user.sport || '');
  const [position, setPosition] = useState(user.position || '');
  const [height, setHeight] = useState(user.height?.toString() || '');
  const [weight, setWeight] = useState(user.weight?.toString() || '');
  const [matchesPlayed, setMatchesPlayed] = useState(user.stats?.matchesPlayed?.toString() || '');
  const [goals, setGoals] = useState(user.stats?.goals?.toString() || '');
  const [assists, setAssists] = useState(user.stats?.assists?.toString() || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [positionSearch, setPositionSearch] = useState('');

  // Get phone countries
  const phoneCountries = getPhoneCountries();

  // Get available cities for selected country
  const availableCities = country ? (MAJOR_CITIES[country] || []) : [];
  const filteredCities = availableCities.filter(c => 
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Get available positions for selected sport
  const availablePositions = sport ? (SPORTS_POSITIONS[sport] || []) : [];
  const filteredPositions = availablePositions.filter(p =>
    p.toLowerCase().includes(positionSearch.toLowerCase())
  );

  // Filter countries
  const filteredCountries = phoneCountries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    if (!country) {
      setError('Le pays est requis');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError('Utilisateur non authentifié');
        setSaving(false);
        return;
      }

      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        setUploading(true);
        try {
          finalAvatarUrl = await uploadProfileImage(avatarFile, currentUser.uid);
        } catch (e) {
          setError('Erreur lors de l\'upload de la photo');
          setSaving(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const userRef = doc(db, 'users', currentUser.uid);
      
      const updateData: any = {
        displayName: name.trim(),
        country: country || null,
        city: city || null,
        sport: sport || null,
        position: position || null,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
        photoUrl: finalAvatarUrl || null,
      };

      // Update stats
      if (matchesPlayed || goals || assists) {
        updateData.stats = {
          matchesPlayed: matchesPlayed ? parseInt(matchesPlayed) : 0,
          goals: goals ? parseInt(goals) : 0,
          assists: assists ? parseInt(assists) : 0,
        };
      }

      await updateDoc(userRef, updateData);
      
      setSuccess(true);
      
      // Force refresh des données utilisateur en relisant depuis Firestore
      setTimeout(async () => {
        try {
          const updatedSnap = await getDoc(userRef);
          const updatedData = updatedSnap.data() as any;
          console.log('Données mises à jour:', updatedData);
        } catch (e) {
          console.error('Erreur lors du refresh:', e);
        }
        navigate('/profile');
      }, 1500);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde:', e);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <header className="flex items-center justify-between mb-10 pt-4">
         <button onClick={() => navigate(-1)} className="text-white/60">
            <ChevronLeft size={32} />
         </button>
         <h1 className="text-xl font-readex font-bold text-white">Modifier Profil</h1>
         <div className="w-8" />
      </header>

      {/* Avatar Upload Section */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative group">
          <img 
            src={previewUrl || 'https://via.placeholder.com/128?text=No+Photo'} 
            className="w-32 h-32 rounded-[2.5rem] border-4 border-white/5 object-cover" 
            alt="Edit Avatar"
          />
          <label className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
             <Camera size={32} className="text-white" />
             <input 
               type="file" 
               accept="image/*" 
               onChange={handleAvatarChange}
               className="hidden"
             />
          </label>
        </div>
        <p className="mt-4 text-[#19DB8A] text-sm font-bold uppercase tracking-widest">
          {avatarFile ? 'Photo sélectionnée' : 'Cliquer pour changer'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <X size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-[#19DB8A]/10 border border-[#19DB8A]/30 rounded-2xl p-4 mb-6">
          <p className="text-[#19DB8A] text-sm font-semibold">Profil mis à jour avec succès!</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6 mb-8">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Nom Complet *</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom complet"
            className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-[#19DB8A]"
          />
        </div>

        {/* Country Dropdown */}
        <div className="space-y-2 relative">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Pays *</label>
          <button
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 text-white text-left flex items-center justify-between focus:outline-none focus:border-[#19DB8A]"
          >
            <span>{country || 'Sélectionner un pays'}</span>
            <svg className={`w-5 h-5 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          
          {showCountryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/5 rounded-2xl z-50 shadow-xl">
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full bg-[#050505] border-b border-white/5 rounded-t-2xl p-3 text-white placeholder-white/20 focus:outline-none"
              />
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {filteredCountries.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setCountry(c.name);
                      setCity('');
                      setCitySearch('');
                      setShowCountryDropdown(false);
                      setCountrySearch('');
                    }}
                    className="w-full text-left px-4 py-3 text-white hover:bg-white/5 border-b border-white/5 last:border-b-0 flex items-center gap-2"
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* City Dropdown */}
        {country && availableCities.length > 0 && (
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Ville</label>
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 text-white text-left flex items-center justify-between focus:outline-none focus:border-[#19DB8A]"
            >
              <span>{city || 'Sélectionner une ville'}</span>
              <svg className={`w-5 h-5 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            
            {showCityDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/5 rounded-2xl z-50 shadow-xl">
                <input
                  type="text"
                  placeholder="Rechercher une ville..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full bg-[#050505] border-b border-white/5 rounded-t-2xl p-3 text-white placeholder-white/20 focus:outline-none"
                />
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        setShowCityDropdown(false);
                        setCitySearch('');
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-white/5 border-b border-white/5 last:border-b-0"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sport */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Sport Principal</label>
          <select 
            value={sport}
            onChange={(e) => {
              setSport(e.target.value);
              setPosition('');
              setPositionSearch('');
            }}
            className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 text-white appearance-none focus:outline-none focus:border-[#19DB8A]"
          >
            <option value="">Sélectionner un sport</option>
            {Object.keys(SPORTS_POSITIONS).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Position Dropdown */}
        {sport && availablePositions.length > 0 && (
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Poste / Spécialité</label>
            <button
              onClick={() => setShowPositionDropdown(!showPositionDropdown)}
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 text-white text-left flex items-center justify-between focus:outline-none focus:border-[#19DB8A]"
            >
              <span>{position || 'Sélectionner un poste'}</span>
              <svg className={`w-5 h-5 transition-transform ${showPositionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            
            {showPositionDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/5 rounded-2xl z-50 shadow-xl">
                <input
                  type="text"
                  placeholder="Rechercher un poste..."
                  value={positionSearch}
                  onChange={(e) => setPositionSearch(e.target.value)}
                  className="w-full bg-[#050505] border-b border-white/5 rounded-t-2xl p-3 text-white placeholder-white/20 focus:outline-none"
                />
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {filteredPositions.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPosition(p);
                        setShowPositionDropdown(false);
                        setPositionSearch('');
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-white/5 border-b border-white/5 last:border-b-0"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Physical Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Taille (cm)</label>
            <input 
              type="number" 
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Ex: 180"
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-[#19DB8A]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Poids (kg)</label>
            <input 
              type="number" 
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 75"
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-[#19DB8A]"
            />
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Statistiques de Performance</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Matchs</label>
              <input 
                type="number" 
                value={matchesPlayed}
                onChange={(e) => setMatchesPlayed(e.target.value)}
                placeholder="0"
                className="w-full bg-[#050505] border border-white/5 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-[#19DB8A] text-center"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Buts</label>
              <input 
                type="number" 
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="0"
                className="w-full bg-[#050505] border border-white/5 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-[#19DB8A] text-center"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Passes</label>
              <input 
                type="number" 
                value={assists}
                onChange={(e) => setAssists(e.target.value)}
                placeholder="0"
                className="w-full bg-[#050505] border border-white/5 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-[#19DB8A] text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Buttons */}
      <div className="flex gap-3 fixed bottom-6 left-6 right-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex-1 py-4 bg-[#0A0A0A] border border-white/5 rounded-2xl text-white font-bold hover:bg-[#0A0A0A]/80 transition-colors"
        >
          Annuler
        </button>
        <button 
          onClick={handleSave}
          disabled={saving || uploading}
          className="flex-1 py-4 bg-[#19DB8A] rounded-2xl text-black font-bold hover:bg-[#19DB8A]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving || uploading ? (
            <>
              <Loader size={18} className="animate-spin" />
              {uploading ? 'Upload...' : 'Enregistrement...'}
            </>
          ) : (
            <>
              <Check size={18} />
              Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Spacer for fixed buttons */}
      <div className="h-20" />
    </div>
  );
};

export default ProfileEditPage;
