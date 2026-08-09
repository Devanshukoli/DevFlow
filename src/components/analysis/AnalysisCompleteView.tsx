import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Code2, Layers, Cpu, FileCode2, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { AnalysisResult } from '@devflow/shared';

export interface AnalysisCompleteViewProps {
  jobId: string;
  onNavigateHome: () => void;
}

export const AnalysisCompleteView: React.FC<AnalysisCompleteViewProps> = ({
  jobId,
  onNavigateHome,
}) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/analysis/${jobId}/result`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.ok) {
            setResult(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch analysis result:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchResult();
    return () => {
      isMounted = false;
    };
  }, [jobId]);

  return (
    <div className="p-6 sm:p-8 rounded-xl bg-[#101724] border border-emerald-500/40 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1d283a] pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
                ANALYSIS COMPLETE
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                100%
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white font-mono tracking-tight mt-0.5">
              Repository Intelligence Ready
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={onNavigateHome}
          >
            Analyze Another Repo
          </Button>

          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => setShowJson(!showJson)}
          >
            {showJson ? 'Hide Report Preview' : 'View Repository Report'}
          </Button>
        </div>
      </div>

      {/* Intelligence Highlights Summary */}
      {isLoading ? (
        <div className="py-8 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading computed repository intelligence...
        </div>
      ) : result ? (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538] font-mono space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">SUMMARY</span>
            <p className="text-sm font-semibold text-emerald-300 font-sans leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-[#141c2b] border border-[#222f43]">
              <span className="text-slate-500 text-[10px] block uppercase font-bold">App Type</span>
              <span className="text-white font-bold text-sm block mt-1 capitalize">
                {result.detectedAppType}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#141c2b] border border-[#222f43]">
              <span className="text-slate-500 text-[10px] block uppercase font-bold">File Count</span>
              <span className="text-white font-bold text-sm block mt-1">
                {result.fileCount.toLocaleString()} files
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#141c2b] border border-[#222f43]">
              <span className="text-slate-500 text-[10px] block uppercase font-bold">Total Bytes</span>
              <span className="text-white font-bold text-sm block mt-1">
                {(result.totalBytes / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#141c2b] border border-[#222f43]">
              <span className="text-slate-500 text-[10px] block uppercase font-bold">Package Manager</span>
              <span className="text-white font-bold text-sm block mt-1 uppercase">
                {result.detectedPackageManager || 'N/A'}
              </span>
            </div>
          </div>

          {/* Languages & Frameworks Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538] space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                DETECTED LANGUAGES
              </span>
              <div className="flex flex-wrap gap-2">
                {result.detectedLanguages.map((lang) => (
                  <span
                    key={lang.name}
                    className="px-2.5 py-1 rounded-md bg-[#162032] border border-[#23324a] text-slate-200 font-mono text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Code2 className="w-3 h-3 text-emerald-400" />
                    <span>{lang.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({lang.confidence})
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#0b0f17] border border-[#1a2538] space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                DETECTED FRAMEWORKS
              </span>
              <div className="flex flex-wrap gap-2">
                {result.detectedFrameworks.length > 0 ? (
                  result.detectedFrameworks.map((fw) => (
                    <span
                      key={fw.name}
                      className="px-2.5 py-1 rounded-md bg-[#162032] border border-[#23324a] text-blue-300 font-mono text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Layers className="w-3 h-3 text-blue-400" />
                      <span>{fw.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 font-mono">None detected</span>
                )}
              </div>
            </div>
          </div>

          {/* JSON Report Details Toggle */}
          {showJson && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>COMPUTED INTELLIGENCE DATASET (RAW JSON)</span>
                <span className="text-[10px] text-slate-500">ID: {result.id}</span>
              </div>
              <pre className="p-4 rounded-lg bg-[#070a10] border border-[#182335] text-xs font-mono text-emerald-400 overflow-x-auto max-h-80 leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
