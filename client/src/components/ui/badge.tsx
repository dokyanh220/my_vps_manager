import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'online' | 'offline' | 'testing' | 'warning' | 'neutral' | 'blue' | 'unreachable';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variants = {
    online: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    offline: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800',
    unreachable: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800',
    testing: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    warning: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800',
    neutral: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    blue: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-none border gap-1.5 uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'online' && 'bg-emerald-500 animate-pulse',
          variant === 'offline' && 'bg-red-500',
          variant === 'testing' && 'bg-amber-500 animate-ping',
          variant === 'warning' && 'bg-orange-500',
          variant === 'neutral' && 'bg-slate-400',
          variant === 'blue' && 'bg-blue-500'
        )}
      />
      {children}
    </div>
  );
}
