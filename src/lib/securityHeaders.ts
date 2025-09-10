/**
 * Security headers and CSP (Content Security Policy) utilities
 */

export interface SecurityHeadersConfig {
  csp?: {
    enabled: boolean;
    directives?: {
      defaultSrc?: string[];
      scriptSrc?: string[];
      styleSrc?: string[];
      imgSrc?: string[];
      fontSrc?: string[];
      connectSrc?: string[];
      frameSrc?: string[];
      objectSrc?: string[];
      mediaSrc?: string[];
      workerSrc?: string[];
    };
  };
  hsts?: {
    enabled: boolean;
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  frameOptions?: {
    enabled: boolean;
    policy?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    allowFrom?: string;
  };
  contentTypeOptions?: {
    enabled: boolean;
  };
  referrerPolicy?: {
    enabled: boolean;
    policy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  };
  permissionsPolicy?: {
    enabled: boolean;
    directives?: Record<string, string[]>;
  };
}

class SecurityHeaders {
  private static instance: SecurityHeaders;
  
  private defaultConfig: SecurityHeadersConfig = {
    csp: {
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for React in development
          "'unsafe-eval'", // Required for React in development
          "https://accounts.google.com", // For Google OAuth
          "https://apis.google.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for CSS-in-JS libraries
          "https://fonts.googleapis.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:", // Allow HTTPS images
          "https://lh3.googleusercontent.com" // Google profile images
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        connectSrc: [
          "'self'",
          "https://stnwvookqxwhzkirgtkq.supabase.co", // Supabase API
          "https://accounts.google.com", // Google OAuth
          "wss://realtime-pooler.supabase.com" // Supabase realtime
        ],
        frameSrc: [
          "'self'",
          "https://accounts.google.com" // Google OAuth iframe
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "blob:", "data:"],
        workerSrc: ["'self'", "blob:"]
      }
    },
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameOptions: {
      enabled: true,
      policy: 'DENY'
    },
    contentTypeOptions: {
      enabled: true
    },
    referrerPolicy: {
      enabled: true,
      policy: 'strict-origin-when-cross-origin'
    },
    permissionsPolicy: {
      enabled: true,
      directives: {
        camera: [],
        microphone: ["'self'"], // Allow microphone for recording features
        geolocation: [],
        payment: [],
        usb: [],
        bluetooth: [],
        magnetometer: [],
        gyroscope: [],
        accelerometer: []
      }
    }
  };

  private constructor() {}

  static getInstance(): SecurityHeaders {
    if (!SecurityHeaders.instance) {
      SecurityHeaders.instance = new SecurityHeaders();
    }
    return SecurityHeaders.instance;
  }

  /**
   * Generate Content Security Policy string
   */
  private generateCSP(directives: SecurityHeadersConfig['csp']['directives']): string {
    if (!directives) return '';
    
    const cspParts: string[] = [];
    
    Object.entries(directives).forEach(([directive, sources]) => {
      if (sources && sources.length > 0) {
        const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
        cspParts.push(`${directiveName} ${sources.join(' ')}`);
      }
    });
    
    return cspParts.join('; ');
  }

  /**
   * Generate Permissions Policy string
   */
  private generatePermissionsPolicy(directives: Record<string, string[]>): string {
    const policyParts: string[] = [];
    
    Object.entries(directives).forEach(([directive, origins]) => {
      if (origins.length === 0) {
        policyParts.push(`${directive}=()`);
      } else {
        const formattedOrigins = origins.map(origin => 
          origin === "'self'" ? 'self' : `"${origin}"`
        );
        policyParts.push(`${directive}=(${formattedOrigins.join(' ')})`);
      }
    });
    
    return policyParts.join(', ');
  }

  /**
   * Get security headers as meta tags for HTML
   */
  getSecurityMetaTags(config?: Partial<SecurityHeadersConfig>): string {
    const mergedConfig = this.mergeConfig(config);
    const metaTags: string[] = [];

    // Content Security Policy
    if (mergedConfig.csp?.enabled && mergedConfig.csp.directives) {
      const csp = this.generateCSP(mergedConfig.csp.directives);
      if (csp) {
        metaTags.push(`<meta http-equiv="Content-Security-Policy" content="${csp}">`);
      }
    }

    // X-Frame-Options
    if (mergedConfig.frameOptions?.enabled) {
      const policy = mergedConfig.frameOptions.policy;
      const content = policy === 'ALLOW-FROM' && mergedConfig.frameOptions.allowFrom
        ? `${policy} ${mergedConfig.frameOptions.allowFrom}`
        : policy;
      metaTags.push(`<meta http-equiv="X-Frame-Options" content="${content}">`);
    }

    // X-Content-Type-Options
    if (mergedConfig.contentTypeOptions?.enabled) {
      metaTags.push(`<meta http-equiv="X-Content-Type-Options" content="nosniff">`);
    }

    // Referrer Policy
    if (mergedConfig.referrerPolicy?.enabled) {
      metaTags.push(`<meta name="referrer" content="${mergedConfig.referrerPolicy.policy}">`);
    }

    // Permissions Policy
    if (mergedConfig.permissionsPolicy?.enabled && mergedConfig.permissionsPolicy.directives) {
      const permissionsPolicy = this.generatePermissionsPolicy(mergedConfig.permissionsPolicy.directives);
      if (permissionsPolicy) {
        metaTags.push(`<meta http-equiv="Permissions-Policy" content="${permissionsPolicy}">`);
      }
    }

    return metaTags.join('\n');
  }

  /**
   * Get security headers for HTTP responses
   */
  getSecurityHeaders(config?: Partial<SecurityHeadersConfig>): Record<string, string> {
    const mergedConfig = this.mergeConfig(config);
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (mergedConfig.csp?.enabled && mergedConfig.csp.directives) {
      const csp = this.generateCSP(mergedConfig.csp.directives);
      if (csp) {
        headers['Content-Security-Policy'] = csp;
      }
    }

    // HSTS
    if (mergedConfig.hsts?.enabled) {
      let hstsValue = `max-age=${mergedConfig.hsts.maxAge || 31536000}`;
      if (mergedConfig.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (mergedConfig.hsts.preload) {
        hstsValue += '; preload';
      }
      headers['Strict-Transport-Security'] = hstsValue;
    }

    // X-Frame-Options
    if (mergedConfig.frameOptions?.enabled) {
      const policy = mergedConfig.frameOptions.policy;
      const value = policy === 'ALLOW-FROM' && mergedConfig.frameOptions.allowFrom
        ? `${policy} ${mergedConfig.frameOptions.allowFrom}`
        : policy;
      headers['X-Frame-Options'] = value!;
    }

    // X-Content-Type-Options
    if (mergedConfig.contentTypeOptions?.enabled) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Referrer Policy
    if (mergedConfig.referrerPolicy?.enabled) {
      headers['Referrer-Policy'] = mergedConfig.referrerPolicy.policy!;
    }

    // Permissions Policy
    if (mergedConfig.permissionsPolicy?.enabled && mergedConfig.permissionsPolicy.directives) {
      const permissionsPolicy = this.generatePermissionsPolicy(mergedConfig.permissionsPolicy.directives);
      if (permissionsPolicy) {
        headers['Permissions-Policy'] = permissionsPolicy;
      }
    }

    // Additional security headers
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['Expect-CT'] = 'max-age=86400, enforce';

    return headers;
  }

  /**
   * Apply security headers to the document
   */
  applyToDocument(config?: Partial<SecurityHeadersConfig>): void {
    if (typeof document === 'undefined') return;

    const metaTags = this.getSecurityMetaTags(config);
    
    // Create a temporary div to parse the HTML
    const temp = document.createElement('div');
    temp.innerHTML = metaTags;
    
    // Add meta tags to head
    const head = document.head;
    Array.from(temp.children).forEach(child => {
      head.appendChild(child);
    });
  }

  /**
   * Merge user config with default config
   */
  private mergeConfig(userConfig?: Partial<SecurityHeadersConfig>): SecurityHeadersConfig {
    if (!userConfig) return this.defaultConfig;

    return {
      csp: { ...this.defaultConfig.csp, ...userConfig.csp },
      hsts: { ...this.defaultConfig.hsts, ...userConfig.hsts },
      frameOptions: { ...this.defaultConfig.frameOptions, ...userConfig.frameOptions },
      contentTypeOptions: { ...this.defaultConfig.contentTypeOptions, ...userConfig.contentTypeOptions },
      referrerPolicy: { ...this.defaultConfig.referrerPolicy, ...userConfig.referrerPolicy },
      permissionsPolicy: { ...this.defaultConfig.permissionsPolicy, ...userConfig.permissionsPolicy }
    };
  }

  /**
   * Validate CSP directives
   */
  validateCSP(directives: SecurityHeadersConfig['csp']['directives']): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!directives) {
      return { valid: true, errors };
    }

    // Check for unsafe directives in production
    if (!import.meta.env.DEV) {
      Object.entries(directives).forEach(([directive, sources]) => {
        if (sources?.includes("'unsafe-inline'")) {
          errors.push(`Unsafe 'unsafe-inline' found in ${directive}`);
        }
        if (sources?.includes("'unsafe-eval'")) {
          errors.push(`Unsafe 'unsafe-eval' found in ${directive}`);
        }
      });
    }

    // Check for wildcard sources
    Object.entries(directives).forEach(([directive, sources]) => {
      if (sources?.includes('*')) {
        errors.push(`Wildcard (*) source found in ${directive} - consider being more specific`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get development-friendly CSP
   */
  getDevelopmentCSP(): SecurityHeadersConfig {
    return {
      ...this.defaultConfig,
      csp: {
        enabled: true,
        directives: {
          ...this.defaultConfig.csp?.directives,
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://accounts.google.com",
            "https://apis.google.com",
            "localhost:*",
            "*.localhost:*"
          ],
          connectSrc: [
            "'self'",
            "https://stnwvookqxwhzkirgtkq.supabase.co",
            "https://accounts.google.com",
            "wss://realtime-pooler.supabase.com",
            "localhost:*",
            "*.localhost:*",
            "ws://localhost:*",
            "wss://localhost:*"
          ]
        }
      }
    };
  }
}

export const securityHeaders = SecurityHeaders.getInstance();

/**
 * React hook for security headers
 */
export const useSecurityHeaders = (config?: Partial<SecurityHeadersConfig>) => {
  const applyHeaders = () => {
    const finalConfig = import.meta.env.DEV 
      ? securityHeaders.getDevelopmentCSP() 
      : { ...securityHeaders['defaultConfig'], ...config };
      
    securityHeaders.applyToDocument(finalConfig);
  };

  const getHeaders = () => {
    const finalConfig = import.meta.env.DEV 
      ? securityHeaders.getDevelopmentCSP() 
      : { ...securityHeaders['defaultConfig'], ...config };
      
    return securityHeaders.getSecurityHeaders(finalConfig);
  };

  const validateHeaders = () => {
    const finalConfig = import.meta.env.DEV 
      ? securityHeaders.getDevelopmentCSP() 
      : { ...securityHeaders['defaultConfig'], ...config };
      
    return securityHeaders.validateCSP(finalConfig.csp?.directives);
  };

  return {
    applyHeaders,
    getHeaders,
    validateHeaders
  };
};