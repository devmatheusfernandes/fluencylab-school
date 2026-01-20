Para atender à solicitação de criar a interface de **Planos de Aula (Learning Plans)** e integrá-la ao sistema, este é o plano de execução detalhado:

### 1. Atualização da Camada de Dados (Backend)
Precisamos garantir que os nomes do plano e da lição estejam disponíveis diretamente no objeto da aula para evitar múltiplas requisições.

*   **Atualizar `types/plan.ts`**: Adicionar campo `title` ao array de `lessons` (redundância necessária para performance).
*   **Atualizar `types/classes/class.ts`**: Adicionar campos `planName` e `lessonTitle` (já planejados como denormalização).
*   **Atualizar `actions/plan-actions.ts`**: Modificar a função `connectPlanToClasses` para salvar esses nomes no momento do vínculo.

### 2. Criação dos Componentes de UI (Frontend)
Criaremos componentes reutilizáveis para serem usados tanto pelo Manager quanto pelo Material Manager.

*   **`components/plans/PlanViewer.tsx`**: Componente de visualização (Read-only).
    *   Exibe cabeçalho (Nome, Nível, Objetivo).
    *   Lista de lições com status de agendamento.
    *   Barra de progresso visual.
*   **`components/plans/PlanEditor.tsx`**: Componente de criação/edição.
    *   Formulário para metadados (Nome, Nível).
    *   Seletor de Lições (Busca e Adiciona).
    *   Ordenação de lições (Drag-and-drop ou botões simples).
    *   Modo "Atribuição": Mostra quantas aulas o aluno tem disponíveis e ajuda a preencher o plano até atingir a meta.
*   **`components/admin/UserPlanTab.tsx`**: Nova aba para o perfil do usuário.
    *   Usa `PlanViewer` se houver plano ativo.
    *   Botão "Atribuir Plano" abre Modal com `PlanEditor` ou seletor de Templates.

### 3. Implementação das Páginas
*   **Material Manager (`hub/material-manager/plans/page.tsx`)**:
    *   Listagem de Templates existentes.
    *   Botão "Criar Template" -> Abre `PlanEditor` (modo template).
*   **Manager User Profile (`hub/manager/users/[userId]`)**:
    *   Integrar `UserPlanTab` no `UserDetailsClient.tsx`.
    *   Atualizar `UserClassesTab.tsx` para exibir `planName` e `lessonTitle` nos cards das aulas.

### 4. Ordem de Execução
1.  Atualizar Tipos (`Plan`, `StudentClass`).
2.  Atualizar Server Action (`connectPlanToClasses`).
3.  Criar `PlanViewer`.
4.  Criar `PlanEditor`.
5.  Implementar página do Material Manager (Templates).
6.  Criar e integrar a aba `UserPlanTab` no perfil do usuário.
7.  Atualizar `UserClassesTab` com os novos campos.
