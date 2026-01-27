import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Heart, MessageCircle } from 'lucide-react';
import { getFirestoreDb } from '../../services/firebase';
import { doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import CustomVideoPlayer from '../../components/CustomVideoPlayer';

interface VideoData {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  createdAt: string;
}

const SharedVideoPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) {
        setError('ID de vidéo manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const db = getFirestoreDb();
        
        // Chercher la vidéo dans la collection "publication"
        const q = query(
          collectionGroup(db, 'publication'),
          where('__name__', '==', videoId)
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          
          const videoUrl = data.postVido || data.post_vido || '';
          
          if (!videoUrl) {
            setError('Vidéo introuvable');
            setLoading(false);
            return;
          }

          // Extraire les hashtags
          const hashtags: string[] = [];
          if (typeof data.ashtag === 'string' && data.ashtag.trim()) {
            hashtags.push(...data.ashtag.trim().split(/\s+/).filter((t: string) => t.length > 0));
          }
          if (Array.isArray(data.type)) {
            hashtags.push(...data.type.filter((t: unknown) => typeof t === 'string' && (t as string).trim().length > 0));
          }

          setVideo({
            id: docSnap.id,
            userId: (data.post_user && data.post_user.id) || '',
            userName: data.nomPoster || 'Talent',
            userAvatar: data.post_photo || '/assets/images/app_launcher_icon.png',
            videoUrl,
            thumbnailUrl: data.post_photo || '',
            caption: data.post_description || '',
            likes: Array.isArray(data.likes) ? data.likes.length : 0,
            comments: data.num_comments ?? 0,
            shares: data.num_votes ?? 0,
            hashtags,
            createdAt: data.time_posted && data.time_posted.toDate
              ? data.time_posted.toDate().toLocaleDateString()
              : ''
          });
        } else {
          setError('Vidéo introuvable');
        }
      } catch (err) {
        console.error('Erreur chargement vidéo:', err);
        setError('Impossible de charger la vidéo');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  const handleShare = async () => {
    if (!video) return;

    const shareUrl = window.location.href;
    const hashtagsText = video.hashtags.length > 0 ? '\n\n' + video.hashtags.map(tag => `#${tag}`).join(' ') : '';
    const shareText = `🎬 Découvrez la performance de @${video.userName} sur Choose Me!\n\n${video.caption}${hashtagsText}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Performance de ${video.userName} - Choose Me`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
          alert('✅ Lien copié dans le presse-papiers !');
        }
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      alert('✅ Lien copié dans le presse-papiers !');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 mb-6 rounded-full overflow-hidden bg-white/5 border-4 border-[#19DB8A]/30 shadow-2xl">
          <img 
            src="/assets/images/app_launcher_icon.png" 
            alt="Choose Me" 
            className="w-full h-full object-cover animate-pulse"
          />
        </div>
        <p className="text-white/60 text-sm">Chargement de la vidéo...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Vidéo introuvable</h2>
          <p className="text-white/60 mb-6">{error || 'Cette vidéo n\'existe pas ou a été supprimée'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#208050] text-white rounded-xl hover:bg-[#208050]/80 transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Choose Me</h1>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <Share2 size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* Video Container */}
      <div className="pt-16 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Video Player */}
          <div className="aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl">
            <CustomVideoPlayer
              src={video.videoUrl}
              poster={video.thumbnailUrl}
              caption={video.caption}
              videoId={video.id}
              userId={video.userId}
              title={`Performance de ${video.userName}`}
              description={video.caption}
              hashtags={video.hashtags}
              className="w-full h-full"
            />
          </div>

          {/* Video Info */}
          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#19DB8A]">
                <img 
                  src={video.userAvatar} 
                  alt={video.userName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">@{video.userName}</h3>
                <p className="text-white/60 text-sm">{video.createdAt}</p>
              </div>
              <button className="px-4 py-2 bg-[#208050] text-white rounded-full font-bold text-sm hover:bg-[#208050]/80 transition-all">
                Suivre
              </button>
            </div>

            {/* Caption */}
            <p className="text-white/90 text-sm leading-relaxed mb-4">
              {video.caption}
            </p>

            {/* Hashtags */}
            {video.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {video.hashtags.map((tag, idx) => (
                  <span key={idx} className="text-[#19DB8A] text-sm font-medium">
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 py-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Heart size={20} className="text-white/60" />
                <span className="text-white font-bold">{video.likes}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-white/60" />
                <span className="text-white font-bold">{video.comments}</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 size={20} className="text-white/60" />
                <span className="text-white font-bold">{video.shares}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 p-6 bg-gradient-to-br from-[#208050]/20 to-[#19DB8A]/10 rounded-2xl border border-[#19DB8A]/30">
              <h4 className="text-white font-bold text-lg mb-2">Découvrez plus de talents !</h4>
              <p className="text-white/70 text-sm mb-4">
                Rejoignez Choose Me pour découvrir des milliers de talents sportifs africains
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-[#19DB8A] text-black font-bold rounded-xl hover:bg-[#19DB8A]/90 transition-all"
              >
                Ouvrir l'application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedVideoPage;
