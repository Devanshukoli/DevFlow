import React from 'react';
import { ArrowLeft, ExternalLink, GitFork, ShieldCheck, Home } from 'lucide-react';
import { parseRepoUrl } from '../../utils/repo-url';
import { isValidGitHubUrl } from './formatters';
import { UserMenu } from '../auth/UserMenu';
import { ThemeToggle } from '../ui/ThemeToggle';

export interface ReportHeaderProps {
  repositoryUrl: string;
  jobId: string;
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  repositoryUrl,
  jobId,
  onNavigateBack,
  onNavigateHome,
}) => {
  const parsedRepo = parseRepoUrl(repositoryUrl);
  const isGithubUrl = isValidGitHubUrl(repositoryUrl);

  return (
    <header className="bg-[#0e1420] border-b border-[#1c2738] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left Side: Branding & Repo Info */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-lg bg-[#162032] border border-[#23324a] text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 transition-colors shrink-0"
            title="DevFlow Home"
            aria-label="DevFlow Home"
          >
            <GitFork className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
                DEVFLOW
              </span>
              <span className="text-slate-600 font-mono text-xs">•</span>
              <span className="text-xs font-mono text-slate-400 font-semibold tracking-wide uppercase">
                REPOSITORY INTELLIGENCE REPORT
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <h1 className="text-lg font-extrabold text-white font-mono tracking-tight">
                {parsedRepo.display}
              </h1>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                <ShieldCheck className="w-3 h-3" />
                PUBLIC REPOSITORY
              </span>

              {isGithubUrl && (
                <a
                  href={repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors ml-1"
                  title="View on GitHub"
                >
                  <span className="truncate max-w-[200px] sm:max-w-xs">{repositoryUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Navigation Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            onClick={onNavigateHome}
            className="px-3 py-1.5 rounded-lg bg-[#141c2b] hover:bg-[#1a2538] border border-[#222f43] text-slate-300 hover:text-white text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            onClick={onNavigateBack}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Analysis</span>
          </button>

          <ThemeToggle />

          <UserMenu
            onNavigateToDashboard={() => {
              window.history.pushState({}, '', '/dashboard');
              window.dispatchEvent(new Event('popstate'));
            }}
            onNavigateToSettings={() => {
              window.history.pushState({}, '', '/settings');
              window.dispatchEvent(new Event('popstate'));
            }}
          />
        </div>

      </div>
    </header>
  );
};

