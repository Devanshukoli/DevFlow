import React, { useState, useEffect } from 'react';
import { HomePage } from './components/home/HomePage';
import { DesignSystem } from './components/DesignSystem';
import { AnalysisPage } from './components/analysis/AnalysisPage';

export default function App() {
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

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

  // Match /analysis/:jobId pattern
  const analysisMatch = currentPath.match(/^\/analysis\/([a-zA-Z0-9_-]+)/);
  const activeJobId = analysisMatch ? analysisMatch[1] : null;

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

  if (activeJobId) {
    return (
      <AnalysisPage
        jobId={activeJobId}
        onNavigateHome={() => navigateTo('/')}
      />
    );
  }

  return (
    <HomePage
      onToggleDesignSystem={() => setShowDesignSystem(true)}
      showDesignSystem={showDesignSystem}
    />
  );
}
