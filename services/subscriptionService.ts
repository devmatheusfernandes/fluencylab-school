// services/subscriptionService.ts
import { Payment, Preference, PreApproval } from 'mercadopago';
import { mercadoPagoClient, MERCADO_PAGO_CONFIG, generateIdempotencyKey } from '@/lib/mercadopago/config';
import { getSubscriptionPrice, getSubscriptionDescription, SUBSCRIPTION_PRICING } from '@/config/pricing';
import { adminDb } from '@/lib/firebase/admin';
import { 
  MonthlySubscription, 
  MonthlyPayment, 
  CreateSubscriptionParams, 
  CancelSubscriptionParams,
  PaymentStatus,
  SubscriptionOverview
} from '@/types/financial/subscription';
import { UserRoles } from '@/types/users/userRoles';

export class SubscriptionService {
  private payment: Payment;
  private preference: Preference;
  private preApproval: PreApproval;

  constructor() {
    this.payment = new Payment(mercadoPagoClient);
    this.preference = new Preference(mercadoPagoClient);
    this.preApproval = new PreApproval(mercadoPagoClient);
  }

  /**
   * Creates a new subscription for a user
   */
  async createSubscription(params: CreateSubscriptionParams) {
    const { userId, userEmail, userRole, paymentMethod, billingDay, cardToken, contractLengthMonths } = params;
    
    // Validate user role
    if (userRole !== UserRoles.STUDENT && userRole !== UserRoles.GUARDED_STUDENT) {
      throw new Error('Invalid user role for subscription');
    }

    const amount = getSubscriptionPrice(userRole as UserRoles);
    const description = getSubscriptionDescription(userRole as UserRoles);
    
    if (paymentMethod === 'pix') {
      return this.createPixSubscription({
        userId,
        userEmail,
        amount,
        description,
        billingDay,
        contractLengthMonths
      });
    } else {
      return this.createCardSubscription({
        userId,
        userEmail,
        amount,
        description,
        billingDay,
        cardToken,
        contractLengthMonths
      });
    }
  }

  /**
   * Creates a PIX-based subscription with pre-generated contract payments
   */
  private async createPixSubscription(params: {
    userId: string;
    userEmail: string;
    amount: number;
    description: string;
    billingDay: number;
    contractLengthMonths: 6 | 12;
  }) {
    const { userId, userEmail, amount, description, billingDay, contractLengthMonths } = params;

    console.log('Creating PIX subscription with webhook URL:', MERCADO_PAGO_CONFIG.WEBHOOK_URL);

    // Calculate contract dates
    const contractStartDate = new Date();
    const contractEndDate = new Date(contractStartDate);
    contractEndDate.setMonth(contractEndDate.getMonth() + contractLengthMonths);

    // Create subscription record
    const subscription: MonthlySubscription = {
      id: crypto.randomUUID(),
      userId,
      planType: 'pix',
      amount,
      currency: 'BRL',
      status: 'active',
      paymentMethod: { type: 'pix' },
      billingDay,
      nextBillingDate: this.calculateNextBillingDate(billingDay),
      createdAt: contractStartDate,
      contractLengthMonths,
      contractStartDate,
      contractEndDate,
      totalPayments: contractLengthMonths,
      paymentsCompleted: 0
    };

    // Save subscription to database
    await this.saveSubscription(subscription);
    
    // Generate all contract payments in advance
    await this.generateContractPayments(subscription);
    
    // Create the first PIX payment (make it available immediately)
    const firstPayment = await this.makePaymentAvailable(subscription.id, 1);
    
    // Update user subscription status
    await this.updateUserSubscriptionStatus(userId, {
      subscriptionStatus: 'active',
      mercadoPagoSubscriptionId: subscription.id
    });

    return {
      subscription,
      firstPayment
    };
  }

  /**
   * Creates a credit card subscription (automatic recurring)
   */
  private async createCardSubscription(params: {
    userId: string;
    userEmail: string;
    amount: number;
    description: string;
    billingDay: number;
    cardToken?: string;
    contractLengthMonths: 6 | 12;
  }) {
    const { userId, userEmail, amount, description, billingDay, cardToken, contractLengthMonths } = params;

    console.log('Creating card subscription with webhook URL:', MERCADO_PAGO_CONFIG.WEBHOOK_URL);

    // Calculate start date (next billing date) - ensure it's at least 1 hour in the future
    const startDate = this.calculateNextBillingDate(billingDay);
    const now = new Date();
    if (startDate.getTime() - now.getTime() < 60 * 60 * 1000) { // Less than 1 hour
      startDate.setMonth(startDate.getMonth() + 1); // Move to next month
    }
    
    // Calculate contract dates
    const contractStartDate = new Date();
    const contractEndDate = new Date(contractStartDate);
    contractEndDate.setMonth(contractEndDate.getMonth() + contractLengthMonths);

    // Create pre-approval (subscription) with Mercado Pago
    const preApprovalData = {
      reason: description,
      auto_recurring: {
        frequency: MERCADO_PAGO_CONFIG.SUBSCRIPTION_FREQUENCY,
        frequency_type: MERCADO_PAGO_CONFIG.SUBSCRIPTION_FREQUENCY_TYPE,
        transaction_amount: amount / 100, // Convert from centavos to reais
        currency_id: 'BRL',
        start_date: startDate.toISOString(),
      },
      payer_email: userEmail,
      back_url: MERCADO_PAGO_CONFIG.SUCCESS_URL, // PreApproval uses singular back_url
      notification_url: MERCADO_PAGO_CONFIG.WEBHOOK_URL,
      external_reference: userId,
      payment_methods_allowed: {
        payment_types: [{ id: 'credit_card' }],
        payment_methods: []
      }
    };

    // Create the subscription with Mercado Pago
    const mpSubscription = await this.preApproval.create({
      body: preApprovalData,
      requestOptions: {
        idempotencyKey: generateIdempotencyKey()
      }
    });

    // Create local subscription record
    const subscription: MonthlySubscription = {
      id: crypto.randomUUID(),
      userId,
      planType: 'credit_card',
      amount,
      currency: 'BRL',
      status: 'pending', // Will be updated via webhook
      paymentMethod: { type: 'credit_card' },
      billingDay,
      nextBillingDate: startDate,
      createdAt: contractStartDate,
      mercadoPagoSubscriptionId: mpSubscription.id?.toString(),
      contractLengthMonths,
      contractStartDate,
      contractEndDate,
      totalPayments: contractLengthMonths,
      paymentsCompleted: 0
    };

    await this.saveSubscription(subscription);

    return {
      subscription,
      checkoutUrl: mpSubscription.init_point,
      subscriptionId: mpSubscription.id
    };
  }

  /**
   * Generates a PIX payment for a specific payment number (legacy method for contract system)
   */
  async generateMonthlyPixPayment(subscriptionId: string, paymentNumber?: number) {
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    
    // For contract-based subscriptions, find the next payment to make available
    if (paymentNumber) {
      return this.makePaymentAvailable(subscriptionId, paymentNumber);
    }
    
    // Find next payment that should be available
    const payments = await this.getSubscriptionPayments(subscriptionId);
    const now = new Date();
    
    const nextPayment = payments.find(payment => {
      if (payment.status !== 'pending') return false;
      
      const dueDate = new Date(payment.dueDate);
      const twoDaysBeforeDue = new Date(dueDate);
      twoDaysBeforeDue.setDate(twoDaysBeforeDue.getDate() - 2);
      
      return now >= twoDaysBeforeDue;
    });
    
    if (!nextPayment) {
      throw new Error('No payment available for generation at this time');
    }
    
    return this.makePaymentAvailable(subscriptionId, nextPayment.paymentNumber);
  }

  /**
   * Cancels a subscription
   */
  async cancelSubscription(params: CancelSubscriptionParams) {
    const { subscriptionId, reason, immediate = false } = params;
    
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    // Calculate cancellation fee if applicable
    const cancellationFee = this.shouldChargeCancellationFee(subscription) 
      ? SUBSCRIPTION_PRICING.CANCELLATION_FEE.amount 
      : 0;

    // Cancel Mercado Pago subscription if it's credit card
    if (subscription.planType === 'credit_card' && subscription.mercadoPagoSubscriptionId) {
      try {
        // Note: Mercado Pago PreApproval update to cancel
        await this.preApproval.update({
          id: subscription.mercadoPagoSubscriptionId,
          body: { status: 'cancelled' },
          requestOptions: {
            idempotencyKey: generateIdempotencyKey()
          }
        });
      } catch (error) {
        console.error('Error canceling Mercado Pago subscription:', error);
        // Continue with local cancellation even if MP fails
      }
    }

    // Update local subscription
    const updatedSubscription: MonthlySubscription = {
      ...subscription,
      status: 'canceled',
      canceledAt: new Date(),
      cancellationReason: reason,
      cancellationFee: cancellationFee > 0 ? cancellationFee : undefined
    };

    await this.saveSubscription(updatedSubscription);

    // Update user status
    await this.updateUserSubscriptionStatus(subscription.userId, {
      subscriptionStatus: 'canceled'
    });

    // Generate cancellation fee payment if applicable
    if (cancellationFee > 0) {
      await this.generateCancellationFeePayment(subscription.userId, cancellationFee);
    }

    return {
      canceled: true,
      cancellationFee,
      effectiveDate: immediate ? new Date() : subscription.nextBillingDate
    };
  }

  /**
   * Gets checkout URL for pending credit card subscription
   */
  async getCheckoutUrl(subscriptionId: string): Promise<string | null> {
    console.log('Getting checkout URL for subscription:', subscriptionId);
    
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    
    if (!subscription) {
      console.log('Subscription not found:', subscriptionId);
      return null;
    }
    
    console.log('Subscription found:', {
      id: subscription.id,
      planType: subscription.planType,
      status: subscription.status,
      mercadoPagoSubscriptionId: subscription.mercadoPagoSubscriptionId
    });
    
    if (subscription.planType !== 'credit_card') {
      console.log('Subscription is not credit card type:', subscription.planType);
      return null;
    }
    
    if (subscription.status !== 'pending') {
      console.log('Subscription status is not pending:', subscription.status);
      return null;
    }

    if (!subscription.mercadoPagoSubscriptionId) {
      console.log('No Mercado Pago subscription ID found');
      return null;
    }

    try {
      console.log('Fetching Mercado Pago subscription:', subscription.mercadoPagoSubscriptionId);
      
      // Get the current preapproval from Mercado Pago
      const mpSubscription = await this.preApproval.get({ 
        id: subscription.mercadoPagoSubscriptionId 
      });
      
      console.log('Mercado Pago subscription response:', {
        id: mpSubscription.id,
        status: mpSubscription.status,
        init_point: mpSubscription.init_point ? 'Present' : 'Missing',
        reason: mpSubscription.reason || 'No reason'
      });
      
      const checkoutUrl = mpSubscription.init_point || null;
      console.log('Final checkout URL:', checkoutUrl ? 'Present' : 'Missing');
      
      return checkoutUrl;
    } catch (error) {
      console.error('Error getting checkout URL from Mercado Pago:', {
        subscriptionId,
        mercadoPagoId: subscription.mercadoPagoSubscriptionId,
        error: error instanceof Error ? error.message : error
      });
      
      // If the error is about the subscription not being found or expired,
      // we might need to create a new one
      if (error instanceof Error && error.message.includes('not_found')) {
        console.log('Mercado Pago subscription not found, may have expired');
      }
      
      return null;
    }
  }

  /**
   * Recreates a credit card subscription if the original has expired
   */
  async recreateCreditCardSubscription(subscriptionId: string): Promise<string | null> {
    console.log('Recreating credit card subscription:', subscriptionId);
    
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    
    if (!subscription || subscription.planType !== 'credit_card') {
      console.log('Invalid subscription for recreation:', {
        found: !!subscription,
        planType: subscription?.planType
      });
      return null;
    }
    
    // Get user details
    const user = await this.getUser(subscription.userId);
    if (!user) {
      console.log('User not found for subscription recreation:', subscription.userId);
      return null;
    }
    
    try {
      // Create new PreApproval with same parameters
      const startDate = new Date(subscription.nextBillingDate);
      const now = new Date();
      if (startDate.getTime() - now.getTime() < 60 * 60 * 1000) { // Less than 1 hour
        startDate.setMonth(startDate.getMonth() + 1); // Move to next month
      }
      
      const preApprovalData = {
        reason: `Recriação - ${getSubscriptionDescription(user.role)}`,
        auto_recurring: {
          frequency: MERCADO_PAGO_CONFIG.SUBSCRIPTION_FREQUENCY,
          frequency_type: MERCADO_PAGO_CONFIG.SUBSCRIPTION_FREQUENCY_TYPE,
          transaction_amount: subscription.amount / 100, // Convert from centavos to reais
          currency_id: 'BRL',
          start_date: startDate.toISOString(),
        },
        payer_email: user.email,
        back_url: MERCADO_PAGO_CONFIG.SUCCESS_URL,
        notification_url: MERCADO_PAGO_CONFIG.WEBHOOK_URL,
        external_reference: subscription.userId,
        payment_methods_allowed: {
          payment_types: [{ id: 'credit_card' }],
          payment_methods: []
        }
      };
      
      console.log('Creating new Mercado Pago PreApproval for recreation');
      const mpSubscription = await this.preApproval.create({
        body: preApprovalData,
        requestOptions: {
          idempotencyKey: generateIdempotencyKey()
        }
      });
      
      // Update subscription with new Mercado Pago ID
      await this.updateSubscription(subscriptionId, {
        mercadoPagoSubscriptionId: mpSubscription.id?.toString(),
        nextBillingDate: startDate
      });
      
      console.log('Credit card subscription recreated successfully:', {
        subscriptionId,
        newMercadoPagoId: mpSubscription.id,
        initPoint: mpSubscription.init_point ? 'Present' : 'Missing'
      });
      
      return mpSubscription.init_point || null;
    } catch (error) {
      console.error('Error recreating credit card subscription:', {
        subscriptionId,
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  }

  /**
   * Gets payment status for a user with contract-based logic
   */
  async getPaymentStatus(userId: string): Promise<PaymentStatus> {
    const subscription = await this.getActiveSubscription(userId);
    
    if (!subscription) {
      return { subscriptionStatus: 'canceled' };
    }

    // For PIX subscriptions, use the new contract-based logic
    if (subscription.planType === 'pix') {
      return this.getPixPaymentStatus(subscription);
    }

    // For credit card subscriptions, use existing logic
    const latestPayment = await this.getLatestPayment(subscription.id);
    
    const now = new Date();
    const nextBillingDate = new Date(subscription.nextBillingDate);
    const isOverdue = nextBillingDate < now && subscription.status === 'active';
    const overdueDays = isOverdue 
      ? Math.floor((now.getTime() - nextBillingDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const status: PaymentStatus = {
      subscriptionId: subscription.id,
      subscriptionStatus: isOverdue ? 'overdue' : (subscription.status === 'suspended' ? 'canceled' : subscription.status),
      nextPaymentDue: nextBillingDate,
      lastPaymentDate: latestPayment?.paidAt ? new Date(latestPayment.paidAt) : undefined,
      amount: subscription.amount,
      paymentMethod: subscription.paymentMethod.type,
      overdueDays: overdueDays > 0 ? overdueDays : undefined
    };

    return status;
  }
  
  /**
   * Gets PIX payment status with contract-based logic
   */
  private async getPixPaymentStatus(subscription: MonthlySubscription): Promise<PaymentStatus> {
    const payments = await this.getSubscriptionPayments(subscription.id);
    const now = new Date();
    
    // Find current payment (payment that should be available or due)
    let currentPayment = payments.find(payment => {
      const dueDate = new Date(payment.dueDate);
      const twoDaysBeforeDue = new Date(dueDate);
      twoDaysBeforeDue.setDate(twoDaysBeforeDue.getDate() - 2);
      
      return now >= twoDaysBeforeDue && payment.status !== 'paid';
    });
    
    // If no current payment found, find the next pending payment
    if (!currentPayment) {
      currentPayment = payments.find(p => p.status === 'pending');
    }
    
    const latestPaidPayment = payments.filter(p => p.status === 'paid').pop();
    
    let subscriptionStatus: PaymentStatus['subscriptionStatus'] = 'active';
    let overdueDays: number | undefined;
    
    if (currentPayment) {
      const dueDate = new Date(currentPayment.dueDate);
      const twoDaysAfterDue = new Date(dueDate);
      twoDaysAfterDue.setDate(twoDaysAfterDue.getDate() + 2);
      
      if (now > twoDaysAfterDue && currentPayment.status !== 'paid') {
        subscriptionStatus = 'overdue';
        overdueDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    
    const status: PaymentStatus = {
      subscriptionId: subscription.id,
      subscriptionStatus,
      nextPaymentDue: currentPayment ? new Date(currentPayment.dueDate) : undefined,
      lastPaymentDate: latestPaidPayment?.paidAt ? new Date(latestPaidPayment.paidAt) : undefined,
      amount: subscription.amount,
      paymentMethod: 'pix',
      overdueDays
    };
    
    // Add PIX details if payment is available
    if (currentPayment && (currentPayment.status === 'available' || currentPayment.pixCode)) {
      status.pixCode = currentPayment.pixCode;
      status.pixQrCode = currentPayment.pixQrCode;
      status.pixExpiresAt = currentPayment.pixExpiresAt ? new Date(currentPayment.pixExpiresAt) : undefined;
    }
    
    return status;
  }

  /**
   * Processes webhook notifications from Mercado Pago
   */
  async processWebhookEvent(eventData: any) {
    const { type, data } = eventData;

    switch (type) {
      case 'payment':
        await this.handlePaymentEvent(data.id);
        break;
      case 'subscription_preapproval':
        await this.handleSubscriptionEvent(data.id);
        break;
      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
  }

  // Private helper methods

  private async handlePaymentEvent(paymentId: string) {
    try {
      const mpPayment = await this.payment.get({ id: paymentId });
      const metadata = mpPayment.metadata;
      
      if (metadata?.payment_type === 'monthly_subscription') {
        // Update the specific payment record
        await this.updatePaymentStatusByMercadoPagoId(paymentId, mpPayment.status || 'pending');
        
        if (mpPayment.status === 'approved') {
          await this.handleSuccessfulPayment(metadata.subscription_id, metadata.user_id);
        }
      }
    } catch (error) {
      console.error('Error handling payment event:', error);
    }
  }

  private async handleSubscriptionEvent(subscriptionId: string) {
    try {
      const mpSubscription = await this.preApproval.get({ id: subscriptionId });
      const subscription = await this.getSubscriptionByMercadoPagoId(subscriptionId);
      
      if (subscription) {
        let status: MonthlySubscription['status'] = 'pending';
        
        switch (mpSubscription.status) {
          case 'authorized':
            status = 'active';
            break;
          case 'cancelled':
            status = 'canceled';
            break;
          case 'paused':
            status = 'suspended';
            break;
        }

        await this.updateSubscriptionStatus(subscription.id, status);
        await this.updateUserSubscriptionStatus(subscription.userId, {
          subscriptionStatus: status === 'active' ? 'active' : status
        });
      }
    } catch (error) {
      console.error('Error handling subscription event:', error);
    }
  }

  private async handleSuccessfulPayment(subscriptionId: string, userId: string) {
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    if (!subscription) return;

    // For PIX subscriptions with contract system
    if (subscription.planType === 'pix') {
      await this.handlePixPaymentSuccess(subscriptionId, userId);
      return;
    }

    // For credit card subscriptions (existing logic)
    const nextBillingDate = this.calculateNextBillingDate(subscription.billingDay);
    await this.updateSubscription(subscriptionId, {
      nextBillingDate,
      status: 'active'
    });

    // Update user status
    await this.updateUserSubscriptionStatus(userId, {
      subscriptionStatus: 'active'
    });

    // Send payment confirmation email
    // TODO: Implement email service call
    console.log(`Payment successful for user ${userId}, subscription ${subscriptionId}`);
  }
  
  /**
   * Handles successful PIX payment in contract system
   */
  private async handlePixPaymentSuccess(subscriptionId: string, userId: string) {
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    if (!subscription) return;
    
    // Update subscription payment count
    const newPaymentsCompleted = subscription.paymentsCompleted + 1;
    
    await this.updateSubscription(subscriptionId, {
      paymentsCompleted: newPaymentsCompleted,
      status: newPaymentsCompleted >= subscription.totalPayments ? 'canceled' : 'active' // Complete contract
    });
    
    // Update user status
    await this.updateUserSubscriptionStatus(userId, {
      subscriptionStatus: newPaymentsCompleted >= subscription.totalPayments ? 'canceled' : 'active'
    });
    
    // Make next payment available if contract not completed and within 2 days of next due date
    if (newPaymentsCompleted < subscription.totalPayments) {
      const payments = await this.getSubscriptionPayments(subscriptionId);
      const nextPayment = payments.find(p => p.paymentNumber === newPaymentsCompleted + 1);
      
      if (nextPayment) {
        const now = new Date();
        const dueDate = new Date(nextPayment.dueDate);
        const twoDaysBeforeDue = new Date(dueDate);
        twoDaysBeforeDue.setDate(twoDaysBeforeDue.getDate() - 2);
        
        // Auto-generate next payment if within 2 days of due date
        if (now >= twoDaysBeforeDue) {
          await this.makePaymentAvailable(subscriptionId, nextPayment.paymentNumber);
        }
      }
    }
    
    console.log(`PIX payment successful for user ${userId}, subscription ${subscriptionId}, payment ${newPaymentsCompleted}/${subscription.totalPayments}`);
  }

  private shouldChargeCancellationFee(subscription: MonthlySubscription): boolean {
    const subscriptionAge = Date.now() - subscription.createdAt.getTime();
    const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000;
    return subscriptionAge < sixMonthsInMs;
  }

  private calculateNextBillingDate(billingDay: number): Date {
    const now = new Date();
    const nextBilling = new Date(now.getFullYear(), now.getMonth(), billingDay);
    
    // If billing day has passed this month, move to next month
    if (nextBilling <= now) {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }
    
    // Handle edge cases (e.g., billing day 31 in February)
    if (nextBilling.getDate() !== billingDay) {
      nextBilling.setDate(0); // Go to last day of previous month
    }
    
    return nextBilling;
  }

  // Database operations

  async getSubscription(id: string): Promise<MonthlySubscription | null> {
    const doc = await adminDb.collection('subscriptions').doc(id).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as MonthlySubscription;
    // Ensure dates are properly converted
    return {
      ...data,
      nextBillingDate: new Date(data.nextBillingDate),
      createdAt: new Date(data.createdAt),
      canceledAt: data.canceledAt ? new Date(data.canceledAt) : undefined
    };
  }

  private async saveSubscription(subscription: MonthlySubscription) {
    const subscriptionRef = adminDb.collection('subscriptions').doc(subscription.id);
    
    // Create a clean object without undefined values
    const cleanSubscription: any = {};
    Object.entries(subscription).forEach(([key, value]) => {
      if (value !== undefined) {
        // Ensure Date objects are valid, let Firestore handle conversion
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            console.error(`Invalid date for field ${key}:`, value);
            throw new Error(`Invalid date value for field ${key}`);
          }
        }
        cleanSubscription[key] = value;
      }
    });
    
    await subscriptionRef.set(cleanSubscription);
  }

  private async saveMonthlyPayment(payment: MonthlyPayment) {
    const paymentRef = adminDb.collection('monthlyPayments').doc(payment.id);
    
    // Create a clean object without undefined values
    const cleanPayment: any = {};
    Object.entries(payment).forEach(([key, value]) => {
      if (value !== undefined) {
        // Ensure Date objects are valid, let Firestore handle conversion
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            console.error(`Invalid date for field ${key}:`, value);
            throw new Error(`Invalid date value for field ${key}`);
          }
        }
        cleanPayment[key] = value;
      }
    });
    
    await paymentRef.set(cleanPayment);
  }

  private async getSubscriptionPrivate(id: string): Promise<MonthlySubscription | null> {
    const doc = await adminDb.collection('subscriptions').doc(id).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as MonthlySubscription;
    
    // Helper function to safely convert dates
    const safeConvertDate = (dateValue: any): Date | undefined => {
      if (!dateValue) return undefined;
      
      // If it's already a Date object, validate it
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? undefined : dateValue;
      }
      
      // If it's a Firestore Timestamp, convert it
      if (dateValue && typeof dateValue.toDate === 'function') {
        const converted = dateValue.toDate();
        return isNaN(converted.getTime()) ? undefined : converted;
      }
      
      // If it's a string or number, try to convert
      const converted = new Date(dateValue);
      return isNaN(converted.getTime()) ? undefined : converted;
    };
    
    // Ensure dates are properly converted
    return {
      ...data,
      nextBillingDate: safeConvertDate(data.nextBillingDate) || new Date(),
      createdAt: safeConvertDate(data.createdAt) || new Date(),
      contractStartDate: safeConvertDate(data.contractStartDate) || new Date(),
      contractEndDate: safeConvertDate(data.contractEndDate) || new Date(),
      canceledAt: safeConvertDate(data.canceledAt)
    };
  }

  async getActiveSubscription(userId: string): Promise<MonthlySubscription | null> {
    const snapshot = await adminDb.collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', 'in', ['active', 'pending', 'overdue'])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data() as MonthlySubscription;
    // Ensure dates are properly converted
    return {
      ...data,
      nextBillingDate: new Date(data.nextBillingDate),
      createdAt: new Date(data.createdAt),
      canceledAt: data.canceledAt ? new Date(data.canceledAt) : undefined
    };
  }

  private async getSubscriptionByMercadoPagoId(mpId: string): Promise<MonthlySubscription | null> {
    const snapshot = await adminDb.collection('subscriptions')
      .where('mercadoPagoSubscriptionId', '==', mpId)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data() as MonthlySubscription;
    // Ensure dates are properly converted
    return {
      ...data,
      nextBillingDate: new Date(data.nextBillingDate),
      createdAt: new Date(data.createdAt),
      canceledAt: data.canceledAt ? new Date(data.canceledAt) : undefined
    };
  }

  private async getLatestPayment(subscriptionId: string): Promise<MonthlyPayment | null> {
    const snapshot = await adminDb.collection('monthlyPayments')
      .where('subscriptionId', '==', subscriptionId)
      .where('status', '==', 'paid')
      .orderBy('paidAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data() as MonthlyPayment;
    // Ensure dates are properly converted
    return {
      ...data,
      dueDate: new Date(data.dueDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      pixExpiresAt: data.pixExpiresAt ? new Date(data.pixExpiresAt) : undefined
    };
  }

  private async getPendingPixPayment(subscriptionId: string): Promise<MonthlyPayment | null> {
    const snapshot = await adminDb.collection('monthlyPayments')
      .where('subscriptionId', '==', subscriptionId)
      .where('status', '==', 'pending')
      .where('paymentMethod', '==', 'pix')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data() as MonthlyPayment;
    // Ensure dates are properly converted
    return {
      ...data,
      dueDate: new Date(data.dueDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      pixExpiresAt: data.pixExpiresAt ? new Date(data.pixExpiresAt) : undefined
    };
  }

  private async getUser(userId: string) {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    return userDoc.exists ? userDoc.data() : null;
  }

  private async updateUserSubscriptionStatus(userId: string, updates: {
    subscriptionStatus?: string;
    mercadoPagoSubscriptionId?: string;
  }) {
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update(updates);
  }

  private async updateSubscriptionStatus(subscriptionId: string, status: MonthlySubscription['status']) {
    const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
    await subscriptionRef.update({ status });
  }

  private async updateSubscription(subscriptionId: string, updates: Partial<MonthlySubscription>) {
    const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
    await subscriptionRef.update(updates);
  }

  private async updatePaymentStatusByMercadoPagoId(paymentId: string, status: string) {
    const snapshot = await adminDb.collection('monthlyPayments')
      .where('mercadoPagoPaymentId', '==', paymentId)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const paymentRef = snapshot.docs[0].ref;
      const now = new Date();
      
      // Validate the date before using it
      if (isNaN(now.getTime())) {
        console.error('Invalid date generated for update operation:', now);
        throw new Error('Invalid date value for update operation');
      }
      
      const updateData: any = { 
        status: this.mapMercadoPagoStatus(status),
        updatedAt: now
      };
      
      if (status === 'approved') {
        updateData.paidAt = now;
      }
      
      await paymentRef.update(updateData);
    }
  }

  private async generateCancellationFeePayment(userId: string, feeAmount: number) {
    const user = await this.getUser(userId);
    if (!user) return;

    const paymentData = {
      transaction_amount: feeAmount / 100,
      description: 'Taxa de Cancelamento',
      payment_method_id: 'pix',
      payer: {
        email: user.email,
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ').slice(1).join(' ') || ''
      },
      notification_url: MERCADO_PAGO_CONFIG.WEBHOOK_URL,
      external_reference: `${userId}-cancellation-${Date.now()}`,
      date_of_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      metadata: {
        user_id: userId,
        payment_type: 'cancellation_fee'
      }
    };

    const mpPayment = await this.payment.create({
      body: paymentData,
      requestOptions: {
        idempotencyKey: generateIdempotencyKey()
      }
    });

    const cancellationPayment: MonthlyPayment = {
      id: crypto.randomUUID(),
      subscriptionId: 'cancellation-fee',
      userId,
      amount: feeAmount,
      dueDate: new Date(),
      status: 'available', // PIX is immediately available
      paymentMethod: 'pix',
      mercadoPagoPaymentId: mpPayment.id?.toString(),
      pixCode: mpPayment.point_of_interaction?.transaction_data?.qr_code,
      pixQrCode: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
      pixExpiresAt: new Date(paymentData.date_of_expiration),
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentNumber: 1, // Single payment
      description: 'Taxa de Cancelamento de Assinatura'
    };

    await this.saveMonthlyPayment(cancellationPayment);
  }

  private mapMercadoPagoStatus(mpStatus: string): MonthlyPayment['status'] {
    switch (mpStatus) {
      case 'approved':
        return 'paid';
      case 'pending':
        return 'available'; // PIX payment is generated and available for payment
      case 'cancelled':
      case 'rejected':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Generates all payments for the contract in advance
   */
  private async generateContractPayments(subscription: MonthlySubscription) {
    const payments: MonthlyPayment[] = [];
    
    for (let i = 1; i <= subscription.totalPayments; i++) {
      const dueDate = new Date(subscription.contractStartDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      dueDate.setDate(subscription.billingDay);
      
      // Handle edge cases for billing day
      if (dueDate.getDate() !== subscription.billingDay) {
        dueDate.setDate(0); // Go to last day of previous month
      }
      
      const monthName = dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const payment: MonthlyPayment = {
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        userId: subscription.userId,
        amount: subscription.amount,
        dueDate,
        status: 'pending',
        paymentMethod: 'pix',
        paymentNumber: i,
        description: `Mensalidade ${monthName} (${i}/${subscription.totalPayments})`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      payments.push(payment);
    }
    
    // Save all payments
    const batch = adminDb.batch();
    payments.forEach(payment => {
      const paymentRef = adminDb.collection('monthlyPayments').doc(payment.id);
      
      // Create clean object and validate dates, let Firestore handle conversion
      const cleanPayment: any = {};
      Object.entries(payment).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof Date && isNaN(value.getTime())) {
            console.error(`Invalid date for field ${key}:`, value);
            throw new Error(`Invalid date value for field ${key}`);
          }
          cleanPayment[key] = value;
        }
      });
      
      batch.set(paymentRef, cleanPayment);
    });
    
    await batch.commit();
  }
  
  /**
   * Makes a payment available for payment (generates PIX code)
   */
  async makePaymentAvailable(subscriptionId: string, paymentNumber: number) {
    const payments = await this.getSubscriptionPayments(subscriptionId);
    const payment = payments.find(p => p.paymentNumber === paymentNumber);
    
    if (!payment) {
      throw new Error(`Payment ${paymentNumber} not found for subscription`);
    }
    
    if (payment.status !== 'pending') {
      throw new Error(`Payment ${paymentNumber} is not in pending status`);
    }
    
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    
    const user = await this.getUser(subscription.userId);
    if (!user) throw new Error('User not found');
    
    // Create PIX payment with Mercado Pago
    const paymentData = {
      transaction_amount: subscription.amount / 100,
      description: payment.description,
      payment_method_id: 'pix',
      payer: {
        email: user.email,
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ').slice(1).join(' ') || ''
      },
      notification_url: MERCADO_PAGO_CONFIG.WEBHOOK_URL,
      external_reference: `${subscription.userId}-${paymentNumber}-${Date.now()}`,
      date_of_expiration: new Date(
        Date.now() + MERCADO_PAGO_CONFIG.PIX_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
      ).toISOString(),
      metadata: {
        subscription_id: subscriptionId,
        user_id: subscription.userId,
        payment_type: 'monthly_subscription',
        payment_number: paymentNumber.toString()
      }
    };
    
    const mpPayment = await this.payment.create({
      body: paymentData,
      requestOptions: {
        idempotencyKey: generateIdempotencyKey()
      }
    });
    
    // Update payment with PIX details
    const updatedPayment: MonthlyPayment = {
      ...payment,
      status: 'available',
      mercadoPagoPaymentId: mpPayment.id?.toString(),
      pixCode: mpPayment.point_of_interaction?.transaction_data?.qr_code,
      pixQrCode: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
      pixExpiresAt: new Date(paymentData.date_of_expiration),
      updatedAt: new Date()
    };
    
    await this.saveMonthlyPayment(updatedPayment);
    
    return {
      paymentId: mpPayment.id,
      paymentNumber,
      pixCode: mpPayment.point_of_interaction?.transaction_data?.qr_code,
      pixQrCode: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
      expiresAt: updatedPayment.pixExpiresAt,
      amount: subscription.amount,
      dueDate: payment.dueDate
    };
  }
  
  /**
   * Gets all payments for a subscription
   */
  async getSubscriptionPayments(subscriptionId: string): Promise<MonthlyPayment[]> {
    const snapshot = await adminDb.collection('monthlyPayments')
      .where('subscriptionId', '==', subscriptionId)
      .orderBy('paymentNumber', 'asc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as MonthlyPayment;
      
      // Helper function to safely convert dates
      const safeConvertDate = (dateValue: any): Date | undefined => {
        if (!dateValue) return undefined;
        
        // If it's already a Date object, validate it
        if (dateValue instanceof Date) {
          return isNaN(dateValue.getTime()) ? undefined : dateValue;
        }
        
        // If it's a Firestore Timestamp, convert it
        if (dateValue && typeof dateValue.toDate === 'function') {
          const converted = dateValue.toDate();
          return isNaN(converted.getTime()) ? undefined : converted;
        }
        
        // If it's a string or number, try to convert
        const converted = new Date(dateValue);
        return isNaN(converted.getTime()) ? undefined : converted;
      };
      
      return {
        ...data,
        dueDate: safeConvertDate(data.dueDate) || new Date(),
        createdAt: safeConvertDate(data.createdAt) || new Date(),
        updatedAt: safeConvertDate(data.updatedAt) || new Date(),
        paidAt: safeConvertDate(data.paidAt),
        pixExpiresAt: safeConvertDate(data.pixExpiresAt)
      };
    });
  }
  
  /**
   * Gets subscription overview for managers
   */
  async getSubscriptionOverview(subscriptionId: string): Promise<SubscriptionOverview> {
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    
    const payments = await this.getSubscriptionPayments(subscriptionId);
    
    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => ['pending', 'available'].includes(p.status));
    const overduePayments = payments.filter(p => {
      const now = new Date();
      const dueDate = new Date(p.dueDate);
      const twoDaysAfterDue = new Date(dueDate);
      twoDaysAfterDue.setDate(twoDaysAfterDue.getDate() + 2);
      
      return now > twoDaysAfterDue && p.status !== 'paid';
    });
    
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    
    const nextPayment = payments.find(p => p.status !== 'paid');
    
    return {
      subscription,
      payments,
      totalPaid,
      totalPending,
      totalOverdue,
      nextPayment,
      contractProgress: {
        completed: subscription.paymentsCompleted,
        total: subscription.totalPayments,
        percentage: Math.round((subscription.paymentsCompleted / subscription.totalPayments) * 100)
      }
    };
  }
}

export const subscriptionService = new SubscriptionService();