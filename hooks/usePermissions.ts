import { useState, useCallback, useEffect } from 'react';
import { permissionService, PermissionType } from '../services/permissionService';

interface PermissionRequest {
  title: string;
  description: string;
  icon: string;
  onAllow: () => Promise<void>;
  onDeny: () => void;
}

export const usePermissions = () => {
  const [currentPermission, setCurrentPermission] = useState<PermissionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handlePermissionRequest = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as PermissionRequest;
      setCurrentPermission(detail);
      setIsModalOpen(true);
    };

    window.addEventListener('permissionRequest', handlePermissionRequest);
    return () => window.removeEventListener('permissionRequest', handlePermissionRequest);
  }, []);

  const handleAllow = useCallback(async () => {
    if (currentPermission) {
      try {
        await currentPermission.onAllow();
        setIsModalOpen(false);
        setCurrentPermission(null);
      } catch (e) {
        console.error('Permission error:', e);
      }
    }
  }, [currentPermission]);

  const handleDeny = useCallback(() => {
    if (currentPermission) {
      currentPermission.onDeny();
      setIsModalOpen(false);
      setCurrentPermission(null);
    }
  }, [currentPermission]);

  const requestCamera = useCallback(() => permissionService.requestCamera(), []);
  const requestMicrophone = useCallback(() => permissionService.requestMicrophone(), []);
  const requestNotifications = useCallback(() => permissionService.requestNotifications(), []);
  const requestLocation = useCallback(() => permissionService.requestLocation(), []);
  const requestStorage = useCallback(() => permissionService.requestStorage(), []);

  return {
    isModalOpen,
    currentPermission,
    handleAllow,
    handleDeny,
    requestCamera,
    requestMicrophone,
    requestNotifications,
    requestLocation,
    requestStorage,
    getPermissionState: (type: PermissionType) => permissionService.getPermissionState(type),
    getAllPermissions: () => permissionService.getAllPermissions()
  };
};
