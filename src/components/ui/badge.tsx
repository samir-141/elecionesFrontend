import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-900 text-slate-50',
    secondary: 'bg-slate-100 text-slate-900',
    destructive: 'bg-red-100 text-red-800 border-red-200',
    outline: 'text-slate-950 border border-slate-300',
    success: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };

