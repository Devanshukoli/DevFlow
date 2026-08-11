import React from 'react';
import { GitFork, Layers, ArrowLeft, Sparkles, Code2, ShieldCheck, Github } from 'lucide-react';
import { Badge } from '../ui/badge';
import { RepositoryInput } from '../home/repository-input';
import { UserMenu } from '../auth/UserMenu';
import { useAuth } from '../../context/AuthContext';

export interface NewAnalysisPageProps {
  onNavigateToDashboard?: () => void;
  onNavigateToSettings?: () => void;
}

export const NewAnalysisPage: React.FC<NewAnalysisPageProps> = ({
  onNavigateToDashboard,
  onNavigateToSettings,
}) => {
  const { isAuthenticated } = useAuth();

  const handleBack = () => {
    if (isAuthenticated) {
      if (onNavigateToDashboard) {
        onNavigateToDashboard();
      } else {
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new Event('popstate'));
      }
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0f17]/80 backdrop-blur-md border-b border-[#222f43]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg bg-[#121927] border border-[#202c3e] hover:border-emerald-500/50 text-slate-400 hover:text-white transition-all"
              aria-label="Go back"
              title={isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleBack}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight font-sans">DevFlow</span>
                <Badge variant="success" size="sm" isMonospace>
                  New Analysis
                </Badge>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={handleBack}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-[#121927] border border-[#202c3e] hover:border-emerald-500/40 transition-all"
              >
                <span>Dashboard</span>
              </button>
            )}
            <UserMenu
              onNavigateToDashboard={onNavigateToDashboard}
              onNavigateToSettings={onNavigateToSettings}
            />
          </div>
        </div>
      </header>

      {/* Main Container - Centered Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-3xl mx-auto space-y-8 text-center py-8">
          
          {/* Badge & Icon Hero Header */}
          <div className="space-y-4 flex flex-col items-center">
            <div className="relative p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-xl shadow-emerald-500/5 animate-in fade-in zoom-in-95 duration-200">
              <GitFork className="w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121a28] border border-[#202e44] text-xs font-mono text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>SINGLE-PAGE REPOSITORY SCANNER</span>
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Analyze GitHub Repository
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                Paste any public GitHub repository link below to generate real-time dependency graphs, architectural insights, and code health metrics.
              </p>
            </div>
          </div>

          {/* Centered Input Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0e1420] border border-[#1f2d42] shadow-2xl space-y-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-[#1c2738] pb-4">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Target Repository URL
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cloud Sandboxed</span>
              </div>
            </div>

            {/* The Repository Input Form */}
            <RepositoryInput />
          </div>

          {/* Helper / Info Cards below input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-4 rounded-xl bg-[#0e1420]/60 border border-[#1c2738] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>AST Parsing</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Extracts typescript interfaces, imports, and component hierarchies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1420]/60 border border-[#1c2738] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                <span>Graph Mapping</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Generates interactive node-edge diagrams with FalkorDB engine.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1420]/60 border border-[#1c2738] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Intelligence</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Generates architecture summaries, health checks, and API surfaces.
              </p>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
};
