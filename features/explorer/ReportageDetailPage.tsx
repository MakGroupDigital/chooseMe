import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, FileText, Heart, MessageCircle, Send, Share2, UserPlus } from 'lucide-react';
import { fetchReportages, incrementReportageShare, toggleReportageLike, type ReportageItem } from '../../services/reportageService';
import { getFirebaseAuth } from '../../services/firebase';
import { followAthlete, isFollowing, unfollowAthlete } from '../../services/followService';
import { addComment, addCommentReply, fetchComments, likeComment } from '../../services/commentService';
import type { PostComment } from '../../types';

type LocationState = {
  reportage?: ReportageItem;
};

const ReportageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [item, setItem] = useState<ReportageItem | null>(state?.reportage ?? null);
  const [loading, setLoading] = useState(!state?.reportage);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowingMedia, setIsFollowingMedia] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [replyingToComment, setReplyingToComment] = useState<PostComment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    setCurrentUserId(getFirebaseAuth().currentUser?.uid || '');
  }, []);

  useEffect(() => {
    if (!item && id) {
      const load = async () => {
        setLoading(true);
        const all = await fetchReportages();
        const found = all.find((r) => r.id === id) ?? null;
        setItem(found);
        setLoading(false);
      };
      void load();
    }
  }, [id, item]);

  useEffect(() => {
    if (!item || !currentUserId) return;

    setIsLiked(item.likedBy.includes(currentUserId));
    if (item.reporterId && item.reporterId !== currentUserId) {
      isFollowing(currentUserId, item.reporterId)
        .then(setIsFollowingMedia)
        .catch(() => {});
    }
  }, [currentUserId, item]);

  useEffect(() => {
    if (!item?.docPath) return;

    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const list = await fetchComments(item.docPath);
        setComments(list);
      } finally {
        setCommentsLoading(false);
      }
    };

    void loadComments();
  }, [item?.docPath]);

  const getCommentAuthor = () => {
    const authUser = getFirebaseAuth().currentUser;
    return {
      userId: authUser?.uid || currentUserId,
      userName: authUser?.displayName || authUser?.email?.split('@')[0] || 'Utilisateur',
      userAvatar: authUser?.photoURL || undefined
    };
  };

  const handleShare = async () => {
    if (!item) return;
    const url = `${window.location.origin}/#/explorer/reportage/${item.id}`;
    const text = `${item.title} - ${item.reporter}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text,
          url
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Lien du reportage copié dans le presse-papiers.');
      } else {
        alert(url);
      }

      setItem((prev) => prev ? { ...prev, shares: prev.shares + 1 } : prev);
      await incrementReportageShare(item);
    } catch {
      // Partage annulé ou compteur indisponible.
    }
  };

  const handleLike = async () => {
    if (!item) return;
    if (!currentUserId) {
      navigate('/login');
      return;
    }
    if (actionLoading) return;

    const previousLiked = isLiked;
    setActionLoading(true);
    setIsLiked(!previousLiked);
    setItem((prev) => prev ? {
      ...prev,
      likes: previousLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
      likedBy: previousLiked
        ? prev.likedBy.filter((id) => id !== currentUserId)
        : [...new Set([...prev.likedBy, currentUserId])]
    } : prev);

    try {
      await toggleReportageLike(item, currentUserId, previousLiked);
    } catch (error) {
      console.error('Like reportage impossible:', error);
      setIsLiked(previousLiked);
      setItem((prev) => prev ? {
        ...prev,
        likes: previousLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1),
        likedBy: previousLiked
          ? [...new Set([...prev.likedBy, currentUserId])]
          : prev.likedBy.filter((id) => id !== currentUserId)
      } : prev);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!item?.reporterId) return;
    if (!currentUserId) {
      navigate('/login');
      return;
    }
    if (item.reporterId === currentUserId || actionLoading) return;

    const previous = isFollowingMedia;
    setActionLoading(true);
    setIsFollowingMedia(!previous);
    try {
      if (previous) {
        await unfollowAthlete(currentUserId, item.reporterId);
      } else {
        await followAthlete(currentUserId, item.reporterId);
      }
    } catch (error) {
      console.error('Abonnement média impossible:', error);
      setIsFollowingMedia(previous);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!item?.docPath || !newComment.trim() || commentSending) return;
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    const author = getCommentAuthor();
    setCommentSending(true);
    try {
      await addComment({
        docPath: item.docPath,
        userId: author.userId,
        userName: author.userName,
        userAvatar: author.userAvatar,
        text: newComment
      });
      setNewComment('');
      const list = await fetchComments(item.docPath);
      setComments(list);
      setItem((prev) => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : prev);
    } catch (error) {
      console.error('Commentaire reportage impossible:', error);
      alert("Impossible d'envoyer le commentaire pour le moment.");
    } finally {
      setCommentSending(false);
    }
  };

  const handleSendReply = async (comment: PostComment) => {
    if (!item?.docPath || !replyText.trim() || sendingReply) return;
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    const author = getCommentAuthor();
    setSendingReply(true);
    try {
      await addCommentReply({
        docPath: item.docPath,
        commentId: comment.id,
        userId: author.userId,
        userName: author.userName,
        userAvatar: author.userAvatar,
        text: replyText
      });
      setReplyingToComment(null);
      setReplyText('');
      const list = await fetchComments(item.docPath);
      setComments(list);
      setItem((prev) => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : prev);
    } catch (error) {
      console.error('Réponse reportage impossible:', error);
      alert("Impossible d'envoyer la réponse pour le moment.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleLikeComment = async (comment: PostComment) => {
    if (!item?.docPath || likedComments.has(comment.id)) return;

    setLikedComments((prev) => new Set(prev).add(comment.id));
    setComments((prev) => prev.map((current) => (
      current.id === comment.id ? { ...current, likes: current.likes + 1 } : current
    )));

    try {
      await likeComment({ docPath: item.docPath, commentId: comment.id });
    } catch (error) {
      console.error('Like commentaire reportage impossible:', error);
      setLikedComments((prev) => {
        const next = new Set(prev);
        next.delete(comment.id);
        return next;
      });
      setComments((prev) => prev.map((current) => (
        current.id === comment.id ? { ...current, likes: Math.max(0, current.likes - 1) } : current
      )));
    }
  };

  if (!id) {
    navigate('/explorer', { replace: true });
    return null;
  }

  if (loading || !item) {
    return (
      <div className="h-full flex flex-col bg-[#050505]">
        <header className="px-4 pt-10 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/40 border border-white/10 text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-white font-semibold text-sm">Reportage</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/50 text-sm">Chargement du reportage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Header */}
      <header className="px-4 pt-10 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/40 border border-white/10 text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#19DB8A] font-semibold">
              {item.kind === 'article' ? 'Article' : 'Reportage'}
            </span>
            <h1 className="text-white font-semibold text-sm line-clamp-1">
              {item.title}
            </h1>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-black/40 border border-white/10 text-white"
        >
          <Share2 size={16} />
        </button>
      </header>

      {/* Media */}
      <div className="px-4">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black shadow-xl">
          {item.mediaType === 'video' && item.videoUrl ? (
            <video
              src={item.videoUrl}
              className="w-full h-56 object-cover"
              controls
              playsInline
              preload="metadata"
            />
          ) : item.imageUrl ? (
            <img src={item.imageUrl} className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-44 items-center justify-center bg-[#0A0A0A] text-[#19DB8A]">
              <FileText size={34} />
            </div>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="flex-1 px-4 pt-4 pb-24 overflow-y-auto custom-scrollbar space-y-4">
        <div>
          <h2 className="text-white text-lg font-bold leading-snug">
            {item.title}
          </h2>
          <p className="text-white/50 text-xs mt-1">
            Par {item.reporter} • {item.date}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLike}
            disabled={actionLoading}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
              isLiked ? 'bg-[#19DB8A]/18 text-[#19DB8A]' : 'bg-white/[0.08] text-white/65'
            }`}
          >
            <Heart size={16} className={isLiked ? 'fill-current' : ''} />
            {item.likes}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-xs font-bold text-white/65"
          >
            <Share2 size={16} />
            {item.shares}
          </button>
          <a
            href="#comments"
            className="flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-xs font-bold text-white/65"
          >
            <MessageCircle size={16} />
            {item.comments || 0}
          </a>
          {item.reporterId && item.reporterId !== currentUserId && (
            <button
              onClick={handleFollow}
              disabled={actionLoading}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase ${
                isFollowingMedia ? 'bg-[#19DB8A] text-black' : 'bg-white/10 text-white'
              }`}
            >
              {isFollowingMedia ? <Check size={15} /> : <UserPlus size={15} />}
              {isFollowingMedia ? 'Suivi' : 'Suivre le média'}
            </button>
          )}
        </div>

        {item.detail && (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
            <h3 className="text-white text-xs font-semibold mb-2 uppercase tracking-[0.18em]">
              Description
            </h3>
            <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
              {item.detail}
            </p>
          </div>
        )}

        <section id="comments" className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Commentaires</h3>
              <p className="text-[11px] text-white/35">Réactions sur cet article ou reportage</p>
            </div>
            <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-bold text-white/65">
              {item.comments || 0}
            </span>
          </div>

          <div className="space-y-4">
            {commentsLoading && (
              <p className="text-xs text-white/45">Chargement des commentaires...</p>
            )}
            {!commentsLoading && comments.length === 0 && (
              <p className="text-xs text-white/40">Pas encore de commentaires. Soyez le premier à réagir.</p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                  {comment.userAvatar ? (
                    <img src={comment.userAvatar} alt={comment.userName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60">
                      {comment.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl bg-white/[0.04] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">@{comment.userName}</p>
                        <p className="text-[10px] text-white/28">{comment.createdAt}</p>
                      </div>
                      <button
                        onClick={() => handleLikeComment(comment)}
                        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                          likedComments.has(comment.id)
                            ? 'border-[#19DB8A] text-[#19DB8A]'
                            : 'border-white/15 text-white/45'
                        }`}
                      >
                        <Heart size={11} className={likedComments.has(comment.id) ? 'fill-current' : ''} />
                        {comment.likes}
                      </button>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/75">{comment.text}</p>
                  </div>
                  <button
                    onClick={() => {
                      setReplyingToComment(comment);
                      setReplyText('');
                    }}
                    className="mt-1 px-2 text-[10px] font-bold text-white/40"
                  >
                    Répondre
                  </button>

                  {Boolean(comment.replies?.length) && (
                    <div className="mt-2 space-y-2 border-l border-white/10 pl-3">
                      {(comment.replies || []).map((reply) => (
                        <div key={reply.id} className="rounded-2xl bg-white/[0.035] px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[11px] font-bold text-white/80">@{reply.userName}</span>
                            <span className="text-[9px] text-white/28">{reply.createdAt}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-white/68">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyingToComment?.id === comment.id && (
                    <div className="mt-2 rounded-2xl border border-[#19DB8A]/20 bg-[#19DB8A]/[0.05] p-2">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#19DB8A]">Réponse à @{comment.userName}</span>
                        <button
                          onClick={() => {
                            setReplyingToComment(null);
                            setReplyText('');
                          }}
                          className="text-[10px] text-white/45"
                        >
                          Annuler
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && replyText.trim()) handleSendReply(comment);
                          }}
                          placeholder="Écrire une réponse..."
                          className="min-w-0 flex-1 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
                        />
                        <button
                          onClick={() => handleSendReply(comment)}
                          disabled={!replyText.trim() || sendingReply}
                          className="rounded-full bg-[#19DB8A] px-3 py-1.5 text-[11px] font-bold text-black disabled:opacity-40"
                        >
                          Répondre
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
            <input
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && newComment.trim()) handleSendComment();
              }}
              placeholder="Écrire un commentaire..."
              className="min-w-0 flex-1 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[#19DB8A]"
            />
            <button
              onClick={handleSendComment}
              disabled={!newComment.trim() || commentSending}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#19DB8A] text-black disabled:opacity-40"
              aria-label="Envoyer le commentaire"
            >
              <Send size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportageDetailPage;
