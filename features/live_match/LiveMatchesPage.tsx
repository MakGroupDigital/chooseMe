import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, PlayCircle, RefreshCw, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import { Match, fetchTodayMatches, syncMatchesToFirestore, getMatchesFromFirestore } from '../../services/liveMatchService';

const LiveMatchesPage: React.FC = () => {
  const [filter, setFilter] = useState<'live' | 'scheduled' | 'finished'>('live');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();
    
    // Rafraîchir automatiquement toutes les 60 secondes
    const interval = setInterval(() => {
      loadMatches(true);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMatches = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // D'abord essayer de récupérer depuis Firestore
      let firestoreMatches = await getMatchesFromFirestore();
      
      // Si pas de matchs dans Firestore ou données anciennes, synchroniser
      if (firestoreMatches.length === 0) {
        console.log('📥 Synchronisation depuis l\'API...');
        try {
          await syncMatchesToFirestore();
          firestoreMatches = await getMatchesFromFirestore();
        } catch (syncError) {
          console.error('Erreur synchronisation:', syncError);
        }
      }
      
      // Si toujours pas de matchs, utiliser l'API directement
      if (firestoreMatches.length === 0) {
        console.log('📡 Récupération directe depuis l\'API...');
        try {
          const apiMatches = await fetchTodayMatches();
          setMatches(apiMatches);
          setIsFromCache(true);
        } catch (apiError) {
          console.error('Erreur API:', apiError);
          // Utiliser les données de test en dernier recours
          setMatches([]);
        }
      } else {
        setMatches(firestoreMatches);
        setIsFromCache(false);
      }
    } catch (error) {
      console.error('Erreur chargement matchs:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncMatchesToFirestore();
      await loadMatches(true);
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredMatches = matches.filter(m => m.status === filter);

  const getStatusBadge = (match: Match) => {
    if (match.status === 'live') {
      return (
        <span className="text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 bg-red-500/20 text-red-500">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          LIVE {match.matchMinute ? `${match.matchMinute}'` : ''}
        </span>
      );
    }
    
    if (match.status === 'finished') {
      return (
        <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-white/40">
          TERMINÉ
        </span>
      );
    }
    
    return (
      <span className="text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 bg-white/5 text-white/40">
        <Clock size={12} />
        {match.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-readex font-bold text-white flex items-center gap-3">
            <Trophy className="text-[#FF8A3C]" />
            Matchs en Live
          </h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/my-predictions')}
              className="p-2 rounded-xl bg-[#208050]/20 hover:bg-[#208050]/30 transition-all"
              title="Mes pronostics"
            >
              <TrendingUp size={20} className="text-[#19DB8A]" />
            </button>
            
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 rounded-xl bg-[#208050]/20 hover:bg-[#208050]/30 transition-all disabled:opacity-50"
            >
              <RefreshCw 
                size={20} 
                className={`text-[#19DB8A] ${syncing ? 'animate-spin' : ''}`} 
              />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-white/40">Pronostiquez et gagnez des points</p>
          {isFromCache && (
            <span className="flex items-center gap-1 text-xs text-orange-400">
              <WifiOff size={12} />
              Cache
            </span>
          )}
          {!isFromCache && !loading && (
            <span className="flex items-center gap-1 text-xs text-[#19DB8A]">
              <Wifi size={12} />
              En ligne
            </span>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex bg-[#0A0A0A] p-1 rounded-2xl mb-8 border border-white/5">
        {(['live', 'scheduled', 'finished'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
              filter === tab ? 'bg-[#208050] text-white shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab === 'live' ? 'En Direct' : tab === 'scheduled' ? 'À Venir' : 'Terminés'}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#208050] border-t-transparent"></div>
        </div>
      )}

      {/* Match List */}
      {!loading && (
        <div className="space-y-4">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => navigate(`/live-match/${match.id}`)}
                className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-5 hover:border-[#19DB8A]/30 transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex justify-between items-center mb-4">
                  {getStatusBadge(match)}
                  <span className="text-white/30 text-xs">{match.competition}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center flex-1">
                    <img 
                      src={match.teamALogo} 
                      alt={match.teamAName} 
                      className="w-14 h-14 object-contain mb-2"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/64?text=Team';
                      }}
                    />
                    <p className="font-bold text-sm text-center line-clamp-1">{match.teamAName}</p>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    {match.status === 'scheduled' ? (
                      <div className="text-center">
                        <div className="text-2xl font-readex font-bold text-white/40">VS</div>
                        <div className="text-xs text-white/30 mt-1">
                          {match.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-3xl font-readex font-bold flex gap-3">
                        <span>{match.scoreA}</span>
                        <span className="text-white/20">-</span>
                        <span>{match.scoreB}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <img 
                      src={match.teamBLogo} 
                      alt={match.teamBName} 
                      className="w-14 h-14 object-contain mb-2"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/64?text=Team';
                      }}
                    />
                    <p className="font-bold text-sm text-center line-clamp-1">{match.teamBName}</p>
                  </div>
                </div>
                
                {match.predictionsEnabled && match.status === 'scheduled' && (
                  <div className="mt-5 pt-4 border-t border-white/5 flex justify-center">
                    <p className="text-[#19DB8A] text-xs font-semibold flex items-center gap-2">
                      <PlayCircle size={14} /> Pronostiquer maintenant
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#0A0A0A] rounded-3xl border border-dashed border-white/10">
              <p className="text-white/30">Aucun match disponible pour le moment</p>
              <button
                onClick={handleSync}
                className="mt-4 px-6 py-2 bg-[#208050] text-white rounded-xl hover:bg-[#208050]/80 transition-all"
              >
                Actualiser
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMatchesPage;
