import React from 'react';
import { FileText, Eye, Share2, Zap } from 'lucide-react';

const PressDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="mt-12 mb-8">
        <h1 className="text-3xl font-readex font-bold text-white">Tableau de Bord Presse</h1>
        <p className="text-white/50 mt-2">Presse / Média</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-[#19DB8A]" />
            <span className="text-white/60 text-sm">Articles</span>
          </div>
          <p className="text-2xl font-bold text-white">28</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={20} className="text-[#FF8A3C]" />
            <span className="text-white/60 text-sm">Vues Totales</span>
          </div>
          <p className="text-2xl font-bold text-white">45.2K</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Share2 size={20} className="text-[#208050]" />
            <span className="text-white/60 text-sm">Partages</span>
          </div>
          <p className="text-2xl font-bold text-white">1.8K</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={20} className="text-[#19DB8A]" />
            <span className="text-white/60 text-sm">Engagement</span>
          </div>
          <p className="text-2xl font-bold text-white">8.5%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white mb-4">Actions Rapides</h2>
        <button className="w-full bg-[#208050] hover:bg-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Créer un Article
        </button>
        <button className="w-full bg-[#0A0A0A] border border-white/10 hover:border-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Voir les Brouillons
        </button>
        <button className="w-full bg-[#0A0A0A] border border-white/10 hover:border-[#19DB8A] text-white font-semibold py-3 rounded-2xl transition-colors">
          Analyser les Performances
        </button>
      </div>
    </div>
  );
};

export default PressDashboard;
