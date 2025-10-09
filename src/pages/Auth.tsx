import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Music, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { createErrorMessage } from '@/lib/errorHandling';

type AuthMode = 'signIn' | 'signUp' | 'resetPassword' | 'updatePassword';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { user, signIn, signUp, resetPassword, updatePassword } = useAuth();
  const { toast } = useToast();

  // Check if user arrived from password reset email
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'reset') {
      setMode('updatePassword');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Password validation function
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('One number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('One special character');
    }
    
    return errors;
  };

  // Handle password input with real-time validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === 'signUp' || mode === 'updatePassword') {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'resetPassword') {
        // Handle password reset request
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Reset Failed",
            description: createErrorMessage(error, 'authentication'),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check Your Email",
            description: "We've sent you a password reset link. Please check your email.",
          });
          setEmail('');
          setMode('signIn');
        }
      } else if (mode === 'updatePassword') {
        // Handle password update after clicking reset link
        const errors = validatePassword(password);
        if (errors.length > 0) {
          toast({
            title: "Password Requirements",
            description: "Please meet all password requirements.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await updatePassword(password);
        if (error) {
          toast({
            title: "Update Failed",
            description: createErrorMessage(error, 'authentication'),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password Updated!",
            description: "Your password has been successfully updated. You can now sign in.",
          });
          setPassword('');
          setMode('signIn');
        }
      } else {
        // Handle sign in or sign up
        if (mode === 'signUp') {
          const errors = validatePassword(password);
          if (errors.length > 0) {
            toast({
              title: "Password Requirements",
              description: "Please meet all password requirements.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }

        const { error } = mode === 'signUp'
          ? await signUp(email, password)
          : await signIn(email, password);

        if (error) {
          const userMessage = createErrorMessage(error, 'authentication');
          toast({
            title: "Authentication Error",
            description: userMessage,
            variant: "destructive",
          });
        } else if (mode === 'signUp') {
          toast({
            title: "Account Created!",
            description: "Please check your email to verify your account.",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in to dDrummer.",
          });
        }
      }
    } catch (error) {
      const userMessage = createErrorMessage(error, 'authentication');
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Brand */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-primary rounded-full audio-glow">
              <Music className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              dDrummer
            </h1>
            <p className="text-muted-foreground mt-2">
              Your ultimate drumming practice companion
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="bg-card/50 backdrop-blur-lg border-border card-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {mode === 'signUp' && 'Create Account'}
              {mode === 'signIn' && 'Welcome Back'}
              {mode === 'resetPassword' && 'Reset Password'}
              {mode === 'updatePassword' && 'Set New Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'signUp' && 'Join the dDrummer community today'}
              {mode === 'signIn' && 'Sign in to continue your practice sessions'}
              {mode === 'resetPassword' && 'Enter your email to receive a reset link'}
              {mode === 'updatePassword' && 'Choose a strong password for your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field - shown for all modes except updatePassword */}
              {mode !== 'updatePassword' && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input border-border focus:border-primary smooth-transition"
                  />
                </div>
              )}
              
              {/* Password field - shown for signIn, signUp, and updatePassword */}
              {mode !== 'resetPassword' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {mode === 'updatePassword' ? 'New Password' : 'Password'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={mode === 'signUp' || mode === 'updatePassword' ? "Create a strong password" : "••••••••"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    minLength={8}
                    className="bg-input border-border focus:border-primary smooth-transition"
                  />
                  
                  {/* Password requirements for sign up and update password */}
                  {(mode === 'signUp' || mode === 'updatePassword') && (
                    <div className="text-xs space-y-1">
                      <p className="text-muted-foreground">Password must contain:</p>
                      {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'].map((requirement) => (
                        <div key={requirement} className="flex items-center gap-2">
                          {passwordErrors.includes(requirement) ? (
                            <AlertCircle className="h-3 w-3 text-destructive" />
                          ) : (
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                          )}
                          <span className={passwordErrors.includes(requirement) ? 'text-destructive' : 'text-green-600'}>
                            {requirement}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                variant="audio"
                size="wide"
                disabled={loading}
              >
                {loading ? (
                  <>Loading...</>
                ) : (
                  <>
                    {mode === 'signIn' && <><User className="h-4 w-4" />Sign In</>}
                    {mode === 'signUp' && <><User className="h-4 w-4" />Create Account</>}
                    {mode === 'resetPassword' && <><Mail className="h-4 w-4" />Send Reset Link</>}
                    {mode === 'updatePassword' && <><Lock className="h-4 w-4" />Update Password</>}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              {/* Toggle between sign in and sign up */}
              {(mode === 'signIn' || mode === 'signUp') && (
                <>
                  <div className="text-center">
                    {mode === 'signUp' ? (
                      <button
                        type="button"
                        onClick={() => setMode('signIn')}
                        className="text-primary hover:text-primary-glow smooth-transition"
                      >
                        Already have an account? Sign in
                      </button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        New account registration is currently closed
                      </p>
                    )}
                  </div>
                  
                  {/* Forgot password link - only on sign in */}
                  {mode === 'signIn' && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode('resetPassword')}
                        className="text-sm text-muted-foreground hover:text-primary smooth-transition"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Back to sign in link - for reset password mode */}
              {mode === 'resetPassword' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('signIn')}
                    className="text-primary hover:text-primary-glow smooth-transition flex items-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Practice with precision using our advanced metronome,<br />
            record your sessions, and collaborate with other drummers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;