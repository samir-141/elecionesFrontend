import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'touch';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      default: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
      destructive: 'bg-red-700 text-white hover:bg-red-600 active:bg-red-800',
      outline: 'border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400',
      secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
      ghost: 'hover:bg-slate-100 text-slate-700',
      link: 'text-blue-800 underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-11 px-4 py-2 text-base',
      sm: 'h-9 px-3 text-sm',
      lg: 'h-13 px-8 text-lg font-semibold',
      icon: 'h-11 w-11',
      touch: 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg font-semibold', // Optimizado para pantallas táctiles y móviles
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

