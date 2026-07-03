import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/domain/auth/hashPassword.js';

describe('hashPassword / verifyPassword', () => {
  it('produces a bcrypt hash different from the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies a matching password', async () => {
    const hash = await hashPassword('my-secret-pw');
    await expect(verifyPassword('my-secret-pw', hash)).resolves.toBe(true);
  });

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('my-secret-pw');
    await expect(verifyPassword('wrong-pw', hash)).resolves.toBe(false);
  });

  it('salts each hash differently for the same input', async () => {
    const [h1, h2] = await Promise.all([hashPassword('same-pw'), hashPassword('same-pw')]);
    expect(h1).not.toBe(h2);
  });
});
