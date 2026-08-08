import React from 'react';

export type StatusType =
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'warning'
  | 'info'
  | 'idle';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
  showPulse?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showPulse = true,
  className = '',
}) => {
  const configMap: Record<
    StatusType,
    { color: string; bg: string; border: string; defaultLabel: string; pulse: boolean }
  > = {
    ready: {
      color: 'bg-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      defaultLabel: 'Ready',
      pulse: false,
    },
    running: {
      color: 'bg-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      defaultLabel: 'Running',
      pulse: true,
    },
    completed: {
      color: 'bg-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      defaultLabel: 'Completed',
      pulse: false,
    },
    failed: {
      color: 'bg-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      defaultLabel: 'Failed',
      pulse: false,
    },
    warning: {
      color: 'bg-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      defaultLabel: 'Warning',
      pulse: false,
    },
    info: {
      color: 'bg-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      defaultLabel: 'Info',
      pulse: false,
    },
    idle: {
      color: 'bg-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      defaultLabel: 'Idle',
      pulse: false,
    },
  };

  const current = configMap[status] || configMap.idle;
  const isPulseActive = showPulse && current.pulse;
  const displayLabel = label ?? current.defaultLabel;

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  const textSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${current.bg} ${current.border} ${className}`}
    >
      <span className="relative flex items-center justify-center">
        {isPulseActive && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${current.color} opacity-75 animate-ping`}
          />
        )}
        <span
          className={`relative inline-block rounded-full ${current.color} ${dotSizes[size]}`}
        />
      </span>
      <span
        className={`font-mono font-medium text-slate-200 tracking-tight ${textSizes[size]}`}
      >
        {displayLabel}
      </span>
    </div>
  );
};
