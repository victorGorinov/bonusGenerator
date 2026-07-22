import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';

describe('Security headers (CSP)', () => {
  it('script-src-attr must allow unsafe-inline — onclick handlers in HTML', async () => {
    const res = await request(app).get('/campaign-generator.html');
    const csp = res.headers['content-security-policy'] ?? '';
    expect(csp).toBeTruthy();

    // Helmet 8+ sets script-src-attr 'none' by default, blocking onclick/onload attributes.
    // Our HTML files use inline event handlers — 'unsafe-inline' required until converted to addEventListener.
    const match = csp.match(/script-src-attr\s+([^;]+)/);
    const value = match?.[1]?.trim() ?? '';
    expect(value).not.toBe("'none'");
    expect(value).toContain("'unsafe-inline'");
  });

  it("script-src is 'self' only — no unsafe-inline (all JS is in external files)", async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'] ?? '';
    const match = csp.match(/(?:^|;)\s*script-src\s+([^;]+)/);
    const value = match?.[1]?.trim() ?? '';
    expect(value).toContain("'self'");
    expect(value).not.toContain("'unsafe-inline'");
  });

  it('connect-src is self + Google Analytics only (no other external API leakage)', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'] ?? '';
    const match = csp.match(/connect-src\s+([^;]+)/);
    const value = match?.[1]?.trim() ?? '';
    // 'self' plus the GA4 beacon/config endpoints — nothing else.
    const allowed = new Set([
      "'self'",
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
    ]);
    expect(value).toContain("'self'");
    for (const src of value.split(/\s+/)) {
      expect(allowed.has(src)).toBe(true);
    }
  });
});
