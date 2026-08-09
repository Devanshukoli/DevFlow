import React, { useState } from 'react';
import { Search, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export interface RepositoryInputProps {
  onSubmitUrl?: (url: string) => void;
}

export interface QueuedJobState {
  jobId: string;
  status: string;
  repositoryUrl: string;
}

export const RepositoryInput: React.FC<RepositoryInputProps> = ({ onSubmitUrl }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobState, setJobState] = useState<QueuedJobState | null>(null);

  const validateGithubUrl = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    
    // Pattern checks for https://github.com/owner/repo format
    const githubRegex = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/i;
    return githubRegex.test(trimmed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobState(null);

    const trimmed = url.trim();

    if (!trimmed) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (!validateGithubUrl(trimmed)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repositoryUrl: trimmed }),
      });

      const payload = await response.json();

      if (response.ok && payload.ok) {
        const queuedJob: QueuedJobState = {
          jobId: payload.data.jobId,
          status: payload.data.status,
          repositoryUrl: trimmed,
        };
        setJobState(queuedJob);
        if (onSubmitUrl) {
          onSubmitUrl(trimmed);
        }
      } else {
        const errorMessage =
          payload?.error?.message || 'Unable to create analysis job. Please try again.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Failed to submit repository analysis request:', err);
      setError('Network error: Unable to connect to the analysis service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(null);
    if (jobState) setJobState(null);
  };

  const isValidInput = validateGithubUrl(url);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
          <div className="flex-1">
            <Input
              id="repo-url-input"
              label=""
              placeholder="https://github.com/facebook/react"
              value={url}
              onChange={handleInputChange}
              prefixElement={<Search className="w-4 h-4 text-slate-500" />}
              error={error || undefined}
              disabled={isLoading}
              isMonospace
              className="h-11"
              aria-label="GitHub Repository URL"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={!url.trim() || isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="shrink-0 h-11 min-w-[170px]"
          >
            {isLoading ? 'Creating Analysis...' : 'Analyze Repository'}
          </Button>
        </div>
      </form>

      {/* Temporary Success Bridge: Queued Job Display */}
      {jobState && (
        <div className="p-4 rounded-lg bg-[#111722] border border-emerald-500/30 space-y-2 text-xs font-mono shadow-lg text-left">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ANALYSIS QUEUED</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>STATUS: {jobState.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 pt-2 border-t border-[#1a2333]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Job ID</span>
              <span className="font-bold text-white tracking-wide">{jobState.jobId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Target Repository</span>
              <span className="font-medium text-slate-200 truncate block">
                {jobState.repositoryUrl.replace(/^https?:\/\/github\.com\//i, '')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Helper text under input */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
        <span>PUBLIC REPOSITORY • CLOUD ANALYSIS</span>
        {url.trim() && (
          <span className={isValidInput ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
            {isValidInput ? '✓ VALID REPOSITORY FORMAT' : 'ENTER FULL GITHUB URL'}
          </span>
        )}
      </div>
    </div>
  );
};
