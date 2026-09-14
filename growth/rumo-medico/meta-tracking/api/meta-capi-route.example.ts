/**
 * Exemplo de API Route Next.js App Router para CAPI.
 * Copiar para: app/api/meta/capi/route.ts na landing Rumo Médico.
 */
import { NextRequest, NextResponse } from 'next/server';
import { trackLeadServer } from '../src/lead';

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

export async function POST(request: NextRequest) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return NextResponse.json(
      { error: 'Meta CAPI não configurado no servidor' },
      { status: 503 }
    );
  }

  let body: {
    eventId: string;
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.eventId || !body.email) {
    return NextResponse.json(
      { error: 'eventId e email são obrigatórios' },
      { status: 400 }
    );
  }

  const result = await trackLeadServer(
    {
      pixelId: PIXEL_ID,
      accessToken: ACCESS_TOKEN,
      testEventCode: TEST_EVENT_CODE,
    },
    {
      email: body.email,
      phone: body.phone,
      firstName: body.firstName,
      lastName: body.lastName,
      eventSourceUrl: request.headers.get('referer') ?? undefined,
      customData: {
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
      },
      serverContext: {
        clientIpAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request.headers.get('x-real-ip') ??
          undefined,
        clientUserAgent: request.headers.get('user-agent') ?? undefined,
      },
    },
    body.eventId
  );

  if (!result.capiResult?.success) {
    return NextResponse.json(
      { error: result.capiResult?.error ?? 'Falha ao enviar evento' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    eventId: result.eventId,
    eventsReceived: result.capiResult.eventsReceived,
  });
}
