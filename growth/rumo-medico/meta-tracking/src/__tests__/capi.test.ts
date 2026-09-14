import { describe, expect, it } from 'vitest';
import { buildCapiEvent } from '../capi';

describe('buildCapiEvent', () => {
  it('monta payload Lead com event_id e PII hasheada', async () => {
    const event = await buildCapiEvent({
      eventName: 'Lead',
      eventId: 'test-event-id-123',
      eventSourceUrl: 'https://rumomedico.com.br/lista',
      userData: {
        email: 'medico@exemplo.com',
        phone: '27999887766',
        fbp: 'fb.1.123.456',
      },
      customData: {
        content_name: 'Lista de espera',
        lead_source: 'landing',
      },
    });

    expect(event.event_name).toBe('Lead');
    expect(event.event_id).toBe('test-event-id-123');
    expect(event.action_source).toBe('website');
    expect(event.event_source_url).toBe('https://rumomedico.com.br/lista');
    expect(event.user_data.em).toHaveLength(1);
    expect(event.user_data.ph).toHaveLength(1);
    expect(event.user_data.fbp).toBe('fb.1.123.456');
    expect(event.custom_data?.lead_source).toBe('landing');
  });
});
