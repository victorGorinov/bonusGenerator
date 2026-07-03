import type { Request } from 'express';
import { verifyAuthToken } from '../domain/auth/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: string; name: string; email: string } }
  }
}

export const AUTH_COOKIE = '_bt';

// Shared core for requireAuth/optionalAuth: decode the session cookie into a
// user, or undefined if it's missing/invalid. Callers decide what "no user"
// means for their route (401 vs. proceed as guest).
export function resolveUser(req: Request): { id: string; name: string; email: string } | undefined {
  const token = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
  if (!token) return undefined;
  try {
    const payload = verifyAuthToken(token);
    return { id: payload.sub, name: payload.name, email: payload.email };
  } catch {
    return undefined;
  }
}
