import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
  isMonospace?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      description,
      error,
      prefixElement,
      suffixElement,
      isMonospace = false,
      id,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide text-slate-300 font-sans"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {prefixElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-500">
              {prefixElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full bg-[#111722] text-slate-100 placeholder:text-slate-500 text-xs rounded-md border transition-all duration-150
              ${
                error
                  ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                  : 'border-[#222f43] hover:border-[#2e3e57] focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed bg-[#0d121b]' : ''}
              ${prefixElement ? 'pl-9' : 'pl-3.5'}
              ${suffixElement ? 'pr-9' : 'pr-3.5'}
              py-2.5 outline-none
              ${isMonospace ? 'font-mono text-[13px]' : 'font-sans'}
              ${className}
            `}
            {...props}
          />

          {suffixElement && (
            <div className="absolute right-3 flex items-center text-slate-500">
              {suffixElement}
            </div>
          )}
        </div>

        {description && !error && (
          <p className="text-[11px] text-slate-400 leading-tight">{description}</p>
        )}

        {error && (
          <p className="text-[11px] text-rose-400 font-medium leading-tight">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
