import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ArrowLeft, Heart, MessageCircle, UserPlus, Mail } from 'lucide-react';
import { useAuth } from '../../services/firebase';
import {
  AppNotification,
  listenUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from '../../services/notificationService';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenUserNotifications(currentUser.uid, setNotifications);
    return () => unsub();
  }, [currentUser?.uid]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const getReportageIdFromDocPath = (docPath?: string) => {
    if (!docPath) return '';
    const parts = docPath.split('/');
    const reportageIndex = parts.findIndex((part) => part === 'reportage');
    if (reportageIndex >= 0 && parts[reportageIndex + 1]) {
      return parts[reportageIndex + 1];
    }
    return '';
  };

  const getNotificationMeta = (item: AppNotification) => {
    if (item.type === 'message') return { label: 'Message', Icon: Mail, tone: 'text-[#4285F4] bg-[#4285F4]/12' };
    if (item.type === 'follow') return { label: 'Abonnement', Icon: UserPlus, tone: 'text-[#19DB8A] bg-[#19DB8A]/12' };
    if (item.type === 'like') return { label: 'Like', Icon: Heart, tone: 'text-[#FF4D6D] bg-[#FF4D6D]/12' };
    return { label: item.type === 'reply' ? 'Réponse' : 'Commentaire', Icon: MessageCircle, tone: 'text-[#FBBC05] bg-[#FBBC05]/12' };
  };

  const handleOpen = async (item: AppNotification) => {
    if (!currentUser) return;
    if (!item.read) {
      await markNotificationAsRead(currentUser.uid, item.id);
    }

    if (item.type === 'message' && item.data?.conversationId) {
      navigate(`/messages/${item.data.conversationId}`);
      return;
    }
    if (item.type === 'follow' && item.data?.followerId) {
      navigate(`/athlete/${item.data.followerId}`);
      return;
    }

    if (item.type === 'like' || item.type === 'comment' || item.type === 'reply') {
      const contentDocPath = item.data?.docPath || item.data?.postDocPath;
      const reportageId = getReportageIdFromDocPath(contentDocPath);
      if (reportageId) {
        navigate(`/explorer/reportage/${reportageId}`);
        return;
      }
      navigate('/profile');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-full bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#19DB8A] border-t-transparent" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-full bg-[#050505] pb-28">
      <div className="px-4 pt-4 pb-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-2xl font-readex font-bold text-white">Alertes</h1>
        </div>
        <button
          onClick={() => markAllNotificationsAsRead(currentUser.uid)}
          className="text-[#19DB8A] text-xs font-bold flex items-center gap-1"
        >
          <CheckCheck size={14} />
          Tout lire
        </button>
      </div>

      <div className="p-4 space-y-3">
        {notifications.length === 0 && (
          <div className="text-center py-14">
            <Bell className="mx-auto mb-3 text-white/20" size={34} />
            <p className="text-white/65 text-sm">Aucune notification.</p>
          </div>
        )}
        {notifications.map((n) => {
          const meta = getNotificationMeta(n);
          const Icon = meta.Icon;
          return (
            <button
              key={n.id}
              onClick={() => void handleOpen(n)}
              className={`w-full text-left rounded-2xl p-3 border ${n.read ? 'bg-[#0A0A0A] border-white/5' : 'bg-[#0D1A13] border-[#19DB8A]/35'}`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={n.actorAvatar || '/assets/images/app_launcher_icon.png'}
                    className="w-10 h-10 rounded-xl object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/images/app_launcher_icon.png';
                    }}
                  />
                  <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#050505] ${meta.tone}`}>
                    <Icon size={11} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.tone}`}>
                      {meta.label}
                    </span>
                    {n.createdAt && (
                      <span className="text-[10px] text-white/28">
                        {n.createdAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{n.title}</p>
                  <p className="text-white/60 text-xs line-clamp-2">{n.actorName} • {n.body}</p>
                </div>
                {!n.read && <span className="mt-4 w-2 h-2 rounded-full bg-[#19DB8A]" />}
              </div>
            </button>
          );
        })}
      </div>

      {unreadCount > 0 && (
        <div className="fixed bottom-24 right-4 bg-[#19DB8A] text-black text-xs font-bold px-3 py-1.5 rounded-full">
          {unreadCount} non lues
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
