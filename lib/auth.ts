/**
 * AUTH HELPERS
 *
 * We use the `jose` library for JWTs instead of `jsonwebtoken` because:
 * - `jose` works in both Node.js AND the Edge Runtime (used by Next.js middleware)
 * - `jsonwebtoken` only works in Node.js environments
 *
 * JWT = JSON Web Token. It's like a tamper-proof ID card:
 *   Header.Payload.Signature
 * The server signs it with a secret; anyone can READ the payload but only
 * the server can CREATE a valid signature.
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'USER' | 'ADMIN';
  name: string;
}

// Convert our secret string to a Uint8Array (bytes) — required by jose
const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-me'
  );

/**
 * Creates a signed JWT token containing user info.
 * Expires in 7 days.
 */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' }) // Algorithm: HMAC-SHA256
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

/**
 * Verifies a JWT and returns its payload, or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null; // Token is invalid, expired, or tampered with
  }
}

/**
 * Gets the current logged-in user from the HTTP cookie.
 * Use this in Server Components and API Routes.
 */
export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('booking_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
