import { getFirebaseApp } from './firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';

export interface PerformanceVideo {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  title?: string;
  createdAt: any;
  likes: number;
  comments: number;
  shares: number;
  processed?: boolean;
  format?: string;
}

/**
 * Upload une vidéo de performance et la sauvegarde dans Firestore
 */
export async function uploadPerformanceVideo(
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  videoBlob: Blob,
  caption: string,
  title?: string
): Promise<string> {
  try {
    const storage = getStorage(getFirebaseApp());
    const db = getFirestore(getFirebaseApp());

    console.log('📤 Début upload performance video');
    console.log('  - User ID:', userId);
    console.log('  - User Name:', userName);
    console.log('  - Blob size:', videoBlob.size, 'bytes');

    // Upload la vidéo dans Storage
    const fileName = `performances/${userId}/${Date.now()}_performance.webm`;
    const storageRef = ref(storage, fileName);
    
    console.log('  - Storage path:', fileName);
    console.log('  - Uploading to Storage...');
    
    await uploadBytes(storageRef, videoBlob);
    const videoUrl = await getDownloadURL(storageRef);

    console.log('  ✓ Video uploaded to Storage');
    console.log('  - Download URL:', videoUrl);

    // Sauvegarde les métadonnées dans Firestore
    const performanceRef = collection(db, 'users', userId, 'performances');
    
    console.log('  - Saving metadata to Firestore...');
    console.log('  - Collection path: users/' + userId + '/performances');
    
    const docRef = await addDoc(performanceRef, {
      videoUrl,
      caption,
      title: title || '',
      createdAt: serverTimestamp(),
      likes: 0,
      comments: 0,
      shares: 0,
      userName,
      userAvatar: userAvatar || '',
      userId
    });

    console.log('  ✓ Metadata saved to Firestore');
    console.log('  - Document ID:', docRef.id);
    console.log('📤 Upload complete!');

    return docRef.id;
  } catch (e) {
    console.error('❌ Erreur lors de l\'upload de la vidéo de performance:', e);
    throw new Error('Impossible d\'uploader la vidéo. Veuillez réessayer.');
  }
}

/**
 * Récupère les vidéos de performance d'un utilisateur
 */
export async function getUserPerformanceVideos(userId: string): Promise<PerformanceVideo[]> {
  try {
    const db = getFirestore(getFirebaseApp());
    const performanceRef = collection(db, 'users', userId, 'performances');
    
    // Essayer d'abord avec orderBy, sinon sans
    let snap;
    try {
      const q = query(performanceRef, orderBy('createdAt', 'desc'));
      snap = await getDocs(q);
    } catch (orderByError) {
      console.warn('Erreur avec orderBy, récupération sans tri:', orderByError);
      snap = await getDocs(performanceRef);
    }

    const videos: PerformanceVideo[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as any;
      videos.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        caption: data.caption,
        title: data.title,
        createdAt: data.createdAt,
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        processed: data.processed || false,
        format: data.format || 'webm'
      });
    });

    // Trier manuellement par createdAt si nécessaire
    videos.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    console.log(`Vidéos trouvées pour ${userId}:`, videos.length, videos);
    return videos;
  } catch (e) {
    console.error('Erreur lors de la récupération des vidéos de performance:', e);
    return [];
  }
}

/**
 * Écoute les vidéos de performance d'un utilisateur en temps réel
 */
export function listenToPerformanceVideos(
  userId: string,
  callback: (videos: PerformanceVideo[]) => void
): () => void {
  try {
    const db = getFirestore(getFirebaseApp());
    const performanceRef = collection(db, 'users', userId, 'performances');
    
    // Essayer avec orderBy d'abord
    let unsubscribe: () => void;
    try {
      const q = query(performanceRef, orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snap) => {
        const videos: PerformanceVideo[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as any;
          videos.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            videoUrl: data.videoUrl,
            thumbnailUrl: data.thumbnailUrl,
            caption: data.caption,
            title: data.title,
            createdAt: data.createdAt,
            likes: data.likes || 0,
            comments: data.comments || 0,
            shares: data.shares || 0,
            processed: data.processed || false,
            format: data.format || 'webm'
          });
        });
        console.log(`Vidéos en temps réel pour ${userId}:`, videos.length);
        callback(videos);
      });
    } catch (orderByError) {
      console.warn('Erreur avec orderBy, écoute sans tri:', orderByError);
      unsubscribe = onSnapshot(performanceRef, (snap) => {
        const videos: PerformanceVideo[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as any;
          videos.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            videoUrl: data.videoUrl,
            thumbnailUrl: data.thumbnailUrl,
            caption: data.caption,
            title: data.title,
            createdAt: data.createdAt,
            likes: data.likes || 0,
            comments: data.comments || 0,
            shares: data.shares || 0,
            processed: data.processed || false,
            format: data.format || 'webm'
          });
        });
        // Trier manuellement
        videos.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        console.log(`Vidéos en temps réel pour ${userId}:`, videos.length);
        callback(videos);
      });
    }

    return unsubscribe;
  } catch (e) {
    console.error('Erreur lors de l\'écoute des vidéos de performance:', e);
    return () => {};
  }
}

/**
 * Incrémente le compteur de partages d'une vidéo
 */
export async function incrementVideoShares(userId: string, videoId: string): Promise<void> {
  try {
    const db = getFirestore(getFirebaseApp());
    const videoRef = doc(db, 'users', userId, 'performances', videoId);
    
    await updateDoc(videoRef, {
      shares: increment(1)
    });
    
    console.log('✅ Compteur de partages incrémenté pour la vidéo:', videoId);
  } catch (e) {
    console.error('❌ Erreur lors de l\'incrémentation des partages:', e);
    // Ne pas bloquer le partage si l'incrémentation échoue
  }
}

/**
 * Incrémente le compteur de likes d'une vidéo
 */
export async function incrementVideoLikes(userId: string, videoId: string): Promise<void> {
  try {
    const db = getFirestore(getFirebaseApp());
    const videoRef = doc(db, 'users', userId, 'performances', videoId);
    
    await updateDoc(videoRef, {
      likes: increment(1)
    });
    
    console.log('✅ Compteur de likes incrémenté pour la vidéo:', videoId);
  } catch (e) {
    console.error('❌ Erreur lors de l\'incrémentation des likes:', e);
  }
}

/**
 * Incrémente le compteur de commentaires d'une vidéo
 */
export async function incrementVideoComments(userId: string, videoId: string): Promise<void> {
  try {
    const db = getFirestore(getFirebaseApp());
    const videoRef = doc(db, 'users', userId, 'performances', videoId);
    
    await updateDoc(videoRef, {
      comments: increment(1)
    });
    
    console.log('✅ Compteur de commentaires incrémenté pour la vidéo:', videoId);
  } catch (e) {
    console.error('❌ Erreur lors de l\'incrémentation des commentaires:', e);
  }
}
