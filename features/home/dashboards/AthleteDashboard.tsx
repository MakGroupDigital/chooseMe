import React from 'react';
import { Trophy, Target, TrendingUp, Calendar } from 'lucide-react';

const AthleteDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="mt-12 mb-8">
        <h1 className="text-3xl font-readex font-bold text-white">Mon Tableau de Bord</h1>
        <p className="text-white/50 mt-2">Athlète / Talent</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} className="text-[#19DB8A]" />
            <span className="text-white/60 text-sm">Profil Complété</span>
          </div>
          <p className="text-2xl font-bold text-white">65%</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} className="text-[#FF8A3C]" />
            <span className="text-white/60 text-sm">Vues du Profil</span>
          </div>
          <p className="text-2xl font-bold text-white">1.2K</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-[#208050]" />
            <span className="text-white/60 text-sm">Intérêt Recruteurs</span>
          </div>
          <p className="text-2xl font-bold text-white">8</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-[#19DB8A]" />
            <span className="text-white/60 text-sm">Matchs à Venir</span>
          </div>
          <p className="text-2xl font-bold text-white">3</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white mb-4">Actions Rapides</h2>
        <button className="w-full bg-[#208050] hover:bg-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Compléter mon Profil
        </button>
        <button className="w-full bg-[#0A0A0A] border border-white/10 hover:border-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Ajouter une Vidéo de Présentation
        </button>
        <button className="w-full bg-[#0A0A0A] border border-white/10 hover:border-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Voir les Offres
        </button>
      </div>
    </div>
  );
};

export default AthleteDashboard;
