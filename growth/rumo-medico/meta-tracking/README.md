# @rumo-medico/meta-tracking

Módulo Meta Pixel + Conversions API (CAPI) com deduplicação `event_id` para a landing Rumo Médico.

**Issue:** AGH-28  
**Runbook completo:** [`docs/growth/rumo-medico/setup-meta-agh-28.md`](../../docs/growth/rumo-medico/setup-meta-agh-28.md)

## Instalação na landing

1. Copiar este diretório para o projeto da landing (ou referenciar como workspace package).
2. Configurar variáveis (ver `.env.example`).
3. Adicionar `<MetaPixel />` no layout.
4. Copiar `api/meta-capi-route.example.ts` → `app/api/meta/capi/route.ts`.

## Uso — captura de Lead

```tsx
'use client';

import { trackLeadClient } from './src/lead';

async function onSubmit(formData: FormData) {
  const email = formData.get('email') as string;

  // 1. Pixel no browser (com event_id)
  const { eventId } = trackLeadClient({ email });

  // 2. CAPI no servidor (mesmo event_id)
  await fetch('/api/meta/capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, email }),
  });
}
```

## Testes

```bash
npm install
npm test
```

## Eventos AEM (ordem de prioridade)

1. **Lead** — conversão primária (lista de espera)
2. CompleteRegistration
3. ViewContent
4. PageView
