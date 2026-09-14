# Runbook: Setup Meta — Pixel, CAPI, domínio e eventos (AGH-28)

> **Status:** Aprovado  
> **Versão:** 1.0  
> **Última atualização:** 2026-09-14  
> **Issue:** [AGH-28](https://linear.app/rumomedico/issue/AGH-28)  
> **Projeto:** Rumo Médico — Growth & Social Media

## Sumário

- [Contexto](#contexto)
- [Checklist operacional](#checklist-operacional)
- [1. Business Manager e conta de anúncios](#1-business-manager-e-conta-de-anúncios)
- [2. Verificação de domínio](#2-verificação-de-domínio)
- [3. Pixel + CAPI](#3-pixel--capi)
- [4. Deduplicação event_id](#4-deduplicação-event_id)
- [5. Aggregated Event Measurement (AEM)](#5-aggregated-event-measurement-aem)
- [6. Pagamento e limite de gasto](#6-pagamento-e-limite-de-gasto)
- [7. Exclusões — alunos atuais](#7-exclusões--alunos-atuais)
- [8. Categoria saúde/educação](#8-categoria-saúdeeducação)
- [9. Validação e go-live](#9-validação-e-go-live)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Implementação técnica](#implementação-técnica)

## Contexto

Infraestrutura da conta Meta para aquisição da **Rumo Médico** (pré-lançamento set/out 2026, vendas a partir de 11/11/2026). Métrica do trimestre: **construção de lista** (Lead), não matrícula.

**Prazo:** conta pronta em **setembro** para campanhas em **início de outubro**.

## Checklist operacional

| # | Item | Responsável | Status |
|---|------|-------------|--------|
| 1 | Business Manager organizado + acesso do time | Growth/Ops | ☐ |
| 2 | Conta de anúncios vinculada ao BM | Growth/Ops | ☐ |
| 3 | Domínio verificado (DNS ou meta-tag) | Dev + Growth | ☐ |
| 4 | Pixel instalado na landing | Dev | ☐ |
| 5 | CAPI configurado (token servidor) | Dev | ☐ |
| 6 | Deduplicação Pixel × CAPI com `event_id` | Dev | ☐ |
| 7 | AEM configurado — Lead no topo | Growth | ☐ |
| 8 | Método de pagamento + limite de gasto | Financeiro | ☐ |
| 9 | Lista de exclusão (alunos atuais) | CRM + Growth | ☐ |
| 10 | Categoria especial ad review (saúde/educação) | Growth | ☐ |

---

## 1. Business Manager e conta de anúncios

### Passos

1. Acessar [business.facebook.com](https://business.facebook.com) com conta admin.
2. Criar ou usar BM **Rumo Médico** (nome alinhado à marca).
3. Em **Configurações do negócio → Pessoas**, adicionar o time com papéis:
   - **Admin:** 1–2 pessoas (Luiz + backup)
   - **Anunciante:** quem cria campanhas
   - **Analista:** quem só vê relatórios
4. Em **Contas → Contas de anúncios**, criar conta **Rumo Médico — Aquisição**.
5. Vincular Pixel e Página Instagram @rumomedico à mesma BM.

**Verificação:** todos do time conseguem acessar BM + conta de anúncios sem pedir acesso individual.

---

## 2. Verificação de domínio

Domínio da landing (ex.: `rumomedico.com.br` ou subdomínio de captura).

### Opção A — meta-tag (recomendada para Next.js)

1. BM → **Configurações → Segurança da marca → Domínios** → Adicionar domínio.
2. Copiar meta-tag fornecida pela Meta.
3. Inserir no `<head>` do layout raiz da landing:

```html
<meta name="facebook-domain-verification" content="CODIGO_DA_META" />
```

4. Clicar **Verificar** no BM.

### Opção B — DNS TXT

1. Adicionar registro TXT no provedor DNS conforme instrução do BM.
2. Aguardar propagação (até 72h; geralmente < 1h).

**Verificação:** status **Verificado** no BM. Sem domínio verificado, AEM e otimização de conversão ficam limitados.

---

## 3. Pixel + CAPI

### Pixel (browser)

1. BM → **Gerenciador de eventos** → Conectar fontes de dados → **Web** → Pixel.
2. Nome: `Rumo Médico — Pixel Web`.
3. Copiar **Pixel ID**.
4. Instalar na landing usando o módulo em `growth/rumo-medico/meta-tracking/`:

```tsx
// app/layout.tsx da landing
import { MetaPixel } from '@rumo-medico/meta-tracking/components/MetaPixel';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID!} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### CAPI (servidor) — obrigatório

Desde iOS 14+, o Pixel sozinho perde volume de evento. CAPI recupera sinal server-side.

1. Gerenciador de eventos → Pixel → **Configurações** → **API de conversões**.
2. Gerar **token de acesso** (guardar em secret manager — nunca no client).
3. Configurar API route (ver `growth/rumo-medico/meta-tracking/api/meta-capi-route.example.ts`).
4. Em staging, usar **Código de teste de eventos** (`META_TEST_EVENT_CODE`) para validar no Test Events.

**Verificação:** Events Manager mostra eventos **Browser** e **Server** com match rate > 75% após 24–48h de tráfego.

---

## 4. Deduplicação event_id

Sem `event_id` idêntico no Pixel e no CAPI, cada Lead conta **duas vezes** → CPL artificialmente baixo.

### Fluxo correto

```
1. Usuário submete formulário
2. Client gera eventId = crypto.randomUUID()
3. Client: fbq('track', 'Lead', {...}, { eventID: eventId })
4. Client: POST /api/meta/capi { eventId, email, ... }
5. Server: CAPI com mesmo event_id
```

Implementação pronta em `trackLeadClient()` + `trackLeadServer()` do módulo.

**Verificação:** Test Events → evento Lead aparece **uma vez** com fontes Browser + Server deduplicadas.

---

## 5. Aggregated Event Measurement (AEM)

Configurar em **Gerenciador de eventos → Configurações do agregador de eventos** (domínio verificado).

### Ordem de prioridade (pré-lançamento — lista)

| Prioridade | Evento | Uso |
|------------|--------|-----|
| 1 | **Lead** | Captura de email/telefone na landing |
| 2 | CompleteRegistration | Confirmação dupla opt-in (se houver) |
| 3 | ViewContent | Página de conteúdo/aula gratuita |
| 4 | PageView | Tráfego geral |
| 5 | InitiateCheckout | Reservado para pós 11/11 |
| 6 | Subscribe | Newsletter/WhatsApp opt-in |
| 7 | (reserva) | — |
| 8 | (reserva) | — |

**Importante:** Lead deve estar na **posição 1** — é a conversão primária do trimestre.

---

## 6. Pagamento e limite de gasto

1. Conta de anúncios → **Configurações de pagamento** → adicionar cartão corporativo.
2. Definir **limite de gasto da conta**: R$ 10.000/mês (verba do trimestre).
3. Configurar alerta de gasto em 80% (R$ 8.000) no BM.

**Verificação:** conta com status **Ativa** e sem pendências de pagamento.

---

## 7. Exclusões — alunos atuais

**Contexto pré-lançamento (set/out):** não há alunos ainda. Preparar infraestrutura para pós 11/11.

### Quando houver matriculados

1. Exportar lista de emails do CRM (formato CSV, coluna `email`).
2. BM → **Públicos → Criar público → Lista de clientes**.
3. Nome: `Rumo Médico — Alunos ativos (exclusão)`.
4. Upload mensal ou via API do CRM.
5. Em **todas as campanhas de aquisição**, adicionar exclusão deste público.

**LGPD:** base legal = legítimo interesse ou consentimento; não usar dados clínicos; apenas email/telefone com hash no upload Meta.

---

## 8. Categoria saúde/educação

Contas de saúde/educação médica passam por **revisão de política** com mais frequência.

### Antes da primeira campanha

1. Verificar se a conta está marcada como **Categoria especial de anúncios** (Saúde).
2. Revisar [Políticas de anúncios — Saúde e bem-estar](https://www.facebook.com/policies/ads/restricted_content/health).
3. Evitar na copy:
   - Garantia de resultado profissional
   - Antes/depois de pacientes/alunos (ângulo 8 bloqueado até 2027)
   - Linguagem de urgência falsa (sem "turma fechando" — ver AGH-48)
4. Incluir disclaimers CFM/CONAR quando médico aparece (nome + CRM).

**Se reprovada:** abrir ticket de revisão com documentação do produto (educação em gestão, não tratamento clínico).

---

## 9. Validação e go-live

### Staging (com test_event_code)

```bash
# Enviar evento de teste via curl
curl -X POST https://SEU_DOMINIO/api/meta/capi \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test-'$(uuidgen)'",
    "email": "teste@rumomedico.com.br"
  }'
```

Verificar em **Gerenciador de eventos → Testar eventos**.

### Go-live (outubro)

- [ ] Remover `META_TEST_EVENT_CODE` de produção
- [ ] Pixel firing em todas as páginas da landing
- [ ] CAPI respondendo 200 em produção
- [ ] AEM com Lead na posição 1
- [ ] Domínio verificado
- [ ] Primeira campanha com orçamento de teste (R$ 100–200/dia por 3 dias)

### Métricas de saúde (primeiros 30 dias)

| Métrica | Meta |
|---------|------|
| Event Match Quality (EMQ) | > 6/10 |
| Deduplicação Lead | > 90% |
| CAPI coverage | > 50% dos Leads |
| CPL baseline | Estabelecer linha de base (sem baseline prévio) |

---

## Variáveis de ambiente

Ver `growth/rumo-medico/meta-tracking/.env.example`:

| Variável | Onde | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Client | ID do Pixel |
| `META_PIXEL_ID` | Server | Mesmo ID |
| `META_CAPI_ACCESS_TOKEN` | Server | Token CAPI (secret) |
| `META_TEST_EVENT_CODE` | Server (staging) | Código de teste |

---

## Implementação técnica

Código em: [`growth/rumo-medico/meta-tracking/`](../../../growth/rumo-medico/meta-tracking/)

```
growth/rumo-medico/meta-tracking/
├── src/
│   ├── capi.ts          # Envio server-side
│   ├── pixel.ts         # Tracking browser
│   ├── lead.ts          # Fluxo Lead completo
│   ├── event-id.ts      # UUID para deduplicação
│   └── hash.ts          # SHA-256 PII
├── components/
│   └── MetaPixel.tsx    # Componente Next.js
└── api/
    └── meta-capi-route.example.ts
```

Testes: `cd growth/rumo-medico/meta-tracking && npm install && npm test`
