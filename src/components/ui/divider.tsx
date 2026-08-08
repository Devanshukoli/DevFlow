import React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: React.ReactNode;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  className = '',
  ...props
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={`inline-block w-px self-stretch bg-[#222f43] mx-3 ${className}`}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        className={`flex items-center w-full my-4 ${className}`}
        role="separator"
        {...props}
      >
        <div className="flex-1 h-px bg-[#222f43]" />
        <span className="px-3 text-[11px] font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px bg-[#222f43]" />
      </div>
    );
  }

  return (
    <div
      className={`w-full h-px bg-[#222f43] my-3 ${className}`}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  );
};
