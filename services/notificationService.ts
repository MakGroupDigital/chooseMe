import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseApp } from './firebase';

export type AppNotificationType = 'message' | 'follow' | 'like';

export interface AppNotification {
  id: string;
  source?: 'users' | 'user';
  type: AppNotificationType;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | null;
  data?: Record<string, string>;
}

function asDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export async function getUserIdentity(userId: string): Promise<{ name: string; avatarUrl: string }> {
  const db = getFirestore(getFirebaseApp());
  const [usersSnap, userSnap] = await Promise.all([getDoc(doc(db, 'users', userId)), getDoc(doc(db, 'user', userId))]);
  const snap = usersSnap.exists() ? usersSnap : userSnap;
  const data = snap.exists() ? (snap.data() as any) : {};
  return {
    name:
      data?.displayName ||
      data?.display_name ||
      data?.userName ||
      data?.username ||
      data?.nom ||
      'Utilisateur',
    avatarUrl:
      data?.avatarUrl ||
      data?.photoUrl ||
      data?.photo_url ||
      data?.avatar_url ||
      '/assets/images/app_launcher_icon.png'
  };
}

async function resolveUserCollection(userId: string): Promise<'users' | 'user'> {
  const db = getFirestore(getFirebaseApp());
  const [usersSnap, userSnap] = await Promise.all([getDoc(doc(db, 'users', userId)), getDoc(doc(db, 'user', userId))]);
  if (usersSnap.exists()) return 'users';
  if (userSnap.exists()) return 'user';
  return 'users';
}

export async function createAppNotification(input: {
  type: AppNotificationType;
  recipientId: string;
  actorId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  if (!input.recipientId || !input.actorId) return;
  if (input.recipientId === input.actorId) return;

  const db = getFirestore(getFirebaseApp());
  const actor = await getUserIdentity(input.actorId);
  const recipientCollection = await resolveUserCollection(input.recipientId);

  await addDoc(collection(db, recipientCollection, input.recipientId, 'notifications'), {
    type: input.type,
    recipientId: input.recipientId,
    actorId: input.actorId,
    actorName: actor.name,
    actorAvatar: actor.avatarUrl,
    title: input.title,
    body: input.body,
    data: input.data || {},
    read: false,
    createdAt: serverTimestamp()
  });
}

export function listenUserNotifications(
  userId: string,
  callback: (items: AppNotification[]) => void
): () => void {
  const db = getFirestore(getFirebaseApp());
  const usersNotificationsRef = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const userNotificationsRef = query(
    collection(db, 'user', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  let usersItems: AppNotification[] = [];
  let userItems: AppNotification[] = [];

  const emit = () => {
    const merged = [...usersItems, ...userItems].sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
    callback(merged);
  };

  const mapSnapshot = (snap: any, source: 'users' | 'user'): AppNotification[] =>
    snap.docs.map((d: any) => {
      const data = d.data() as any;
      return {
        id: `${source}:${d.id}`,
        source,
        type: data.type,
        recipientId: data.recipientId,
        actorId: data.actorId,
        actorName: data.actorName || 'Utilisateur',
        actorAvatar: data.actorAvatar,
        title: data.title || '',
        body: data.body || '',
        read: Boolean(data.read),
        createdAt: asDate(data.createdAt),
        data: data.data || {}
      };
    });

  const unsubUsers = onSnapshot(
    usersNotificationsRef,
    (snap) => {
      usersItems = mapSnapshot(snap, 'users');
      emit();
    },
    () => {
      usersItems = [];
      emit();
    }
  );

  const unsubUser = onSnapshot(
    userNotificationsRef,
    (snap) => {
      userItems = mapSnapshot(snap, 'user');
      emit();
    },
    () => {
      userItems = [];
      emit();
    }
  );

  return () => {
    unsubUsers();
    unsubUser();
  };
}

function parseNotificationId(notificationId: string): { source: 'users' | 'user'; id: string } | null {
  if (!notificationId.includes(':')) return null;
  const [source, id] = notificationId.split(':');
  if ((source === 'users' || source === 'user') && id) {
    return { source, id };
  }
  return null;
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const parsed = parseNotificationId(notificationId);

  if (parsed) {
    await updateDoc(doc(db, parsed.source, userId, 'notifications', parsed.id), { read: true });
    return;
  }

  // Fallback compat: ancien format d'id sans préfixe
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
    return;
  } catch {
    // noop fallback below
  }
  await updateDoc(doc(db, 'user', userId, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const [usersSnap, userSnap] = await Promise.all([
    getDocs(collection(db, 'users', userId, 'notifications')),
    getDocs(collection(db, 'user', userId, 'notifications'))
  ]);

  const batch = writeBatch(db);
  [...usersSnap.docs, ...userSnap.docs].forEach((d) => {
    const data = d.data() as any;
    if (!data.read) {
      batch.update(d.ref, { read: true });
    }
  });
  await batch.commit();
}

export async function ensureBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function notifyBrowser(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/android-chrome-192x192.png'
    });
  } catch {
    // no-op
  }
}
