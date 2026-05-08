import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Download, Smartphone } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
};

interface PwaInstallBannerProps {
  hasBottomNav?: boolean;
}

const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ hasBottomNav = false }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('Choose-Me service worker registration failed:', error);
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowFallback(false);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstallPrompt(null);
      setShowFallback(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const requestNotifications = async () => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.warn('Choose-Me notification permission request failed:', error);
    }
  };

  const installApp = async () => {
    setIsInstalling(true);
    setShowFallback(false);

    if (!installPrompt) {
      await requestNotifications();
      setShowFallback(true);
      setIsInstalling(false);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        await requestNotifications();
        setInstallPrompt(null);
      } else {
        setShowFallback(true);
      }
    } catch (error) {
      console.warn('Choose-Me PWA install prompt failed:', error);
      setShowFallback(true);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isStandalone) return null;

  return (
    <div
      className={`fixed inset-x-3 z-[90] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[430px] ${
        hasBottomNav ? 'bottom-[7.25rem]' : 'bottom-3'
      }`}
    >
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#06150f]/95 text-white shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="relative p-4 sm:p-5">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#208050] shadow-xl sm:h-14 sm:w-14">
              <Smartphone className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#19DB8A]">Expérience native</p>
              <h2 className="mt-1 text-lg font-bold leading-tight sm:text-xl">Installez Choose-Me sur votre téléphone</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/70 sm:text-sm">
                Profitez d’un accès direct, d’une navigation plus fluide et des notifications sportives en temps réel.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={installApp}
              disabled={isInstalling}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#19DB8A] px-5 text-sm font-bold text-[#03140d] shadow-lg shadow-emerald-500/20 transition hover:bg-[#44efaa] disabled:cursor-wait disabled:opacity-80"
            >
              {isInstalling ? (
                <>
                  <Download className="h-4 w-4 animate-bounce" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Installer l’app
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/70">
              {notificationPermission === 'granted' ? (
                <CheckCircle2 className="h-4 w-4 text-[#19DB8A]" />
              ) : (
                <Bell className="h-4 w-4 text-[#FF8A3C]" />
              )}
              Notifications
            </div>
          </div>

          {showFallback && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-relaxed text-white/78">
              {isIOS ? (
                <p>Sur iPhone, ouvrez le menu Partager de Safari, puis choisissez “Ajouter à l’écran d’accueil”.</p>
              ) : (
                <p>
                  Si la fenêtre d’installation ne s’affiche pas, ouvrez le menu du navigateur puis choisissez “Installer l’app” ou “Ajouter à l’écran d’accueil”.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PwaInstallBanner;
