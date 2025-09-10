/**
 * Enhanced error handling utilities to avoid exposing technical details
 */

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_RATE_LIMITED: 'AUTH_002', 
  AUTH_SESSION_EXPIRED: 'AUTH_003',
  AUTH_USER_NOT_FOUND: 'AUTH_004',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_005',
  
  // File upload errors
  FILE_SIZE_EXCEEDED: 'FILE_001',
  FILE_TYPE_INVALID: 'FILE_002',
  FILE_UPLOAD_FAILED: 'FILE_003',
  FILE_STORAGE_QUOTA: 'FILE_004',
  
  // Database errors
  DB_CONNECTION_FAILED: 'DB_001',
  DB_CONSTRAINT_VIOLATION: 'DB_002',
  DB_PERMISSION_DENIED: 'DB_003',
  
  // Network errors
  NETWORK_TIMEOUT: 'NET_001',
  NETWORK_UNAVAILABLE: 'NET_002',
  
  // Generic errors
  UNKNOWN_ERROR: 'GEN_001',
  VALIDATION_ERROR: 'GEN_002'
} as const;

/**
 * Maps technical errors to user-friendly messages
 */
const ERROR_MAP: Record<string, ErrorInfo> = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: {
    code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
    message: 'Invalid email or password',
    userMessage: 'Please check your email and password and try again.',
    severity: 'medium'
  },
  [ERROR_CODES.AUTH_RATE_LIMITED]: {
    code: ERROR_CODES.AUTH_RATE_LIMITED,
    message: 'Too many authentication attempts',
    userMessage: 'Too many login attempts. Please wait a few minutes before trying again.',
    severity: 'medium'
  },
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: {
    code: ERROR_CODES.AUTH_SESSION_EXPIRED,
    message: 'Session expired',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: 'low'
  },
  [ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED]: {
    code: ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED,
    message: 'Email not verified',
    userMessage: 'Please check your email and click the verification link.',
    severity: 'medium'
  },
  [ERROR_CODES.FILE_SIZE_EXCEEDED]: {
    code: ERROR_CODES.FILE_SIZE_EXCEEDED,
    message: 'File size too large',
    userMessage: 'File is too large. Please choose a file under 50MB.',
    severity: 'low'
  },
  [ERROR_CODES.FILE_TYPE_INVALID]: {
    code: ERROR_CODES.FILE_TYPE_INVALID,
    message: 'Invalid file type',
    userMessage: 'Only MP3, WAV, and M4A audio files are supported.',
    severity: 'low'
  },
  [ERROR_CODES.DB_CONSTRAINT_VIOLATION]: {
    code: ERROR_CODES.DB_CONSTRAINT_VIOLATION,
    message: 'Database constraint violation',
    userMessage: 'This action conflicts with existing data. Please try again.',
    severity: 'medium'
  },
  [ERROR_CODES.NETWORK_TIMEOUT]: {
    code: ERROR_CODES.NETWORK_TIMEOUT,
    message: 'Request timeout',
    userMessage: 'The request took too long. Please check your connection and try again.',
    severity: 'medium'
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again or contact support if the problem persists.',
    severity: 'high'
  }
};

/**
 * Sanitizes error messages to avoid exposing technical details
 */
export const sanitizeError = (error: any): ErrorInfo => {
  // Handle Supabase auth errors
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return ERROR_MAP[ERROR_CODES.AUTH_INVALID_CREDENTIALS];
    }
    
    if (message.includes('rate limit') || message.includes('too many')) {
      return ERROR_MAP[ERROR_CODES.AUTH_RATE_LIMITED];
    }
    
    if (message.includes('email not confirmed') || message.includes('email not verified')) {
      return ERROR_MAP[ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED];
    }
    
    if (message.includes('jwt expired') || message.includes('session')) {
      return ERROR_MAP[ERROR_CODES.AUTH_SESSION_EXPIRED];
    }
    
    if (message.includes('file size') || message.includes('too large')) {
      return ERROR_MAP[ERROR_CODES.FILE_SIZE_EXCEEDED];
    }
    
    if (message.includes('file type') || message.includes('mime type')) {
      return ERROR_MAP[ERROR_CODES.FILE_TYPE_INVALID];
    }
    
    if (message.includes('duplicate key') || message.includes('constraint')) {
      return ERROR_MAP[ERROR_CODES.DB_CONSTRAINT_VIOLATION];
    }
    
    if (message.includes('timeout') || message.includes('network')) {
      return ERROR_MAP[ERROR_CODES.NETWORK_TIMEOUT];
    }
  }
  
  // Handle HTTP status codes
  if (error?.status) {
    switch (error.status) {
      case 401:
        return ERROR_MAP[ERROR_CODES.AUTH_INVALID_CREDENTIALS];
      case 403:
        return ERROR_MAP[ERROR_CODES.DB_PERMISSION_DENIED];
      case 408:
      case 504:
        return ERROR_MAP[ERROR_CODES.NETWORK_TIMEOUT];
      case 413:
        return ERROR_MAP[ERROR_CODES.FILE_SIZE_EXCEEDED];
      case 415:
        return ERROR_MAP[ERROR_CODES.FILE_TYPE_INVALID];
      case 429:
        return ERROR_MAP[ERROR_CODES.AUTH_RATE_LIMITED];
    }
  }
  
  // Default to unknown error with generic message
  return ERROR_MAP[ERROR_CODES.UNKNOWN_ERROR];
};

/**
 * Logs error details for debugging (server-side only in production)
 */
export const logError = (error: any, context?: string) => {
  const errorInfo = sanitizeError(error);
  
  // In development, log detailed error info
  if (import.meta.env.DEV) {
    console.error(`Error in ${context || 'unknown context'}:`, {
      original: error,
      sanitized: errorInfo,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
  } else {
    // In production, only log sanitized errors
    console.error(`Error ${errorInfo.code}: ${errorInfo.message}`, {
      context,
      timestamp: new Date().toISOString()
    });
  }
  
  return errorInfo;
};

/**
 * Creates a user-friendly error message for display
 */
export const createErrorMessage = (error: any, context?: string): string => {
  const errorInfo = logError(error, context);
  return errorInfo.userMessage;
};