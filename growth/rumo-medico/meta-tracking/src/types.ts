/** Eventos priorizados no AEM — Lead no topo (AGH-28). */
export type MetaStandardEvent =
  | 'Lead'
  | 'CompleteRegistration'
  | 'ViewContent'
  | 'PageView'
  | 'InitiateCheckout'
  | 'Subscribe';

export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  /** fbp cookie (_fbp) */
  fbp?: string;
  /** fbc cookie (_fbc) ou fbclid derivado */
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

export interface MetaCustomData {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  /** UTM ou fonte da campanha */
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  lead_source?: string;
}

export interface MetaTrackParams {
  eventName: MetaStandardEvent;
  eventId: string;
  userData?: MetaUserData;
  customData?: MetaCustomData;
  eventSourceUrl?: string;
}

export interface MetaCapiConfig {
  pixelId: string;
  accessToken: string;
  /** Versão da Graph API — manter atualizada */
  apiVersion?: string;
  /** test_event_code do Events Manager para validação em staging */
  testEventCode?: string;
}

export interface MetaCapiEventPayload {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source: 'website';
  user_data: Record<string, string | string[]>;
  custom_data?: Record<string, string | number>;
}
