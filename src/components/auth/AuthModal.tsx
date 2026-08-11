import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Shield, AlertCircle, ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

interface AuthModalProps {
  onSuccessNavigate?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccessNavigate }) => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    prefilledEmail,
    signIn,
    signUp,
  } = useAuth();

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSignInSubmitting, setIsSignInSubmitting] = useState(false);

  // Sign Up form state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpNotice, setSignUpNotice] = useState<string | null>(null);
  const [isSignUpSubmitting, setIsSignUpSubmitting] = useState(false);

  // Populate prefilled email when modal opens or tab changes
  useEffect(() => {
    if (prefilledEmail) {
      setSignInEmail(prefilledEmail);
      setSignUpEmail(prefilledEmail);
    }
  }, [prefilledEmail, isAuthModalOpen]);

  // Reset errors when switching tabs
  const handleTabChange = (tab: 'signin' | 'signup') => {
    setAuthModalTab(tab);
    setSignInError(null);
    setSignUpError(null);
    setSignUpNotice(null);
  };

  if (!isAuthModalOpen) return null;

  // Handle Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    const email = signInEmail.trim();
    const password = signInPassword;

    if (!email || !password) {
      setSignInError('Please fill in all fields.');
      return;
    }

    setIsSignInSubmitting(true);

    try {
      const res = await signIn({ email, password });
      if (res.success) {
        closeAuthModal();
        if (onSuccessNavigate) {
          onSuccessNavigate();
        }
      } else {
        // Generic security error message
        setSignInError(res.error || 'Invalid email or password');
      }
    } finally {
      setIsSignInSubmitting(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpNotice(null);

    const email = signUpEmail.trim();
    const password = signUpPassword;
    const confirmPassword = signUpConfirmPassword;

    // Client-side validations
    if (!email || !email.includes('@') || !email.includes('.')) {
      setSignUpError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setSignUpError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSignUpError('Passwords do not match.');
      return;
    }

    setIsSignUpSubmitting(true);

    try {
      const res = await signUp({ email, password, confirmPassword });

      if (res.success) {
        closeAuthModal();
        if (onSuccessNavigate) {
          onSuccessNavigate();
        }
      } else if (res.errorCode === 'email_already_registered') {
        // Requirement: Email already registered → inline message, switch to Sign In tab
        setSignUpNotice('Email is already registered. Switching to Sign In tab...');
        
        setTimeout(() => {
          setSignInEmail(email);
          setAuthModalTab('signin');
          setSignInError('Email is already registered. Please enter your password to sign in.');
          setSignUpNotice(null);
        }, 1200);
      } else {
        setSignUpError(res.error || 'Failed to create account.');
      }
    } finally {
      setIsSignUpSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0" 
        onClick={closeAuthModal} 
        aria-hidden="true" 
      />

      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-md bg-[#0e1420] border border-[#222f43] rounded-2xl shadow-2xl overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header bar */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#1c283a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">DevFlow Account</h3>
              <p className="text-xs text-slate-400">Access repository maps and intelligence</p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#182335] transition-colors"
            aria-label="Close auth dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#141d2c] rounded-xl border border-[#1f2d42]">
            <button
              onClick={() => handleTabChange('signin')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                authModalTab === 'signin'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a273b]'
              }`}
              id="auth-tab-signin"
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                authModalTab === 'signup'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a273b]'
              }`}
              id="auth-tab-signup"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Tab 1: Sign In */}
        {authModalTab === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="p-6 space-y-4">
            {signInError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{signInError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="developer@devflow.io"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#121a28] border border-[#222f43] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  id="signin-email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#121a28] border border-[#222f43] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  id="signin-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center mt-2"
              isLoading={isSignInSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        )}

        {/* Tab 2: Sign Up */}
        {authModalTab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="p-6 space-y-4">
            {signUpError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{signUpError}</span>
              </div>
            )}

            {signUpNotice && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{signUpNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="developer@devflow.io"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#121a28] border border-[#222f43] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  id="signup-email-input"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-medium text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Min 8 chars</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#121a28] border border-[#222f43] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  id="signup-password-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Confirm your password"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#121a28] border border-[#222f43] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  id="signup-confirm-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center mt-2"
              isLoading={isSignUpSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>
        )}
        
      </div>
    </div>
  );
};
