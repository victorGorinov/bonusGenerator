import { describe, it, expect } from 'vitest';
import ms from 'ms';
import { signAuthToken, verifyAuthToken, JWT_EXPIRY_MS } from '../../src/domain/auth/jwt.js';
import { JWT_EXPIRY } from '../../src/config/index.js';

const payload = { sub: 'user-123', name: 'Alice', email: 'alice@example.com' };

describe('JWT_EXPIRY_MS', () => {
  it('matches JWT_EXPIRY parsed by ms() — keeps the session cookie in sync with the token', () => {
    expect(JWT_EXPIRY_MS).toBe(ms(JWT_EXPIRY));
  });
});

describe('signAuthToken / verifyAuthToken', () => {
  it('round-trips the payload', () => {
    const token = signAuthToken(payload);
    const decoded = verifyAuthToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.name).toBe(payload.name);
    expect(decoded.email).toBe(payload.email);
  });

  it('rejects a tampered token', () => {
    const token = signAuthToken(payload);
    const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa');
    expect(() => verifyAuthToken(tampered)).toThrow();
  });

  it('rejects garbage input', () => {
    expect(() => verifyAuthToken('not-a-jwt')).toThrow();
  });
});
