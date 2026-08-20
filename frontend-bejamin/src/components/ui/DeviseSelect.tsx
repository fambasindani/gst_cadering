import { cn } from '../../lib/utils';

interface DeviseSelectProps {
  value: 'USD' | 'CDF';
  onChange: (v: 'USD' | 'CDF') => void;
  className?: string;
}

export function DeviseSelect({ value, onChange, className }: DeviseSelectProps) {
  return (
    <div className={cn('inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm', className)}>
      {(['USD', 'CDF'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === v ? 'bg-royal-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}