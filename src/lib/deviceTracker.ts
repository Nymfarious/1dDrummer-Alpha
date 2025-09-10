/**
 * Device tracking and fingerprinting for suspicious login detection
 */

import { supabase } from '@/integrations/supabase/client';
import { securityLogger } from './securityLogger';
import { logError, createErrorMessage } from './errorHandling';

export interface DeviceInfo {
  fingerprint: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  screen: string;
  timezone: string;
}

export interface DeviceSession {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name?: string;
  device_type?: string;
  browser_info?: string;
  ip_address?: string;
  location_info?: any;
  is_trusted: boolean;
  last_seen: string;
  created_at: string;
  expires_at: string;
}

class DeviceTracker {
  private static instance: DeviceTracker;
  private deviceInfo: DeviceInfo | null = null;

  private constructor() {}

  static getInstance(): DeviceTracker {
    if (!DeviceTracker.instance) {
      DeviceTracker.instance = new DeviceTracker();
    }
    return DeviceTracker.instance;
  }

  /**
   * Generate device fingerprint based on browser characteristics
   */
  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Canvas fingerprinting
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint test 🔒', 2, 2);
    }
    
    const canvasData = canvas.toDataURL();
    
    // Collect various browser characteristics
    const characteristics = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      !!window.indexedDB,
      typeof (window as any).openDatabase,
      (navigator as any).cpuClass || 'unknown',
      navigator.hardwareConcurrency || 'unknown',
      canvasData.slice(-50), // Last 50 chars of canvas data
    ].join('|');

    // Generate hash of characteristics
    return this.simpleHash(characteristics);
  }

  /**
   * Simple hash function for device fingerprinting
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Detect device type based on user agent and screen size
   */
  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = screen.width;

    if (userAgent.includes('mobile') || screenWidth < 768) {
      return 'mobile';
    } else if (userAgent.includes('tablet') || (screenWidth >= 768 && screenWidth < 1024)) {
      return 'tablet';
    } else if (screenWidth >= 1024) {
      return 'desktop';
    }

    return 'unknown';
  }

  /**
   * Extract browser information
   */
  private getBrowserInfo(): { browser: string; os: string } {
    const userAgent = navigator.userAgent;
    
    let browser = 'unknown';
    let os = 'unknown';

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge';
    }

    // Detect OS
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS')) {
      os = 'iOS';
    }

    return { browser, os };
  }

  /**
   * Get current device information
   */
  getCurrentDeviceInfo(): DeviceInfo {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    const fingerprint = this.generateFingerprint();
    const deviceType = this.detectDeviceType();
    const { browser, os } = this.getBrowserInfo();

    this.deviceInfo = {
      fingerprint,
      name: `${browser} on ${os}`,
      type: deviceType,
      browser,
      os,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    return this.deviceInfo;
  }

  /**
   * Register or update device session
   */
  async registerDevice(userId: string): Promise<{ success: boolean; isNewDevice: boolean; error?: string }> {
    try {
      const deviceInfo = this.getCurrentDeviceInfo();

      // Check if device already exists
      const { data: existingDevice, error: fetchError } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceInfo.fingerprint)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logError(fetchError, 'registerDevice');
        return { success: false, isNewDevice: false, error: createErrorMessage(fetchError, 'registerDevice') };
      }

      const isNewDevice = !existingDevice;

      if (isNewDevice) {
        // Register new device
        const { error: insertError } = await supabase
          .from('device_sessions')
          .insert({
            user_id: userId,
            device_fingerprint: deviceInfo.fingerprint,
            device_name: deviceInfo.name,
            device_type: deviceInfo.type,
            browser_info: JSON.stringify({
              browser: deviceInfo.browser,
              os: deviceInfo.os,
              screen: deviceInfo.screen,
              timezone: deviceInfo.timezone,
              userAgent: navigator.userAgent
            }),
            is_trusted: false, // New devices are not trusted by default
            last_seen: new Date().toISOString(),
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
          });

        if (insertError) {
          logError(insertError, 'registerDevice');
          return { success: false, isNewDevice: false, error: createErrorMessage(insertError, 'registerDevice') };
        }

        await securityLogger.logEvent('suspicious_activity', {
          action: 'new_device_login',
          device: deviceInfo.name,
          fingerprint: deviceInfo.fingerprint
        }, 'warning', userId);

      } else {
        // Update existing device last seen
        const { error: updateError } = await supabase
          .from('device_sessions')
          .update({
            last_seen: new Date().toISOString(),
            browser_info: JSON.stringify({
              browser: deviceInfo.browser,
              os: deviceInfo.os,
              screen: deviceInfo.screen,
              timezone: deviceInfo.timezone,
              userAgent: navigator.userAgent
            })
          })
          .eq('id', existingDevice.id);

        if (updateError) {
          logError(updateError, 'registerDevice');
          return { success: false, isNewDevice: false, error: createErrorMessage(updateError, 'registerDevice') };
        }
      }

      return { success: true, isNewDevice };

    } catch (error) {
      logError(error, 'registerDevice');
      return { success: false, isNewDevice: false, error: createErrorMessage(error, 'registerDevice') };
    }
  }

  /**
   * Get user's device sessions
   */
  async getUserDevices(userId: string): Promise<DeviceSession[]> {
    try {
      const { data, error } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false });

      if (error) {
        logError(error, 'getUserDevices');
        return [];
      }

      return data as DeviceSession[];

    } catch (error) {
      logError(error, 'getUserDevices');
      return [];
    }
  }

  /**
   * Trust a device
   */
  async trustDevice(userId: string, deviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('device_sessions')
        .update({ is_trusted: true })
        .eq('id', deviceId)
        .eq('user_id', userId);

      if (error) {
        logError(error, 'trustDevice');
        return { success: false, error: createErrorMessage(error, 'trustDevice') };
      }

      await securityLogger.logEvent('auth_success', {
        action: 'device_trusted',
        deviceId
      }, 'info', userId);

      return { success: true };

    } catch (error) {
      logError(error, 'trustDevice');
      return { success: false, error: createErrorMessage(error, 'trustDevice') };
    }
  }

  /**
   * Revoke a device session
   */
  async revokeDevice(userId: string, deviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('device_sessions')
        .delete()
        .eq('id', deviceId)
        .eq('user_id', userId);

      if (error) {
        logError(error, 'revokeDevice');
        return { success: false, error: createErrorMessage(error, 'revokeDevice') };
      }

      await securityLogger.logEvent('auth_success', {
        action: 'device_revoked',
        deviceId
      }, 'info', userId);

      return { success: true };

    } catch (error) {
      logError(error, 'revokeDevice');
      return { success: false, error: createErrorMessage(error, 'revokeDevice') };
    }
  }

  /**
   * Check if current device is trusted
   */
  async isCurrentDeviceTrusted(userId: string): Promise<boolean> {
    try {
      const deviceInfo = this.getCurrentDeviceInfo();

      const { data, error } = await supabase
        .from('device_sessions')
        .select('is_trusted')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceInfo.fingerprint)
        .single();

      if (error) {
        return false;
      }

      return data?.is_trusted || false;

    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired device sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
      logError(error, 'cleanupExpiredSessions');
    }
  }
}

export const deviceTracker = DeviceTracker.getInstance();