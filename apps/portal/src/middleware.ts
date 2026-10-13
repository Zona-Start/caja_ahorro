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

/**
 * Aplica cabeceras "sin caché" a TODO lo que no sea asset estático (`/_astro/`).
 * Evita que el navegador / View Transitions sirvan páginas de otro usuario o
 * de otra pestaña (fuga de datos entre sesiones y tabs).
 */
function noStore(response: Response, pathname: string): Response {
  if (!pathname.startsWith('/_astro/')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Vary', 'Cookie');
  }
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // 1) Resolver la marca del tenant por host (theming global).
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
    if (pathname !== '/maintenance') {
      return noStore(context.redirect('/maintenance'), pathname);
    }
    return noStore(await next(), pathname);
  }
  if (pathname === '/maintenance') {
    return noStore(context.redirect('/'), pathname);
  }

  // 3) Rutas privadas.
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isProtected) {
    const { access, refresh } = getSession(context.cookies);
    if (!access && !refresh) {
      return noStore(context.redirect('/login'), pathname);
    }
  }

  return noStore(await next(), pathname);
});
