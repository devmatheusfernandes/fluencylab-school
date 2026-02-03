O plano foi ajustado para integrar a validação e persistência dos dados fiscais no passo de assinatura do contrato, conforme solicitado.

### 1. Frontend: Assinatura de Contrato (`ContractReviewStep.tsx`)
- **Novos Campos**: Adicionar campo de **Telefone** (obrigatório para NF/Pagamento) ao formulário.
- **Validação de CPF**:
  - Implementar função de validação matemática de CPF (algoritmo de módulo 11) para impedir CPFs inválidos.
- **Validação de Endereço**:
  - Integrar consulta à API pública **ViaCEP** quando o usuário digitar o CEP.
  - O endereço só será considerado "real" se a API retornar dados válidos. Isso preencherá automaticamente Rua, Bairro, Cidade e Estado, melhorando a experiência e garantindo a veracidade.
- **Persistência no Estado**: Ao assinar com sucesso, salvar `cpf`, `phoneNumber` e `address` no estado global do onboarding.

### 2. Backend: Rota de Assinatura (`/api/onboarding/sign-contract`)
- Alterar a rota para que, além de gerar o contrato, ela **atualize o perfil do usuário** na coleção `users` do banco de dados com os dados fiscais (CPF, Telefone, Endereço).
- Isso garante que, quando o passo seguinte (Pagamento) for executado, os dados já estejam salvos e acessíveis.

### 3. Backend: Serviço de Assinatura (`subscriptionService.ts`)
- Atualizar o método de pagamento para ler esses dados recém-salvos do perfil do usuário e enviá-los ao AbacatePay no campo `customer`, habilitando a emissão futura de notas fiscais.

### 4. Definições de Tipo (`User`)
- Atualizar a interface `User` para incluir oficialmente o campo `taxId` (CPF).

Desta forma, garantimos dados reais e válidos antes mesmo de processar qualquer pagamento.