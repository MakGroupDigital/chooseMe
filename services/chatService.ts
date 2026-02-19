import {
  addDoc,
  arrayUnion,
  writeBatch,
  collection,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { getFirebaseApp } from './firebase';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { createAppNotification } from './notificationService';

export interface ChatUserMini {
  id: string;
  displayName: string;
  avatarUrl: string;
  type: string;
}

export interface ChatConversationSummary {
  id: string;
  participants: string[];
  otherUserId: string;
  otherUser: ChatUserMini;
  lastMessage: string;
  lastMessageSenderId: string;
  updatedAt: Date | null;
}

export interface ChatMessage {
  id: string;
  type: 'text' | 'audio' | 'video' | 'photo';
  text: string;
  mediaUrl?: string;
  storagePath?: string;
  ephemeral?: boolean;
  ttlSeconds?: number;
  armedBy?: string;
  armedAt?: Date | null;
  expiresAt?: Date | null;
  senderId: string;
  readBy?: string[];
  createdAt: Date | null;
}

function safeDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function conversationIdFrom(userA: string, userB: string): string {
  return [userA, userB].sort().join('_');
}

export async function getUserMiniProfile(userId: string): Promise<ChatUserMini> {
  const db = getFirestore(getFirebaseApp());
  const usersRef = doc(db, 'users', userId);
  const userRef = doc(db, 'user', userId);
  const [usersSnap, userSnap] = await Promise.all([getDoc(usersRef), getDoc(userRef)]);
  const profileSnap = usersSnap.exists() ? usersSnap : userSnap;
  const data = profileSnap.exists() ? (profileSnap.data() as any) : {};

  return {
    id: userId,
    displayName:
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
      '/assets/images/app_launcher_icon.png',
    type: String(data?.type || '')
  };
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  const db = getFirestore(getFirebaseApp());
  const conversationId = conversationIdFrom(userA, userB);
  const conversationRef = doc(db, 'conversations', conversationId);
  const snap = await getDoc(conversationRef);

  if (!snap.exists()) {
    await setDoc(
      conversationRef,
      {
        participants: [userA, userB],
        lastMessage: '',
        lastMessageSenderId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  return conversationId;
}

export async function uploadChatMedia(
  conversationId: string,
  senderId: string,
  file: File | Blob,
  kind: 'audio' | 'video' | 'photo'
): Promise<string> {
  const storage = getStorage(getFirebaseApp());
  const blobType =
    (file as File).type ||
    (kind === 'audio' ? 'audio/webm' : kind === 'photo' ? 'image/jpeg' : 'video/webm');
  const ext = blobType.includes('mp4')
    ? 'mp4'
    : blobType.includes('ogg')
      ? 'ogg'
      : blobType.includes('mpeg')
        ? 'mp3'
        : blobType.includes('png')
          ? 'png'
          : blobType.includes('jpeg') || blobType.includes('jpg')
            ? 'jpg'
            : 'webm';
  const filePath = `chat_media/${conversationId}/${Date.now()}_${senderId}.${ext}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file, { contentType: blobType });
  return `${await getDownloadURL(storageRef)}|||${filePath}`;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  options?: { type?: 'text' | 'audio' | 'video' | 'photo'; mediaUrl?: string; expiresInSeconds?: number }
): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const normalized = text.trim();
  const type = options?.type || 'text';
  if (type === 'text' && !normalized) return;
  if (type !== 'text' && !options?.mediaUrl) return;
  const expiresAt =
    options?.expiresInSeconds && options.expiresInSeconds > 0
      ? new Date(Date.now() + options.expiresInSeconds * 1000)
      : null;
  const isEphemeral = Boolean(options?.expiresInSeconds && options.expiresInSeconds > 0);
  const [resolvedMediaUrl, resolvedStoragePath] = (options?.mediaUrl || '').split('|||');

  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(messagesRef, {
    type,
    text: normalized,
    mediaUrl: resolvedMediaUrl || '',
    storagePath: resolvedStoragePath || '',
    ephemeral: isEphemeral,
    ttlSeconds: options?.expiresInSeconds || 0,
    armedBy: '',
    armedAt: null,
    expiresAt: isEphemeral ? null : expiresAt,
    senderId,
    readBy: [senderId],
    createdAt: serverTimestamp()
  });

  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  const conversationData = conversationSnap.exists() ? (conversationSnap.data() as any) : {};
  const participants: string[] = Array.isArray(conversationData?.participants) ? conversationData.participants : [];
  const recipientId = participants.find((p) => p !== senderId) || '';
  const lastMessageLabel =
    type === 'text'
      ? normalized
      : type === 'audio'
        ? '🎤 Message vocal'
        : type === 'photo'
          ? '📸 Photo'
          : '🎬 Vidéo';

  await updateDoc(conversationRef, {
    lastMessage: lastMessageLabel,
    lastMessageSenderId: senderId,
    updatedAt: serverTimestamp()
  });

  if (recipientId) {
    await createAppNotification({
      type: 'message',
      recipientId,
      actorId: senderId,
      title: 'Nouveau message',
      body: lastMessageLabel,
      data: { conversationId }
    });
  }
}

export function listenUserConversations(
  userId: string,
  callback: (items: ChatConversationSummary[]) => void
): () => void {
  const db = getFirestore(getFirebaseApp());
  const conversationsRef = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));

  const unsub = onSnapshot(
    conversationsRef,
    async (snap) => {
      const raw = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((item) => Array.isArray(item.participants) && item.participants.includes(userId));

      const items = await Promise.all(
        raw.map(async (item) => {
          const otherUserId = (item.participants as string[]).find((p) => p !== userId) || userId;
          const otherUser = await getUserMiniProfile(otherUserId);
          return {
            id: item.id,
            participants: item.participants,
            otherUserId,
            otherUser,
            lastMessage: item.lastMessage || '',
            lastMessageSenderId: item.lastMessageSenderId || '',
            updatedAt: safeDate(item.updatedAt)
          } as ChatConversationSummary;
        })
      );

      items.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
      callback(items);
    },
    () => callback([])
  );

  return () => unsub();
}

export function listenConversationMessages(
  conversationId: string,
  callback: (items: ChatMessage[]) => void
): () => void {
  const db = getFirestore(getFirebaseApp());
  const messagesRef = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  const unsub = onSnapshot(
    messagesRef,
    (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          type: data.type || 'text',
          text: data.text || '',
          mediaUrl: data.mediaUrl || '',
          storagePath: data.storagePath || '',
          ephemeral: Boolean(data.ephemeral),
          ttlSeconds: Number(data.ttlSeconds || 0),
          armedBy: data.armedBy || '',
          armedAt: safeDate(data.armedAt),
          expiresAt: safeDate(data.expiresAt),
          senderId: data.senderId || '',
          readBy: Array.isArray(data.readBy) ? data.readBy : [],
          createdAt: safeDate(data.createdAt)
        } as ChatMessage;
      });
      callback(items);
    },
    () => callback([])
  );

  return () => unsub();
}

export async function armEphemeralMessage(
  conversationId: string,
  messageId: string,
  openerId: string
): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  const snap = await getDoc(messageRef);
  if (!snap.exists()) return;
  const data = snap.data() as any;
  if (!data.ephemeral || !data.ttlSeconds || data.ttlSeconds <= 0) return;
  if (data.expiresAt) return;
  if (data.senderId === openerId) return;

  const expireAt = Timestamp.fromMillis(Date.now() + Number(data.ttlSeconds) * 1000);
  await updateDoc(messageRef, {
    armedBy: openerId,
    armedAt: serverTimestamp(),
    expiresAt: expireAt
  });
}

export async function deleteMessageAndMedia(conversationId: string, message: ChatMessage): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const messageRef = doc(db, 'conversations', conversationId, 'messages', message.id);

  if (message.storagePath) {
    try {
      const storage = getStorage(getFirebaseApp());
      await deleteObject(ref(storage, message.storagePath));
    } catch {
      // ignore storage delete failures
    }
  }

  await deleteDoc(messageRef);
}

export async function markConversationMessagesRead(
  conversationId: string,
  readerId: string,
  messages: ChatMessage[]
): Promise<void> {
  const unread = messages.filter((m) => m.senderId !== readerId && !(m.readBy || []).includes(readerId));
  if (unread.length === 0) return;

  const db = getFirestore(getFirebaseApp());
  const batch = writeBatch(db);
  unread.forEach((m) => {
    const refDoc = doc(db, 'conversations', conversationId, 'messages', m.id);
    batch.update(refDoc, { readBy: arrayUnion(readerId) });
  });
  await batch.commit();
}

export async function deleteSentMessageIfUnread(
  conversationId: string,
  messageId: string,
  senderId: string
): Promise<boolean> {
  const db = getFirestore(getFirebaseApp());
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  const snap = await getDoc(messageRef);
  if (!snap.exists()) return false;

  const data = snap.data() as any;
  if (data.senderId !== senderId) return false;

  const readBy = Array.isArray(data.readBy) ? data.readBy : [];
  const readByOthers = readBy.some((uid: string) => uid && uid !== senderId);
  const wasOpenedByRecipient = Boolean(data.armedBy && data.armedBy !== senderId) || Boolean(data.expiresAt);
  if (readByOthers || wasOpenedByRecipient) return false;

  const message: ChatMessage = {
    id: snap.id,
    type: data.type || 'text',
    text: data.text || '',
    mediaUrl: data.mediaUrl || '',
    storagePath: data.storagePath || '',
    ephemeral: Boolean(data.ephemeral),
    ttlSeconds: Number(data.ttlSeconds || 0),
    armedBy: data.armedBy || '',
    armedAt: safeDate(data.armedAt),
    expiresAt: safeDate(data.expiresAt),
    senderId: data.senderId || '',
    readBy,
    createdAt: safeDate(data.createdAt)
  };

  await deleteMessageAndMedia(conversationId, message);

  const messagesSnap = await getDocs(collection(db, 'conversations', conversationId, 'messages'));
  if (messagesSnap.empty) {
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: '',
      lastMessageSenderId: '',
      updatedAt: serverTimestamp()
    });
    return true;
  }

  const latest = messagesSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => {
      const ta = safeDate(a.createdAt)?.getTime() || 0;
      const tb = safeDate(b.createdAt)?.getTime() || 0;
      return tb - ta;
    })[0];

  const lastMessageLabel =
    latest.type === 'text'
      ? latest.text || ''
      : latest.type === 'audio'
        ? '🎤 Message vocal'
        : latest.type === 'photo'
          ? '📸 Photo'
          : '🎬 Vidéo';

  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: lastMessageLabel,
    lastMessageSenderId: latest.senderId || '',
    updatedAt: serverTimestamp()
  });

  return true;
}
