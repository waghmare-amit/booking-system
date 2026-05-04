import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });
  // Delete the cookie by setting maxAge to 0
  response.cookies.set('booking_token', '', { maxAge: 0, path: '/' });
  return response;
}
