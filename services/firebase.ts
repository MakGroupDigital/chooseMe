import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { useState, useEffect } from 'react';

const firebaseConfig = {
  apiKey: 'AIzaSyCtL0WmFOvrcG0V_0ZSwq4TCnOHRVfGnJM',
  authDomain: 'choose-me-l1izsi.firebaseapp.com',
  projectId: 'choose-me-l1izsi',
  storageBucket: 'choose-me-l1izsi.firebasestorage.app',
  messagingSenderId: '5765431920',
  appId: '1:5765431920:web:7e8f5ae884de10f7ef2ab5'
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
    
    // Activer la persistance offline pour un meilleur support hors ligne
    enableMultiTabIndexedDbPersistence(dbInstance).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Persistance: Plusieurs onglets ouverts');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Persistance non supportée par ce navigateur');
      }
    });
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


