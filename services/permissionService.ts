// Permission Service - Gestion moderne des permissions avec UI personnalisée

export type PermissionType = 'camera' | 'microphone' | 'storage' | 'location' | 'notifications';

export interface PermissionRequest {
  type: PermissionType;
  title: string;
  description: string;
  icon: string;
  onAllow: () => Promise<void>;
  onDeny: () => void;
}

export interface PermissionState {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  storage: 'granted' | 'denied' | 'prompt' | 'unknown';
  location: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'prompt' | 'unknown';
}

class PermissionService {
  private permissionStates: PermissionState = {
    camera: 'unknown',
    microphone: 'unknown',
    storage: 'unknown',
    location: 'unknown',
    notifications: 'unknown'
  };

  private permissionCallbacks: Map<PermissionType, (granted: boolean) => void> = new Map();
  private readonly STORAGE_KEY = 'chooseme_permissions';

  constructor() {
    this.loadPermissionsFromStorage();
  }

  /**
   * Charger les permissions depuis localStorage
   */
  private loadPermissionsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const permissions = JSON.parse(stored);
        this.permissionStates = { ...this.permissionStates, ...permissions };
      }
    } catch (e) {
      console.error('Erreur chargement permissions:', e);
    }
  }

  /**
   * Sauvegarder les permissions dans localStorage
   */
  private savePermissionsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.permissionStates));
    } catch (e) {
      console.error('Erreur sauvegarde permissions:', e);
    }
  }

  /**
   * Demander la permission caméra
   */
  async requestCamera(): Promise<boolean> {
    // Si déjà accordée, retourner true directement
    if (this.permissionStates.camera === 'granted') {
      return true;
    }

    // Si déjà refusée, retourner false directement
    if (this.permissionStates.camera === 'denied') {
      return false;
    }

    return this.requestPermission('camera', {
      type: 'camera',
      title: 'Accès à la caméra',
      description: 'Choose Me a besoin d\'accéder à votre caméra pour filmer vos performances.',
      icon: '📹',
      onAllow: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          this.permissionStates.camera = 'granted';
          this.savePermissionsToStorage();
        } catch (e) {
          this.permissionStates.camera = 'denied';
          this.savePermissionsToStorage();
          throw e;
        }
      },
      onDeny: () => {
        this.permissionStates.camera = 'denied';
        this.savePermissionsToStorage();
      }
    });
  }

  /**
   * Demander la permission microphone
   */
  async requestMicrophone(): Promise<boolean> {
    // Si déjà accordée, retourner true directement
    if (this.permissionStates.microphone === 'granted') {
      return true;
    }

    // Si déjà refusée, retourner false directement
    if (this.permissionStates.microphone === 'denied') {
      return false;
    }

    return this.requestPermission('microphone', {
      type: 'microphone',
      title: 'Accès au microphone',
      description: 'Choose Me a besoin d\'accéder à votre microphone pour enregistrer l\'audio de vos vidéos.',
      icon: '🎤',
      onAllow: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          this.permissionStates.microphone = 'granted';
          this.savePermissionsToStorage();
        } catch (e) {
          this.permissionStates.microphone = 'denied';
          this.savePermissionsToStorage();
          throw e;
        }
      },
      onDeny: () => {
        this.permissionStates.microphone = 'denied';
        this.savePermissionsToStorage();
      }
    });
  }

  /**
   * Demander la permission notifications
   */
  async requestNotifications(): Promise<boolean> {
    // Si déjà accordée, retourner true directement
    if (this.permissionStates.notifications === 'granted') {
      return true;
    }

    // Si déjà refusée, retourner false directement
    if (this.permissionStates.notifications === 'denied') {
      return false;
    }

    return this.requestPermission('notifications', {
      type: 'notifications',
      title: 'Notifications',
      description: 'Choose Me souhaite vous envoyer des notifications pour vous tenir informé des interactions sur vos vidéos.',
      icon: '🔔',
      onAllow: async () => {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            this.permissionStates.notifications = 'granted';
            this.savePermissionsToStorage();
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permissionStates.notifications = permission === 'granted' ? 'granted' : 'denied';
            this.savePermissionsToStorage();
          }
        }
      },
      onDeny: () => {
        this.permissionStates.notifications = 'denied';
        this.savePermissionsToStorage();
      }
    });
  }

  /**
   * Demander la permission localisation
   */
  async requestLocation(): Promise<boolean> {
    // Si déjà accordée, retourner true directement
    if (this.permissionStates.location === 'granted') {
      return true;
    }

    // Si déjà refusée, retourner false directement
    if (this.permissionStates.location === 'denied') {
      return false;
    }

    return this.requestPermission('location', {
      type: 'location',
      title: 'Accès à la localisation',
      description: 'Choose Me a besoin de votre localisation pour améliorer votre expérience et les recommandations.',
      icon: '📍',
      onAllow: async () => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              this.permissionStates.location = 'granted';
              this.savePermissionsToStorage();
              resolve();
            },
            () => {
              this.permissionStates.location = 'denied';
              this.savePermissionsToStorage();
              reject(new Error('Location denied'));
            }
          );
        });
      },
      onDeny: () => {
        this.permissionStates.location = 'denied';
        this.savePermissionsToStorage();
      }
    });
  }

  /**
   * Demander la permission stockage
   */
  async requestStorage(): Promise<boolean> {
    // Si déjà accordée, retourner true directement
    if (this.permissionStates.storage === 'granted') {
      return true;
    }

    // Si déjà refusée, retourner false directement
    if (this.permissionStates.storage === 'denied') {
      return false;
    }

    return this.requestPermission('storage', {
      type: 'storage',
      title: 'Accès au stockage',
      description: 'Choose Me a besoin d\'accéder à votre stockage pour importer et sauvegarder vos vidéos.',
      icon: '💾',
      onAllow: async () => {
        // Pour le web, on simule l'accès au stockage
        this.permissionStates.storage = 'granted';
        this.savePermissionsToStorage();
      },
      onDeny: () => {
        this.permissionStates.storage = 'denied';
        this.savePermissionsToStorage();
      }
    });
  }

  /**
   * Demander une permission générique
   */
  private async requestPermission(type: PermissionType, request: PermissionRequest): Promise<boolean> {
    return new Promise((resolve) => {
      // Créer un événement personnalisé pour afficher la modale
      const event = new CustomEvent('permissionRequest', {
        detail: {
          ...request,
          onAllow: async () => {
            try {
              await request.onAllow();
              this.permissionCallbacks.get(type)?.(true);
              resolve(true);
            } catch (e) {
              console.error(`Permission ${type} denied:`, e);
              resolve(false);
            }
          },
          onDeny: () => {
            request.onDeny();
            this.permissionCallbacks.get(type)?.(false);
            resolve(false);
          }
        }
      });

      window.dispatchEvent(event);
    });
  }

  /**
   * Vérifier l'état d'une permission
   */
  getPermissionState(type: PermissionType): PermissionState[PermissionType] {
    return this.permissionStates[type];
  }

  /**
   * Obtenir tous les états des permissions
   */
  getAllPermissions(): PermissionState {
    return { ...this.permissionStates };
  }

  /**
   * Réinitialiser les permissions
   */
  resetPermissions(): void {
    this.permissionStates = {
      camera: 'unknown',
      microphone: 'unknown',
      storage: 'unknown',
      location: 'unknown',
      notifications: 'unknown'
    };
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Enregistrer un callback pour une permission
   */
  onPermissionChange(type: PermissionType, callback: (granted: boolean) => void): void {
    this.permissionCallbacks.set(type, callback);
  }
}

export const permissionService = new PermissionService();
