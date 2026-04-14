import { defineMiddleware } from 'astro:middleware';

const protectedRoutes = ['/dashboard', '/plants', '/tasks', '/calendar'];

async function verifyFirebaseIdToken(idToken: string, apiKey?: string): Promise<boolean> {
  if (!apiKey || !idToken) return false;

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) return false;
    const payload = (await response.json()) as { users?: unknown[] };
    return Array.isArray(payload.users) && payload.users.length > 0;
  } catch {
    return false;
  }
}

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const needsAuth = protectedRoutes.some((route) => url.pathname.startsWith(route));
  if (!needsAuth) return next();

  const authMode = cookies.get('sg_auth_mode')?.value;

  if (authMode === 'demo') {
    const hasDemoUser = Boolean(cookies.get('sg_demo_uid')?.value);
    const demoEnabled = import.meta.env.DEV || import.meta.env.PUBLIC_ENABLE_DEMO === 'true';
    if (demoEnabled && hasDemoUser) {
      return next();
    }
    return redirect('/login');
  }

  if (authMode === 'firebase') {
    const idToken = cookies.get('sg_id_token')?.value ?? '';
    const isValid = await verifyFirebaseIdToken(idToken, import.meta.env.PUBLIC_FIREBASE_API_KEY);
    if (isValid) {
      return next();
    }
    return redirect('/login');
  }

  return redirect('/login');
});
