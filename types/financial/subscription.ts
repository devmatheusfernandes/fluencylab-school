// types/financial/subscription.ts

/**
 * Monthly subscription for regular students
 */
export interface MonthlySubscription {
  id: string;
  userId: string;
  planType: 'pix' | 'credit_card';
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
  mercadoPagoSubscriptionId?: string; // For credit card subscriptions
  
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
  type: 'pix' | 'credit_card';
  cardId?: string; // For saved credit cards
  lastFourDigits?: string;
  brand?: string; // visa, mastercard, etc.
  cardholderName?: string;
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
  paymentMethod: 'pix' | 'credit_card';
  mercadoPagoPaymentId?: string;
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
}

/**
 * Payment status for dashboard widget
 */
export interface PaymentStatus {
  subscriptionId?: string; // Added for API calls
  subscriptionStatus: 'active' | 'overdue' | 'canceled' | 'pending';
  nextPaymentDue?: Date;
  lastPaymentDate?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  pixCode?: string;
  pixQrCode?: string;
  pixExpiresAt?: Date;
  amount?: number;
  paymentMethod?: 'pix' | 'credit_card';
  overdueDays?: number;
}

/**
 * Subscription creation parameters
 */
export interface CreateSubscriptionParams {
  userId: string;
  userEmail: string;
  userRole: string;
  paymentMethod: 'pix' | 'credit_card';
  billingDay: number;
  cardToken?: string; // For credit card subscriptions
  contractLengthMonths: 6 | 12; // Contract duration
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

/**
 * Mercado Pago webhook event types
 */
export type MercadoPagoEventType = 
  | 'payment'
  | 'subscription'
  | 'subscription_preapproval'
  | 'subscription_authorized_payment'
  | 'invoice';

/**
 * Mercado Pago webhook payload
 */
export interface MercadoPagoWebhookPayload {
  id: string;
  live_mode: boolean;
  type: MercadoPagoEventType;
  date_created: string;
  application_id: string;
  user_id: string;
  version: string;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}