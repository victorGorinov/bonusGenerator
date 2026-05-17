import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';

describe('Security headers (CSP)', () => {
  const pages = ['/campaign-generator.html', '/', '/campaign-generator.html'];

  it('script-src-attr must not be "none" — inline onclick handlers would silently break', async () => {
    const res = await request(app).get('/campaign-generator.html');
    const csp = res.headers['content-security-policy'] ?? '';
    expect(csp).toBeTruthy();

    // Helmet 8+ sets script-src-attr 'none' by default, blocking onclick/onload attributes.
    // Our HTML files use inline event handlers, so 'none' here would break all buttons.
    const match = csp.match(/script-src-attr\s+([^;]+)/);
    const value = match?.[1]?.trim() ?? '';
    expect(value).not.toBe("'none'");
    expect(value).toContain("'unsafe-inline'");
  });

  it('script-src allows unsafe-inline for inline script blocks', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'] ?? '';
    const match = csp.match(/(?:^|;)\s*script-src\s+([^;]+)/);
    const value = match?.[1]?.trim() ?? '';
    expect(value).toContain("'unsafe-inline'");
  });

  it('connect-src is self-only (no external API leakage)', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'] ?? '';
    const match = csp.match(/connect-src\s+([^;]+)/);
    const value = match?.[1]?.trim() ?? '';
    expect(value).toBe("'self'");
  });
});
