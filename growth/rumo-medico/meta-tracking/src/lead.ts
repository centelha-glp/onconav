import { sendCapiEvent } from './capi';
import { generateEventId } from './event-id';
import { getMetaBrowserCookies, trackPixelEvent } from './pixel';
import type { MetaCapiConfig, MetaCustomData, MetaUserData } from './types';

export interface TrackLeadInput {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  eventSourceUrl?: string;
  customData?: MetaCustomData;
  /** Headers do request no servidor (CAPI) */
  serverContext?: {
    clientIpAddress?: string;
    clientUserAgent?: string;
  };
}

export interface TrackLeadResult {
  eventId: string;
  pixelTracked: boolean;
  capiResult?: Awaited<ReturnType<typeof sendCapiEvent>>;
}

/**
 * Fluxo completo Lead: Pixel (browser) + CAPI (servidor) com mesmo event_id.
 *
 * No browser: chamar trackLeadClient() após submit do formulário.
 * No servidor: chamar trackLeadServer() com o eventId retornado pelo client.
 */
export function trackLeadClient(
  input: Pick<TrackLeadInput, 'email' | 'phone' | 'firstName' | 'lastName' | 'customData'>,
  eventId?: string
): TrackLeadResult {
  const id = eventId ?? generateEventId();
  const { eventId: trackedId } = trackPixelEvent({
    eventName: 'Lead',
    eventId: id,
    customData: {
      content_name: 'Lista de espera Rumo Médico',
      content_category: 'lead_capture',
      lead_source: 'landing',
      ...input.customData,
    },
    userData: {
      email: input.email,
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });

  return { eventId: trackedId, pixelTracked: true };
}

export async function trackLeadServer(
  config: MetaCapiConfig,
  input: TrackLeadInput,
  eventId: string
): Promise<TrackLeadResult> {
  const browserCookies =
    typeof document !== 'undefined' ? getMetaBrowserCookies() : {};

  const userData: MetaUserData = {
    email: input.email,
    phone: input.phone,
    firstName: input.firstName,
    lastName: input.lastName,
    fbp: browserCookies.fbp,
    fbc: browserCookies.fbc,
    clientIpAddress: input.serverContext?.clientIpAddress,
    clientUserAgent: input.serverContext?.clientUserAgent,
  };

  const capiResult = await sendCapiEvent(config, {
    eventName: 'Lead',
    eventId,
    userData,
    eventSourceUrl: input.eventSourceUrl,
    customData: {
      content_name: 'Lista de espera Rumo Médico',
      content_category: 'lead_capture',
      lead_source: 'landing',
      ...input.customData,
    },
  });

  return {
    eventId,
    pixelTracked: false,
    capiResult,
  };
}
