import React from 'react';
import { Users, Calendar, Trophy, Settings } from 'lucide-react';

const ClubDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="mt-12 mb-8">
        <h1 className="text-3xl font-readex font-bold text-white">Tableau de Bord Club</h1>
        <p className="text-white/50 mt-2">Club Sportif</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-[#19DB8A]" />
            <span className="text-white/60 text-sm">Effectif</span>
          </div>
          <p className="text-2xl font-bold text-white">45</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-[#FF8A3C]" />
            <span className="text-white/60 text-sm">Matchs Joués</span>
          </div>
          <p className="text-2xl font-bold text-white">18</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} className="text-[#208050]" />
            <span className="text-white/60 text-sm">Victoires</span>
          </div>
          <p className="text-2xl font-bold text-white">12</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={20} className="text-[#19DB8A]" />
            <span className="text-white/60 text-sm">Classement</span>
          </div>
          <p className="text-2xl font-bold text-white">3ème</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white mb-4">Actions Rapides</h2>
        <button className="w-full bg-[#208050] hover:bg-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Gérer l'Équipe
        </button>
        <button className="w-full bg-[#0A0A0A] border border-white/10 hover:border-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Planifier un Match
        </button>
        <button className="w-full bg-[#0A0A0A] border border-white/10 hover:border-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Voir les Statistiques
        </button>
      </div>
    </div>
  );
};

export default ClubDashboard;
