import { useState, useCallback, useEffect } from 'react';
import { toggleLikePost, hasUserLikedPost } from '../services/likeService';
import { getFirebaseAuth } from '../services/firebase';
import { normalizeEngagementCount } from '../utils/engagement';

interface UseLikeReturn {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  handleLike: () => Promise<void>;
  triggerAnimation: boolean;
}

export function useLike(postDocPath: string, initialLikeCount: unknown): UseLikeReturn {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(() => {
    const count = normalizeEngagementCount(initialLikeCount);
    console.log('📊 initialLikeCount:', initialLikeCount, '-> likeCount:', count);
    return count;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [triggerAnimation, setTriggerAnimation] = useState(false);

  // Charger l'état initial du like au montage
  useEffect(() => {
    const loadInitialLikeState = async () => {
      if (!postDocPath) {
        console.warn('⚠️ postDocPath vide, impossible de charger l\'état du like');
        return;
      }
      
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        
        if (!user) {
          console.log('Utilisateur non connecté');
          return;
        }

        console.log('📍 Chargement état like pour:', postDocPath);
        const liked = await hasUserLikedPost(postDocPath, user.uid);
        setIsLiked(liked);
        console.log('✅ État du like chargé:', liked);
      } catch (error) {
        console.error('❌ Erreur chargement état like:', error);
      }
    };

    loadInitialLikeState();
  }, [postDocPath]);

  // Gérer le like avec optimistic update
  const handleLike = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      
      if (!user) {
        alert('Veuillez vous connecter pour liker');
        return;
      }

      if (!postDocPath) {
        console.error('❌ postDocPath manquant');
        alert('Impossible de liker cette vidéo');
        return;
      }

      // Optimistic update - mettre à jour l'UI immédiatement
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikeCount(prev => {
        const current = normalizeEngagementCount(prev);
        return newIsLiked ? current + 1 : Math.max(0, current - 1);
      });
      
      // Déclencher l'animation
      console.log('🎉 Animation déclenchée! isLiked:', newIsLiked);
      setTriggerAnimation(true);
      setTimeout(() => setTriggerAnimation(false), 700);

      // Appel serveur en arrière-plan
      setIsLoading(true);
      await toggleLikePost(postDocPath, user.uid, isLiked);
      setIsLoading(false);
      
      console.log('✅ Like mis à jour');
    } catch (error) {
      console.error('❌ Erreur lors du like:', error);
      
      // Rollback en cas d'erreur
      setIsLiked(prev => !prev);
      setLikeCount(prev => {
        const current = normalizeEngagementCount(prev);
        return isLiked ? current + 1 : Math.max(0, current - 1);
      });
      alert('Erreur lors du like. Veuillez réessayer.');
    }
  }, [isLiked, postDocPath]);

  return {
    isLiked,
    likeCount,
    isLoading,
    handleLike,
    triggerAnimation
  };
}
