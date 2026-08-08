import React from 'react';

export interface TechnicalLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm';
  colorVariant?: 'muted' | 'emerald' | 'amber' | 'rose' | 'blue';
  icon?: React.ReactNode;
}

export const TechnicalLabel: React.FC<TechnicalLabelProps> = ({
  children,
  size = 'xs',
  colorVariant = 'muted',
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    xs: 'text-[10px] tracking-wider',
    sm: 'text-[11px] tracking-widest',
  };

  const colorStyles = {
    muted: 'text-slate-400 font-medium',
    emerald: 'text-emerald-400 font-semibold',
    amber: 'text-amber-400 font-semibold',
    rose: 'text-rose-400 font-semibold',
    blue: 'text-blue-400 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase font-semibold ${sizeStyles[size]} ${colorStyles[colorVariant]} ${className}`}
      {...props}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
