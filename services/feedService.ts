import { collectionGroup, getDocs, query, orderBy, collection, getDoc, doc } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { FeedPost } from '../types';
import { sortVideosByAlgorithm } from './feedAlgorithm';
import { normalizeEngagementCount } from '../utils/engagement';

// Cache pour les infos utilisateur
const userCache = new Map<string, { displayName: string; avatarUrl: string }>();

const VIDEO_URL_FIELDS = [
  'cloudinaryUrl',
  'cloudinaryVideoUrl',
  'secure_url',
  'secureUrl',
  'videoUrl',
  'video_url',
  'video',
  'postVido',
  'post_vido',
  'postVideo',
  'post_video',
  'mediaUrl',
  'media_url',
  'fileUrl',
  'file_url',
  'url'
];

const THUMBNAIL_FIELDS = [
  'thumbnailUrl',
  'thumbnail_url',
  'thumbnail',
  'posterUrl',
  'poster_url',
  'poster',
  'post_photo'
];

const isPlayableVideoUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;

  const url = value.trim();
  if (!/^https?:\/\//i.test(url)) return false;

  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('res.cloudinary.com') ||
    lowerUrl.includes('/video/upload/') ||
    lowerUrl.includes('firebasestorage.googleapis.com') ||
    /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(lowerUrl)
  );
};

const findUrlInValue = (value: unknown, preferCloudinary: boolean): string | null => {
  if (isPlayableVideoUrl(value)) {
    const url = value.trim();
    if (!preferCloudinary || url.includes('res.cloudinary.com')) return url;
  }

  if (!value || typeof value !== 'object') return null;

  const values = Array.isArray(value) ? value : Object.values(value);
  const fallbackUrls: string[] = [];

  for (const item of values) {
    if (isPlayableVideoUrl(item)) {
      const url = item.trim();
      if (url.includes('res.cloudinary.com')) return url;
      fallbackUrls.push(url);
      continue;
    }

    if (item && typeof item === 'object') {
      const nested = findUrlInValue(item, preferCloudinary);
      if (nested) return nested;
    }
  }

  return preferCloudinary ? fallbackUrls[0] || null : null;
};

const getVideoUrl = (data: Record<string, any>): string => {
  const directCandidates = VIDEO_URL_FIELDS
    .map((field) => data[field])
    .filter((value) => typeof value === 'string' && value.trim()) as string[];

  const cloudinaryCandidate = directCandidates.find((url) => url.includes('res.cloudinary.com'));
  if (cloudinaryCandidate && isPlayableVideoUrl(cloudinaryCandidate)) {
    return cloudinaryCandidate.trim();
  }

  for (const value of directCandidates) {
    if (isPlayableVideoUrl(value)) return value.trim();
  }

  return findUrlInValue(data, true) || '';
};

const getThumbnailUrl = (data: Record<string, any>, fallback = ''): string => {
  for (const field of THUMBNAIL_FIELDS) {
    const value = data[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return fallback;
};

const COMMENT_COUNT_FIELDS = [
  'num_comments',
  'comments',
  'commentCount',
  'comment_count',
  'commentsCount',
  'numComments'
];

const getCommentCount = (data: Record<string, any>): number =>
  Math.max(...COMMENT_COUNT_FIELDS.map((field) => normalizeEngagementCount(data[field])));

/**
 * Récupère les infos utilisateur avec cache
 */
async function getUserInfo(userId: string, db: any): Promise<{ displayName: string; avatarUrl: string }> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const info = {
        displayName:
          userData.displayName ||
          userData.display_name ||
          userData.userName ||
          userData.username ||
          userData.nom ||
          userData.nomPoster ||
          userData.name ||
          '',
        avatarUrl:
          userData.avatarUrl ||
          userData.photoUrl ||
          userData.photo_url ||
          userData.avatar_url ||
          userData.post_photo ||
          userData.photo ||
          ''
      };
      userCache.set(userId, info);
      return info;
    }
  } catch (e) {
    console.warn('Erreur récupération utilisateur:', userId);
  }

  const defaultInfo = {
    displayName: '',
    avatarUrl: ''
  };
  userCache.set(userId, defaultInfo);
  return defaultInfo;
}

// Récupère les vidéos depuis deux sources :
// 1. users/{userId}/performances (nouvelle structure)
// 2. users/{userId}/publication (ancienne structure Flutter)
export async function fetchVideoFeed(options?: {
  userId?: string;
  followingUsers?: Set<string>;
  recentlySeenVideos?: Set<string>;
}): Promise<FeedPost[]> {
  const db = getFirestoreDb();

  try {
    const allVideos: FeedPost[] = [];
    const userInfoPromises = new Map<string, Promise<{ displayName: string; avatarUrl: string }>>();

    // ========== SOURCE 1 : PERFORMANCES ==========
    console.log('📹 Chargement des vidéos depuis performances...');
    try {
      const performancesQuery = query(
        collectionGroup(db, 'performances'),
        orderBy('createdAt', 'desc')
      );
      const performancesSnap = await getDocs(performancesQuery);

      for (const docSnap of performancesSnap.docs) {
        const data = docSnap.data() as any;

        const videoUrl = getVideoUrl(data);
        if (!videoUrl) continue;

        // Récupérer l'ID utilisateur depuis le chemin
        const pathParts = docSnap.ref.path.split('/');
        const userId = pathParts[1];

        // Récupérer les infos utilisateur EN PARALLÈLE
        if (!userInfoPromises.has(userId)) {
          userInfoPromises.set(userId, getUserInfo(userId, db));
        }

        const createdAt: string = data.createdAt && data.createdAt.toDate
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString();

        const hashtags: string[] = Array.isArray(data.hashtags) 
          ? data.hashtags.filter((t: unknown) => typeof t === 'string' && (t as string).trim().length > 0)
          : [];

        allVideos.push({
          id: `perf_${docSnap.id}`,
          userId: userId,
          userName:
            data.userName ||
            data.username ||
            data.nomPoster ||
            data.displayName ||
            data.display_name ||
            '',
          userAvatar:
            data.userAvatar ||
            data.avatarUrl ||
            data.photoUrl ||
            data.post_photo ||
            '',
          type: 'video',
          url: videoUrl,
          thumbnail: getThumbnailUrl(data, '/assets/images/app_launcher_icon.png'),
          caption: data.caption || data.description || '',
          likes: normalizeEngagementCount(data.likes),
          shares: normalizeEngagementCount(data.shares),
          comments: getCommentCount(data),
          createdAt,
          hashtags,
          docPath: docSnap.ref.path
        });
      }

      console.log(`✅ ${performancesSnap.size} vidéos chargées depuis performances`);
    } catch (e) {
      console.warn('⚠️ Erreur chargement performances:', e);
    }

    // ========== SOURCE 2 : PUBLICATION (Flutter) ==========
    console.log('📹 Chargement des vidéos depuis publication...');
    try {
      const publicationQuery = query(
        collectionGroup(db, 'publication'),
        orderBy('time_posted', 'desc')
      );
      const publicationSnap = await getDocs(publicationQuery);

      for (const docSnap of publicationSnap.docs) {
        const data = docSnap.data() as any;

        const videoUrl = getVideoUrl(data);
        if (!videoUrl) continue;

        // Récupérer l'ID utilisateur depuis le chemin
        const pathParts = docSnap.ref.path.split('/');
        const userId = pathParts[1];

        // Récupérer les infos utilisateur EN PARALLÈLE
        if (!userInfoPromises.has(userId)) {
          userInfoPromises.set(userId, getUserInfo(userId, db));
        }

        const createdAt: string = data.time_posted && data.time_posted.toDate
          ? data.time_posted.toDate().toISOString()
          : new Date().toISOString();

        // Hashtags : combiner "ashtag" et "type"
        const hashtags: string[] = [];
        if (typeof data.ashtag === 'string' && data.ashtag.trim()) {
          hashtags.push(
            ...data.ashtag
              .trim()
              .split(/\s+/)
              .filter((t: string) => t.length > 0)
          );
        }
        if (Array.isArray(data.type)) {
          hashtags.push(
            ...data.type.filter((t: unknown) => typeof t === 'string' && (t as string).trim().length > 0)
          );
        }

        allVideos.push({
          id: `pub_${docSnap.id}`,
          userId: userId,
          userName:
            data.nomPoster ||
            data.userName ||
            data.displayName ||
            data.display_name ||
            data.username ||
            '',
          userAvatar:
            data.post_photo ||
            data.userAvatar ||
            data.avatarUrl ||
            data.photoUrl ||
            '',
          type: 'video',
          url: videoUrl,
          thumbnail: getThumbnailUrl(data, data.post_photo || ''),
          caption: data.post_description || '',
          likes: normalizeEngagementCount(data.likes),
          shares: normalizeEngagementCount(data.num_votes),
          comments: getCommentCount(data),
          createdAt,
          hashtags,
          docPath: docSnap.ref.path
        });
      }

      console.log(`✅ ${publicationSnap.size} vidéos chargées depuis publication`);
    } catch (e) {
      console.warn('⚠️ Erreur chargement publication:', e);
    }

    // Attendre que toutes les infos utilisateur soient chargées EN PARALLÈLE
    console.log('⏳ Chargement des infos utilisateur...');
    const userInfoResults = await Promise.all(userInfoPromises.values());
    const userIds = Array.from(userInfoPromises.keys());
    
    // Mettre à jour les vidéos avec les infos utilisateur
    allVideos.forEach(video => {
      const userIndex = userIds.indexOf(video.userId);
      if (userIndex !== -1 && userInfoResults[userIndex]) {
        const userInfo = userInfoResults[userIndex];
        // L'avatar du profil doit être la source de vérité: les documents vidéo
        // peuvent garder une ancienne copie Firebase Storage.
        video.userName = video.userName || userInfo.displayName || 'Talent';
        video.userAvatar = userInfo.avatarUrl || video.userAvatar || '/assets/images/app_launcher_icon.png';
      } else {
        video.userName = video.userName || 'Talent';
        video.userAvatar = video.userAvatar || '/assets/images/app_launcher_icon.png';
      }
    });

    console.log(`✅ TOTAL: ${allVideos.length} vidéos chargées (performances + publication)`);
    
    // Appliquer l'algorithme de tri intelligent
    const sortedVideos = sortVideosByAlgorithm(allVideos, options);
    
    return sortedVideos;
  } catch (e) {
    console.error('❌ Erreur chargement vidéos:', e);
    return [];
  }
}
