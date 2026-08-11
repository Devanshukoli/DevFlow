import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GetAnalysisResultSuccessResponse, AnalysisResult } from '@devflow/shared';
import { ReportHeader } from './ReportHeader';
import { ReportHero } from './ReportHero';
import { ExecutiveMetrics } from './ExecutiveMetrics';
import { LanguagesPanel } from './LanguagesPanel';
import { FrameworksPanel } from './FrameworksPanel';
import { ExtensionDistribution } from './ExtensionDistribution';
import { ArchitectureSignals } from './ArchitectureSignals';
import { ApiSurfacePanel } from './ApiSurfacePanel';
import { ProjectFilesPanel } from './ProjectFilesPanel';
import { DependencyIntelligencePanel } from './DependencyIntelligencePanel';
import { ReportSummary } from './ReportSummary';
import { ArchitectureIntelligenceTab } from './ArchitectureIntelligenceTab';
import { ApiSurfaceTab } from './ApiSurfaceTab';
import { EngineeringHealthTab } from './EngineeringHealthTab';
import { RepositoryGraphTab } from './RepositoryGraphTab';
import { AskDevFlowPanel } from './AskDevFlowPanel';
import { ArrowLeft, RefreshCw, AlertTriangle, FileQuestion } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { addOrUpdateRecentScan } from '../../utils/recentScans';
import { setGuestPendingAnalysis } from '../../utils/guestAnalysis';

export interface RepositoryReportPageProps {
  jobId: string;
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export const RepositoryReportPage: React.FC<RepositoryReportPageProps> = ({
  jobId,
  onNavigateBack,
  onNavigateHome,
}) => {
  const { user } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'intelligence' | 'architecture' | 'api-surface' | 'health' | 'graph'>('intelligence');
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchReportResult = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setIsNotFound(false);
    setIsIncomplete(false);
    setFetchError(null);

    try {
      const response = await fetch(getApiUrl(`/api/analysis/${jobId}/result`), {
        signal: controller.signal,
      });

      if (response.status === 404) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const json = (await response.json()) as GetAnalysisResultSuccessResponse | any;

      if (json.ok && json.data) {
        const res = json.data as AnalysisResult;
        setResult(res);

        if (user && res.repositoryUrl) {
          const langs = res.detectedLanguages
            ? res.detectedLanguages.map((dl) => dl.name).filter(Boolean)
            : ['TypeScript'];

          addOrUpdateRecentScan(
            {
              id: jobId,
              url: res.repositoryUrl,
              status: 'completed',
              languages: langs.length > 0 ? langs.slice(0, 4) : ['TypeScript'],
              date: res.createdAt
                ? new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            },
            user.id || user.email
          );
        } else if (!user && res.repositoryUrl) {
          const langs = res.detectedLanguages
            ? res.detectedLanguages.map((dl) => dl.name).filter(Boolean)
            : ['TypeScript'];

          setGuestPendingAnalysis({
            jobId,
            repositoryUrl: res.repositoryUrl,
            status: 'completed',
            languages: langs.length > 0 ? langs.slice(0, 4) : ['TypeScript'],
            createdAt: res.createdAt || new Date().toISOString(),
          });
        }
      } else {
        if (json.error?.code === 'ANALYSIS_JOB_NOT_COMPLETED') {
          setIsIncomplete(true);
        } else {
          setFetchError(json.error?.message || 'Unable to load analysis result.');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(`[RepositoryReportPage] Fetch error for job ${jobId}:`, err);
      setFetchError('Unable to connect to analysis server. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchReportResult();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchReportResult]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between font-mono">
        <header className="bg-[#0e1420] border-b border-[#1c2738] py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="h-6 w-48 bg-[#1a2538] rounded animate-pulse" />
            <div className="h-8 w-32 bg-[#1a2538] rounded animate-pulse" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
          <div className="p-8 rounded-xl bg-[#101724] border border-[#1d2a3f] space-y-4">
            <div className="h-4 w-36 bg-[#1c283c] rounded animate-pulse" />
            <div className="h-8 w-2/3 bg-[#1c283c] rounded animate-pulse" />
            <div className="h-16 w-full bg-[#1c283c] rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[#121927] border border-[#202c40] animate-pulse" />
            ))}
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-slate-600 border-t border-[#1a2333]">
          DEVFLOW REPOSITORY INTELLIGENCE REPORT
        </footer>
      </div>
    );
  }

  // 404 Not Found State
  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between font-mono">
        <ReportHeader
          repositoryUrl=""
          jobId={jobId}
          onNavigateBack={onNavigateBack}
          onNavigateHome={onNavigateHome}
        />

        <main className="max-w-2xl mx-auto px-4 py-20 w-full text-center space-y-6">
          <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 w-16 h-16 mx-auto flex items-center justify-center">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">REPORT NOT FOUND</h2>
            <p className="text-sm text-slate-400 font-sans">
              The requested repository analysis report ({jobId}) does not exist or has expired.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onNavigateBack}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Analysis</span>
            </button>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-slate-600 border-t border-[#1a2333]">
          DEVFLOW REPOSITORY INTELLIGENCE
        </footer>
      </div>
    );
  }

  // Analysis Incomplete State
  if (isIncomplete) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between font-mono">
        <ReportHeader
          repositoryUrl=""
          jobId={jobId}
          onNavigateBack={onNavigateBack}
          onNavigateHome={onNavigateHome}
        />

        <main className="max-w-2xl mx-auto px-4 py-20 w-full text-center space-y-6">
          <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 w-16 h-16 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">ANALYSIS NOT COMPLETE</h2>
            <p className="text-sm text-slate-400 font-sans">
              The analysis for this repository is still in progress or incomplete. Please return to the analysis status page to monitor progress.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onNavigateBack}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Analysis Status</span>
            </button>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-slate-600 border-t border-[#1a2333]">
          DEVFLOW REPOSITORY INTELLIGENCE
        </footer>
      </div>
    );
  }

  // Server/Network Error State
  if (fetchError || !result) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between font-mono">
        <ReportHeader
          repositoryUrl=""
          jobId={jobId}
          onNavigateBack={onNavigateBack}
          onNavigateHome={onNavigateHome}
        />

        <main className="max-w-2xl mx-auto px-4 py-20 w-full text-center space-y-6">
          <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 w-16 h-16 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">UNABLE TO LOAD REPORT</h2>
            <p className="text-sm text-slate-400 font-sans">
              {fetchError || 'An unexpected error occurred while fetching repository intelligence.'}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={fetchReportResult}
              className="px-4 py-2 rounded-lg bg-[#182335] hover:bg-[#22324b] text-slate-200 border border-[#2b3d5b] text-xs font-bold transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>

            <button
              onClick={onNavigateBack}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Analysis</span>
            </button>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-slate-600 border-t border-[#1a2333]">
          DEVFLOW REPOSITORY INTELLIGENCE
        </footer>
      </div>
    );
  }

  // Render Full Report View
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400 flex flex-col justify-between">
      
      {/* Top Header */}
      <ReportHeader
        repositoryUrl={result.repositoryUrl}
        jobId={jobId}
        onNavigateBack={onNavigateBack}
        onNavigateHome={onNavigateHome}
      />

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-fadeIn">
        
        {/* Hero Banner & Summary */}
        <ReportHero
          repositoryUrl={result.repositoryUrl}
          summary={result.summary}
          detectedAppType={result.detectedAppType}
          fileCount={result.fileCount}
          totalBytes={result.totalBytes}
          detectedPackageManager={result.detectedPackageManager}
        />

        {/* Executive Metrics Grid */}
        <ExecutiveMetrics
          fileCount={result.fileCount}
          directoryCount={result.directoryCount}
          totalBytes={result.totalBytes}
          detectedAppType={result.detectedAppType}
          detectedPackageManager={result.detectedPackageManager}
        />

        {/* AI-powered Q&A Assistant */}
        <AskDevFlowPanel jobId={jobId} />

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-[#1c2738]">
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all font-mono ${
              activeTab === 'intelligence'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-500/5'
            }`}
          >
            Intelligence Report
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all font-mono ${
              activeTab === 'architecture'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-500/5'
            }`}
          >
            Architecture V1
          </button>
          <button
            onClick={() => setActiveTab('api-surface')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all font-mono ${
              activeTab === 'api-surface'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-500/5'
            }`}
          >
            API Surface
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all font-mono ${
              activeTab === 'health'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-500/5'
            }`}
          >
            Engineering Health
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all font-mono ${
              activeTab === 'graph'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-500/5'
            }`}
          >
            Knowledge Graph
          </button>
        </div>

        {activeTab === 'intelligence' ? (
          <>
            {/* Primary Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Languages, Frameworks, Extension Distribution */}
              <div className="space-y-6">
                <LanguagesPanel detectedLanguages={result.detectedLanguages} />
                <FrameworksPanel detectedFrameworks={result.detectedFrameworks} />
                <ExtensionDistribution
                  extensionCounts={result.extensionCounts}
                  totalFiles={result.fileCount}
                />
              </div>

              {/* Right Column: Structural & API Signals */}
              <div className="space-y-6">
                <ArchitectureSignals architectureHints={result.architectureHints} />
                <ApiSurfacePanel apiSurfaceHints={result.apiSurfaceHints} />
              </div>

            </div>

            {/* Dependency Intelligence Panel */}
            <DependencyIntelligencePanel
              dependencies={result.dependencies}
              dependencyCount={result.dependencyCount}
              productionDependencyCount={result.productionDependencyCount}
              developmentDependencyCount={result.developmentDependencyCount}
              optionalDependencyCount={result.optionalDependencyCount}
              peerDependencyCount={result.peerDependencyCount}
              dependencyManifests={result.dependencyManifests}
            />

            {/* Project Files Panel */}
            <ProjectFilesPanel detectedFiles={result.detectedFiles} />

            {/* DevFlow Summary Footer Card */}
            <ReportSummary summary={result.summary} />
          </>
        ) : activeTab === 'architecture' ? (
          <ArchitectureIntelligenceTab architecture={result.architecture} />
        ) : activeTab === 'api-surface' ? (
          <ApiSurfaceTab apiSurface={result.apiSurface} />
        ) : activeTab === 'graph' ? (
          <RepositoryGraphTab jobId={jobId} />
        ) : (
          <EngineeringHealthTab result={result} />
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs font-mono text-slate-600 border-t border-[#1a2333] mt-12">
        <span>DEVFLOW REPOSITORY INTELLIGENCE • AUTHORITATIVE ANALYSIS REPORT</span>
      </footer>

    </div>
  );
};
