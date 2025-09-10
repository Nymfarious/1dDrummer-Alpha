/**
 * Security logging system for authentication events and security monitoring
 */

import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  eventType: 'auth_success' | 'auth_failure' | 'auth_logout' | 'file_upload' | 'file_delete' | 'suspicious_activity';
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private eventQueue: SecurityEvent[] = [];
  private isProcessing = false;

  private constructor() {
    // Process queue every 10 seconds
    setInterval(() => this.processQueue(), 10000);
  }

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientInfo(): Promise<{ ipAddress?: string; userAgent?: string }> {
    try {
      // Get user agent
      const userAgent = navigator.userAgent;
      
      // In production, you might want to use a service to get real IP
      // For now, we'll just use user agent and approximate location
      return {
        userAgent,
        ipAddress: 'client' // Placeholder - in production use proper IP detection
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Log a security event
   */
  async logEvent(
    eventType: SecurityEvent['eventType'],
    details?: Record<string, any>,
    severity: SecurityEvent['severity'] = 'info',
    userId?: string,
    email?: string
  ): Promise<void> {
    try {
      const clientInfo = await this.getClientInfo();
      
      const event: SecurityEvent = {
        eventType,
        userId,
        email,
        ...clientInfo,
        details: this.sanitizeDetails(details),
        severity,
        timestamp: new Date().toISOString()
      };

      // Add to queue for batch processing
      this.eventQueue.push(event);

      // Also log locally for immediate debugging
      if (import.meta.env.DEV) {
        console.log(`Security Event [${severity.toUpperCase()}]:`, event);
      }

      // For critical events, process immediately
      if (severity === 'critical') {
        await this.processQueue();
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Sanitize sensitive information from event details
   */
  private sanitizeDetails(details?: Record<string, any>): Record<string, any> {
    if (!details) return {};

    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Process queued events (send to logging service)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In a real application, you'd send these to a logging service
      // For now, we'll store them in localStorage and optionally send to Supabase
      
      // Store locally
      const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      const allLogs = [...existingLogs, ...events].slice(-1000); // Keep last 1000 events
      localStorage.setItem('security_logs', JSON.stringify(allLogs));

      // Optionally, you could create a security_logs table in Supabase
      // and insert events there for centralized monitoring

    } catch (error) {
      console.error('Failed to process security event queue:', error);
      // Put events back in queue for retry
      this.eventQueue.unshift(...events);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Log authentication success
   */
  async logAuthSuccess(userId: string, email: string): Promise<void> {
    await this.logEvent('auth_success', { method: 'email_password' }, 'info', userId, email);
  }

  /**
   * Log authentication failure
   */
  async logAuthFailure(email?: string, reason?: string): Promise<void> {
    await this.logEvent('auth_failure', { reason, email }, 'warning', undefined, email);
  }

  /**
   * Log logout event
   */
  async logLogout(userId: string, email: string): Promise<void> {
    await this.logEvent('auth_logout', {}, 'info', userId, email);
  }

  /**
   * Log file upload
   */
  async logFileUpload(userId: string, fileName: string, fileSize: number, mimeType: string): Promise<void> {
    await this.logEvent('file_upload', { fileName, fileSize, mimeType }, 'info', userId);
  }

  /**
   * Log file deletion
   */
  async logFileDelete(userId: string, fileName: string): Promise<void> {
    await this.logEvent('file_delete', { fileName }, 'info', userId);
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(details: Record<string, any>, severity: 'warning' | 'error' | 'critical' = 'warning'): Promise<void> {
    await this.logEvent('suspicious_activity', details, severity);
  }

  /**
   * Get recent security events (for debugging/monitoring)
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    try {
      const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      return logs.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to retrieve security logs:', error);
      return [];
    }
  }

  /**
   * Clear old security logs
   */
  clearOldLogs(daysToKeep: number = 30): void {
    try {
      const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const filteredLogs = logs.filter((log: SecurityEvent) => 
        new Date(log.timestamp) > cutoffDate
      );
      
      localStorage.setItem('security_logs', JSON.stringify(filteredLogs));
    } catch (error) {
      console.error('Failed to clear old security logs:', error);
    }
  }
}

export const securityLogger = SecurityLogger.getInstance();