import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  increment,
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

// Configuration API TheSportsDB (gratuit en V1, sans clé côté client)
const THESPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

const SUPPORTED_LEAGUES: Array<{ name: string; id: string; priority: number }> = [
  { name: 'FIFA World Cup', id: '4429', priority: 1 },
  { name: 'UEFA Champions League', id: '4480', priority: 2 },
  { name: 'UEFA Europa League', id: '4481', priority: 3 },
  { name: 'Copa Libertadores', id: '4501', priority: 4 },
  { name: 'English Premier League', id: '4328', priority: 5 },
  { name: 'Spanish La Liga', id: '4335', priority: 6 },
  { name: 'German Bundesliga', id: '4331', priority: 7 },
  { name: 'Italian Serie A', id: '4332', priority: 8 },
  { name: 'French Ligue 1', id: '4334', priority: 9 },
  { name: 'Scottish Premier League', id: '4330', priority: 10 }
];

const REQUEST_DELAY_MS = 90;
const REQUEST_BATCH_SIZE = 8;
const UPCOMING_LIMIT = 28;
const RECENT_LIMIT = 12;
const DAY_LOOKAHEAD = 14;
const DAY_LOOKBACK = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runInBatches = async <T, R>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...await Promise.all(batch.map(worker)));
    if (i + batchSize < items.length) {
      await sleep(REQUEST_DELAY_MS);
    }
  }
  return results;
};

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const addDays = (base: Date, amount: number): Date => {
  const next = new Date(base);
  next.setDate(next.getDate() + amount);
  return next;
};

const normalizeText = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getLeaguePriority = (leagueName: string): number => {
  const normalized = normalizeText(leagueName);
  const match = SUPPORTED_LEAGUES.find((league) => normalized.includes(normalizeText(league.name)));
  if (match) return match.priority;
  if (normalized.includes('world cup')) return 1;
  if (normalized.includes('champions league')) return 2;
  if (normalized.includes('europa league')) return 3;
  if (normalized.includes('libertadores')) return 4;
  return 99;
};

/**
 * Récupère des matchs réels (live/à venir/récents) depuis TheSportsDB.
 * L'API est gratuite et ne nécessite pas de compte côté client.
 */
export async function fetchTodayMatches(): Promise<Match[]> {
  try {
    const today = new Date();
    console.log(`🔍 Récupération sans cache des matchs réels autour du ${toDateKey(today)}`);
    
    const allMatches: Match[] = [];
    const seenEventIds = new Set<string>();

    const ingestEvents = (events: any[] | undefined, fallbackLeagueName = '') => {
      if (!Array.isArray(events)) return;

      for (const event of events) {
        try {
          const eventId = String(event?.idEvent || '');
          if (!eventId || seenEventIds.has(eventId)) continue;

          const match = parseTheSportsDbEvent(event, fallbackLeagueName);
          if (!match.teamAName || !match.teamBName || !match.externalId) continue;

          seenEventIds.add(eventId);
          allMatches.push(match);
        } catch (e) {
          console.warn('⚠️ Erreur parsing match:', e);
        }
      }
    };

    const requests: Array<{ url: string; fallbackLeagueName?: string }> = [];

    for (const league of SUPPORTED_LEAGUES) {
      requests.push(
        { url: `${THESPORTSDB_BASE_URL}/eventsnextleague.php?id=${league.id}`, fallbackLeagueName: league.name },
        { url: `${THESPORTSDB_BASE_URL}/eventspastleague.php?id=${league.id}`, fallbackLeagueName: league.name }
      );
    }

    for (let offset = -DAY_LOOKBACK; offset <= DAY_LOOKAHEAD; offset++) {
      const dateStr = toDateKey(addDays(today, offset));
      requests.push({ url: `${THESPORTSDB_BASE_URL}/eventsday.php?d=${dateStr}&s=Soccer` });
    }

    await runInBatches(requests, REQUEST_BATCH_SIZE, async ({ url, fallbackLeagueName }) => {
      try {
        console.log(`📡 Requête: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`⚠️ Réponse API non OK (${response.status}) pour ${url}`);
          return;
        }
        const data = await response.json();
        ingestEvents(data?.events, fallbackLeagueName);
      } catch (error) {
        console.error('❌ Erreur récupération API football:', error);
      }
    });
    
    // Si aucun match réel trouvé, retourner une liste vide (jamais de faux matchs)
    if (allMatches.length === 0) {
      console.log('⚠️ Aucun match réel trouvé depuis l’API');
      return [];
    }
    
    // Garder un volume raisonnable côté UI tout en couvrant les 3 onglets
    const now = Date.now();
    const liveMatches = allMatches.filter(m => m.status === 'live');
    const upcomingMatches = allMatches
      .filter(m => m.status === 'scheduled' && m.startTime.getTime() >= now)
      .sort((a, b) => {
        const priorityDiff = getLeaguePriority(a.competition) - getLeaguePriority(b.competition);
        if (priorityDiff !== 0) return priorityDiff;
        return a.startTime.getTime() - b.startTime.getTime();
      })
      .slice(0, UPCOMING_LIMIT);
    const recentFinishedMatches = allMatches
      .filter(m => m.status === 'finished')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, RECENT_LIMIT);
    
    const curatedMatches = [...liveMatches, ...upcomingMatches, ...recentFinishedMatches];
    
    curatedMatches.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      const priorityDiff = getLeaguePriority(a.competition) - getLeaguePriority(b.competition);
      if (priorityDiff !== 0) return priorityDiff;
      return a.startTime.getTime() - b.startTime.getTime();
    });
    
    console.log(`✅ Total: ${curatedMatches.length} matchs réels récupérés`);
    
    return curatedMatches;
  } catch (error) {
    console.error('❌ Erreur récupération matchs:', error);
    return [];
  }
}

/**
 * Parse un événement de TheSportsDB en Match
 */
function parseTheSportsDbEvent(event: any, leagueName: string): Match {
  // Parser la date et l'heure
  const dateStr = event.dateEventLocal || event.dateEvent;
  const timeStr = event.strTimeLocal || event.strTime;
  
  let startTime = new Date();
  if (event.strTimestamp) {
    const timestampDate = new Date(event.strTimestamp);
    if (!Number.isNaN(timestampDate.getTime())) {
      startTime = timestampDate;
    }
  } else if (dateStr) {
    startTime = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = String(timeStr).split(':');
      const h = Number.parseInt(hours ?? '0', 10);
      const m = Number.parseInt(minutes ?? '0', 10);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        startTime.setHours(h, m, 0, 0);
      }
    }
  }
  
  // Déterminer le statut
  let status: Match['status'] = 'scheduled';
  const statusStr = String(event.strStatus || '').toLowerCase();
  const hasScore =
    event.intHomeScore !== null &&
    event.intHomeScore !== undefined &&
    event.intAwayScore !== null &&
    event.intAwayScore !== undefined;
  
  if (
    statusStr.includes('ft') ||
    statusStr.includes('finished') ||
    statusStr.includes('after penalties') ||
    statusStr.includes('aet')
  ) {
    status = 'finished';
  } else if (
    statusStr.includes('live') ||
    statusStr.includes('1h') ||
    statusStr.includes('2h') ||
    statusStr.includes('ht') ||
    statusStr.includes('in play')
  ) {
    status = 'live';
  } else if (statusStr.includes('postponed') || statusStr.includes('cancelled') || String(event.strPostponed || '').toLowerCase() === 'yes') {
    status = 'postponed';
  } else if (hasScore) {
    // Certaines réponses n'ont pas strStatus fiable : la présence du score indique terminé/en cours.
    status = startTime.getTime() < Date.now() ? 'finished' : 'scheduled';
  }
  
  const predictionsEnabled = status === 'scheduled' && startTime.getTime() > Date.now();

  return {
    id: String(event.idEvent || ''),
    externalId: String(event.idEvent || ''),
    teamAName: event.strHomeTeam || '',
    teamALogo: event.strHomeTeamBadge || '',
    teamBName: event.strAwayTeam || '',
    teamBLogo: event.strAwayTeamBadge || '',
    competition: event.strLeague || leagueName || 'Football',
    startTime,
    status,
    scoreA: Number.parseInt(String(event.intHomeScore ?? '0'), 10) || 0,
    scoreB: Number.parseInt(String(event.intAwayScore ?? '0'), 10) || 0,
    matchMinute: undefined,
    predictionsEnabled,
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
            predictions_enabled: match.predictionsEnabled,
            reward_amount: match.rewardAmount,
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
          const shouldUpdate =
            existingData.status !== match.status ||
            existingData.score_a !== match.scoreA ||
            existingData.score_b !== match.scoreB ||
            existingData.team_a_name !== match.teamAName ||
            existingData.team_b_name !== match.teamBName ||
            existingData.team_a_logo !== match.teamALogo ||
            existingData.team_b_logo !== match.teamBLogo ||
            existingData.competition !== match.competition ||
            existingData.predictions_enabled !== match.predictionsEnabled ||
            Number(existingData.reward_amount || 0) !== match.rewardAmount ||
            existingData.start_time?.toDate?.().getTime?.() !== match.startTime.getTime();

          if (shouldUpdate) {
            
            await updateDoc(existingDoc.ref, {
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
              predictions_enabled: match.predictionsEnabled,
              reward_amount: match.rewardAmount,
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

const mapMatchDocToMatch = (docSnapshot: any): Match => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    externalId: data.externalId || data.external_id,
    teamAName: data.team_a_name,
    teamALogo: data.team_a_logo,
    teamBName: data.team_b_name,
    teamBLogo: data.team_b_logo,
    competition: data.competition,
    startTime: data.start_time?.toDate ? data.start_time.toDate() : new Date(),
    status: data.status,
    scoreA: data.score_a,
    scoreB: data.score_b,
    matchMinute: data.match_minute,
    predictionsEnabled: data.predictions_enabled,
    rewardAmount: Number(data.reward_amount || 100),
    createdAt: data.created_at?.toDate() || new Date(),
    updatedAt: data.updated_at?.toDate() || new Date(),
  };
};

/**
 * Récupère les matchs depuis Firestore
 */
export async function getMatchesFromFirestore(): Promise<Match[]> {
  try {
    const matchesRef = collection(db, 'matches');
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 1);
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 10);
    windowEnd.setHours(23, 59, 59, 999);
    
    const q = query(
      matchesRef,
      where('start_time', '>=', Timestamp.fromDate(windowStart)),
      where('start_time', '<=', Timestamp.fromDate(windowEnd)),
      orderBy('start_time', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(mapMatchDocToMatch);
  } catch (error) {
    console.error('Erreur récupération matchs Firestore:', error);
    try {
      const matchesRef = collection(db, 'matches');
      const snapshot = await getDocs(matchesRef);
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - 1);
      windowStart.setHours(0, 0, 0, 0);
      const windowEnd = new Date();
      windowEnd.setDate(windowEnd.getDate() + 10);
      windowEnd.setHours(23, 59, 59, 999);

      return snapshot.docs
        .map(mapMatchDocToMatch)
        .filter((match) => match.startTime >= windowStart && match.startTime <= windowEnd)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    } catch (fallbackError) {
      console.error('Erreur fallback matchs Firestore:', fallbackError);
      return [];
    }
  }
}

export async function getMatchFromFirestore(matchId: string): Promise<Match | null> {
  try {
    const matchSnap = await getDoc(doc(db, 'matches', matchId));
    if (matchSnap.exists()) {
      return mapMatchDocToMatch(matchSnap);
    }

    const byExternalId = query(
      collection(db, 'matches'),
      where('externalId', '==', matchId),
      limit(1)
    );
    const snapshot = await getDocs(byExternalId);
    if (!snapshot.empty) {
      return mapMatchDocToMatch(snapshot.docs[0]);
    }

    return null;
  } catch (error) {
    console.error('Erreur récupération match Firestore:', error);
    return null;
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
    // Règle produit: 1 seul pronostic par jour et par utilisateur.
    const alreadyPredictedToday = await hasSubmittedPredictionToday(userId);
    if (alreadyPredictedToday) {
      return { success: false, error: 'Vous avez déjà fait votre pronostic aujourd’hui. Revenez demain.' };
    }

    // Vérifier si l'utilisateur a déjà fait un pronostic (clé stricte user_id + match_id)
    const pronosticsRef = collection(db, 'pronostics');
    const strictQuery = query(
      pronosticsRef,
      where('user_id', '==', userId),
      where('match_id', '==', matchId),
      limit(1)
    );
    const strictSnapshot = await getDocs(strictQuery);
    if (!strictSnapshot.empty) {
      return { success: false, error: 'Vous avez déjà fait un pronostic pour ce match' };
    }

    // Fallback legacy: anciens documents sans user_id/match_id
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
    const startTime = matchData.start_time?.toDate ? matchData.start_time.toDate() : null;
    const predictionsEnabled = matchData.predictions_enabled !== false;
    if (matchData.status !== 'scheduled' || !predictionsEnabled || !startTime || startTime.getTime() <= Date.now()) {
      return { success: false, error: 'Les pronostics sont fermés pour ce match' };
    }
    
    // Créer le pronostic
    await addDoc(pronosticsRef, {
      user_ref: doc(db, 'users', userId),
      match_ref: doc(db, 'matches', matchId),
      user_id: userId,
      match_id: matchId,
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

async function hasSubmittedPredictionToday(userId: string): Promise<boolean> {
  const pronosticsRef = collection(db, 'pronostics');
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const dayStart = new Date(y, m, d, 0, 0, 0, 0).getTime();
  const dayEnd = new Date(y, m, d, 23, 59, 59, 999).getTime();

  const strictQ = query(pronosticsRef, where('user_id', '==', userId));
  const strictSnap = await getDocs(strictQ);
  for (const docSnap of strictSnap.docs) {
    const submittedAt = docSnap.data()?.submitted_at;
    const submittedMs = submittedAt?.toDate ? submittedAt.toDate().getTime() : null;
    if (submittedMs && submittedMs >= dayStart && submittedMs <= dayEnd) {
      return true;
    }
  }

  // Fallback legacy docs
  const legacyUsersQ = query(pronosticsRef, where('user_ref', '==', doc(db, 'users', userId)));
  const legacyUsersSnap = await getDocs(legacyUsersQ);
  for (const docSnap of legacyUsersSnap.docs) {
    const submittedAt = docSnap.data()?.submitted_at;
    const submittedMs = submittedAt?.toDate ? submittedAt.toDate().getTime() : null;
    if (submittedMs && submittedMs >= dayStart && submittedMs <= dayEnd) {
      return true;
    }
  }

  const legacyUserQ = query(pronosticsRef, where('user_ref', '==', doc(db, 'user', userId)));
  const legacyUserSnap = await getDocs(legacyUserQ);
  for (const docSnap of legacyUserSnap.docs) {
    const submittedAt = docSnap.data()?.submitted_at;
    const submittedMs = submittedAt?.toDate ? submittedAt.toDate().getTime() : null;
    if (submittedMs && submittedMs >= dayStart && submittedMs <= dayEnd) {
      return true;
    }
  }

  return false;
}

/**
 * Récupère le pronostic d'un utilisateur pour un match
 */
export async function getUserPrediction(userId: string, matchId: string): Promise<Pronostic | null> {
  try {
    const pronosticsRef = collection(db, 'pronostics');
    const strictQ = query(
      pronosticsRef,
      where('user_id', '==', userId),
      where('match_id', '==', matchId),
      limit(1)
    );

    let snapshot = await getDocs(strictQ);

    if (snapshot.empty) {
      const legacyQ = query(
        pronosticsRef,
        where('user_ref', '==', doc(db, 'users', userId)),
        where('match_ref', '==', doc(db, 'matches', matchId)),
        limit(1)
      );
      snapshot = await getDocs(legacyQ);
    }

    if (snapshot.empty) {
      const legacyUserCollectionQ = query(
        pronosticsRef,
        where('user_ref', '==', doc(db, 'user', userId)),
        where('match_ref', '==', doc(db, 'matches', matchId)),
        limit(1)
      );
      snapshot = await getDocs(legacyUserCollectionQ);
    }

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
    const strictQ = query(pronosticsRef, where('match_id', '==', matchId));
    const legacyQ = query(pronosticsRef, where('match_ref', '==', doc(db, 'matches', matchId)));
    const [strictSnapshot, legacySnapshot] = await Promise.all([
      getDocs(strictQ),
      getDocs(legacyQ).catch(() => null)
    ]);
    
    let teamACount = 0;
    let drawCount = 0;
    let teamBCount = 0;
    const seen = new Set<string>();
    
    const countPrediction = (docSnapshot: any) => {
      if (seen.has(docSnapshot.id)) return;
      seen.add(docSnapshot.id);
      const data = docSnapshot.data();
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
    };
    
    strictSnapshot.docs.forEach(countPrediction);
    legacySnapshot?.docs.forEach(countPrediction);
    
    const total = seen.size;
    
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
    const strictQ = query(pronosticsRef, where('match_id', '==', matchId));
    const legacyQ = query(pronosticsRef, where('match_ref', '==', doc(db, 'matches', matchId)));
    const [strictSnapshot, legacySnapshot] = await Promise.all([
      getDocs(strictQ),
      getDocs(legacyQ).catch(() => null)
    ]);
    
    let winners = 0;
    let losers = 0;
    const seen = new Set<string>();
    
    // Mettre à jour chaque pronostic
    for (const docSnapshot of [...strictSnapshot.docs, ...(legacySnapshot?.docs || [])]) {
      if (seen.has(docSnapshot.id)) continue;
      seen.add(docSnapshot.id);
      const data = docSnapshot.data();
      if (data.status !== 'pending') continue;
      const isWinner = data.prediction === result;
      const newStatus = isWinner ? 'won' : 'lost';
      
      await updateDoc(docSnapshot.ref, {
        status: newStatus,
      });
      
      if (isWinner) {
        winners++;
        await creditUserWallet(data.user_id || data.user_ref?.id, matchId);
      } else {
        losers++;
      }
    }
    
    console.log(`✅ Pronostics traités: ${winners} gagnants, ${losers} perdants`);
  } catch (error) {
    console.error('Erreur traitement pronostics:', error);
  }
}

async function creditUserWallet(userId: string, matchId: string): Promise<void> {
  if (!userId) return;

  const POINTS_PER_WIN = 100;
  const userRef = doc(db, 'users', userId);
  const walletsRef = collection(db, 'wallets');
  const walletQuery = query(walletsRef, where('user_ref', '==', userRef), limit(1));
  const walletSnapshot = await getDocs(walletQuery);

  let walletRef: DocumentReference;
  if (walletSnapshot.empty) {
    walletRef = await addDoc(walletsRef, {
      user_ref: userRef,
      points: POINTS_PER_WIN,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } else {
    walletRef = walletSnapshot.docs[0].ref;
    await updateDoc(walletRef, {
      points: increment(POINTS_PER_WIN),
      updated_at: serverTimestamp()
    });
  }

  await addDoc(collection(db, 'transactions'), {
    wallet_ref: walletRef,
    user_ref: userRef,
    match_ref: doc(db, 'matches', matchId),
    type: 'credit',
    amount: POINTS_PER_WIN,
    reward_type: 'prediction_win',
    description: 'Victoire pronostic (+100 points)',
    created_at: serverTimestamp()
  });
}
