import React from 'react';

export interface ProgressProps {
  value?: number; // 0 to 100
  isIndeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValueText?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  isIndeterminate = false,
  size = 'md',
  label,
  showValueText = false,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showValueText) && (
        <div className="flex items-center justify-between text-xs font-mono">
          {label && <span className="text-slate-300 font-medium">{label}</span>}
          {showValueText && !isIndeterminate && (
            <span className="text-emerald-400 font-semibold">{clampedValue}%</span>
          )}
          {showValueText && isIndeterminate && (
            <span className="text-slate-400 animate-pulse">Processing...</span>
          )}
        </div>
      )}

      <div
        className={`w-full bg-[#17202e] border border-[#222f43] rounded-full overflow-hidden ${heightStyles[size]}`}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {isIndeterminate ? (
          <div className="h-full w-full bg-gradient-to-r from-emerald-500/20 via-emerald-400 to-emerald-500/20 animate-pulse rounded-full" />
        ) : (
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out shadow-sm shadow-emerald-500/30"
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
    </div>
  );
};
