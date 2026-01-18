# Plano de Implementação: Gestão de Componentes da Aula e Atualização Gramatical

Vou implementar as mudanças solicitadas em três etapas principais:

## 1. Atualização de Tipos e Backend
*   **`types/lesson.ts`**:
    *   Adicionar o tipo `GrammaticalRole` (subject, verb, object, etc.).
    *   Atualizar a interface `LearningStructure` para incluir o campo `role` dentro de `sentences.order`.
*   **`actions/lesson-processing.ts`**:
    *   Atualizar o prompt da IA para instruir a geração do campo `role` na análise gramatical.

## 2. Novas Páginas de Gerenciamento
Criarei duas novas rotas aninhadas em `lessons/[lessonId]`:

### A. Página de Componentes (`/components`)
Esta página permitirá visualizar e editar os itens gerados (Vocabulário e Estruturas).
*   **Caminho**: `app/[locale]/hub/material-manager/lessons/[lessonId]/components/page.tsx`
*   **Componente Principal**: `LessonComponentsManager.tsx`
    *   **Aba Vocabulário**: Baseada em `LearningItemsList`, permitindo edição e upload de imagens (usando `updateLearningItem` e APIs de imagem).
    *   **Aba Estruturas**: Nova interface para listar e editar estruturas gramaticais.
        *   Incluirá um editor visual para as sentenças, permitindo alterar a ordem e atribuir o novo campo **`role`** (Função Gramatical) para cada palavra.
        *   Usará a action `updateLearningStructure`.

### B. Página de Quiz (`/quiz`)
Esta página permitirá visualizar e editar o quiz da aula.
*   **Caminho**: `app/[locale]/hub/material-manager/lessons/[lessonId]/quiz/page.tsx`
*   **Componente Principal**: `LessonQuizEditor.tsx`
    *   Baseado no `QuizEditor` existente.
    *   Adaptado para salvar diretamente no documento da aula usando `updateLessonQuiz`.

## 3. Estrutura de Arquivos
*   `types/lesson.ts` (Modificado)
*   `actions/lesson-processing.ts` (Modificado)
*   `components/lessons/LessonComponentsManager.tsx` (Novo)
*   `components/lessons/LessonQuizEditor.tsx` (Novo)
*   `app/[locale]/hub/material-manager/lessons/[lessonId]/components/page.tsx` (Novo)
*   `app/[locale]/hub/material-manager/lessons/[lessonId]/quiz/page.tsx` (Novo)
