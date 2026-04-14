import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../../services/firebase';

const provider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase auth no configurado');
  }
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function subscribeAuth(listener: (user: User | null) => void): () => void {
  if (!auth) {
    listener(null);
    return () => {};
  }
  return onAuthStateChanged(auth, listener);
}
