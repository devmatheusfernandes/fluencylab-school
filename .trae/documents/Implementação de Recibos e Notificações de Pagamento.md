# Plano de Implementação

## 1. Respostas às Perguntas (Custos e Armazenamento)

### Recibos em PDF

* **Custo:** Zero.

* **Armazenamento:** Zero.

* **Estratégia:** Em vez de gerar PDFs no servidor e salvá-los (o que custaria armazenamento e processamento), criaremos uma **Página de Recibo** no sistema (`/hub/receipt/[id]`).

* O e-mail conterá um link "Baixar Comprovante" que leva a esta página.

* Nesta página, o usuário verá o recibo e terá um botão para baixá-lo como PDF instantaneamente (gerado no navegador dele). Isso é mais rápido, seguro e não ocupa espaço no seu banco de dados.

### Push Notifications

* **Custo:** Zero (para sua escala de 50-100 usuários).

* **Estratégia:** Usaremos o **Vercel Cron** (ou similar) para verificar diariamente os pagamentos.

* O envio via Web Push é gratuito.

* O volume de leituras no banco de dados será mínimo e ficará bem abaixo dos limites gratuitos do Firebase.

***

## 2. Implementação Técnica

### Passo 1: Página de Recibo (Frontend)

Criar a página `app/[locale]/hub/receipt/[id]/page.tsx`:

* Exibe os detalhes do pagamento (Valor, Data, Método, Próximo Vencimento).

* Botão "Baixar PDF" utilizando a biblioteca `jspdf` (já instalada).

### Passo 2: Atualizar Serviço de E-mail

Modificar `services/emailService.ts`:

* Adicionar o método `sendPaymentConfirmationEmail`.

* Utilizar o template existente `emails/templates/PaymentConfirmationEmail.tsx`.

* Injetar a URL da nova página de recibo.

### Passo 3: Integrar no Fluxo de Pagamento

Modificar `services/subscriptionService.ts`:

* No método `handlePixPaymentSuccess` (quando o pagamento é confirmado):

  * Buscar dados do usuário e do pagamento.

  * Chamar `emailService.sendPaymentConfirmationEmail`.

### Passo 4: Notificações Automáticas (Cron Job)

Criar a rota de API `app/api/cron/payment-reminders/route.ts`:

* **Segurança:** Protegida por `CRON_SECRET`.

* **Lógica:**

  1. Buscar pagamentos vencendo **amanhã** (Lembrete).
  2. Buscar pagamentos vencendo **hoje** (É hoje!).
  3. Buscar pagamentos vencidos há **3 dias** (Atraso).

* **Ação:** Disparar `announcementService.createSystemAnnouncement` para cada caso.

***

## Confirmação

Você aprova este plano? (Especialmente a abordagem de gerar o PDF no navegador para economizar custos).
