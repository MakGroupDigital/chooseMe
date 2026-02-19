import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Paperclip, Mic, Square, Bell, Camera, X, Play, Pause, Lock, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../../services/firebase';
import {
  armEphemeralMessage,
  ChatConversationSummary,
  ChatMessage,
  deleteSentMessageIfUnread,
  deleteMessageAndMedia,
  listenConversationMessages,
  listenUserConversations,
  markConversationMessagesRead,
  sendMessage,
  uploadChatMedia
} from '../../services/chatService';

const ChatAudioPlayer: React.FC<{ src: string; mine: boolean }> = ({ src, mine }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-64 max-w-[72vw]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => setPlaying(false)}
      />
      <div className={`rounded-xl p-2 border ${mine ? 'border-black/15 bg-black/10' : 'border-white/15 bg-white/5'}`}>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className={`w-8 h-8 rounded-full flex items-center justify-center ${mine ? 'bg-black text-white' : 'bg-[#19DB8A] text-black'}`}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(current, duration || 0)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = next;
                setCurrent(next);
              }}
              className="w-full accent-[#19DB8A]"
            />
          </div>
          <span className={`text-[10px] tabular-nums ${mine ? 'text-black/70' : 'text-white/60'}`}>
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ChatVideoPlayer: React.FC<{ src: string; mine: boolean }> = ({ src, mine }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="w-64 max-w-[74vw] rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-72 object-cover bg-black"
        playsInline
        onClick={toggle}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => setPlaying(false)}
      />
      <div className={`p-2 border-t ${mine ? 'bg-black/10 border-black/15' : 'bg-black/40 border-white/10'}`}>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className={`w-8 h-8 rounded-full flex items-center justify-center ${mine ? 'bg-black text-white' : 'bg-[#19DB8A] text-black'}`}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(current, duration || 0)}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = next;
              setCurrent(next);
            }}
            className="flex-1 accent-[#19DB8A]"
          />
        </div>
      </div>
    </div>
  );
};

type PendingChatMessage = {
  id: string;
  conversationId: string;
  type: 'video';
  mediaUrl: string;
  senderId: string;
  createdAt: Date;
  status: 'uploading' | 'failed';
  ephemeral: boolean;
  ttlSeconds: number;
};

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { currentUser, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [ephemeralVideoSeconds, setEphemeralVideoSeconds] = useState(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoPreviewStream, setVideoPreviewStream] = useState<MediaStream | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const videoChunksRef = useRef<BlobPart[]>([]);
  const recordingVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const deletingIdsRef = useRef<Set<string>>(new Set());
  const readingRef = useRef(false);

  useEffect(() => {
    setActiveConversationId(conversationId || null);
  }, [conversationId]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenUserConversations(currentUser.uid, (items) => {
      setConversations(items);
      setLoadingConversations(false);
      if (!activeConversationId && items.length > 0) {
        setActiveConversationId(items[0].id);
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const unsub = listenConversationMessages(activeConversationId, setMessages);
    return () => unsub();
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingMessages.length, activeConversationId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [recordedVideoUrl]);

  useEffect(() => {
    if (!recordingVideoRef.current || !videoPreviewStream) return;
    recordingVideoRef.current.srcObject = videoPreviewStream;
    recordingVideoRef.current.play().catch(() => {});
  }, [videoPreviewStream, recordingVideo]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const visibleMessages = useMemo(
    () => messages.filter((m) => !m.expiresAt || m.expiresAt.getTime() > nowTick),
    [messages, nowTick]
  );
  const renderedMessages = useMemo(() => {
    const serverItems = visibleMessages.map((m) => ({
      id: m.id,
      kind: 'server' as const,
      createdAt: m.createdAt || new Date(0),
      payload: m
    }));
    const pendingItems = pendingMessages
      .filter((m) => m.conversationId === activeConversationId)
      .map((m) => ({
        id: m.id,
        kind: 'pending' as const,
        createdAt: m.createdAt,
        payload: m
      }));
    return [...serverItems, ...pendingItems].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [visibleMessages, pendingMessages]);

  useEffect(() => {
    if (!activeConversationId) return;
    messages.forEach((m) => {
      if (!m.expiresAt) return;
      if (m.expiresAt.getTime() > nowTick) return;
      if (deletingIdsRef.current.has(m.id)) return;
      deletingIdsRef.current.add(m.id);
      void deleteMessageAndMedia(activeConversationId, m).catch(() => {
        deletingIdsRef.current.delete(m.id);
      });
    });
  }, [messages, nowTick, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId || !currentUser || readingRef.current) return;
    const unread = messages.some((m) => m.senderId !== currentUser.uid && !(m.readBy || []).includes(currentUser.uid));
    if (!unread) return;
    readingRef.current = true;
    void markConversationMessagesRead(activeConversationId, currentUser.uid, messages)
      .catch((error) => {
        console.error('Erreur marquage lu:', error);
      })
      .finally(() => {
        readingRef.current = false;
      });
  }, [activeConversationId, currentUser, messages]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/messages/${id}`);
  };

  const handleOpenPublicProfile = () => {
    if (!activeConversation?.otherUserId) return;
    navigate(`/athlete/${activeConversation.otherUserId}`);
  };

  const handleSend = async () => {
    if (!currentUser || !activeConversationId || !draft.trim()) return;
    try {
      setSending(true);
      const text = draft;
      setDraft('');
      await sendMessage(activeConversationId, currentUser.uid, text);
    } finally {
      setSending(false);
    }
  };

  const canDeleteSentUnopened = (message: ChatMessage): boolean => {
    if (!currentUser || message.senderId !== currentUser.uid) return false;
    const readByOthers = (message.readBy || []).some((id) => id !== currentUser.uid);
    if (readByOthers) return false;
    const openedByRecipient = Boolean(message.armedBy && message.armedBy !== currentUser.uid) || Boolean(message.expiresAt);
    return !openedByRecipient;
  };

  const handlePickMedia = () => {
    fileInputRef.current?.click();
  };

  const handleMediaSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !activeConversationId) return;
    const kind = file.type.startsWith('audio/')
      ? 'audio'
      : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('image/')
          ? 'photo'
          : null;
    if (!kind) return;
    try {
      setSending(true);
      const mediaUrl = await uploadChatMedia(activeConversationId, currentUser.uid, file, kind);
      await sendMessage(activeConversationId, currentUser.uid, '', {
        type: kind,
        mediaUrl,
        expiresInSeconds: kind === 'video' ? ephemeralVideoSeconds : 0
      });
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const toggleAudioRecording = async () => {
    if (!currentUser || !activeConversationId) return;
    if (recordingAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingAudio(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' });
    audioChunksRef.current = [];
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      stream.getTracks().forEach((t) => t.stop());
      try {
        setSending(true);
        const mediaUrl = await uploadChatMedia(activeConversationId, currentUser.uid, blob, 'audio');
        await sendMessage(activeConversationId, currentUser.uid, '', { type: 'audio', mediaUrl });
      } finally {
        setSending(false);
      }
    };

    recorder.start();
    setRecordingAudio(true);
  };

  const startVideoRecording = async () => {
    if (recordingVideo) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1080 }, height: { ideal: 1920 }, facingMode: 'user' },
      audio: true
    });
    videoStreamRef.current = stream;
    setVideoPreviewStream(stream);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    videoChunksRef.current = [];
    videoRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) {
        videoChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: recorder.mimeType || 'video/webm' });
      setRecordedVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      setVideoPreviewStream(null);
      setRecordingVideo(false);
    };

    recorder.start();
    setRecordedVideoBlob(null);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    setRecordingVideo(true);
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
      videoRecorderRef.current.stop();
    }
  };

  const discardRecordedVideo = () => {
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoBlob(null);
    setRecordedVideoUrl(null);
  };

  const sendRecordedVideo = async () => {
    if (!currentUser || !activeConversationId) return;
    let pendingId = '';
    let pendingUrl = '';
    try {
      let blobToSend = recordedVideoBlob;
      if (!blobToSend && recordedVideoUrl) {
        const response = await fetch(recordedVideoUrl);
        blobToSend = await response.blob();
      }
      if (!blobToSend) {
        throw new Error('Aucune vidéo prête à envoyer');
      }

      pendingId = `pending_video_${Date.now()}`;
      pendingUrl = URL.createObjectURL(blobToSend);
      setPendingMessages((prev) => [
        ...prev,
        {
          id: pendingId,
          conversationId: activeConversationId,
          type: 'video',
          mediaUrl: pendingUrl,
          senderId: currentUser.uid,
          createdAt: new Date(),
          status: 'uploading',
          ephemeral: ephemeralVideoSeconds > 0,
          ttlSeconds: ephemeralVideoSeconds
        }
      ]);

      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      setVideoPreviewStream(null);
      setRecordingVideo(false);
      setRecordedVideoBlob(null);
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);
      }

      const conversationIdAtSend = activeConversationId;
      const senderIdAtSend = currentUser.uid;
      const ttlSecondsAtSend = ephemeralVideoSeconds;
      void (async () => {
        const mediaUrl = await uploadChatMedia(conversationIdAtSend, senderIdAtSend, blobToSend, 'video');
        await sendMessage(conversationIdAtSend, senderIdAtSend, '', {
          type: 'video',
          mediaUrl,
          expiresInSeconds: ttlSecondsAtSend
        });
        setPendingMessages((prev) => prev.filter((p) => p.id !== pendingId));
        if (pendingUrl) URL.revokeObjectURL(pendingUrl);
      })().catch((error) => {
        console.error('Erreur upload vidéo en arrière-plan:', error);
        setPendingMessages((prev) =>
          prev.map((p) => (p.id === pendingId ? { ...p, status: 'failed' } : p))
        );
      });
    } catch (error) {
      console.error('Erreur envoi vidéo chat:', error);
      if (pendingId) {
        setPendingMessages((prev) =>
          prev.map((p) => (p.id === pendingId ? { ...p, status: 'failed' } : p))
        );
      } else {
        alert('Impossible d’envoyer la vidéo. Vérifiez votre connexion et réessayez.');
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-full bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#19DB8A] border-t-transparent" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="h-full bg-[#050505] flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-white/5 flex items-center gap-3">
        {!!activeConversationId && (
          <button
            onClick={() => navigate('/messages')}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <h1 className="text-2xl font-readex font-bold text-white">Messages</h1>
        <button
          onClick={() => navigate('/notifications')}
          className="ml-auto w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center"
        >
          <Bell size={16} />
        </button>
      </div>

      {!activeConversationId && (
        <div className="p-4 space-y-3">
          {loadingConversations && (
            <div className="text-white/50 text-sm text-center py-10">Chargement des conversations...</div>
          )}
          {!loadingConversations && conversations.length === 0 && (
            <div className="text-center py-14">
              <MessageCircle className="mx-auto mb-3 text-white/20" size={34} />
              <p className="text-white/65 text-sm">Aucune conversation pour le moment.</p>
            </div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectConversation(c.id)}
              className="w-full text-left bg-[#0A0A0A] border border-white/5 rounded-2xl p-3 flex items-center gap-3"
            >
              <img
                src={c.otherUser.avatarUrl}
                className="w-11 h-11 rounded-xl object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/images/app_launcher_icon.png';
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate">{c.otherUser.displayName}</p>
                <p className="text-white/40 text-xs truncate">{c.lastMessage || 'Nouvelle conversation'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!!activeConversationId && activeConversation && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 bg-[#050505]">
            <button onClick={handleOpenPublicProfile} className="flex items-center gap-3 min-w-0 text-left">
              <img
                src={activeConversation.otherUser.avatarUrl}
                className="w-10 h-10 rounded-xl object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/images/app_launcher_icon.png';
                }}
              />
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{activeConversation.otherUser.displayName}</p>
                <p className="text-[#19DB8A] text-[11px] uppercase">{activeConversation.otherUser.type || 'membre'}</p>
              </div>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4 space-y-2">
            {renderedMessages.length === 0 && (
              <p className="text-center text-white/40 text-xs pt-8">Démarrez la conversation.</p>
            )}
            {renderedMessages.map((entry) => {
              const m = entry.payload as any;
              const mine = m.senderId === currentUser.uid;
              const isPending = entry.kind === 'pending';
              const isEphemeralMedia = Boolean(m.ephemeral && (m.type === 'video' || m.type === 'photo' || m.type === 'audio'));
              const isSealedForCurrentUser = isEphemeralMedia && !m.expiresAt && !mine;
              const isWaitingForRecipient = isEphemeralMedia && !m.expiresAt && mine;
              return (
                <div key={`${entry.kind}_${m.id}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                      mine ? 'bg-[#19DB8A] text-black rounded-br-md' : 'bg-white/10 text-white rounded-bl-md'
                    }`}
                  >
                    {m.type === 'text' && m.text}
                    {isSealedForCurrentUser && (
                      <button
                        onClick={() => {
                          if (!activeConversationId) return;
                          void armEphemeralMessage(activeConversationId, m.id, currentUser.uid);
                        }}
                        className="w-56 max-w-[70vw] rounded-xl bg-black/20 border border-black/20 p-3 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Lock size={15} />
                          <p className="font-semibold text-sm">Média éphémère</p>
                        </div>
                        <p className="text-xs mt-1 opacity-80">Appuyer pour ouvrir ({m.ttlSeconds || 0}s)</p>
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold">
                          <Eye size={13} /> Ouvrir maintenant
                        </div>
                      </button>
                    )}
                    {isWaitingForRecipient && (
                      <div className="w-56 max-w-[70vw] rounded-xl bg-black/10 border border-black/20 p-3">
                        <p className="text-sm font-semibold">Enveloppe envoyée</p>
                        <p className="text-xs mt-1 opacity-80">Le délai commencera quand le destinataire ouvrira.</p>
                      </div>
                    )}
                    {!isSealedForCurrentUser && !isWaitingForRecipient && m.type === 'audio' && m.mediaUrl && (
                      <ChatAudioPlayer src={m.mediaUrl} mine={mine} />
                    )}
                    {!isSealedForCurrentUser && !isWaitingForRecipient && m.type === 'photo' && m.mediaUrl && (
                      <img src={m.mediaUrl} className="max-w-full rounded-lg max-h-72 object-cover" />
                    )}
                    {!isSealedForCurrentUser && !isWaitingForRecipient && m.type === 'video' && m.mediaUrl && (
                      <div className="space-y-1">
                        <ChatVideoPlayer src={m.mediaUrl} mine={mine} />
                        {isPending && (
                          <p className={`text-[10px] ${mine ? 'text-black/70' : 'text-white/60'}`}>
                            {m.status === 'uploading' ? 'Envoi en cours...' : 'Échec envoi'}
                          </p>
                        )}
                        {m.expiresAt && (
                          <p className={`text-[10px] ${mine ? 'text-black/70' : 'text-white/60'}`}>
                            Disparaît dans {Math.max(0, Math.ceil((m.expiresAt.getTime() - nowTick) / 1000))}s
                          </p>
                        )}
                      </div>
                    )}
                    {entry.kind === 'server' && canDeleteSentUnopened(m as ChatMessage) && (
                      <div className="mt-1 flex justify-end">
                        <button
                          onClick={() => {
                            if (!activeConversationId || !currentUser) return;
                            if (!window.confirm('Supprimer ce message ?')) return;
                            void deleteSentMessageIfUnread(activeConversationId, m.id, currentUser.uid).catch((error) => {
                              console.error('Suppression impossible:', error);
                              alert('Impossible de supprimer ce message maintenant.');
                            });
                          }}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                            mine ? 'text-black/70 hover:text-black' : 'text-white/65 hover:text-white'
                          }`}
                        >
                          <Trash2 size={12} />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-white/5 bg-[#050505]">
            <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*,video/*"
                className="hidden"
                onChange={handleMediaSelected}
              />
              <button
                onClick={handlePickMedia}
                className="w-9 h-9 rounded-xl bg-white/5 text-white flex items-center justify-center"
                title="Joindre audio/vidéo"
              >
                <Paperclip size={16} />
              </button>
              <button
                onClick={() => void toggleAudioRecording()}
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${recordingAudio ? 'bg-red-500 text-white' : 'bg-white/5 text-white'}`}
                title={recordingAudio ? 'Stop enregistrement' : 'Enregistrer un vocal'}
              >
                {recordingAudio ? <Square size={15} /> : <Mic size={16} />}
              </button>
              <button
                onClick={() => void (recordingVideo ? stopVideoRecording() : startVideoRecording())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${recordingVideo ? 'bg-red-500 text-white' : 'bg-white/5 text-white'}`}
                title={recordingVideo ? 'Stop vidéo' : 'Enregistrer une vidéo'}
              >
                {recordingVideo ? <Square size={15} /> : <Camera size={16} />}
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Écrire un message..."
                className="flex-1 bg-transparent text-white placeholder-white/35 px-2 text-sm focus:outline-none"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!draft.trim() || sending || recordingAudio}
                className="w-9 h-9 rounded-xl bg-[#19DB8A] text-black flex items-center justify-center disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-white/45 text-[10px] font-semibold">Disparition vidéo:</span>
              <select
                value={ephemeralVideoSeconds}
                onChange={(e) => setEphemeralVideoSeconds(Number(e.target.value))}
                className="bg-[#0A0A0A] border border-white/10 text-white/80 text-[11px] rounded-lg px-2 py-1"
              >
                <option value={0}>Jamais</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1 min</option>
                <option value={300}>5 min</option>
                <option value={3600}>1h</option>
                <option value={86400}>24h</option>
              </select>
            </div>
          </div>
        </div>
      )}
      {(recordingVideo || recordedVideoUrl) && (
        <div className="fixed inset-0 z-[120] bg-black/95 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3">
            <p className="text-white text-sm font-semibold">
              {recordingVideo ? 'Enregistrement vidéo en cours...' : 'Prévisualisation vidéo'}
            </p>
            <button
              onClick={() => {
                if (recordingVideo) stopVideoRecording();
                if (videoStreamRef.current) {
                  videoStreamRef.current.getTracks().forEach((t) => t.stop());
                  videoStreamRef.current = null;
                }
                setVideoPreviewStream(null);
                setRecordingVideo(false);
                if (!recordedVideoUrl) return;
                discardRecordedVideo();
              }}
              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
          {recordingVideo && (
            <video
              ref={recordingVideoRef}
              className="flex-1 rounded-2xl bg-black object-contain"
              muted
              playsInline
              autoPlay
            />
          )}
          {!recordingVideo && recordedVideoUrl && (
            <video src={recordedVideoUrl} className="flex-1 rounded-2xl bg-black object-contain" controls playsInline />
          )}
          <div className="pt-3 mt-auto bg-gradient-to-t from-black/90 to-transparent">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  if (recordingVideo) stopVideoRecording();
                  if (videoStreamRef.current) {
                    videoStreamRef.current.getTracks().forEach((t) => t.stop());
                    videoStreamRef.current = null;
                  }
                  setVideoPreviewStream(null);
                  setRecordingVideo(false);
                  if (recordedVideoUrl) discardRecordedVideo();
                }}
                className="h-11 rounded-xl bg-white/10 text-white font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => void (recordingVideo ? stopVideoRecording() : startVideoRecording())}
                className={`h-11 rounded-xl font-bold ${recordingVideo ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}
              >
                {recordingVideo ? 'Stop' : 'Enregistrer'}
              </button>
              <button
                onClick={() => void sendRecordedVideo()}
                disabled={(!recordedVideoUrl && !recordedVideoBlob) || sending}
                className="h-11 rounded-xl bg-[#19DB8A] text-black font-bold disabled:opacity-40"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
