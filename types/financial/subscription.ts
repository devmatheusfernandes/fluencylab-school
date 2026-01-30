// types/financial/subscription.ts

/**
 * Monthly subscription for regular students
 */
export interface MonthlySubscription {
  id: string;
  userId: string;
  planType: 'pix';
  amount: number; // Amount in centavos
  currency: 'BRL';
  status: 'active' | 'pending' | 'overdue' | 'canceled' | 'suspended';
  paymentMethod: PaymentMethod;
  billingDay: number; // Day of the month for billing (1-28)
  nextBillingDate: Date;
  createdAt: Date;
  canceledAt?: Date;
  cancellationReason?: string;
  cancellationFee?: number; // Fee in centavos if applicable
  
  // Contract information
  contractLengthMonths: 6 | 12; // Contract duration
  contractStartDate: Date; // When the contract started
  contractEndDate: Date; // When the contract ends
  totalPayments: number; // Total number of payments in contract
  paymentsCompleted: number; // Number of payments completed
}

/**
 * Payment method information
 */
export interface PaymentMethod {
  type: 'pix';
}

/**
 * Individual monthly payment record
 */
export interface MonthlyPayment {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number; // Amount in centavos
  dueDate: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'canceled' | 'failed' | 'available';
  paymentMethod: 'pix';
  provider: 'abacatepay';
  providerPaymentId?: string; // AbacatePay PixQRCode id
  pixCode?: string;
  pixQrCode?: string; // Base64 QR code
  pixExpiresAt?: Date;
  receipt?: {
    url: string;
    sentAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Payment sequence information
  paymentNumber: number; // Which payment in the sequence (1, 2, 3...)
  description: string; // e.g., "Mensalidade Janeiro 2024 (1/12)"
  type?: 'monthly' | 'cancellation_fee';
}

/**
 * Payment status for dashboard widget
 */
export interface PaymentStatus {
  subscriptionId?: string; // Added for API calls
  userIsActive?: boolean; // Added for cancellation flow
  subscriptionStatus: 'active' | 'overdue' | 'canceled' | 'pending';
  nextPaymentDue?: Date;
  lastPaymentDate?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  pixCode?: string;
  pixQrCode?: string;
  pixExpiresAt?: Date;
  amount?: number;
  paymentMethod?: 'pix';
  overdueDays?: number;
}

/**
 * Subscription creation parameters
 */
export interface CreateSubscriptionParams {
  userId: string;
  userEmail: string;
  userRole: string;
  paymentMethod: 'pix';
  billingDay: number;
  contractLengthMonths: 6 | 12; // Contract duration
  contractStartDate?: Date;
  initialPaymentAmount?: number;
  initialPaymentDueDate?: Date;
  addLateCredits?: boolean;
  lateCreditsAmount?: number;
}

/**
 * Cancellation parameters
 */
export interface CancelSubscriptionParams {
  subscriptionId: string;
  reason: string;
  immediate?: boolean; // Cancel immediately or at end of period
}

/**
 * Subscription overview for managers
 */
export interface SubscriptionOverview {
  subscription: MonthlySubscription;
  payments: MonthlyPayment[];
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  nextPayment?: MonthlyPayment;
  contractProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export type AbacatePayWebhookEvent = {
  id: string;
  event: string; // e.g. "billing.paid"
  devMode?: boolean;
  data?: any;
};