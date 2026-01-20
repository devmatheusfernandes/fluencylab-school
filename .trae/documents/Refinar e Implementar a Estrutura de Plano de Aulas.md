## Plano de Implementação: Feature de Planos de Aula (Learning Plans)

Este plano consolida a estrutura de dados para gerenciar o currículo dos alunos, permitindo planos personalizados, progresso via SRS e integração direta com a agenda de aulas.

### 1. Criação do Arquivo `types/plan.ts`
Vamos formalizar a estrutura do Plano, incluindo o suporte a templates, status de ciclo de vida e rastreamento de aprendizado (SRS).

**Estrutura Definida:**
*   **Enums/Types:**
    *   `PlanType`: `'template' | 'student'` (Diferencia modelos de planos em uso).
    *   `PlanStatus`: `'draft' | 'active' | 'completed' | 'archived'` (Gerencia o ciclo de vida).
    *   `ReviewGrade`: Sistema de pontuação do SRS (0-5).
*   **Interface `Plan`:**
    *   Campos de Controle: `id`, `studentId`, `type`, `status`.
    *   Campos de Conteúdo: `name`, `goal`, `level`.
    *   **Array `lessons`**:
        *   `id` (Referência à Lesson).
        *   `scheduledClassId` (Vínculo com a agenda).
        *   `learningItemsIds` / `learningStructureIds` (Itens sendo aprendidos).
        *   `learnedComponentsIds` (Itens já aprendidos).
        *   `reviewLearnedComponentsIds` (Itens para revisão SRS).
*   **Imports Necessários:** `Lesson`, `CEFRLevel` de `./lesson`.

### 2. Atualização do Arquivo `types/classes/class.ts`
Vamos atualizar a tipagem das aulas agendadas para que o sistema saiba, ao renderizar a agenda, qual conteúdo está vinculado àquela data.

**Alterações:**
*   Adicionar `planId?: string`: Para saber a qual plano essa aula pertence.
*   Adicionar `lessonId?: string`: Para acesso rápido ao conteúdo da lição sem consultar o plano inteiro.

### 3. Validação
*   Verificar se todos os imports estão corretos.
*   Garantir que os tipos se complementam (o `planId` na aula aponta para um `Plan` válido).

---
**Resultado Esperado:**
Ao final, teremos a base de dados pronta para:
1.  Criar planos de aula.
2.  Vincular lições a datas específicas.
3.  Rastrear o progresso do aluno (vocabulário/gramática) e histórico de planos.
