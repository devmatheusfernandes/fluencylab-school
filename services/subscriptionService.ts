// services/subscriptionService.ts
import { ABACATEPAY_CONFIG, createAbacatePayPixQrCode } from "@/lib/abacatepay/config";
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
  constructor() {}

  /**
   * Creates a new subscription for a user
   */
  async createSubscription(params: CreateSubscriptionParams) {
    const { 
      userId, 
      userEmail, 
      userRole, 
      paymentMethod, 
      billingDay, 
      contractLengthMonths,
      contractStartDate,
      initialPaymentAmount
    } = params;
    
    // Validate user role
    if (userRole !== UserRoles.STUDENT && userRole !== UserRoles.GUARDED_STUDENT) {
      throw new Error('Invalid user role for subscription');
    }

    const amount = getSubscriptionPrice(userRole as UserRoles);
    const description = getSubscriptionDescription(userRole as UserRoles);
    
    if (paymentMethod !== "pix") {
      throw new Error("Only PIX payments are supported");
    }

    return this.createPixSubscription({
      userId,
      userEmail,
      amount,
      description,
      billingDay,
      contractLengthMonths,
      contractStartDate,
      initialPaymentAmount
    });
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
    contractStartDate?: Date;
    initialPaymentAmount?: number;
  }) {
    const { 
      userId, 
      userEmail, 
      amount, 
      description, 
      billingDay, 
      contractLengthMonths,
      contractStartDate: customStartDate,
      initialPaymentAmount
    } = params;

    console.log("Creating PIX subscription with webhook URL:", ABACATEPAY_CONFIG.WEBHOOK_URL);

    // Calculate contract dates
    const contractStartDate = customStartDate ? new Date(customStartDate) : new Date();
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
    await this.generateContractPayments(subscription, initialPaymentAmount);
    
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

  // Credit card subscriptions removed (PIX only).

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

  // Credit card flows have been removed (PIX only).

  /**
   * Gets payment status for a user with contract-based logic
   */
  async getPaymentStatus(userId: string): Promise<PaymentStatus> {
    const subscription = await this.getActiveSubscription(userId);
    
    if (!subscription) {
      return { subscriptionStatus: 'canceled' };
    }

    return this.getPixPaymentStatus(subscription);
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
   * Processes webhook notifications from AbacatePay.
   */
  async processWebhookEvent(eventData: any) {
    const event = eventData?.event;

    switch (event) {
      case "billing.paid": {
        const providerPaymentId = eventData?.data?.pixQrCode?.id;
        if (typeof providerPaymentId !== "string" || providerPaymentId.length === 0) {
          console.log("billing.paid received without pixQrCode.id");
          return;
        }

        await this.handleProviderPaymentPaid(providerPaymentId);
        break;
      }
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
  }

  // Private helper methods
  private async handleProviderPaymentPaid(providerPaymentId: string) {
    const payment = await this.updatePaymentStatusByProviderPaymentId(
      providerPaymentId,
      "PAID",
    );

    if (!payment) return;

    await this.handleSuccessfulPayment(payment.subscriptionId, payment.userId);
  }

  private async handleSuccessfulPayment(subscriptionId: string, userId: string) {
    const subscription = await this.getSubscriptionPrivate(subscriptionId);
    if (!subscription) return;

    // For PIX subscriptions with contract system
    if (subscription.planType === 'pix') {
      await this.handlePixPaymentSuccess(subscriptionId, userId);
      return;
    }
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

  private async updatePaymentStatusByProviderPaymentId(
    providerPaymentId: string,
    providerStatus: string,
  ): Promise<MonthlyPayment | null> {
    const snapshot = await adminDb
      .collection("monthlyPayments")
      .where("providerPaymentId", "==", providerPaymentId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const paymentRef = snapshot.docs[0].ref;
    const existing = snapshot.docs[0].data() as MonthlyPayment;
    const now = new Date();

    // Validate the date before using it
    if (isNaN(now.getTime())) {
      console.error("Invalid date generated for update operation:", now);
      throw new Error("Invalid date value for update operation");
    }

    const mappedStatus: MonthlyPayment["status"] =
      providerStatus === "PAID"
        ? "paid"
        : providerStatus === "PENDING"
          ? "available"
          : providerStatus === "EXPIRED" || providerStatus === "CANCELLED"
            ? "failed"
            : "pending";

    const updateData: any = {
      status: mappedStatus,
      updatedAt: now,
    };

    if (mappedStatus === "paid") {
      updateData.paidAt = now;
    }

    await paymentRef.update(updateData);
    return { ...existing, ...updateData } as MonthlyPayment;
  }

  private async generateCancellationFeePayment(userId: string, feeAmount: number) {
    const user = await this.getUser(userId);
    if (!user) return;

    const expiresInSeconds = 30 * 24 * 60 * 60; // 30 days
    const qr = await createAbacatePayPixQrCode({
      amountCents: feeAmount,
      expiresInSeconds,
      description: "Taxa de Cancelamento".slice(0, 37),
      metadata: {
        user_id: userId,
        payment_type: "cancellation_fee",
      },
    });

    const cancellationPayment: MonthlyPayment = {
      id: crypto.randomUUID(),
      subscriptionId: 'cancellation-fee',
      userId,
      amount: feeAmount,
      dueDate: new Date(),
      status: 'available', // PIX is immediately available
      paymentMethod: 'pix',
      provider: "abacatepay",
      providerPaymentId: qr.id,
      pixCode: qr.brCode,
      pixQrCode: qr.brCodeBase64,
      pixExpiresAt: qr.expiresAt ? new Date(qr.expiresAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentNumber: 1, // Single payment
      description: 'Taxa de Cancelamento de Assinatura'
    };

    await this.saveMonthlyPayment(cancellationPayment);
  }

  /**
   * Generates all payments for the contract in advance
   */
  private async generateContractPayments(
    subscription: MonthlySubscription, 
    initialPaymentAmount?: number,
    initialPaymentDueDate?: Date
  ) {
    const payments: MonthlyPayment[] = [];
    
    for (let i = 1; i <= subscription.totalPayments; i++) {
      let dueDate = new Date(subscription.contractStartDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      dueDate.setDate(subscription.billingDay);
      
      // Handle edge cases for billing day
      if (dueDate.getDate() !== subscription.billingDay) {
        dueDate.setDate(0); // Go to last day of previous month
      }
      
      const monthName = dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      let amount = subscription.amount;
      
      // Override first payment if custom amount/date provided
      if (i === 1) {
        if (initialPaymentAmount !== undefined) {
          amount = initialPaymentAmount;
        }
        if (initialPaymentDueDate) {
          dueDate = new Date(initialPaymentDueDate);
        }
      }

      const payment: MonthlyPayment = {
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        userId: subscription.userId,
        amount: amount,
        dueDate,
        status: 'pending',
        paymentMethod: 'pix',
        provider: "abacatepay",
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
    
    const expiresInSeconds = ABACATEPAY_CONFIG.PIX_EXPIRATION_DAYS * 24 * 60 * 60;
    const qr = await createAbacatePayPixQrCode({
      amountCents: payment.amount,
      expiresInSeconds,
      description: payment.description.slice(0, 37),
      metadata: {
        subscription_id: subscriptionId,
        user_id: subscription.userId,
        payment_type: "monthly_subscription",
        payment_number: paymentNumber.toString(),
      },
    });
    
    // Update payment with PIX details
    const updatedPayment: MonthlyPayment = {
      ...payment,
      status: 'available',
      provider: "abacatepay",
      providerPaymentId: qr.id,
      pixCode: qr.brCode,
      pixQrCode: qr.brCodeBase64,
      pixExpiresAt: qr.expiresAt ? new Date(qr.expiresAt) : undefined,
      updatedAt: new Date()
    };
    
    await this.saveMonthlyPayment(updatedPayment);
    
    return {
      paymentId: qr.id,
      paymentNumber,
      pixCode: qr.brCode,
      pixQrCode: qr.brCodeBase64,
      expiresAt: updatedPayment.pixExpiresAt,
      amount: payment.amount,
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