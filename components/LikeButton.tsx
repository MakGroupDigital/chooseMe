import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import '../styles/likeButton.css';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onLike: () => Promise<void>;
  triggerAnimation: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  isLiked,
  likeCount,
  onLike,
  triggerAnimation,
  isLoading = false,
  size = 'md',
  showCount = true,
  className = ''
}) => {
  const [showWowEffect, setShowWowEffect] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Déclencher l'effet "wow" quand triggerAnimation change
  useEffect(() => {
    if (triggerAnimation && isLiked) {
      console.log('🎉 Animation déclenchée!');
      setShowWowEffect(true);
      
      // Créer des particules pour l'effet
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.cos((i / 12) * Math.PI * 2) * 80,
        y: Math.sin((i / 12) * Math.PI * 2) * 80
      }));
      setParticles(newParticles);

      // Retirer l'effet après l'animation
      const timer = setTimeout(() => {
        setShowWowEffect(false);
        setParticles([]);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [triggerAnimation, isLiked]);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Conteneur du bouton avec effet de pulse */}
      <div className="relative">
        <button
          onClick={onLike}
          disabled={isLoading}
          className={`
            ${sizeClasses[size]}
            rounded-full
            flex items-center justify-center
            transition-all duration-200
            relative
            ${isLiked 
              ? 'bg-red-500/20 hover:bg-red-500/30' 
              : 'bg-white/10 hover:bg-white/20'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            group
          `}
        >
          <Heart
            size={iconSizes[size]}
            className={`
              transition-all duration-200
              ${isLiked 
                ? 'text-red-500 fill-red-500' 
                : 'text-white/60 group-hover:text-white'
              }
              ${showWowEffect ? 'scale-125' : 'scale-100'}
            `}
            fill={isLiked ? 'currentColor' : 'none'}
          />
        </button>

        {/* Effet de pulse au like */}
        {showWowEffect && (
          <>
            {/* Pulse principal */}
            <div className="absolute inset-0 rounded-full bg-red-500/40 animate-pulse" style={{
              animation: 'pulse-ring 0.6s ease-out'
            }} />
            
            {/* Particules qui s'envolent */}
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="like-particle"
                style={{
                  '--tx': `${particle.x}px`,
                  '--ty': `${particle.y}px`,
                } as React.CSSProperties & { '--tx': string; '--ty': string }}
              />
            ))}
          </>
        )}
      </div>

      {/* Compteur de likes */}
      {showCount && (
        <span className={`
          font-bold
          transition-all duration-200
          ${isLiked ? 'text-red-500' : 'text-white/60'}
          ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}
        `}>
          {Number.isNaN(likeCount) ? 0 : likeCount}
        </span>
      )}
    </div>
  );
};

export default LikeButton;
