# Plano de Implementação de Segurança

## 1. Configurar Headers de Segurança
**Arquivo:** `next.config.ts`
- Implementar headers HTTP para proteção contra Clickjacking, Sniffing, XSS e injeção de código.
- Headers a serem adicionados:
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `X-DNS-Prefetch-Control`

## 2. Proteger API de Disponibilidade
**Arquivo:** `app/api/student/availability/route.ts`
- Envolver o handler `GET` com o middleware `withAuth` (importado de `@/lib/auth/middleware`).
- Configurar regras de autorização para permitir apenas: `student`, `guarded_student`, `admin`, `manager`.
- Isso garante que dados de agenda dos professores não sejam acessíveis publicamente.

## 3. Análise do `proxy.ts`
**Status:** ✅ Aprovado (Não requer alterações)
- **Verificação:** O arquivo `proxy.ts` está corretamente implementado seguindo as convenções do Next.js 16+.
- **Cobertura:** Ele protege efetivamente as rotas de interface (`/hub`, etc.) e gerencia o redirecionamento de idiomas (`i18n`).
- **Decisão:** Manteremos o `matcher` excluindo rotas de API (`(?!api...)`). Isso é uma boa prática, pois permite que protejamos cada endpoint de API individualmente (como faremos no passo 2) com respostas JSON adequadas em vez de redirecionamentos HTML.

## Resumo das Ações
1.  Editar `next.config.ts` para incluir headers.
2.  Editar `app/api/student/availability/route.ts` para adicionar autenticação.
3.  Manter `proxy.ts` como está.