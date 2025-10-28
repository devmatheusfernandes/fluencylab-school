// config/pricing.ts
import { UserRoles } from '@/types/users/userRoles';

/**
 * Secure server-side pricing configuration
 * Values are stored in centavos (Brazilian currency format)
 * Never expose these values to client-side code
 */
export const SUBSCRIPTION_PRICING = {
  REGULAR_STUDENT: {
    amount: 29900, // R$ 299,00 em centavos
    currency: 'BRL',
    description: 'Mensalidade Estudante Regular',
    planId: 'regular_student_monthly'
  },
  GUARDED_STUDENT: {
    amount: 29900, // R$ 299,00 em centavos - Igualado com estudante regular
    currency: 'BRL',
    description: 'Mensalidade Estudante Acompanhado',
    planId: 'guarded_student_monthly'
  },
  CANCELLATION_FEE: {
    amount: 5000, // R$ 50,00 em centavos
    currency: 'BRL',
    description: 'Taxa de Cancelamento',
    planId: 'cancellation_fee'
  }
} as const;

/**
 * Validates and returns the subscription price for a given user role
 * @param userRole - The user's role (STUDENT or GUARDED_STUDENT)
 * @returns Price in centavos
 * @throws Error if invalid role
 */
export function getSubscriptionPrice(userRole: UserRoles): number {
  if (userRole === UserRoles.STUDENT) {
    return SUBSCRIPTION_PRICING.REGULAR_STUDENT.amount;
  }
  if (userRole === UserRoles.GUARDED_STUDENT) {
    return SUBSCRIPTION_PRICING.GUARDED_STUDENT.amount;
  }
  throw new Error(`Invalid user role for subscription: ${userRole}`);
}

/**
 * Gets the subscription description for a given user role
 * @param userRole - The user's role
 * @returns Description string
 */
export function getSubscriptionDescription(userRole: UserRoles): string {
  if (userRole === UserRoles.STUDENT) {
    return SUBSCRIPTION_PRICING.REGULAR_STUDENT.description;
  }
  if (userRole === UserRoles.GUARDED_STUDENT) {
    return SUBSCRIPTION_PRICING.GUARDED_STUDENT.description;
  }
  throw new Error(`Invalid user role for subscription: ${userRole}`);
}

/**
 * Gets the plan ID for a given user role
 * @param userRole - The user's role
 * @returns Plan ID string
 */
export function getSubscriptionPlanId(userRole: UserRoles): string {
  if (userRole === UserRoles.STUDENT) {
    return SUBSCRIPTION_PRICING.REGULAR_STUDENT.planId;
  }
  if (userRole === UserRoles.GUARDED_STUDENT) {
    return SUBSCRIPTION_PRICING.GUARDED_STUDENT.planId;
  }
  throw new Error(`Invalid user role for subscription: ${userRole}`);
}

/**
 * Formats price from centavos to Brazilian Real
 * @param priceInCentavos - Price in centavos
 * @returns Formatted price string (e.g., "R$ 299,00")
 */
export function formatPrice(priceInCentavos: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(priceInCentavos / 100);
}