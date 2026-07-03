import type { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import { registerUser, loginUser, getUserById } from '../use-cases/Auth.js';
import { signAuthToken, JWT_EXPIRY_MS } from '../domain/auth/jwt.js';
import { AUTH_COOKIE } from '../middleware/requireAuth.js';
import { ENV, COOKIE_DOMAIN } from '../config/index.js';
import type { RegisterInput, LoginInput } from '../validation/auth.schema.js';

interface Deps { db: Pool }

function setAuthCookie(res: import('express').Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly:  true,
    secure:    ENV.NODE_ENV === 'production' || ENV.NODE_ENV === 'staging',
    sameSite:  'strict',
    maxAge:    JWT_EXPIRY_MS,
    domain:    COOKIE_DOMAIN || undefined,
    path:      '/',
  });
}

export function createAuthController({ db }: Deps) {
  return {
    register: asyncHandler<Record<string, never>, unknown, RegisterInput>(
      async (req, res) => {
        const user = await registerUser(db, req.body);
        const token = signAuthToken({ sub: user.id, name: user.name, email: user.email });
        setAuthCookie(res, token);
        res.status(201).json({ user });
      },
    ),

    login: asyncHandler<Record<string, never>, unknown, LoginInput>(
      async (req, res) => {
        const user = await loginUser(db, req.body);
        const token = signAuthToken({ sub: user.id, name: user.name, email: user.email });
        setAuthCookie(res, token);
        res.json({ user });
      },
    ),

    logout: asyncHandler(async (_req, res) => {
      res.clearCookie(AUTH_COOKIE, { path: '/', domain: COOKIE_DOMAIN || undefined });
      res.json({ ok: true });
    }),

    me: asyncHandler(async (req, res) => {
      if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
      // Re-fetch rather than trusting req.user (decoded from the JWT): catches
      // an account deleted after the token was issued (404 below) and returns
      // name/email fresher than a cookie that can be stale for up to JWT_EXPIRY.
      const user = await getUserById(db, req.user.id);
      if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
      res.json({ user });
    }),
  };
}
