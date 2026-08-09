import React from 'react';
import { Network, CheckCircle2, Info } from 'lucide-react';

export interface ApiSurfacePanelProps {
  apiSurfaceHints: string[];
}

export const ApiSurfacePanel: React.FC<ApiSurfacePanelProps> = ({ apiSurfaceHints }) => {
  return (
    <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#1c283c] pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            API SURFACE SIGNALS
          </h3>
        </div>
        <span className="text-[10px] text-slate-500">
          {apiSurfaceHints.length} OBSERVED
        </span>
      </div>

      {apiSurfaceHints.length > 0 ? (
        <div className="space-y-2 text-xs">
          {apiSurfaceHints.map((hint, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-[#0b0f17] border border-[#1a2538] flex items-start gap-2.5 text-slate-200 hover:border-[#283852] transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{hint}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538] text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Info className="w-4 h-4" />
          <span>No specific API surface signals detected in directory structure.</span>
        </div>
      )}
    </div>
  );
};
