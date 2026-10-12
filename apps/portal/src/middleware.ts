import { MAINTENANCE_MODE, PORTAL_DEFAULT_TENANT_HOST } from 'astro:env/server';
import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/session';
import { resolveTenant } from './lib/tenant';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/perfil',
  '/seguridad',
  '/prestamo',
  '/credito',
  '/retiro',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // 1) Resolver la marca del tenant por host (para theming global).
  let host =
    context.request.headers.get('x-forwarded-host') ??
    context.request.headers.get('host') ??
    '';
  const isLocal =
    !host || host.startsWith('localhost') || host.startsWith('127.0.0.1');
  if (isLocal && PORTAL_DEFAULT_TENANT_HOST) host = PORTAL_DEFAULT_TENANT_HOST;
  context.locals.tenant = await resolveTenant(host);

  // 2) Modo mantenimiento.
  if (MAINTENANCE_MODE) {
    if (pathname !== '/maintenance') return context.redirect('/maintenance');
    return next();
  }
  if (pathname === '/maintenance') return context.redirect('/');

  // 3) Rutas privadas.
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isProtected) {
    const { access, refresh } = getSession(context.cookies);
    if (!access && !refresh) return context.redirect('/login');
  }

  return next();
});
