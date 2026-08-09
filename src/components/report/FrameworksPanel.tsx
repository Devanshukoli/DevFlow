import React from 'react';
import { Layers, ShieldCheck, Shield, CheckCircle2 } from 'lucide-react';
import { DetectedFramework } from '@devflow/shared';

export interface FrameworksPanelProps {
  detectedFrameworks: DetectedFramework[];
}

export const FrameworksPanel: React.FC<FrameworksPanelProps> = ({ detectedFrameworks }) => {
  return (
    <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-4">
      <div className="flex items-center justify-between border-b border-[#1c283c] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            DETECTED FRAMEWORKS
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {detectedFrameworks.length} FOUND
        </span>
      </div>

      {detectedFrameworks.length > 0 ? (
        <div className="space-y-2.5 font-mono text-xs">
          {detectedFrameworks.map((fw) => (
            <div
              key={fw.name}
              className="p-3 rounded-lg bg-[#0b0f17] border border-[#1a2538] flex items-center justify-between gap-3 hover:border-[#283852] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded bg-blue-500/10 text-blue-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-bold text-white text-sm block">{fw.name}</span>
                  {fw.category && (
                    <span className="text-[10px] text-slate-500 uppercase">{fw.category}</span>
                  )}
                </div>
              </div>

              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-mono font-bold uppercase">
                {fw.confidence.toUpperCase()} CONFIDENCE
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538] text-center font-mono text-xs text-slate-400">
          <span className="font-bold text-slate-300 block mb-1">No frameworks detected</span>
          <span className="text-[11px] text-slate-500">
            This repository may be a standard package, library, native application, or un-frameworked code.
          </span>
        </div>
      )}
    </div>
  );
};
