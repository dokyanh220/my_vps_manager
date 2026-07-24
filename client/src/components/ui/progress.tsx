import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  showLabel?: boolean;
  label?: string;
  subLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Progress({
  value,
  showLabel = false,
  label,
  subLabel,
  size = 'md',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, value));

  // Determine progress color threshold (Blue -> Amber -> Red)
  let barColor = 'bg-blue-600 dark:bg-blue-500';
  if (percentage >= 90) {
    barColor = 'bg-red-600 dark:bg-red-500';
  } else if (percentage >= 75) {
    barColor = 'bg-amber-500 dark:bg-amber-400';
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {(showLabel || label || subLabel) && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
          <div className="flex items-center gap-2">
            {subLabel && <span className="text-slate-500 dark:text-slate-400 font-mono-code">{subLabel}</span>}
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono-code">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      )}
      <div className={cn('w-full bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden border border-slate-300 dark:border-slate-700/60', heights[size])}>
        <div
          className={cn('h-full transition-all duration-500 ease-out', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
