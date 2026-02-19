import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  icon: string;
  onAllow: () => Promise<void>;
  onDeny: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  title,
  description,
  icon,
  onAllow,
  onDeny
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePermissionRequest = (event: Event) => {
      const customEvent = event as CustomEvent;
      // La modale est gérée par le state isOpen
    };

    window.addEventListener('permissionRequest', handlePermissionRequest);
    return () => window.removeEventListener('permissionRequest', handlePermissionRequest);
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    setError(null);
    try {
      await onAllow();
    } catch (e) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error('Permission error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = () => {
    setError(null);
    onDeny();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#050505] rounded-3xl border border-white/10 p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="text-6xl">{icon}</div>
        </div>

        {/* Title */}
        <h2 className="text-white text-2xl font-bold text-center mb-3">
          {title}
        </h2>

        {/* Description */}
        <p className="text-white/70 text-sm text-center mb-6 leading-relaxed">
          {description}
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6">
            <p className="text-red-400 text-xs text-center">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-[#19DB8A]/10 border border-[#19DB8A]/30 rounded-xl p-4 mb-6">
          <p className="text-white/60 text-xs leading-relaxed">
            ✓ Vos données sont sécurisées et ne seront jamais partagées sans votre consentement
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            disabled={loading}
            className="flex-1 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <X size={18} />
            Refuser
          </button>
          <button
            onClick={handleAllow}
            disabled={loading}
            className="flex-1 py-3 rounded-full bg-[#19DB8A] text-black font-semibold hover:bg-[#19DB8A]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Activation...
              </>
            ) : (
              <>
                <Check size={18} />
                Autoriser
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-white/40 text-xs text-center mt-4">
          Vous pouvez modifier ces paramètres à tout moment dans les réglages
        </p>
      </div>
    </div>
  );
};

export default PermissionModal;
