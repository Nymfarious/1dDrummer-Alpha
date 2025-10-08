import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/lib/secureStorage';
import { securityLogger } from '@/lib/securityLogger';
import { sanitizeError, logError } from '@/lib/errorHandling';
import { csrfProtection } from '@/lib/csrfProtection';
import { twoFactorAuth } from '@/lib/twoFactorAuth';
import { deviceTracker } from '@/lib/deviceTracker';
import { accountLockout } from '@/lib/accountLockout';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  pending2FA: boolean;
  pendingUserId: string | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; requires2FA?: boolean; userId?: string }>;
  verify2FA: (code: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending2FA, setPending2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  // Rate limiting state
  const authAttempts = useRef<{ [key: string]: { count: number; lastAttempt: number } }>({});
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize CSRF protection
  useEffect(() => {
    csrfProtection.initialize();
  }, []);

  // Session timeout management
  const setupSessionTimeout = (session: Session) => {
    // Clear existing timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Set 24-hour session timeout
    const timeoutDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    sessionTimeoutRef.current = setTimeout(() => {
      supabase.auth.signOut();
    }, timeoutDuration);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setPending2FA(false);
        setPendingUserId(null);
        
        // Setup session timeout for valid sessions
        if (session) {
          setupSessionTimeout(session);
          // Initialize secure storage with user ID
          secureStorage.initializeEncryption(session.user.id);
          
          // Register device
          deviceTracker.registerDevice(session.user.id);
        } else {
          // Clear timeout when signing out
          if (sessionTimeoutRef.current) {
            clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = null;
          }
        }
        
        // Create profile if user just signed up
        if (event === 'SIGNED_IN' && session?.user) {
          securityLogger.logAuthSuccess(session.user.id, session.user.email || '');
          setTimeout(() => {
            createUserProfile(session.user);
          }, 0);
        }
        
        if (event === 'SIGNED_OUT') {
          securityLogger.logLogout(user?.id || '', user?.email || '');
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session) {
        setupSessionTimeout(session);
        secureStorage.initializeEncryption(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  const createUserProfile = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            username: user.email?.split('@')[0] || '',
            full_name: user.user_metadata?.full_name || '',
          }
        ]);
      
      if (error && error.code !== '23505') { // Ignore unique constraint violation
        const sanitizedError = logError(error, 'createUserProfile');
        console.warn('Profile creation failed:', sanitizedError.userMessage);
      }
    } catch (error) {
      logError(error, 'createUserProfile');
    }
  };

  // Rate limiting function
  const checkRateLimit = (email: string): { allowed: boolean; error?: any } => {
    const now = Date.now();
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    if (!authAttempts.current[email]) {
      authAttempts.current[email] = { count: 0, lastAttempt: 0 };
    }
    
    const userAttempts = authAttempts.current[email];
    
    // Reset count if window has passed
    if (now - userAttempts.lastAttempt > windowMs) {
      userAttempts.count = 0;
    }
    
    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - userAttempts.lastAttempt)) / 1000 / 60);
      return {
        allowed: false,
        error: { message: `Too many login attempts. Please try again in ${timeLeft} minutes.` }
      };
    }
    
    return { allowed: true };
  };

  const recordAuthAttempt = (email: string, success: boolean) => {
    const now = Date.now();
    
    if (!authAttempts.current[email]) {
      authAttempts.current[email] = { count: 0, lastAttempt: 0 };
    }
    
    if (!success) {
      authAttempts.current[email].count += 1;
      authAttempts.current[email].lastAttempt = now;
    } else {
      // Reset on successful login
      authAttempts.current[email].count = 0;
    }
  };

  const signUp = async (email: string, password: string) => {
    // Check rate limit
    const rateLimitCheck = checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      await securityLogger.logAuthFailure(email, 'rate_limited');
      return { error: rateLimitCheck.error };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      recordAuthAttempt(email, !error);
      
      if (error) {
        await securityLogger.logAuthFailure(email, error.message);
        return { error: sanitizeError(error) };
      }
      
      return { error: null };
    } catch (error) {
      await securityLogger.logAuthFailure(email, 'unexpected_error');
      logError(error, 'signUp');
      recordAuthAttempt(email, false);
      return { error: sanitizeError(error) };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check account lockout first
    const lockoutCheck = await accountLockout.isAccountLocked(email);
    if (lockoutCheck.locked) {
      await securityLogger.logAuthFailure(email, 'account_locked');
      return { 
        error: { 
          message: `Account is locked. Please try again in ${lockoutCheck.remainingTime} minutes.` 
        }
      };
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      await securityLogger.logAuthFailure(email, 'rate_limited');
      return { error: rateLimitCheck.error };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      recordAuthAttempt(email, !error);

      if (error) {
        // Record failed attempt for account lockout
        await accountLockout.recordFailedAttempt(email);
        await securityLogger.logAuthFailure(email, error.message);
        return { error: sanitizeError(error) };
      }

      // Check if user has 2FA enabled
      const userId = data.user?.id;
      if (userId) {
        const has2FA = await twoFactorAuth.is2FAEnabled(userId);
        
        if (has2FA) {
          // Set pending 2FA state
          setPending2FA(true);
          setPendingUserId(userId);
          
          // Sign out the user temporarily until 2FA is verified
          await supabase.auth.signOut();
          
          return { error: null, requires2FA: true, userId };
        }

        // Clear any existing lockouts on successful login
        await accountLockout.resetFailedAttempts(email);
      }
      
      return { error: null };
    } catch (error) {
      await securityLogger.logAuthFailure(email, 'unexpected_error');
      logError(error, 'signIn');
      recordAuthAttempt(email, false);
      await accountLockout.recordFailedAttempt(email);
      return { error: sanitizeError(error) };
    }
  };

  const verify2FA = async (code: string) => {
    if (!pendingUserId) {
      return { error: { message: 'No pending 2FA verification' } };
    }

    try {
      const result = await twoFactorAuth.verify2FALogin(pendingUserId, code);
      
      if (result.success) {
        // Complete the sign-in process
        const { data, error } = await supabase.auth.getUser();
        
        if (!error && data.user) {
          setPending2FA(false);
          setPendingUserId(null);
          
          // Clear lockouts on successful 2FA
          const userEmail = data.user.email;
          if (userEmail) {
            await accountLockout.resetFailedAttempts(userEmail);
          }
          
          return { error: null };
        }
      }
      
      return { error: { message: result.error || 'Invalid 2FA code' } };
    } catch (error) {
      logError(error, 'verify2FA');
      return { error: sanitizeError(error) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Redirect to auth page after sign out
    window.location.href = '/auth';
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) {
        await securityLogger.logAuthFailure(email, 'password_reset_failed');
        return { error: sanitizeError(error) };
      }
      
      return { error: null };
    } catch (error) {
      await securityLogger.logAuthFailure(email, 'password_reset_error');
      logError(error, 'resetPassword');
      return { error: sanitizeError(error) };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        return { error: sanitizeError(error) };
      }
      
      return { error: null };
    } catch (error) {
      logError(error, 'updatePassword');
      return { error: sanitizeError(error) };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      pending2FA,
      pendingUserId,
      signUp,
      signIn,
      verify2FA,
      signOut,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};