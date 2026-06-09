
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, MapPin, Share2, Award, Activity, BrainCircuit, Trophy, MessageSquare, UserPlus, Check, AlertCircle, Users, Plus, LogOut, Settings, Trash2, Save, X, Newspaper, FileText, PlayCircle, ImagePlus } from 'lucide-react';
import { UserProfile, UserType } from '../../types';
import Button from '../../components/Button';
import CustomVideoPlayer from '../../components/CustomVideoPlayer';
import { getTalentInsight } from '../../services/geminiService';
import { getFollowers, getFollowing } from '../../services/followService';
import { deletePerformanceVideo, listenToPerformanceVideos, updatePerformanceVideo } from '../../services/performanceService';
import { PRESS_CONTENT_CATEGORIES, deletePressContent, fetchReportages, updatePressContent, type PressContentKind, type ReportageItem } from '../../services/reportageService';
import { shareProfile, sharePerformanceVideo } from '../../services/shareService';
import { getFirebaseAuth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

type PressEditState = {
  id: string;
  title: string;
  detail: string;
  category: string;
  kind: PressContentKind;
  mediaFile: File | null;
  removeMedia: boolean;
};

const ProfileViewPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const navigate = useNavigate();
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [performanceVideos, setPerformanceVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [pressItems, setPressItems] = useState<ReportageItem[]>([]);
  const [loadingPressItems, setLoadingPressItems] = useState(false);
  const [editingVideo, setEditingVideo] = useState<{ id: string; title: string; caption: string } | null>(null);
  const [videoActionLoading, setVideoActionLoading] = useState<string | null>(null);
  const [videoActionError, setVideoActionError] = useState<string | null>(null);
  const [editingPressItem, setEditingPressItem] = useState<PressEditState | null>(null);
  const [pressMediaPreview, setPressMediaPreview] = useState('');
  const [pressActionLoading, setPressActionLoading] = useState<string | null>(null);
  const [pressActionError, setPressActionError] = useState<string | null>(null);

  // Pour l'instant, on considère que la page affiche toujours le profil connecté
  const viewerType = user.type;
  const isOwnProfile = true;
  const isRecruiterView = viewerType === UserType.RECRUITER || viewerType === UserType.CLUB;
  const isAthleteAccount = user.type === UserType.ATHLETE;
  const isPressAccount = user.type === UserType.PRESS;

  // Check for missing fields
  const missingFields = [];
  if (!user.country || user.country.trim() === '') missingFields.push('Pays');
  if (isAthleteAccount) {
    if (!user.sport || user.sport.trim() === '') missingFields.push('Sport');
    if (!user.position || user.position.trim() === '') missingFields.push('Poste');
  }
  if (!user.avatarUrl || user.avatarUrl.trim() === '') missingFields.push('Photo de profil');

  console.log('🔍 Vérification profil:', {
    country: user.country,
    sport: user.sport,
    position: user.position,
    avatarUrl: user.avatarUrl,
    type: user.type,
    missingFields
  });

  useEffect(() => {
    const loadInsight = async () => {
      setLoadingInsight(true);
      const res = await getTalentInsight(user.displayName, user.stats);
      setInsight(res || null);
      setLoadingInsight(false);
    };
    if (isAthleteAccount) loadInsight();
  }, [user]);

  // Charger les statistiques de suivi
  useEffect(() => {
    const loadFollowStats = async () => {
      try {
        setLoadingStats(true);
        console.log('📊 Chargement stats pour:', user.uid);

        const followersList = await getFollowers(user.uid);
        const followingList = await getFollowing(user.uid);

        console.log('📊 Followers:', followersList);
        console.log('📊 Following:', followingList);

        setFollowers(followersList.length);
        setFollowing(followingList.length);

        console.log('📊 Stats chargées - Followers:', followersList.length, 'Following:', followingList.length);
      } catch (e) {
        console.error('❌ Erreur chargement stats suivi:', e);
        // Mettre à 0 en cas d'erreur
        setFollowers(0);
        setFollowing(0);
      } finally {
        setLoadingStats(false);
      }
    };
    loadFollowStats();
  }, [user.uid]);

  // Charger les vidéos de performance automatiquement
  useEffect(() => {
    if (!isAthleteAccount) {
      setPerformanceVideos([]);
      setLoadingVideos(false);
      return;
    }

    console.log('🎬 Mise en place écoute vidéos pour:', user.uid);

    const unsubscribe = listenToPerformanceVideos(user.uid, (videos) => {
      console.log('🎬 Vidéos reçues:', videos.length);
      setPerformanceVideos(videos);
      setLoadingVideos(false);
    });

    return () => unsubscribe();
  }, [user.uid, isAthleteAccount]);

  useEffect(() => {
    if (!isPressAccount) {
      setPressItems([]);
      setLoadingPressItems(false);
      return;
    }

    const loadPressItems = async () => {
      setLoadingPressItems(true);
      try {
        const items = await fetchReportages();
        const ownItems = items.filter((item) => item.reporterId === user.uid || item.reporter === user.displayName);
        setPressItems(ownItems);
      } finally {
        setLoadingPressItems(false);
      }
    };

    void loadPressItems();
  }, [isPressAccount, user.displayName, user.uid]);

  useEffect(() => {
    if (!editingPressItem?.mediaFile) {
      setPressMediaPreview('');
      return;
    }

    const nextPreview = URL.createObjectURL(editingPressItem.mediaFile);
    setPressMediaPreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [editingPressItem?.mediaFile]);

  // Fonction de partage du profil
  const handleShareProfile = () => {
    shareProfile(user.displayName, user.uid, user.type, user.stats);
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      console.log('✅ Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    }
  };

  const handleStartEditVideo = (video: any) => {
    if (!video.id) return;
    setVideoActionError(null);
    setEditingVideo({
      id: video.id,
      title: video.title || '',
      caption: video.caption || ''
    });
  };

  const handleSaveVideo = async () => {
    if (!editingVideo) return;
    setVideoActionLoading(editingVideo.id);
    setVideoActionError(null);

    try {
      await updatePerformanceVideo(user.uid, editingVideo.id, {
        title: editingVideo.title,
        caption: editingVideo.caption
      });
      setEditingVideo(null);
    } catch (error) {
      console.error(error);
      setVideoActionError('Impossible de modifier la vidéo pour le moment.');
    } finally {
      setVideoActionLoading(null);
    }
  };

  const handleDeleteVideo = async (video: any) => {
    if (!video.id) return;
    const confirmed = window.confirm('Supprimer définitivement cette vidéo ?');
    if (!confirmed) return;

    setVideoActionLoading(video.id);
    setVideoActionError(null);

    try {
      await deletePerformanceVideo(user.uid, video.id);
      if (editingVideo?.id === video.id) {
        setEditingVideo(null);
      }
    } catch (error) {
      console.error(error);
      setVideoActionError('Impossible de supprimer la vidéo pour le moment.');
    } finally {
      setVideoActionLoading(null);
    }
  };

  const handleStartEditPressItem = (item: ReportageItem) => {
    setPressActionError(null);
    setEditingPressItem({
      id: item.id,
      title: item.title || '',
      detail: item.detail || '',
      category: item.category || 'Sport',
      kind: item.kind || 'reportage',
      mediaFile: null,
      removeMedia: false
    });
  };

  const handlePressMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setPressActionError(null);

    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setPressActionError('Ajoutez une photo ou une vidéo.');
      event.target.value = '';
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setPressActionError('Le média ne doit pas dépasser 500MB.');
      event.target.value = '';
      return;
    }

    setEditingPressItem((prev) => prev ? { ...prev, mediaFile: file, removeMedia: false } : prev);
  };

  const handleSavePressItem = async (item: ReportageItem) => {
    if (!editingPressItem || editingPressItem.id !== item.id) return;

    if (!editingPressItem.title.trim()) {
      setPressActionError('Ajoutez un titre.');
      return;
    }

    if (!editingPressItem.detail.trim()) {
      setPressActionError('Ajoutez le texte ou la description.');
      return;
    }

    setPressActionLoading(item.id);
    setPressActionError(null);

    try {
      await updatePressContent({
        item,
        authorId: user.uid,
        title: editingPressItem.title,
        detail: editingPressItem.detail,
        kind: editingPressItem.kind,
        category: editingPressItem.category,
        mediaFile: editingPressItem.mediaFile,
        removeMedia: editingPressItem.removeMedia
      });

      const items = await fetchReportages();
      setPressItems(items.filter((entry) => entry.reporterId === user.uid || entry.reporter === user.displayName));
      setEditingPressItem(null);
    } catch (error) {
      console.error(error);
      setPressActionError('Impossible de modifier cette publication pour le moment.');
    } finally {
      setPressActionLoading(null);
    }
  };

  const handleDeletePressItem = async (item: ReportageItem) => {
    const confirmed = window.confirm('Supprimer définitivement cette publication presse ?');
    if (!confirmed) return;

    setPressActionLoading(item.id);
    setPressActionError(null);

    try {
      await deletePressContent(item);
      setPressItems((prev) => prev.filter((entry) => entry.id !== item.id));
      if (editingPressItem?.id === item.id) {
        setEditingPressItem(null);
      }
    } catch (error) {
      console.error(error);
      setPressActionError('Impossible de supprimer cette publication pour le moment.');
    } finally {
      setPressActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header Overlay */}
      <div className="h-56 bg-gradient-to-br from-[#208050] to-[#0A0A0A] relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 blur-[100px] rounded-full" />

        <div className="absolute top-12 left-6 right-6 flex justify-between z-10">
          <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md">
             <ChevronLeft size={24} />
          </button>
          <div className="flex gap-3">
             <button
               onClick={handleShareProfile}
               className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md hover:bg-black/30 transition-colors"
             >
                <Share2 size={20} />
             </button>
             {isOwnProfile && (
               <button
                 onClick={() => navigate('/settings')}
                 className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md hover:bg-black/30 transition-colors"
               >
                 <Settings size={20} />
               </button>
             )}
             {isOwnProfile && (
               <button onClick={() => navigate('/profile/edit')} className="p-2 bg-[#19DB8A] rounded-full text-white shadow-lg shadow-green-900/40">
                  <Edit2 size={20} />
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 -mt-16 pb-32 relative z-20">
        {/* Missing Fields Alert */}
        {missingFields.length > 0 && isOwnProfile && (
          <div className="bg-[#FF8A3C]/10 border border-[#FF8A3C]/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-[#FF8A3C] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[#FF8A3C] text-sm font-semibold mb-1">Complétez votre profil</p>
              <p className="text-white/60 text-xs">Informations manquantes: {missingFields.join(', ')}</p>
              <button
                onClick={() => navigate('/profile/edit')}
                className="text-[#FF8A3C] text-xs font-bold mt-2 hover:underline"
              >
                Compléter maintenant →
              </button>
            </div>
          </div>
        )}

        {/* Avatar & Basic Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <img
              src={user.avatarUrl || 'https://via.placeholder.com/144?text=No+Photo'}
              className="w-36 h-36 rounded-[2.8rem] border-8 border-[#050505] shadow-2xl object-cover"
              alt={user.displayName}
            />
            <div className="absolute -bottom-1 -right-1 bg-[#19DB8A] p-2.5 rounded-2xl border-4 border-[#050505] shadow-lg">
               {isPressAccount ? <Newspaper size={20} className="text-white" /> : <Award size={20} className="text-white" />}
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-readex font-bold text-white text-center flex items-center gap-2">
            {user.displayName || 'Utilisateur'}
            <div className="w-5 h-5 bg-[#19DB8A] rounded-full flex items-center justify-center p-1">
               <Check size={12} strokeWidth={4} className="text-black" />
            </div>
          </h1>
          <div className="flex items-center gap-1 text-white/40 text-sm mt-1">
            <MapPin size={14} />
            <span>{user.country || 'Pays non défini'}</span>
            {user.city && (
              <>
                <span className="mx-2">•</span>
                <span>{user.city}</span>
              </>
            )}
            <span className="mx-2">•</span>
            <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-[#19DB8A]">
              {isPressAccount ? 'Presse / Média' : user.type}
            </span>
          </div>
        </div>

        {/* Follow Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard
            icon={<Users size={18} />}
            label="Abonnés"
            value={loadingStats ? '...' : followers}
            isEmpty={!loadingStats && followers === 0}
          />
          <StatCard
            icon={<Users size={18} className="text-[#FF8A3C]" />}
            label="Suivis"
            value={loadingStats ? '...' : following}
            isEmpty={!loadingStats && following === 0}
          />
          <StatCard
            icon={isPressAccount ? <Newspaper size={18} className="text-[#19DB8A]" /> : <Trophy size={18} className="text-[#19DB8A]" />}
            label={isPressAccount ? 'Publications' : 'Profil'}
            value={isPressAccount ? (loadingPressItems ? '...' : pressItems.length) : user.type.charAt(0).toUpperCase() + user.type.slice(1)}
            isText={!isPressAccount}
            isEmpty={isPressAccount && !loadingPressItems && pressItems.length === 0}
          />
        </div>

        {/* Dynamic Action Buttons based on Role */}
        {!isOwnProfile && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button
              onClick={() => setIsFollowing(!isFollowing)}
              variant={isFollowing ? 'secondary' : 'primary'}
              className="py-4"
            >
              {isFollowing ? 'Suivi' : <><UserPlus size={18} /> Suivre</>}
            </Button>

            {isRecruiterView ? (
              <Button className="py-4 bg-[#FF8A3C] border-[#FF8A3C] hover:bg-[#FF8A3C]/80">
                <MessageSquare size={18} /> Contacter
              </Button>
            ) : (
              <Button variant="secondary" className="py-4">Message</Button>
            )}
          </div>
        )}

        {/* AI Scouting Report (Only for Athletes) */}
        {isAthleteAccount && (
           <div className="bg-[#0A0A0A] border border-[#19DB8A]/20 rounded-[2rem] p-6 mb-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BrainCircuit size={100} className="text-[#19DB8A]" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="text-[#19DB8A]" size={20} />
                <h3 className="font-bold text-[#19DB8A] uppercase tracking-wider text-[10px]">Rapport de Scoutisme Choose-Me</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed italic relative z-10">
                {loadingInsight ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#19DB8A] rounded-full animate-pulse" />
                    Génération de l'analyse par IA...
                  </span>
                ) : insight || 'Complétez votre profil pour générer une analyse personnalisée.'}
              </p>
           </div>
        )}

        {isAthleteAccount && (
          <div className="grid grid-cols-3 gap-3 mb-10">
            <StatCard
              icon={<Activity size={18} />}
              label="Matchs"
              value={user.stats?.matchesPlayed || 0}
              isEmpty={!user.stats?.matchesPlayed}
            />
            <StatCard
              icon={<Trophy size={18} className="text-[#FF8A3C]" />}
              label="Buts"
              value={user.stats?.goals || 0}
              isEmpty={!user.stats?.goals}
            />
            <StatCard
              icon={<Award size={18} className="text-[#19DB8A]" />}
              label="Passes"
              value={user.stats?.assists || 0}
              isEmpty={!user.stats?.assists}
            />
          </div>
        )}

        {/* Additional Info Section */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">{isPressAccount ? 'Informations média' : 'Informations'}</h3>
          <div className="space-y-4">
            {isAthleteAccount ? (
              <>
                <InfoRow
                  label="Sport"
                  value={user.sport || 'Non défini'}
                  isEmpty={!user.sport}
                />
                <InfoRow
                  label="Poste / Spécialité"
                  value={user.position || 'Non défini'}
                  isEmpty={!user.position}
                />
                <InfoRow
                  label="Taille"
                  value={user.height ? `${user.height} cm` : 'Non défini'}
                  isEmpty={!user.height}
                />
                <InfoRow
                  label="Poids"
                  value={user.weight ? `${user.weight} kg` : 'Non défini'}
                  isEmpty={!user.weight}
                />
              </>
            ) : (
              <InfoRow
                label="Type de compte"
                value={isPressAccount ? 'Presse / Média sportif' : user.type}
                isEmpty={false}
              />
            )}
            <InfoRow
              label="Email"
              value={user.email || 'Non défini'}
              isEmpty={!user.email}
            />
            <InfoRow
              label="Pays"
              value={user.country || 'Non défini'}
              isEmpty={!user.country}
            />
            {user.city && (
              <InfoRow
                label="Ville"
                value={user.city}
                isEmpty={false}
              />
            )}
          </div>
          {isOwnProfile && missingFields.length > 0 && (
            <button
              onClick={() => navigate('/profile/edit')}
              className="w-full mt-6 py-3 bg-[#19DB8A] text-black font-bold rounded-2xl hover:bg-[#19DB8A]/90 transition-colors"
            >
              Compléter les informations
            </button>
          )}
        </div>

        {/* Performance Videos */}
        {isAthleteAccount && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-readex">Performances</h3>
              {isOwnProfile && user.type === UserType.ATHLETE && (
                <button
                  onClick={() => navigate('/create-content')}
                  className="text-[#19DB8A] text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:text-[#19DB8A]/80"
                >
                  <Plus size={16} /> Ajouter
                </button>
              )}
            </div>

            {videoActionError && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {videoActionError}
              </div>
            )}

            {loadingVideos ? (
              <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center">
                {/* Logo Choose Me en chargement - rogné en cercle */}
                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden bg-white/5 border-4 border-[#19DB8A]/30 shadow-xl">
                  <img
                    src="/assets/images/app_launcher_icon.png"
                    alt="Choose Me"
                    className="w-full h-full object-cover animate-pulse"
                  />
                </div>
                <p className="text-white/60 text-sm">Chargement des vidéos...</p>
              </div>
            ) : performanceVideos.length === 0 ? (
              <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <Activity size={48} className="text-white/20 mb-4" />
                <p className="text-white/60 text-sm mb-2">Aucune vidéo de performance pour le moment</p>
                <p className="text-white/40 text-xs">Les vidéos de performance apparaîtront ici</p>
                {isOwnProfile && user.type === UserType.ATHLETE && (
                  <button
                    onClick={() => navigate('/create-content')}
                    className="mt-4 px-4 py-2 bg-[#19DB8A] text-black font-bold rounded-lg hover:bg-[#19DB8A]/90 text-sm"
                  >
                    Ajouter une vidéo
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {performanceVideos.map((video) => (
                  <div key={video.id || video.videoUrl} className="overflow-hidden rounded-2xl border border-white/5 bg-[#0A0A0A] shadow-lg">
                    <div className="relative aspect-square overflow-hidden">
                      <CustomVideoPlayer
                        src={video.videoUrl}
                        poster={video.thumbnailUrl}
                        caption={video.caption}
                        isHD={video.processed}
                        videoId={video.id}
                        userId={video.userId}
                        title={video.title || video.caption || `Vidéo de ${user.displayName}`}
                        description={`Performance de ${user.displayName} - ${user.sport || 'Sport'} ${user.position ? `(${user.position})` : ''}`}
                        hashtags={[
                          'ChooseMe',
                          user.sport?.replace(/\s+/g, '') || 'Sport',
                          user.country?.replace(/\s+/g, '') || '',
                          'Performance',
                          'Talent'
                        ].filter(Boolean)}
                        onShare={async () => {
                          if (video.id && video.userId) {
                            const { incrementVideoShares } = await import('../../services/performanceService');
                            await incrementVideoShares(video.userId, video.id);
                          }
                        }}
                        className="h-full w-full"
                        compact
                      />

                      {isOwnProfile && (
                        <div className="absolute right-1.5 top-1.5 z-40 flex gap-1">
                          <button
                            onClick={() => handleStartEditVideo(video)}
                            disabled={videoActionLoading === video.id}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md transition-colors hover:text-[#19DB8A]"
                            aria-label="Modifier la vidéo"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video)}
                            disabled={videoActionLoading === video.id}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/30 bg-black/70 text-red-300 backdrop-blur-md transition-colors hover:bg-red-500/20"
                            aria-label="Supprimer la vidéo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingVideo?.id === video.id && (
                      <div className="space-y-2 border-t border-white/5 p-2">
                        <input
                          value={editingVideo.title}
                          onChange={(event) => setEditingVideo((prev) => prev ? { ...prev, title: event.target.value } : prev)}
                          placeholder="Titre de la vidéo"
                          className="w-full rounded-xl border border-white/10 bg-black/35 px-2 py-1.5 text-xs text-white placeholder-white/35 outline-none focus:border-[#19DB8A]"
                        />
                        <textarea
                          value={editingVideo.caption}
                          onChange={(event) => setEditingVideo((prev) => prev ? { ...prev, caption: event.target.value } : prev)}
                          placeholder="Description"
                          rows={3}
                          className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-2 py-1.5 text-xs text-white placeholder-white/35 outline-none focus:border-[#19DB8A]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveVideo}
                            disabled={videoActionLoading === video.id}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#19DB8A] px-2 py-1.5 text-xs font-bold text-black disabled:opacity-60"
                          >
                            <Save size={13} />
                            Enregistrer
                          </button>
                          <button
                            onClick={() => setEditingVideo(null)}
                            className="flex items-center justify-center rounded-xl border border-white/10 px-2 py-1.5 text-xs font-bold text-white/70"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isPressAccount && (
          <div className="mb-8 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#19DB8A]">Presse</p>
                <h3 className="text-xl font-bold font-readex text-white">Articles et reportages</h3>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/dashboard/press')}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#19DB8A] px-3 py-2 text-xs font-black uppercase tracking-tight text-black shadow-lg shadow-[#19DB8A]/15"
                >
                  <FileText size={15} />
                  Publier
                </button>
              )}
            </div>

            {loadingPressItems ? (
              <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-10 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                  <Newspaper size={24} className="text-[#19DB8A] animate-pulse" />
                </div>
                <p className="text-sm text-white/55">Chargement des publications...</p>
              </div>
            ) : pressItems.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5">
                  <Newspaper size={30} className="text-white/25" />
                </div>
                <p className="mb-2 text-sm font-bold text-white">Aucun article ou reportage</p>
                <p className="text-xs text-white/45">Les publications presse apparaîtront ici.</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/dashboard/press')}
                    className="mt-5 rounded-2xl bg-[#19DB8A] px-4 py-2 text-sm font-bold text-black"
                  >
                    Créer une publication
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {pressActionError && (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {pressActionError}
                  </div>
                )}
                {pressItems.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-white/5 bg-[#0A0A0A] text-left shadow-xl transition-colors hover:border-[#19DB8A]/30"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/explorer/reportage/${item.id}`, { state: { reportage: item } })}
                      className="block w-full text-left"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.03]">
                        {item.mediaType === 'video' && item.videoUrl ? (
                          <>
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                              <video src={item.videoUrl} muted playsInline className="h-full w-full object-cover" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md">
                                <PlayCircle size={25} />
                              </div>
                            </div>
                          </>
                        ) : item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#101010] to-[#151515]">
                            <FileText size={42} className="text-white/18" />
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#19DB8A] backdrop-blur-md">
                          {item.kind === 'article' ? 'Article' : 'Reportage'}
                        </span>
                      </div>
                      <div className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                          <span>{item.category || 'Sport'}</span>
                          {item.date && <span>{item.date}</span>}
                        </div>
                        <h4 className="line-clamp-2 text-base font-bold leading-snug text-white">{item.title}</h4>
                        {item.detail && <p className="line-clamp-2 text-sm leading-relaxed text-white/55">{item.detail}</p>}
                        <div className="flex items-center gap-3 text-xs font-bold text-white/45">
                          <span>{item.likes.toLocaleString()} likes</span>
                          <span>{item.shares.toLocaleString()} partages</span>
                        </div>
                      </div>
                    </button>

                    {isOwnProfile && (
                      <div className="flex gap-2 border-t border-white/5 p-3">
                        <button
                          type="button"
                          onClick={() => handleStartEditPressItem(item)}
                          disabled={pressActionLoading === item.id}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold text-white/75 transition-colors hover:border-[#19DB8A]/40 hover:text-[#19DB8A] disabled:opacity-60"
                        >
                          <Edit2 size={14} />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePressItem(item)}
                          disabled={pressActionLoading === item.id}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-red-400/25 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    )}

                    {editingPressItem?.id === item.id && (
                      <div className="space-y-3 border-t border-white/5 p-4">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPressItem((prev) => prev ? { ...prev, kind: 'article' } : prev)}
                            className={`rounded-2xl border px-3 py-2 text-xs font-bold ${editingPressItem.kind === 'article' ? 'border-[#19DB8A] bg-[#19DB8A] text-black' : 'border-white/10 text-white/55'}`}
                          >
                            Article
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPressItem((prev) => prev ? { ...prev, kind: 'reportage' } : prev)}
                            className={`rounded-2xl border px-3 py-2 text-xs font-bold ${editingPressItem.kind === 'reportage' ? 'border-[#19DB8A] bg-[#19DB8A] text-black' : 'border-white/10 text-white/55'}`}
                          >
                            Reportage
                          </button>
                        </div>
                        <input
                          value={editingPressItem.title}
                          onChange={(event) => setEditingPressItem((prev) => prev ? { ...prev, title: event.target.value } : prev)}
                          placeholder="Titre"
                          className="w-full rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-[#19DB8A]"
                        />
                        <select
                          value={editingPressItem.category}
                          onChange={(event) => setEditingPressItem((prev) => prev ? { ...prev, category: event.target.value } : prev)}
                          className="w-full rounded-2xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#19DB8A]"
                        >
                          {PRESS_CONTENT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                        <textarea
                          value={editingPressItem.detail}
                          onChange={(event) => setEditingPressItem((prev) => prev ? { ...prev, detail: event.target.value } : prev)}
                          placeholder="Texte ou description"
                          rows={5}
                          className="w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-[#19DB8A]"
                        />

                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Photo / vidéo</span>
                            {(item.mediaUrl || editingPressItem.mediaFile) && (
                              <button
                                type="button"
                                onClick={() => setEditingPressItem((prev) => prev ? { ...prev, mediaFile: null, removeMedia: true } : prev)}
                                className="text-xs font-bold text-red-300"
                              >
                                Retirer
                              </button>
                            )}
                          </div>
                          {pressMediaPreview ? (
                            editingPressItem.mediaFile?.type.startsWith('video/') ? (
                              <video src={pressMediaPreview} controls className="mb-3 h-44 w-full rounded-xl bg-black object-contain" />
                            ) : (
                              <img src={pressMediaPreview} className="mb-3 h-44 w-full rounded-xl object-cover" />
                            )
                          ) : !editingPressItem.removeMedia && item.mediaUrl ? (
                            item.mediaType === 'video' ? (
                              <video src={item.videoUrl} controls className="mb-3 h-44 w-full rounded-xl bg-black object-contain" />
                            ) : (
                              <img src={item.imageUrl} className="mb-3 h-44 w-full rounded-xl object-cover" />
                            )
                          ) : (
                            <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-white/5 text-xs text-white/35">
                              Aucun média
                            </div>
                          )}
                          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 px-3 py-3 text-xs font-bold text-white/60">
                            <ImagePlus size={15} />
                            Changer la photo ou vidéo
                            <input type="file" accept="image/*,video/*" onChange={handlePressMediaChange} className="hidden" />
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSavePressItem(item)}
                            disabled={pressActionLoading === item.id}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#19DB8A] px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-black disabled:opacity-60"
                          >
                            <Save size={15} />
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPressItem(null)}
                            className="flex items-center justify-center rounded-2xl border border-white/10 px-3 py-3 text-white/70"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bouton de déconnexion en bas de page */}
        {isOwnProfile && (
          <div className="mt-8 pb-6">
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal Helper Icons
const ChevronLeft = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; isEmpty?: boolean; isText?: boolean }> = ({ icon, label, value, isEmpty, isText }) => (
  <div className={`bg-[#0A0A0A] border rounded-3xl p-5 flex flex-col items-center shadow-xl ${isEmpty ? 'border-white/5 opacity-60' : 'border-white/5'}`}>
    <div className={isEmpty ? 'text-white/20' : 'text-white/30'}>{icon}</div>
    <span className={`text-2xl font-readex font-bold mt-2 ${isEmpty ? 'text-white/40' : 'text-white'}`}>
      {isText ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
    </span>
    <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest mt-1">{label}</span>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string; isEmpty?: boolean }> = ({ label, value, isEmpty }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0">
    <span className="text-white/60 text-sm">{label}</span>
    <span className={`font-semibold ${isEmpty ? 'text-white/30 italic' : 'text-white'}`}>
      {isEmpty ? 'À compléter' : value}
    </span>
  </div>
);

export default ProfileViewPage;
