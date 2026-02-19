import React, { useState } from 'react';

const RightSidebar: React.FC<{ onSwitchCamera?: () => void; onToggleFlash?: () => void; flashEnabled?: boolean }> = ({ 
  onSwitchCamera, 
  onToggleFlash,
  flashEnabled = false 
}) => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  const IconButton = ({ 
    icon: Icon, 
    id, 
    onClick,
    isActive = false 
  }: { 
    icon: React.ReactNode; 
    id: string; 
    onClick?: () => void;
    isActive?: boolean;
  }) => (
    <button
      onClick={onClick}
      onMouseEnter={() => setHoveredIcon(id)}
      onMouseLeave={() => setHoveredIcon(null)}
      className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 group ${
        isActive ? 'scale-110' : ''
      }`}
    >
      {/* Fond avec gradient au hover */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          hoveredIcon === id
            ? 'bg-gradient-to-br from-[#19DB8A]/30 to-[#19DB8A]/10 scale-110'
            : 'bg-white/5'
        }`}
      />

      {/* Bordure animée au hover */}
      <div
        className={`absolute inset-0 rounded-full border transition-all duration-300 ${
          hoveredIcon === id
            ? 'border-[#19DB8A]/60 scale-110'
            : 'border-white/10'
        }`}
      />

      {/* Icône */}
      <div
        className={`relative z-10 transition-all duration-300 ${
          hoveredIcon === id ? 'text-[#19DB8A] scale-110' : 'text-white'
        } ${isActive ? 'text-[#19DB8A]' : ''}`}
      >
        {Icon}
      </div>

      {/* Glow effect au hover */}
      {hoveredIcon === id && (
        <div className="absolute inset-0 rounded-full bg-[#19DB8A]/10 blur-lg animate-pulse" />
      )}
    </button>
  );

  return (
    <div className="w-20 bg-transparent flex flex-col items-center py-8 gap-6 safe-area-right overflow-y-auto">
      {/* Notifications */}
      <IconButton
        id="notifications"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        }
      />

      {/* Utilisateurs */}
      <IconButton
        id="users"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0" />
          </svg>
        }
      />

      {/* Partage */}
      <IconButton
        id="share"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        }
      />

      {/* Flash */}
      <IconButton
        id="flash"
        onClick={onToggleFlash}
        isActive={flashEnabled}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />

      {/* Tourner la caméra */}
      <IconButton
        id="flip"
        onClick={onSwitchCamera}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        }
      />

      {/* Micro */}
      <IconButton
        id="mic"
        onClick={toggleAudio}
        isActive={audioEnabled}
        icon={
          audioEnabled ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        }
      />

      {/* Musique */}
      <IconButton
        id="music"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
        }
      />

      {/* HD */}
      <button
        onMouseEnter={() => setHoveredIcon('hd')}
        onMouseLeave={() => setHoveredIcon(null)}
        className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 text-xs font-bold tracking-wider ${
          hoveredIcon === 'hd'
            ? 'text-[#19DB8A] border-[#19DB8A]/60 scale-110'
            : 'text-white border-white/20'
        } border rounded-full`}
      >
        {/* Fond avec gradient au hover */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            hoveredIcon === 'hd'
              ? 'bg-gradient-to-br from-[#19DB8A]/30 to-[#19DB8A]/10'
              : 'bg-white/5'
          }`}
        />
        <span className="relative z-10">HD</span>

        {/* Glow effect */}
        {hoveredIcon === 'hd' && (
          <div className="absolute inset-0 rounded-full bg-[#19DB8A]/10 blur-lg animate-pulse" />
        )}
      </button>

      {/* Profil */}
      <IconButton
        id="profile"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      />

      {/* Séparateur */}
      <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-2" />

      {/* Menu déroulant */}
      <IconButton
        id="menu"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        }
      />
    </div>
  );
};

export default RightSidebar;
