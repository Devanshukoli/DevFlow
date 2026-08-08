import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  description,
  trend,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-lg bg-[#111722] border border-[#222f43] space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-tech-label">{label}</span>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">
          {value}
        </span>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded ${
              trend.direction === 'up'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : trend.direction === 'down'
                ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                : 'text-slate-400 bg-slate-500/10 border border-slate-500/20'
            }`}
          >
            {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-slate-400 font-sans leading-tight">
          {description}
        </p>
      )}
    </div>
  );
};
