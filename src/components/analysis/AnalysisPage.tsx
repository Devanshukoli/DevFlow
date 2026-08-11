import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnalysisHeader } from './AnalysisHeader';
import { AnalysisProgress } from './AnalysisProgress';
import { AnalysisStageList } from './AnalysisStageList';
import { AnalysisActivity } from './AnalysisActivity';
import { AnalysisTerminal } from './AnalysisTerminal';
import { AnalysisCompleteView } from './AnalysisCompleteView';
import { AnalysisFailedView } from './AnalysisFailedView';
import { evaluateWorkerStages } from './stages';
import { GetAnalysisJobSuccessResponse } from '@devflow/shared';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { addOrUpdateRecentScan } from '../../utils/recentScans';
import { setGuestPendingAnalysis } from '../../utils/guestAnalysis';

export interface AnalysisPageProps {
  jobId: string;
  onNavigateHome: () => void;
  onViewReport?: () => void;
}

export interface JobStateData {
  jobId: string;
  repositoryUrl: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ jobId, onNavigateHome, onViewReport }) => {
  const { user } = useAuth();
  const [jobData, setJobData] = useState<JobStateData | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const fetchJobStatus = useCallback(async () => {
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(getApiUrl(`/api/analysis/${jobId}`), {
        signal: controller.signal,
      });

      if (response.status === 404) {
        setIsNotFound(true);
        setIsLoadingInitial(false);
        setIsRetrying(false);
        stopPolling();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const json = (await response.json()) as GetAnalysisJobSuccessResponse;

      if (json.ok && json.data) {
        setJobData(json.data as JobStateData);
        setIsNotFound(false);
        setIsLoadingInitial(false);
        setIsRetrying(false);
        setFetchError(null);

        if (user && json.data.repositoryUrl) {
          addOrUpdateRecentScan(
            {
              id: jobId,
              url: json.data.repositoryUrl,
              status: json.data.status,
              date: json.data.completedAt
                ? new Date(json.data.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'In progress',
            },
            user.id || user.email
          );
        } else if (!user && json.data.repositoryUrl) {
          setGuestPendingAnalysis({
            jobId,
            repositoryUrl: json.data.repositoryUrl,
            status: json.data.status,
            createdAt: json.data.createdAt || new Date().toISOString(),
          });
        }

        // Stop polling if completed or failed
        if (json.data.status === 'completed' || json.data.status === 'failed') {
          stopPolling();
          return;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Safe request cancellation on unmount/re-fetch
      }

      console.warn(`[AnalysisPage] Polling error for job ${jobId}:`, err);
      setIsRetrying(true);
      setFetchError('Connection interrupted. Retrying...');
    } finally {
      setIsLoadingInitial(false);
    }
  }, [jobId, stopPolling]);

  // Main polling lifecycle effect
  useEffect(() => {
    let isCancelled = false;

    const pollLoop = async () => {
      if (isCancelled) return;
      await fetchJobStatus();

      // Schedule next poll if job is still in progress and component mounted
      if (!isCancelled && jobData?.status !== 'completed' && jobData?.status !== 'failed' && !isNotFound) {
        pollTimerRef.current = setTimeout(pollLoop, 2000);
      }
    };

    pollLoop();

    return () => {
      isCancelled = true;
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [jobId, fetchJobStatus, jobData?.status, isNotFound, stopPolling]);

  // If 404
  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between">
        <AnalysisHeader
          repositoryUrl=""
          status="failed"
          onNavigateHome={onNavigateHome}
        />
        <main className="max-w-4xl mx-auto px-4 py-16 w-full">
          <AnalysisFailedView isNotFound onNavigateHome={onNavigateHome} />
        </main>
        <footer className="py-6 text-center text-xs font-mono text-slate-600 border-t border-[#1a2333]">
          DEVFLOW REPOSITORY INTELLIGENCE
        </footer>
      </div>
    );
  }

  // Initial Loading State
  if (isLoadingInitial && !jobData) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between">
        <AnalysisHeader
          repositoryUrl="Loading..."
          status="queued"
          onNavigateHome={onNavigateHome}
        />
        <main className="max-w-4xl mx-auto px-4 py-20 w-full text-center space-y-4 font-mono">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">CONNECTING TO DEVFLOW ANALYSIS PIPELINE...</p>
        </main>
        <footer className="py-6 text-center text-xs font-mono text-slate-600 border-t border-[#1a2333]">
          DEVFLOW REPOSITORY INTELLIGENCE
        </footer>
      </div>
    );
  }

  // Fallback if no job data
  if (!jobData) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between">
        <AnalysisHeader
          repositoryUrl=""
          status="failed"
          onNavigateHome={onNavigateHome}
        />
        <main className="max-w-4xl mx-auto px-4 py-16 w-full">
          <AnalysisFailedView
            errorMessage="Unable to load analysis job details."
            onNavigateHome={onNavigateHome}
          />
        </main>
        <footer className="py-6 text-center text-xs font-mono text-slate-600 border-t border-[#1a2333]">
          DEVFLOW REPOSITORY INTELLIGENCE
        </footer>
      </div>
    );
  }

  const evaluatedStages = evaluateWorkerStages(
    jobData.status,
    jobData.progress,
    jobData.currentStage
  );

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-400 flex flex-col justify-between">
      
      {/* Header */}
      <AnalysisHeader
        repositoryUrl={jobData.repositoryUrl}
        status={jobData.status}
        onNavigateHome={onNavigateHome}
      />

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-fadeIn">
        
        {/* Retrying Connection Toast */}
        {isRetrying && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center justify-between shadow-lg">
            <span>⚠️ Connection interrupted. Attempting to reconnect to backend analysis server...</span>
            <span className="text-[10px] uppercase font-bold tracking-wider animate-pulse">RETRYING</span>
          </div>
        )}

        {/* Top Feature: Progress Centerpiece */}
        <AnalysisProgress
          progress={jobData.progress}
          status={jobData.status}
          currentStage={jobData.currentStage}
          repositoryUrl={jobData.repositoryUrl}
        />

        {/* If Completed, show Completion View Teaser */}
        {jobData.status === 'completed' && (
          <AnalysisCompleteView
            jobId={jobData.jobId}
            onNavigateHome={onNavigateHome}
            onViewReport={onViewReport}
          />
        )}

        {/* If Failed, show Failed View */}
        {jobData.status === 'failed' && (
          <AnalysisFailedView
            errorMessage="DevFlow could not complete this analysis."
            onNavigateHome={onNavigateHome}
          />
        )}

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Stage Timeline */}
          <div className="space-y-6">
            <AnalysisStageList stages={evaluatedStages} />
          </div>

          {/* Right Column: Current Activity & Technical Activity Panel */}
          <div className="space-y-6">
            <AnalysisActivity
              currentStage={jobData.currentStage}
              status={jobData.status}
              progress={jobData.progress}
            />

            <AnalysisTerminal
              status={jobData.status}
              currentStage={jobData.currentStage}
              createdAt={jobData.createdAt}
              evaluatedStages={evaluatedStages}
              isRetrying={isRetrying}
            />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs font-mono text-slate-600 border-t border-[#1a2333] mt-12">
        <span>DEVFLOW REPOSITORY INTELLIGENCE • AUTHORITATIVE BACKEND PIPELINE</span>
      </footer>

    </div>
  );
};
