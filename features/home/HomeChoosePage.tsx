
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
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());

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
          setVideoErrors(new Set());
          
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
    <div className="relative flex h-full min-h-[100dvh] w-full flex-col overflow-hidden bg-[#050505]">
      {/* Dynamic Header */}
      <header className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between gap-3 border-b border-white/10 bg-black/55 px-3 pt-3 pb-2 pointer-events-none shadow-[0_14px_34px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        <div className="pointer-events-auto flex min-w-0 flex-1 gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1 backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-tight transition-all ${
              activeTab === 'all' 
                ? 'bg-[#19DB8A] text-black shadow-[0_8px_20px_rgba(25,219,138,0.25)]' 
                : 'text-white/55 hover:text-white'
            }`}
          >
            #ChooseTalent
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-tight transition-all ${
              activeTab === 'following' 
                ? 'bg-[#19DB8A] text-black shadow-[0_8px_20px_rgba(25,219,138,0.25)]' 
                : 'text-white/55 hover:text-white'
            }`}
          >
            Abonnements
          </button>
        </div>
        <div className="flex shrink-0 gap-2 pointer-events-auto">
          <button
            onClick={toggleMute}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white backdrop-blur-xl transition-colors hover:text-[#19DB8A]"
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <IconVolumeMuted size={20} /> : <IconVolume size={20} />}
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white backdrop-blur-xl">
            <Bell size={17} />
          </button>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#19DB8A] bg-white/10 shadow-[0_0_0_4px_rgba(25,219,138,0.1)]">
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
        className="custom-scrollbar h-full w-full flex-1 snap-y snap-mandatory overflow-y-scroll"
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
          <div key={`${post.id}-${post.docPath}-${index}`} className="relative h-[100dvh] w-full flex-shrink-0 snap-start overflow-hidden bg-black">
            {/* Vidéo HTML5 en plein écran - lecture automatique sans poster */}
            <video
              id={`video-${index}`}
              src={post.url}
              poster={post.thumbnail || post.userAvatar || '/assets/images/app_launcher_icon.png'}
              className="w-full h-full object-cover"
              autoPlay={autoplayEnabled && index === 0}
              muted={isMuted}
              loop
              playsInline
              preload={dataSaverEnabled ? 'none' : 'metadata'}
              onError={(event) => {
                const video = event.currentTarget;
                console.warn('Lecture vidéo impossible:', {
                  id: post.id,
                  url: post.url,
                  networkState: video.networkState,
                  readyState: video.readyState,
                  errorCode: video.error?.code,
                  errorMessage: video.error?.message
                });
                setVideoErrors((prev) => new Set(prev).add(post.id));
              }}
              onLoadedData={() => {
                setVideoErrors((prev) => {
                  if (!prev.has(post.id)) return prev;
                  const next = new Set(prev);
                  next.delete(post.id);
                  return next;
                });
              }}
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

            {videoErrors.has(post.id) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 px-6 text-center">
                <div className="max-w-xs rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <span className="text-2xl">📹</span>
                  </div>
                  <p className="text-sm font-bold text-white">Vidéo indisponible</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">
                    Le fichier vidéo ne peut pas être chargé depuis le stockage pour le moment.
                  </p>
                </div>
              </div>
            )}

            {/* Gradient overlay pour meilleure lisibilité */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/80" />

            {/* Interactions Bar */}
            <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-3">
              {/* Follow Button */}
              <button
                onClick={() => handleFollowToggle(post)}
                disabled={followingLoading.has(post.userId)}
                className="group flex flex-col items-center"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all ${
                  followingUsers.has(post.userId)
                    ? 'bg-[#19DB8A] text-black'
                    : 'bg-black/45 text-white hover:bg-[#19DB8A]/20 hover:text-[#19DB8A]'
                } ${followingLoading.has(post.userId) ? 'opacity-50' : ''}`}>
                  {followingUsers.has(post.userId) ? (
                    <UserCheck size={25} />
                  ) : (
                    <UserPlus size={25} />
                  )}
                </div>
                {followerCounts.has(post.userId) && (
                  <span className="mt-1 text-[11px] font-extrabold text-white drop-shadow">
                    {followerCounts.get(post.userId)}
                  </span>
                )}
              </button>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => openAthleteProfile(post)}
                  className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/90 bg-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
                >
                  <img 
                    src={post.userAvatar || '/assets/images/app_launcher_icon.png'} 
                    alt={post.userName}
                    className="w-full h-full object-cover" 
                    onError={(event) => {
                      event.currentTarget.src = '/assets/images/app_launcher_icon.png';
                    }}
                  />
                </button>
                <div className="relative z-10 -mt-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[#19DB8A]">
                  <PlusCircle size={12} className="text-black" />
                </div>
              </div>

              <button 
                onClick={() => toggleLike(post)}
                className="group flex flex-col items-center"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/45 shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all ${
                  post.docPath && likedPosts.has(post.docPath) 
                    ? 'text-[#FF4B5C] scale-110' 
                    : 'text-white hover:text-[#FF4B5C]'
                }`}>
                  <IconLike size={25} />
                </div>
                <span className="mt-1 h-4 text-[11px] font-extrabold text-white drop-shadow">
                  {typeof post.likes === 'number' ? post.likes : 0}
                </span>
              </button>

              <button
                className="group flex flex-col items-center"
                onClick={() => openComments(post)}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:text-[#19DB8A]">
                  <IconComment size={25} />
                </div>
                <span className="mt-1 h-4 text-[11px] font-extrabold text-white drop-shadow">{post.comments || 0}</span>
              </button>

              <button 
                onClick={() => handleShare(post)}
                className="group flex flex-col items-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:text-[#19DB8A]">
                  <IconShare size={25} />
                </div>
                <span className="mt-1 h-4 text-[11px] font-extrabold text-white drop-shadow">{post.shares || 0}</span>
              </button>
            </div>

            {/* Post Info */}
            <div className="absolute left-4 right-20 bottom-32 z-20 rounded-2xl bg-gradient-to-r from-black/45 via-black/20 to-transparent p-3 backdrop-blur-[2px]">
              <button
                onClick={() => openAthleteProfile(post)}
                className="mb-1 flex max-w-full items-center gap-2 text-sm font-extrabold text-white drop-shadow"
              >
                <span className="truncate">@{post.userName}</span>
                <span className="flex-shrink-0 rounded-full bg-[#19DB8A]/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-black">
                  {getSportFromPost(post)}
                </span>
              </button>
              <p className="mb-2 line-clamp-2 text-xs leading-snug text-white/85 drop-shadow">
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
