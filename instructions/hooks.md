# Hooks — Guia de Uso e Responsabilidades

Este documento lista e descreve os hooks do diretório `hooks`, com foco em:

- Propósitos e responsabilidades de cada hook
- Principais retornos (estado e ações)
- Padrões de uso e dependências (ex.: NextAuth, APIs)
- Exemplos de uso em componentes

## Índice

- Autenticação e Usuário
  - `useAuth`
  - `useCurrentUser` (+ `useCan`)
  - `useTwoFactor`
  - `useProfile`
- Administração e Usuários
  - `useAdmin`
  - `useUsers`
- Contratos
  - `useContract`
  - `useContractNotification`
  - `useAdminContracts`
- Notificações e Anúncios
  - `useNotifications`
  - `useAnnouncements`
- Calendário e Disponibilidade
  - `useTeacherCalendarData`
  - `useTeacherAvailabilityForReschedule`
  - `useAvailableTeachers`
  - `useGoogleCalendarSync`
- Conquistas e Painel do Aluno
  - `useAchievements`
  - `useStudentPanel`
  - `useStudentClassActions`
- Perfil e Configurações
  - `useSettings`
  - `useAvatar`
- Professores
  - `useTeacher`
  - `useTeacherOnboarding`
- Diversos
  - `usePlacementTests`
  - `useUserFinancials`
  - `useIsMobile` / `use-mobile`

---

## useAuth

- Arquivo: `hooks/useAuth.ts`
- Responsabilidades:
  - Login com NextAuth (`signIn` com provider `credentials`)
  - Redireciono após login (`/hub`)
- Retorno:
  - `login(email, password)`
  - `isLoading: boolean`
  - `error: string | null`
  - `isAuthenticated: boolean`
- Exemplo:
  - `const { login, isLoading, error, isAuthenticated } = useAuth();`

## useCurrentUser (+ useCan)

- Arquivo: `hooks/useCurrentUser.ts`
- Responsabilidades:
  - Combina sessão do NextAuth com perfil completo do Firestore (`/api/users/me`)
  - Fallback para dados da sessão em caso de erro
- Retorno:
  - `user: User | null` (perfil completo)
  - `isLoading: boolean`
  - `isAuthenticated: boolean`
- Helpers:
  - `useCan(permission: UserPermission): boolean` — verifica permissão do usuário atual
- Exemplo:
  - `const { user, isLoading } = useCurrentUser();`
  - `const canRead = useCan('SOME_PERMISSION');`

## useTwoFactor

- Arquivo: `hooks/useTwoFactor.ts`
- Responsabilidades:
  - Estado e ações para habilitar/desabilitar 2FA (integra com sessão NextAuth)
- Retorno:
  - `isLoading: boolean`, `error: string | null`
  - `enableTwoFactor()`, `disableTwoFactor()`
  - `isTwoFactorEnabled: boolean`
- Exemplo:
  - `const { isTwoFactorEnabled, enableTwoFactor } = useTwoFactor();`

## useUsers

- Arquivo: `hooks/useUsers.ts`
- Responsabilidades:
  - Lista e atualiza usuários para o painel admin (`/api/admin/users`)
- Retorno:
  - `users: User[]`, `isLoading: boolean`, `error: string | null`, `successMessage: string | null`
  - `fetchUsers(filters?)`, `updateUserStatus(userId, isActive)`
- Observações:
  - Usa query params `role` e `isActive` para filtros

## useContract

- Arquivo: `hooks/useContract.ts`
- Responsabilidades:
  - Busca e gerencia o contrato do usuário logado (`/api/contract/*`)
- Retorno principal (`useContract`):
  - Estado: `student`, `contractStatus`, `contractLog`, `isLoading`, `isSigning`, `error`, `showNotification`
  - Ações: `signContract(signatureData)`, `validateContract()`, `refreshContract()`, `dismissNotification()`
- Hooks adicionais no mesmo arquivo:
  - `useContractNotification()` — busca e exibe notificações de contrato
  - `useAdminContracts()` — gestão administrativa de contratos

## useNotifications

- Arquivo: `hooks/useNotifications.ts`
- Responsabilidades:
  - Buscar anúncios e convertê-los em notificações de UI (`/api/announcements`)
- Retorno:
  - `notifications: Notification[]`, `isLoading`, `error`
  - `markAsRead(id)`, `markAllAsRead()`, `clearAll()`, `deleteNotification(id)`, `refreshNotifications()`
- Observações:
  - Usa `localStorage.getItem('firebaseToken')` no header `Authorization`

## useAdmin

- Arquivo: `hooks/useAdmin.ts`
- Responsabilidades:
  - Fluxos e ações administrativas (listagem, filtros, operações em massa)
- Retorno:
  - Estrutura típica de lista, loading, error e actions

## useAnnouncements

- Arquivo: `hooks/useAnnouncements.ts`
- Responsabilidades:
  - Operações de anúncios (listar, marcar como lido, etc.)
- Retorno:
  - Lista de anúncios, loading, error e helpers

## useTeacherCalendarData

- Arquivo: `hooks/useTeacherCalendarData.ts`
- Responsabilidades:
  - Dados agregados do calendário do professor (aulas, disponibilidade, métricas)
- Retorno:
  - Estrutura com dados populados e indicadores para UI

## useTeacherAvailabilityForReschedule

- Arquivo: `hooks/useTeacherAvailabilityForReschedule.ts`
- Responsabilidades:
  - Buscar janelas de disponibilidade do professor focadas em remarcação
- Retorno:
  - Slots disponíveis e helpers de navegação/seleção

## useAvailableTeachers

- Arquivo: `hooks/useAvailableTeachers.ts`
- Responsabilidades:
  - Lista professores disponíveis com filtros
- Retorno:
  - Lista, filtros e ações

## useGoogleCalendarSync

- Arquivo: `hooks/useGoogleCalendarSync.ts`
- Responsabilidades:
  - Integração de horários com Google Calendar
- Retorno:
  - Estado de sincronização e helpers

## useAchievements

- Arquivo: `hooks/useAchievements.ts`
- Responsabilidades:
  - Busca conquistas do estudante e mantém estado
- Retorno:
  - Lista de conquistas, loading, error e helpers

## useStudentPanel

- Arquivo: `hooks/useStudentPanel.ts`
- Responsabilidades:
  - Dados e ações do painel do aluno (aulas, progresso, notificações)
- Retorno:
  - Estruturas de estado e ações agregadas

## useStudentClassActions

- Arquivo: `hooks/useStudentClassActions.ts`
- Responsabilidades:
  - Ações sobre aulas do estudante (cancelar, remarcar, etc.)
- Retorno:
  - Helpers de ação e estados derivados

## useSettings

- Arquivo: `hooks/useSettings.ts`
- Responsabilidades:
  - Configurações do usuário e preferências
- Retorno:
  - Objeto de settings, loading e actions

## useAvatar

- Arquivo: `hooks/useAvatar.ts`
- Responsabilidades:
  - Estado e ações do avatar do usuário
- Retorno:
  - URL, upload e ações relacionadas

## useTeacher

- Arquivo: `hooks/useTeacher.ts`
- Responsabilidades:
  - Dados do professor (perfil, aulas, disponibilidade)
- Retorno:
  - Perfil e helpers

## useTeacherOnboarding

- Arquivo: `hooks/useTeacherOnboarding.ts`
- Responsabilidades:
  - Fluxo de onboarding de professor
- Retorno:
  - Estado do onboarding e ações

## usePlacementTests

- Arquivo: `hooks/usePlacementTests.ts`
- Responsabilidades:
  - Testes de nivelamento (listar, assinar em tempo real, etc.)
- Retorno:
  - Lista de testes e helpers

## useUserFinancials

- Arquivo: `hooks/useUserFinancials.ts`
- Responsabilidades:
  - Informações financeiras do usuário (assinaturas/pagamentos)
- Retorno:
  - Overview e métricas

## useIsMobile / use-mobile

- Arquivos: `hooks/useIsMobile.ts` e `hooks/use-mobile.ts`
- Responsabilidades:
  - Detecta contexto mobile para ajustar UI
- Retorno:
  - `isMobile: boolean`

---

## Padrões e Boas Práticas

- Todos os hooks são para uso em componentes cliente (`'use client'` quando necessário).
- Prefira reutilizar serviços e repositórios através dos singletons/documentados em `instructions/services.md` e `instructions/repository.md`.
- Centralize tokens/sessão através do `next-auth` sempre que possível; evite duplicar fontes de verdade.
- Em hooks que chamam APIs, padronize headers e trate erros para não quebrar a UI.

## Exemplos Rápidos

- Autenticação:
  - `const { login, isAuthenticated } = useAuth();`
- Perfil + Permissões:
  - `const { user } = useCurrentUser();`
  - `const canManage = useCan('ADMIN_MANAGE');`
- Contrato:
  - `const { signContract, validateContract } = useContract();`
- Notificações:
  - `const { notifications, markAsRead } = useNotifications();`
