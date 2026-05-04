/**
 * NEXT.JS MIDDLEWARE
 *
 * Middleware runs BEFORE every request reaches your pages or API routes.
 * Think of it as a security guard at the door — it checks if you're allowed
 * in before letting you through.
 *
 * We use it here to:
 * 1. Redirect logged-in users away from /auth pages
 * 2. Redirect logged-out users away from /dashboard and /admin
 * 3. Block non-admins from /admin routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-me'
  );

async function getPayload(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { userId: number; role: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('booking_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/auth');
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');

  // ── If visiting /auth pages ──────────────────────────────────────────────
  if (isAuthPage) {
    if (token) {
      const payload = await getPayload(token);
      if (payload) {
        // Already logged in → redirect to appropriate dashboard
        const dest = payload.role === 'ADMIN' ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return NextResponse.next(); // Not logged in → show auth page
  }

  // ── If visiting protected pages ──────────────────────────────────────────
  if (isDashboard || isAdmin) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const payload = await getPayload(token);
    if (!payload) {
      // Token is invalid/expired → clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('booking_token');
      return response;
    }

    // Admin-only route protection
    if (isAdmin && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Tell Next.js which routes this middleware should run on
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*'],
};
