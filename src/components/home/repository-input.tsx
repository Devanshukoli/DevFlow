import React, { useState } from 'react';
import { Search, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export interface RepositoryInputProps {
  onSubmitUrl?: (url: string) => void;
}

export const RepositoryInput: React.FC<RepositoryInputProps> = ({ onSubmitUrl }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const validateGithubUrl = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    
    // Pattern checks for https://github.com/owner/repo format
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/i;
    return githubRegex.test(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedNotice(null);

    const trimmed = url.trim();

    if (!trimmed) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (!validateGithubUrl(trimmed)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
      return;
    }

    // Valid URL
    setError(null);
    setSubmittedNotice(
      `Validated repository target: ${trimmed}. Repository analysis flow will be connected in Task 4/5.`
    );

    if (onSubmitUrl) {
      onSubmitUrl(trimmed);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(null);
    if (submittedNotice) setSubmittedNotice(null);
  };

  const isValidInput = validateGithubUrl(url);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
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
              isMonospace
              className="h-11"
              aria-label="GitHub Repository URL"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!url.trim()}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="shrink-0 h-11"
          >
            Analyze Repository
          </Button>
        </div>
      </form>

      {/* Validation feedback or submit notification */}
      {submittedNotice && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>{submittedNotice}</span>
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
