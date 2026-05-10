import { browserLocalPersistence, GoogleAuthProvider, setPersistence, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

export type GoogleAuthMode = 'login' | 'signup';

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return provider;
}

export async function startGoogleAuth(mode: GoogleAuthMode = 'login'): Promise<void> {
  sessionStorage.setItem('chooseMe.googleAuthMode', mode);
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  await signInWithPopup(auth, createGoogleProvider());
}

export function getGoogleAuthMode(): GoogleAuthMode {
  const mode = sessionStorage.getItem('chooseMe.googleAuthMode');
  return mode === 'signup' ? 'signup' : 'login';
}
