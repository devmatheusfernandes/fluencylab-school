# Plano: Restaurar Visualizações Avançadas de Tarefas (DnD & Week View)

Para atender à solicitação de ter as mesmas três visualizações (Kanban, Semana, Lista) com funcionalidade Drag-and-Drop (DnD) e checkboxes de conclusão, executarei o seguinte plano:

## 1. Instalação de Dependências
Como os pacotes originais não estão no projeto atual, instalarei as bibliotecas necessárias para o DnD:
*   `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

## 2. Componentes de Arrastar (Draggable Wrappers)
Criarei um componente wrapper reutilizável para aplicar a lógica de "arrastar" aos cartões de tarefa, garantindo que o visual original do `TaskCard` seja preservado enquanto ganha superpoderes de movimento.
*   **Criar `components/features/tasks/DraggableTaskCard.tsx`**: Envolve o `TaskCard` com `useSortable`.

## 3. Implementação das Visualizações

### A. Kanban View (Reimplementação com DnD)
Atualizarei o `TaskBoard.tsx` (ou renomearei para `TaskKanbanView.tsx` para consistência) para usar `DndContext`.
*   **Colunas**: A Fazer, Em Progresso, Revisão, Concluído.
*   **Ação de Drag**: Ao soltar um card em uma nova coluna, chama `updateTask` alterando o **Status**.

### B. Week View (Nova Implementação)
Criarei o componente `TaskWeekView.tsx` do zero, já que o original foi removido.
*   **Layout**: 7 colunas representando os dias da semana (ex: Domingo a Sábado ou Hoje + 6 dias).
*   **Lógica**: Filtrar tarefas pela data de entrega (`dueDate`). Tarefas sem data ficam em uma área de "Sem Data" ou são ocultadas (decisão de design: área "Backlog" opcional).
*   **Ação de Drag**: Ao soltar um card em uma coluna de dia, chama `updateTask` alterando a **Data de Entrega**.
*   **Extra**: Checkbox visível no card para concluir rapidamente.

### C. List View (Atualização)
Atualizarei a `TaskList.tsx`.
*   **Melhoria**: Adicionar Checkbox funcional no início de cada linha/card.
*   **Ação**: Clicar no checkbox altera o status para `done` (ou reverte).

## 4. Atualização do Dashboard e Card
*   **`TaskDashboard.tsx`**: Adicionar o seletor para a terceira visualização "Semana" e gerenciar o estado da view ativa.
*   **`TaskCard.tsx`**: Adicionar a prop `showCheckbox` para renderizar o checkbox condicionalmente (obrigatório em List e Week).

## 5. Fluxo de Execução
1.  Instalar dependências.
2.  Atualizar `TaskCard` (suporte a checkbox e props de estilo para drag).
3.  Criar `DraggableTaskCard`.
4.  Refazer `TaskBoard` (Kanban) com DnD.
5.  Criar `TaskWeekView` com DnD de data.
6.  Atualizar `TaskList` com checkboxes.
7.  Integrar tudo no `TaskDashboard`.

Esta abordagem recupera a funcionalidade completa de "Task Management" que você tinha no projeto de referência.