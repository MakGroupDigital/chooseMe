import {
  collection,
  doc,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  DocumentReference,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';

const db = getFirestoreDb();

// NOUVELLE LOGIQUE:
// - 1 pronostic gagné = 10 points
// - 1000 points = 10000 CDF
// - Retrait minimum: 1000 points
// - Mobile Money uniquement

// Types
export interface WalletData {
  id: string;
  userId: string;
  points: number;  // Points CHOOSE
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletStats {
  totalPoints: number;
  monthlyEarnings: number;  // Points gagnés ce mois
  totalPredictions: number;
  wonPredictions: number;
  successRate: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;  // En points
  rewardType: string;
  description: string;
  matchId?: string;
  createdAt: Date;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;  // En points
  amountCDF: number;  // Montant en CDF (amount * 10)
  method: 'mobile_money';
  operator: string;  // Orange Money, M-Pesa, etc.
  accountDetails: string;
  status: 'pending' | 'completed' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  rejectionReason?: string;
}

// Opérateurs Mobile Money en Afrique
export const MOBILE_MONEY_OPERATORS = [
  { id: 'orange_money', name: 'Orange Money 🇨🇮🇸🇳', icon: '🟠' },
  { id: 'mtn_momo', name: 'MTN Mobile Money 🇬🇭🇺🇬', icon: '🟡' },
  { id: 'mpesa', name: 'M-Pesa 🇰🇪🇹🇿', icon: '🟢' },
  { id: 'airtel_money', name: 'Airtel Money 🇰🇪🇹🇿', icon: '🔴' },
  { id: 'wave', name: 'Wave 🇸🇳🇨🇮', icon: '💙' },
  { id: 'moov_money', name: 'Moov Money 🇧🇯🇹🇬', icon: '🔵' },
  { id: 'free_money', name: 'Free Money 🇸🇳', icon: '⚪' },
  { id: 'vodacom_mpesa', name: 'Vodacom M-Pesa 🇨🇩', icon: '🔴' },
  { id: 'tigo_pesa', name: 'Tigo Pesa 🇹🇿🇷🇼', icon: '🔵' },
  { id: 'ecobank_mobile', name: 'Ecobank Mobile 🌍', icon: '🟦' },
];

// Constantes
const MIN_WITHDRAWAL_POINTS = 1000;  // Minimum 1000 points
const POINTS_TO_CDF = 10;  // 1 point = 10 CDF

/**
 * Convertit les points en CDF
 */
export function pointsToCDF(points: number): number {
  return points * POINTS_TO_CDF;
}

/**
 * Convertit les CDF en points
 */
export function cdfToPoints(cdf: number): number {
  return Math.floor(cdf / POINTS_TO_CDF);
}

/**
 * Récupère ou crée le portefeuille de l'utilisateur
 */
export async function getUserWallet(userId: string): Promise<WalletData | null> {
  try {
    const walletsRef = collection(db, 'wallets');
    const q = query(walletsRef, where('user_ref', '==', doc(db, 'users', userId)), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0];
      const data = docData.data();
      return {
        id: docData.id,
        userId,
        points: data.points || 0,
        createdAt: data.created_at?.toDate() || new Date(),
        updatedAt: data.updated_at?.toDate() || new Date(),
      };
    }

    // Créer un nouveau portefeuille
    const newWalletRef = await addDoc(walletsRef, {
      user_ref: doc(db, 'users', userId),
      points: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return {
      id: newWalletRef.id,
      userId,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Erreur récupération wallet:', error);
    return null;
  }
}

/**
 * Récupère les statistiques du wallet
 */
export async function getWalletStats(userId: string): Promise<WalletStats> {
  try {
    const wallet = await getUserWallet(userId);
    
    // Récupérer les transactions du mois
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('user_ref', '==', doc(db, 'users', userId)),
      where('type', '==', 'credit'),
      where('created_at', '>=', Timestamp.fromDate(startOfMonth))
    );
    
    const snapshot = await getDocs(q);
    const monthlyEarnings = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    
    // Récupérer les stats de pronostics
    const pronosticsRef = collection(db, 'pronostics');
    const qPronostics = query(
      pronosticsRef,
      where('user_ref', '==', doc(db, 'users', userId))
    );
    
    const pronosticsSnapshot = await getDocs(qPronostics);
    const totalPredictions = pronosticsSnapshot.size;
    const wonPredictions = pronosticsSnapshot.docs.filter(d => d.data().status === 'won').length;
    const successRate = totalPredictions > 0 ? (wonPredictions / totalPredictions) * 100 : 0;
    
    return {
      totalPoints: wallet?.points || 0,
      monthlyEarnings,
      totalPredictions,
      wonPredictions,
      successRate,
    };
  } catch (error) {
    console.error('Erreur stats wallet:', error);
    return {
      totalPoints: 0,
      monthlyEarnings: 0,
      totalPredictions: 0,
      wonPredictions: 0,
      successRate: 0,
    };
  }
}

/**
 * Récupère l'historique des transactions
 */
export async function getTransactionHistory(userId: string, limitCount = 20): Promise<Transaction[]> {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('user_ref', '==', doc(db, 'users', userId)),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docData => {
      const data = docData.data();
      return {
        id: docData.id,
        walletId: data.wallet_ref?.id || '',
        userId,
        type: data.type,
        amount: data.amount,
        rewardType: data.reward_type || '',
        description: data.description,
        matchId: data.match_ref?.id,
        createdAt: data.created_at?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Erreur historique transactions:', error);
    return [];
  }
}

/**
 * Récupère l'historique des retraits
 */
export async function getWithdrawalHistory(userId: string, limitCount = 10): Promise<Withdrawal[]> {
  try {
    const withdrawalsRef = collection(db, 'withdrawals');
    const q = query(
      withdrawalsRef,
      where('user_ref', '==', doc(db, 'users', userId)),
      orderBy('requested_at', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docData => {
      const data = docData.data();
      const amount = data.amount || 0;
      return {
        id: docData.id,
        userId,
        amount,
        amountCDF: pointsToCDF(amount),
        method: 'mobile_money',
        operator: data.operator || '',
        accountDetails: data.account_details,
        status: data.status,
        requestedAt: data.requested_at?.toDate() || new Date(),
        processedAt: data.processed_at?.toDate(),
        rejectionReason: data.rejection_reason,
      };
    });
  } catch (error) {
    console.error('Erreur historique retraits:', error);
    return [];
  }
}

/**
 * Demande un retrait
 */
export async function requestWithdrawal(
  userId: string,
  points: number,
  operator: string,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validation
    if (points < MIN_WITHDRAWAL_POINTS) {
      return { 
        success: false, 
        error: `Minimum ${MIN_WITHDRAWAL_POINTS} points (${pointsToCDF(MIN_WITHDRAWAL_POINTS)} CDF)` 
      };
    }
    
    if (!phoneNumber || phoneNumber.length < 8) {
      return { success: false, error: 'Numéro de téléphone invalide' };
    }
    
    // Vérifier le solde
    const wallet = await getUserWallet(userId);
    if (!wallet || wallet.points < points) {
      return { success: false, error: 'Solde insuffisant' };
    }
    
    // Vérifier qu'il n'y a pas de retrait en attente
    const withdrawalsRef = collection(db, 'withdrawals');
    const q = query(
      withdrawalsRef,
      where('user_ref', '==', doc(db, 'users', userId)),
      where('status', '==', 'pending')
    );
    
    const pendingSnapshot = await getDocs(q);
    if (!pendingSnapshot.empty) {
      return { success: false, error: 'Vous avez déjà un retrait en attente' };
    }
    
    // Créer la demande de retrait
    await addDoc(withdrawalsRef, {
      user_ref: doc(db, 'users', userId),
      amount: points,
      amount_cdf: pointsToCDF(points),
      method: 'mobile_money',
      operator,
      account_details: phoneNumber,
      status: 'pending',
      requested_at: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erreur demande retrait:', error);
    return { success: false, error: 'Erreur lors de la demande' };
  }
}
