
import React, { useEffect, useState } from 'react';
import { Bell, Heart, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserType, FeedPost, PostComment } from '../../types';
import { fetchVideoFeed } from '../../services/feedService';
import { fetchComments, addComment, likeComment } from '../../services/commentService';
import { followAthlete, unfollowAthlete, isFollowing, getFollowerCount, getFollowing } from '../../services/followService';
import { toggleLikePost, getUserLikedPosts } from '../../services/likeService';
import { shareVideoPost } from '../../services/shareService';
import { IconLike, IconComment, IconShare, IconVolume, IconVolumeMuted } from '../../components/Icons';
import { useAuth } from '../../services/firebase';
import { getFirestoreDb } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { loadAppSettings, SETTINGS_EVENT } from '../../services/appSettingsService';

const HomeChoosePage: React.FC<{ userType: UserType }> = ({ userType }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followerCounts, setFollowerCounts] = useState<Map<string, number>>(new Map());
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [allVideos, setAllVideos] = useState<FeedPost[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [activeCommentsPost, setActiveCommentsPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set());
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [recentlySeenVideos, setRecentlySeenVideos] = useState<Set<string>>(new Set());
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [dataSaverEnabled, setDataSaverEnabled] = useState(false);

  const userId = currentUser?.uid || '';

  useEffect(() => {
    // Charge les vidéos Firebase immédiatement avec l'algorithme
    const loadVideos = async () => {
      try {
        setLoading(true);
        console.log('📹 Chargement rapide des vidéos depuis Firebase...');
        
        // Charger les utilisateurs suivis d'abord
        let followingSet = new Set<string>();
        if (userId) {
          const following = await getFollowing(userId);
          followingSet = new Set(following);
          setFollowingUsers(followingSet);
        }
        
        // Charger les vidéos avec l'algorithme de tri
        const videos = await fetchVideoFeed({
          userId,
          followingUsers: followingSet,
          recentlySeenVideos
        });
        console.log('📹 Vidéos chargées et triées:', videos.length);
        
        if (videos.length > 0) {
          setAllVideos(videos);
          setFeed(videos);
          
          // Charger les états de likes pour l'utilisateur EN ARRIÈRE-PLAN
          if (userId) {
            const docPaths = videos.map(v => v.docPath).filter(Boolean) as string[];
            getUserLikedPosts(userId, docPaths)
              .then(userLikes => {
                setLikedPosts(userLikes);
                console.log('✅ États de likes chargés');
              })
              .catch(err => console.error('Erreur likes:', err));
          }
          
          // Charger les compteurs de followers EN ARRIÈRE-PLAN
          const counts = new Map<string, number>();
          Promise.all(
            videos.map(async (video) => {
              if (video.userId) {
                const count = await getFollowerCount(video.userId);
                counts.set(video.userId, count);
              }
            })
          ).then(() => {
            setFollowerCounts(counts);
            console.log('✅ Compteurs de followers chargés');
          }).catch(err => console.error('Erreur followers:', err));
        } else {
          console.warn('⚠️ Aucune vidéo trouvée dans Firebase');
          setError('Aucune vidéo disponible pour le moment');
        }
      } catch (e) {
        console.error('❌ Erreur chargement vidéos:', e);
        setError('Impossible de charger les vidéos');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideos();
  }, [userId]);

  // Charger les données de l'utilisateur connecté
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!userId) return;
      
      try {
        const db = getFirestoreDb();
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      }
    };
    
    loadCurrentUser();
  }, [userId]);

  // Filtrer le feed selon l'onglet actif
  useEffect(() => {
    if (activeTab === 'all') {
      setFeed(allVideos);
    } else {
      // Filtrer uniquement les vidéos des utilisateurs suivis
      const filteredVideos = allVideos.filter(video => 
        followingUsers.has(video.userId)
      );
      setFeed(filteredVideos);
    }
  }, [activeTab, allVideos, followingUsers]);

  // Charger les réglages applicatifs qui impactent le feed
  useEffect(() => {
    const applySettings = () => {
      const appSettings = loadAppSettings();
      setAutoplayEnabled(appSettings.autoplayVideos);
      setDataSaverEnabled(appSettings.dataSaver);
      if (appSettings.dataSaver) {
        setIsMuted(true);
      }
    };

    applySettings();
    window.addEventListener(SETTINGS_EVENT, applySettings as EventListener);
    window.addEventListener('storage', applySettings);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, applySettings as EventListener);
      window.removeEventListener('storage', applySettings);
    };
  }, []);

  const toggleLike = async (post: FeedPost) => {
    if (!userId) {
      alert('Veuillez vous connecter pour liker');
      return;
    }
    
    if (!post.docPath) {
      console.warn('Pas de docPath pour ce post');
      return;
    }
    
    const isLiked = likedPosts.has(post.docPath);
    
    // Mise à jour optimiste de l'UI
    const newLiked = new Set(likedPosts);
    if (isLiked) {
      newLiked.delete(post.docPath);
    } else {
      newLiked.add(post.docPath);
    }
    setLikedPosts(newLiked);
    
    // Mise à jour optimiste du compteur dans le feed
    setFeed(prevFeed => 
      prevFeed.map(p => 
        p.id === post.id 
          ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
          : p
      )
    );
    
    // Envoyer la requête en arrière-plan
    try {
      await toggleLikePost(post.docPath, userId, isLiked);
      console.log('✅ Like mis à jour');
    } catch (error) {
      console.error('❌ Erreur toggle like:', error);
      
      // Rollback en cas d'erreur
      const rollbackLiked = new Set(likedPosts);
      if (!isLiked) {
        rollbackLiked.delete(post.docPath);
      } else {
        rollbackLiked.add(post.docPath);
      }
      setLikedPosts(rollbackLiked);
      
      setFeed(prevFeed => 
        prevFeed.map(p => 
          p.id === post.id 
            ? { ...p, likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1) }
            : p
        )
      );
    }
  };

  const getSportFromPost = (post: FeedPost): string => {
    // Essayer d'extraire le sport des hashtags
    if (post.hashtags && post.hashtags.length > 0) {
      const sportTags = ['Football', 'Basketball', 'Tennis', 'Volleyball', 'Cyclisme', 'Athlétisme', 'Natation'];
      const foundSport = post.hashtags.find(tag => 
        sportTags.some(sport => tag.toLowerCase().includes(sport.toLowerCase()))
      );
      if (foundSport) return foundSport;
    }
    return 'Talent';
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleFollowToggle = async (post: FeedPost) => {
    if (!userId) {
      alert('Veuillez vous connecter pour suivre des athlètes');
      return;
    }

    setFollowingLoading((prev) => new Set(prev).add(post.userId));

    try {
      const isCurrentlyFollowing = followingUsers.has(post.userId);

      // Mise à jour optimiste
      if (isCurrentlyFollowing) {
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(post.userId);
          return newSet;
        });
        
        // Décrémenter le compteur
        setFollowerCounts(prev => {
          const newMap = new Map(prev);
          const currentCount = (newMap.get(post.userId) || 0) as number;
          newMap.set(post.userId, Math.max(0, currentCount - 1));
          return newMap;
        });
        
        await unfollowAthlete(userId, post.userId);
      } else {
        setFollowingUsers((prev) => new Set(prev).add(post.userId));
        
        // Incrémenter le compteur
        setFollowerCounts(prev => {
          const newMap = new Map(prev);
          const currentCount = (newMap.get(post.userId) || 0) as number;
          newMap.set(post.userId, currentCount + 1);
          return newMap;
        });
        
        await followAthlete(userId, post.userId);
      }
      
      console.log('✅ Suivi mis à jour');
    } catch (e) {
      console.error('Erreur lors du suivi:', e);
      
      // Rollback en cas d'erreur
      const isCurrentlyFollowing = followingUsers.has(post.userId);
      if (!isCurrentlyFollowing) {
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(post.userId);
          return newSet;
        });
        
        setFollowerCounts(prev => {
          const newMap = new Map(prev);
          const currentCount = (newMap.get(post.userId) || 0) as number;
          newMap.set(post.userId, Math.max(0, currentCount - 1));
          return newMap;
        });
      } else {
        setFollowingUsers((prev) => new Set(prev).add(post.userId));
        
        setFollowerCounts(prev => {
          const newMap = new Map(prev);
          const currentCount = (newMap.get(post.userId) || 0) as number;
          newMap.set(post.userId, currentCount + 1);
          return newMap;
        });
      }
      
      alert('Erreur lors de la mise à jour du suivi');
    } finally {
      setFollowingLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(post.userId);
        return newSet;
      });
    }
  };

  const openComments = async (post: FeedPost) => {
    setActiveCommentsPost(post);
    setComments([]);
    setCommentsLoading(true);
    try {
      if (!post.docPath) {
        setComments([]);
      } else {
        const list = await fetchComments(post.docPath);
        setComments(list);
      }
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setActiveCommentsPost(null);
    setComments([]);
  };

  const handleSendComment = async () => {
    if (!activeCommentsPost || !newComment.trim()) return;
    if (!activeCommentsPost.docPath) return;

    const optimistic: PostComment = {
      id: `local-${Date.now()}`,
      userId: userId || 'anonymous',
      userName: currentUserData?.displayName || currentUser?.displayName || 'Utilisateur',
      userAvatar: currentUserData?.avatarUrl || currentUser?.photoURL || '/assets/images/app_launcher_icon.png',
      text: newComment.trim(),
      createdAt: new Date().toLocaleString(),
      likes: 0
    };

    setComments((prev) => [...prev, optimistic]);
    setNewComment('');

    try {
      await addComment({
        docPath: activeCommentsPost.docPath,
        userId: optimistic.userId,
        userName: optimistic.userName,
        userAvatar: optimistic.userAvatar,
        text: optimistic.text
      });

      // Met à jour le compteur localement pour le post actif
      setFeed((prev) =>
        prev.map((p) =>
          p.id === activeCommentsPost.id ? { ...p, comments: p.comments + 1 } : p
        )
      );
    } catch (e) {
      // Si l'envoi échoue, on retire le commentaire optimiste
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      alert("Impossible d'envoyer le commentaire pour le moment.");
    }
  };

  const handleShare = async (post: FeedPost) => {
    try {
      await shareVideoPost(
        post.id,
        post.userName,
        post.caption,
        post.url,
        post.thumbnail,
        post.hashtags || []
      );
      
      // Incrémenter le compteur de partages
      setFeed(prevFeed => 
        prevFeed.map(p => 
          p.id === post.id 
            ? { ...p, shares: p.shares + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleLikeComment = async (comment: PostComment) => {
    if (!activeCommentsPost?.docPath) return;
    if (likedComments.has(comment.id)) return; // éviter plusieurs likes locaux sur le même commentaire

    setLikedComments((prev) => new Set(prev).add(comment.id));
    // Optimiste : +1 en local
    setComments((prev) =>
      prev.map((c) => (c.id === comment.id ? { ...c, likes: c.likes + 1 } : c))
    );

    try {
      await likeComment({ docPath: activeCommentsPost.docPath, commentId: comment.id });
    } catch {
      // rollback si erreur
      setLikedComments((prev) => {
        const copy = new Set(prev);
        copy.delete(comment.id);
        return copy;
      });
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, likes: Math.max(0, c.likes - 1) } : c))
      );
    }
  };

  const openAthleteProfile = (post: FeedPost) => {
    if (!post.userId) return;
    navigate(`/athlete/${post.userId}`);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#050505] overflow-hidden">
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-between items-center pointer-events-none bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="flex gap-2 pointer-events-auto bg-black/40 rounded-full px-1 py-1 border border-white/10 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('all')}
            className={`text-xs md:text-sm font-readex font-semibold tracking-tight px-2 md:px-3 py-1 rounded-full transition-all ${
              activeTab === 'all' 
                ? 'text-white bg-[#208050]' 
                : 'text-white/40'
            }`}
          >
            #ChooseTalent
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={`text-xs md:text-sm font-readex font-semibold tracking-tight px-2 md:px-3 py-1 rounded-full transition-all ${
              activeTab === 'following' 
                ? 'text-white bg-[#208050]' 
                : 'text-white/40'
            }`}
          >
            Abonnements
          </button>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button className="p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10 text-white">
            <Bell size={18} />
          </button>
          <div className="w-9 h-9 rounded-full border-2 border-[#19DB8A] overflow-hidden bg-white/10">
            <img 
              src={currentUserData?.avatarUrl || currentUser?.photoURL || '/assets/images/app_launcher_icon.png'} 
              alt="Me" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </header>

      {/* Vertical Performance Feed */}
      <div 
        className="flex-1 w-full overflow-y-scroll snap-y snap-mandatory custom-scrollbar pt-16 pb-20"
        onScroll={(e) => {
          const container = e.currentTarget;
          const scrollTop = container.scrollTop;
          const containerHeight = container.clientHeight;
          const currentVideoIndex = Math.round(scrollTop / containerHeight);
          
          // Tracker les vidéos vues
          if (feed[currentVideoIndex]) {
            setRecentlySeenVideos(prev => new Set(prev).add(feed[currentVideoIndex].id));
            
            // Jouer la vidéo visible et mettre en pause les autres
            feed.forEach((_, index) => {
              const video = document.getElementById(`video-${index}`) as HTMLVideoElement;
              if (video) {
                if (index === currentVideoIndex && autoplayEnabled) {
                  video.play().catch(e => console.log('Autoplay prevented:', e));
                } else {
                  video.pause();
                  video.currentTime = 0;
                }
              }
            });
          }
        }}
      >
        {loading && (
          <div className="w-full h-screen flex flex-col items-center justify-center bg-[#050505]">
            {/* Logo Choose Me animé en chargement - rogné en cercle */}
            <div className="relative w-32 h-32 mb-6 rounded-full overflow-hidden bg-white/5 border-4 border-[#19DB8A]/30 shadow-2xl">
              <img 
                src="/assets/images/app_launcher_icon.png" 
                alt="Choose Me" 
                className="w-full h-full object-cover animate-pulse"
              />
            </div>
            <p className="text-white/60 text-sm">Chargement des vidéos...</p>
          </div>
        )}
        {!loading && error && (
          <div className="w-full h-screen flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📹</span>
              </div>
              <p className="text-white/60 text-sm mb-2">{error}</p>
              <p className="text-white/40 text-xs">
                Vérifiez votre connexion ou réessayez plus tard
              </p>
            </div>
          </div>
        )}
        {!loading && !error && feed.length === 0 && (
          <div className="w-full h-screen flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎬</span>
              </div>
              <p className="text-white/60 text-sm mb-2">
                {activeTab === 'following' 
                  ? 'Aucune vidéo de vos abonnements' 
                  : 'Aucune vidéo disponible'}
              </p>
              <p className="text-white/40 text-xs">
                {activeTab === 'following'
                  ? 'Suivez des talents pour voir leurs vidéos ici'
                  : 'Les vidéos apparaîtront ici bientôt'}
              </p>
            </div>
          </div>
        )}
        {!loading && !error && feed.map((post, index) => (
          <div key={`${post.id}-${post.docPath}-${index}`} className="relative w-full h-screen snap-start overflow-hidden flex-shrink-0">
            {/* Vidéo HTML5 en plein écran - lecture automatique sans poster */}
            <video
              id={`video-${index}`}
              src={post.url}
              className="w-full h-full object-cover"
              autoPlay={autoplayEnabled && index === 0}
              muted={isMuted}
              loop
              playsInline
              preload={dataSaverEnabled ? 'none' : 'metadata'}
              onPlay={() => {
                // Mettre en pause toutes les autres vidéos
                feed.forEach((_, i) => {
                  if (i !== index) {
                    const otherVideo = document.getElementById(`video-${i}`) as HTMLVideoElement;
                    if (otherVideo) {
                      otherVideo.pause();
                      otherVideo.currentTime = 0;
                    }
                  }
                });
              }}
            />

            {/* Gradient overlay pour meilleure lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

            {/* Interactions Bar */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-4 items-center z-20">
              {/* Mute / Unmute audio */}
              <button
                onClick={toggleMute}
                className="flex flex-col items-center"
              >
                <div className="p-3.5 rounded-full bg-black/30 backdrop-blur-md text-white hover:text-[#19DB8A] transition-all">
                  {isMuted ? <IconVolumeMuted size={36} /> : <IconVolume size={36} />}
                </div>
              </button>

              {/* Follow Button */}
              <button
                onClick={() => handleFollowToggle(post)}
                disabled={followingLoading.has(post.userId)}
                className="flex flex-col items-center group"
              >
                <div className={`p-3.5 rounded-full backdrop-blur-md transition-all ${
                  followingUsers.has(post.userId)
                    ? 'bg-[#19DB8A]/20 text-[#19DB8A]'
                    : 'bg-black/30 text-white hover:bg-[#19DB8A]/20 hover:text-[#19DB8A]'
                } ${followingLoading.has(post.userId) ? 'opacity-50' : ''}`}>
                  {followingUsers.has(post.userId) ? (
                    <UserCheck size={36} />
                  ) : (
                    <UserPlus size={36} />
                  )}
                </div>
                {followerCounts.has(post.userId) && (
                  <span className="text-white text-xs font-bold mt-1.5">
                    {followerCounts.get(post.userId)}
                  </span>
                )}
              </button>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => openAthleteProfile(post)}
                  className="w-14 h-14 rounded-full border-2 border-white overflow-hidden shadow-lg"
                >
                  <img 
                    src={post.userAvatar || '/assets/images/app_launcher_icon.png'} 
                    alt={post.userName}
                    className="w-full h-full object-cover" 
                  />
                </button>
                <div className="bg-[#19DB8A] rounded-full p-0.5 -mt-2.5 relative z-10 border-2 border-black">
                  <PlusCircle size={12} className="text-white" />
                </div>
              </div>

              <button 
                onClick={() => toggleLike(post)}
                className="flex flex-col items-center group"
              >
                <div className={`p-3.5 rounded-full bg-black/30 backdrop-blur-md transition-all ${
                  post.docPath && likedPosts.has(post.docPath) 
                    ? 'text-[#FF4B5C] scale-110' 
                    : 'text-white hover:text-[#FF4B5C]'
                }`}>
                  <IconLike size={36} />
                </div>
                <span className="text-white text-xs font-bold mt-1.5 h-5">
                  {typeof post.likes === 'number' ? post.likes : 0}
                </span>
              </button>

              <button
                className="flex flex-col items-center group"
                onClick={() => openComments(post)}
              >
                <div className="p-3.5 rounded-full bg-black/30 backdrop-blur-md text-white hover:text-[#19DB8A] transition-all">
                  <IconComment size={36} />
                </div>
                <span className="text-white text-xs font-bold mt-1.5">{post.comments || 0}</span>
              </button>

              <button 
                onClick={() => handleShare(post)}
                className="flex flex-col items-center group"
              >
                <div className="p-3.5 rounded-full bg-black/30 backdrop-blur-md text-white hover:text-[#19DB8A] transition-all">
                  <IconShare size={36} />
                </div>
                <span className="text-white text-xs font-bold mt-1.5">{post.shares || 0}</span>
              </button>
            </div>

            {/* Post Info */}
            <div className="absolute left-4 right-20 bottom-32 z-20">
              <button
                onClick={() => openAthleteProfile(post)}
                className="text-white font-bold text-sm mb-1 flex items-center gap-2 line-clamp-1"
              >
                @{post.userName}
                <span className="bg-[#208050] text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">
                  {getSportFromPost(post)}
                </span>
              </button>
              <p className="text-white/90 text-xs leading-tight line-clamp-2 mb-2">
                {post.caption}
              </p>
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {post.hashtags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[#19DB8A] text-[10px] font-medium"
                    >
                      #{tag.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overlay commentaires */}
      {activeCommentsPost && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-end justify-center">
          {/* On remonte nettement le panneau pour éviter toute superposition avec la bottom bar */}
          <div className="w-full max-w-md bg-[#050505] rounded-t-3xl p-4 border-t border-white/10 mb-20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold text-sm">
                Commentaires sur la vidéo de @{activeCommentsPost.userName}
              </h4>
              <button
                onClick={closeComments}
                className="text-white/60 text-xs px-2 py-1 rounded-full border border-white/20"
              >
                Fermer
              </button>
            </div>
            {/* Liste des commentaires */}
            <div className="h-36 overflow-y-auto custom-scrollbar space-y-3 mb-4">
              {commentsLoading && (
                <p className="text-white/50 text-xs">Chargement des commentaires...</p>
              )}
              {!commentsLoading && comments.length === 0 && (
                <p className="text-white/40 text-xs">
                  Pas encore de commentaires. Soyez le premier à réagir !
                </p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                    {c.userAvatar ? (
                      <img src={c.userAvatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                        {c.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white text-xs font-semibold">@{c.userName}</span>
                        <span className="text-white/30 text-[10px]">{c.createdAt}</span>
                      </div>
                      <button
                        onClick={() => handleLikeComment(c)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                          likedComments.has(c.id)
                            ? 'border-[#19DB8A] text-[#19DB8A]'
                            : 'border-white/20 text-white/60'
                        } text-[10px]`}
                      >
                        <Heart
                          size={12}
                          className={likedComments.has(c.id) ? 'fill-current' : ''}
                        />
                        <span>{c.likes}</span>
                      </button>
                    </div>
                    <p className="text-white/80 text-xs mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Champ de saisie bien détaché de la barre de navigation */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrire un commentaire..."
                className="flex-1 bg-black/40 border border-white/15 rounded-full px-3 py-1.5 text-xs text-white outline-none"
              />
              <button
                onClick={handleSendComment}
                disabled={!newComment.trim() || !activeCommentsPost?.docPath}
                className="px-3 py-1.5 bg-[#19DB8A] rounded-full text-xs font-semibold text-black disabled:opacity-40"
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

// Internal Helper
const PlusCircle = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default HomeChoosePage;
