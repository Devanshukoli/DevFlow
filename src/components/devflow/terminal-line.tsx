import React from 'react';
import { Check, ArrowRight, X, Loader2, Circle } from 'lucide-react';

export interface TerminalLineProps {
  status?: 'success' | 'active' | 'pending' | 'error';
  text: string;
  duration?: string;
  timestamp?: string;
  className?: string;
}

export const TerminalLine: React.FC<TerminalLineProps> = ({
  status = 'success',
  text,
  duration,
  timestamp,
  className = '',
}) => {
  const iconMap = {
    success: <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    active: <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
    pending: <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
    error: <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
  };

  const textStyles = {
    success: 'text-slate-200',
    active: 'text-blue-300 font-semibold',
    pending: 'text-slate-500',
    error: 'text-rose-300',
  };

  return (
    <div
      className={`flex items-center justify-between font-mono text-xs py-1.5 px-3 rounded hover:bg-[#111722]/80 transition-colors ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {iconMap[status]}
        <span className={`truncate ${textStyles[status]}`}>{text}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
        {duration && <span className="font-mono text-slate-400">{duration}</span>}
        {timestamp && <span className="font-mono text-slate-600">{timestamp}</span>}
      </div>
    </div>
  );
};
