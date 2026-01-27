import { collectionGroup, getDocs, orderBy, query, collection, getDoc, doc } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { FeedPost } from '../types';
import { sortVideosByAlgorithm } from './feedAlgorithm';

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

        // Récupérer les infos utilisateur
        let userName = 'Talent';
        let userAvatar = '/assets/images/app_launcher_icon.png';
        
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = userData.displayName || userData.display_name || 'Talent';
            userAvatar = userData.avatarUrl || userData.photoUrl || userData.photo_url || '/assets/images/app_launcher_icon.png';
          }
        } catch (e) {
          console.warn('Erreur récupération utilisateur:', userId);
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
          userName: userName,
          userAvatar: userAvatar,
          type: 'video',
          url: videoUrl,
          thumbnail: data.thumbnailUrl || userAvatar,
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
          userName: data.nomPoster || 'Talent',
          userAvatar: data.post_photo || '/assets/images/app_launcher_icon.png',
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

    console.log(`✅ TOTAL: ${allVideos.length} vidéos chargées (performances + publication)`);
    
    // Appliquer l'algorithme de tri intelligent
    const sortedVideos = sortVideosByAlgorithm(allVideos, options);
    
    return sortedVideos;
  } catch (e) {
    console.error('❌ Erreur chargement vidéos:', e);
    return [];
  }
}


