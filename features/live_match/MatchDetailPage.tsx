import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { 
  Match, 
  Pronostic,
  PredictionStats,
  getMatchesFromFirestore,
  submitPrediction,
  getUserPrediction,
  getMatchPredictionStats
} from '../../services/liveMatchService';
import { useAuth } from '../../services/firebase';

const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [userPrediction, setUserPrediction] = useState<Pronostic | null>(null);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadMatchData();
  }, [id]);

  const loadMatchData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Charger le match
      const matches = await getMatchesFromFirestore();
      const foundMatch = matches.find(m => m.id === id);
      
      if (!foundMatch) {
        setError('Match introuvable');
        return;
      }
      
      setMatch(foundMatch);
      
      // Charger le pronostic de l'utilisateur
      if (currentUser) {
        const prediction = await getUserPrediction(currentUser.uid, id);
        setUserPrediction(prediction);
      }
      
      // Charger les statistiques
      const predictionStats = await getMatchPredictionStats(id);
      setStats(predictionStats);
      
    } catch (err) {
      console.error('Erreur chargement match:', err);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPrediction = async (prediction: 'team_a' | 'draw' | 'team_b') => {
    if (!currentUser || !id || !match) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const result = await submitPrediction(
        currentUser.uid,
        currentUser.displayName || 'Utilisateur',
        id,
        prediction
      );
      
      if (result.success) {
        setSuccess(true);
        // Recharger les données
        await loadMatchData();
        
        // Masquer le message de succès après 3 secondes
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Erreur lors de la soumission');
      }
    } catch (err) {
      console.error('Erreur soumission:', err);
      setError('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getPredictionLabel = (prediction: string) => {
    if (!match) return prediction;
    
    switch (prediction) {
      case 'team_a':
        return `Victoire ${match.teamAName}`;
      case 'draw':
        return 'Match nul';
      case 'team_b':
        return `Victoire ${match.teamBName}`;
      default:
        return prediction;
    }
  };

  const getStatusBadge = () => {
    if (!match) return null;
    
    const badges = {
      live: { bg: 'bg-red-500', text: 'EN DIRECT', pulse: true },
      finished: { bg: 'bg-gray-500', text: 'TERMINÉ', pulse: false },
      scheduled: { bg: 'bg-[#19DB8A]', text: 'PROGRAMMÉ', pulse: false },
      postponed: { bg: 'bg-orange-500', text: 'REPORTÉ', pulse: false },
    };
    
    const badge = badges[match.status];
    
    return (
      <div className={`${badge.bg} px-3 py-1 rounded-full flex items-center gap-2`}>
        {badge.pulse && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
        <span className="text-white text-xs font-bold">{badge.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#208050] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">{error || 'Match introuvable'}</p>
          <button
            onClick={() => navigate('/live-match')}
            className="px-6 py-2 bg-[#208050] text-white rounded-xl hover:bg-[#208050]/80 transition-all"
          >
            Retour aux matchs
          </button>
        </div>
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
        
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Détail du Match</h1>
          {getStatusBadge()}
        </div>
        
        <p className="text-white/40 text-sm">{match.competition}</p>
      </div>

      {/* Match Info */}
      <div className="px-6 mb-8">
        <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            {/* Team A */}
            <div className="flex flex-col items-center flex-1">
              <img 
                src={match.teamALogo} 
                alt={match.teamAName}
                className="w-20 h-20 object-contain mb-3"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/80?text=Team';
                }}
              />
              <p className="font-bold text-center">{match.teamAName}</p>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center px-6">
              {match.status === 'scheduled' ? (
                <>
                  <div className="text-3xl font-bold text-white/40 mb-2">VS</div>
                  <div className="flex items-center gap-1 text-sm text-white/40">
                    <Clock size={14} />
                    {match.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-white/30 mt-1">
                    {match.startTime.toLocaleDateString()}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 text-4xl font-bold">
                    <span>{match.scoreA}</span>
                    <span className="text-white/20">-</span>
                    <span>{match.scoreB}</span>
                  </div>
                  {match.status === 'live' && match.matchMinute && (
                    <div className="mt-2 px-3 py-1 bg-red-500/20 rounded-full">
                      <span className="text-red-500 text-sm font-bold">{match.matchMinute}'</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center flex-1">
              <img 
                src={match.teamBLogo} 
                alt={match.teamBName}
                className="w-20 h-20 object-contain mb-3"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/80?text=Team';
                }}
              />
              <p className="font-bold text-center">{match.teamBName}</p>
            </div>
          </div>

          {/* Match Info */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Date</span>
              <span className="text-white">
                {match.startTime.toLocaleDateString()} à {match.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Récompense</span>
              <span className="text-[#19DB8A] font-bold">{match.rewardAmount} points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Section */}
      {match.status === 'scheduled' && match.predictionsEnabled && (
        <div className="px-6 mb-8">
          <div className="bg-gradient-to-br from-[#19DB8A]/10 to-[#208050]/5 rounded-3xl p-6 border border-[#19DB8A]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#19DB8A]/20 rounded-xl">
                <Trophy className="text-[#19DB8A]" size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">
                {userPrediction ? 'Votre pronostic' : 'Faire un pronostic'}
              </h2>
            </div>

            {userPrediction ? (
              <div className="bg-[#208050]/20 rounded-2xl p-4 border-2 border-[#208050]">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="text-[#19DB8A]" size={24} />
                  <p className="text-white font-bold">{getPredictionLabel(userPrediction.prediction)}</p>
                </div>
                <p className="text-white/40 text-sm">
                  Soumis le {userPrediction.submittedAt.toLocaleDateString()} à{' '}
                  {userPrediction.submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    userPrediction.status === 'won' ? 'bg-green-500/20 text-green-500' :
                    userPrediction.status === 'lost' ? 'bg-red-500/20 text-red-500' :
                    'bg-orange-500/20 text-orange-500'
                  }`}>
                    {userPrediction.status === 'won' ? 'GAGNÉ' :
                     userPrediction.status === 'lost' ? 'PERDU' : 'EN ATTENTE'}
                  </div>
                </div>
              </div>
            ) : !currentUser ? (
              <div className="bg-orange-500/20 border border-orange-500 rounded-2xl p-4">
                <p className="text-orange-500 text-center">
                  Vous devez être connecté pour faire un pronostic
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white/60 text-sm mb-4">Qui va gagner ce match ?</p>
                
                <button
                  onClick={() => handleSubmitPrediction('team_a')}
                  disabled={submitting}
                  className="w-full py-4 bg-[#1A1A1A] hover:bg-[#208050]/20 border border-[#19DB8A]/30 hover:border-[#19DB8A] rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <TrendingUp size={18} className="text-[#19DB8A]" />
                  <span className="text-white font-semibold">Victoire {match.teamAName}</span>
                </button>
                
                <button
                  onClick={() => handleSubmitPrediction('draw')}
                  disabled={submitting}
                  className="w-full py-4 bg-[#1A1A1A] hover:bg-[#208050]/20 border border-[#19DB8A]/30 hover:border-[#19DB8A] rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="text-white font-semibold">Match nul</span>
                </button>
                
                <button
                  onClick={() => handleSubmitPrediction('team_b')}
                  disabled={submitting}
                  className="w-full py-4 bg-[#1A1A1A] hover:bg-[#208050]/20 border border-[#19DB8A]/30 hover:border-[#19DB8A] rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <TrendingUp size={18} className="text-[#19DB8A]" />
                  <span className="text-white font-semibold">Victoire {match.teamBName}</span>
                </button>

                {submitting && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#19DB8A] border-t-transparent"></div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 flex items-center gap-2">
                    <XCircle size={18} className="text-red-500" />
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/20 border border-green-500 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <p className="text-green-500 text-sm">Pronostic enregistré avec succès !</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prediction Stats */}
      {stats && stats.totalPredictions > 0 && (
        <div className="px-6">
          <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-[#19DB8A]" size={20} />
              <h2 className="text-lg font-bold text-white">Statistiques des pronostics</h2>
            </div>
            
            <p className="text-white/40 text-sm mb-4">
              {stats.totalPredictions} pronostic{stats.totalPredictions > 1 ? 's' : ''}
            </p>

            <div className="space-y-3">
              {/* Team A */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">{match.teamAName}</span>
                  <span className="text-white/60">{stats.teamACount} ({stats.teamAPercentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#19DB8A] rounded-full transition-all"
                    style={{ width: `${stats.teamAPercentage}%` }}
                  />
                </div>
              </div>

              {/* Draw */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">Match nul</span>
                  <span className="text-white/60">{stats.drawCount} ({stats.drawPercentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#19DB8A] rounded-full transition-all"
                    style={{ width: `${stats.drawPercentage}%` }}
                  />
                </div>
              </div>

              {/* Team B */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">{match.teamBName}</span>
                  <span className="text-white/60">{stats.teamBCount} ({stats.teamBPercentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#19DB8A] rounded-full transition-all"
                    style={{ width: `${stats.teamBPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetailPage;
