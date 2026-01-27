
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, MapPin, Share2, Award, Activity, BrainCircuit, Trophy, MessageSquare, UserPlus, Check, AlertCircle, Users, Plus, LogOut } from 'lucide-react';
import { UserProfile, UserType } from '../../types';
import Button from '../../components/Button';
import CustomVideoPlayer from '../../components/CustomVideoPlayer';
import { getTalentInsight } from '../../services/geminiService';
import { getFollowers, getFollowing } from '../../services/followService';
import { listenToPerformanceVideos } from '../../services/performanceService';
import { shareProfile, sharePerformanceVideo } from '../../services/shareService';
import { getFirebaseAuth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

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

  // Pour l'instant, on considère que la page affiche toujours le profil connecté
  const viewerType = user.type;
  const isOwnProfile = true;
  const isRecruiterView = viewerType === UserType.RECRUITER || viewerType === UserType.CLUB;

  // Check for missing fields
  const missingFields = [];
  if (!user.country || user.country.trim() === '') missingFields.push('Pays');
  if (user.type === UserType.ATHLETE) {
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
    if (user.type === UserType.ATHLETE) loadInsight();
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
    console.log('🎬 Mise en place écoute vidéos pour:', user.uid);
    
    const unsubscribe = listenToPerformanceVideos(user.uid, (videos) => {
      console.log('🎬 Vidéos reçues:', videos.length);
      setPerformanceVideos(videos);
      setLoadingVideos(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

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
               <Award size={20} className="text-white" />
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
              {user.type}
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
            icon={<Trophy size={18} className="text-[#19DB8A]" />} 
            label="Profil" 
            value={user.type.charAt(0).toUpperCase() + user.type.slice(1)}
            isText={true}
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
        {user.type === UserType.ATHLETE && (
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

        {/* Performance Stats */}
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

        {/* Additional Info Section */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Informations</h3>
          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              {performanceVideos.map((video, idx) => (
                <div key={idx} className="aspect-[4/5] bg-[#0A0A0A] rounded-3xl border border-white/5 overflow-hidden shadow-lg">
                  <CustomVideoPlayer
                    src={video.videoUrl}
                    poster={video.thumbnailUrl}
                    caption={video.caption}
                    isHD={video.processed}
                    videoId={video.id}
                    userId={video.userId}
                    title={video.caption || `Vidéo de ${user.displayName}`}
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
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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
