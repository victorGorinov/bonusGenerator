import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema } from '../../src/validation/auth.schema.js';

describe('auth schema — email normalization', () => {
  it('RegisterSchema lowercases and trims email', () => {
    const result = RegisterSchema.parse({ name: 'Alice', email: '  Alice@Example.com  ', password: 'correcthorse' });
    expect(result.email).toBe('alice@example.com');
  });

  it('LoginSchema lowercases and trims email', () => {
    const result = LoginSchema.parse({ email: '  Alice@Example.com  ', password: 'x' });
    expect(result.email).toBe('alice@example.com');
  });

  it('still rejects a malformed email after normalization', () => {
    expect(() => LoginSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow();
  });
});
