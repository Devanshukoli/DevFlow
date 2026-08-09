import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Progress } from '../ui/progress';
import { parseRepoUrl } from '../../utils/repo-url';

export interface AnalysisProgressProps {
  progress: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentStage: string | null;
  repositoryUrl: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  progress,
  status,
  currentStage,
  repositoryUrl,
}) => {
  const repoInfo = parseRepoUrl(repositoryUrl);
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const statusConfig = {
    queued: {
      title: 'ANALYSIS QUEUED',
      icon: <Clock className="w-5 h-5 text-amber-400 shrink-0" />,
      color: 'text-amber-400',
      border: 'border-amber-500/20 bg-amber-500/5',
      stageLabel: currentStage || 'Waiting in Queue',
    },
    running: {
      title: 'ANALYSIS IN PROGRESS',
      icon: <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30 bg-emerald-500/5',
      stageLabel: currentStage || 'Processing Repository',
    },
    completed: {
      title: 'ANALYSIS COMPLETE',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30 bg-emerald-500/5',
      stageLabel: 'All Stages Complete',
    },
    failed: {
      title: 'ANALYSIS FAILED',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      color: 'text-rose-400',
      border: 'border-rose-500/30 bg-rose-500/5',
      stageLabel: currentStage || 'Execution Error',
    },
  };

  const activeConfig = statusConfig[status] || statusConfig.queued;

  return (
    <div className={`p-6 sm:p-8 rounded-xl bg-[#101724] border ${activeConfig.border} shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300`}>
      
      {/* Subtle top glow line */}
      <div
        className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-500 ease-out"
        style={{ width: `${clampedProgress}%` }}
      />

      {/* Header Info Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#182234] border border-[#23324a]">
            {activeConfig.icon}
          </div>
          <div>
            <span className={`text-xs font-mono font-bold tracking-wider uppercase ${activeConfig.color}`}>
              {activeConfig.title}
            </span>
            <h2 className="text-xl font-bold text-white font-mono tracking-tight">
              {repoInfo.display}
            </h2>
          </div>
        </div>

        {/* Big Progress Percentage */}
        <div className="text-right">
          <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
            {clampedProgress}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={clampedProgress}
          size="lg"
          className="my-1"
        />

        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase font-semibold text-[10px]">CURRENT STAGE:</span>
            <span className="text-emerald-400 font-bold uppercase tracking-wide">
              {activeConfig.stageLabel}
            </span>
          </div>

          <span className="text-slate-500 text-[11px]">
            {clampedProgress === 100 ? 'PERSISTED' : 'AUTHORITATIVE BACKEND STATE'}
          </span>
        </div>
      </div>

    </div>
  );
};
