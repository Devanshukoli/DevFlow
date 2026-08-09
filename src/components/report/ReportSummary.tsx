import React from 'react';
import { Terminal } from 'lucide-react';

export interface ReportSummaryProps {
  summary: string;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({ summary }) => {
  return (
    <div className="p-6 rounded-xl bg-[#121927] border border-[#202c40] space-y-3 font-mono">
      <div className="flex items-center gap-2 border-b border-[#1c283c] pb-3">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          DEVFLOW EXECUTIVE SUMMARY
        </h3>
      </div>

      <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538]">
        <p className="text-sm font-semibold text-emerald-300 font-sans leading-relaxed">
          {summary}
        </p>
      </div>

      <span className="text-[10px] text-slate-500 block">
        Note: Summary is generated deterministically from workspace directory inspection. No external LLM calls or RAG pipelines were used.
      </span>
    </div>
  );
};
