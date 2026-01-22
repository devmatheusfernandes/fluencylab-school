# Implementação de Recuperação de Práticas Atrasadas

## Objetivo
Permitir que alunos atrasados realizem múltiplas sessões no mesmo dia (ex: Dia 1, 2 e 3) para alcançar o cronograma, mas impedir que adiantem conteúdo futuro (ex: Dia 4 se hoje for o 3º dia após a aula).

## Detalhes da Implementação

### 1. Atualizar Tipagem (`types/plan.ts`)
- Adicionar `completedPracticeDays: number` na interface `Lesson`.

### 2. Atualizar Lógica de Ciclo (`actions/srs-actions.ts`)
- **Função `getPracticeCycle`**:
  - Calcular `daysSinceClass` (diferença de calendário).
  - Calcular `nextSequenceDay` = `completedPracticeDays` + 1.
  - **Regra de Atraso**: Se `nextSequenceDay` <= `daysSinceClass`, liberar o dia (permite "maratonar" atrasados).
  - **Regra de Futuro**: Se `nextSequenceDay` > `daysSinceClass`, bloquear ou retornar estado de "Em dia" (não permite adiantar).
  - Limite máximo de 6 dias por lição.

### 3. Ajustar Regra de "Já Revisado Hoje"
- **Problema**: O sistema atual bloqueia revisar o mesmo item 2x no mesmo dia (`isReviewedToday`). Isso impediria fazer o Dia 1 e Dia 2 em sequência, pois usam o mesmo vocabulário.
- **Solução**: Modificar `fetchAndGenerate` em `getDailyPractice` para aceitar um parâmetro `ignoreReviewCheck`.
- **Aplicação**:
  - Para itens da **Lição Ativa** (ciclo de aprendizado), ativar `ignoreReviewCheck` (permitir múltiplas interações em modos diferentes).
  - Para itens de **Revisão** (antigos), manter a restrição (evitar "farming").

### 4. Persistir Progresso
- **Função `processPracticeResults`**:
  - Incrementar `completedPracticeDays` da lição ativa após cada sucesso.

---
**Resultado Esperado**:
Se o aluno atrasar 3 dias:
1.  Acessa -> Sistema libera Dia 1. Ao terminar, `completed`=1.
2.  Acessa de novo (mesmo dia) -> Sistema libera Dia 2 (pois 2 <= 3). Ao terminar, `completed`=2.
3.  Acessa de novo -> Sistema libera Dia 3. Ao terminar, `completed`=3.
4.  Acessa de novo -> Sistema bloqueia Dia 4 (pois 4 > 3).
