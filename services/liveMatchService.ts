import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  DocumentReference
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';

const db = getFirestoreDb();

// Types
export interface Match {
  id: string;
  externalId: string;
  teamAName: string;
  teamALogo: string;
  teamBName: string;
  teamBLogo: string;
  competition: string;
  startTime: Date;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  scoreA: number;
  scoreB: number;
  matchMinute?: number;
  predictionsEnabled: boolean;
  rewardAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pronostic {
  id: string;
  userId: string;
  matchId: string;
  prediction: 'team_a' | 'draw' | 'team_b';
  submittedAt: Date;
  status: 'pending' | 'won' | 'lost';
  userName: string;
}

export interface PredictionStats {
  totalPredictions: number;
  teamACount: number;
  drawCount: number;
  teamBCount: number;
  teamAPercentage: number;
  drawPercentage: number;
  teamBPercentage: number;
}

// Configuration API TheSportsDB (100% gratuit, sans clé)
const THESPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// IDs des ligues supportées
const SUPPORTED_LEAGUES: Record<string, string> = {
  'Premier League': '4328',
  'La Liga': '4335',
  'Bundesliga': '4331',
  'Serie A': '4332',
  'Ligue 1': '4334',
  'Champions League': '4480',
  'Europa League': '4481',
};

// Cache pour éviter trop de requêtes
let matchesCache: { data: Match[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère les matchs du jour depuis TheSportsDB
 */
export async function fetchTodayMatches(): Promise<Match[]> {
  try {
    // Vérifier le cache
    if (matchesCache && Date.now() - matchesCache.timestamp < CACHE_DURATION) {
      console.log('📦 Utilisation du cache pour les matchs');
      return matchesCache.data;
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log(`🔍 Récupération des matchs pour le ${dateStr}`);
    
    const allMatches: Match[] = [];
    
    // Récupérer les matchs pour chaque ligue
    for (const [leagueName, leagueId] of Object.entries(SUPPORTED_LEAGUES)) {
      try {
        const url = `${THESPORTSDB_BASE_URL}/eventsday.php?d=${dateStr}&l=${leagueId}`;
        console.log(`📡 Requête: ${url}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.events && Array.isArray(data.events)) {
          console.log(`✅ ${data.events.length} matchs trouvés pour ${leagueName}`);
          
          for (const event of data.events) {
            try {
              const match = parseTheSportsDbEvent(event, leagueName);
              allMatches.push(match);
            } catch (e) {
              console.warn('⚠️ Erreur parsing match:', e);
            }
          }
        } else {
          console.log(`ℹ️ Aucun match pour ${leagueName}`);
        }
        
        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Erreur pour ${leagueName}:`, error);
      }
    }
    
    // Si aucun match trouvé, utiliser les données de test
    if (allMatches.length === 0) {
      console.log('⚠️ Aucun match trouvé, utilisation des données de test');
      return getTestMatches();
    }
    
    // Trier par heure de début
    allMatches.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // Mettre en cache
    matchesCache = {
      data: allMatches,
      timestamp: Date.now()
    };
    
    console.log(`✅ Total: ${allMatches.length} matchs récupérés`);
    
    return allMatches;
  } catch (error) {
    console.error('❌ Erreur récupération matchs:', error);
    return getTestMatches();
  }
}

/**
 * Parse un événement de TheSportsDB en Match
 */
function parseTheSportsDbEvent(event: any, leagueName: string): Match {
  // Parser la date et l'heure
  const dateStr = event.dateEvent;
  const timeStr = event.strTime;
  
  let startTime = new Date();
  if (dateStr) {
    startTime = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes));
    }
  }
  
  // Déterminer le statut
  let status: Match['status'] = 'scheduled';
  const statusStr = event.strStatus || '';
  
  if (statusStr.includes('FT') || statusStr.includes('Finished')) {
    status = 'finished';
  } else if (statusStr.includes('Live') || statusStr.includes('1H') || 
             statusStr.includes('2H') || statusStr.includes('HT')) {
    status = 'live';
  } else if (statusStr.includes('Postponed') || statusStr.includes('Cancelled')) {
    status = 'postponed';
  }
  
  return {
    id: event.idEvent,
    externalId: event.idEvent,
    teamAName: event.strHomeTeam || '',
    teamALogo: event.strHomeTeamBadge || event.strThumb || '',
    teamBName: event.strAwayTeam || '',
    teamBLogo: event.strAwayTeamBadge || '',
    competition: leagueName,
    startTime,
    status,
    scoreA: parseInt(event.intHomeScore || '0'),
    scoreB: parseInt(event.intAwayScore || '0'),
    matchMinute: undefined,
    predictionsEnabled: true,
    rewardAmount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Synchronise les matchs de l'API vers Firestore
 */
export async function syncMatchesToFirestore(): Promise<{ created: number; updated: number }> {
  try {
    console.log('🔄 Début de la synchronisation des matchs...');
    
    const apiMatches = await fetchTodayMatches();
    let created = 0;
    let updated = 0;
    
    for (const match of apiMatches) {
      try {
        // Vérifier si le match existe déjà
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('externalId', '==', match.externalId), limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // Créer un nouveau match
          await addDoc(matchesRef, {
            externalId: match.externalId,
            team_a_name: match.teamAName,
            team_a_logo: match.teamALogo,
            team_b_name: match.teamBName,
            team_b_logo: match.teamBLogo,
            competition: match.competition,
            start_time: Timestamp.fromDate(match.startTime),
            status: match.status,
            score_a: match.scoreA,
            score_b: match.scoreB,
            match_minute: match.matchMinute || 0,
            predictions_enabled: true,
            reward_amount: 100,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          created++;
          console.log(`✅ Match créé: ${match.teamAName} vs ${match.teamBName}`);
        } else {
          // Mettre à jour le match existant
          const existingDoc = snapshot.docs[0];
          const existingData = existingDoc.data();
          
          // Ne mettre à jour que si les données ont changé
          if (existingData.status !== match.status ||
              existingData.score_a !== match.scoreA ||
              existingData.score_b !== match.scoreB) {
            
            await updateDoc(existingDoc.ref, {
              status: match.status,
              score_a: match.scoreA,
              score_b: match.scoreB,
              match_minute: match.matchMinute || 0,
              updated_at: serverTimestamp(),
            });
            updated++;
            console.log(`🔄 Match mis à jour: ${match.teamAName} vs ${match.teamBName}`);
            
            // Si le match est terminé, traiter les pronostics
            if (match.status === 'finished' && existingData.status !== 'finished') {
              await processMatchPredictions(existingDoc.id, match);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Erreur sync match ${match.id}:`, error);
      }
    }
    
    console.log(`✅ Synchronisation terminée: ${created} créés, ${updated} mis à jour`);
    return { created, updated };
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    throw error;
  }
}

/**
 * Récupère les matchs depuis Firestore
 */
export async function getMatchesFromFirestore(): Promise<Match[]> {
  try {
    const matchesRef = collection(db, 'matches');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      matchesRef,
      where('start_time', '>=', Timestamp.fromDate(today)),
      orderBy('start_time', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        externalId: data.externalId || data.external_id,
        teamAName: data.team_a_name,
        teamALogo: data.team_a_logo,
        teamBName: data.team_b_name,
        teamBLogo: data.team_b_logo,
        competition: data.competition,
        startTime: data.start_time.toDate(),
        status: data.status,
        scoreA: data.score_a,
        scoreB: data.score_b,
        matchMinute: data.match_minute,
        predictionsEnabled: data.predictions_enabled,
        rewardAmount: data.reward_amount,
        createdAt: data.created_at?.toDate() || new Date(),
        updatedAt: data.updated_at?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Erreur récupération matchs Firestore:', error);
    return [];
  }
}

/**
 * Soumet un pronostic
 */
export async function submitPrediction(
  userId: string,
  userName: string,
  matchId: string,
  prediction: 'team_a' | 'draw' | 'team_b'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier si l'utilisateur a déjà fait un pronostic
    const existingPrediction = await getUserPrediction(userId, matchId);
    if (existingPrediction) {
      return { success: false, error: 'Vous avez déjà fait un pronostic pour ce match' };
    }
    
    // Vérifier que le match est valide
    const matchDoc = await getDoc(doc(db, 'matches', matchId));
    if (!matchDoc.exists()) {
      return { success: false, error: 'Match introuvable' };
    }
    
    const matchData = matchDoc.data();
    if (matchData.status !== 'scheduled') {
      return { success: false, error: 'Les pronostics sont fermés pour ce match' };
    }
    
    // Créer le pronostic
    const pronosticsRef = collection(db, 'pronostics');
    await addDoc(pronosticsRef, {
      user_ref: doc(db, 'users', userId),
      match_ref: doc(db, 'matches', matchId),
      prediction,
      submitted_at: serverTimestamp(),
      status: 'pending',
      user_name: userName,
    });
    
    console.log('✅ Pronostic enregistré');
    return { success: true };
  } catch (error) {
    console.error('Erreur soumission pronostic:', error);
    return { success: false, error: 'Erreur lors de la soumission' };
  }
}

/**
 * Récupère le pronostic d'un utilisateur pour un match
 */
export async function getUserPrediction(userId: string, matchId: string): Promise<Pronostic | null> {
  try {
    const pronosticsRef = collection(db, 'pronostics');
    const q = query(
      pronosticsRef,
      where('user_ref', '==', doc(db, 'users', userId)),
      where('match_ref', '==', doc(db, 'matches', matchId)),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const docData = snapshot.docs[0];
    const data = docData.data();
    
    return {
      id: docData.id,
      userId,
      matchId,
      prediction: data.prediction,
      submittedAt: data.submitted_at?.toDate() || new Date(),
      status: data.status,
      userName: data.user_name,
    };
  } catch (error) {
    console.error('Erreur récupération pronostic:', error);
    return null;
  }
}

/**
 * Récupère tous les pronostics d'un utilisateur
 */
export async function getUserPredictions(userId: string): Promise<Pronostic[]> {
  try {
    console.log('🔍 getUserPredictions - userId:', userId);
    
    const pronosticsRef = collection(db, 'pronostics');
    const userRef = doc(db, 'users', userId);
    
    console.log('📋 Requête Firestore - collection: pronostics, user_ref:', userRef.path);
    
    const q = query(
      pronosticsRef,
      where('user_ref', '==', userRef),
      orderBy('submitted_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    console.log('📊 Résultats Firestore:', snapshot.size, 'documents');
    
    if (snapshot.empty) {
      console.log('⚠️ Aucun pronostic trouvé pour cet utilisateur');
      // Essayons une requête sans orderBy pour voir si c'est un problème d'index
      const qSimple = query(
        pronosticsRef,
        where('user_ref', '==', userRef)
      );
      const snapshotSimple = await getDocs(qSimple);
      console.log('📊 Résultats sans orderBy:', snapshotSimple.size, 'documents');
      
      if (snapshotSimple.size > 0) {
        console.log('⚠️ L\'index Firestore est manquant! Créez l\'index pour user_ref + submitted_at');
        // Retourner les résultats sans tri
        return snapshotSimple.docs.map(docData => {
          const data = docData.data();
          console.log('📄 Document:', docData.id, data);
          return {
            id: docData.id,
            userId,
            matchId: data.match_ref.id,
            prediction: data.prediction,
            submittedAt: data.submitted_at?.toDate() || new Date(),
            status: data.status,
            userName: data.user_name,
          };
        }).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      }
    }
    
    return snapshot.docs.map(docData => {
      const data = docData.data();
      console.log('📄 Document:', docData.id, data);
      return {
        id: docData.id,
        userId,
        matchId: data.match_ref.id,
        prediction: data.prediction,
        submittedAt: data.submitted_at?.toDate() || new Date(),
        status: data.status,
        userName: data.user_name,
      };
    });
  } catch (error) {
    console.error('❌ Erreur récupération pronostics utilisateur:', error);
    
    // Si c'est une erreur d'index, essayons sans orderBy
    if (error instanceof Error && error.message.includes('index')) {
      console.log('⚠️ Erreur d\'index détectée, tentative sans orderBy...');
      try {
        const pronosticsRef = collection(db, 'pronostics');
        const userRef = doc(db, 'users', userId);
        const qSimple = query(
          pronosticsRef,
          where('user_ref', '==', userRef)
        );
        const snapshotSimple = await getDocs(qSimple);
        console.log('✅ Récupération réussie sans orderBy:', snapshotSimple.size, 'documents');
        
        return snapshotSimple.docs.map(docData => {
          const data = docData.data();
          return {
            id: docData.id,
            userId,
            matchId: data.match_ref.id,
            prediction: data.prediction,
            submittedAt: data.submitted_at?.toDate() || new Date(),
            status: data.status,
            userName: data.user_name,
          };
        }).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      } catch (retryError) {
        console.error('❌ Erreur même sans orderBy:', retryError);
        return [];
      }
    }
    
    return [];
  }
}

/**
 * Récupère les statistiques des pronostics pour un match
 */
export async function getMatchPredictionStats(matchId: string): Promise<PredictionStats> {
  try {
    const pronosticsRef = collection(db, 'pronostics');
    const q = query(
      pronosticsRef,
      where('match_ref', '==', doc(db, 'matches', matchId))
    );
    
    const snapshot = await getDocs(q);
    
    let teamACount = 0;
    let drawCount = 0;
    let teamBCount = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      switch (data.prediction) {
        case 'team_a':
          teamACount++;
          break;
        case 'draw':
          drawCount++;
          break;
        case 'team_b':
          teamBCount++;
          break;
      }
    });
    
    const total = snapshot.size;
    
    return {
      totalPredictions: total,
      teamACount,
      drawCount,
      teamBCount,
      teamAPercentage: total > 0 ? (teamACount / total) * 100 : 0,
      drawPercentage: total > 0 ? (drawCount / total) * 100 : 0,
      teamBPercentage: total > 0 ? (teamBCount / total) * 100 : 0,
    };
  } catch (error) {
    console.error('Erreur statistiques pronostics:', error);
    return {
      totalPredictions: 0,
      teamACount: 0,
      drawCount: 0,
      teamBCount: 0,
      teamAPercentage: 0,
      drawPercentage: 0,
      teamBPercentage: 0,
    };
  }
}

/**
 * Traite les pronostics d'un match terminé
 */
async function processMatchPredictions(matchId: string, match: Match): Promise<void> {
  try {
    console.log(`🎯 Traitement des pronostics pour le match ${matchId}`);
    
    // Déterminer le résultat
    let result: 'team_a' | 'draw' | 'team_b';
    if (match.scoreA > match.scoreB) {
      result = 'team_a';
    } else if (match.scoreB > match.scoreA) {
      result = 'team_b';
    } else {
      result = 'draw';
    }
    
    console.log(`📊 Résultat: ${result}`);
    
    // Récupérer tous les pronostics en attente
    const pronosticsRef = collection(db, 'pronostics');
    const q = query(
      pronosticsRef,
      where('match_ref', '==', doc(db, 'matches', matchId)),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    
    let winners = 0;
    let losers = 0;
    
    // Mettre à jour chaque pronostic
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const isWinner = data.prediction === result;
      const newStatus = isWinner ? 'won' : 'lost';
      
      await updateDoc(docSnapshot.ref, {
        status: newStatus,
      });
      
      if (isWinner) {
        winners++;
        // Créditer le portefeuille (à implémenter)
        // await creditUserWallet(data.user_ref.id, 100);
      } else {
        losers++;
      }
    }
    
    console.log(`✅ Pronostics traités: ${winners} gagnants, ${losers} perdants`);
  } catch (error) {
    console.error('Erreur traitement pronostics:', error);
  }
}

/**
 * Données de test
 */
function getTestMatches(): Match[] {
  const now = new Date();
  
  return [
    {
      id: 'test_1',
      externalId: 'test_1',
      teamAName: 'Real Madrid',
      teamALogo: 'https://www.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png',
      teamBName: 'Barcelona',
      teamBLogo: 'https://www.thesportsdb.com/images/media/team/badge/txrwth1468770530.png',
      competition: 'La Liga',
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      status: 'scheduled',
      scoreA: 0,
      scoreB: 0,
      predictionsEnabled: true,
      rewardAmount: 100,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'test_2',
      externalId: 'test_2',
      teamAName: 'Manchester United',
      teamALogo: 'https://www.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png',
      teamBName: 'Liverpool',
      teamBLogo: 'https://www.thesportsdb.com/images/media/team/badge/uvxuxy1448813372.png',
      competition: 'Premier League',
      startTime: new Date(now.getTime() - 30 * 60 * 1000),
      status: 'live',
      scoreA: 1,
      scoreB: 2,
      matchMinute: 75,
      predictionsEnabled: false,
      rewardAmount: 100,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'test_3',
      externalId: 'test_3',
      teamAName: 'Bayern Munich',
      teamALogo: 'https://www.thesportsdb.com/images/media/team/badge/uxsxqv1448813372.png',
      teamBName: 'Borussia Dortmund',
      teamBLogo: 'https://www.thesportsdb.com/images/media/team/badge/xqwpup1420746025.png',
      competition: 'Bundesliga',
      startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      status: 'scheduled',
      scoreA: 0,
      scoreB: 0,
      predictionsEnabled: true,
      rewardAmount: 100,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
