# Plano de Implementação: Integração WhatsApp Business API

Este plano detalha a implementação do serviço de mensagens WhatsApp para envio de lembretes de pagamento automatizados, utilizando a Meta Cloud API oficial.

## 1. Arquitetura e Estrutura

O serviço será implementado como um módulo independente (`WhatsAppService`) para encapsular a comunicação com a API da Meta. Ele será consumido pelas rotas de API (Cron Jobs) e poderá ser expandido futuramente para outras notificações.

### Componentes Principais:

* **`WhatsAppService`**: Classe responsável por formatar e enviar requisições HTTP para a Meta API.

* **`Webhook Route`**: Endpoint para validação (handshake) com a Meta e recebimento de status de entrega/mensagens.

* **`Payment Reminder Cron`**: Atualização da lógica existente para disparar mensagens WhatsApp em paralelo aos anúncios do sistema.

## 2. Passos de Implementação

### Passo 1: Configuração de Ambiente

Definir as variáveis necessárias no `.env` (ou `.env.local`):

* `WHATSAPP_ACCESS_TOKEN`: Token de longa duração gerado no Meta for Developers.

* `WHATSAPP_PHONE_NUMBER_ID`: ID do número de telefone (não o número em si).

* `WHATSAPP_VERIFY_TOKEN`: Token de segurança para validação do webhook.

### Passo 2: Criação do `WhatsAppService`

Criar o arquivo `services/whatsappService.ts` com as seguintes capacidades:

* Método `sendTemplateMessage`: Para envio de templates (obrigatório para notificações ativas).

  * Suporte a parâmetros dinâmicos (Body parameters).

  * Tratamento de erros sem quebrar a execução da aplicação.

* Método `sendTextMessage`: Para respostas livres (dentro da janela de 24h).

* Validação básica de números de telefone (remoção de caracteres não numéricos).

### Passo 3: Criação do Webhook

Criar a rota `app/api/webhooks/whatsapp/route.ts` para:

* **GET**: Responder ao desafio de verificação (`hub.challenge`) da Meta.

* **POST**: Receber eventos de mensagens e status.

  * Implementar log inicial para depuração.

  * Estrutura preparada para futura integração com Stream Chat ou banco de dados.

### Passo 4: Integração com Cron de Pagamentos

Modificar `app/api/cron/payment-reminders/route.ts` para:

* Importar e inicializar o `WhatsAppService`.

* Adicionar lógica de envio de WhatsApp nos 3 cenários existentes:

  1. **Vence Amanhã**: Template `payment_reminder_tomorrow`.
  2. **Vence Hoje**: Template `payment_due_today`.
  3. **Em Atraso**: Template `payment_overdue`.

* Resolver o número de telefone do usuário:

  * Priorizar `user.phoneNumber`.

  * Fallback para `user.guardian.phoneNumber` (para alunos menores).

## 3. Requisitos Externos (Meta Business Manager)

Para que o sistema funcione, os seguintes templates devem ser criados e aprovados no painel da Meta:

1. **`payment_reminder_tomorrow`**

   * *Texto:* "Olá {{1}}, sua mensalidade de {{2}} vence amanhã. Acesse o app para pagar."
2. **`payment_due_today`**

   * *Texto:* "Olá {{1}}, hoje é o dia do vencimento da sua mensalidade. Evite atrasos!"
3. **`payment_overdue`**

   * *Texto:* "Olá {{1}}, identificamos que sua mensalidade está pendente há 3 dias. Regularize para continuar acessando."

## 4. Estratégia de Testes

1. **Teste de Unidade (Manual)**: Criar um script temporário ou rota de teste para disparar um template para o seu próprio número.
2. **Teste de Webhook**: Usar a ferramenta de teste do Meta for Developers para simular o envio de eventos para a rota local (via túnel como Ngrok ou após deploy).
3. **Monitoramento**: Verificar os logs do servidor para confirmar o sucesso das requisições HTTP para a Meta.

