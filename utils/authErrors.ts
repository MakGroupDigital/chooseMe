export function isFirebaseNetworkError(error: unknown): boolean {
  const err = error as { code?: string; message?: string; name?: string };
  const details = `${err?.code || ''} ${err?.message || ''} ${err?.name || ''}`.toLowerCase();

  return (
    details.includes('auth/network-request-failed') ||
    details.includes('network request failed') ||
    details.includes('err_socket_not_connected') ||
    details.includes('failed to fetch') ||
    details.includes('networkerror')
  );
}

export const FIREBASE_NETWORK_ERROR_MESSAGE =
  'Connexion instable. Vérifiez internet puis réessayez.';
