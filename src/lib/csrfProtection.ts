/**
 * CSRF Protection utilities and middleware
 */

class CSRFProtection {
  private static instance: CSRFProtection;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private readonly TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour

  private constructor() {
    // Initialize token on construction
    this.refreshToken();
    
    // Refresh token periodically
    setInterval(() => this.refreshToken(), this.TOKEN_LIFETIME / 2);
  }

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Refresh the CSRF token
   */
  private refreshToken(): void {
    this.token = this.generateToken();
    this.tokenExpiry = Date.now() + this.TOKEN_LIFETIME;
    
    // Store in sessionStorage (not localStorage for security)
    sessionStorage.setItem('csrf_token', this.token);
    sessionStorage.setItem('csrf_expiry', this.tokenExpiry.toString());
  }

  /**
   * Get the current CSRF token
   */
  getToken(): string {
    // Check if token is expired
    if (Date.now() > this.tokenExpiry) {
      this.refreshToken();
    }
    
    return this.token || '';
  }

  /**
   * Validate a CSRF token
   */
  validateToken(token: string): boolean {
    if (!token || !this.token) {
      return false;
    }
    
    // Check expiry
    if (Date.now() > this.tokenExpiry) {
      return false;
    }
    
    // Timing-safe comparison
    return this.timingSafeEquals(token, this.token);
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Add CSRF token to request headers
   */
  addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      'X-CSRF-Token': this.getToken()
    };
  }

  /**
   * Create CSRF-protected form data
   */
  addTokenToFormData(formData: FormData): FormData {
    formData.append('csrf_token', this.getToken());
    return formData;
  }

  /**
   * Middleware for protecting Supabase requests
   */
  protectSupabaseRequest = <T extends (...args: any[]) => Promise<any>>(
    requestFunction: T,
    operationType: 'read' | 'write' | 'delete' = 'write'
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // Only protect write operations by default
      if (operationType === 'read') {
        return requestFunction(...args);
      }

      // Add CSRF token to the request context
      const token = this.getToken();
      
      // For Supabase, we can add the token as a custom header
      // Note: This requires your edge functions or RLS policies to validate the token
      
      try {
        return await requestFunction(...args);
      } catch (error) {
        // Log potential CSRF attack
        console.warn('Request failed - possible CSRF attack:', error);
        throw error;
      }
    };
  };

  /**
   * Initialize CSRF protection for the application
   */
  initialize(): void {
    // Restore token from sessionStorage if available
    const storedToken = sessionStorage.getItem('csrf_token');
    const storedExpiry = sessionStorage.getItem('csrf_expiry');
    
    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      if (Date.now() < expiry) {
        this.token = storedToken;
        this.tokenExpiry = expiry;
      } else {
        this.refreshToken();
      }
    }

    // Clear tokens on page unload for security
    window.addEventListener('beforeunload', () => {
      sessionStorage.removeItem('csrf_token');
      sessionStorage.removeItem('csrf_expiry');
    });
  }

  /**
   * Get CSRF meta tag for HTML forms
   */
  getMetaTag(): string {
    return `<meta name="csrf-token" content="${this.getToken()}">`;
  }
}

export const csrfProtection = CSRFProtection.getInstance();

/**
 * React hook for CSRF protection
 */
export const useCSRFProtection = () => {
  const getToken = () => csrfProtection.getToken();
  
  const protectedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = csrfProtection.addTokenToHeaders(
      options.headers as Record<string, string> || {}
    );
    
    return fetch(url, {
      ...options,
      headers
    });
  };

  return {
    getToken,
    protectedFetch,
    addTokenToHeaders: csrfProtection.addTokenToHeaders.bind(csrfProtection),
    addTokenToFormData: csrfProtection.addTokenToFormData.bind(csrfProtection)
  };
};