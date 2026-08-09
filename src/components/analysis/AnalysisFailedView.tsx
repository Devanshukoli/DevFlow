import React from 'react';
import { AlertCircle, HelpCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export interface AnalysisFailedViewProps {
  isNotFound?: boolean;
  errorMessage?: string | null;
  onNavigateHome: () => void;
}

export const AnalysisFailedView: React.FC<AnalysisFailedViewProps> = ({
  isNotFound = false,
  errorMessage,
  onNavigateHome,
}) => {
  return (
    <div className="p-8 rounded-xl bg-[#101724] border border-rose-500/30 space-y-6 shadow-2xl max-w-2xl mx-auto text-center font-mono">
      <div className="flex justify-center">
        <div className="p-3.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
          {isNotFound ? <HelpCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {isNotFound ? 'ANALYSIS NOT FOUND' : 'ANALYSIS FAILED'}
        </h2>

        <p className="text-sm text-slate-300 font-sans leading-relaxed max-w-lg mx-auto">
          {isNotFound
            ? 'The requested analysis job does not exist or is no longer available in the DevFlow backend.'
            : errorMessage || 'DevFlow could not complete this analysis.'}
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <Button
          variant="primary"
          size="md"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onNavigateHome}
        >
          {isNotFound ? 'Return to DevFlow' : 'Try Again'}
        </Button>
      </div>
    </div>
  );
};
