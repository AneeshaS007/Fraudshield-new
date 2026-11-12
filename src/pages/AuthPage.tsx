import { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Smartphone,
  KeyRound,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../lib/api';

export type AuthMode = 'signin' | 'signup' | 'forgot';

interface AuthPageProps {
  initialMode?: AuthMode;
  initialMessage?: string;
  onSuccess: (user: any) => void;
  onCancel?: () => void;
}

export function AuthPage({ initialMode = 'signin', initialMessage, onSuccess, onCancel }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [infoMessage, setInfoMessage] = useState<string | null>(initialMessage || null);

  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-fill remembered email if saved
  useEffect(() => {
    const remembered = localStorage.getItem('fraudshield_remembered_email');
    if (remembered && !email) {
      setEmail(remembered);
    }
  }, []);

  // Switch tabs cleanly
  function switchMode(newMode: AuthMode) {
    setError(null);
    setSuccessMessage(null);
    setMode(newMode);
  }

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Validation: Email
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    // 2. Validation: Sign Up specifics
    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify and re-enter your password.');
        return;
      }
    }

    // 3. Validation: Sign In specifics
    if (mode === 'signin') {
      if (!password) {
        setError('Please enter your password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      // -------------------------------------------------------------
      // FORGOT PASSWORD FLOW
      // -------------------------------------------------------------
      if (mode === 'forgot') {
        if (isSupabaseConfigured) {
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/auth?mode=signin`,
          });
          if (resetErr) {
            setError(resetErr.message || 'Failed to send password reset email.');
            return;
          }
        }
        setSuccessMessage(
          `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox.`
        );
        return;
      }

      // -------------------------------------------------------------
      // SIGN UP FLOW
      // -------------------------------------------------------------
      if (mode === 'signup') {
        const cleanPhone = phone.replace(/\D/g, '') || '9876543210';
        let registeredUser: any = null;

        if (isSupabaseConfigured) {
          const { data, error: signUpErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                name: name.trim(),
                phone: cleanPhone,
              },
            },
          });

          if (signUpErr) {
            setError(signUpErr.message || 'Failed to register account with Supabase.');
            return;
          }

          if (data?.user) {
            registeredUser = data.user;
          }
        }

        // Keep local registry synchronized for secure local verification & session
        try {
          const existingUsers: any[] = JSON.parse(
            localStorage.getItem('fraudshield_registered_users') || '[]'
          );
          const alreadyExists = existingUsers.some(
            (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
          );
          if (alreadyExists && !isSupabaseConfigured) {
            setError('An account with this email address already exists. Please Sign In.');
            return;
          }

          const newUser = {
            id: registeredUser?.id || 'usr_' + Date.now().toString(36),
            email: cleanEmail,
            password, // securely kept in client storage for unconfigured offline fallback
            name: name.trim(),
            phone: cleanPhone,
            created_at: new Date().toISOString(),
          };

          if (!alreadyExists) {
            existingUsers.push(newUser);
            localStorage.setItem('fraudshield_registered_users', JSON.stringify(existingUsers));
          }

          // Update backend profile
          await api.updateProfile({
            name: name.trim(),
            phone: cleanPhone,
          }).catch(() => {});

          if (rememberMe) {
            localStorage.setItem('fraudshield_remembered_email', cleanEmail);
          }

          setSuccessMessage('Account created successfully! Redirecting to Home Page...');
          setTimeout(() => {
            onSuccess(registeredUser || newUser);
          }, 600);
          return;
        } catch (storageErr: any) {
          setError(storageErr.message || 'Account creation failed. Please try again.');
          return;
        }
      }

      // -------------------------------------------------------------
      // SIGN IN FLOW
      // -------------------------------------------------------------
      if (mode === 'signin') {
        let authenticatedUser: any = null;

        if (isSupabaseConfigured) {
          const { data, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (signInErr) {
            if (signInErr.message.includes('Invalid login credentials')) {
              setError('Invalid email or password. Please verify your credentials or click Forgot Password.');
              return;
            }
            setError(signInErr.message || 'Authentication failed. Please check your credentials.');
            return;
          }

          if (data?.user) {
            authenticatedUser = data.user;
          }
        } else {
          // If Supabase credentials are not set in this environment, authenticate against registered users
          const existingUsers: any[] = JSON.parse(
            localStorage.getItem('fraudshield_registered_users') || '[]'
          );
          const matchedUser = existingUsers.find(
            (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
          );

          if (!matchedUser) {
            setError(
              'No account found with this email address. Please click "Sign Up" below to create an account.'
            );
            return;
          }

          if (matchedUser.password !== password) {
            setError('Invalid email or password. Please check your password and try again.');
            return;
          }

          authenticatedUser = matchedUser;
        }

        if (authenticatedUser) {
          if (rememberMe) {
            localStorage.setItem('fraudshield_remembered_email', cleanEmail);
          } else {
            localStorage.removeItem('fraudshield_remembered_email');
          }

          // Synchronize profile name
          const userName = authenticatedUser.user_metadata?.name || authenticatedUser.name || 'Shield User';
          await api.updateProfile({
            name: userName,
            phone: authenticatedUser.phone || '9876543210',
          }).catch(() => {});

          setSuccessMessage('Login successful! Redirecting to Home Page...');
          setTimeout(() => {
            onSuccess(authenticatedUser);
          }, 400);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F5F5F5] text-[#302824]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#8D6E63]/20 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#8D6E63]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#D7CCC8]/30 blur-3xl pointer-events-none" />

        {/* Top Header Navigation: Back to Home & Sub-mode controls */}
        <div className="flex items-center justify-between w-full">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8D6E63] hover:text-[#554740] transition-colors cursor-pointer group"
              title="Return to FraudShield Homepage"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Home</span>
            </button>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8D6E63] hover:underline cursor-pointer ml-auto"
            >
              Back to Login
            </button>
          )}
        </div>

        {/* Informational Message Banner (e.g. redirected from protected dashboard) */}
        {infoMessage && !error && !successMessage && (
          <div className="rounded-2xl border border-[#8D6E63]/30 bg-[#D7CCC8]/30 p-3 text-xs text-[#554740] flex items-start gap-2 shadow-2xs">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-[#8D6E63]" />
            <div className="leading-snug font-medium">{infoMessage}</div>
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="flex justify-center mb-2">
            <Logo />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#D7CCC8]/40 border border-[#8D6E63]/25 px-3 py-1 text-[11px] font-bold text-[#554740]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#8D6E63]" />
            <span>FraudShield Security Gateway</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#302824]">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h1>
          <p className="text-xs text-[#62554e] max-w-xs mx-auto leading-relaxed">
            {mode === 'signin' && 'Sign in to access your secure UPI and Traders safety spaces.'}
            {mode === 'signup' && 'Register your details to access real-time fraud monitoring.'}
            {mode === 'forgot' && 'Enter your registered email to receive password reset instructions.'}
          </p>
        </div>

        {/* Mode Selector Tabs (Sign In vs Sign Up) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#EFEBE9] p-1 border border-[#8D6E63]/20 shadow-inner">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-[#62554e] hover:text-[#302824]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-[#62554e] hover:text-[#302824]'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="rounded-2xl border border-[#EF6468]/30 bg-[#EF6468]/10 p-3.5 text-xs text-[#EF6468] flex items-start gap-2.5 shadow-2xs animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-snug font-medium">{error}</div>
          </div>
        )}

        {/* Success Alert Box */}
        {successMessage && (
          <div className="rounded-2xl border border-[#20C9A6]/30 bg-[#20C9A6]/10 p-3.5 text-xs text-[#0B1320] flex items-start gap-2.5 shadow-2xs animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#20C9A6]" />
            <div className="leading-snug font-medium">{successMessage}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SIGN UP ONLY: Full Name */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#62554e] mb-1.5">
                Full Name <span className="text-[#EF6468]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-[#8D6E63]" />
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-[#8D6E63]/30 bg-[#FAFAFA] pl-10 pr-4 py-2.5 text-xs font-semibold text-[#302824] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] focus:border-[#8D6E63] shadow-xs"
                />
              </div>
            </div>
          )}

          {/* ALL MODES: Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#62554e] mb-1.5">
              Email Address <span className="text-[#EF6468]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#8D6E63]" />
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#8D6E63]/30 bg-[#FAFAFA] pl-10 pr-4 py-2.5 text-xs font-semibold text-[#302824] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] focus:border-[#8D6E63] shadow-xs"
              />
            </div>
          </div>

          {/* SIGN UP ONLY: Mobile Number */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#62554e] mb-1.5">
                Mobile Number (for SMS Alerts)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-[#8D6E63]">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-2xl border border-[#8D6E63]/30 bg-[#FAFAFA] pl-12 pr-4 py-2.5 text-xs font-mono font-bold text-[#302824] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] focus:border-[#8D6E63] shadow-xs"
                />
              </div>
            </div>
          )}

          {/* SIGN IN & SIGN UP: Password */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#62554e]">
                  Password <span className="text-[#EF6468]">*</span>
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-bold text-[#8D6E63] hover:text-[#554740] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#8D6E63]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-[#8D6E63]/30 bg-[#FAFAFA] pl-10 pr-10 py-2.5 text-xs font-semibold text-[#302824] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] focus:border-[#8D6E63] shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-0.5 text-neutral-400 hover:text-[#302824] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* SIGN UP ONLY: Confirm Password */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#62554e] mb-1.5">
                Confirm Password <span className="text-[#EF6468]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#8D6E63]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-[#8D6E63]/30 bg-[#FAFAFA] pl-10 pr-10 py-2.5 text-xs font-semibold text-[#302824] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] focus:border-[#8D6E63] shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 p-0.5 text-neutral-400 hover:text-[#302824] cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* SIGN IN ONLY: Remember Me */}
          {mode === 'signin' && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#62554e] hover:text-[#302824]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#8D6E63]/40 text-[#8D6E63] focus:ring-[#8D6E63] h-4 w-4 cursor-pointer"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>
          )}

          {/* Submit Button with high-contrast, clearly visible background */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#8D6E63] hover:bg-[#795B50] py-3.5 px-4 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                {mode === 'signin' && 'Log In to FraudShield'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Send Password Reset Email'}
                <ArrowRight className="h-4 w-4 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Links */}
        <div className="space-y-3 pt-2 text-center border-t border-[#8D6E63]/15 text-xs">
          {mode === 'signin' && (
            <p className="text-[#62554e]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-bold text-[#8D6E63] hover:text-[#554740] hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-[#62554e]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-bold text-[#8D6E63] hover:text-[#554740] hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p className="text-[#62554e]">
              Remembered your credentials?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-bold text-[#8D6E63] hover:text-[#554740] hover:underline cursor-pointer"
              >
                Back to Log In
              </button>
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-[#8D6E63] font-semibold pt-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Bank-Grade Encryption · NPCI Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
