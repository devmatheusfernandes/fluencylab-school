Vou implementar a lógica completa do Sistema de Repetição Espaçada (SRS) tanto na gravação (salvar resultados) quanto na leitura (gerar a prática diária), garantindo que `getDailyPractice` continue funcionando e agora inclua itens de revisão.

### 1. Implementar Algoritmo SRS (SM-2)
Vou adicionar a função matemática `calculateNextSRS` em `actions/srs-actions.ts` para calcular:
- Intervalo (dias até a próxima revisão)
- Repetições (consecutivas)
- Fator de Facilidade (Ease Factor)
- Data de Vencimento (Due Date)

### 2. Atualizar Gravação (`processPracticeResults`)
Vou modificar esta função para:
- Ler o plano do aluno.
- Calcular o novo estado SRS para cada item praticado usando a função acima.
- Atualizar os campos `srsData` no Firestore, tanto para itens da lição ativa quanto para itens já aprendidos (`learnedComponentsIds`).

### 3. Atualizar Leitura (`getDailyPractice`)
Para que o SRS funcione de verdade, a prática diária precisa incluir itens vencidos. Vou atualizar `getDailyPractice` para:
- **Manter a lógica atual** dos dias 1-6 (baseada na lição ativa).
- **Adicionar recuperação de itens de revisão**:
    1. Ler `learnedComponentsIds` e `reviewLearnedComponentsIds` do plano.
    2. Filtrar itens onde `dueDate <= hoje`.
    3. Buscar os dados desses itens no catálogo (`learningItems`).
    4. Adicionar esses itens à sessão de prática com o modo `review_standard`.
- **Merge de Dados**: Garantir que o objeto retornado combine os dados estáticos (texto/áudio) com os dados dinâmicos do aluno (intervalo/status SRS), o que hoje não acontece.

### 4. Verificação
- Garantir que a função continue retornando uma sessão válida mesmo sem itens de revisão.
- Verificar se os tipos de dados (Datas vs Timestamps) são tratados corretamente na serialização.
