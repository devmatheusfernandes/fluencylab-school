// types/testing/pix.ts

export interface PixTestScenario {
  scenario: 'approve' | 'reject' | 'pending';
  firstName: string;
  expectedStatus: string;
  description: string;
}

export interface PixTestPaymentParams {
  amount: number; // Amount in centavos
  externalReference: string;
  userEmail?: string;
  webhookUrl?: string;
}

export interface PixTestResult {
  success: boolean;
  paymentId?: string;
  scenario?: string;
  status?: string;
  pixCode?: string;
  pixQrCode?: string;
  ticketUrl?: string;
  error?: string;
  response?: any;
}

export interface PixTestStatusResult {
  success: boolean;
  id?: string;
  status?: string;
  statusDetail?: string;
  error?: string;
  response?: any;
}

export interface SubscriptionTestParams {
  subscriptionId: string;
  paymentNumber?: number;
  scenario?: 'approve' | 'reject' | 'pending';
}

export interface TestPaymentResponse {
  message: string;
  paymentId: string;
  scenario: string;
  status: string;
  amount?: number;
  pixCode?: string;
  pixQrCode?: string;
  webhookUrl: string;
  instructions: string;
  nextSteps?: string[];
}