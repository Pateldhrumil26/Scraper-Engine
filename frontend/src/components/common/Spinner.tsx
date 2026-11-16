import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text, className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-slate-500 gap-3 ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-brand-600`} />
      {text && <span className="text-sm font-medium text-slate-600">{text}</span>}
    </div>
  );
};
