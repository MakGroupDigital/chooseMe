
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, MapPin, ChevronRight, Newspaper, TrendingUp } from 'lucide-react';
import { UserType, NewsArticle } from '../../types';
import { fetchReportages, type ReportageItem } from '../../services/reportageService';

// NOTE: on ne montre plus les news statiques, seulement les vrais reportages Firestore.
const MOCK_NEWS: NewsArticle[] = [];

const ExplorerPage: React.FC<{ userType: UserType }> = ({ userType }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [reportages, setReportages] = useState<ReportageItem[]>([]);
  const [loadingReportages, setLoadingReportages] = useState(false);
  const isScout = userType === UserType.RECRUITER || userType === UserType.CLUB;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isScout) {
      const load = async () => {
        setLoadingReportages(true);
        const items = await fetchReportages();
        setReportages(items);
        setLoadingReportages(false);
      };
      void load();
    }
  }, [isScout]);

  return (
    <div className="p-6 pb-32 min-h-full bg-[#050505]">
      <header className="mb-6 pt-4">
        <h1 className="text-3xl font-readex font-bold">
          {isScout ? 'Recrutement' : 'Actualités'}
        </h1>
        <p className="text-white/40 mt-1">
          {isScout ? 'Trouvez les futures stars du foot' : 'Toute l\'actualité du sport africain'}
        </p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
        <input
          type="text"
          placeholder={isScout ? "Nom, poste, pays..." : "Rechercher un article..."}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#19DB8A] transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#208050] rounded-xl">
           <Filter size={18} />
        </button>
      </div>

      {isScout ? (
        /* TALENT SEARCH VIEW */
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
             <h2 className="font-bold flex items-center gap-2"><TrendingUp size={18} className="text-[#19DB8A]" /> Talents Emergents</h2>
             <span className="text-[#19DB8A] text-xs font-bold">FILTRER</span>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-3xl flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer">
               <img src={`https://picsum.photos/seed/tal${i}/100/100`} className="w-20 h-20 rounded-2xl object-cover" />
               <div className="flex-1">
                  <h3 className="font-bold">Alpha Sarr <span className="bg-white/5 text-[8px] px-1 py-0.5 rounded ml-1 text-white/40">U19</span></h3>
                  <p className="text-white/40 text-xs mt-0.5">Meneur de Jeu • 1.78m</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[#FF8A3C] text-[10px] font-bold">
                      <Star size={12} fill="currentColor" /> 4.8
                    </div>
                    <div className="flex items-center gap-1 text-white/30 text-[10px]">
                      <MapPin size={10} /> Sénégal
                    </div>
                  </div>
               </div>
               <ChevronRight className="text-white/20" />
            </div>
          ))}
        </div>
      ) : (
        /* NEWS VIEW */
        <div className="space-y-6">
          {/* Filtres catégories */}
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 custom-scrollbar">
            {['Tout', 'Transferts', 'CAN 2024', 'Interview', 'Équipes'].map(cat => (
              <button key={cat} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${cat === 'Tout' ? 'bg-[#19DB8A] border-[#19DB8A] text-black' : 'bg-transparent border-white/10 text-white/40'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* SECTION REPORTAGES VIDÉO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Newspaper size={16} className="text-[#19DB8A]" />
                Reportages vidéo
              </h2>
              {loadingReportages && (
                <span className="text-white/40 text-[10px]">Chargement...</span>
              )}
            </div>
            {(!loadingReportages && reportages.length === 0) && (
              <p className="text-white/30 text-xs">
                Aucun reportage disponible pour le moment.
              </p>
            )}
            <div className="space-y-4">
              {reportages.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-md group active:scale-95 transition-transform cursor-pointer"
                  onClick={() =>
                    navigate(`/explorer/reportage/${r.id}`, { state: { reportage: r } })
                  }
                >
                  <div className="relative h-40">
                    <video
                      src={r.videoUrl}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#19DB8A]">
                      Reportage
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-semibold text-white line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="text-white/50 text-[10px] mt-1">
                        Par {r.reporter} • {r.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION ARTICLES / NEWS (désactivée – on affiche uniquement les vrais reportages Firestore) */}
        </div>
      )}
    </div>
  );
};

export default ExplorerPage;
