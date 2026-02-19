import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { useState, useEffect } from 'react';

// Configuration Firebase depuis les variables d'environnement Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCtL0WmFOvrcG0V_0ZSwq4TCnOHRVfGnJM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'choose-me-l1izsi.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'choose-me-l1izsi',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'choose-me-l1izsi.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '5765431920',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:5765431920:web:7e8f5ae884de10f7ef2ab5'
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export function getFirestoreDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
    // La persistance est activée par défaut dans Firestore v9+
    // Pas besoin d'appeler enableMultiTabIndexedDbPersistence()
  }
  return dbInstance;
}

// Hook pour l'authentification
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { currentUser, loading };
}

// Exports pour compatibilité
export const auth = getFirebaseAuth();
export const db = getFirestoreDb();


