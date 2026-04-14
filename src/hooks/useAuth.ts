import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { loginWithGoogle, logout, subscribeAuth } from '../features/auth/authService';

export type AuthUser = {
  uid: string;
  displayName?: string;
  email?: string;
  provider: 'firebase';
};

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function clearSessionCookies() {
  clearCookie('sg_auth_mode');
  clearCookie('sg_id_token');
}

function setFirebaseSessionCookies(idToken: string) {
  setCookie('sg_auth_mode', 'firebase', 3600);
  setCookie('sg_id_token', idToken, 3600);
}

function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName ?? undefined,
    email: user.email ?? undefined,
    provider: 'firebase',
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeAuth((nextUser) => {
        const syncAuthState = async () => {
          if (nextUser) {
            const idToken = await nextUser.getIdToken();
            setFirebaseSessionCookies(idToken);
            setUser(mapFirebaseUser(nextUser));
          } else {
            clearSessionCookies();
            setUser(null);
          }
          setLoading(false);
        };

        void syncAuthState();
      });
      return unsubscribe;
    } catch {
      setLoading(false);
      return;
    }
  }, []);

  const signIn = async (): Promise<boolean> => {
    setError(null);
    try {
      const firebaseUser = await loginWithGoogle();
      const idToken = await firebaseUser.getIdToken();
      setFirebaseSessionCookies(idToken);
      setUser(mapFirebaseUser(firebaseUser));
      return true;
    } catch (error) {
      const maybeError = error as { code?: string; message?: string };
      const code = maybeError?.code ? ` (${maybeError.code})` : '';
      const detail = maybeError?.message ? ` ${maybeError.message}` : '';
      setError(`No se pudo iniciar sesion con Google${code}.${detail}`);
      return false;
    }
  };

  const signOut = async () => {
    clearSessionCookies();
    setUser(null);

    try {
      await logout();
    } catch {}
  };

  return { user, loading, error, signIn, signOut };
}
