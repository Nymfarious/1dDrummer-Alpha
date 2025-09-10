import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Rate limiting state
  const authAttempts = useRef<{ [key: string]: { count: number; lastAttempt: number } }>({});
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        
        // Setup session timeout for valid sessions
        if (session) {
          setupSessionTimeout(session);
        } else {
          // Clear timeout when signing out
          if (sessionTimeoutRef.current) {
            clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = null;
          }
        }
        
        // Create profile if user just signed up
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            createUserProfile(session.user);
          }, 0);
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
        console.error('Error creating profile:', error);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
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
      return { error: rateLimitCheck.error };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    recordAuthAttempt(email, !error);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Check rate limit
    const rateLimitCheck = checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      return { error: rateLimitCheck.error };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    recordAuthAttempt(email, !error);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
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