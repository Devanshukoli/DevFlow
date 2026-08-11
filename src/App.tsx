import React, { useState, useEffect } from 'react';
import { HomePage } from './components/home/HomePage';
import { DesignSystem } from './components/DesignSystem';
import { AnalysisPage } from './components/analysis/AnalysisPage';
import { RepositoryReportPage } from './components/report/RepositoryReportPage';
import { NewAnalysisPage } from './components/analysis/NewAnalysisPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';

function MainRouter() {
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Route matches
  const reportMatch = currentPath.match(/^\/analysis\/([a-zA-Z0-9_-]+)\/result$/);
  const analysisMatch = currentPath.match(/^\/analysis\/([a-zA-Z0-9_-]+)$/);
  const isDashboardRoute = currentPath === '/dashboard';
  const isSettingsRoute = currentPath === '/settings';
  const isNewAnalysisRoute = currentPath === '/new-analysis' || currentPath === '/analyze';

  // Handle protected routes redirection
  useEffect(() => {
    if (!isLoading) {
      if ((isDashboardRoute || isSettingsRoute) && !isAuthenticated) {
        navigateTo('/');
        openAuthModal('signin');
      }
    }
  }, [currentPath, isAuthenticated, isLoading, isDashboardRoute, isSettingsRoute]);

  const renderCurrentView = () => {
    if (showDesignSystem) {
      return (
        <div>
          <div className="bg-[#111722] border-b border-[#222f43] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold">DEVFLOW DESIGN SYSTEM SHOWCASE</span>
            <button
              onClick={() => setShowDesignSystem(false)}
              className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
            >
              ← Back to Homepage
            </button>
          </div>
          <DesignSystem />
        </div>
      );
    }

    if (isDashboardRoute) {
      if (!isAuthenticated) return null;
      return (
        <DashboardPage
          onNavigateHome={() => navigateTo('/dashboard')}
          onNavigateToSettings={() => navigateTo('/settings')}
          onNavigateToNewAnalysis={() => navigateTo('/new-analysis')}
        />
      );
    }

    if (isSettingsRoute) {
      if (!isAuthenticated) return null;
      return (
        <SettingsPage
          onNavigateHome={() => navigateTo(isAuthenticated ? '/dashboard' : '/')}
          onNavigateToDashboard={() => navigateTo('/dashboard')}
        />
      );
    }

    if (isNewAnalysisRoute) {
      return (
        <NewAnalysisPage
          onNavigateToDashboard={() => navigateTo('/dashboard')}
          onNavigateToSettings={() => navigateTo('/settings')}
        />
      );
    }

    if (reportMatch) {
      const reportJobId = reportMatch[1];
      return (
        <RepositoryReportPage
          jobId={reportJobId}
          onNavigateBack={() => navigateTo(`/analysis/${reportJobId}`)}
          onNavigateHome={() => navigateTo(isAuthenticated ? '/dashboard' : '/')}
        />
      );
    }

    if (analysisMatch) {
      const activeJobId = analysisMatch[1];
      return (
        <AnalysisPage
          jobId={activeJobId}
          onNavigateHome={() => navigateTo(isAuthenticated ? '/dashboard' : '/')}
          onViewReport={() => navigateTo(`/analysis/${activeJobId}/result`)}
        />
      );
    }

    return (
      <HomePage
        onToggleDesignSystem={() => setShowDesignSystem(true)}
        showDesignSystem={showDesignSystem}
        onNavigateToDashboard={() => navigateTo('/dashboard')}
        onNavigateToSettings={() => navigateTo('/settings')}
      />
    );
  };

  return (
    <>
      {renderCurrentView()}
      <AuthModal onSuccessNavigate={() => navigateTo('/dashboard')} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
