import authConfig from '@/lib/auth.config';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

const publicRoutes = ['/'];

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req: any) {
  const { nextUrl, auth } = req;
  const isLoggedIn = !!auth?.user;

  // Ruta solicitada
  const requestedPath = nextUrl.pathname;
  // Permitir siempre el acceso a las rutas de API
  if (requestedPath.startsWith('/api')) {
    return NextResponse.next();
  }

  if (requestedPath.startsWith('/dashboard') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Redirigir si el usuario está logueado y está intentando acceder a rutas públicas
  if (
    (isLoggedIn && publicRoutes.includes(requestedPath)) ||
    (isLoggedIn && requestedPath.startsWith('/codigo'))
  ) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
} as any);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
