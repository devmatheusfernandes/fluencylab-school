// lib/mercadopago/config.ts
import { MercadoPagoConfig } from 'mercadopago';
import { getEnv } from '@/lib/env/validation';

/**
 * Mercado Pago SDK configuration
 * Uses access token from validated environment variables
 */
export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: getEnv('MERCADO_PAGO_ACCESS_TOKEN'),
  options: {
    timeout: 5000,
  }
});

/**
 * Generate unique idempotency key for Mercado Pago requests
 */
export const generateIdempotencyKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Environment configuration for Mercado Pago
 */
export const MERCADO_PAGO_CONFIG = {
  // URLs for redirects and webhooks
  BASE_URL: getEnv('NEXT_PUBLIC_APP_URL'),
  WEBHOOK_SECRET: getEnv('MERCADO_PAGO_WEBHOOK_SECRET'),
  
  // Notification URLs
  get WEBHOOK_URL() {
    return `${this.BASE_URL}/api/payment/mercadopago/webhook`;
  },
  
  // Success/failure URLs - Fixed to redirect to student payment page
  get SUCCESS_URL() {
    return `${this.BASE_URL}/hub/plataforma/student/payments?subscription=success`;
  },
  
  get FAILURE_URL() {
    return `${this.BASE_URL}/hub/plataforma/student/payments?subscription=error`;
  },
  
  get PENDING_URL() {
    return `${this.BASE_URL}/hub/plataforma/student/payments?subscription=pending`;
  },
  
  // PIX configuration
  PIX_EXPIRATION_DAYS: 7, // PIX payments expire after 7 days
  
  // Subscription configuration
  SUBSCRIPTION_FREQUENCY: 1, // Monthly
  SUBSCRIPTION_FREQUENCY_TYPE: 'months' as const,
} as const;