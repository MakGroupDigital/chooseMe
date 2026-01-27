import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, MoreVertical, Share2, Download, Flag } from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  caption?: string;
  isHD?: boolean;
  videoId?: string;
  userId?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  onShare?: () => void;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ 
  src, 
  poster, 
  className = '',
  caption,
  isHD = false,
  videoId,
  userId,
  title,
  description,
  hashtags = [],
  onShare
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Cacher les contrôles après 3 secondes d'inactivité
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleShare = async () => {
    try {
      // Construire le texte de partage
      const shareTitle = title || caption || 'Vidéo de performance - Choose Me';
      const hashtagsText = hashtags.length > 0 ? '\n\n' + hashtags.map(tag => `#${tag}`).join(' ') : '';
      const shareText = `${shareTitle}${description ? '\n\n' + description : ''}${hashtagsText}`;
      
      // URL de la vidéo (peut être personnalisée avec videoId si besoin)
      const shareUrl = videoId 
        ? `${window.location.origin}/video/${videoId}` 
        : src;

      // Vérifier si l'API Web Share est disponible
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        console.log('✅ Vidéo partagée avec succès');
        
        // Appeler le callback onShare pour incrémenter le compteur
        if (onShare) {
          onShare();
        }
      } else {
        // Fallback: copier le lien dans le presse-papiers
        const fullShareText = `${shareText}\n\n${shareUrl}`;
        await navigator.clipboard.writeText(fullShareText);
        alert('✅ Lien copié dans le presse-papiers !');
        
        // Appeler le callback onShare pour incrémenter le compteur
        if (onShare) {
          onShare();
        }
      }
      
      setShowMenu(false);
    } catch (error) {
      // L'utilisateur a annulé le partage ou une erreur s'est produite
      if ((error as Error).name !== 'AbortError') {
        console.error('❌ Erreur lors du partage:', error);
        
        // Fallback: copier dans le presse-papiers
        try {
          const shareTitle = title || caption || 'Vidéo de performance - Choose Me';
          const hashtagsText = hashtags.length > 0 ? '\n\n' + hashtags.map(tag => `#${tag}`).join(' ') : '';
          const shareText = `${shareTitle}${description ? '\n\n' + description : ''}${hashtagsText}`;
          const shareUrl = videoId 
            ? `${window.location.origin}/video/${videoId}` 
            : src;
          const fullShareText = `${shareText}\n\n${shareUrl}`;
          
          await navigator.clipboard.writeText(fullShareText);
          alert('✅ Lien copié dans le presse-papiers !');
          
          // Appeler le callback onShare pour incrémenter le compteur
          if (onShare) {
            onShare();
          }
        } catch (clipboardError) {
          console.error('❌ Erreur copie presse-papiers:', clipboardError);
          alert('❌ Impossible de partager la vidéo');
        }
      }
    }
  };

  const handleDownload = async () => {
    try {
      setShowMenu(false);
      
      // Afficher un indicateur de chargement
      const loadingToast = document.createElement('div');
      loadingToast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 13px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `;
      loadingToast.textContent = '⏳ Téléchargement en cours...';
      document.body.appendChild(loadingToast);

      // Télécharger la vidéo en tant que blob
      const response = await fetch(src);
      const blob = await response.blob();
      
      // Créer une URL blob locale
      const blobUrl = URL.createObjectURL(blob);
      
      // Créer un élément <a> pour forcer le téléchargement
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = (title || 'video-choose-me').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.mp4';
      
      // Ajouter au DOM, cliquer, puis retirer
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer après un court délai
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      // Retirer le message de chargement
      document.body.removeChild(loadingToast);
      
      // Afficher message de succès
      const successToast = document.createElement('div');
      successToast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(25, 219, 138, 0.95);
        color: black;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 13px;
        font-weight: bold;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(25, 219, 138, 0.3);
      `;
      successToast.textContent = '✅ Vidéo téléchargée !';
      document.body.appendChild(successToast);
      
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 2500);
      
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      
      // En cas d'erreur, essayer une méthode alternative
      try {
        // Méthode alternative: utiliser XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.responseType = 'blob';
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            const blob = xhr.response;
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = blobUrl;
            link.download = (title || 'video-choose-me').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.mp4';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            
            // Message de succès
            const successToast = document.createElement('div');
            successToast.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: rgba(25, 219, 138, 0.95);
              color: black;
              padding: 12px 24px;
              border-radius: 8px;
              z-index: 9999;
              font-size: 13px;
              font-weight: bold;
            `;
            successToast.textContent = '✅ Vidéo téléchargée !';
            document.body.appendChild(successToast);
            setTimeout(() => {
              if (document.body.contains(successToast)) {
                document.body.removeChild(successToast);
              }
            }, 2500);
          }
        };
        
        xhr.onerror = function() {
          alert('❌ Impossible de télécharger la vidéo. Veuillez réessayer.');
        };
        
        xhr.send();
        
      } catch (fallbackError) {
        console.error('❌ Erreur fallback:', fallbackError);
        alert('❌ Impossible de télécharger la vidéo. Veuillez vérifier votre connexion.');
      }
    }
  };

  const handleReport = () => {
    // TODO: Implémenter la fonctionnalité de signalement
    alert('Fonctionnalité de signalement à venir');
    setShowMenu(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Badge HD */}
      {isHD && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-[#19DB8A]/90 backdrop-blur-sm rounded-md">
          <span className="text-black text-[10px] font-bold">HD</span>
        </div>
      )}

      {/* Logo Watermark - Coin bas gauche */}
      <div className="absolute bottom-20 left-3 w-12 h-12 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-lg pointer-events-none">
        <img 
          src="/assets/images/app_launcher_icon.png" 
          alt="Choose Me" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback si l'image ne charge pas
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Bouton Play/Pause Central */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[#19DB8A]/90 backdrop-blur-md flex items-center justify-center shadow-lg shadow-[#19DB8A]/30 pointer-events-auto hover:scale-110 transition-transform"
          >
            <Play size={28} className="text-black ml-1" fill="currentColor" />
          </button>
        </div>
      )}

      {/* Contrôles */}
      <div 
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Barre de progression */}
        <div className="px-4 pb-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[#19DB8A]
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-moz-range-thumb]:w-3
              [&::-moz-range-thumb]:h-3
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-[#19DB8A]
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #19DB8A 0%, #19DB8A ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>

        {/* Contrôles principaux */}
        <div className="flex items-center justify-between px-4 pb-3 bg-gradient-to-t from-black/80 to-transparent">
          {/* Gauche: Play/Pause + Volume + Temps */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-[#19DB8A]/80 transition-colors group"
            >
              {isPlaying ? (
                <Pause size={16} className="text-white group-hover:text-black" fill="currentColor" />
              ) : (
                <Play size={16} className="text-white group-hover:text-black ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              {isMuted ? (
                <VolumeX size={16} className="text-white" />
              ) : (
                <Volume2 size={16} className="text-white" />
              )}
            </button>

            {/* Temps */}
            <span className="text-white text-xs font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Droite: Plein écran + Menu */}
          <div className="flex items-center gap-2">
            {/* Plein écran */}
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Maximize size={16} className="text-white" />
            </button>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <MoreVertical size={16} className="text-white" />
              </button>

              {/* Menu déroulant */}
              {showMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden min-w-[150px] z-50">
                  <button 
                    onClick={handleShare}
                    className="w-full px-4 py-2 text-left text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <Share2 size={14} />
                    Partager
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="w-full px-4 py-2 text-left text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <Download size={14} />
                    Télécharger
                  </button>
                  <button 
                    onClick={handleReport}
                    className="w-full px-4 py-2 text-left text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <Flag size={14} />
                    Signaler
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Légende */}
      {caption && (
        <div className="absolute bottom-16 left-0 right-0 px-4 pointer-events-none">
          <p className="text-white text-sm drop-shadow-lg line-clamp-2">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomVideoPlayer;
