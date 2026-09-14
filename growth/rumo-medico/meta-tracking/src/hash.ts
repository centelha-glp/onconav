/**
 * Meta exige SHA-256 em lowercase hex para PII no CAPI.
 * Normalização: email em lowercase trim; telefone só dígitos com DDI.
 */

export async function sha256Hex(value: string): Promise<string> {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('sha256Hex: valor vazio');
  }

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Node.js fallback
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Telefone BR: mantém apenas dígitos; prefixa 55 se ausente. */
export function normalizePhone(phone: string, defaultCountryCode = '55'): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith(defaultCountryCode)) return digits;
  // Remove 0 inicial de DDD (ex.: 027 → 27)
  const withoutLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;
  return `${defaultCountryCode}${withoutLeadingZero}`;
}
