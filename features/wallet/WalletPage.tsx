import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { useAuth } from '../../services/firebase';
import {
  getUserWallet,
  getWalletStats,
  getTransactionHistory,
  getWithdrawalHistory,
  requestWithdrawal,
  pointsToCDF,
  MOBILE_MONEY_OPERATORS,
  WalletData,
  WalletStats,
  Transaction,
  Withdrawal
} from '../../services/walletService';

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPoints, setWithdrawPoints] = useState('');
  const [withdrawOperator, setWithdrawOperator] = useState('orange_money');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadWalletData();
    }
  }, [currentUser]);

  const loadWalletData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const [walletData, statsData, txHistory, withdrawalHistory] = await Promise.all([
        getUserWallet(currentUser.uid),
        getWalletStats(currentUser.uid),
        getTransactionHistory(currentUser.uid, 20),
        getWithdrawalHistory(currentUser.uid, 10)
      ]);
      
      setWallet(walletData);
      setStats(statsData);
      setTransactions(txHistory);
      setWithdrawals(withdrawalHistory);
    } catch (error) {
      console.error('Erreur chargement wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser || !wallet) return;
    
    const points = parseInt(withdrawPoints);
    
    if (isNaN(points) || points <= 0) {
      setError('Montant invalide');
      return;
    }
    
    if (points < 1000) {
      setError('Minimum 1000 points (10000 CDF)');
      return;
    }
    
    if (points > wallet.points) {
      setError('Solde insuffisant');
      return;
    }
    
    if (!withdrawPhone) {
      setError('Numéro de téléphone requis');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const result = await requestWithdrawal(
        currentUser.uid,
        points,
        withdrawOperator,
        withdrawPhone
      );
      
      if (result.success) {
        setSuccess(true);
        setShowWithdrawModal(false);
        setWithdrawPoints('');
        setWithdrawPhone('');
        
        await loadWalletData();
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Erreur lors de la demande');
      }
    } catch (err) {
      console.error('Erreur retrait:', err);
      setError('Erreur lors de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? ArrowDownLeft : ArrowUpRight;
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10';
  };

  const getWithdrawalStatusBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-orange-500/20', text: 'text-orange-500', icon: Clock, label: 'En attente' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-500', icon: CheckCircle, label: 'Complété' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-500', icon: XCircle, label: 'Rejeté' },
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
        <Icon size={12} className={config.text} />
        <span className={`${config.text} text-xs font-bold`}>{config.label}</span>
      </div>
    );
  };

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
          <Wallet className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Connexion requise</p>
          <p className="text-white/40 mb-6">
            Vous devez être connecté pour accéder à votre portefeuille
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

  const currentPoints = wallet?.points || 0;
  const currentCDF = pointsToCDF(currentPoints);
  const canWithdraw = currentPoints >= 1000;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-readex font-bold text-white flex items-center gap-3">
            <Wallet className="text-[#19DB8A]" />
            Portefeuille
          </h1>
          <p className="text-white/40 mt-1">Gérez vos gains et récompenses</p>
        </header>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="text-green-500 font-bold">Demande envoyée!</p>
              <p className="text-green-500/80 text-sm">Votre retrait sera traité sous 24-48h</p>
            </div>
          </div>
        )}

        {/* Balance Card avec Logo */}
        <div className="bg-gradient-to-br from-[#208050] to-[#0A0A0A] rounded-[2rem] p-6 shadow-2xl relative overflow-hidden border border-white/10 mb-8">
          {/* Logo CHOOSE en arrière-plan rogné */}
          <div className="absolute top-2 right-2 opacity-30">
            <img 
              src="/assets/images/Sans_titre-4.png" 
              alt="CHOOSE" 
              className="w-20 h-20 object-cover rounded-lg"
            />
          </div>
          
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-2">Solde Actuel</p>
          
          {/* Points */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-readex font-bold">{currentPoints.toLocaleString()}</span>
            <span className="text-[#19DB8A] font-bold text-lg">PTS</span>
          </div>
          
          {/* Équivalent CDF */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-xl font-bold text-white/80">{currentCDF.toLocaleString()}</span>
            <span className="text-white/60 font-bold text-sm">CDF</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <div>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">Gains du mois</p>
              <p className="text-lg font-bold flex items-center gap-1">
                +{stats?.monthlyEarnings || 0} <span className="text-xs font-normal opacity-40">PTS</span>
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">Taux de réussite</p>
              <p className="text-lg font-bold flex items-center gap-1 text-[#FF8A3C]">
                {stats?.successRate.toFixed(0) || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => canWithdraw ? setShowWithdrawModal(true) : null}
            disabled={!canWithdraw}
            className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              canWithdraw
                ? 'bg-[#208050] hover:bg-[#208050]/80 text-white'
                : 'bg-[#1A1A1A] text-white/40 cursor-not-allowed'
            }`}
          >
            <ArrowUpRight size={20} /> Retrait
          </button>
          <button
            onClick={() => navigate('/live-match')}
            className="py-4 bg-[#1A1A1A] hover:bg-[#208050]/20 border border-[#19DB8A]/30 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Trophy size={20} /> Pronostiquer
          </button>
        </div>

        {!canWithdraw && (
          <div className="mb-8 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <p className="text-orange-400 text-sm text-center">
              ⚠️ Minimum 1000 points requis pour retirer ({1000 - currentPoints} points restants)
            </p>
          </div>
        )}

        {/* Pending Withdrawals */}
        {withdrawals.filter(w => w.status === 'pending').length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Clock size={18} className="text-orange-500" /> Retraits en attente
            </h3>
            <div className="space-y-3">
              {withdrawals.filter(w => w.status === 'pending').map((withdrawal) => (
                <div key={withdrawal.id} className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-white">{withdrawal.amount.toLocaleString()} PTS</span>
                      <span className="text-white/60 text-sm ml-2">({withdrawal.amountCDF.toLocaleString()} CDF)</span>
                    </div>
                    {getWithdrawalStatusBadge(withdrawal.status)}
                  </div>
                  <p className="text-white/40 text-xs">
                    Demandé le {withdrawal.requestedAt.toLocaleDateString()} à{' '}
                    {withdrawal.requestedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-white/60 text-xs mt-1">
                    📱 {withdrawal.operator} - {withdrawal.accountDetails}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <History size={18} className="text-white/50" /> Historique
            </h3>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">Aucune transaction pour le moment</p>
              <p className="text-white/30 text-sm mt-2">Faites des pronostics pour gagner des points!</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const Icon = getTransactionIcon(tx.type);
              const colorClass = getTransactionColor(tx.type);
              
              return (
                <div key={tx.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{tx.description}</p>
                      <p className="text-white/30 text-[10px]">
                        {tx.createdAt.toLocaleDateString()} à{' '}
                        {tx.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-readex font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount}{' '}
                      <span className="text-[10px] opacity-40">PTS</span>
                    </p>
                    <p className="text-white/40 text-[10px]">
                      {pointsToCDF(tx.amount).toLocaleString()} CDF
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#1A1A1A] rounded-3xl p-6 max-w-md w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign className="text-[#19DB8A]" />
                Retirer
              </h2>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setError(null);
                }}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Montant (Points)</label>
                <input
                  type="number"
                  value={withdrawPoints}
                  onChange={(e) => setWithdrawPoints(e.target.value)}
                  placeholder="Ex: 1000"
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#19DB8A]"
                />
                <div className="flex justify-between mt-2">
                  <p className="text-white/40 text-xs">
                    Disponible: {currentPoints.toLocaleString()} PTS
                  </p>
                  {withdrawPoints && (
                    <p className="text-[#19DB8A] text-xs font-bold">
                      ≈ {pointsToCDF(parseInt(withdrawPoints) || 0).toLocaleString()} CDF
                    </p>
                  )}
                </div>
              </div>

              {/* Operator */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Opérateur Mobile Money</label>
                <select
                  value={withdrawOperator}
                  onChange={(e) => setWithdrawOperator(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#19DB8A]"
                >
                  {MOBILE_MONEY_OPERATORS.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.icon} {op.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="+243 XX XXX XXXX"
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#19DB8A]"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <p className="text-blue-400 text-xs">
                  ℹ️ Les retraits sont traités sous 24-48h. Minimum: 1000 points (10000 CDF)
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="w-full py-4 bg-[#208050] hover:bg-[#208050]/80 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={20} />
                    Confirmer le retrait
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
