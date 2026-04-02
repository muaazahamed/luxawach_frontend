import React from 'react';
import { cn } from '../utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-[10px] uppercase tracking-widest text-ink/60 font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-transparent border-b border-ink/20 py-2 text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-ink/30',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-[10px] text-red-500 uppercase tracking-wider">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
