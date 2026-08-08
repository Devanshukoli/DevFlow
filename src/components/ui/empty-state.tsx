import React from 'react';
import { Terminal } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Terminal className="w-8 h-8 text-slate-500" />,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-[#222f43] bg-[#0d121b]/60 space-y-3 ${className}`}
    >
      <div className="p-3 rounded-xl bg-[#17202e] border border-[#222f43] text-slate-400">
        {icon}
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-slate-200 tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {description}
        </p>
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
