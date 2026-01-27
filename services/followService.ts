import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';

export interface FollowData {
  followerId: string;
  followingId: string;
  followedAt: Date;
}

/**
 * Follow an athlete
 */
export async function followAthlete(followerId: string, athleteId: string): Promise<void> {
  const db = getFirestoreDb();

  try {
    // Add to follower's following list
    const followerRef = doc(db, 'users', followerId);
    await setDoc(
      followerRef,
      {
        following: arrayUnion(athleteId)
      },
      { merge: true }
    );

    // Add to athlete's followers list
    const athleteRef = doc(db, 'users', athleteId);
    await setDoc(
      athleteRef,
      {
        followers: arrayUnion(followerId)
      },
      { merge: true }
    );
  } catch (e) {
    console.error('Erreur lors du suivi de l\'athlète:', e);
    throw e;
  }
}

/**
 * Unfollow an athlete
 */
export async function unfollowAthlete(followerId: string, athleteId: string): Promise<void> {
  const db = getFirestoreDb();

  try {
    // Remove from follower's following list
    const followerRef = doc(db, 'users', followerId);
    await setDoc(
      followerRef,
      {
        following: arrayRemove(athleteId)
      },
      { merge: true }
    );

    // Remove from athlete's followers list
    const athleteRef = doc(db, 'users', athleteId);
    await setDoc(
      athleteRef,
      {
        followers: arrayRemove(followerId)
      },
      { merge: true }
    );
  } catch (e) {
    console.error('Erreur lors de l\'arrêt du suivi de l\'athlète:', e);
    throw e;
  }
}

/**
 * Check if user is following an athlete
 */
export async function isFollowing(followerId: string, athleteId: string): Promise<boolean> {
  const db = getFirestoreDb();

  try {
    const userRef = doc(db, 'users', followerId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const following = userSnap.data()?.following || [];
    return following.includes(athleteId);
  } catch (e) {
    console.error('Erreur lors de la vérification du suivi:', e);
    return false;
  }
}

/**
 * Get list of followers for an athlete
 */
export async function getFollowers(athleteId: string): Promise<string[]> {
  const db = getFirestoreDb();

  try {
    const userRef = doc(db, 'users', athleteId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return [];

    return userSnap.data()?.followers || [];
  } catch (e) {
    console.error('Erreur lors de la récupération des followers:', e);
    return [];
  }
}

/**
 * Get list of athletes that a user is following
 */
export async function getFollowing(userId: string): Promise<string[]> {
  const db = getFirestoreDb();

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return [];

    return userSnap.data()?.following || [];
  } catch (e) {
    console.error('Erreur lors de la récupération des suivis:', e);
    return [];
  }
}

/**
 * Get follower count for an athlete
 */
export async function getFollowerCount(athleteId: string): Promise<number> {
  const followers = await getFollowers(athleteId);
  return followers.length;
}
