import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

const requiredFirebaseEnv = [
  ['PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
] as const;

export const missingFirebaseEnvKeys = requiredFirebaseEnv
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const hasFirebaseConfig = missingFirebaseEnvKeys.length === 0;

let auth: Auth | null = null;
let db: Firestore | null = null;

if (hasFirebaseConfig) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
