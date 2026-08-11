import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AuthResponse, SignInRequest, SignUpRequest } from '@devflow/shared';
import { getApiUrl } from '../utils/api';
import {
  getGuestPendingAnalysis,
  clearGuestPendingAnalysis,
  claimGuestAnalysis,
  GuestPendingAnalysis,
} from '../utils/guestAnalysis';
import { SaveAnalysisModal } from '../components/auth/SaveAnalysisModal';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'signup';
  prefilledEmail: string;
  confirmedAnalysisToClaim: GuestPendingAnalysis | null;
  signIn: (credentials: SignInRequest) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  signUp: (data: SignUpRequest) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  signOut: () => Promise<void>;
  openAuthModal: (tab?: 'signin' | 'signup', prefilledEmail?: string) => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: 'signin' | 'signup') => void;
}

const AUTH_STORAGE_KEY = 'devflow_auth_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [prefilledEmail, setPrefilledEmail] = useState('');

  // Pending guest analysis state for save prompt
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<GuestPendingAnalysis | null>(null);
  const [confirmedAnalysisToClaim, setConfirmedAnalysisToClaim] = useState<GuestPendingAnalysis | null>(null);
  const [targetTabAfterPrompt, setTargetTabAfterPrompt] = useState<'signin' | 'signup'>('signup');

  // Restore session from server cookie on load
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        const response = await fetch(getApiUrl('/api/auth/me'), {
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const resData: AuthResponse = await response.json();
          if (resData.ok && resData.data?.user) {
            if (isMounted) {
              setUser(resData.data.user);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resData.data.user));
            }
            return;
          }
        }
        
        // If server returned 401 or no user session
        if (isMounted) {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        // If network error, retain local state fallback
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuthSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = (tab: 'signin' | 'signup' = 'signin', email: string = '') => {
    setPrefilledEmail(email);

    // If user is not authenticated and has a pending guest analysis, prompt before sign-up/sign-in
    const guestAnalysis = getGuestPendingAnalysis();
    if (!user && guestAnalysis && !confirmedAnalysisToClaim) {
      setPendingAnalysis(guestAnalysis);
      setTargetTabAfterPrompt(tab);
      setIsSaveModalOpen(true);
      return;
    }

    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleConfirmSaveAnalysis = () => {
    setConfirmedAnalysisToClaim(pendingAnalysis);
    setIsSaveModalOpen(false);
    setPendingAnalysis(null);
    setAuthModalTab(targetTabAfterPrompt);
    setIsAuthModalOpen(true);
  };

  const handleDiscardAnalysis = () => {
    clearGuestPendingAnalysis();
    setConfirmedAnalysisToClaim(null);
    setPendingAnalysis(null);
    setIsSaveModalOpen(false);
    setAuthModalTab(targetTabAfterPrompt);
    setIsAuthModalOpen(true);
  };

  const handleCloseSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  const handleCustomSetAuthModalTab = (tab: 'signin' | 'signup') => {
    // If switching to signup tab and user has guest analysis not decided yet
    const guestAnalysis = getGuestPendingAnalysis();
    if (tab === 'signup' && !user && guestAnalysis && !confirmedAnalysisToClaim) {
      setIsAuthModalOpen(false);
      setPendingAnalysis(guestAnalysis);
      setTargetTabAfterPrompt('signup');
      setIsSaveModalOpen(true);
      return;
    }
    setAuthModalTab(tab);
  };

  const signIn = async (credentials: SignInRequest) => {
    try {
      const response = await fetch(getApiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (data.ok) {
        setUser(data.data.user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.data.user));

        // Claim analysis if confirmed
        if (confirmedAnalysisToClaim || getGuestPendingAnalysis()) {
          await claimGuestAnalysis(data.data.user.id);
          setConfirmedAnalysisToClaim(null);
        }

        return { success: true };
      } else {
        const errorCode = data.error?.code || 'invalid_credentials';
        const errorMsg = data.error?.message || 'Invalid email or password';
        return { success: false, error: errorMsg, errorCode };
      }
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signUp = async (dataInput: SignUpRequest) => {
    try {
      const response = await fetch(getApiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataInput),
      });

      const data: AuthResponse = await response.json();

      if (data.ok) {
        setUser(data.data.user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.data.user));

        // Claim analysis if confirmed
        if (confirmedAnalysisToClaim || getGuestPendingAnalysis()) {
          await claimGuestAnalysis(data.data.user.id);
          setConfirmedAnalysisToClaim(null);
        }

        return { success: true };
      } else {
        const errorCode = data.error?.code || 'SIGNUP_FAILED';
        const errorMsg = data.error?.message || 'Failed to create account.';
        return { success: false, error: errorMsg, errorCode };
      }
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signOut = async () => {
    try {
      await fetch(getApiUrl('/api/auth/signout'), { method: 'POST' });
    } catch {
      // Ignore
    } finally {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setConfirmedAnalysisToClaim(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isAuthModalOpen,
        authModalTab,
        prefilledEmail,
        confirmedAnalysisToClaim,
        signIn,
        signUp,
        signOut,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab: handleCustomSetAuthModalTab,
      }}
    >
      {children}
      <SaveAnalysisModal
        isOpen={isSaveModalOpen}
        analysis={pendingAnalysis}
        onConfirmSave={handleConfirmSaveAnalysis}
        onDiscard={handleDiscardAnalysis}
        onClose={handleCloseSaveModal}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
