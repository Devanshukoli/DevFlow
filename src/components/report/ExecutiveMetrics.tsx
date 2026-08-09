import React from 'react';
import { Files, FolderTree, HardDrive, Cpu, Box } from 'lucide-react';
import { formatBytes } from './formatters';

export interface ExecutiveMetricsProps {
  fileCount: number;
  directoryCount: number;
  totalBytes: number;
  detectedAppType: string;
  detectedPackageManager: string | null;
}

export const ExecutiveMetrics: React.FC<ExecutiveMetricsProps> = ({
  fileCount,
  directoryCount,
  totalBytes,
  detectedAppType,
  detectedPackageManager,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span>EXECUTIVE METRICS</span>
        <span className="h-px bg-[#1c283c] flex-1" />
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
        {/* Metric 1: Files */}
        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] space-y-1 hover:border-[#2a3b56] transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">FILES</span>
            <Files className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {fileCount.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 block">Total repository files</span>
        </div>

        {/* Metric 2: Directories */}
        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] space-y-1 hover:border-[#2a3b56] transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">DIRECTORIES</span>
            <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {directoryCount.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 block">Subdirectory count</span>
        </div>

        {/* Metric 3: Size */}
        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] space-y-1 hover:border-[#2a3b56] transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">SOURCE SIZE</span>
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {formatBytes(totalBytes)}
          </p>
          <span className="text-[10px] text-slate-500 block">{totalBytes.toLocaleString()} bytes</span>
        </div>

        {/* Metric 4: App Type */}
        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] space-y-1 hover:border-[#2a3b56] transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">APP TYPE</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-base font-bold text-emerald-300 capitalize truncate tracking-tight pt-1">
            {detectedAppType}
          </p>
          <span className="text-[10px] text-slate-500 block">Structure classification</span>
        </div>

        {/* Metric 5: Package Manager */}
        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] space-y-1 hover:border-[#2a3b56] transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">PACKAGE MGR</span>
            <Box className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-white uppercase tracking-tight">
            {detectedPackageManager || 'N/A'}
          </p>
          <span className="text-[10px] text-slate-500 block">Dependency manager</span>
        </div>
      </div>
    </div>
  );
};
