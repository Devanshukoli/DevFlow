import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Trash2, ArrowRight, Github, Sparkles, FolderGit2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GuestPendingAnalysis } from '../../utils/guestAnalysis';

interface SaveAnalysisModalProps {
  isOpen: boolean;
  analysis: GuestPendingAnalysis | null;
  onConfirmSave: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export const SaveAnalysisModal: React.FC<SaveAnalysisModalProps> = ({
  isOpen,
  analysis,
  onConfirmSave,
  onDiscard,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !analysis) return null;

  const statusVariant =
    analysis.status === 'completed'
      ? 'success'
      : analysis.status === 'failed'
      ? 'danger'
      : 'warning';

  const statusLabel =
    analysis.status === 'completed'
      ? 'Analysis Completed'
      : analysis.status === 'failed'
      ? 'Analysis Failed'
      : 'Analysis In Progress';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Modal Card */}
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-analysis-modal-title"
        className="relative w-full max-w-lg bg-[#0e1420] border border-[#222f43] rounded-2xl shadow-2xl overflow-hidden z-10 focus:outline-none animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#1c283a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
                  Pending Guest Analysis
                </span>
                <Badge variant={statusVariant} size="sm">
                  {statusLabel}
                </Badge>
              </div>
              <h3 id="save-analysis-modal-title" className="text-base font-bold text-white tracking-tight mt-0.5">
                Save Analysis Before Sign Up?
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#182335] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            You analyzed a repository as a guest prior to signing up. Would you like to save this repository analysis to your new account?
          </p>

          {/* Repository Showcase Card */}
          <div className="p-4 rounded-xl bg-[#121927] border border-[#202d42] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Github className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-mono font-bold text-white truncate">
                  {analysis.repositoryName}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                Job #{analysis.jobId.slice(0, 8)}
              </span>
            </div>

            <p className="text-xs font-mono text-slate-400 truncate">
              {analysis.repositoryUrl}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#1a2638] text-[11px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {analysis.languages && analysis.languages.length > 0 ? (
                  analysis.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#182335] text-slate-300 border border-[#25354e] font-mono text-[10px]"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="px-2 py-0.5 rounded bg-[#182335] text-slate-300 font-mono text-[10px]">
                    TypeScript
                  </span>
                )}
              </div>

              <span className="text-slate-400 font-mono text-[10px]">
                {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-300/90 text-xs flex items-start gap-2.5">
            <FolderGit2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Saving this repository adds it to your account dashboard with full graph visualizations and grounding AI search logs.
            </p>
          </div>

          {/* Decision Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onConfirmSave}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="flex-1 justify-center py-2.5 font-bold"
              id="save-analysis-confirm-btn"
            >
              Yes, Save to My Account
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="md"
              onClick={onDiscard}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="justify-center py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0"
              id="save-analysis-discard-btn"
            >
              Cancel & Discard
            </Button>
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-6 py-2.5 bg-[#0a0e17] border-t border-[#182334] text-[11px] text-slate-400 font-mono text-center">
          Choosing Cancel permanently removes this guest analysis cache.
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
