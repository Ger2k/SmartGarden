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

function setAuthCookie(enabled: boolean) {
  if (enabled) {
    document.cookie = 'sg_auth=1; path=/; max-age=86400; samesite=lax';
    return;
  }
  document.cookie = 'sg_auth=; path=/; max-age=0; samesite=lax';
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
        setAuthCookie(true);
      } catch {
        localStorage.removeItem(DEMO_USER_KEY);
      }
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = subscribeAuth((nextUser) => {
        if (nextUser) {
          setAuthCookie(true);
          setUser(mapFirebaseUser(nextUser));
        } else {
          setAuthCookie(false);
          setUser(null);
        }
        setLoading(false);
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
      await loginWithGoogle();
      return true;
    } catch {
      setError('No se pudo iniciar sesion con Google. Si aun no configuraste Firebase, usa el modo demo.');
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
    setAuthCookie(true);
    setUser(demoUser);
    setLoading(false);
    setError(null);
    return true;
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    setAuthCookie(false);
    setUser(null);

    try {
      await logout();
    } catch {
      // No-op: demo mode does not need Firebase logout.
    }
  };

  return { user, loading, error, signIn, signInDemo, signOut };
}
