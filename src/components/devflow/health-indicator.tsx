import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface HealthIndicatorProps {
  status: HealthStatus;
  score?: number; // 0 - 100
  label?: string;
  showDetails?: boolean;
  className?: string;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  status,
  score,
  label,
  showDetails = true,
  className = '',
}) => {
  const config = {
    healthy: {
      title: 'Healthy',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      desc: 'Architecture and dependencies are in good standing.',
    },
    warning: {
      title: 'Warning',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      desc: 'Minor architectural risks or outdated dependencies detected.',
    },
    critical: {
      title: 'Critical',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
      desc: 'High severity vulnerabilities or architectural bottlenecks.',
    },
    unknown: {
      title: 'Unknown',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      text: 'text-slate-400',
      icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
      desc: 'Repository health check not yet evaluated.',
    },
  }[status];

  return (
    <div
      className={`p-3.5 rounded-lg border ${config.bg} ${config.border} flex items-start gap-3 ${className}`}
    >
      <div className="p-1.5 rounded-md bg-[#0b0f17]/50 shrink-0">{config.icon}</div>

      <div className="space-y-0.5 flex-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold font-mono uppercase tracking-wider ${config.text}`}>
            {label || config.title}
          </span>
          {score !== undefined && (
            <span className="text-xs font-mono font-bold text-slate-200">
              {score}/100
            </span>
          )}
        </div>

        {showDetails && (
          <p className="text-[11px] text-slate-400 leading-snug font-sans">
            {config.desc}
          </p>
        )}
      </div>
    </div>
  );
};
