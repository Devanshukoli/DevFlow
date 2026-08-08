import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f17] disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]';

    const variantStyles = {
      primary:
        'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold shadow-sm shadow-emerald-500/10 border border-emerald-400/20',
      secondary:
        'bg-[#17202e] hover:bg-[#1e293b] active:bg-[#111722] text-slate-200 border border-[#222f43] hover:border-[#2d3e58]',
      ghost:
        'bg-transparent hover:bg-[#17202e] active:bg-[#1e293b] text-slate-300 hover:text-white',
      destructive:
        'bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 border border-rose-500/20 hover:border-rose-500/30',
    };

    const sizeStyles = {
      sm: 'text-xs h-8 px-3 rounded-md gap-1.5 font-mono',
      md: 'text-xs h-9 px-4 rounded-md gap-2',
      lg: 'text-sm h-11 px-5 rounded-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
