O plano detalhado abaixo atende à sua solicitação de permitir a edição de valores de mensalidades futuras, garantindo que isso não afete cobranças já geradas ou pagas.

### **Análise de Segurança e Fluxo**
Para responder à sua preocupação ("verifique se isso nao vai atrapalhar meu fluxo"):
- **Segurança:** O sistema integra com o **AbacatePay**. As cobranças (QR Codes PIX) são geradas apenas quando o status passa de `pending` para `available` (2 dias antes do vencimento).
- **Conclusão:** É **seguro** alterar o valor enquanto o status for **`pending`**.
- **Restrição:** Não permitiremos edição de pagamentos com status `available` (já tem boleto/PIX gerado), `paid` (pago) ou `overdue` (vencido), pois isso causaria inconsistência entre o valor no banco de dados e o valor que o aluno está tentando pagar.

### **Plano de Implementação**

#### **1. Backend (Nova Rota de API)**
Criaremos uma rota segura para atualizar o valor da mensalidade.
- **Arquivo:** `app/api/admin/finance/payments/[paymentId]/update-amount/route.ts`
- **Método:** `PATCH`
- **Lógica:**
  - Receber `paymentId` e `newAmount`.
  - Verificar se o pagamento existe.
  - **Validação Crítica:** Verificar se o status é estritamente `pending`. Se for qualquer outro, retornar erro 400.
  - Atualizar o campo `amount` no Firestore.
  - Retornar sucesso.

#### **2. Frontend (UserFinancialTab.tsx)**
Adicionaremos a interface de edição seguindo o padrão de `Modal` do projeto.
- **Adicionar Botão de Ação:** Criar uma nova coluna na tabela de pagamentos com um botão de "Editar" (ícone `Pencil`).
  - *Condição:* O botão ficará desabilitado ou invisível se o status não for `pending`.
- **Implementar Modal:**
  - Usar os componentes padrão: `Modal`, `ModalHeader`, `ModalTitle`, `ModalBody`, `ModalFooter`.
  - Input numérico formatado para moeda (BRL).
  - Botão "Salvar" que chama a nova API.
- **Feedback:** Mostrar `Spinner` durante o salvamento e mensagem de sucesso/erro (Toast).

### **Passos de Execução**
1.  Criar a rota de API de atualização (`PATCH`).
2.  Modificar `UserFinancialTab.tsx` para incluir a lógica do Modal e a nova coluna na tabela.
3.  Testar o fluxo: tentar editar um pagamento pendente (sucesso) e verificar visualmente se pagamentos pagos/disponíveis não permitem edição.
