import { describe, expect, it } from 'vitest';
import { generateEventId } from '../event-id';

describe('generateEventId', () => {
  it('gera IDs únicos', () => {
    const a = generateEventId();
    const b = generateEventId();
    expect(a).not.toBe(b);
  });

  it('gera string não vazia', () => {
    expect(generateEventId().length).toBeGreaterThan(0);
  });
});
