import React from 'react';
import { FileCode2, Check, FileText } from 'lucide-react';

export interface ProjectFilesPanelProps {
  detectedFiles: string[];
}

export const ProjectFilesPanel: React.FC<ProjectFilesPanelProps> = ({ detectedFiles }) => {
  return (
    <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#1c283c] pb-3">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            DETECTED CONFIGURATION & PROJECT FILES
          </h3>
        </div>
        <span className="text-[10px] text-slate-500">
          {detectedFiles.length} DETECTED
        </span>
      </div>

      {detectedFiles.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          {detectedFiles.map((file) => (
            <div
              key={file}
              className="px-3 py-2 rounded-lg bg-[#0b0f17] border border-[#1a2538] flex items-center gap-2 font-bold text-emerald-300 truncate hover:border-emerald-500/40 transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{file}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538] text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" />
          <span>No standard project configuration files identified.</span>
        </div>
      )}
    </div>
  );
};
