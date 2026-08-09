import React, { useState } from 'react';
import { PieChart, ChevronDown, ChevronUp } from 'lucide-react';

export interface ExtensionDistributionProps {
  extensionCounts: Record<string, number>;
  totalFiles: number;
}

export const ExtensionDistribution: React.FC<ExtensionDistributionProps> = ({
  extensionCounts,
  totalFiles,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Convert Record<string, number> to sorted array
  const entries = Object.entries(extensionCounts || {})
    .map(([ext, count]) => ({
      ext: ext || 'no-extension',
      count,
    }))
    .sort((a, b) => b.count - a.count);

  if (entries.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 border-b border-[#1c283c] pb-3">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            FILE EXTENSION DISTRIBUTION
          </h3>
        </div>
        <p className="text-slate-500 text-center py-2">No file extensions recorded.</p>
      </div>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count), 1);
  const visibleEntries = showAll ? entries : entries.slice(0, 6);

  return (
    <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#1c283c] pb-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            FILE EXTENSION DISTRIBUTION
          </h3>
        </div>
        <span className="text-[10px] text-slate-500">
          {entries.length} DISTINCT EXTENSIONS
        </span>
      </div>

      <div className="space-y-3">
        {visibleEntries.map(({ ext, count }) => {
          const percentage = totalFiles > 0 ? ((count / totalFiles) * 100).toFixed(1) : '0.0';
          const widthPercent = Math.max((count / maxCount) * 100, 2);

          return (
            <div key={ext} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{ext}</span>
                <span className="text-slate-400 text-[11px]">
                  {count.toLocaleString()} files ({percentage}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[#0b0f17] border border-[#1a2538] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {entries.length > 6 && (
        <div className="pt-2 border-t border-[#1c283c] text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors inline-flex items-center gap-1"
          >
            <span>{showAll ? 'Show top 6 extensions' : `Show all ${entries.length} extensions`}</span>
            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
