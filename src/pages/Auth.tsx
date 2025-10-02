import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Music, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { createErrorMessage } from '@/lib/errorHandling';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

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
    if (isSignUp) {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password for sign up
    if (isSignUp) {
      const errors = validatePassword(password);
      if (errors.length > 0) {
        toast({
          title: "Password Requirements",
          description: "Please meet all password requirements.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        // Handle rate limiting error specifically
        const userMessage = createErrorMessage(error, 'authentication');
        toast({
          title: "Authentication Error", 
          description: userMessage,
          variant: "destructive",
        });
      } else if (isSignUp) {
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
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp 
                ? 'Join the dDrummer community today'
                : 'Sign in to continue your practice sessions'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignUp ? "Create a strong password" : "••••••••"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  minLength={8}
                  className="bg-input border-border focus:border-primary smooth-transition"
                />
                
                {/* Password requirements for sign up */}
                {isSignUp && (
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
                    <User className="h-4 w-4" />
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:text-primary-glow smooth-transition"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/'}
              >
                Continue as Guest
              </Button>
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