import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('spiceindia_auth');
  const path = request.nextUrl.pathname;

  // Paths that bypass auth
  const isPublicPath = path === '/login' || path.startsWith('/api/auth');

  // If there's no auth cookie and it's not a public path, redirect to login
  if (!authCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there IS an auth cookie and they are on the login page, redirect to home
  if (authCookie && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
