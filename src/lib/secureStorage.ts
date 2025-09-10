/**
 * Secure storage utilities to replace localStorage for sensitive data
 */

import { supabase } from '@/integrations/supabase/client';

export interface SecureStorageItem {
  key: string;
  value: string;
  userId: string;
  encrypted: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Simple encryption/decryption using Web Crypto API
class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Initialize encryption key based on user session
   */
  async initializeEncryption(userId: string): Promise<void> {
    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(userId.substring(0, 32).padEnd(32, '0')),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      this.encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('ddrummer-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('Encryption initialization failed, falling back to base64:', error);
    }
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      // Fallback to base64 encoding if encryption is not available
      return btoa(data);
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      const encryptedArray = new Uint8Array(encryptedBuffer);
      const result = new Uint8Array(iv.length + encryptedArray.length);
      result.set(iv);
      result.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.warn('Encryption failed, using base64:', error);
      return btoa(data);
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      // Fallback to base64 decoding
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData;
      }
    }

    try {
      const dataArray = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = dataArray.slice(0, 12);
      const encrypted = dataArray.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.warn('Decryption failed, trying base64:', error);
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData;
      }
    }
  }

  /**
   * Store data securely (encrypts sensitive data)
   */
  async setItem(key: string, value: string, options?: { encrypt?: boolean; expiresIn?: number }): Promise<void> {
    const { encrypt = true, expiresIn } = options || {};
    
    let processedValue = value;
    if (encrypt) {
      processedValue = await this.encrypt(value);
    }

    const item = {
      value: processedValue,
      encrypted: encrypt,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined
    };

    localStorage.setItem(`secure_${key}`, JSON.stringify(item));
  }

  /**
   * Retrieve and decrypt data
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const storedItem = localStorage.getItem(`secure_${key}`);
      if (!storedItem) return null;

      const item = JSON.parse(storedItem);
      
      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.removeItem(key);
        return null;
      }

      if (item.encrypted) {
        return await this.decrypt(item.value);
      }
      
      return item.value;
    } catch (error) {
      console.error('Error retrieving secure item:', error);
      return null;
    }
  }

  /**
   * Remove item from secure storage
   */
  removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  /**
   * Clear all secure storage items
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Migrate existing localStorage data to secure storage
   */
  async migrateFromLocalStorage(keys: string[]): Promise<void> {
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        await this.setItem(key, value, { encrypt: true });
        localStorage.removeItem(key); // Remove old unencrypted data
      }
    }
  }
}

export const secureStorage = SecureStorage.getInstance();

/**
 * Migrate sensitive data from localStorage to secure storage
 */
export const migrateSensitiveData = async (userId: string): Promise<void> => {
  await secureStorage.initializeEncryption(userId);
  
  // List of sensitive keys to migrate
  const sensitiveKeys = [
    'ddrummer-audio-files',
    'ddrummer-user-preferences',
    'ddrummer-session-data'
  ];

  await secureStorage.migrateFromLocalStorage(sensitiveKeys);
};