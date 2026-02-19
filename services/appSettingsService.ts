export type AppTheme = 'dark' | 'light' | 'system';
export type AppLanguage = 'fr' | 'en';

export interface AppSettings {
  notificationsLikes: boolean;
  notificationsComments: boolean;
  notificationsFollows: boolean;
  profilePublic: boolean;
  showOnlineStatus: boolean;
  autoplayVideos: boolean;
  dataSaver: boolean;
  language: AppLanguage;
  theme: AppTheme;
}

export const SETTINGS_STORAGE_KEY = 'chooseme_app_settings';
export const SETTINGS_EVENT = 'chooseme:settings-changed';

export const defaultAppSettings: AppSettings = {
  notificationsLikes: true,
  notificationsComments: true,
  notificationsFollows: true,
  profilePublic: true,
  showOnlineStatus: true,
  autoplayVideos: true,
  dataSaver: false,
  language: 'fr',
  theme: 'dark'
};

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultAppSettings;
    return { ...defaultAppSettings, ...JSON.parse(raw) };
  } catch {
    return defaultAppSettings;
  }
}

export function saveAppSettings(next: AppSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  applyTheme(next.theme);
  applyLanguage(next.language);
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: next }));
}

export function applyTheme(theme: AppTheme): void {
  const root = document.documentElement;
  const resolvedTheme =
    theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;

  root.setAttribute('data-theme', resolvedTheme);
  root.style.colorScheme = resolvedTheme;
}

export function applyLanguage(language: AppLanguage): void {
  document.documentElement.lang = language;
}

