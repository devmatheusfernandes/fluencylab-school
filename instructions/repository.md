# Repository — Functions and Utilities

Este documento lista funções, classes e singletons exportados do diretório `repositories` para facilitar a reutilização de lógica e evitar duplicação.

## Index (central utilities)

- Arquivo: `repositories/index.ts`
- Singletons exportados: `userRepository`, `userAdminRepository`, `classRepository`, `classTemplateRepository`, `availabilityRepository`, `paymentRepository`, `placementRepository`, `contractRepository`, `vacationRepository`, `announcementRepository`, `achievementRepository`
- Aliases legados: `legacyUserRepository`, `legacyClassTemplateRepository` (aliases para instâncias centralizadas)
- Types: `RepositoryInstances`
- Utilitários:
  - `getAllRepositories(): RepositoryInstances` – retorna todas as instâncias singleton
  - `validateRepositoryInstances(): boolean` – verifica a inicialização dos singletons

## UserRepository

- Arquivo: `repositories/userRepository.ts`
- Classe: `UserRepository`
- Métodos:
  - `findById(id: string): Promise<User | null>`
  - `findByEmail(email: string): Promise<User | null>`
  - `update(userId: string, data: Partial<User>): Promise<void>`
- Singleton (em `index.ts`): `userRepository`

## UserAdminRepository

- Arquivo: `repositories/user.admin.repository.ts`
- Função utilitária:
  - `getUserById_Admin(userId: string): Promise<User | null>`
- Classe: `UserAdminRepository`
- Métodos:
  - `findUsersByRole(role: string): Promise<User[]>`
  - `findUserById(userId: string): Promise<User | null>`
  - `findUsersByIds(userIds: string[]): Promise<User[]>`
  - `listUsers(filters?: { role?: string; isActive?: boolean }): Promise<User[]>`
  - `updateUserStatus(userId: string, isActive: boolean): Promise<void>`
  - `update(userId: string, data: Partial<User>): Promise<void>`
  - `countNewUsersThisMonth(): Promise<number>`
  - `countActiveTeachers(): Promise<number>`
  - `create(userData: Partial<User>): Promise<string>`

## ClassRepository

- Arquivo: `repositories/classRepository.ts`
- Classe: `ClassRepository`
- Métodos:
  - `createWithTransaction(transaction: FirebaseFirestore.Transaction, classData: Omit<StudentClass, 'id'>): string`
  - `findClassesByTeacherId(teacherId: string): Promise<StudentClass[]>`
  - `findFutureClassesByTeacherId(teacherId: string): Promise<StudentClass[]>`
  - `findAllClassesByTeacherId(teacherId: string): Promise<StudentClass[]>`
  - `findClassesByStudentId(studentId: string): Promise<StudentClass[]>`
  - `findClassByTeacherAndDateWithTransaction(transaction: Transaction, teacherId: string, scheduledAt: Date): Promise<FirebaseFirestore.QuerySnapshot>`
  - `countClassesOnDateForTeacher(transaction: Transaction, teacherId: string, date: Date): Promise<number>`
  - `findClassById(classId: string): Promise<StudentClass | null>`
  - `countClassesForToday(): Promise<number>`
  - `findRecentClassesWithUserDetails(limit: number): Promise<PopulatedStudentClass[]>`
  - `batchCreate(classes: Omit<StudentClass, 'id'>[]): Promise<void>`
  - `updateClassesStatusInRange(transaction: Transaction, teacherId: string, startDate: Date, endDate: Date, newStatus: ClassStatus): Promise<void>`
  - `findClassesByTeacherInRange(teacherId: string, startDate: Date, endDate: Date): Promise<StudentClass[]>`
  - `findAllClassesByStudentId(studentId: string): Promise<StudentClass[]>`
  - `deleteFutureClassesByTemplate(studentId: string, templatesToRemove: ClassTemplateDay[]): Promise<void>`
  - `deleteFutureClassesFromDate(studentId: string, fromDate: Date): Promise<number>`
  - `deleteFutureClassesInRange(studentId: string, fromDate: Date, toDate: Date): Promise<number>`
  - `deleteFutureClassesByTemplateFromDate(studentId: string, templateEntries: ClassTemplateDay[], fromDate: Date): Promise<number>`
  - `deleteFutureClassesByTemplateInRange(studentId: string, templateEntries: ClassTemplateDay[], fromDate: Date, toDate: Date): Promise<number>`
  - `hasFutureScheduledClasses(studentId: string): Promise<boolean>`
  - `updateClassesBySchedule(studentId: string, day: string, hour: string, newTeacherId: string): Promise<void>`
  - `update(classId: string, data: Partial<StudentClass>): Promise<void>`

## ClassTemplateRepository

- Arquivo: `repositories/ClassTemplateRepository.ts`
- Classe: `ClassTemplateRepository`
- Métodos:
  - `get(studentId: string): Promise<ClassTemplate | null>`
  - `upsert(studentId: string, templateData: ClassTemplate): Promise<void>`
  - `delete(studentId: string): Promise<void>`
- Singleton (em `index.ts`): `classTemplateRepository`

## AvailabilityRepository

- Arquivo: `repositories/availabilityRepository.ts`
- Classe: `AvailabilityRepository`
- Métodos:
  - `create(slotData: Omit<AvailabilitySlot, 'id'>): Promise<AvailabilitySlot>`
  - `findById(slotId: string): Promise<AvailabilitySlot | null>`
  - `findByTeacherId(teacherId: string): Promise<AvailabilitySlot[]>`
  - `deleteById(slotId: string): Promise<void>`
  - `update(slotId: string, data: object): Promise<void>`
  - `createException(slotId: string, teacherId: string, exceptionDate: Date): Promise<void>`
  - `findExceptionsByTeacherId(teacherId: string): Promise<AvailabilityException[]>`
  - `createExceptionWithTransaction(transaction: Transaction, slotId: string, teacherId: string, exceptionDate: Date): void`
  - `findAndDeleteException(originalSlotId: string, exceptionDate: Date): Promise<void>`

## PaymentRepository

- Arquivo: `repositories/paymentRepository.ts`
- Classe: `PaymentRepository`
- Métodos:
  - `findByUserId(userId: string): Promise<Payment[]>`

## PlacementRepository

- Arquivo: `repositories/placementRepository.ts`
- Classe: `PlacementRepository`
- Métodos:
  - `getPlacementTestsByUserId(userId: string): Promise<PlacementTest[]>`
  - `subscribeToPlacementTests(userId: string, callback: (tests: PlacementTest[]) => void): () => void`
- Singleton (em `index.ts`): `placementRepository`

## VacationRepository

- Arquivo: `repositories/VacationRepository.ts`
- Classe: `VacationRepository`
- Métodos:
  - `create(vacationData: Omit<Vacation, 'id'>): Promise<Vacation>`
  - `createWithTransaction(transaction: Transaction, vacationData: Omit<Vacation, 'id'>): void`
  - `findByTeacherAndYear(teacherId: string, year: number): Promise<Vacation[]>`
  - `findAllByTeacherId(teacherId: string): Promise<Vacation[]>`
  - `delete(vacationId: string): Promise<void>`
- Singleton (em `index.ts`): `vacationRepository`

## AnnouncementRepository

- Arquivo: `repositories/announcementRepository.ts`
- Classe: `AnnouncementRepository`
- Métodos:
  - `create(announcement: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>): Promise<Announcement>`
  - `findAll(): Promise<Announcement[]>`
  - `findById(id: string): Promise<Announcement | null>`
  - `update(id: string, data: Partial<Announcement>): Promise<void>`
  - `delete(id: string): Promise<void>`
  - `markAsRead(announcementId: string, userId: string): Promise<void>`
  - `getAnnouncementsForUser(userId: string, userRole: UserRoles): Promise<Announcement[]>`
  - `getUnreadCountForUser(userId: string, userRole: UserRoles): Promise<number>`

## AchievementRepository

- Arquivo: `repositories/achievementRepository.ts`
- Classe: `AchievementRepository`
- Métodos:
  - `getStudentAchievements(studentId: string): Promise<StudentAchievement[]>`
  - `updateStudentAchievements(studentId: string, achievements: StudentAchievement[]): Promise<void>`
  - `addStudentAchievement(studentId: string, achievement: StudentAchievement): Promise<void>`

## ContractRepository

- Arquivo: `repositories/contractRepository.ts`
- Classe: `ContractRepository`
- Métodos:
  - `getContractStatus(userId: string): Promise<ContractStatus | null>`
  - `getContractLog(userId: string, logId: string): Promise<ContractLog | null>`
  - `createContractLog(userId: string, contractData: Omit<ContractLog, 'logID'>): Promise<string>`
  - `updateContractStatus(userId: string, status: ContractStatus): Promise<void>`
  - `signContractAsAdmin(userId: string, logId: string, adminData: { name: string; cpf: string; ip?: string; browser?: string; }): Promise<void>`
  - `invalidateContract(userId: string): Promise<void>`
  - `getUserContractLogs(userId: string, limitCount?: number): Promise<ContractLog[]>`
  - `getUsersWithPendingContracts(): Promise<{ userId: string; status: ContractStatus }[]>`
  - `validateContractData(contractData: Partial<ContractLog>): ContractValidationError[]`
  - `updateContractForRenewal(userId: string, renewalData: { newExpirationDate: string; renewalCount: number; lastRenewalAt: string; autoRenewal: boolean; }): Promise<void>`
  - `updateContractForCancellation(userId: string, cancellationData: { cancelledAt: string; cancelledBy: string; cancellationReason: string; }): Promise<void>`
  - `getAllUsersWithActiveContracts(): Promise<{ userId: string; status: ContractStatus }[]>`
  - `createRenewalLog(userId: string, renewalData: { previousExpirationDate: string; newExpirationDate: string; renewalCount: number; renewalType: 'automatic' | 'manual'; renewedBy?: string; }): Promise<string>`
  - `createCancellationLog(userId: string, cancellationData: { cancelledBy: string; cancellationReason: string; isAdminCancellation: boolean; }): Promise<string>`
  - `getUserRenewalHistory(userId: string): Promise<any[]>`
  - `getUserCancellationHistory(userId: string): Promise<any[]>`
- Singleton (em `index.ts`): `contractRepository`

## Usage Tips

- Prefira importar singletons de `repositories/index.ts` para evitar instâncias duplicadas.
- Ao realizar escritas em lote ou transacionais, utilize métodos que aceitem `Transaction` para manter consistência.
- Para assinaturas em tempo real no cliente, use métodos que explicitamente utilizem SDKs client (ex.: `PlacementRepository.subscribeToPlacementTests`).