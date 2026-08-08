import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const variantStyles = {
    text: 'h-3.5 w-full rounded',
    rectangular: 'h-24 w-full rounded-md',
    circular: 'h-10 w-10 rounded-full',
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      className={`bg-[#182333] animate-skeleton ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
};
