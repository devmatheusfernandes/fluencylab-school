# Plano de Implementação da Feature "Tasks"

Abaixo detalho o plano para integrar a funcionalidade de Tarefas ao seu projeto `fluencylab-school`, utilizando a estrutura existente (Firebase/Firestore) e o design system (shadcn/ui).

## 1. Estruturação e Refatoração de Componentes

Moveremos os arquivos de `new-features/tasks` para a estrutura correta do projeto e os atualizaremos para usar os componentes de UI padrão.

* **Novos Diretórios:**

  * `components/features/tasks/`: Conterá os componentes visuais (`TaskBoard`, `TaskCard`, `TaskDialog`, `TaskFilters`).

  * `hooks/features/tasks/`: Conterá os hooks de lógica (`useTasks`, `useTaskSubscription`).

  * `types/tasks/`: Definições de tipos (`Task`, `TaskStatus`, `TaskPriority`).

* **Integração de UI:**

  * Substituir elementos nativos pelos componentes de `components/ui` (`Modal` (ui/components/modal.tsx),`Button`, `Input`, `Select`, `Popover`, `Command`).

  * Implementar internacionalização (`next-intl`) em todos os textos.

## 2. Backend e Integração de Dados (Firebase)

Como o projeto usa Firebase (identificado pela análise), não usaremos Prisma.

* **Modelagem de Dados (`types/tasks/task.ts`):**

  * Adicionar campos: `assignedToId` (designado para), `subscriberIds` (inscritos), `creatorId`, `dueDate`.

* **Server Actions (`actions/tasks.ts`):**

  * Criar ações para garantir segurança e envio de notificações: `createTask`, `updateTask`, `deleteTask`.

  * Ao criar/editar, a ação validará os dados e chamará o `PushService`.

* **Hooks (`hooks/features/tasks/useTasks.ts`):**

  * Manter a lógica de *listener* em tempo real do Firestore para atualização instantânea das colunas.

## 3. Implementação da Funcionalidade "Designado Para"

* **Hook de Usuários (`hooks/useStaffUsers.ts`):**

  * Criar um hook que busca usuários com roles: `admin`, `manager`, `material_manager`.

* **Componente de Seleção:**

  * No `TaskDialog`, adicionar um `Combobox` (usando `Command` + `Popover`) que lista esses usuários.

  * Exibir avatar e nome do responsável no `TaskCard`.

## 4. Notificações e Push Service

Atualizar o serviço existente para suportar tarefas.

* **Atualizar** **`services/pushService.ts`:**

  * Adicionar método `notifyTaskAssignment(userId, taskTitle)`: Envia push quando alguém é designado.

  * Adicionar método `notifyTaskUpdate(task, updateType)`: Envia push para todos os `subscriberIds` quando a tarefa muda.

* **Botão de Inscrição:**

  * Adicionar botão "Inscrever-se/Sair" (olho/sino) no `TaskCard` ou `TaskDialog`.

  * Logar o usuário atual automaticamente como inscrito ao criar ou comentar (se houver comentários).

## 5. Criação das Páginas

Implementar a visualização de tarefas nos três painéis solicitados, reutilizando um componente principal `TaskDashboard`.

* **Componente Principal (`components/features/tasks/TaskDashboard.tsx`):**

  * Gerencia o estado das views (Kanban, Lista, Calendário).

* **Páginas:**

  * `app/[locale]/hub/admin/tasks/page.tsx`

  * `app/[locale]/hub/manager/tasks/page.tsx`

  * `app/[locale]/hub/material-manager/tasks/page.tsx`

## Passo a Passo da Execução

1. **Migração:** Criar tipos e mover componentes para `components/features/tasks`.
2. **Serviços:** Implementar `actions/tasks.ts` e atualizar `pushService.ts`.
3. **UI:** Atualizar `TaskDialog` com o campo "Designado para" e lógica de notificação.
4. **Páginas:** Criar as rotas no diretório `app`.
5. **Validação:** Testar criação, atribuição e recebimento de notificação.

