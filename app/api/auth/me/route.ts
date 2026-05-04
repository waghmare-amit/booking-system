/**
 * GET /api/auth/me
 * Returns the currently logged-in user's info from their JWT cookie.
 * Used by the frontend to know who's logged in without hitting the database.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
