import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';


interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'blue' | 'indigo' | 'purple' | 'orange' | 'green' | 'red' | 'pink';
}

const colorVariants = {
  blue: { icon: 'bg-blue-100 text-blue-600' },
  indigo: { icon: 'bg-indigo-100 text-indigo-600' },
  purple: { icon: 'bg-purple-100 text-purple-600' },
  orange: { icon: 'bg-orange-100 text-orange-600' },
  green: { icon: 'bg-green-100 text-green-600' },
  red: { icon: 'bg-red-100 text-red-600' },
  pink: { icon: 'bg-pink-100 text-pink-600' },
};

export function StatCard({ title, value, icon, color = 'blue' }: StatCardProps) {
  const colors = colorVariants[color];

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={cn("p-3 rounded-xl", colors.icon)}>
            <div className="w-6 h-6">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}