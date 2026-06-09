import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  getDoc,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { createAppNotification } from './notificationService';

export type PressContentKind = 'article' | 'reportage';
export type PressMediaType = 'none' | 'image' | 'video';

export const PRESS_CONTENT_CATEGORIES = [
  'Sport',
  'CAN 2026',
  'Football',
  'Basketball',
  'Athlétisme',
  'Interview',
  'Reportage terrain',
  'Transferts',
  'Équipes',
  'Formation',
  'Opinion'
] as const;

export interface ReportageItem {
  id: string;
  title: string;
  detail: string;
  videoUrl: string;
  imageUrl: string;
  mediaUrl: string;
  mediaType: PressMediaType;
  kind: PressContentKind;
  reporter: string;
  reporterId: string;
  date: string;
  category: string;
  likes: number;
  likedBy: string[];
  shares: number;
  comments: number;
  thumbnailUrl?: string;
  docPath: string;
  cloudinaryPublicId?: string;
  resourceType?: 'image' | 'video';
}

interface PressMediaUploadResult {
  provider: 'cloudinary';
  mediaUrl: string;
  videoUrl?: string;
  imageUrl?: string;
  secureUrl: string;
  thumbnailUrl?: string;
  publicId: string;
  resourceType: 'image' | 'video';
  format?: string;
  bytes?: number;
  duration?: number;
  width?: number;
  height?: number;
}

interface CreatePressContentInput {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  detail: string;
  kind: PressContentKind;
  category?: string;
  mediaFile?: File | null;
}

interface UpdatePressContentInput {
  item: ReportageItem;
  authorId: string;
  title: string;
  detail: string;
  kind: PressContentKind;
  category?: string;
  mediaFile?: File | null;
  removeMedia?: boolean;
}

type PressMediaUploadPayload = PressMediaUploadResult | { error?: string; detail?: string } | null;

interface CloudinarySignedUpload {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  publicId: string;
  resourceType: 'image' | 'video';
}

interface CloudinaryDirectUploadPayload {
  secure_url?: string;
  public_id?: string;
  resource_type?: 'image' | 'video';
  format?: string;
  bytes?: number;
  duration?: number;
  width?: number;
  height?: number;
  done?: boolean;
  error?: { message?: string } | string;
}

type CloudinarySignPayload = CloudinarySignedUpload | { error?: string; detail?: string } | null;

const SERVER_UPLOAD_LIMIT_BYTES = 3.5 * 1024 * 1024;
const VIDEO_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

const countLikes = (value: unknown): number => {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
};

const countNumber = (...values: unknown[]): number => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (Array.isArray(value)) return value.length;
  }
  return 0;
};

const getString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const formatDate = (value: any): string => {
  if (value?.toDate) return value.toDate().toLocaleDateString();
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'string' && value.trim()) return value;
  return '';
};

const getMediaType = (data: any, videoUrl: string, imageUrl: string): PressMediaType => {
  const explicit = String(data?.mediaType || '').toLowerCase();
  if (explicit === 'video' || explicit === 'image') return explicit;
  if (videoUrl) return 'video';
  if (imageUrl) return 'image';
  return 'none';
};

const isVideoFile = (file: File): boolean =>
  file.type.startsWith('video/') || /\.(webm|mp4|mov|m4v|ogg)$/i.test(file.name);

const isImageFile = (file: File): boolean =>
  file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name);

const createVideoFormData = (file: File, userId: string): FormData => {
  const formData = new FormData();
  const rawMimeType = file.type?.startsWith('video/') ? file.type : 'video/webm';
  const mimeType = rawMimeType.split(';')[0] || 'video/webm';
  const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
  const uploadBlob = new Blob([file], { type: mimeType });
  formData.append('file', uploadBlob, `performance.${extension}`);
  formData.append('userId', userId);
  return formData;
};

const createImageFormData = (file: File, userId: string): FormData => {
  const formData = new FormData();
  const mimeType = file.type?.startsWith('image/') ? file.type : 'image/jpeg';
  const extension = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : mimeType.includes('gif')
        ? 'gif'
        : 'jpg';
  const uploadBlob = new Blob([file], { type: mimeType });
  formData.append('file', uploadBlob, `profile.${extension}`);
  formData.append('userId', userId);
  return formData;
};

const normalizeUploadPayload = (payload: PressMediaUploadPayload): PressMediaUploadResult | null => {
  if (!payload || !('provider' in payload)) return null;

  const videoUrl = payload.videoUrl || '';
  const imageUrl = payload.imageUrl || '';
  const secureUrl = payload.secureUrl || videoUrl || imageUrl || '';
  const mediaUrl = payload.mediaUrl || videoUrl || imageUrl || secureUrl;
  const resourceType = payload.resourceType === 'video' || payload.resourceType === 'image'
    ? payload.resourceType
    : videoUrl ? 'video' : 'image';

  if (!mediaUrl) return null;

  return {
    ...payload,
    mediaUrl,
    videoUrl,
    imageUrl,
    secureUrl,
    resourceType
  };
};

const formatUploadError = (payload: PressMediaUploadPayload, fallback: string): string => {
  const detail = payload && 'detail' in payload && payload.detail ? ` (${payload.detail})` : '';
  return `${payload && 'error' in payload ? payload.error : fallback}${detail}`;
};

const formatCloudinaryDirectError = (payload: CloudinaryDirectUploadPayload | null, fallback: string): string => {
  if (!payload?.error) return fallback;
  if (typeof payload.error === 'string') return payload.error;
  return payload.error.message || fallback;
};

const getCloudinaryTransformedUrl = (
  cloudName: string,
  resourceType: 'image' | 'video',
  publicId: string
): string => {
  if (resourceType === 'video') {
    return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_720,c_scale/${publicId}.jpg`;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/w_960,c_scale,q_auto,f_auto/${publicId}`;
};

async function postPressMedia(endpoint: string, formData: FormData): Promise<{ response: Response; payload: PressMediaUploadPayload }> {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json().catch(() => null) as PressMediaUploadPayload;
  return { response, payload };
}

async function getCloudinarySignedUpload(userId: string, resourceType: 'image' | 'video'): Promise<CloudinarySignedUpload> {
  const response = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, resourceType })
  });

  const payload = await response.json().catch(() => null) as CloudinarySignPayload;

  if (
    !response.ok ||
    !payload ||
    !('cloudName' in payload) ||
    !payload.cloudName ||
    !payload.apiKey ||
    !payload.signature ||
    !payload.timestamp ||
    !payload.folder ||
    !payload.publicId
  ) {
    throw new Error(formatUploadError(payload, 'Impossible de préparer l’upload Cloudinary.'));
  }

  return payload;
}

async function uploadPressMediaDirectly(file: File, userId: string): Promise<PressMediaUploadResult> {
  const resourceType = isVideoFile(file) ? 'video' : 'image';
  const signedUpload = await getCloudinarySignedUpload(userId, resourceType);

  if (resourceType === 'video') {
    return uploadPressVideoInChunks(file, signedUpload);
  }

  const formData = new FormData();

  formData.append('file', file, file.name || `${resourceType}.${resourceType === 'video' ? 'mp4' : 'jpg'}`);
  formData.append('api_key', signedUpload.apiKey);
  formData.append('timestamp', String(signedUpload.timestamp));
  formData.append('signature', signedUpload.signature);
  formData.append('folder', signedUpload.folder);
  formData.append('public_id', signedUpload.publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData
    }
  );
  const payload = await response.json().catch(() => null) as CloudinaryDirectUploadPayload | null;

  if (!response.ok || !payload?.secure_url) {
    throw new Error(formatCloudinaryDirectError(payload, 'Impossible d’uploader le média sur Cloudinary.'));
  }

  const publicId = payload.public_id || `${signedUpload.folder}/${signedUpload.publicId}`;
  const thumbnailUrl = getCloudinaryTransformedUrl(signedUpload.cloudName, resourceType, publicId);

  return {
    provider: 'cloudinary',
    mediaUrl: payload.secure_url,
    videoUrl: resourceType === 'video' ? payload.secure_url : '',
    imageUrl: resourceType === 'image' ? thumbnailUrl : '',
    secureUrl: payload.secure_url,
    thumbnailUrl,
    publicId,
    resourceType,
    format: payload.format,
    bytes: payload.bytes,
    duration: payload.duration,
    width: payload.width,
    height: payload.height
  };
}

async function postCloudinaryChunk(
  file: File,
  signedUpload: CloudinarySignedUpload,
  uploadId: string,
  start: number,
  end: number
): Promise<CloudinaryDirectUploadPayload> {
  const formData = new FormData();
  const chunk = file.slice(start, end + 1, file.type || 'video/mp4');

  formData.append('file', chunk, file.name || 'performance.mp4');
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
        'Content-Range': `bytes ${start}-${end}/${file.size}`,
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

async function uploadPressVideoInChunks(file: File, signedUpload: CloudinarySignedUpload): Promise<PressMediaUploadResult> {
  const uploadId = `${signedUpload.publicId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let finalPayload: CloudinaryDirectUploadPayload | null = null;

  for (let start = 0; start < file.size; start += VIDEO_CHUNK_SIZE_BYTES) {
    const end = Math.min(start + VIDEO_CHUNK_SIZE_BYTES, file.size) - 1;
    const payload = await postCloudinaryChunk(file, signedUpload, uploadId, start, end);
    finalPayload = payload;
  }

  if (!finalPayload?.secure_url) {
    throw new Error(formatCloudinaryDirectError(finalPayload, 'Impossible de finaliser l’upload vidéo sur Cloudinary.'));
  }

  const publicId = finalPayload.public_id || `${signedUpload.folder}/${signedUpload.publicId}`;
  const thumbnailUrl = getCloudinaryTransformedUrl(signedUpload.cloudName, 'video', publicId);

  return {
    provider: 'cloudinary',
    mediaUrl: finalPayload.secure_url,
    videoUrl: finalPayload.secure_url,
    imageUrl: '',
    secureUrl: finalPayload.secure_url,
    thumbnailUrl,
    publicId,
    resourceType: 'video',
    format: finalPayload.format,
    bytes: finalPayload.bytes,
    duration: finalPayload.duration,
    width: finalPayload.width,
    height: finalPayload.height
  };
}

async function uploadPressMedia(file: File, userId: string): Promise<PressMediaUploadResult> {
  const endpoint = isVideoFile(file)
    ? '/api/performance-media'
    : isImageFile(file)
      ? '/api/profile-image'
      : '';

  if (!endpoint) {
    throw new Error('Le média doit être une image ou une vidéo.');
  }

  if (file.size > SERVER_UPLOAD_LIMIT_BYTES) {
    return uploadPressMediaDirectly(file, userId);
  }

  const formData = isVideoFile(file)
    ? createVideoFormData(file, userId)
    : createImageFormData(file, userId);
  const upload = await postPressMedia(endpoint, formData);
  const payload = normalizeUploadPayload(upload.payload);

  if (upload.response.status === 413) {
    return uploadPressMediaDirectly(file, userId);
  }

  if (!upload.response.ok || !payload) {
    throw new Error(formatUploadError(upload.payload, 'Impossible d’uploader le média sur Cloudinary.'));
  }

  return payload;
}

export async function fetchReportages(): Promise<ReportageItem[]> {
  const db = getFirestoreDb();
  try {
    const ref = collection(db, 'reportage');
    const q = query(ref, orderBy('date', 'desc'));
    const snap = await getDocs(q);

    if (snap.empty) return [];

    const items: ReportageItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const videoUrl = getString(data.video, data.videoUrl, data.cloudinaryUrl, data.secure_url);
      const imageUrl = getString(data.image, data.imageUrl, data.coverUrl, data.thumbnailUrl, data.photoUrl);
      const mediaType = getMediaType(data, videoUrl, imageUrl);
      const mediaUrl = mediaType === 'video' ? videoUrl : imageUrl;
      const title = getString(data.titre, data.title, 'Reportage');
      const detail = getString(data.detail, data.description, data.content);
      if (!title && !detail && !mediaUrl) return;
      const likedBy = Array.isArray(data.likes) ? data.likes.filter((id: unknown) => typeof id === 'string') : [];

      items.push({
        id: docSnap.id,
        title,
        detail,
        videoUrl,
        imageUrl,
        mediaUrl,
        mediaType,
        kind: data.kind === 'article' ? 'article' : 'reportage',
        reporter: getString(data.reporteur, data.reporter, data.authorName, 'Média Choose Me'),
        reporterId: getString(data.reporterId, data.authorId, data.userId),
        date: formatDate(data.date || data.createdAt),
        category: getString(data.category, data.categorie, 'Sport'),
        likes: countLikes(data.likes),
        likedBy,
        shares: typeof data.shares === 'number' ? data.shares : 0,
        comments: countNumber(data.num_comments, data.comments, data.commentCount, data.commentsCount),
        thumbnailUrl: getString(data.thumbnailUrl, imageUrl),
        docPath: docSnap.ref.path,
        cloudinaryPublicId: getString(data.cloudinaryPublicId, data.publicId),
        resourceType: data.resourceType === 'image' || data.resourceType === 'video' ? data.resourceType : mediaType === 'image' || mediaType === 'video' ? mediaType : undefined
      });
    });

    return items;
  } catch (e) {
    console.error('Erreur chargement reportages Firestore:', e);
    return [];
  }
}

export async function createPressContent(input: CreatePressContentInput): Promise<string> {
  const db = getFirestoreDb();
  let media: PressMediaUploadResult | null = null;

  if (input.mediaFile) {
    media = await uploadPressMedia(input.mediaFile, input.authorId);
  }

  const mediaType: PressMediaType = media?.resourceType === 'video' ? 'video' : media?.resourceType === 'image' ? 'image' : 'none';
  const docRef = await addDoc(collection(db, 'reportage'), {
    kind: input.kind,
    type: input.kind,
    titre: input.title.trim(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    description: input.detail.trim(),
    category: input.category || 'Sport',
    reporteur: input.authorName,
    reporter: input.authorName,
    reporterId: input.authorId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar || '',
    mediaType,
    mediaUrl: media?.mediaUrl || '',
    video: media?.videoUrl || '',
    videoUrl: media?.videoUrl || '',
    image: media?.imageUrl || '',
    imageUrl: media?.imageUrl || '',
    thumbnailUrl: media?.thumbnailUrl || media?.imageUrl || '',
    cloudinaryUrl: media?.secureUrl || '',
    cloudinaryPublicId: media?.publicId || '',
    storageProvider: media ? 'cloudinary' : '',
    likes: [],
    shares: 0,
    comments: 0,
    num_comments: 0,
    status: 'publié',
    date: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    format: media?.format || '',
    duration: media?.duration || null,
    width: media?.width || null,
    height: media?.height || null,
    bytes: media?.bytes || null
  });

  return docRef.id;
}

const deleteCloudinaryMedia = async (publicId?: string, resourceType?: 'image' | 'video') => {
  if (!publicId) return;

  await fetch('/api/cloudinary/delete-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publicId,
      resourceType: resourceType || 'image'
    })
  }).catch((error) => {
    console.warn('Suppression Cloudinary presse ignorée:', error);
  });
};

export async function updatePressContent(input: UpdatePressContentInput): Promise<void> {
  const db = getFirestoreDb();
  const itemRef = doc(db, input.item.docPath || `reportage/${input.item.id}`);
  const snap = await getDoc(itemRef);
  const existing = snap.data() as any;
  let media: PressMediaUploadResult | null = null;

  if (input.mediaFile) {
    media = await uploadPressMedia(input.mediaFile, input.authorId);
  }

  const shouldClearMedia = input.removeMedia || Boolean(media);
  const mediaType: PressMediaType = media?.resourceType === 'video'
    ? 'video'
    : media?.resourceType === 'image'
      ? 'image'
      : shouldClearMedia
        ? 'none'
        : input.item.mediaType;

  const updates: Record<string, any> = {
    kind: input.kind,
    type: input.kind,
    titre: input.title.trim(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    description: input.detail.trim(),
    category: input.category || 'Sport',
    mediaType,
    updatedAt: serverTimestamp()
  };

  if (shouldClearMedia) {
    updates.mediaUrl = media?.mediaUrl || '';
    updates.video = media?.videoUrl || '';
    updates.videoUrl = media?.videoUrl || '';
    updates.image = media?.imageUrl || '';
    updates.imageUrl = media?.imageUrl || '';
    updates.thumbnailUrl = media?.thumbnailUrl || media?.imageUrl || '';
    updates.cloudinaryUrl = media?.secureUrl || '';
    updates.cloudinaryPublicId = media?.publicId || '';
    updates.storageProvider = media ? 'cloudinary' : '';
    updates.resourceType = media?.resourceType || '';
    updates.format = media?.format || '';
    updates.duration = media?.duration || null;
    updates.width = media?.width || null;
    updates.height = media?.height || null;
    updates.bytes = media?.bytes || null;
  }

  await updateDoc(itemRef, updates);

  if (shouldClearMedia) {
    await deleteCloudinaryMedia(
      getString(existing?.cloudinaryPublicId, existing?.publicId, input.item.cloudinaryPublicId),
      existing?.resourceType === 'image' || existing?.resourceType === 'video'
        ? existing.resourceType
        : input.item.resourceType
    );
  }
}

export async function deletePressContent(item: ReportageItem): Promise<void> {
  const db = getFirestoreDb();
  const itemRef = doc(db, item.docPath || `reportage/${item.id}`);
  const snap = await getDoc(itemRef);
  const data = snap.data() as any;

  await deleteCloudinaryMedia(
    getString(data?.cloudinaryPublicId, data?.publicId, item.cloudinaryPublicId),
    data?.resourceType === 'image' || data?.resourceType === 'video'
      ? data.resourceType
      : item.resourceType
  );
  await deleteDoc(itemRef);
}

export async function toggleReportageLike(item: ReportageItem, userId: string, isLiked: boolean): Promise<void> {
  const db = getFirestoreDb();
  const itemRef = doc(db, item.docPath || `reportage/${item.id}`);
  await updateDoc(itemRef, {
    likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    updatedAt: serverTimestamp()
  });

  if (!isLiked && item.reporterId && item.reporterId !== userId) {
    try {
      await createAppNotification({
        type: 'like',
        recipientId: item.reporterId,
        actorId: userId,
        title: item.kind === 'article' ? 'Article aimé' : 'Reportage aimé',
        body: `Votre ${item.kind === 'article' ? 'article' : 'reportage'} a reçu un like.`,
        data: {
          docPath: item.docPath || `reportage/${item.id}`
        }
      });
    } catch (error) {
      console.warn('Notification de like presse indisponible:', error);
    }
  }
}

export async function incrementReportageShare(item: ReportageItem): Promise<void> {
  const db = getFirestoreDb();
  const itemRef = doc(db, item.docPath || `reportage/${item.id}`);
  await updateDoc(itemRef, {
    shares: increment(1),
    updatedAt: serverTimestamp()
  });
}
