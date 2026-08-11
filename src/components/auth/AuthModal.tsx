import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  // Focus & Accessibility Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Populate prefilled email when modal opens or tab changes
  useEffect(() => {
    if (prefilledEmail) {
      setSignInEmail(prefilledEmail);
      setSignUpEmail(prefilledEmail);
    }
  }, [prefilledEmail, isAuthModalOpen]);

  // Handle focus trap, Esc key listener, returning focus on close, and background aria-hidden
  useEffect(() => {
    if (!isAuthModalOpen) return;

    // 1. Save previously focused element to return focus when modal closes
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // 2. Set aria-hidden="true" on background app container (#root)
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('aria-hidden', 'true');
    }

    // 3. Move focus to the first input field automatically on open
    const focusTimer = setTimeout(() => {
      const firstInput = dialogRef.current?.querySelector<HTMLInputElement>(
        authModalTab === 'signin' ? '#signin-email-input' : '#signup-email-input'
      ) || dialogRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]), button:not([disabled])'
      );

      firstInput?.focus();
    }, 50);

    // 4. Keyboard Listener for Esc key and Tab focus trapping
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        closeAuthModal();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);

      // Restore background content visibility to screen readers
      if (rootEl) {
        rootEl.removeAttribute('aria-hidden');
      }

      // Return focus to trigger button
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isAuthModalOpen, closeAuthModal]);

  // Focus first input field when tab changes inside open modal
  useEffect(() => {
    if (isAuthModalOpen) {
      const focusTimer = setTimeout(() => {
        const firstInput = dialogRef.current?.querySelector<HTMLInputElement>(
          authModalTab === 'signin' ? '#signin-email-input' : '#signup-email-input'
        );
        firstInput?.focus();
      }, 50);
      return () => clearTimeout(focusTimer);
    }
  }, [authModalTab, isAuthModalOpen]);

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

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Backdrop overlay for mouse users */}
      <div 
        className="fixed inset-0" 
        onClick={closeAuthModal} 
        aria-hidden="true" 
      />

      {/* Modal Dialog */}
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-md bg-[#0e1420] border border-[#222f43] rounded-2xl shadow-2xl overflow-hidden z-10 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header bar */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#1c283a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-base font-bold text-white tracking-tight">
                {authModalTab === 'signin' ? 'Sign In' : 'Sign Up'}
              </h3>
              <p className="text-xs text-slate-400">DevFlow Developer Intelligence Account</p>
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
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#141d2c] rounded-xl border border-[#1f2d42]" role="tablist" aria-label="Authentication Options">
            <button
              onClick={() => handleTabChange('signin')}
              role="tab"
              aria-selected={authModalTab === 'signin'}
              aria-controls="signin-tab-panel"
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
              role="tab"
              aria-selected={authModalTab === 'signup'}
              aria-controls="signup-tab-panel"
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

        {/* Tab 1: Sign In Panel */}
        {authModalTab === 'signin' && (
          <form
            id="signin-tab-panel"
            role="tabpanel"
            aria-labelledby="auth-tab-signin"
            onSubmit={handleSignInSubmit}
            className="p-6 space-y-4"
          >
            {signInError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{signInError}</span>
              </div>
            )}

            <div>
              <label htmlFor="signin-email-input" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
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
              <label htmlFor="signin-password-input" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
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

        {/* Tab 2: Sign Up Panel */}
        {authModalTab === 'signup' && (
          <form
            id="signup-tab-panel"
            role="tabpanel"
            aria-labelledby="auth-tab-signup"
            onSubmit={handleSignUpSubmit}
            className="p-6 space-y-4"
          >
            {signUpError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{signUpError}</span>
              </div>
            )}

            {signUpNotice && (
              <div role="status" className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{signUpNotice}</span>
              </div>
            )}

            <div>
              <label htmlFor="signup-email-input" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
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
                <label htmlFor="signup-password-input" className="text-xs font-mono font-medium text-slate-300">
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
              <label htmlFor="signup-confirm-password-input" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
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

        {/* Footer badge note */}
        <div className="px-6 py-3 bg-[#0a0e17] border-t border-[#182334] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Custom SHA-256 password hashing
          </span>
          <span>Supabase Cookie Sync</span>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
