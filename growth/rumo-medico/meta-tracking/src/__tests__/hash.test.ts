import { describe, expect, it } from 'vitest';
import { normalizeEmail, normalizePhone, sha256Hex } from '../hash';

describe('normalizeEmail', () => {
  it('lowercase e trim', () => {
    expect(normalizeEmail('  Medico@Exemplo.COM  ')).toBe('medico@exemplo.com');
  });
});

describe('normalizePhone', () => {
  it('adiciona DDI 55', () => {
    expect(normalizePhone('27999887766')).toBe('5527999887766');
  });

  it('remove zero inicial do DDD', () => {
    expect(normalizePhone('027999887766')).toBe('5527999887766');
  });

  it('mantém DDI existente', () => {
    expect(normalizePhone('5527999887766')).toBe('5527999887766');
  });
});

describe('sha256Hex', () => {
  it('hash determinístico conhecido', async () => {
    const hash = await sha256Hex('test@example.com');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(
      '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
    );
  });
});
