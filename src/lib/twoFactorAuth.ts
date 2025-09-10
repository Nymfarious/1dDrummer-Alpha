/**
 * Two-Factor Authentication (2FA) system using TOTP
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { securityLogger } from './securityLogger';
import { logError, createErrorMessage } from './errorHandling';

export interface TwoFactorSettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  backup_codes?: string[];
  created_at: string;
  updated_at: string;
}

export interface BackupCode {
  code: string;
  used: boolean;
}

class TwoFactorAuth {
  private static instance: TwoFactorAuth;

  private constructor() {
    // Configure authenticator options
    authenticator.options = {
      window: 2, // Allow 2 time steps in either direction
      step: 30,  // 30-second time step
      digits: 6, // 6-digit codes
    };
  }

  static getInstance(): TwoFactorAuth {
    if (!TwoFactorAuth.instance) {
      TwoFactorAuth.instance = new TwoFactorAuth();
    }
    return TwoFactorAuth.instance;
  }

  /**
   * Generate a new secret for 2FA setup
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate backup codes for 2FA
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate QR code for authenticator app setup
   */
  async generateQRCode(secret: string, userEmail: string, serviceName: string = 'dDrummer'): Promise<string> {
    const otpauth = authenticator.keyuri(userEmail, serviceName, secret);
    try {
      return await QRCode.toDataURL(otpauth);
    } catch (error) {
      logError(error, 'generateQRCode');
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP code
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      logError(error, 'verifyToken');
      return false;
    }
  }

  /**
   * Enable 2FA for a user
   */
  async enable2FA(userId: string, secret: string, verificationCode: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      // Verify the setup code first
      if (!this.verifyToken(verificationCode, secret)) {
        await securityLogger.logSuspiciousActivity({
          action: '2fa_setup_invalid_code',
          userId
        }, 'warning');
        return { success: false, error: 'Invalid verification code' };
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Save to database
      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: userId,
          two_factor_enabled: true,
          two_factor_secret: secret,
          backup_codes: backupCodes
        });

      if (error) {
        logError(error, 'enable2FA');
        return { success: false, error: createErrorMessage(error, 'enable2FA') };
      }

      await securityLogger.logEvent('auth_success', { action: '2fa_enabled' }, 'info', userId);

      return { success: true, backupCodes };

    } catch (error) {
      logError(error, 'enable2FA');
      return { success: false, error: createErrorMessage(error, 'enable2FA') };
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string, verificationCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current settings
      const { data: settings, error: fetchError } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !settings) {
        return { success: false, error: 'Security settings not found' };
      }

      // Verify code (either TOTP or backup code)
      const isValidToken = this.verifyToken(verificationCode, settings.two_factor_secret || '');
      const isValidBackup = this.verifyBackupCode(verificationCode, settings.backup_codes || []);

      if (!isValidToken && !isValidBackup) {
        await securityLogger.logSuspiciousActivity({
          action: '2fa_disable_invalid_code',
          userId
        }, 'warning');
        return { success: false, error: 'Invalid verification code' };
      }

      // Disable 2FA
      const { error } = await supabase
        .from('user_security_settings')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          backup_codes: null
        })
        .eq('user_id', userId);

      if (error) {
        logError(error, 'disable2FA');
        return { success: false, error: createErrorMessage(error, 'disable2FA') };
      }

      await securityLogger.logEvent('auth_success', { action: '2fa_disabled' }, 'info', userId);

      return { success: true };

    } catch (error) {
      logError(error, 'disable2FA');
      return { success: false, error: createErrorMessage(error, 'disable2FA') };
    }
  }

  /**
   * Verify backup code
   */
  private verifyBackupCode(code: string, backupCodes: string[]): boolean {
    return backupCodes.includes(code.toUpperCase());
  }

  /**
   * Use a backup code (mark as used)
   */
  async useBackupCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: settings, error: fetchError } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !settings) {
        return { success: false, error: 'Security settings not found' };
      }

      const backupCodes = settings.backup_codes || [];
      const codeIndex = backupCodes.indexOf(code.toUpperCase());

      if (codeIndex === -1) {
        return { success: false, error: 'Invalid backup code' };
      }

      // Remove the used backup code
      const updatedCodes = backupCodes.filter((_, index) => index !== codeIndex);

      const { error } = await supabase
        .from('user_security_settings')
        .update({ backup_codes: updatedCodes })
        .eq('user_id', userId);

      if (error) {
        logError(error, 'useBackupCode');
        return { success: false, error: createErrorMessage(error, 'useBackupCode') };
      }

      await securityLogger.logEvent('auth_success', { action: 'backup_code_used' }, 'info', userId);

      return { success: true };

    } catch (error) {
      logError(error, 'useBackupCode');
      return { success: false, error: createErrorMessage(error, 'useBackupCode') };
    }
  }

  /**
   * Get user's 2FA settings
   */
  async getUserSettings(userId: string): Promise<TwoFactorSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no settings exist, that's okay
        if (error.code === 'PGRST116') {
          return null;
        }
        logError(error, 'getUserSettings');
        return null;
      }

      return data as TwoFactorSettings;

    } catch (error) {
      logError(error, 'getUserSettings');
      return null;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    return settings?.two_factor_enabled || false;
  }

  /**
   * Verify 2FA during login
   */
  async verify2FALogin(userId: string, code: string): Promise<{ success: boolean; error?: string; wasBackupCode?: boolean }> {
    try {
      const settings = await this.getUserSettings(userId);
      
      if (!settings || !settings.two_factor_enabled) {
        return { success: false, error: '2FA not enabled for this account' };
      }

      // First try TOTP verification
      if (settings.two_factor_secret && this.verifyToken(code, settings.two_factor_secret)) {
        await securityLogger.logEvent('auth_success', { action: '2fa_verified', method: 'totp' }, 'info', userId);
        return { success: true };
      }

      // Then try backup code
      if (this.verifyBackupCode(code, settings.backup_codes || [])) {
        const result = await this.useBackupCode(userId, code);
        if (result.success) {
          await securityLogger.logEvent('auth_success', { action: '2fa_verified', method: 'backup_code' }, 'info', userId);
          return { success: true, wasBackupCode: true };
        }
      }

      // Failed verification
      await securityLogger.logAuthFailure(undefined, '2fa_verification_failed');
      return { success: false, error: 'Invalid verification code' };

    } catch (error) {
      logError(error, 'verify2FALogin');
      return { success: false, error: createErrorMessage(error, 'verify2FALogin') };
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, verificationCode: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      const settings = await this.getUserSettings(userId);
      
      if (!settings || !settings.two_factor_enabled) {
        return { success: false, error: '2FA not enabled' };
      }

      // Verify current code
      if (!this.verifyToken(verificationCode, settings.two_factor_secret || '')) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes();

      const { error } = await supabase
        .from('user_security_settings')
        .update({ backup_codes: newBackupCodes })
        .eq('user_id', userId);

      if (error) {
        logError(error, 'regenerateBackupCodes');
        return { success: false, error: createErrorMessage(error, 'regenerateBackupCodes') };
      }

      await securityLogger.logEvent('auth_success', { action: 'backup_codes_regenerated' }, 'info', userId);

      return { success: true, backupCodes: newBackupCodes };

    } catch (error) {
      logError(error, 'regenerateBackupCodes');
      return { success: false, error: createErrorMessage(error, 'regenerateBackupCodes') };
    }
  }
}

export const twoFactorAuth = TwoFactorAuth.getInstance();