
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Briefcase, Camera, Globe } from 'lucide-react';
import Button from '../../components/Button';
import { UserType } from '../../types';
import { getFirebaseAuth, getFirestoreDb } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const TYPES = [
  { id: UserType.ATHLETE, label: 'Athlète / Talent', icon: <User size={28} />, desc: 'Je veux me faire recruter' },
  { id: UserType.RECRUITER, label: 'Recruteur / Agent', icon: <Briefcase size={28} />, desc: 'Je recherche des talents' },
  { id: UserType.CLUB, label: 'Club Sportif', icon: <Shield size={28} />, desc: 'Je gère mon équipe' },
  { id: UserType.PRESS, label: 'Presse / Média', icon: <Camera size={28} />, desc: 'Je partage du contenu' },
  { id: UserType.VISITOR, label: 'Visiteur / Fan', icon: <Globe size={28} />, desc: 'Je veux juste suivre et jouer' },
];

const OnboardingChooseTypePage: React.FC<{ onSelect: (type: UserType) => void }> = ({ onSelect }) => {
  const [selected, setSelected] = useState<UserType | null>(null);
  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (!selected) return;

    try {
      // Mettre à jour le type d'utilisateur dans Firestore
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();
      const user = auth.currentUser;

      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          type: selected,
          statut: selected === UserType.VISITOR ? 'ok' : 'no',
          etat: selected === UserType.VISITOR ? 'ac' : 'nv'
        });
      }

      onSelect(selected);
      navigate('/home');
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 flex flex-col">
      <div className="mt-12 mb-8 text-center">
        <h1 className="text-3xl font-readex font-bold text-white">Quel est votre profil ?</h1>
        <p className="text-white/50 mt-2 italic">Choisissez votre rôle dans l'écosystème Choose-Me</p>
      </div>

      <div className="flex-1 space-y-4">
        {TYPES.map((type) => (
          <div
            key={type.id}
            onClick={() => setSelected(type.id)}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-5 ${
              selected === type.id 
                ? 'bg-[#208050]/10 border-[#19DB8A]' 
                : 'bg-[#0A0A0A] border-white/5 grayscale hover:grayscale-0'
            }`}
          >
            <div className={`p-3 rounded-xl ${selected === type.id ? 'bg-[#19DB8A] text-white' : 'bg-white/5 text-white/40'}`}>
              {type.icon}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{type.label}</h3>
              <p className="text-white/40 text-sm">{type.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button 
          disabled={!selected} 
          onClick={handleConfirm}
          className="w-full py-4"
        >
          Confirmer mon choix
        </Button>
      </div>
    </div>
  );
};

export default OnboardingChooseTypePage;
