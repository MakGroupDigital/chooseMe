import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Check, Loader2, Sparkles } from 'lucide-react';
import { UserType } from '../../types';
import { uploadPerformanceVideo } from '../../services/performanceService';
import { getFirebaseAuth, getFirestoreDb } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface LocationState {
  videoBlob: Blob;
  userType: UserType;
}

const VideoDescriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const isAthlete = state?.userType === UserType.ATHLETE;

  useEffect(() => {
    if (!state?.videoBlob) {
      navigate('/create-content', { replace: true });
      return;
    }

    const url = URL.createObjectURL(state.videoBlob);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [navigate, state?.videoBlob]);

  const handlePublish = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Veuillez remplir le titre et la description');
      return;
    }

    setUploading(true);
    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        alert('Vous devez être connecté');
        setUploading(false);
        return;
      }

      const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userSnap.data() as any;

      console.log('📤 Publication de la vidéo...');

      await uploadPerformanceVideo(
        currentUser.uid,
        userData?.displayName || currentUser.email || 'Utilisateur',
        userData?.photoUrl,
        state.videoBlob,
        `${title}\n\n${description}`,
        ''
      );

      console.log('✅ Vidéo publiée avec succès');

      // Rediriger vers le profil
      navigate('/profile');

      // Afficher un message de succès
      setTimeout(() => {
        alert('Vidéo publiée ! Le transcodage en MP4 prendra ~60 secondes.');
      }, 500);
    } catch (e) {
      console.error('❌ Erreur publication:', e);
      alert('Erreur lors de la publication. Veuillez réessayer.');
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigate('/create-content');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-black via-black/95 to-transparent p-4 flex items-center justify-between safe-area-top">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          <X size={24} />
        </button>
        <h1 className="text-white font-bold text-lg">Décrire votre vidéo</h1>
        <div className="w-10" />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Prévisualisation vidéo */}
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04]">
          <div className="relative aspect-[9/16] max-h-[58vh] w-full bg-black">
            {previewUrl ? (
              <video
                ref={previewVideoRef}
                src={previewUrl}
                className="h-full w-full object-contain"
                controls
                autoPlay
                muted
                playsInline
                preload="auto"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/45">
                Préparation de la vidéo...
              </div>
            )}
          </div>
        </div>

        {/* Titre */}
        <div>
          <label className="text-white text-sm font-semibold mb-3 block">
            Titre de la vidéo
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entrez un titre accrocheur..."
            maxLength={100}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:border-[#19DB8A] focus:outline-none"
          />
          <div className="text-right text-white/50 text-xs mt-1">
            {title.length}/100
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-white text-sm font-semibold mb-3 block">
            Description détaillée
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre performance, vos objectifs, vos points forts..."
            maxLength={500}
            rows={8}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:border-[#19DB8A] focus:outline-none resize-none"
          />
          <div className="text-right text-white/50 text-xs mt-1">
            {description.length}/500
          </div>
        </div>

        {/* Info pour les athlètes */}
        {isAthlete && (
          <div className="bg-[#19DB8A]/10 border border-[#19DB8A]/30 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="text-[#19DB8A] flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-white font-semibold text-sm mb-1">
                Conseil pour les recruteurs
              </p>
              <p className="text-white/80 text-xs leading-relaxed">
                Une bonne description avec des détails sur votre performance augmente vos chances d'être remarqué par les recruteurs. Soyez spécifique et authentique.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="bg-gradient-to-t from-black via-black/95 to-transparent p-6 safe-area-bottom flex gap-3">
        <button
          onClick={handleBack}
          disabled={uploading}
          className="flex-1 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 transition-all disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={handlePublish}
          disabled={uploading || !title.trim() || !description.trim()}
          className="flex-1 py-4 rounded-full bg-[#19DB8A] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#19DB8A]/90 transition-all"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Publication...
            </>
          ) : (
            <>
              <Check size={20} />
              Publier
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoDescriptionPage;
