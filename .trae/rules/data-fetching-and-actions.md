---
title: "Padrões: Data Fetching + API Routes vs Server Actions"
---

# Padrões: Data Fetching + API Routes vs Server Actions

Este guia define as regras do projeto para padronizar busca de dados e decidir quando usar **API Routes** (`app/api/**/route.ts`) versus **Server Actions** (`"use server"` em `actions/**`).

## 1) Data Fetching (App Router)

### 1.1 Princípio

- **GET (server state)** deve ser **cacheável/revalidável** e **centralizado** (evitar `useEffect + fetch + useState` repetido).
- **Mutations (POST/PATCH/DELETE)** devem revalidar o estado afetado (SWR `mutate()` no client ou `revalidatePath/revalidateTag` no server).

### 1.2 Padrão recomendado

- **Server Component** (página sem `"use client"`) para dados necessários no primeiro render, quando possível.
- **SWR em hooks** para GET no client quando:
  - o dado precisa atualizar enquanto o usuário está na tela
  - vários componentes reutilizam o mesmo endpoint
  - você quer cache/dedupe/retry padrão

### 1.3 Regras práticas

- Não fazer **GET** diretamente em `page.tsx`/componentes com `useEffect` se isso virar padrão repetido.
- Preferir criar `hooks/**/useXxx.ts` para encapsular:
  - key do SWR
  - fetcher padrão
  - tipagem do retorno
  - revalidação via `mutate`

## 2) API Routes vs Server Actions

### 2.1 Quando manter como API Route

Use API Route quando:

- o endpoint precisa ser consumível por **clientes externos** (integrações, webhooks)
- existe necessidade de **streaming / upload / downloads** ou Response custom
- você quer um contrato HTTP reutilizável por múltiplas telas (SWR key simples)
- o fluxo depende de comportamento de infra (cron, service worker, etc.)

Exemplos típicos no projeto:

- webhooks (`/api/payment/**/webhook`, `/api/webhooks/**`)
- uploads (`/api/editor/upload-*`, `/api/lesson/upload-*`)
- auth/infra (`/api/auth/**`, `/api/token`)

### 2.2 Quando preferir Server Action

Use Server Action quando:

- é uma **mutation** disparada pela UI e **somente** o seu app precisa chamar
- você quer evitar roundtrip adicional para `/api` e chamar diretamente services/repositories
- você quer revalidação server-first (`revalidatePath/revalidateTag`)
- você quer tipagem/validação mais direta na fronteira da action

### 2.3 Regra “rápida”

- **GET compartilhado**: API Route + SWR (ou Server Component se não precisar de live updates)
- **Mutation de UI interna**: Server Action (ou API Route se já existir e estiver estável)
- **Integração externa**: API Route

## 3) Validação (obrigatória)

- API Routes: validar `body/query/params` com Zod (usar `withValidation`/middleware existente).
- Server Actions: validar `input` com Zod antes de chamar services/repositories.

## 4) Checklist antes de criar algo novo

- Dá para buscar no **Server Component** e passar props?
- Esse GET vai ser reutilizado em vários lugares? Se sim, criar hook com SWR.
- Essa mutation é usada apenas pela UI? Se sim, preferir Server Action.
- Precisa ser consumível fora do app? Se sim, manter API Route.
- Está validado com Zod na fronteira?

