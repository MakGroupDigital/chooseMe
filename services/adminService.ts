import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { UserType } from '../types';
import { getFirestoreDb } from './firebase';

export interface AdminUser {
  id: string;
  source: 'users' | 'user';
  email: string;
  displayName: string;
  type: string;
  country: string;
  city: string;
  status: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface AdminContentItem {
  id: string;
  docPath: string;
  source: 'performances' | 'publication' | 'reportage';
  title: string;
  ownerName: string;
  ownerId: string;
  mediaUrl: string;
  status: string;
  reports: number;
  createdAt: string;
}

export interface AdminDashboardData {
  users: AdminUser[];
  content: AdminContentItem[];
  reportages: AdminContentItem[];
  finance: {
    walletCount: number;
    totalBalance: number;
    pendingWithdrawals: number;
    transactionCount: number;
  };
  partnerships: {
    count: number;
    pending: number;
    items: Array<{ id: string; name: string; status: string; contact: string }>;
  };
  support: {
    open: number;
    urgent: number;
    items: Array<{ id: string; subject: string; userName: string; status: string; priority: string }>;
  };
  predictions: {
    count: number;
    pending: number;
    items: AdminPrediction[];
  };
  infrastructure: {
    firebaseProject: string;
    cloudinaryEnabled: boolean;
    pwaEnabled: boolean;
    lastCheckedAt: string;
    collections: Array<{ name: string; count: number; status: string }>;
  };
}

export interface AdminPrediction {
  id: string;
  title: string;
  match: string;
  status: string;
  odds: string;
  createdAt: string;
}

export interface StorageMigrationResult {
  dryRun: boolean;
  limit: number;
  migratedCount: number;
  skippedCount: number;
  failedCount: number;
  migrated: Array<{
    id: string;
    path: string;
    source: string;
    field: string;
    legacyUrl: string;
    cloudinaryUrl?: string;
    cloudinaryPublicId?: string;
  }>;
  failed: Array<{ path: string; source: string; error: string }>;
}

const legacyVideoFields = ['cloudinaryUrl', 'secure_url', 'videoUrl', 'postVido', 'post_vido', 'video'];

const asDate = (value: any): string => {
  if (value?.toDate) return value.toDate().toLocaleDateString();
  if (typeof value === 'string') return value;
  return '';
};

const asNumber = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const getString = (...values: unknown[]): string => {
  const found = values.find((value) => typeof value === 'string' && value.trim().length > 0);
  return typeof found === 'string' ? found.trim() : '';
};

const safeGetDocs = async (refOrQuery: any) => {
  try {
    return await getDocs(refOrQuery);
  } catch (error) {
    console.warn('Admin data source unavailable:', error);
    return null;
  }
};

const normalizeUserType = (value: unknown): string => String(value || UserType.VISITOR).toLowerCase();

const isFirebaseStorageUrl = (value: unknown): value is string => (
  typeof value === 'string' &&
  value.includes('firebasestorage.googleapis.com') &&
  !value.includes('res.cloudinary.com')
);

const findLegacyVideoField = (data: any): { field: string; url: string } | null => {
  for (const field of legacyVideoFields) {
    if (isFirebaseStorageUrl(data?.[field])) {
      return { field, url: data[field] };
    }
  }

  return null;
};

const migrateRemoteVideoToCloudinary = async (payload: {
  legacyUrl: string;
  source: string;
  ownerId: string;
  docId: string;
}) => {
  const response = await fetch('/api/cloudinary/remote-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.videoUrl) {
    throw new Error(result?.error || 'Impossible de migrer la vidéo vers Cloudinary.');
  }

  return result as {
    provider: 'cloudinary';
    videoUrl: string;
    secureUrl: string;
    thumbnailUrl?: string;
    publicId: string;
    format?: string;
    bytes?: number;
    duration?: number;
    width?: number;
    height?: number;
  };
};

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const db = getFirestoreDb();

  const [
    usersSnap,
    legacyUsersSnap,
    performancesSnap,
    publicationsSnap,
    reportagesSnap,
    walletsSnap,
    transactionsSnap,
    partnersSnap,
    supportSnap,
    predictionsSnap
  ] = await Promise.all([
    safeGetDocs(collection(db, 'users')),
    safeGetDocs(collection(db, 'user')),
    safeGetDocs(query(collectionGroup(db, 'performances'), limit(80))),
    safeGetDocs(query(collectionGroup(db, 'publication'), limit(80))),
    safeGetDocs(query(collection(db, 'reportage'), limit(40))),
    safeGetDocs(collection(db, 'wallets')),
    safeGetDocs(query(collection(db, 'transactions'), limit(120))),
    safeGetDocs(query(collection(db, 'partnerships'), limit(40))),
    safeGetDocs(query(collection(db, 'supportTickets'), limit(50))),
    safeGetDocs(query(collection(db, 'adminPredictions'), limit(80)))
  ]);

  const usersById = new Map<string, AdminUser>();
  const collectUsers = (snap: any, source: 'users' | 'user') => {
    snap?.docs.forEach((docSnap: any) => {
      const data = docSnap.data() as any;
      const id = String(data?.uid || data?.userId || docSnap.id);
      if (usersById.has(id) && source === 'user') return;

      usersById.set(id, {
        id,
        source,
        email: getString(data?.email, data?.mail),
        displayName: getString(data?.displayName, data?.display_name, data?.userName, data?.username, data?.nom, data?.name, data?.email, 'Utilisateur'),
        type: normalizeUserType(data?.type ?? data?.accountType ?? data?.profileType),
        country: getString(data?.country, data?.pays),
        city: getString(data?.city, data?.ville),
        status: getString(data?.status, data?.accountStatus, 'actif'),
        createdAt: asDate(data?.createdAt ?? data?.created_at),
        avatarUrl: getString(data?.avatarUrl, data?.photoUrl, data?.photo_url, data?.post_photo)
      });
    });
  };

  collectUsers(usersSnap, 'users');
  collectUsers(legacyUsersSnap, 'user');

  const content: AdminContentItem[] = [];
  performancesSnap?.docs.forEach((docSnap: any) => {
    const data = docSnap.data() as any;
    const parts = docSnap.ref.path.split('/');
    content.push({
      id: docSnap.id,
      docPath: docSnap.ref.path,
      source: 'performances',
      title: getString(data?.title, data?.caption, 'Performance'),
      ownerName: getString(data?.userName, data?.displayName, 'Talent'),
      ownerId: getString(data?.userId, parts[1]),
      mediaUrl: getString(data?.cloudinaryUrl, data?.secure_url, data?.videoUrl),
      status: getString(data?.status, data?.moderationStatus, 'publié'),
      reports: asNumber(data?.reportsCount ?? data?.reports),
      createdAt: asDate(data?.createdAt)
    });
  });

  publicationsSnap?.docs.forEach((docSnap: any) => {
    const data = docSnap.data() as any;
    const parts = docSnap.ref.path.split('/');
    content.push({
      id: docSnap.id,
      docPath: docSnap.ref.path,
      source: 'publication',
      title: getString(data?.post_title, data?.post_description, 'Publication'),
      ownerName: getString(data?.nomPoster, data?.userName, 'Talent'),
      ownerId: getString(data?.post_user?.id, parts[1]),
      mediaUrl: getString(data?.cloudinaryUrl, data?.secure_url, data?.postVido, data?.post_vido),
      status: getString(data?.status, data?.moderationStatus, 'publié'),
      reports: asNumber(data?.reportsCount ?? data?.reports),
      createdAt: asDate(data?.time_posted)
    });
  });

  const reportages: AdminContentItem[] = [];
  reportagesSnap?.docs.forEach((docSnap: any) => {
    const data = docSnap.data() as any;
    reportages.push({
      id: docSnap.id,
      docPath: docSnap.ref.path,
      source: 'reportage',
      title: getString(data?.titre, data?.title, 'Reportage'),
      ownerName: getString(data?.reporteur, data?.authorName, 'Presse'),
      ownerId: getString(data?.authorId, data?.userId),
      mediaUrl: getString(data?.video, data?.videoUrl, data?.cloudinaryUrl),
      status: getString(data?.status, 'publié'),
      reports: asNumber(data?.reportsCount ?? data?.reports),
      createdAt: asDate(data?.date ?? data?.createdAt)
    });
  });

  let totalBalance = 0;
  let pendingWithdrawals = 0;
  walletsSnap?.docs.forEach((docSnap: any) => {
    const data = docSnap.data() as any;
    totalBalance += asNumber(data?.balance ?? data?.solde);
    pendingWithdrawals += asNumber(data?.pendingWithdrawals ?? data?.retraitsEnAttente);
  });

  const partnerItems = (partnersSnap?.docs || []).map((docSnap: any) => {
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      name: getString(data?.name, data?.company, data?.clubName, 'Partenaire'),
      status: getString(data?.status, 'en attente'),
      contact: getString(data?.email, data?.phone, data?.contact)
    };
  });

  const supportItems = (supportSnap?.docs || []).map((docSnap: any) => {
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      subject: getString(data?.subject, data?.title, 'Demande assistance'),
      userName: getString(data?.userName, data?.displayName, data?.email, 'Utilisateur'),
      status: getString(data?.status, 'ouvert'),
      priority: getString(data?.priority, data?.urgence, 'normal')
    };
  });

  const predictionItems: AdminPrediction[] = (predictionsSnap?.docs || []).map((docSnap: any) => {
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      title: getString(data?.title, data?.titre, 'Pronostic'),
      match: getString(data?.match, data?.fixture, `${data?.teamA || ''} vs ${data?.teamB || ''}`.trim(), 'Match'),
      status: getString(data?.status, 'en attente'),
      odds: getString(data?.odds, data?.cote, data?.probability, ''),
      createdAt: asDate(data?.createdAt)
    };
  });

  return {
    users: Array.from(usersById.values()),
    content: content.sort((a, b) => b.reports - a.reports),
    reportages,
    finance: {
      walletCount: walletsSnap?.size || 0,
      totalBalance,
      pendingWithdrawals,
      transactionCount: transactionsSnap?.size || 0
    },
    partnerships: {
      count: partnerItems.length,
      pending: partnerItems.filter((item) => item.status.toLowerCase().includes('attente') || item.status.toLowerCase().includes('pending')).length,
      items: partnerItems
    },
    support: {
      open: supportItems.filter((item) => !['fermé', 'closed', 'résolu', 'resolved'].includes(item.status.toLowerCase())).length,
      urgent: supportItems.filter((item) => ['urgent', 'haute', 'high'].includes(item.priority.toLowerCase())).length,
      items: supportItems
    },
    predictions: {
      count: predictionItems.length,
      pending: predictionItems.filter((item) => ['en attente', 'pending', 'draft', 'brouillon'].includes(item.status.toLowerCase())).length,
      items: predictionItems
    },
    infrastructure: {
      firebaseProject: 'choose-me-l1izsi',
      cloudinaryEnabled: true,
      pwaEnabled: true,
      lastCheckedAt: new Date().toLocaleString(),
      collections: [
        { name: 'users', count: usersSnap?.size || 0, status: usersSnap ? 'ok' : 'indisponible' },
        { name: 'user', count: legacyUsersSnap?.size || 0, status: legacyUsersSnap ? 'ok' : 'indisponible' },
        { name: 'performances', count: performancesSnap?.size || 0, status: performancesSnap ? 'ok' : 'indisponible' },
        { name: 'publication', count: publicationsSnap?.size || 0, status: publicationsSnap ? 'ok' : 'indisponible' },
        { name: 'reportage', count: reportagesSnap?.size || 0, status: reportagesSnap ? 'ok' : 'indisponible' },
        { name: 'wallets', count: walletsSnap?.size || 0, status: walletsSnap ? 'ok' : 'indisponible' },
        { name: 'supportTickets', count: supportSnap?.size || 0, status: supportSnap ? 'ok' : 'indisponible' },
        { name: 'adminPredictions', count: predictionsSnap?.size || 0, status: predictionsSnap ? 'ok' : 'indisponible' }
      ]
    }
  };
}

export async function updateAdminUserType(user: AdminUser, type: UserType | 'admin'): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, user.source, user.id), {
    type,
    updatedAt: serverTimestamp()
  });
}

export async function updateAdminUserStatus(user: AdminUser, status: 'actif' | 'suspendu' | 'verification'): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, user.source, user.id), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function approveAdminUser(user: AdminUser): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, user.source, user.id), {
    status: 'actif',
    approved: true,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateContentModeration(item: AdminContentItem, status: 'publié' | 'masqué' | 'à vérifier'): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, item.docPath), {
    status,
    moderationStatus: status,
    moderatedAt: serverTimestamp()
  });
}

export async function deleteAdminContent(item: AdminContentItem): Promise<void> {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, item.docPath));
}

export async function createAdminAssistanceNote(payload: {
  userId?: string;
  title: string;
  message: string;
  priority: 'normal' | 'urgent';
}): Promise<void> {
  const db = getFirestoreDb();
  await addDoc(collection(db, 'supportTickets'), {
    ...payload,
    status: 'ouvert',
    createdAt: serverTimestamp(),
    source: 'admin-dashboard'
  });
}

export async function createAdminPrediction(payload: {
  title: string;
  match: string;
  odds: string;
  analysis: string;
  status: 'brouillon' | 'en attente' | 'publié';
}): Promise<void> {
  const db = getFirestoreDb();
  await addDoc(collection(db, 'adminPredictions'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    source: 'admin-dashboard'
  });
}

export async function updateAdminPredictionStatus(id: string, status: 'brouillon' | 'en attente' | 'publié' | 'archivé'): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, 'adminPredictions', id), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function migrateFirebaseStorageVideos(params: {
  dryRun: boolean;
  limit: number;
}): Promise<StorageMigrationResult> {
  const db = getFirestoreDb();
  const maxDocs = Math.max(1, Math.min(params.limit || 25, 100));

  const sources = [
    { source: 'performances' as const, snap: await getDocs(query(collectionGroup(db, 'performances'), limit(maxDocs))) },
    { source: 'publication' as const, snap: await getDocs(query(collectionGroup(db, 'publication'), limit(maxDocs))) },
    { source: 'reportage' as const, snap: await getDocs(query(collection(db, 'reportage'), limit(maxDocs))) }
  ];

  const migrated: StorageMigrationResult['migrated'] = [];
  const failed: StorageMigrationResult['failed'] = [];
  let skippedCount = 0;

  for (const group of sources) {
    for (const docSnap of group.snap.docs) {
      const data = docSnap.data() as any;
      const legacy = findLegacyVideoField(data);

      if (!legacy) {
        skippedCount += 1;
        continue;
      }

      const ownerId = getString(data?.userId, data?.ownerId, data?.authorId, docSnap.ref.parent.parent?.id, 'unknown');
      const item = {
        id: docSnap.id,
        path: docSnap.ref.path,
        source: group.source,
        field: legacy.field,
        legacyUrl: legacy.url
      };

      if (params.dryRun) {
        migrated.push(item);
        continue;
      }

      try {
        const media = await migrateRemoteVideoToCloudinary({
          legacyUrl: legacy.url,
          source: group.source,
          ownerId,
          docId: docSnap.id
        });

        await updateDoc(doc(db, docSnap.ref.path), {
          [legacy.field]: media.secureUrl,
          videoUrl: media.secureUrl,
          secure_url: media.secureUrl,
          cloudinaryUrl: media.secureUrl,
          cloudinaryPublicId: media.publicId,
          thumbnailUrl: data.thumbnailUrl || media.thumbnailUrl || '',
          storageProvider: 'cloudinary',
          legacyFirebaseStorageUrl: legacy.url,
          migratedFromFirebaseStorageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          format: data.format || media.format || '',
          duration: data.duration || media.duration || null,
          width: data.width || media.width || null,
          height: data.height || media.height || null,
          bytes: data.bytes || media.bytes || null
        });

        migrated.push({
          ...item,
          cloudinaryUrl: media.secureUrl,
          cloudinaryPublicId: media.publicId
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push({
          path: docSnap.ref.path,
          source: group.source,
          error: message
        });

        if (message.includes('402') || message.toLowerCase().includes('payment required')) {
          return {
            dryRun: params.dryRun,
            limit: maxDocs,
            migratedCount: migrated.length,
            skippedCount,
            failedCount: failed.length,
            migrated,
            failed
          };
        }
      }
    }
  }

  return {
    dryRun: params.dryRun,
    limit: maxDocs,
    migratedCount: migrated.length,
    skippedCount,
    failedCount: failed.length,
    migrated,
    failed
  };
}
