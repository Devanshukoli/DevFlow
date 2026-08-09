import React from 'react';
import { Code2, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { DetectedLanguage } from '@devflow/shared';

export interface LanguagesPanelProps {
  detectedLanguages: DetectedLanguage[];
}

export const LanguagesPanel: React.FC<LanguagesPanelProps> = ({ detectedLanguages }) => {
  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            HIGH CONFIDENCE
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <Shield className="w-3 h-3" />
            MEDIUM CONFIDENCE
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            LOW CONFIDENCE
          </span>
        );
    }
  };

  return (
    <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-4">
      <div className="flex items-center justify-between border-b border-[#1c283c] pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            DOMINANT LANGUAGES
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {detectedLanguages.length} DETECTED
        </span>
      </div>

      {detectedLanguages.length > 0 ? (
        <div className="space-y-2.5 font-mono text-xs">
          {detectedLanguages.map((lang) => (
            <div
              key={lang.name}
              className="p-3 rounded-lg bg-[#0b0f17] border border-[#1a2538] flex items-center justify-between gap-3 hover:border-[#283852] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-white text-sm">{lang.name}</span>
                {lang.fileCount !== undefined && lang.fileCount > 0 && (
                  <span className="text-[10px] text-slate-500">
                    ({lang.fileCount} {lang.fileCount === 1 ? 'file' : 'files'})
                  </span>
                )}
              </div>

              <div>{getConfidenceBadge(lang.confidence)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538] text-center font-mono text-xs text-slate-500">
          No programming languages explicitly identified in filesystem inspection.
        </div>
      )}
    </div>
  );
};
