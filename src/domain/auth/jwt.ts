import jwt from 'jsonwebtoken';
import ms from 'ms';
import { JWT_SECRET, JWT_EXPIRY } from '../../config/index.js';

export interface AuthTokenPayload {
  sub:   string;
  name:  string;
  email: string;
}

// Same parser jsonwebtoken itself uses for a string `expiresIn` — reusing it
// here keeps the session cookie's lifetime in sync with the token's actual
// validity window instead of a separately hardcoded constant.
export const JWT_EXPIRY_MS = ms(JWT_EXPIRY as ms.StringValue);

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY as jwt.SignOptions['expiresIn'] });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string' || !('sub' in decoded)) {
    throw new Error('Invalid token payload');
  }
  return decoded as unknown as AuthTokenPayload;
}
