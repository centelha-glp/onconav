import { generateEventId } from './event-id';
import type { MetaCustomData, MetaStandardEvent, MetaUserData } from './types';

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

type FbqFunction = (
  command: 'track' | 'trackCustom' | 'init',
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
) => void;

export interface PixelTrackOptions {
  eventName: MetaStandardEvent;
  /** Se omitido, gera novo UUID — repassar ao CAPI para deduplicação */
  eventId?: string;
  customData?: MetaCustomData;
  userData?: Pick<MetaUserData, 'email' | 'phone' | 'firstName' | 'lastName'>;
}

export interface PixelTrackResult {
  eventId: string;
  eventName: MetaStandardEvent;
}

function getFbq(): FbqFunction | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.fbq;
}

/**
 * Dispara evento no Meta Pixel (browser) com eventID para deduplicação CAPI.
 */
export function trackPixelEvent(options: PixelTrackOptions): PixelTrackResult {
  const eventId = options.eventId ?? generateEventId();
  const fbq = getFbq();

  const params: Record<string, unknown> = {};
  if (options.customData) {
    Object.assign(params, options.customData);
  }

  if (fbq) {
    fbq('track', options.eventName, params, { eventID: eventId });
  }

  return { eventId, eventName: options.eventName };
}

/** Lê cookies _fbp e _fbc para enriquecer CAPI */
export function getMetaBrowserCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {};

  const cookies = document.cookie.split(';').reduce<Record<string, string>>(
    (acc, part) => {
      const [key, ...rest] = part.trim().split('=');
      if (key) acc[key] = rest.join('=');
      return acc;
    },
    {}
  );

  return {
    fbp: cookies._fbp,
    fbc: cookies._fbc,
  };
}

/** Script de inicialização do Pixel — injetar via next/script */
export function getMetaPixelInitScript(pixelId: string): string {
  return `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
`.trim();
}
