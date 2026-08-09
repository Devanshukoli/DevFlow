import React, { useState, useMemo } from 'react';
import {
  AnalysisResult,
  EngineeringHealth,
  HealthDimension,
  RiskFinding,
  HealthSignal
} from '@devflow/shared';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  FileCode,
  Gauge,
  Activity,
  Heart
} from 'lucide-react';

export interface EngineeringHealthTabProps {
  result: AnalysisResult;
}

export const EngineeringHealthTab: React.FC<EngineeringHealthTabProps> = ({ result }) => {
  const [showCalculationHelp, setShowCalculationHelp] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL_HIGH' | 'MEDIUM_LOW'>('ALL');
  const [activeDimension, setActiveDimension] = useState<string | null>(null);

  // Fallback to empty default structure if undefined
  const healthData = useMemo<EngineeringHealth>(() => {
    return result.engineeringHealth || {
      score: 100,
      dimensions: [],
      findings: [],
      positiveSignals: [],
      metrics: {
        testFileCount: 0,
        testDirectoryCount: 0,
        detectedTestingFrameworks: [],
        largeSourceFilesCount: 0,
        hasEnvFiles: false,
        hasPrivateKeys: false
      }
    };
  }, [result.engineeringHealth]);

  const { score, dimensions, findings, positiveSignals, metrics } = healthData;

  // Filter findings
  const filteredFindings = useMemo(() => {
    return findings.filter((finding: RiskFinding) => {
      if (severityFilter === 'ALL') return true;
      if (severityFilter === 'CRITICAL_HIGH') {
        return finding.severity === 'critical' || finding.severity === 'high';
      }
      if (severityFilter === 'MEDIUM_LOW') {
        return finding.severity === 'medium' || finding.severity === 'low';
      }
      return true;
    });
  }, [findings, severityFilter]);

  // Color mapping helpers
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-emerald-400';
    if (s >= 70) return 'text-cyan-400';
    if (s >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (s: number) => {
    if (s >= 90) return 'bg-emerald-500/10 border-emerald-500/30';
    if (s >= 70) return 'bg-cyan-500/10 border-cyan-500/30';
    if (s >= 50) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-rose-500/10 border-rose-500/30';
  };

  const getScoreRating = (s: number) => {
    if (s >= 90) return 'EXCELLENT';
    if (s >= 70) return 'GOOD';
    if (s >= 50) return 'MODERATE';
    return 'CRITICAL';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          badge: 'bg-rose-950 text-rose-400 border border-rose-500/40',
          accentBorder: 'border-l-4 border-l-rose-500'
        };
      case 'high':
        return {
          bg: 'bg-rose-500/5 border-rose-500/20 text-rose-300',
          badge: 'bg-rose-950/50 text-rose-300 border border-rose-500/20',
          accentBorder: 'border-l-4 border-l-rose-400'
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/5 border-amber-500/20 text-amber-300',
          badge: 'bg-amber-950/50 text-amber-300 border border-amber-500/20',
          accentBorder: 'border-l-4 border-l-amber-500'
        };
      case 'low':
      case 'info':
      default:
        return {
          bg: 'bg-slate-500/5 border-slate-500/20 text-slate-300',
          badge: 'bg-slate-800 text-slate-300 border border-slate-700',
          accentBorder: 'border-l-4 border-l-slate-400'
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'testing':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileCode className="w-4 h-4 text-blue-400" />;
    }
  };

  // Radial Ring Percentage Math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getDimensionWeight = (name: string): number => {
    switch (name) {
      case 'Testing':
        return 0.20;
      case 'Architecture Structure':
        return 0.15;
      case 'Dependency Hygiene':
        return 0.15;
      case 'Repository Hygiene':
        return 0.15;
      case 'Configuration/Security Hygiene':
        return 0.15;
      case 'Maintainability Metrics':
        return 0.10;
      case 'API Surface Soundness':
        return 0.05;
      case 'Project Structure Alignment':
        return 0.05;
      default:
        return 0.10;
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* 1. Header & High Level Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Radial Score Gauge Panel (Left 5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-[#121927] border border-[#202c40] flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ENGINEERING HEALTH SCORE</span>
          
          <div className="relative flex items-center justify-center w-40 h-40">
            {/* SVG Ring Meter */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-[#162136]"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Foreground circle indicator */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className={`transition-all duration-1000 ease-out ${
                  score >= 90 ? 'stroke-emerald-400' : score >= 70 ? 'stroke-cyan-400' : score >= 50 ? 'stroke-amber-400' : 'stroke-rose-400'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            
            {/* Center Text Labels */}
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white">{score}</span>
              <span className="text-[9px] text-slate-500">MAX 100</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getScoreBg(score)}`}>
            STATUS: <span className={getScoreColor(score)}>{getScoreRating(score)}</span>
          </div>

          <p className="text-xs text-slate-400 max-w-sm font-sans text-center leading-relaxed">
            Factual code health score calculated deterministically based on security hygiene, code maintainability, and testing infrastructure.
          </p>
        </div>

        {/* 8 Dimensional Breakdowns (Right 7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#121927] border border-[#202c40] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ANALYZED DIMENSIONS</span>
            <span className="text-[10px] text-slate-500">WEIGHTED VALUES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dimensions.map((dim: HealthDimension) => {
              const percentage = (dim.score / dim.maxScore) * 100;
              const barColor = percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-cyan-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500';
              const dimWeight = getDimensionWeight(dim.name);
              
              return (
                <div
                  key={dim.name}
                  className="p-3 rounded-lg bg-[#0e1422] border border-[#1b263b] space-y-2 cursor-pointer hover:border-[#3b5278] transition-colors"
                  onClick={() => setActiveDimension(activeDimension === dim.name ? null : dim.name)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{dim.name}</span>
                    <span className="text-slate-400 font-extrabold">{dim.score}/{dim.maxScore}</span>
                  </div>
                  
                  {/* Progress Line Bar */}
                  <div className="w-full h-1.5 bg-[#172237] rounded-full overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }} />
                  </div>

                  {/* Expanded Description or Weight */}
                  {activeDimension === dim.name ? (
                    <div className="pt-2 text-[10px] text-slate-400 leading-relaxed font-sans border-t border-[#172237] mt-1">
                      {dim.description}
                      <div className="mt-1.5 text-slate-500 font-mono">
                        Weight in final calculation: <span className="text-slate-300 font-bold">{Math.round(dimWeight * 100)}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-sans">
                      <span>Click to view rules</span>
                      <span>Weight: {Math.round(dimWeight * 100)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Interactive Score Explanation Accordion */}
      <div className="p-4 rounded-xl bg-[#101724] border border-[#1d2a3f]">
        <button
          onClick={() => setShowCalculationHelp(!showCalculationHelp)}
          className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider">How is this health score calculated?</span>
          </div>
          {showCalculationHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCalculationHelp && (
          <div className="mt-4 pt-4 border-t border-[#1a263d] text-xs space-y-4 text-slate-400 font-sans leading-relaxed">
            <p>
              The final score <span className="font-mono text-white font-bold">{score}/100</span> is a deterministic aggregation of performance across 8 key dimensions. Rather than simple averages, DevFlow uses structured rules:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-slate-300 text-[11px]">
              <div className="space-y-1 bg-[#0b0f17] p-3 rounded-lg border border-[#162136]">
                <span className="text-emerald-400 font-bold">✓ DIMENSIONAL ALLOTMENTS (Max 100)</span>
                <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-400 mt-1">
                  <li>Testing (Max 20 pts)</li>
                  <li>Architecture Structure (Max 15 pts)</li>
                  <li>Dependency Hygiene (Max 15 pts)</li>
                  <li>Repository Hygiene (Max 15 pts)</li>
                  <li>Configuration/Security Hygiene (Max 15 pts)</li>
                  <li>Maintainability Metrics (Max 10 pts)</li>
                  <li>API Surface Soundness (Max 5 pts)</li>
                  <li>Project Structure Alignment (Max 5 pts)</li>
                </ul>
              </div>

              <div className="space-y-1 bg-[#0b0f17] p-3 rounded-lg border border-[#162136]">
                <span className="text-rose-400 font-bold">✗ FINDINGS & DEDUCTION FORMULA</span>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  Each finding detected has a negative score impact (e.g. <span className="text-rose-400">-12 for missing tests</span>) that directly reduces the score of its corresponding dimension down to a floor of 0.
                </p>
                <div className="p-2 bg-[#121927] border border-[#202c40] rounded text-[10px] text-slate-300 mt-2 font-mono">
                  Dimension Score = Max(0, BaseScore - sum(FindingsImpact))
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              *Note: Factual indicators such as the absence of web routing structures in a dedicated Command Line Interface (CLI) repository will NOT penalize the API Soundness score. Rules adapt automatically to the repo type.
            </p>
          </div>
        )}
      </div>

      {/* 3. Metrics Overview Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">TEST FILES</span>
          <div className="mt-1 text-2xl font-black text-white">{metrics.testFileCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">TESTING FRAMEWORKS</span>
          <div className="mt-1 text-sm font-black text-white truncate max-w-full px-2">
            {metrics.detectedTestingFrameworks.length > 0 ? metrics.detectedTestingFrameworks.join(', ') : 'None'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">LARGE SOURCE FILES</span>
          <div className="mt-1 text-2xl font-black text-white">{metrics.largeSourceFilesCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121927] border border-[#202c40] text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">SECURITY ISSUES</span>
          <div className="mt-1 text-2xl font-black text-rose-400">
            {(metrics.hasEnvFiles ? 1 : 0) + (metrics.hasPrivateKeys ? 1 : 0)}
          </div>
        </div>
      </div>

      {/* 4. Main Tabulated Findings Section */}
      <div className="space-y-6">
        
        {/* Section Header with Severity filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1c2738] pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Identified Risks ({findings.length})</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Rule-based evidence flags that indicate technical debt or configuration risks.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition-all ${
                severityFilter === 'ALL'
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('CRITICAL_HIGH')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition-all ${
                severityFilter === 'CRITICAL_HIGH'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Critical/High ({findings.filter(f => f.severity === 'critical' || f.severity === 'high').length})
            </button>
            <button
              onClick={() => setSeverityFilter('MEDIUM_LOW')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition-all ${
                severityFilter === 'MEDIUM_LOW'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Medium/Low ({findings.filter(f => f.severity === 'medium' || f.severity === 'low').length})
            </button>
          </div>
        </div>

        {/* Findings List Render */}
        {filteredFindings.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#101724]/50 border border-[#1d2a3f] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Risks Identified</h4>
            <p className="text-xs text-slate-400 font-sans">
              Excellent! This repository passed all rule checks matching your active severity filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFindings.map((finding: RiskFinding) => {
              const styles = getSeverityStyles(finding.severity);
              
              return (
                <div
                  key={finding.id}
                  className={`p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-3 ${styles.accentBorder} transition-all duration-200`}
                >
                  {/* Finding Metadata Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px]">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(finding.category)}
                      <span className="font-extrabold text-slate-400 uppercase">{finding.category}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 font-mono">RULE ID: <span className="text-slate-200">{finding.id}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${styles.badge}`}>
                        SEVERITY: {finding.severity}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9px] font-extrabold uppercase">
                        IMPACT: {finding.scoreImpact}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white tracking-tight uppercase">
                      {finding.title}
                    </h4>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {finding.description}
                    </p>
                  </div>

                  {/* Factual Evidence Code/Files Box */}
                  {finding.evidence && finding.evidence.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Observable Evidence:</span>
                      <div className="bg-[#0b0f17] border border-[#1c2738] rounded-lg p-3 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto space-y-1">
                        {finding.evidence.map((ev: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-rose-500/70 font-bold select-none">•</span>
                            <span className="break-all">{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Positive Engineering Signals */}
      <div className="space-y-4">
        <div className="border-b border-[#1c2738] pb-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Positive Engineering Signals ({positiveSignals.length})</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Deterministic signals indicating healthy conventions and good configurations.
          </p>
        </div>

        {positiveSignals.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#121927]/30 border border-[#202c40]/50 text-center text-xs text-slate-400 font-sans">
            No positive signals detected. Consider implementing standard lockfiles, README, or tests.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positiveSignals.map((signal: HealthSignal, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#121927] border border-[#202c40] flex items-start gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {signal.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {signal.evidence && signal.evidence.length > 0 ? signal.evidence.join(', ') : 'Verified Successfully'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
