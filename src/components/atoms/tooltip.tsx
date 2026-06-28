import { ReactNode } from "react";

// Tooltip (hover ilə text)
const Tooltip: React.FC<{
  content: string;
  children: ReactNode;
  className?: string;
}> = ({ content, children, className }) => (
  <div className={`relative group inline-block ${className}`}>
    {children}
    <span className="absolute left-1/2 bottom-full mb-2 z-30 transform -translate-x-1/2 hidden group-hover:block px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
      {content}
    </span>
  </div>
);
export default Tooltip;