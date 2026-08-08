import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  isMonospace?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  isMonospace = true,
  icon,
  className = '',
  ...props
}) => {
  const variantStyles = {
    neutral:
      'bg-[#1e293b]/70 text-slate-300 border-[#334155]/60',
    success:
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning:
      'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger:
      'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info:
      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded gap-1',
    md: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border ${variantStyles[variant]} ${sizeStyles[size]} ${
        isMonospace ? 'font-mono' : 'font-sans'
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
};
