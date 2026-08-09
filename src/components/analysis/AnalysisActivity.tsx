import React from 'react';
import { Terminal, Activity } from 'lucide-react';
import { getStageDescription } from './stages';

export interface AnalysisActivityProps {
  currentStage: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
}

export const AnalysisActivity: React.FC<AnalysisActivityProps> = ({
  currentStage,
  status,
  progress,
}) => {
  const description = getStageDescription(currentStage, status);

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-[#101724] border border-[#1d283a] space-y-3.5 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#1d283a] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            CURRENT OPERATION
          </h3>
        </div>

        {status === 'running' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>ACTIVE</span>
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538] space-y-2 font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold text-white tracking-wide uppercase">
            {currentStage || (status === 'queued' ? 'Queued' : 'Processing')}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans pl-6">
          {description}
        </p>

        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-[#141c2b]">
          <span>EXECUTION STAGE: {currentStage || status}</span>
          <span>PROGRESS: {progress}%</span>
        </div>
      </div>
    </div>
  );
};
