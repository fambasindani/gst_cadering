import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'blue' | 'indigo' | 'purple' | 'orange' | 'green' | 'red' | 'pink' | 'cyan';
}

const colorVariants = {
  blue: {
    bar: 'from-blue-400 to-blue-600',
    badge: 'bg-gradient-to-br from-blue-500 to-blue-700',
    glow: 'shadow-blue-600/30',
  },
  indigo: {
    bar: 'from-indigo-400 to-indigo-600',
    badge: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
    glow: 'shadow-indigo-600/30',
  },
  purple: {
    bar: 'from-purple-400 to-purple-600',
    badge: 'bg-gradient-to-br from-purple-500 to-purple-700',
    glow: 'shadow-purple-600/30',
  },
  orange: {
    bar: 'from-amber-400 to-orange-500',
    badge: 'bg-gradient-to-br from-amber-500 to-orange-600',
    glow: 'shadow-orange-600/30',
  },
  green: {
    bar: 'from-emerald-400 to-green-600',
    badge: 'bg-gradient-to-br from-emerald-500 to-green-700',
    glow: 'shadow-green-600/30',
  },
  red: {
    bar: 'from-rose-400 to-red-600',
    badge: 'bg-gradient-to-br from-rose-500 to-red-700',
    glow: 'shadow-red-600/30',
  },
  pink: {
    bar: 'from-pink-400 to-pink-600',
    badge: 'bg-gradient-to-br from-pink-500 to-pink-700',
    glow: 'shadow-pink-600/30',
  },
  cyan: {
    bar: 'from-cyan-400 to-cyan-600',
    badge: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
    glow: 'shadow-cyan-600/30',
  },
};

export function StatCard({ title, value, icon, color = 'blue' }: StatCardProps) {
  const colors = colorVariants[color];

  return (
    <Card className="group relative overflow-hidden border-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', colors.bar)} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {title}
            </p>
            <p className="mt-1.5 text-3xl font-extrabold leading-none text-gray-900">{value}</p>
          </div>
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110',
              colors.badge,
              colors.glow,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
