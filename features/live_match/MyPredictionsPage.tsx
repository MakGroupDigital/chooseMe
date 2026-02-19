import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Award } from 'lucide-react';
import { 
  Pronostic,
  Match,
  getUserPredictions,
  getMatchesFromFirestore
} from '../../services/liveMatchService';
import { useAuth } from '../../services/firebase';

interface PredictionWithMatch extends Pronostic {
  match?: Match;
}

const MyPredictionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');

  useEffect(() => {
    if (currentUser) {
      loadPredictions();
    }
  }, [currentUser]);

  const loadPredictions = async () => {
    if (!currentUser) {
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('🔍 Chargement des pronostics pour:', currentUser.uid);
      
      // Charger les pronostics de l'utilisateur
      const userPredictions = await getUserPredictions(currentUser.uid);
      console.log('📊 Pronostics récupérés:', userPredictions.length, userPredictions);
      
      // Charger les matchs correspondants
      const matches = await getMatchesFromFirestore();
      console.log('⚽ Matchs récupérés:', matches.length);
      
      const matchMap = new Map(matches.map(m => [m.id, m]));
      
      // Associer les matchs aux pronostics
      const predictionsWithMatches = userPredictions.map(pred => ({
        ...pred,
        match: matchMap.get(pred.matchId)
      }));
      
      console.log('✅ Pronostics avec matchs:', predictionsWithMatches);
      
      setPredictions(predictionsWithMatches);
    } catch (error) {
      console.error('❌ Erreur chargement pronostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPredictionLabel = (prediction: string, match?: Match) => {
    if (!match) return prediction;
    
    switch (prediction) {
      case 'team_a':
        return match.teamAName;
      case 'draw':
        return 'Match nul';
      case 'team_b':
        return match.teamBName;
      default:
        return prediction;
    }
  };

  const getStats = () => {
    const total = predictions.length;
    const won = predictions.filter(p => p.status === 'won').length;
    const lost = predictions.filter(p => p.status === 'lost').length;
    const pending = predictions.filter(p => p.status === 'pending').length;
    const winRate = total > 0 ? (won / (won + lost)) * 100 : 0;
    
    return { total, won, lost, pending, winRate };
  };

  const filteredPredictions = predictions.filter(pred => {
    if (filter === 'all') return true;
    return pred.status === filter;
  });

  const stats = getStats();

  // Attendre que l'authentification soit chargée
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#208050] border-t-transparent"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Connexion requise</p>
          <p className="text-white/40 mb-6">
            Vous devez être connecté pour voir vos pronostics
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-[#208050] text-white rounded-xl hover:bg-[#208050]/80 transition-all"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#208050] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#208050]/20 to-transparent p-6">
        <button
          onClick={() => navigate('/live-match')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-[#19DB8A]/20 rounded-2xl">
            <Trophy className="text-[#19DB8A]" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Mes Pronostics</h1>
        </div>
        
        <p className="text-white/40 text-sm">Suivez vos prédictions et vos gains</p>
      </div>

      {/* Stats Cards */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total */}
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-[#19DB8A]" />
              <span className="text-white/60 text-xs">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>

          {/* Taux de réussite */}
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-[#19DB8A]" />
              <span className="text-white/60 text-xs">Réussite</span>
            </div>
            <p className="text-2xl font-bold text-[#19DB8A]">
              {stats.winRate.toFixed(0)}%
            </p>
          </div>

          {/* Gagnés */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-white/60 text-xs">Gagnés</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.won}</p>
          </div>

          {/* Perdus */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={16} className="text-red-500" />
              <span className="text-white/60 text-xs">Perdus</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.lost}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Tous', count: stats.total },
            { key: 'pending', label: 'En attente', count: stats.pending },
            { key: 'won', label: 'Gagnés', count: stats.won },
            { key: 'lost', label: 'Perdus', count: stats.lost },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-[#208050] text-white'
                  : 'bg-[#1A1A1A] text-white/60 hover:text-white'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Predictions List */}
      <div className="px-6 space-y-3">
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 mb-2">
              {filter === 'all' 
                ? 'Aucun pronostic pour le moment'
                : `Aucun pronostic ${filter === 'pending' ? 'en attente' : filter === 'won' ? 'gagné' : 'perdu'}`
              }
            </p>
            <button
              onClick={() => navigate('/live-match')}
              className="mt-4 px-6 py-2 bg-[#208050] text-white rounded-xl hover:bg-[#208050]/80 transition-all"
            >
              Faire un pronostic
            </button>
          </div>
        ) : (
          filteredPredictions.map((prediction) => {
            const match = prediction.match;
            if (!match) return null;

            const statusConfig = {
              pending: { 
                bg: 'bg-orange-500/10', 
                border: 'border-orange-500/30', 
                text: 'text-orange-500',
                icon: Clock,
                label: 'EN ATTENTE'
              },
              won: { 
                bg: 'bg-green-500/10', 
                border: 'border-green-500/30', 
                text: 'text-green-500',
                icon: CheckCircle,
                label: 'GAGNÉ'
              },
              lost: { 
                bg: 'bg-red-500/10', 
                border: 'border-red-500/30', 
                text: 'text-red-500',
                icon: XCircle,
                label: 'PERDU'
              },
            };

            const config = statusConfig[prediction.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={prediction.id}
                onClick={() => navigate(`/live-match/${match.id}`)}
                className={`${config.bg} border ${config.border} rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-all`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1 ${config.bg} border ${config.border} rounded-full`}>
                    <StatusIcon size={14} className={config.text} />
                    <span className={`${config.text} text-xs font-bold`}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-white/40 text-xs">
                    {prediction.submittedAt.toLocaleDateString()}
                  </span>
                </div>

                {/* Match Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <img 
                      src={match.teamALogo} 
                      alt={match.teamAName}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/32?text=T';
                      }}
                    />
                    <span className="text-white text-sm font-medium">{match.teamAName}</span>
                  </div>

                  <div className="px-3">
                    {match.status === 'finished' ? (
                      <div className="flex items-center gap-2 text-white font-bold">
                        <span>{match.scoreA}</span>
                        <span className="text-white/20">-</span>
                        <span>{match.scoreB}</span>
                      </div>
                    ) : (
                      <span className="text-white/40 text-sm">vs</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="text-white text-sm font-medium text-right">{match.teamBName}</span>
                    <img 
                      src={match.teamBLogo} 
                      alt={match.teamBName}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/32?text=T';
                      }}
                    />
                  </div>
                </div>

                {/* Prediction */}
                <div className="pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Votre pronostic:</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className={config.text} />
                      <span className={`${config.text} text-sm font-bold`}>
                        {getPredictionLabel(prediction.prediction, match)}
                      </span>
                    </div>
                  </div>
                  
                  {prediction.status === 'won' && (
                    <div className="mt-2 flex items-center justify-end gap-1">
                      <Trophy size={14} className="text-[#19DB8A]" />
                      <span className="text-[#19DB8A] text-xs font-bold">
                        +{match.rewardAmount} points
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyPredictionsPage;
