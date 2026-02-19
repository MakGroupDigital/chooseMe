import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, MapPin } from 'lucide-react';
import { getFirestoreDb, useAuth } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { MAJOR_CITIES, SPORTS_POSITIONS } from '../../utils/sportsData';
import { UserType } from '../../types';
import { getPhoneCountries } from '../../utils/phoneCountries';
import { getCitiesByCountry } from '../../services/cityService';

const BecomeAthletePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentType, setCurrentType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [form, setForm] = useState({
    sport: '',
    position: '',
    country: '',
    city: '',
    height: '',
    weight: '',
  });

  const phoneCountries = getPhoneCountries();
  const availablePositions = form.sport ? (SPORTS_POSITIONS[form.sport] || []) : [];
  const availableCities = cityOptions;

  useEffect(() => {
    let active = true;
    const loadCities = async () => {
      if (!form.country) {
        setCityOptions([]);
        return;
      }
      setLoadingCities(true);
      const cities = await getCitiesByCountry(form.country, MAJOR_CITIES[form.country] || []);
      if (active) {
        setCityOptions(cities);
      }
      setLoadingCities(false);
    };

    loadCities();
    return () => {
      active = false;
    };
  }, [form.country]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }
      try {
        const db = getFirestoreDb();
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        const data = snap.data() as any;
        if (data) {
          setCurrentType(data.type || '');
          setForm({
            sport: data.sport || data.sporttype || '',
            position: data.position || data.poste || '',
            country: data.country || data.pays || '',
            city: data.city || data.ville || '',
            height: data.height ? String(data.height) : '',
            weight: data.weight ? String(data.weight) : '',
          });
        }
      } catch (e) {
        console.error('Erreur chargement profil:', e);
        setError('Impossible de charger vos informations.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?.uid]);

  const handleSubmit = async () => {
    if (!currentUser?.uid) return;
    if (!form.sport || !form.position || !form.country) {
      setError('Sport, poste et pays sont obligatoires.');
      setSuccess(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const db = getFirestoreDb();
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          type: UserType.ATHLETE,
          sport: form.sport,
          position: form.position,
          country: form.country,
          city: form.city || null,
          height: form.height ? parseInt(form.height, 10) : null,
          weight: form.weight ? parseInt(form.weight, 10) : null,
          statut: 'ok',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setSuccess('Compte converti en athlète. Redirection...');
      setCurrentType(UserType.ATHLETE);
      setTimeout(() => navigate('/profile'), 800);
    } catch (e) {
      console.error('Erreur conversion athlète:', e);
      setError('Impossible de convertir le compte pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#208050] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      <header className="p-6 pt-10 bg-gradient-to-b from-[#208050]/20 to-transparent">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-2 rounded-full bg-white/10 text-white">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy size={22} className="text-[#19DB8A]" />
            Devenir Athlète
          </h1>
        </div>
      </header>

      <div className="px-6">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-4 space-y-3">
          {currentType === UserType.ATHLETE && (
            <div className="py-3 px-3 bg-[#111111] rounded-2xl border border-[#19DB8A]/30 text-[#19DB8A] text-sm font-semibold">
              Ton compte est déjà en mode athlète. Tu peux publier des vidéos depuis "Perfs".
            </div>
          )}

          <SimpleSelect
            icon={<Trophy size={16} />}
            label="Sport"
            value={form.sport}
            options={Object.keys(SPORTS_POSITIONS).map((sport) => ({ label: sport, value: sport }))}
            onChange={(value) => setForm((prev) => ({ ...prev, sport: value, position: '' }))}
          />
          <SimpleSelect
            icon={<Trophy size={16} />}
            label="Poste / Spécialité"
            value={form.position}
            options={availablePositions.map((position) => ({ label: position, value: position }))}
            onChange={(value) => setForm((prev) => ({ ...prev, position: value }))}
          />
          <SimpleSelect
            icon={<MapPin size={16} />}
            label="Pays"
            value={form.country}
            options={phoneCountries.map((country) => ({ label: `${country.flag} ${country.name}`, value: country.name }))}
            onChange={(value) => setForm((prev) => ({ ...prev, country: value, city: '' }))}
          />
          <SimpleSelect
            icon={<MapPin size={16} />}
            label="Ville"
            value={form.city}
            options={availableCities.map((city) => ({ label: city, value: city }))}
            onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
            allowFreeInput
            placeholder={loadingCities ? 'Chargement des villes...' : 'Sélectionner ou saisir'}
          />
          <div className="grid grid-cols-2 gap-2">
            <SimpleInput
              icon={<Trophy size={16} />}
              label="Taille (cm)"
              value={form.height}
              onChange={(value) => setForm((prev) => ({ ...prev, height: value }))}
              type="number"
            />
            <SimpleInput
              icon={<Trophy size={16} />}
              label="Poids (kg)"
              value={form.weight}
              onChange={(value) => setForm((prev) => ({ ...prev, weight: value }))}
              type="number"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-[#19DB8A] text-xs">{success}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-[#19DB8A] text-black font-semibold rounded-2xl disabled:opacity-60"
          >
            {submitting ? 'Activation...' : 'Activer mon profil athlète'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SimpleInput: React.FC<{ icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ icon, label, value, onChange, type = 'text' }) => (
  <div className="py-3 px-3 bg-[#111111] rounded-2xl border border-white/5">
    <label className="text-xs text-white/50 mb-1 flex items-center gap-2">
      <span className="text-[#19DB8A]">{icon}</span>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-white text-sm outline-none"
    />
  </div>
);

const SimpleSelect: React.FC<{ icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; options: Array<{ label: string; value: string }>; placeholder?: string; allowFreeInput?: boolean }> = ({ icon, label, value, onChange, options, placeholder = 'Sélectionner', allowFreeInput = false }) => (
  <div className="py-3 px-3 bg-[#111111] rounded-2xl border border-white/5">
    <label className="text-xs text-white/50 mb-1 flex items-center gap-2">
      <span className="text-[#19DB8A]">{icon}</span>
      {label}
    </label>
    {allowFreeInput ? (
      <>
        <input
          type="text"
          list={`datalist-${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white text-sm outline-none"
        />
        <datalist id={`datalist-${label}`}>
          {options.map((option) => (
            <option key={option.value} value={option.value} />
          ))}
        </datalist>
      </>
    ) : (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-white text-sm outline-none"
      >
        <option value="" className="bg-[#111111]">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#111111]">
            {option.label}
          </option>
        ))}
      </select>
    )}
  </div>
);

export default BecomeAthletePage;
