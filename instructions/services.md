# Services — Functions and Utilities

Este documento lista classes, funções e singletons exportados do diretório `services` para facilitar a reutilização de lógica e evitar duplicação, seguindo o estilo de `instructions/repository.txt`.

## Índice (singletons exportados)

- Arquivo: `services/creditService.ts`
  - Singleton: `creditService` (instância de `CreditService`)
- Arquivo: `services/contractService.ts`
  - Singleton: `contractService` (instância de `ContractService`)
- Arquivo: `services/placementService.ts`
  - Singleton: `placementService` (instância de `PlacementService`)
- Arquivo: `services/schedulingService.ts`
  - Singleton: `schedulingService` (instância de `SchedulingService`)
 - Arquivo: `services/emailService.ts`
   - Singleton: `emailService` (instância de `EmailService`)
 - Arquivo: `services/authService.ts`
   - Singleton: `authService` (instância de `AuthService`)
 - Arquivo: `services/twoFactorService.ts`
   - Singleton: `twoFactorService` (instância de `TwoFactorService`)
 - Arquivo: `services/achievementService.ts`
   - Singleton: `achievementService` (instância de `AchievementService`)
 - Arquivo: `services/adminService.ts`
   - Singleton: `adminService` (instância de `AdminService`)
 - Arquivo: `services/userService.ts`
   - Singleton: `userService` (instância de `UserService`)
 - Arquivo: `services/announcementService.ts`
   - Singleton: `announcementService` (instância de `AnnouncementService`)
 - Arquivo: `services/teacherService.ts`
   - Singleton: `teacherService` (instância de `TeacherService`)
 - Arquivo: `services/dashboardService.ts`
   - Singleton: `dashboardService` (instância de `DashboardService`)
 - Arquivo: `services/subscriptionService.ts`
   - Singleton: `subscriptionService` (instância de `SubscriptionService`)
 - Arquivo: `services/auditService.ts`
   - Singleton: `auditService` (instância de `AuditService`)

---

## AnnouncementService

- Arquivo: `services/announcementService.ts`
- Classe: `AnnouncementService`
- Métodos:
  - `createAnnouncement(title: string, message: string, type: AnnouncementType, createdBy: string, recipientType: "role" | "specific", roles?: UserRoles[], userIds?: string[]): Promise<Announcement>`
 - Singleton: `announcementService`

## AchievementService

- Arquivo: `services/achievementService.ts`
- Classe: `AchievementService`
- Métodos:
  - `getStudentAchievements(studentId: string): Promise<StudentAchievement[]>`
 - Singleton: `achievementService`

## TeacherService

- Arquivo: `services/teacherService.ts`
- Classe: `TeacherService`
- Métodos:
  - `getPopulatedScheduledClasses(teacherId: string): Promise<PopulatedStudentClass[]>`
 - Singleton: `teacherService`

## CreditService

- Arquivo: `services/creditService.ts`
- Classe: `CreditService`
- Métodos:
  - `grantCredits(request: GrantCreditRequest, grantedBy: string): Promise<RegularClassCredit>`
  - `getStudentCreditsBalance(studentId: string): Promise<RegularCreditsBalance>`
  - `useCredit(req: UseCreditRequest): Promise<void>`
  - `hasAvailableCredits(studentId: string): Promise<boolean>`
  - `markExpiredCredits(): Promise<void>`
  - `getCreditTransactionHistory(studentId: string): Promise<CreditTransaction[]>`
- Singleton: `creditService`

## PlacementService

- Arquivo: `services/placementService.ts`
- Classe: `PlacementService`
- Métodos:
  - `processPlacementTests(tests: PlacementTest[]): PlacementTestResult[]`
- Singleton: `placementService`

## DashboardService

- Arquivo: `services/dashboardService.ts`
- Classe: `DashboardService`
- Métodos:
  - `getDashboardData(): Promise<{ newUsersCount: number; activeTeachersCount: number; classesTodayCount: number; recentClasses: PopulatedStudentClass[]; monthlyRevenue: number; revenueTrend: number; }>`
 - Singleton: `dashboardService`

## ContractService

- Arquivo: `services/contractService.ts`
- Classe: `ContractService`
- Principais operações:
  - Criação, validação e assinatura administrativa de contratos
  - Renovação e cancelamento
  - Consulta de status e logs
  - Integração com auditoria e repositórios
- Singleton: `contractService`

## SchedulingService

- Arquivo: `services/schedulingService.ts`
- Classe: `SchedulingService`
- Principais operações:
  - Agendamento, remarcação e cancelamento de aulas
  - Consulta de disponibilidade do professor
  - Criação de exceções de disponibilidade
  - Atualizações de créditos relacionadas a remarcações
  - Busca de aulas futuras e dados populados
- Singleton: `schedulingService`

## EmailService

- Arquivo: `services/emailService.ts`
- Classe: `EmailService`
- Responsabilidades:
  - Envio de emails transacionais (boas-vindas, remarcação/cancelamento de aulas, férias de professor, cancelamento de férias, renovação de contrato)
 - Singleton: `emailService`

## AuthService

- Arquivo: `services/authService.ts`
- Classe: `AuthService`
- Responsabilidades:
  - Autenticação com email/senha
  - Integração com 2FA
  - Sincronização de dados de usuário entre Auth e Firestore
 - Singleton: `authService`
 - Nota: usa `twoFactorService` (singleton) internamente, evitando instâncias locais.

## TwoFactorService

- Arquivo: `services/twoFactorService.ts`
- Classe: `TwoFactorService`
- Responsabilidades:
  - Ativar/desativar 2FA
  - Geração/validação de códigos de verificação
  - Geração de códigos de backup
 - Singleton: `twoFactorService`

## AdminService

- Arquivo: `services/adminService.ts`
- Classe: `AdminService`
- Responsabilidades:
  - Ações administrativas: gerenciamento de usuários e papéis
  - Envio de emails
  - Verificação de permissões por papel
  - Operações com Admin SDK
 - Singleton: `adminService`

## UserService

- Arquivo: `services/userService.ts`
- Classe: `UserService`
- Responsabilidades:
  - Operações de alto nível com usuários (busca/atualização) utilizando repositórios
 - Singleton: `userService`

## Achievement Definitions (server-side)

- Arquivo: `services/achievementDefinitions.ts`
- Constantes e utilitários:
  - `achievementDefinitions: AchievementDefinition[]`
  - `getAchievementDefinition(id: string): AchievementDefinition | undefined`

## AuditService

- Arquivo: `services/auditService.ts`
- Interface: `AuditLog`
- Classe: `AuditService`
- Responsabilidades:
  - Registro e consulta de trilhas de auditoria
 - Singleton: `auditService`

## SubscriptionService

- Arquivo: `services/subscriptionService.ts`
- Classe: `SubscriptionService`
- Principais operações:
  - Criação de assinatura por PIX e cartão
  - Geração e disponibilização de pagamentos contratuais
  - Webhooks: processamento de eventos de pagamento/assinatura
  - Cancelamento com cálculo de taxa (quando aplicável)
  - Consulta de status e overview
- Métodos relevantes:
  - `createSubscription(params)`
  - `cancelSubscription(params)`
  - `processWebhookEvent(eventData)`
  - `getSubscription(id)` / `getActiveSubscription(userId)`
  - `getPaymentStatus(userId)` / `getCheckoutUrl(subscriptionId)`
- Singleton: `subscriptionService`

---

## Observações

- Prefira importar singletons expostos diretamente pelos arquivos quando disponível para evitar múltiplas instâncias.
- Para operações transacionais ou bateladas, utilize métodos dos repositórios correspondentes quando aplicável.
