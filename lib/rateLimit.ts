import { NextRequest, NextResponse } from 'next/server';
import { RateLimitOperationType, DEFAULT_RATE_LIMITS } from '../types/auth';

// Simple in-memory store for rate limiting
// In production, you should use Redis or another distributed store
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

// Interface para configuração customizada de rate limit
interface CustomRateLimitConfig {
  requests: number;
  windowMs: number;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Rate limiting function
export function rateLimit(
  request: NextRequest,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
): { limited: boolean; remaining?: number; resetTime?: number } {
  const ip = getClientIP(request);
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  // If no record exists or the window has expired, create a new one
  if (!record || record.resetTime <= now) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, newRecord);
    return { 
      limited: false, 
      remaining: maxRequests - 1, 
      resetTime: newRecord.resetTime 
    };
  }
  
  // Increment the count
  record.count += 1;
  rateLimitStore.set(key, record);
  
  // Check if limit is exceeded
  if (record.count > maxRequests) {
    return { 
      limited: true, 
      remaining: 0, 
      resetTime: record.resetTime 
    };
  }
  
  return { 
    limited: false, 
    remaining: maxRequests - record.count, 
    resetTime: record.resetTime 
  };
}

// Utility function to get client IP
export function getClientIP(request: NextRequest): string {
  // Check for X-Forwarded-For header (common in proxy setups)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the first IP if there are multiple (comma-separated)
    return xForwardedFor.split(',')[0].trim();
  }
  
  // Check for X-Real-IP header
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }
  
  // Fallback to unknown
  return 'unknown';
}

// Predefined rate limiters
// ============================================================================
// CLASSE RATELIMITER SINGLETON
// ============================================================================

/**
 * Classe singleton para gerenciamento centralizado de rate limiting
 */
export class RateLimiter {
  private static instance: RateLimiter | null = null;
  private store: Map<string, { count: number; resetTime: number }>;
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.store = rateLimitStore;
    
    // Configurar limpeza automática
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Limpar a cada minuto
  }

  /**
   * Obtém a instância singleton
   */
  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Verifica rate limit para uma operação específica
   */
  public async checkRateLimit(
    key: string,
    operationType: RateLimitOperationType,
    customConfig?: CustomRateLimitConfig
  ): Promise<boolean> {
    const config = customConfig || DEFAULT_RATE_LIMITS[operationType];
    const now = Date.now();
    
    const record = this.store.get(key);
    
    // Se não existe registro ou a janela expirou, criar novo
    if (!record || record.resetTime <= now) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true; // Permitido
    }
    
    // Incrementar contador
    record.count += 1;
    this.store.set(key, record);
    
    // Verificar se excedeu o limite
    return record.count <= config.requests;
  }

  /**
   * Obtém informações sobre o rate limit atual
   */
  public getRateLimitInfo(
    key: string,
    operationType: RateLimitOperationType
  ): {
    remaining: number;
    resetTime: number;
    total: number;
  } {
    const config = DEFAULT_RATE_LIMITS[operationType];
    const record = this.store.get(key);
    const now = Date.now();
    
    if (!record || record.resetTime <= now) {
      return {
        remaining: config.requests,
        resetTime: now + config.windowMs,
        total: config.requests
      };
    }
    
    return {
      remaining: Math.max(0, config.requests - record.count),
      resetTime: record.resetTime,
      total: config.requests
    };
  }

  /**
   * Reseta o rate limit para uma chave específica
   */
  public resetRateLimit(key: string): void {
    this.store.delete(key);
  }

  /**
   * Limpa registros expirados
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Obtém estatísticas do rate limiter
   */
  public getStats(): {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
  } {
    const now = Date.now();
    let activeKeys = 0;
    let expiredKeys = 0;
    
    for (const [, value] of this.store.entries()) {
      if (value.resetTime > now) {
        activeKeys++;
      } else {
        expiredKeys++;
      }
    }
    
    return {
      totalKeys: this.store.size,
      activeKeys,
      expiredKeys
    };
  }

  /**
   * Destrói a instância (para testes)
   */
  public static destroy(): void {
    if (RateLimiter.instance) {
      clearInterval(RateLimiter.instance.cleanupInterval);
      RateLimiter.instance = null;
    }
  }
}

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA (MANTIDAS PARA COMPATIBILIDADE)
// ============================================================================

export const generalRateLimiter = (request: NextRequest) => 
  rateLimit(request, 15 * 60 * 1000, 100); // 100 requests per 15 minutes

export const authRateLimiter = (request: NextRequest) => 
  rateLimit(request, 15 * 60 * 1000, 5); // 5 requests per 15 minutes

export const paymentRateLimiter = (request: NextRequest) => 
  rateLimit(request, 15 * 60 * 1000, 20); // 20 requests per 15 minutes

// ============================================================================
// NOVAS FUNÇÕES BASEADAS EM OPERAÇÃO
// ============================================================================

/**
 * Rate limiter para cancelamentos
 */
export const cancellationRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `cancellation:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'cancellation');
};

/**
 * Rate limiter para reagendamentos
 */
export const rescheduleRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `reschedule:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'reschedule');
};

/**
 * Rate limiter para login
 */
export const loginRateLimiter = (request: NextRequest) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `login:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'login');
};

/**
 * Rate limiter para operações administrativas
 */
export const adminOperationRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `admin_operation:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'admin_operation');
};

/**
 * Rate limiter para criação de usuários
 */
export const userCreationRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `user_creation:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'user_creation');
};

// ============================================================================
// RATE LIMITERS ESPECÍFICOS POR ENDPOINT
// ============================================================================

/**
 * Rate limiter para cancelamento de estudantes
 */
export const studentCancellationRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `student_cancellation:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'student_cancellation');
};

/**
 * Rate limiter para cancelamento de professores
 */
export const teacherCancellationRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `teacher_cancellation:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'teacher_cancellation');
};

/**
 * Rate limiter para reagendamento de estudantes
 */
export const studentRescheduleRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `student_reschedule:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'student_reschedule');
};

/**
 * Rate limiter para reagendamento de professores
 */
export const teacherRescheduleRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `teacher_reschedule:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'teacher_reschedule');
};

/**
 * Rate limiter para reagendamento de administradores
 */
export const adminRescheduleRateLimiter = (request: NextRequest, userId: string) => {
  const rateLimiter = RateLimiter.getInstance();
  const clientIp = getClientIP(request);
  const key = `admin_reschedule:${userId}:${clientIp}`;
  return rateLimiter.checkRateLimit(key, 'admin_reschedule');
};

/**
 * Rate limiter inteligente que escolhe o tipo correto baseado no role e operação
 */
export const smartRateLimiter = (
  request: NextRequest, 
  userId: string, 
  userRole: string, 
  operation: 'cancellation' | 'reschedule'
) => {
  if (operation === 'cancellation') {
    if (userRole === 'STUDENT') {
      return studentCancellationRateLimiter(request, userId);
    } else if (['TEACHER', 'ADMIN', 'MANAGER'].includes(userRole)) {
      return teacherCancellationRateLimiter(request, userId);
    }
  } else if (operation === 'reschedule') {
    if (userRole === 'STUDENT') {
      return studentRescheduleRateLimiter(request, userId);
    } else if (userRole === 'TEACHER') {
      return teacherRescheduleRateLimiter(request, userId);
    } else if (['ADMIN', 'MANAGER'].includes(userRole)) {
      return adminRescheduleRateLimiter(request, userId);
    }
  }
  
  // Fallback para rate limiter geral
  return generalRateLimiter(request);
};