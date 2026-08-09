import React from 'react';
import { Check, ArrowRight, Circle, X, Loader2 } from 'lucide-react';
import { EvaluatedStage } from './stages';

export interface AnalysisStageListProps {
  stages: EvaluatedStage[];
}

export const AnalysisStageList: React.FC<AnalysisStageListProps> = ({ stages }) => {
  return (
    <div className="p-5 sm:p-6 rounded-xl bg-[#101724] border border-[#1d283a] space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#1d283a] pb-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
          ANALYSIS STAGE TIMELINE
        </h3>
        <span className="text-[11px] font-mono text-slate-500">
          {stages.filter((s) => s.status === 'completed').length} / {stages.length} STAGES
        </span>
      </div>

      <div className="space-y-3 relative">
        {/* Connector vertical line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-[#1a2538] -z-0" />

        {stages.map((stage, idx) => {
          const isCompleted = stage.status === 'completed';
          const isCurrent = stage.status === 'current';
          const isFailed = stage.status === 'failed';

          return (
            <div
              key={stage.id}
              className={`relative z-10 flex items-start gap-3.5 p-2.5 rounded-lg transition-colors font-mono ${
                isCurrent
                  ? 'bg-[#162032] border border-blue-500/30'
                  : isCompleted
                  ? 'bg-[#111826]/60'
                  : isFailed
                  ? 'bg-rose-500/5 border border-rose-500/20'
                  : 'opacity-60'
              }`}
            >
              {/* Icon Container */}
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full border shrink-0 mt-0.5 transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isCurrent
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-sm shadow-blue-500/20'
                    : isFailed
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-[#141c2b] border-[#222f43] text-slate-600'
                }`}
              >
                {isCompleted && <Check className="w-4 h-4" />}
                {isCurrent && <Loader2 className="w-4 h-4 animate-spin" />}
                {isFailed && <X className="w-4 h-4" />}
                {!isCompleted && !isCurrent && !isFailed && (
                  <Circle className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Stage Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isCompleted
                        ? 'text-slate-200'
                        : isCurrent
                        ? 'text-blue-300 font-extrabold'
                        : isFailed
                        ? 'text-rose-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {stage.name}
                  </span>

                  <span className="text-[10px] text-slate-500 font-medium">
                    {stage.progressMarker}%
                  </span>
                </div>

                <p
                  className={`text-[11px] leading-relaxed mt-0.5 ${
                    isCurrent ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
