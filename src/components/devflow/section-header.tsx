import React from 'react';
import { TechnicalLabel } from './technical-label';

export interface SectionHeaderProps {
  technicalLabel?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  technicalLabel,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#222f43] ${className}`}
    >
      <div className="space-y-1">
        {technicalLabel && <TechnicalLabel>{technicalLabel}</TechnicalLabel>}
        <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
        {description && (
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
