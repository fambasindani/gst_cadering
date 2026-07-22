import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | '3xl' | '4xl';
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export function SlidePanel({
  isOpen,
  onClose,
  title,
  children,
  className,
  width = '4xl',
}: SlidePanelProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full bg-royal-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto",
          widthClasses[width],
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* En-tête */}
        <div className="sticky top-0 bg-royal-800 z-10 p-6 border-b border-royal-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-royal-700 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className={cn("p-6", className)}>
          {children}
        </div>
      </div>
    </>
  );
}