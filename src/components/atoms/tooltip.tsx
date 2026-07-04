// src/components/atoms/tooltip.tsx
import { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

export const Tooltip = ({ content, children, className = '' }: TooltipProps) => (
  <div className={`relative group inline-block ${className}`}>
    {children}
    <span className="absolute left-1/2 bottom-full mb-2 z-30 transform -translate-x-1/2 hidden group-hover:block px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
      {content}
    </span>
  </div>
);

export default Tooltip;