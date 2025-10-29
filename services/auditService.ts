import { adminDb } from '@/lib/firebase/admin';

export interface AuditLog {
  id?: string;
  userId: string;
  action: string;
  resource: string;
  details?: any;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  private static collectionName = 'audit_logs';

  /**
   * Log an audit event
   * @param userId - The ID of the user performing the action
   * @param action - The action being performed (e.g., 'CONTRACT_SIGNED', 'USER_ROLE_CHANGED')
   * @param resource - The resource being acted upon (e.g., 'contract', 'user')
   * @param details - Additional details about the action
   * @param ip - IP address of the client
   * @param userAgent - User agent of the client
   */
  static async logEvent(
    userId: string,
    action: string,
    resource: string,
    details?: any,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const auditLog: any = {
        userId,
        action,
        resource,
        timestamp: new Date(),
      };

      // Only add optional fields if they have values
      if (details !== undefined) {
        auditLog.details = details;
      }
      if (ip !== undefined) {
        auditLog.ip = ip;
      }
      if (userAgent !== undefined) {
        auditLog.userAgent = userAgent;
      }

      await adminDb.collection(this.collectionName).add(auditLog);
      
      // Also log to console for critical actions in development
      if (process.env.NODE_ENV === 'development' && this.isCriticalAction(action)) {
        console.warn(`CRITICAL AUDIT EVENT: ${action} by user ${userId} on ${resource}`);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // We don't throw an error here because we don't want audit logging to break the main flow
    }
  }

  /**
   * Check if an action is critical and should be logged more prominently
   * @param action - The action to check
   */
  private static isCriticalAction(action: string): boolean {
    const criticalActions = [
      'CONTRACT_SIGNED',
      'USER_ROLE_CHANGED',
      'PAYMENT_PROCESSED',
      'ADMIN_LOGIN',
      'USER_DEACTIVATED',
      'CREDITS_GRANTED',
      'CREDITS_REVOKED'
    ];
    return criticalActions.includes(action);
  }

  /**
   * Get audit logs for a specific user
   * @param userId - The ID of the user
   * @param limit - The maximum number of logs to return
   */
  static async getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          details: data.details,
          timestamp: data.timestamp.toDate(),
          ip: data.ip,
          userAgent: data.userAgent
        } as AuditLog;
      });
    } catch (error) {
      console.error('Failed to fetch user audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific resource
   * @param resource - The resource to filter by
   * @param limit - The maximum number of logs to return
   */
  static async getResourceAuditLogs(resource: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where('resource', '==', resource)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          details: data.details,
          timestamp: data.timestamp.toDate(),
          ip: data.ip,
          userAgent: data.userAgent
        } as AuditLog;
      });
    } catch (error) {
      console.error('Failed to fetch resource audit logs:', error);
      return [];
    }
  }

  /**
   * Log a user action - convenience method for user-related actions
   * @param params - Object containing userId, action, targetUserId, details, ip, and userAgent
   */
  static async logUserAction(params: {
    userId: string;
    action: string;
    targetUserId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logEvent(
      params.userId,
      params.action,
      'user',
      {
        ...params.details,
        targetUserId: params.targetUserId
      },
      params.ip,
      params.userAgent
    );
  }
}

export const auditService = new AuditService();