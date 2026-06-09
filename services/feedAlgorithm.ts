import type { FeedPost } from '../types';
import { normalizeEngagementCount } from '../utils/engagement';

/**
 * Algorithme de recommandation type TikTok
 * Calcule un score pour chaque vidéo basé sur plusieurs critères
 */

interface VideoScore {
  post: FeedPost;
  score: number;
  breakdown: {
    engagement: number;
    recency: number;
    diversity: number;
    viral: number;
  };
}

/**
 * Calcule le score d'engagement d'une vidéo
 * Prend en compte les likes, commentaires et partages avec des poids différents
 */
function calculateEngagementScore(post: FeedPost): number {
  const LIKE_WEIGHT = 1;
  const COMMENT_WEIGHT = 3; // Les commentaires valent plus que les likes
  const SHARE_WEIGHT = 5; // Les partages valent encore plus
  const likes = normalizeEngagementCount(post.likes);
  const comments = normalizeEngagementCount(post.comments);
  const shares = normalizeEngagementCount(post.shares);
  
  const engagementScore = 
    (likes * LIKE_WEIGHT) +
    (comments * COMMENT_WEIGHT) +
    (shares * SHARE_WEIGHT);
  
  // Normaliser le score (logarithme pour éviter que les vidéos très populaires écrasent tout)
  return Math.log10(engagementScore + 1) * 10;
}

/**
 * Calcule le score de fraîcheur d'une vidéo
 * Les vidéos récentes ont un boost pour avoir leur chance
 */
function calculateRecencyScore(post: FeedPost): number {
  const now = new Date().getTime();
  const postDate = new Date(post.createdAt || now).getTime();
  const ageInHours = (now - postDate) / (1000 * 60 * 60);
  
  // Boost important pour les vidéos de moins de 24h
  if (ageInHours < 24) return 30;
  // Boost moyen pour les vidéos de moins de 3 jours
  if (ageInHours < 72) return 20;
  // Boost léger pour les vidéos de moins d'une semaine
  if (ageInHours < 168) return 10;
  // Pas de boost pour les vidéos plus anciennes
  return 0;
}

/**
 * Calcule le potentiel viral d'une vidéo
 * Ratio engagement/âge pour détecter les vidéos qui montent rapidement
 */
function calculateViralScore(post: FeedPost): number {
  const now = new Date().getTime();
  const postDate = new Date(post.createdAt || now).getTime();
  const ageInHours = Math.max((now - postDate) / (1000 * 60 * 60), 1);
  const likes = normalizeEngagementCount(post.likes);
  const comments = normalizeEngagementCount(post.comments);
  const shares = normalizeEngagementCount(post.shares);
  
  const totalEngagement = likes + (comments * 3) + (shares * 5);
  const viralVelocity = totalEngagement / ageInHours;
  
  // Si la vidéo a beaucoup d'engagement en peu de temps, c'est viral
  return Math.min(viralVelocity * 2, 50); // Cap à 50 points
}

/**
 * Calcule le score de diversité
 * Évite de montrer trop de vidéos du même créateur
 */
function calculateDiversityScore(
  post: FeedPost, 
  recentlySeenUsers: Set<string>,
  userVideoCount: Map<string, number>
): number {
  // Pénalité si l'utilisateur a déjà été vu récemment
  if (recentlySeenUsers.has(post.userId)) {
    return -20;
  }
  
  // Boost pour les créateurs avec peu de vidéos (nouveaux talents)
  const videoCount = userVideoCount.get(post.userId) || 1;
  if (videoCount === 1) return 15; // Premier post = gros boost
  if (videoCount <= 3) return 10;
  if (videoCount <= 5) return 5;
  
  return 0;
}

/**
 * Algorithme principal de tri des vidéos
 * Mélange intelligent basé sur plusieurs critères
 */
export function sortVideosByAlgorithm(
  videos: FeedPost[],
  options: {
    userId?: string;
    followingUsers?: Set<string>;
    recentlySeenVideos?: Set<string>;
  } = {}
): FeedPost[] {
  const { followingUsers = new Set(), recentlySeenVideos = new Set() } = options;
  
  // Compter le nombre de vidéos par utilisateur
  const userVideoCount = new Map<string, number>();
  videos.forEach(video => {
    userVideoCount.set(video.userId, (userVideoCount.get(video.userId) || 0) + 1);
  });
  
  // Tracker les utilisateurs récemment vus (pour la diversité)
  const recentlySeenUsers = new Set<string>();
  
  // Calculer le score pour chaque vidéo
  const scoredVideos: VideoScore[] = videos
    .filter(video => !recentlySeenVideos.has(video.id)) // Exclure les vidéos déjà vues
    .map(post => {
      const engagementScore = calculateEngagementScore(post);
      const recencyScore = calculateRecencyScore(post);
      const viralScore = calculateViralScore(post);
      const diversityScore = calculateDiversityScore(post, recentlySeenUsers, userVideoCount);
      
      // Boost pour les vidéos des personnes suivies
      const followingBoost = followingUsers.has(post.userId) ? 25 : 0;
      
      // Score total
      const totalScore = 
        engagementScore +
        recencyScore +
        viralScore +
        diversityScore +
        followingBoost +
        (Math.random() * 10); // Facteur aléatoire pour la découverte
      
      return {
        post,
        score: totalScore,
        breakdown: {
          engagement: engagementScore,
          recency: recencyScore,
          viral: viralScore,
          diversity: diversityScore
        }
      };
    });
  
  // Trier par score décroissant
  scoredVideos.sort((a, b) => b.score - a.score);
  
  // Appliquer une stratégie de mélange intelligent
  // 70% des vidéos triées par score, 30% aléatoires pour la découverte
  const sortedCount = Math.floor(scoredVideos.length * 0.7);
  const topVideos = scoredVideos.slice(0, sortedCount);
  const randomVideos = scoredVideos.slice(sortedCount);
  
  // Mélanger les vidéos aléatoires
  for (let i = randomVideos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomVideos[i], randomVideos[j]] = [randomVideos[j], randomVideos[i]];
  }
  
  // Combiner et insérer des vidéos aléatoires tous les 5-7 posts
  const finalFeed: FeedPost[] = [];
  let topIndex = 0;
  let randomIndex = 0;
  let counter = 0;
  
  while (topIndex < topVideos.length || randomIndex < randomVideos.length) {
    counter++;
    
    // Tous les 5-7 posts, insérer une vidéo aléatoire pour la découverte
    const shouldInsertRandom = counter % (5 + Math.floor(Math.random() * 3)) === 0;
    
    if (shouldInsertRandom && randomIndex < randomVideos.length) {
      finalFeed.push(randomVideos[randomIndex].post);
      randomIndex++;
    } else if (topIndex < topVideos.length) {
      finalFeed.push(topVideos[topIndex].post);
      recentlySeenUsers.add(topVideos[topIndex].post.userId);
      topIndex++;
    } else if (randomIndex < randomVideos.length) {
      finalFeed.push(randomVideos[randomIndex].post);
      randomIndex++;
    }
  }
  
  console.log('🎯 Algorithme de tri appliqué:', {
    totalVideos: videos.length,
    topVideos: topVideos.length,
    randomVideos: randomVideos.length,
    finalFeed: finalFeed.length
  });
  
  return finalFeed;
}

/**
 * Fonction pour mettre à jour le score d'une vidéo après interaction
 * Permet d'améliorer les recommandations en temps réel
 */
export function updateVideoScore(
  video: FeedPost,
  interaction: 'like' | 'comment' | 'share' | 'skip'
): void {
  // Cette fonction peut être utilisée pour tracker les interactions
  // et améliorer l'algorithme au fil du temps
  console.log('📊 Interaction enregistrée:', {
    videoId: video.id,
    userId: video.userId,
    interaction
  });
}
