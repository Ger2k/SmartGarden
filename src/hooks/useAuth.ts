import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { loginWithGoogle, logout, subscribeAuth } from '../features/auth/authService';

const DEMO_USER_KEY = 'sg_demo_user';

export type AuthUser = {
  uid: string;
  displayName?: string;
  email?: string;
  provider: 'firebase' | 'demo';
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
  clearCookie('sg_demo_uid');
}

function setDemoSessionCookies(uid: string) {
  setCookie('sg_auth_mode', 'demo', 86400);
  setCookie('sg_demo_uid', uid, 86400);
  clearCookie('sg_id_token');
}

function setFirebaseSessionCookies(idToken: string) {
  setCookie('sg_auth_mode', 'firebase', 3600);
  setCookie('sg_id_token', idToken, 3600);
  clearCookie('sg_demo_uid');
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
    const demoRaw = localStorage.getItem(DEMO_USER_KEY);
    if (demoRaw) {
      try {
        const demoUser = JSON.parse(demoRaw) as AuthUser;
        setUser(demoUser);
        setDemoSessionCookies(demoUser.uid);
      } catch {
        localStorage.removeItem(DEMO_USER_KEY);
      }
      setLoading(false);
      return;
    }

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
      setError(`No se pudo iniciar sesion con Google${code}.${detail} Si aun no configuraste Firebase, usa el modo demo.`);
      return false;
    }
  };

  const signInDemo = () => {
    const demoUser: AuthUser = {
      uid: 'demo-user',
      displayName: 'Usuario demo',
      email: 'demo@smartgarden.local',
      provider: 'demo',
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setDemoSessionCookies(demoUser.uid);
    setUser(demoUser);
    setLoading(false);
    setError(null);
    return true;
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    clearSessionCookies();
    setUser(null);

    try {
      await logout();
    } catch {
      // No-op: demo mode does not need Firebase logout.
    }
  };

  return { user, loading, error, signIn, signInDemo, signOut };
}
