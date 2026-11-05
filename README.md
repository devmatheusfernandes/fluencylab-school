# Fluency Lab School · lista de espera + demo

Site para **testar a ideia** de abrir a plataforma a professores independentes: uma landing com lista de espera e
duas demos navegáveis (visão do professor e visão do aluno), com dados fictícios e explicações em cada recurso.

- `/` landing + formulário da lista de espera
- `/demo/professor` painel do professor: visão geral, alunos (clique num aluno para abrir a página dele: perfil, plano,
  prática diária, cadernos e aulas do mês com status), **primeira aula** (nivelamento adaptativo, perfil e plano gerados),
  cobranças, contratos, **aulas e agenda** (sala de aula com caderno colaborativo + vídeo e aulas gravadas),
  **biblioteca** (lições, cadernos/apostilas prontos e materiais próprios com revisão de qualidade por IA), marca e plano
- `/demo/aluno` app do aluno em **computador e celular** (alternar no topo): início, aulas (com aulas gravadas),
  estudar, praticar (revisão espaçada e jogos de imersão: Wordle, Word Ladder, Lyrics Training), pagar, e a sala de aula;
  com simulação de mensalidade atrasada
- `/painel?key=SUA_CHAVE` resultados da lista de espera (privado)
- `/api/waitlist/export?key=SUA_CHAVE` baixa a lista em CSV (privado)

Links diretos para uma seção da demo: `/demo/professor?tab=cobrancas`, `?tab=alunos`, `?tab=contratos`,
`?tab=primeira`, `?tab=aulas`, `?tab=biblioteca`, `?tab=marca`, `?tab=plano`; `/demo/aluno?tab=revisar|estudar|aulas|pagar`.
Para o Instagram, use links com `?utm_source=instagram` na landing: a origem fica registrada em cada cadastro.

## Rodar no computador

```bash
npm install
cp .env.example .env.local   # opcional no começo
npm run dev                   # http://localhost:3000
```

Sem `WAITLIST_DATABASE_URL`, os cadastros apenas aparecem no terminal (nada é salvo).

## Colocar no ar na Vercel

1. Suba este projeto para um repositório no GitHub e importe-o na Vercel (framework: Next.js, sem configuração extra).
2. Crie um **projeto Neon exclusivo** para a lista (neon.com, plano grátis). Copie a connection string.
3. Na Vercel, em **Settings → Environment Variables**, defina:
   - `WAITLIST_DATABASE_URL` com a connection string do Neon
   - `ADMIN_KEY` com uma chave longa e aleatória (`openssl rand -hex 24`)
   - opcionalmente `NEXT_PUBLIC_CONTACT_EMAIL` (e-mail para pedidos de dados, aparece na política de privacidade)
4. Faça o deploy. A tabela `waitlist` é criada sozinha no primeiro cadastro.
5. Teste: envie um cadastro seu pelo formulário e abra `https://SEU-SITE/painel?key=SUA_CHAVE`.
6. Domínio: em **Settings → Domains**, adicione `fluencylab.school` (ou o que você comprar) e ajuste
   `NEXT_PUBLIC_DOMAIN` / `NEXT_PUBLIC_SITE_URL` para bater com ele.

> **Segurança do banco:** o site só lê `WAITLIST_DATABASE_URL`. Ele nunca usa `DATABASE_URL` de propósito, para não
> gravar por engano num banco de outro projeto (por exemplo, o da plataforma principal). Use sempre um banco separado.

## Como ler os resultados (o objetivo do teste)

O painel mostra quantas pessoas entraram, quantas pagariam algo, quantas pagariam **R$ 100 ou mais**, o valor médio e a
dor mais citada. Cuidado com a interpretação: intenção de pagamento declarada em formulário costuma ser otimista. Sinais
mais fortes de demanda real são pessoas que deixam WhatsApp, descrevem a dor nas observações e aceitam uma conversa.
Com menos de umas 30 respostas, trate como indício e não como prova.

## Personalizar

- Nome, domínio e preço: variáveis `NEXT_PUBLIC_*` (veja `.env.example`) e `lib/config.ts`.
- Textos da landing: `app/page.tsx`. Dados fictícios das demos: `lib/demo-data.ts`.
- Opções do formulário (faixas de valor, dores etc.): `lib/waitlist-options.ts`.

## Antes de divulgar de verdade

- A política de privacidade (`/privacidade`) é um texto inicial. Peça uma revisão jurídica antes do lançamento.
- As demos mostram o que a plataforma **pretende** oferecer a professores independentes. Alguns pontos (marca própria por
  professor, endereço por professor, cobrança por aluno ativo) ainda são planejados. Mantenha a comunicação clara de que
  é uma lista de espera e um piloto.
- O formulário tem proteção básica contra robôs (campo-isca e limite por IP). Se começar a receber spam, adicione um
  CAPTCHA (Cloudflare Turnstile ou similar).
