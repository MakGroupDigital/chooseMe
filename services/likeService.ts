import { getFirestoreDb, getFirebaseAuth } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment } from 'firebase/firestore';

/**
 * Like une publication
 */
export async function likePost(postDocPath: string, userId: string): Promise<void> {
  try {
    const db = getFirestoreDb();
    const postRef = doc(db, postDocPath);
    
    // Ajouter l'userId au tableau des likes
    await updateDoc(postRef, {
      likes: arrayUnion(userId)
    });
    
    console.log('✅ Post liké:', postDocPath);
  } catch (error) {
    console.error('❌ Erreur lors du like:', error);
    throw error;
  }
}

/**
 * Unlike une publication
 */
export async function unlikePost(postDocPath: string, userId: string): Promise<void> {
  try {
    const db = getFirestoreDb();
    const postRef = doc(db, postDocPath);
    
    // Retirer l'userId du tableau des likes
    await updateDoc(postRef, {
      likes: arrayRemove(userId)
    });
    
    console.log('✅ Post unliké:', postDocPath);
  } catch (error) {
    console.error('❌ Erreur lors du unlike:', error);
    throw error;
  }
}

/**
 * Toggle like/unlike
 */
export async function toggleLikePost(postDocPath: string, userId: string, isLiked: boolean): Promise<void> {
  if (isLiked) {
    await unlikePost(postDocPath, userId);
  } else {
    await likePost(postDocPath, userId);
  }
}

/**
 * Vérifie si l'utilisateur a liké un post
 */
export async function hasUserLikedPost(postDocPath: string, userId: string): Promise<boolean> {
  try {
    const db = getFirestoreDb();
    const postRef = doc(db, postDocPath);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) return false;
    
    const data = postSnap.data();
    const likes = data.likes || [];
    
    return Array.isArray(likes) && likes.includes(userId);
  } catch (error) {
    console.error('❌ Erreur vérification like:', error);
    return false;
  }
}

/**
 * Récupère les likes d'un utilisateur au chargement
 */
export async function getUserLikedPosts(userId: string, postDocPaths: string[]): Promise<Set<string>> {
  const likedPosts = new Set<string>();
  
  try {
    const db = getFirestoreDb();
    
    // Vérifier chaque post
    await Promise.all(
      postDocPaths.map(async (docPath) => {
        try {
          const postRef = doc(db, docPath);
          const postSnap = await getDoc(postRef);
          
          if (postSnap.exists()) {
            const data = postSnap.data();
            const likes = data.likes || [];
            
            if (Array.isArray(likes) && likes.includes(userId)) {
              likedPosts.add(docPath);
            }
          }
        } catch (err) {
          console.error('Erreur vérification like pour', docPath, err);
        }
      })
    );
  } catch (error) {
    console.error('❌ Erreur récupération likes utilisateur:', error);
  }
  
  return likedPosts;
}
