import { getFirebaseApp } from './firebase';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, onSnapshot, doc, updateDoc, increment, deleteDoc, getDoc } from 'firebase/firestore';
import { normalizeEngagementCount } from '../utils/engagement';

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
  cloudinaryPublicId?: string;
  storageProvider?: string;
}

interface CloudinaryUploadResult {
  provider: 'cloudinary';
  videoUrl: string;
  secureUrl: string;
  thumbnailUrl?: string;
  publicId: string;
  resourceType?: string;
  format?: string;
  bytes?: number;
  duration?: number;
  width?: number;
  height?: number;
}

interface CloudinarySignedUpload {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  publicId: string;
  resourceType: 'video';
}

interface CloudinaryDirectUploadPayload {
  secure_url?: string;
  public_id?: string;
  resource_type?: 'video';
  format?: string;
  bytes?: number;
  duration?: number;
  width?: number;
  height?: number;
  done?: boolean;
  error?: { message?: string } | string;
}

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

const SERVER_UPLOAD_LIMIT_BYTES = 3.5 * 1024 * 1024;
const VIDEO_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

const getVideoMimeType = (videoBlob: Blob): string => {
  const rawMimeType = videoBlob.type?.startsWith('video/') ? videoBlob.type : 'video/webm';
  return rawMimeType.split(';')[0] || 'video/webm';
};

const getVideoExtension = (mimeType: string): string =>
  mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';

const getCloudinaryThumbnailUrl = (cloudName: string, publicId: string): string =>
  `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_720,c_scale/${publicId}.jpg`;

const formatCloudinaryDirectError = (payload: CloudinaryDirectUploadPayload | null, fallback: string): string => {
  if (!payload?.error) return fallback;
  if (typeof payload.error === 'string') return payload.error;
  return payload.error.message || fallback;
};

async function getCloudinarySignedVideoUpload(userId: string): Promise<CloudinarySignedUpload> {
  const response = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, resourceType: 'video' })
  });

  const payload = await response.json().catch(() => null) as Partial<CloudinarySignedUpload> | { error?: string; detail?: string } | null;

  if (
    !response.ok ||
    !payload ||
    !('cloudName' in payload) ||
    !payload.cloudName ||
    !payload.apiKey ||
    !payload.signature ||
    !payload.timestamp ||
    !payload.folder ||
    !payload.publicId ||
    payload.resourceType !== 'video'
  ) {
    const detail = payload && 'detail' in payload && payload.detail ? ` (${payload.detail})` : '';
    const error = payload && 'error' in payload && payload.error ? payload.error : 'Impossible de préparer l’upload Cloudinary.';
    throw new Error(`${error}${detail}`);
  }

  return payload as CloudinarySignedUpload;
}

async function postCloudinaryVideoChunk(
  videoBlob: Blob,
  signedUpload: CloudinarySignedUpload,
  uploadId: string,
  start: number,
  end: number,
  fileName: string,
  mimeType: string
): Promise<CloudinaryDirectUploadPayload> {
  const formData = new FormData();
  const chunk = videoBlob.slice(start, end + 1, mimeType);

  formData.append('file', chunk, fileName);
  formData.append('api_key', signedUpload.apiKey);
  formData.append('timestamp', String(signedUpload.timestamp));
  formData.append('signature', signedUpload.signature);
  formData.append('folder', signedUpload.folder);
  formData.append('public_id', signedUpload.publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/video/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Range': `bytes ${start}-${end}/${videoBlob.size}`,
        'X-Unique-Upload-Id': uploadId
      },
      body: formData
    }
  );
  const payload = await response.json().catch(() => null) as CloudinaryDirectUploadPayload | null;

  if (!response.ok || !payload) {
    throw new Error(formatCloudinaryDirectError(payload, 'Impossible d’uploader la vidéo sur Cloudinary.'));
  }

  return payload;
}

async function uploadVideoDirectlyToCloudinary(userId: string, videoBlob: Blob): Promise<CloudinaryUploadResult> {
  const signedUpload = await getCloudinarySignedVideoUpload(userId);
  const mimeType = getVideoMimeType(videoBlob);
  const fileName = `performance.${getVideoExtension(mimeType)}`;
  const uploadId = `${signedUpload.publicId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let finalPayload: CloudinaryDirectUploadPayload | null = null;

  for (let start = 0; start < videoBlob.size; start += VIDEO_CHUNK_SIZE_BYTES) {
    const end = Math.min(start + VIDEO_CHUNK_SIZE_BYTES, videoBlob.size) - 1;
    finalPayload = await postCloudinaryVideoChunk(
      videoBlob,
      signedUpload,
      uploadId,
      start,
      end,
      fileName,
      mimeType
    );
  }

  if (!finalPayload?.secure_url) {
    throw new Error(formatCloudinaryDirectError(finalPayload, 'Impossible de finaliser l’upload vidéo sur Cloudinary.'));
  }

  const publicId = finalPayload.public_id || `${signedUpload.folder}/${signedUpload.publicId}`;

  return {
    provider: 'cloudinary',
    videoUrl: finalPayload.secure_url,
    secureUrl: finalPayload.secure_url,
    thumbnailUrl: getCloudinaryThumbnailUrl(signedUpload.cloudName, publicId),
    publicId,
    resourceType: 'video',
    format: finalPayload.format,
    bytes: finalPayload.bytes,
    duration: finalPayload.duration,
    width: finalPayload.width,
    height: finalPayload.height
  };
}

async function uploadVideoToCloudinary(userId: string, videoBlob: Blob): Promise<CloudinaryUploadResult> {
  if (videoBlob.size > SERVER_UPLOAD_LIMIT_BYTES) {
    return uploadVideoDirectlyToCloudinary(userId, videoBlob);
  }

  const formData = new FormData();
  const mimeType = getVideoMimeType(videoBlob);
  const extension = getVideoExtension(mimeType);
  const uploadBlob = new Blob([videoBlob], { type: mimeType });
  formData.append('file', uploadBlob, `performance.${extension}`);
  formData.append('userId', userId);

  const response = await fetch('/api/performance-media', {
    method: 'POST',
    body: formData
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 413) {
    return uploadVideoDirectlyToCloudinary(userId, videoBlob);
  }

  if (!response.ok || !payload?.videoUrl) {
    const detailValue = typeof payload?.detail === 'string'
      ? payload.detail
      : payload?.detail
        ? JSON.stringify(payload.detail)
        : '';
    const detail = detailValue ? ` (${detailValue})` : '';
    throw new Error(`${payload?.error || 'Impossible d’uploader la vidéo sur Cloudinary.'}${detail}`);
  }

  return payload as CloudinaryUploadResult;
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
    const db = getFirestore(getFirebaseApp());

    console.log('📤 Début upload performance video');
    console.log('  - User ID:', userId);
    console.log('  - User Name:', userName);
    console.log('  - Blob size:', videoBlob.size, 'bytes');
    
    console.log('  - Uploading to Cloudinary...');
    const media = await uploadVideoToCloudinary(userId, videoBlob);
    const videoUrl = media.videoUrl;

    console.log('  ✓ Video uploaded to Cloudinary');
    console.log('  - Secure URL:', videoUrl);

    // Sauvegarde les métadonnées dans Firestore
    const performanceRef = collection(db, 'users', userId, 'performances');
    
    console.log('  - Saving metadata to Firestore...');
    console.log('  - Collection path: users/' + userId + '/performances');
    
    const docRef = await addDoc(performanceRef, {
      videoUrl,
      secure_url: media.secureUrl,
      cloudinaryUrl: media.secureUrl,
      cloudinaryPublicId: media.publicId,
      thumbnailUrl: media.thumbnailUrl || '',
      storageProvider: 'cloudinary',
      caption,
      title: title || '',
      createdAt: serverTimestamp(),
      likes: 0,
      comments: 0,
      num_comments: 0,
      shares: 0,
      userName,
      userAvatar: userAvatar || '',
      userId,
      format: media.format || '',
      duration: media.duration || null,
      width: media.width || null,
      height: media.height || null,
      bytes: media.bytes || videoBlob.size
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
    const [usersSnap, userSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'performances')),
      getDocs(collection(db, 'user', userId, 'performances'))
    ]);

    const videos: PerformanceVideo[] = [];
    const seen = new Set<string>();
    const allDocs = [...usersSnap.docs, ...userSnap.docs];

    allDocs.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const key = String(data?.videoUrl || docSnap.id);
      if (seen.has(key)) return;
      seen.add(key);
      videos.push({
        id: docSnap.id,
        userId: data.userId || userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        caption: data.caption,
        title: data.title,
        createdAt: data.createdAt,
        likes: normalizeEngagementCount(data.likes),
        comments: getCommentCount(data),
        shares: normalizeEngagementCount(data.shares),
        processed: data.processed || false,
        format: data.format || 'webm',
        cloudinaryPublicId: data.cloudinaryPublicId || data.publicId || '',
        storageProvider: data.storageProvider || ''
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
    const unsubscribe = onSnapshot(
      performanceRef,
      (snap) => {
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
            likes: normalizeEngagementCount(data.likes),
            comments: getCommentCount(data),
            shares: normalizeEngagementCount(data.shares),
            processed: data.processed || false,
            format: data.format || 'webm',
            cloudinaryPublicId: data.cloudinaryPublicId || data.publicId || '',
            storageProvider: data.storageProvider || ''
          });
        });

        // Trier côté client pour éviter toute dépendance à un index Firestore.
        videos.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        console.log(`Vidéos en temps réel pour ${userId}:`, videos.length);
        callback(videos);
      },
      (error) => {
        console.error('Erreur écoute vidéos de performance:', error);
        callback([]);
      }
    );

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.warn('Erreur unsubscribe écoute vidéos:', e);
      }
    };
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
      comments: increment(1),
      num_comments: increment(1)
    });
    
    console.log('✅ Compteur de commentaires incrémenté pour la vidéo:', videoId);
  } catch (e) {
    console.error('❌ Erreur lors de l\'incrémentation des commentaires:', e);
  }
}

export async function updatePerformanceVideo(
  userId: string,
  videoId: string,
  updates: { title?: string; caption?: string }
): Promise<void> {
  try {
    const db = getFirestore(getFirebaseApp());
    const videoRef = doc(db, 'users', userId, 'performances', videoId);

    await updateDoc(videoRef, {
      title: updates.title || '',
      caption: updates.caption || '',
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error('❌ Erreur modification vidéo:', e);
    throw new Error('Impossible de modifier la vidéo.');
  }
}

export async function deletePerformanceVideo(userId: string, videoId: string): Promise<void> {
  try {
    const db = getFirestore(getFirebaseApp());
    const videoRef = doc(db, 'users', userId, 'performances', videoId);
    const snap = await getDoc(videoRef);
    const data = snap.data() as any;

    if (data?.cloudinaryPublicId) {
      await fetch('/api/cloudinary/delete-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: data.cloudinaryPublicId,
          resourceType: 'video'
        })
      }).catch((error) => {
        console.warn('Suppression Cloudinary ignorée:', error);
      });
    }

    await deleteDoc(videoRef);
  } catch (e) {
    console.error('❌ Erreur suppression vidéo:', e);
    throw new Error('Impossible de supprimer la vidéo.');
  }
}
