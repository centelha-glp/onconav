/**
 * Gera event_id compartilhado entre Pixel (browser) e CAPI (servidor).
 * Obrigatório para deduplicação — sem isso a conversão conta duas vezes.
 */
export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback para ambientes sem crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
