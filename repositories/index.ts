// repositories/index.ts
// Instâncias singleton centralizadas para todos os repositórios
// Resolve o problema de instanciação duplicada identificado no relatório de auditoria

import { UserRepository } from './core/userRepository';
import { UserAdminRepository } from './admin/userAdminRepository';
import { ClassRepository } from './learning/classRepository';
import { ClassTemplateRepository } from './learning/classTemplateRepository';
import { AvailabilityRepository } from './teacher/availabilityRepository';
import { PaymentRepository } from './financial/paymentRepository';
import { PlacementRepository } from './learning/placementRepository';
import { ContractRepository } from './financial/contractRepository';
import { VacationRepository } from './teacher/vacationRepository';
import { AnnouncementRepository } from './communication/announcementRepository';
import { AchievementRepository } from './learning/achievementRepository';
import { CourseRepository } from './learning/courseRepository';
import { PlanRepository } from './financial/planRepository';

// ============================================================================
// INSTÂNCIAS SINGLETON CENTRALIZADAS
// ============================================================================

/**
 * Repositório principal de usuários (operações básicas)
 */
export const userRepository = new UserRepository();

/**
 * Repositório administrativo de usuários (operações avançadas)
 */
export const userAdminRepository = new UserAdminRepository();

/**
 * Repositório de aulas
 */
export const classRepository = new ClassRepository();

/**
 * Repositório de templates de aulas
 */
export const classTemplateRepository = new ClassTemplateRepository();

/**
 * Repositório de disponibilidade
 */
export const availabilityRepository = new AvailabilityRepository();

/**
 * Repositório de pagamentos
 */
export const paymentRepository = new PaymentRepository();

/**
 * Repositório de testes de nivelamento
 */
export const placementRepository = new PlacementRepository();

/**
 * Repositório de contratos
 */
export const contractRepository = new ContractRepository();

/**
 * Repositório de férias
 */
export const vacationRepository = new VacationRepository();

/**
 * Repositório de anúncios
 */
export const announcementRepository = new AnnouncementRepository();

/**
 * Repositório de conquistas
 */
export const achievementRepository = new AchievementRepository();
export const courseRepository = new CourseRepository();
export const planRepository = new PlanRepository();

// ============================================================================
// EXPORTAÇÕES LEGACY (para compatibilidade)
// ============================================================================

// Compatibilidade: expõe aliases para instâncias centralizadas
export const legacyUserRepository = userRepository;
export const legacyClassTemplateRepository = classTemplateRepository;

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type RepositoryInstances = {
  userRepository: UserRepository;
  userAdminRepository: UserAdminRepository;
  classRepository: ClassRepository;
  classTemplateRepository: ClassTemplateRepository;
  availabilityRepository: AvailabilityRepository;
  paymentRepository: PaymentRepository;
  placementRepository: PlacementRepository;
  contractRepository: ContractRepository;
  vacationRepository: VacationRepository;
  announcementRepository: AnnouncementRepository;
  achievementRepository: AchievementRepository;
  courseRepository: CourseRepository;
};

/**
 * Função utilitária para obter todas as instâncias de repositórios
 * Útil para injeção de dependência ou testes
 */
export function getAllRepositories(): RepositoryInstances {
  return {
    userRepository,
    userAdminRepository,
    classRepository,
    classTemplateRepository,
    availabilityRepository,
    paymentRepository,
    placementRepository,
    contractRepository,
    vacationRepository,
    announcementRepository,
    achievementRepository,
    courseRepository
  };
}

/**
 * Função para validar se todas as instâncias estão inicializadas
 * Útil para health checks
 */
export function validateRepositoryInstances(): boolean {
  const repositories = getAllRepositories();
  
  return Object.values(repositories).every(repo => {
    return repo && typeof repo === 'object';
  });
}

// ============================================================================
// DOCUMENTAÇÃO
// ============================================================================

/**
 * COMO USAR:
 * 
 * // Ao invés de:
 * const userAdminRepo = new UserAdminRepository();
 * 
 * // Use:
 * import { userAdminRepository } from '@/repositories';
 * 
 * // Ou para múltiplos repositórios:
 * import { 
 *   userRepository, 
 *   classRepository, 
 *   paymentRepository 
 * } from '@/repositories';
 * 
 * BENEFÍCIOS:
 * - Evita instanciação duplicada
 * - Melhora performance (reutilização de conexões)
 * - Facilita testes (injeção de dependência)
 * - Centraliza configuração
 * - Reduz uso de memória
 */
