/**
 * Account lockout system for enhanced security
 */

import { supabase } from '@/integrations/supabase/client';
import { securityLogger } from './securityLogger';
import { logError, createErrorMessage } from './errorHandling';

export interface AccountLockout {
  id: string;
  user_id?: string;
  email?: string;
  ip_address?: string;
  failed_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
}

export interface LockoutConfig {
  maxAttempts: number;
  lockoutDuration: number; // in minutes
  trackByEmail: boolean;
  trackByIP: boolean;
  progressiveLockout: boolean;
}

class AccountLockoutManager {
  private static instance: AccountLockoutManager;

  private defaultConfig: LockoutConfig = {
    maxAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    trackByEmail: true,
    trackByIP: true,
    progressiveLockout: true // Increase lockout duration for repeated offenses
  };

  private constructor() {}

  static getInstance(): AccountLockoutManager {
    if (!AccountLockoutManager.instance) {
      AccountLockoutManager.instance = new AccountLockoutManager();
    }
    return AccountLockoutManager.instance;
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string | null> {
    try {
      // In a real application, you'd use a service to get the real IP
      // For now, we'll use a placeholder
      return 'client_ip_placeholder';
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate lockout duration based on previous attempts
   */
  private calculateLockoutDuration(attemptCount: number, config: LockoutConfig): number {
    if (!config.progressiveLockout) {
      return config.lockoutDuration;
    }

    // Progressive lockout: 15min, 30min, 1hr, 2hr, 4hr, 8hr, 24hr
    const durations = [15, 30, 60, 120, 240, 480, 1440]; // in minutes
    const index = Math.min(attemptCount - 1, durations.length - 1);
    return durations[index];
  }

  /**
   * Check if account is currently locked
   */
  async isAccountLocked(email: string, config?: Partial<LockoutConfig>): Promise<{ locked: boolean; lockoutInfo?: AccountLockout; remainingTime?: number }> {
    try {
      const mergedConfig = { ...this.defaultConfig, ...config };
      const clientIP = await this.getClientIP();
      
      const query = supabase
        .from('account_lockouts')
        .select('*')
        .gte('failed_attempts', mergedConfig.maxAttempts)
        .not('locked_until', 'is', null);

      // Add filters based on config
      if (mergedConfig.trackByEmail) {
        query.eq('email', email);
      }
      
      if (mergedConfig.trackByIP && clientIP) {
        query.eq('ip_address', clientIP);
      }

      const { data, error } = await query.single();

      if (error) {
        // No lockout found
        if (error.code === 'PGRST116') {
          return { locked: false };
        }
        logError(error, 'isAccountLocked');
        return { locked: false };
      }

      const lockout = data as AccountLockout;
      const lockedUntil = new Date(lockout.locked_until!);
      const now = new Date();

      if (now < lockedUntil) {
        const remainingTime = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000 / 60); // minutes
        return { 
          locked: true, 
          lockoutInfo: lockout,
          remainingTime 
        };
      } else {
        // Lockout has expired, clean it up
        await this.clearLockout(lockout.id);
        return { locked: false };
      }

    } catch (error) {
      logError(error, 'isAccountLocked');
      return { locked: false };
    }
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(email: string, userId?: string, config?: Partial<LockoutConfig>): Promise<{ shouldLock: boolean; lockoutInfo?: AccountLockout; error?: string }> {
    try {
      const mergedConfig = { ...this.defaultConfig, ...config };
      const clientIP = await this.getClientIP();
      const now = new Date();

      // Check if there's an existing record
      const { data: existing, error: fetchError } = await supabase
        .from('account_lockouts')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logError(fetchError, 'recordFailedAttempt');
        return { shouldLock: false, error: createErrorMessage(fetchError, 'recordFailedAttempt') };
      }

      let newAttempts = 1;
      let lockoutData: any;

      if (existing) {
        newAttempts = existing.failed_attempts + 1;
        
        // Check if we should lock the account
        if (newAttempts >= mergedConfig.maxAttempts) {
          const lockoutDuration = this.calculateLockoutDuration(
            Math.floor(newAttempts / mergedConfig.maxAttempts),
            mergedConfig
          );
          
          const lockedUntil = new Date(now.getTime() + lockoutDuration * 60 * 1000);

          lockoutData = {
            failed_attempts: newAttempts,
            locked_until: lockedUntil.toISOString(),
            updated_at: now.toISOString()
          };

          // Log the lockout
          await securityLogger.logEvent('suspicious_activity', {
            action: 'account_locked',
            email,
            attempts: newAttempts,
            lockoutDuration,
            ip: clientIP
          }, 'error', userId);

        } else {
          lockoutData = {
            failed_attempts: newAttempts,
            updated_at: now.toISOString()
          };
        }

        // Update existing record
        const { data: updated, error: updateError } = await supabase
          .from('account_lockouts')
          .update(lockoutData)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          logError(updateError, 'recordFailedAttempt');
          return { shouldLock: false, error: createErrorMessage(updateError, 'recordFailedAttempt') };
        }

        return {
          shouldLock: newAttempts >= mergedConfig.maxAttempts,
          lockoutInfo: updated as AccountLockout
        };

      } else {
        // Create new record
        const { data: created, error: insertError } = await supabase
          .from('account_lockouts')
          .insert({
            user_id: userId,
            email,
            ip_address: clientIP,
            failed_attempts: newAttempts,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .select()
          .single();

        if (insertError) {
          logError(insertError, 'recordFailedAttempt');
          return { shouldLock: false, error: createErrorMessage(insertError, 'recordFailedAttempt') };
        }

        return {
          shouldLock: false,
          lockoutInfo: created as AccountLockout
        };
      }

    } catch (error) {
      logError(error, 'recordFailedAttempt');
      return { shouldLock: false, error: createErrorMessage(error, 'recordFailedAttempt') };
    }
  }

  /**
   * Clear lockout after successful login
   */
  async clearLockout(lockoutId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('account_lockouts')
        .delete()
        .eq('id', lockoutId);

      if (error) {
        logError(error, 'clearLockout');
        return { success: false, error: createErrorMessage(error, 'clearLockout') };
      }

      return { success: true };

    } catch (error) {
      logError(error, 'clearLockout');
      return { success: false, error: createErrorMessage(error, 'clearLockout') };
    }
  }

  /**
   * Clear all lockouts for an email (admin function)
   */
  async clearAllLockouts(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('account_lockouts')
        .delete()
        .eq('email', email);

      if (error) {
        logError(error, 'clearAllLockouts');
        return { success: false, error: createErrorMessage(error, 'clearAllLockouts') };
      }

      await securityLogger.logEvent('auth_success', {
        action: 'lockouts_cleared',
        email
      }, 'info');

      return { success: true };

    } catch (error) {
      logError(error, 'clearAllLockouts');
      return { success: false, error: createErrorMessage(error, 'clearAllLockouts') };
    }
  }

  /**
   * Reset failed attempts after successful login
   */
  async resetFailedAttempts(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('account_lockouts')
        .delete()
        .eq('email', email);

      if (error) {
        logError(error, 'resetFailedAttempts');
        return { success: false, error: createErrorMessage(error, 'resetFailedAttempts') };
      }

      return { success: true };

    } catch (error) {
      logError(error, 'resetFailedAttempts');
      return { success: false, error: createErrorMessage(error, 'resetFailedAttempts') };
    }
  }

  /**
   * Get lockout statistics
   */
  async getLockoutStats(): Promise<{ totalLockouts: number; activeLockouts: number; error?: string }> {
    try {
      const { data: total, error: totalError } = await supabase
        .from('account_lockouts')
        .select('id', { count: 'exact' });

      const { data: active, error: activeError } = await supabase
        .from('account_lockouts')
        .select('id', { count: 'exact' })
        .not('locked_until', 'is', null)
        .gte('locked_until', new Date().toISOString());

      if (totalError || activeError) {
        const error = totalError || activeError;
        logError(error!, 'getLockoutStats');
        return { 
          totalLockouts: 0, 
          activeLockouts: 0, 
          error: createErrorMessage(error!, 'getLockoutStats') 
        };
      }

      return {
        totalLockouts: total?.length || 0,
        activeLockouts: active?.length || 0
      };

    } catch (error) {
      logError(error, 'getLockoutStats');
      return { 
        totalLockouts: 0, 
        activeLockouts: 0, 
        error: createErrorMessage(error, 'getLockoutStats') 
      };
    }
  }
}

export const accountLockout = AccountLockoutManager.getInstance();