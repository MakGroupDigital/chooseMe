import { collection, collectionGroup, getDocs } from 'firebase/firestore';
import { UserType } from '../types';
import { getFirestoreDb } from './firebase';

export interface TalentExplorerItem {
  id: string;
  displayName: string;
  avatarUrl: string;
  sport: string;
  position: string;
  country: string;
  city: string;
  height?: number;
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    points: number;
  };
  videosCount: number;
  totalLikes: number;
  score: number;
  rating: number;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeType(raw: unknown): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function resolveAccountType(data: any): string {
  return normalizeType(
    data?.type ??
      data?.accountType ??
      data?.typeCompte ??
      data?.profileType ??
      data?.userType
  );
}

function isTalentType(rawType: unknown): boolean {
  const value = normalizeType(rawType);
  return value === UserType.ATHLETE || value === 'athlete' || value === 'talent' || value === 'talents';
}

function isNonTalentType(rawType: unknown): boolean {
  const value = normalizeType(rawType);
  return value === UserType.RECRUITER || value === UserType.CLUB || value === UserType.PRESS || value === UserType.VISITOR;
}

function buildTalentScore(item: Omit<TalentExplorerItem, 'score' | 'rating'>): { score: number; rating: number } {
  const statsScore =
    item.stats.matchesPlayed * 1 +
    item.stats.goals * 4 +
    item.stats.assists * 3 +
    item.stats.points * 2;

  const score = statsScore + item.totalLikes * 2 + item.videosCount * 5;
  const rating = Math.min(5, Math.max(3, 3 + score / 220));
  return {
    score,
    rating: Math.round(rating * 10) / 10
  };
}

export async function fetchTalentExplorerItems(): Promise<TalentExplorerItem[]> {
  const db = getFirestoreDb();

  const [usersSnap, userSnap, performancesSnap, publicationsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'user')),
    getDocs(collectionGroup(db, 'performances')),
    getDocs(collectionGroup(db, 'publication'))
  ]);

  type UserDocSource = {
    collectionName: 'users' | 'user';
    docId: string;
    userId: string;
    data: any;
  };

  const allSourcesFromProfiles: UserDocSource[] = [
    ...usersSnap.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      const userId = String(data?.uid || data?.userId || data?.id || docSnap.id);
      return { collectionName: 'users' as const, docId: docSnap.id, userId, data };
    }),
    ...userSnap.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      const userId = String(data?.uid || data?.userId || data?.id || docSnap.id);
      return { collectionName: 'user' as const, docId: docSnap.id, userId, data };
    })
  ];

  // Agréger les métriques vidéos directement depuis les sous-collections globales.
  const videoMetrics = new Map<string, { videosCount: number; totalLikes: number }>();

  performancesSnap.docs.forEach((docSnap) => {
    const parts = docSnap.ref.path.split('/');
    if (parts.length < 4) return;
    const root = parts[0];
    const docId = parts[1];
    if (root !== 'users' && root !== 'user') return;
    const key = `${root}/${docId}`;
    const current = videoMetrics.get(key) || { videosCount: 0, totalLikes: 0 };
    const data = docSnap.data() as any;
    current.videosCount += 1;
    current.totalLikes += asNumber(data?.likes, 0);
    videoMetrics.set(key, current);
  });

  publicationsSnap.docs.forEach((docSnap) => {
    const parts = docSnap.ref.path.split('/');
    if (parts.length < 4) return;
    const root = parts[0];
    const docId = parts[1];
    if (root !== 'users' && root !== 'user') return;
    const key = `${root}/${docId}`;
    const current = videoMetrics.get(key) || { videosCount: 0, totalLikes: 0 };
    const data = docSnap.data() as any;
    current.videosCount += 1;
    if (Array.isArray(data?.likes)) {
      current.totalLikes += data.likes.length;
    } else {
      current.totalLikes += asNumber(data?.likes, 0);
    }
    videoMetrics.set(key, current);
  });

  // Inclure les docs qui apparaissent dans les métriques même si le type est mal renseigné.
  const allSources: UserDocSource[] = [...allSourcesFromProfiles];
  for (const key of videoMetrics.keys()) {
    const [root, docId] = key.split('/');
    const collectionName = root === 'user' ? 'user' : 'users';
    if (!allSources.some((s) => s.collectionName === collectionName && s.docId === docId)) {
      allSources.push({
        collectionName,
        docId,
        userId: docId,
        data: {}
      });
    }
  }

  // Fusionner les deux collections sans doublons (clé: userId)
  const mergedByUserId = new Map<string, UserDocSource[]>();
  for (const source of allSources) {
    const list = mergedByUserId.get(source.userId) || [];
    list.push(source);
    mergedByUserId.set(source.userId, list);
  }

  const mergedEntries = Array.from(mergedByUserId.entries()).map(([userId, sources]) => {
    // Préférer "users" comme base, fallback "user"
    const preferred = sources.find((s) => s.collectionName === 'users') || sources[0];
    return {
      userId,
      preferred,
      allSources: sources
    };
  });

  const enriched = await Promise.all(
    mergedEntries.map(async ({ userId, preferred, allSources }) => {
      const data = preferred.data;
      const profileTypes = allSources.map((s) => resolveAccountType(s.data));
      const hasExplicitTalentType = profileTypes.some((t) => isTalentType(t));
      const hasExplicitNonTalentType = profileTypes.some((t) => isNonTalentType(t));

      let totalLikes = 0;
      let videosCount = 0;
      for (const source of allSources) {
        const byDocId = videoMetrics.get(`${source.collectionName}/${source.docId}`);
        if (byDocId) {
          totalLikes += byDocId.totalLikes;
          videosCount += byDocId.videosCount;
        }
      }
      // Dédoublonner agrégation multi-sources sur un même document
      const uniqueMetricKeys = new Set(allSources.map((s) => `${s.collectionName}/${s.docId}`));
      totalLikes = 0;
      videosCount = 0;
      uniqueMetricKeys.forEach((k) => {
        const v = videoMetrics.get(k);
        if (!v) return;
        totalLikes += v.totalLikes;
        videosCount += v.videosCount;
      });

      // fallback sur compteurs déjà présents si aucune vidéo trouvée
      if (videosCount === 0) {
        const fallbackVideos = asNumber(data?.videosCount ?? data?.videoCount ?? data?.nbVideos, 0);
        if (fallbackVideos > 0) {
          videosCount = fallbackVideos;
        }
      }

      // Inclure si type talent explicite OU s'il y a activité vidéo et pas de type excluant.
      const shouldInclude = hasExplicitTalentType || (videosCount > 0 && !hasExplicitNonTalentType);
      if (!shouldInclude) {
        return null;
      }

      const base: Omit<TalentExplorerItem, 'score' | 'rating'> = {
        id: preferred.docId || userId,
        displayName:
          data?.displayName ||
          data?.display_name ||
          data?.userName ||
          data?.username ||
          data?.nom ||
          'Talent',
        avatarUrl:
          data?.avatarUrl ||
          data?.photoUrl ||
          data?.photo_url ||
          data?.avatar_url ||
          '/assets/images/app_launcher_icon.png',
        sport: data?.sport || data?.sporttype || data?.sport_type || 'Sport',
        position: data?.position || data?.poste || 'Athlete',
        country: data?.country || data?.pays || '',
        city: data?.city || data?.ville || '',
        height: asNumber(data?.height ?? data?.taille, 0) || undefined,
        stats: {
          matchesPlayed: asNumber(data?.stats?.matchesPlayed ?? data?.matchesPlayed ?? data?.matches_played, 0),
          goals: asNumber(data?.stats?.goals ?? data?.goals ?? data?.buts, 0),
          assists: asNumber(data?.stats?.assists ?? data?.assists ?? data?.passes, 0),
          points: asNumber(data?.stats?.points ?? data?.points, 0)
        },
        videosCount,
        totalLikes
      };

      const { score, rating } = buildTalentScore(base);
      return {
        ...base,
        score,
        rating
      };
    })
  );

  return enriched.filter(Boolean).sort((a, b) => b!.score - a!.score) as TalentExplorerItem[];
}
