import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Users, UserPlus, UserCheck, Activity, Trophy, Award, MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import CustomVideoPlayer from '../../components/CustomVideoPlayer';
import { getFirestoreDb, useAuth } from '../../services/firebase';
import { UserProfile, UserType } from '../../types';
import { getFollowers, getFollowing, followAthlete, isFollowing, unfollowAthlete } from '../../services/followService';
import { getUserPerformanceVideos, PerformanceVideo } from '../../services/performanceService';
import { getOrCreateConversation } from '../../services/chatService';

type PublicProfileData = UserProfile & {
  rawSkills: string[];
};

const AthletePublicProfilePage: React.FC<{ viewerType?: UserType }> = ({ viewerType }) => {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [videos, setVideos] = useState<PerformanceVideo[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowingAthlete, setIsFollowingAthlete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = Boolean(currentUser?.uid && athleteId && currentUser.uid === athleteId);
  const canMessageAthlete =
    !isOwnProfile &&
    (viewerType === UserType.RECRUITER || viewerType === UserType.CLUB);

  const competencies = useMemo(() => {
    if (!profile) return [];
    const set = new Set<string>();

    if (profile.sport) set.add(profile.sport);
    if (profile.position) set.add(profile.position);
    profile.rawSkills.forEach((skill) => {
      if (skill && skill.trim()) set.add(skill.trim());
    });

    return Array.from(set);
  }, [profile]);

  useEffect(() => {
    const loadData = async () => {
      if (!athleteId) {
        setError('Profil introuvable');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const db = getFirestoreDb();
        const usersRef = doc(db, 'users', athleteId);
        const userRef = doc(db, 'user', athleteId);
        const [usersSnap, userSnapLegacy] = await Promise.all([getDoc(usersRef), getDoc(userRef)]);
        const userSnap = usersSnap.exists() ? usersSnap : userSnapLegacy;

        if (!userSnap.exists()) {
          setError('Athlète introuvable');
          setLoading(false);
          return;
        }

        const data = userSnap.data() as any;
        const mappedProfile: PublicProfileData = {
          uid: athleteId,
          email: data?.email || '',
          displayName: data?.displayName || data?.display_name || 'Athlète',
          type: (data?.type as UserType) || UserType.ATHLETE,
          country: data?.country || data?.pays || '',
          city: data?.city || data?.ville || '',
          avatarUrl: data?.avatarUrl || data?.photoUrl || data?.photo_url || '',
          sport: data?.sport || data?.sporttype || data?.sport_type || '',
          position: data?.position || data?.poste || '',
          height: data?.height || data?.taille || undefined,
          weight: data?.weight || data?.poids || undefined,
          stats: {
            matchesPlayed: data?.stats?.matchesPlayed || data?.matchesPlayed || data?.matches_played || 0,
            goals: data?.stats?.goals || data?.goals || data?.buts || 0,
            assists: data?.stats?.assists || data?.assists || data?.passes || 0,
            points: data?.stats?.points || data?.points || 0,
          },
          rawSkills: [
            ...(Array.isArray(data?.competences) ? data.competences : []),
            ...(Array.isArray(data?.competencies) ? data.competencies : []),
            ...(Array.isArray(data?.skills) ? data.skills : []),
            ...(Array.isArray(data?.specialites) ? data.specialites : []),
            ...(Array.isArray(data?.specialties) ? data.specialties : []),
          ].filter(Boolean),
        };

        setProfile(mappedProfile);

        const [followers, following, performanceVideos] = await Promise.all([
          getFollowers(athleteId),
          getFollowing(athleteId),
          getUserPerformanceVideos(athleteId),
        ]);

        setFollowersCount(followers.length);
        setFollowingCount(following.length);
        setVideos(performanceVideos);

        if (currentUser?.uid && currentUser.uid !== athleteId) {
          const followingAthlete = await isFollowing(currentUser.uid, athleteId);
          setIsFollowingAthlete(followingAthlete);
        }
      } catch (e) {
        console.error('Erreur chargement profil athlète:', e);
        setError('Impossible de charger ce profil pour le moment');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [athleteId, currentUser?.uid]);

  const handleFollowToggle = async () => {
    if (!currentUser?.uid || !athleteId || isOwnProfile) return;

    try {
      setFollowLoading(true);

      if (isFollowingAthlete) {
        await unfollowAthlete(currentUser.uid, athleteId);
        setIsFollowingAthlete(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await followAthlete(currentUser.uid, athleteId);
        setIsFollowingAthlete(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (e) {
      console.error('Erreur suivi athlète:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessageAthlete = async () => {
    if (!currentUser?.uid || !athleteId) {
      navigate('/login');
      return;
    }
    try {
      setMessageLoading(true);
      const conversationId = await getOrCreateConversation(currentUser.uid, athleteId);
      navigate(`/messages/${conversationId}`);
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#208050] border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white mb-4">{error || 'Profil introuvable'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-[#208050] text-white rounded-xl"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="h-56 bg-gradient-to-br from-[#208050] to-[#0A0A0A] relative">
        <div className="absolute top-12 left-6 right-6 flex justify-between z-10">
          <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md">
            <ChevronLeft size={24} />
          </button>

          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              {canMessageAthlete && (
                <button
                  onClick={handleMessageAthlete}
                  disabled={messageLoading}
                  className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 bg-[#FF8A3C] text-black"
                >
                  <MessageCircle size={16} />
                  {messageLoading ? 'Ouverture...' : 'Écrire un message'}
                </button>
              )}
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                  isFollowingAthlete ? 'bg-white/15 text-white' : 'bg-[#19DB8A] text-black'
                }`}
              >
                {isFollowingAthlete ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {isFollowingAthlete ? 'Suivi' : 'Suivre'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 -mt-16 pb-32 relative z-20">
        <div className="flex flex-col items-center mb-8">
          <img
            src={profile.avatarUrl || 'https://via.placeholder.com/144?text=Athlete'}
            className="w-36 h-36 rounded-[2.8rem] border-8 border-[#050505] shadow-2xl object-cover"
            alt={profile.displayName}
          />
          <h1 className="mt-4 text-3xl font-readex font-bold text-white text-center">
            {profile.displayName}
          </h1>
          <div className="flex items-center gap-1 text-white/40 text-sm mt-1">
            <MapPin size={14} />
            <span>{profile.country || 'Pays non défini'}</span>
            {profile.city && (
              <>
                <span className="mx-2">•</span>
                <span>{profile.city}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard icon={<Users size={18} />} label="Abonnés" value={followersCount} />
          <StatCard icon={<Users size={18} className="text-[#FF8A3C]" />} label="Suivis" value={followingCount} />
          <StatCard icon={<Activity size={18} className="text-[#19DB8A]" />} label="Vidéos" value={videos.length} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard icon={<Trophy size={18} />} label="Matchs" value={profile.stats?.matchesPlayed || 0} />
          <StatCard icon={<Award size={18} className="text-[#FF8A3C]" />} label="Buts" value={profile.stats?.goals || 0} />
          <StatCard icon={<Award size={18} className="text-[#19DB8A]" />} label="Passes" value={profile.stats?.assists || 0} />
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Compétences</h3>
          {competencies.length === 0 ? (
            <p className="text-white/40 text-sm">Aucune compétence renseignée</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {competencies.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 rounded-full bg-[#19DB8A]/15 text-[#19DB8A] text-xs font-semibold"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
          <div className="mt-5 space-y-2 text-sm">
            <InfoRow label="Sport" value={profile.sport || 'Non défini'} />
            <InfoRow label="Poste / Spécialité" value={profile.position || 'Non défini'} />
            <InfoRow label="Taille" value={profile.height ? `${profile.height} cm` : 'Non défini'} />
            <InfoRow label="Poids" value={profile.weight ? `${profile.weight} kg` : 'Non défini'} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold font-readex text-white">Vidéos de performance</h3>
          {videos.length === 0 ? (
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-12 text-center">
              <p className="text-white/60 text-sm">Aucune vidéo publiée pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {videos.map((video, idx) => (
                <div key={`${video.id || idx}`} className="aspect-[4/5] bg-[#0A0A0A] rounded-3xl border border-white/5 overflow-hidden shadow-lg">
                  <CustomVideoPlayer
                    src={video.videoUrl}
                    poster={video.thumbnailUrl}
                    caption={video.caption}
                    isHD={video.processed}
                    videoId={video.id}
                    userId={video.userId}
                    title={video.caption || `Vidéo de ${profile.displayName}`}
                    description={`Performance de ${profile.displayName}`}
                    hashtags={['ChooseMe', 'Performance', profile.sport || 'Sport'].filter(Boolean)}
                    onShare={async () => {
                      if (video.id && video.userId) {
                        const { incrementVideoShares } = await import('../../services/performanceService');
                        await incrementVideoShares(video.userId, video.id);
                      }
                    }}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string }> = ({ icon, label, value }) => (
  <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-5 flex flex-col items-center shadow-xl">
    <div className="text-white/30">{icon}</div>
    <span className="text-2xl font-readex font-bold mt-2 text-white">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </span>
    <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest mt-1">{label}</span>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
    <span className="text-white/60">{label}</span>
    <span className="text-white font-semibold">{value}</span>
  </div>
);

export default AthletePublicProfilePage;
