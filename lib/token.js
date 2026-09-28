import crypto from 'crypto';

// A long, random, URL-safe token that acts as the "password" for the
// no-login dashboard. 24 random bytes -> a 32-character string. Not
// guessable, never reused, and never logged anywhere.
export function generateToken() {
  return crypto.randomBytes(24).toString('base64url');
}
