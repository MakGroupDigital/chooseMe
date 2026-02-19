import { collectionGroup, getDocs, query, orderBy, collection, getDoc, doc } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { FeedPost } from '../types';
import { sortVideosByAlgorithm } from './feedAlgorithm';

// Cache pour les infos utilisateur
const userCache = new Map<string, { displayName: string; avatarUrl: string }>();

/**
 * Récupère les infos utilisateur avec cache
 */
async function getUserInfo(userId: string, db: any): Promise<{ displayName: string; avatarUrl: string }> {
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

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

        const videoUrl = data.videoUrl?.trim();
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
          thumbnail: data.thumbnailUrl || '/assets/images/app_launcher_icon.png',
          caption: data.caption || data.description || '',
          likes: data.likes || 0,
          shares: data.shares || 0,
          comments: data.comments || 0,
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

        const rawUrl = (data.postVido as string | undefined) ?? (data.post_vido as string | undefined);
        const videoUrl = rawUrl?.trim();
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
          thumbnail: data.post_photo || '',
          caption: data.post_description || '',
          likes: Array.isArray(data.likes) ? data.likes.length : 0,
          shares: data.num_votes ?? 0,
          comments: data.num_comments ?? 0,
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
        // Conserver d'abord les infos du document vidéo, puis compléter depuis users/{id}.
        video.userName = video.userName || userInfo.displayName || 'Talent';
        video.userAvatar = video.userAvatar || userInfo.avatarUrl || '/assets/images/app_launcher_icon.png';
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
