import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { PostComment } from '../types';

// Sous-collection de commentaires par publication :
// /users/{userId}/publication/{pubId}/comments/{commentId}
// ou toute autre racine, puisque nous utilisons le chemin complet stocké dans FeedPost.

export async function fetchComments(docPath: string): Promise<PostComment[]> {
  const db = getFirestoreDb();
  const publicationRef = doc(db, docPath);
  const commentsCol = collection(publicationRef, 'comments');

  const q = query(commentsCol, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    const createdAt =
      data.createdAt && data.createdAt.toDate
        ? data.createdAt.toDate().toLocaleString()
        : '';

    return {
      id: d.id,
      userId: data.userId || '',
      userName: data.userName || 'Utilisateur',
      userAvatar: data.userAvatar || undefined,
      text: data.text || '',
      createdAt,
      likes: typeof data.likes === 'number' ? data.likes : 0
    };
  });
}

export async function addComment(options: {
  docPath: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
}): Promise<void> {
  const db = getFirestoreDb();
  const publicationRef = doc(db, options.docPath);
  const commentsCol = collection(publicationRef, 'comments');

  await addDoc(commentsCol, {
    userId: options.userId,
    userName: options.userName,
    userAvatar: options.userAvatar ?? null,
    text: options.text.trim(),
    createdAt: serverTimestamp(),
    likes: 0
  });

  // Incrémente num_comments sur la publication pour rester cohérent avec Flutter.
  try {
    await updateDoc(publicationRef, {
      num_comments: increment(1)
    });
  } catch (e) {
    // Si l'incrément échoue, ce n'est pas bloquant pour l'ajout du commentaire.
    console.warn('Impossible de mettre à jour num_comments:', e);
  }
}

export async function likeComment(options: {
  docPath: string;
  commentId: string;
}): Promise<void> {
  const db = getFirestoreDb();
  const commentRef = doc(db, `${options.docPath}/comments/${options.commentId}`);
  await updateDoc(commentRef, {
    likes: increment(1)
  });
}

