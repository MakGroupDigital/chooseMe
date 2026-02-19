import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, Bell, Shield, User, Camera, Mic, MapPin, HardDrive, LogOut, Moon, Globe, Smartphone, Trophy, Info, Mail, FileText } from 'lucide-react';
import { permissionService, PermissionType } from '../../services/permissionService';
import { getFirebaseAuth, getFirestoreDb, useAuth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AppSettings, loadAppSettings, saveAppSettings, AppTheme } from '../../services/appSettingsService';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [savingPermission, setSavingPermission] = useState<PermissionType | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  const permissionStates = useMemo(() => permissionService.getAllPermissions(), [savingPermission]);

  const persistSettings = async (next: AppSettings) => {
    setSettings(next);
    saveAppSettings(next);
    if (!currentUser?.uid) return;

    try {
      const db = getFirestoreDb();
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          settings: {
            notificationsLikes: next.notificationsLikes,
            notificationsComments: next.notificationsComments,
            notificationsFollows: next.notificationsFollows,
            profilePublic: next.profilePublic,
            showOnlineStatus: next.showOnlineStatus,
            autoplayVideos: next.autoplayVideos,
            dataSaver: next.dataSaver,
            language: next.language,
            theme: next.theme,
          }
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Erreur sauvegarde réglages utilisateur:', e);
    }
  };

  const toggleSetting = (key: keyof AppSettings) => {
    if (typeof settings[key] !== 'boolean') return;
    const next = { ...settings, [key]: !settings[key] } as AppSettings;
    void persistSettings(next);
  };

  const requestPermission = async (type: PermissionType) => {
    setSavingPermission(type);
    try {
      switch (type) {
        case 'camera':
          await permissionService.requestCamera();
          break;
        case 'microphone':
          await permissionService.requestMicrophone();
          break;
        case 'notifications':
          await permissionService.requestNotifications();
          break;
        case 'location':
          await permissionService.requestLocation();
          break;
        case 'storage':
          await permissionService.requestStorage();
          break;
      }
    } finally {
      setSavingPermission(null);
    }
  };

  const resetPermissions = () => {
    permissionService.resetPermissions();
    setSavingPermission(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(getFirebaseAuth());
      navigate('/login');
    } catch (e) {
      console.error('Erreur déconnexion:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-28">
      <header className="p-6 pt-10 bg-gradient-to-b from-[#208050]/20 to-transparent">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 text-white">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings size={22} className="text-[#19DB8A]" />
            Réglages
          </h1>
        </div>
      </header>

      <div className="px-6 space-y-5">
        <Section title="Compte">
          <ActionRow icon={<User size={18} />} label="Modifier le profil" onClick={() => navigate('/profile/edit')} />
          <ActionRow icon={<Shield size={18} />} label="Sécurité du compte" subtitle="Email, accès, session" />
        </Section>

        <Section title="Notifications">
          <ToggleRow icon={<Bell size={18} />} label="Likes" value={settings.notificationsLikes} onToggle={() => toggleSetting('notificationsLikes')} />
          <ToggleRow icon={<Bell size={18} />} label="Commentaires" value={settings.notificationsComments} onToggle={() => toggleSetting('notificationsComments')} />
          <ToggleRow icon={<Bell size={18} />} label="Nouveaux abonnés" value={settings.notificationsFollows} onToggle={() => toggleSetting('notificationsFollows')} />
        </Section>

        <Section title="Confidentialité">
          <ToggleRow icon={<Shield size={18} />} label="Profil public" value={settings.profilePublic} onToggle={() => toggleSetting('profilePublic')} />
          <ToggleRow icon={<Smartphone size={18} />} label="Afficher le statut en ligne" value={settings.showOnlineStatus} onToggle={() => toggleSetting('showOnlineStatus')} />
        </Section>

        <Section title="Permissions">
          <PermissionRow icon={<Camera size={18} />} label="Caméra" status={permissionStates.camera} onGrant={() => requestPermission('camera')} busy={savingPermission === 'camera'} />
          <PermissionRow icon={<Mic size={18} />} label="Microphone" status={permissionStates.microphone} onGrant={() => requestPermission('microphone')} busy={savingPermission === 'microphone'} />
          <PermissionRow icon={<Bell size={18} />} label="Notifications système" status={permissionStates.notifications} onGrant={() => requestPermission('notifications')} busy={savingPermission === 'notifications'} />
          <PermissionRow icon={<MapPin size={18} />} label="Localisation" status={permissionStates.location} onGrant={() => requestPermission('location')} busy={savingPermission === 'location'} />
          <PermissionRow icon={<HardDrive size={18} />} label="Stockage" status={permissionStates.storage} onGrant={() => requestPermission('storage')} busy={savingPermission === 'storage'} />
          <button onClick={resetPermissions} className="w-full mt-2 py-2 text-xs text-[#FF8A3C] border border-[#FF8A3C]/30 rounded-xl">
            Réinitialiser les permissions
          </button>
        </Section>

        <Section title="Application">
          <ToggleRow icon={<Smartphone size={18} />} label="Lecture auto des vidéos" value={settings.autoplayVideos} onToggle={() => toggleSetting('autoplayVideos')} />
          <ToggleRow icon={<HardDrive size={18} />} label="Économie de données" value={settings.dataSaver} onToggle={() => toggleSetting('dataSaver')} />
          <SelectRow icon={<Globe size={18} />} label="Langue" value={settings.language} options={[{ label: 'Français', value: 'fr' }, { label: 'English', value: 'en' }]} onChange={(value) => void persistSettings({ ...settings, language: value as 'fr' | 'en' })} />
          <SelectRow icon={<Moon size={18} />} label="Thème" value={settings.theme} options={[{ label: 'Sombre', value: 'dark' }, { label: 'Clair', value: 'light' }, { label: 'Système', value: 'system' }]} onChange={(value) => void persistSettings({ ...settings, theme: value as AppTheme })} />
        </Section>

        <Section title="Devenir Athlète">
          <ActionRow
            icon={<Trophy size={18} />}
            label="Activer un profil athlète"
            subtitle="Formulaire dédié pour changer de type de compte et débloquer la publication de performances."
            onClick={() => navigate('/settings/become-athlete')}
          />
        </Section>

        <Section title="À propos de l'app">
          <ActionRow icon={<Info size={18} />} label="Choose-Me" subtitle="Plateforme de découverte et recrutement de talents sportifs." />
          <ActionRow icon={<FileText size={18} />} label="Version" subtitle="Web App v1.0 - En développement actif" />
          <ActionRow icon={<Shield size={18} />} label="Confidentialité & Conditions" subtitle="En cours de finalisation pour la mise en production." />
          <ActionRow icon={<Mail size={18} />} label="Support" subtitle="support@choose-me.app" />
        </Section>

        <Section title="Session">
          <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl font-semibold flex items-center justify-center gap-2">
            <LogOut size={18} />
            Se déconnecter
          </button>
        </Section>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-4">
    <h2 className="text-xs uppercase tracking-widest text-white/40 mb-3">{title}</h2>
    <div className="space-y-2">{children}</div>
  </section>
);

const ActionRow: React.FC<{ icon: React.ReactNode; label: string; subtitle?: string; onClick?: () => void }> = ({ icon, label, subtitle, onClick }) => (
  <button onClick={onClick} className="w-full py-3 px-3 bg-[#111111] rounded-2xl border border-white/5 flex items-start gap-3 text-left">
    <span className="text-[#19DB8A] mt-0.5">{icon}</span>
    <span className="flex-1">
      <span className="block text-white text-sm font-medium">{label}</span>
      {subtitle && <span className="block text-white/40 text-xs">{subtitle}</span>}
    </span>
  </button>
);

const ToggleRow: React.FC<{ icon: React.ReactNode; label: string; value: boolean; onToggle: () => void }> = ({ icon, label, value, onToggle }) => (
  <button onClick={onToggle} className="w-full py-3 px-3 bg-[#111111] rounded-2xl border border-white/5 flex items-center justify-between">
    <span className="flex items-center gap-3 text-white text-sm">
      <span className="text-[#19DB8A]">{icon}</span>
      {label}
    </span>
    <span className={`w-11 h-6 rounded-full p-1 transition-all ${value ? 'bg-[#19DB8A]' : 'bg-white/15'}`}>
      <span className={`block w-4 h-4 rounded-full bg-white transition-all ${value ? 'translate-x-5' : ''}`} />
    </span>
  </button>
);

const SelectRow: React.FC<{ icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; options: Array<{ label: string; value: string }> }> = ({ icon, label, value, onChange, options }) => (
  <div className="py-3 px-3 bg-[#111111] rounded-2xl border border-white/5 flex items-center justify-between">
    <span className="flex items-center gap-3 text-white text-sm">
      <span className="text-[#19DB8A]">{icon}</span>
      {label}
    </span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-white text-sm outline-none">
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#111111]">
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const PermissionRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  status: 'granted' | 'denied' | 'prompt' | 'unknown';
  onGrant: () => void;
  busy?: boolean;
}> = ({ icon, label, status, onGrant, busy }) => {
  const statusLabel =
    status === 'granted' ? 'Autorisée' :
    status === 'denied' ? 'Refusée' :
    status === 'prompt' ? 'À demander' : 'Inconnue';

  return (
    <div className="py-3 px-3 bg-[#111111] rounded-2xl border border-white/5 flex items-center justify-between gap-3">
      <span className="flex items-center gap-3 text-white text-sm">
        <span className="text-[#19DB8A]">{icon}</span>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/50">{statusLabel}</span>
        <button
          onClick={onGrant}
          disabled={busy}
          className="px-3 py-1 rounded-lg bg-[#208050] text-white text-xs disabled:opacity-50"
        >
          {busy ? '...' : 'Gérer'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
