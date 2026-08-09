import React from 'react';
import { Terminal, Cpu, FileCode2, HardDrive, Package } from 'lucide-react';
import { parseRepoUrl } from '../../utils/repo-url';
import { formatBytes } from './formatters';

export interface ReportHeroProps {
  repositoryUrl: string;
  summary: string;
  detectedAppType: string;
  fileCount: number;
  totalBytes: number;
  detectedPackageManager: string | null;
}

export const ReportHero: React.FC<ReportHeroProps> = ({
  repositoryUrl,
  summary,
  detectedAppType,
  fileCount,
  totalBytes,
  detectedPackageManager,
}) => {
  const parsedRepo = parseRepoUrl(repositoryUrl);

  return (
    <section className="p-6 sm:p-8 rounded-xl bg-[#101724] border border-[#1d2a3f] space-y-6 shadow-xl relative overflow-hidden">
      
      {/* Decorative subtle grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Eyebrow & Repository Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Terminal className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              AUTHORITATIVE INTELLIGENCE REPORT
            </span>
          </div>

          <div className="px-3 py-1 rounded-full bg-[#162032] border border-[#23324a] font-mono text-xs text-slate-300">
            Job Id Verified
          </div>
        </div>

        {/* Repository Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
          {parsedRepo.display}
        </h2>

        {/* Concise Summary Banner */}
        <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1c283c] font-mono space-y-1.5">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
            DEVFLOW FACTUAL SUMMARY
          </span>
          <p className="text-base font-semibold text-slate-100 font-sans leading-relaxed">
            "{summary}"
          </p>
        </div>

        {/* Highlight Metadata Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#141c2b] border border-[#222f43] font-mono text-xs flex items-center gap-2 text-slate-200">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">TYPE:</span>
            <span className="font-bold text-white capitalize">{detectedAppType}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#141c2b] border border-[#222f43] font-mono text-xs flex items-center gap-2 text-slate-200">
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">FILES:</span>
            <span className="font-bold text-white">{fileCount.toLocaleString()}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#141c2b] border border-[#222f43] font-mono text-xs flex items-center gap-2 text-slate-200">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">SIZE:</span>
            <span className="font-bold text-white">{formatBytes(totalBytes)}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#141c2b] border border-[#222f43] font-mono text-xs flex items-center gap-2 text-slate-200">
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">PACKAGE MGR:</span>
            <span className="font-bold text-white uppercase">{detectedPackageManager || 'N/A'}</span>
          </div>
        </div>

      </div>

    </section>
  );
};
