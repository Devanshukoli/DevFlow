import React from 'react';
import { ArrowLeft, GitFork, Shield } from 'lucide-react';
import { StatusIndicator, StatusType } from '../ui/status-indicator';
import { TechnicalLabel } from '../devflow/technical-label';
import { parseRepoUrl } from '../../utils/repo-url';
import { UserMenu } from '../auth/UserMenu';

export interface AnalysisHeaderProps {
  repositoryUrl: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  onNavigateHome: () => void;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({
  repositoryUrl,
  status,
  onNavigateHome,
}) => {
  const repoInfo = parseRepoUrl(repositoryUrl);

  const statusMap: Record<string, StatusType> = {
    queued: 'idle',
    running: 'running',
    completed: 'completed',
    failed: 'failed',
  };

  const statusType = statusMap[status] || 'idle';

  return (
    <header className="border-b border-[#1d283a] bg-[#0d121c]/90 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left: Brand & Back Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center justify-center p-2 rounded-lg bg-[#141c2b] border border-[#222f43] text-slate-400 hover:text-white hover:bg-[#1a2538] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            aria-label="Return to DevFlow Homepage"
            title="Return to Homepage"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-wider text-white font-mono">DEVFLOW</span>
              <span className="text-[#222f43]">•</span>
              <TechnicalLabel colorVariant="emerald">REPOSITORY ANALYSIS</TechnicalLabel>
            </div>
            
            <div className="flex items-center gap-2 mt-0.5">
              <GitFork className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <h1 className="text-base sm:text-lg font-bold text-slate-100 font-mono tracking-tight">
                {repoInfo.display}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Badges & Status */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141c2b] border border-[#222f43] text-[11px] font-mono text-slate-400">
            <Shield className="w-3 h-3 text-slate-500" />
            <span>PUBLIC REPOSITORY</span>
          </div>

          <StatusIndicator status={statusType} size="md" />

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
