import { normalizeEmail, normalizePhone, sha256Hex } from './hash';
import type {
  MetaCapiConfig,
  MetaCapiEventPayload,
  MetaTrackParams,
  MetaUserData,
} from './types';

async function buildUserData(
  userData: MetaUserData | undefined
): Promise<Record<string, string | string[]>> {
  const result: Record<string, string | string[]> = {};

  if (!userData) return result;

  if (userData.email) {
    result.em = [await sha256Hex(normalizeEmail(userData.email))];
  }
  if (userData.phone) {
    const normalized = normalizePhone(userData.phone);
    if (normalized) {
      result.ph = [await sha256Hex(normalized)];
    }
  }
  if (userData.firstName) {
    result.fn = [await sha256Hex(userData.firstName.trim().toLowerCase())];
  }
  if (userData.lastName) {
    result.ln = [await sha256Hex(userData.lastName.trim().toLowerCase())];
  }
  if (userData.fbp) result.fbp = userData.fbp;
  if (userData.fbc) result.fbc = userData.fbc;
  if (userData.clientIpAddress) result.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent) result.client_user_agent = userData.clientUserAgent;

  return result;
}

export async function buildCapiEvent(
  params: MetaTrackParams
): Promise<MetaCapiEventPayload> {
  const user_data = await buildUserData(params.userData);

  const payload: MetaCapiEventPayload = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    action_source: 'website',
    user_data,
  };

  if (params.eventSourceUrl) {
    payload.event_source_url = params.eventSourceUrl;
  }
  if (params.customData && Object.keys(params.customData).length > 0) {
    payload.custom_data = params.customData;
  }

  return payload;
}

export interface SendCapiResult {
  success: boolean;
  eventsReceived?: number;
  fbtrace_id?: string;
  error?: string;
}

/**
 * Envia evento ao Conversions API (servidor).
 * Usar o mesmo event_id enviado pelo Pixel no browser.
 */
export async function sendCapiEvent(
  config: MetaCapiConfig,
  params: MetaTrackParams
): Promise<SendCapiResult> {
  const apiVersion = config.apiVersion ?? 'v21.0';
  const event = await buildCapiEvent(params);

  const body: Record<string, unknown> = {
    data: [event],
  };
  if (config.testEventCode) {
    body.test_event_code = config.testEventCode;
  }

  const url = `https://graph.facebook.com/${apiVersion}/${config.pixelId}/events?access_token=${encodeURIComponent(config.accessToken)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as {
    events_received?: number;
    fbtrace_id?: string;
    error?: { message: string };
  };

  if (!response.ok) {
    return {
      success: false,
      error: json.error?.message ?? `HTTP ${response.status}`,
      fbtrace_id: json.fbtrace_id,
    };
  }

  return {
    success: true,
    eventsReceived: json.events_received,
    fbtrace_id: json.fbtrace_id,
  };
}
