import type { FeedPost } from '../types';
import { fetchVideoFeed } from './feedService';

interface PreloadOptions {
  userId: string;
  followingUsers: Set<string>;
  recentlySeenVideos: Set<string>;
  initialBatchSize?: number;
  totalBatchSize?: number;
}

interface PreloadResult {
  initialVideos: FeedPost[];
  loadMoreVideos: () => Promise<FeedPost[]>;
  allVideosLoaded: boolean;
}

let cachedAllVideos: FeedPost[] = [];
let currentBatchIndex = 0;

/**
 * Précharge les vidéos par batch
 * Retourne les premières vidéos immédiatement et charge les autres en arrière-plan
 */
export async function preloadVideoFeed(options: PreloadOptions): Promise<PreloadResult> {
  const {
    userId,
    followingUsers,
    recentlySeenVideos,
    initialBatchSize = 8,
    totalBatchSize = 50
  } = options;

  try {
    console.log('🚀 Démarrage du preload des vidéos...');
    
    // Charger toutes les vidéos en arrière-plan
    const allVideosPromise = fetchVideoFeed({
      userId,
      followingUsers,
      recentlySeenVideos
    });

    // Attendre les premières vidéos
    const allVideos = await allVideosPromise;
    cachedAllVideos = allVideos;
    currentBatchIndex = 0;

    console.log(`✅ ${allVideos.length} vidéos chargées au total`);

    // Retourner les premières vidéos
    const initialVideos = allVideos.slice(0, initialBatchSize);
    console.log(`📺 ${initialVideos.length} vidéos initiales prêtes`);

    return {
      initialVideos,
      loadMoreVideos: async () => {
        const nextBatch = cachedAllVideos.slice(
          currentBatchIndex + initialBatchSize,
          currentBatchIndex + initialBatchSize + totalBatchSize
        );
        currentBatchIndex += totalBatchSize;
        console.log(`📺 ${nextBatch.length} vidéos supplémentaires chargées`);
        return nextBatch;
      },
      allVideosLoaded: allVideos.length <= initialBatchSize
    };
  } catch (error) {
    console.error('❌ Erreur preload:', error);
    throw error;
  }
}

/**
 * Réinitialise le cache
 */
export function resetPreloadCache(): void {
  cachedAllVideos = [];
  currentBatchIndex = 0;
}
