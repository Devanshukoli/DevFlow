import React from 'react';
import { TerminalLine } from '../devflow/terminal-line';
import { EvaluatedStage } from './stages';

export interface AnalysisTerminalProps {
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentStage: string | null;
  createdAt?: string;
  evaluatedStages: EvaluatedStage[];
  isRetrying?: boolean;
}

export const AnalysisTerminal: React.FC<AnalysisTerminalProps> = ({
  status,
  evaluatedStages,
  isRetrying = false,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-xl bg-[#0a0e17] border border-[#1d283a] space-y-4 font-mono shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1d283a] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 ml-2">
            TECHNICAL ACTIVITY PANEL
          </h3>
        </div>

        {isRetrying && (
          <span className="text-[10px] text-amber-400 font-bold animate-pulse">
            CONNECTION INTERRUPTED • RETRYING...
          </span>
        )}
      </div>

      <div className="space-y-1 bg-[#070a10] p-3 rounded-lg border border-[#162032] overflow-x-auto max-h-[360px]">
        {/* Step 1: Job created */}
        <TerminalLine
          status="success"
          text="Analysis job registered in DevFlow Supabase backend"
          duration="ok"
        />

        {status === 'queued' ? (
          <TerminalLine
            status="active"
            text="Waiting in queue for worker process allocation..."
          />
        ) : (
          <TerminalLine
            status="success"
            text="Worker process claimed job from queue"
            duration="ok"
          />
        )}

        {/* Dynamic observed stages */}
        {evaluatedStages.map((stage) => {
          if (stage.status === 'completed') {
            return (
              <TerminalLine
                key={stage.id}
                status="success"
                text={`Stage complete: ${stage.name}`}
                duration="done"
              />
            );
          } else if (stage.status === 'current') {
            return (
              <TerminalLine
                key={stage.id}
                status="active"
                text={`Executing stage: ${stage.name}...`}
              />
            );
          } else if (stage.status === 'failed') {
            return (
              <TerminalLine
                key={stage.id}
                status="error"
                text={`Stage execution failed: ${stage.name}`}
              />
            );
          } else {
            return (
              <TerminalLine
                key={stage.id}
                status="pending"
                text={`Pending: ${stage.name}`}
              />
            );
          }
        })}

        {status === 'completed' && (
          <TerminalLine
            status="success"
            text="Analysis lifecycle finalized. Result dataset available."
            duration="100%"
          />
        )}

        {status === 'failed' && (
          <TerminalLine
            status="error"
            text="Worker pipeline terminated due to execution failure."
          />
        )}
      </div>
    </div>
  );
};
