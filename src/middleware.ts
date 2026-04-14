import { defineMiddleware } from 'astro:middleware';

const protectedRoutes = ['/dashboard', '/plants', '/tasks', '/calendar'];

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const needsAuth = protectedRoutes.some((route) => url.pathname.startsWith(route));
  if (!needsAuth) return next();

  const hasAuthCookie = cookies.get('sg_auth')?.value === '1';
  if (!hasAuthCookie) {
    return redirect('/login');
  }

  return next();
});
