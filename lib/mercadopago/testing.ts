import { Payment } from 'mercadopago';
import { mercadoPagoClient, generateIdempotencyKey } from './config';

/**
 * Mercado Pago PIX testing utility
 * Based on official documentation: https://www.mercadopago.com.br/developers/pt/docs/qr-code/integration-test
 */
export class MercadoPagoPixTesting {
  private payment: Payment;

  constructor() {
    this.payment = new Payment(mercadoPagoClient);
  }

  /**
   * Creates a test PIX payment using predefined values from Mercado Pago documentation
   * These values automatically trigger status updates for testing
   */
  async createTestPixPayment(params: {
    amount: number; // Amount in centavos (e.g., 20000 = R$ 200.00)
    externalReference: string;
    userEmail?: string;
    webhookUrl?: string;
  }) {
    const { amount, externalReference, userEmail = "test@testuser.com", webhookUrl } = params;

    // Using the predefined test values from Mercado Pago documentation
    const paymentData = {
      transaction_amount: amount / 100, // Convert centavos to reais
      description: 'Test PIX Payment - Fluency Lab',
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
        first_name: 'APRO', // This predefined value triggers automatic approval
        last_name: 'Test'
      },
      external_reference: externalReference,
      notification_url: webhookUrl,
      metadata: {
        test_payment: true,
        integration: 'fluency_lab'
      }
    };

    try {
      const mpPayment = await this.payment.create({
        body: paymentData,
        requestOptions: {
          idempotencyKey: generateIdempotencyKey()
        }
      });

      return {
        success: true,
        paymentId: mpPayment.id,
        status: mpPayment.status,
        pixCode: mpPayment.point_of_interaction?.transaction_data?.qr_code,
        pixQrCode: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
        ticketUrl: mpPayment.point_of_interaction?.transaction_data?.ticket_url,
        response: mpPayment
      };
    } catch (error) {
      console.error('Test PIX payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test different payment scenarios using predefined first names
   */
  async createTestScenario(scenario: 'approve' | 'reject' | 'pending', params: {
    amount: number;
    externalReference: string;
    userEmail?: string;
    webhookUrl?: string;
  }) {
    const firstNameMap = {
      'approve': 'APRO',  // Automatically approved
      'reject': 'REJE',   // Automatically rejected  
      'pending': 'PEND'   // Stays pending
    };

    const paymentData = {
      transaction_amount: params.amount / 100,
      description: `Test PIX Payment - ${scenario.toUpperCase()}`,
      payment_method_id: 'pix',
      payer: {
        email: params.userEmail || "test@testuser.com",
        first_name: firstNameMap[scenario],
        last_name: 'Test'
      },
      external_reference: params.externalReference,
      notification_url: params.webhookUrl,
      metadata: {
        test_payment: true,
        test_scenario: scenario,
        integration: 'fluency_lab'
      }
    };

    try {
      const mpPayment = await this.payment.create({
        body: paymentData,
        requestOptions: {
          idempotencyKey: generateIdempotencyKey()
        }
      });

      return {
        success: true,
        scenario,
        paymentId: mpPayment.id,
        status: mpPayment.status,
        pixCode: mpPayment.point_of_interaction?.transaction_data?.qr_code,
        pixQrCode: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
        response: mpPayment
      };
    } catch (error) {
      console.error(`Test scenario ${scenario} failed:`, error);
      return {
        success: false,
        scenario,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(paymentId: string) {
    try {
      const payment = await this.payment.get({ id: paymentId });
      return {
        success: true,
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        response: payment
      };
    } catch (error) {
      console.error('Failed to check payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}