import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { StatCard } from '../components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { menuItems } from '../data/mockData';
import type { MenuItem } from '../types';
import {
  Package, ArrowRight, CheckCircle, BarChart3, Users, AlertTriangle, Warehouse,
  Home, FileText, Settings, BookOpen, Receipt, ClipboardList, MapPin, Globe,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dashboardService } from '../services/dashboard';
import type { DashboardData, ActiviteRecente } from '../types/dashboard';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const iconMap: Record<string, React.ElementType> = {
  Home, Package, FileText, CheckCircle, Warehouse, BookOpen, Receipt,
  Settings, Users, ClipboardList, BarChart3, MapPin, Globe,
};

const iconColors = [
  'text-blue-600', 'text-indigo-600', 'text-emerald-600', 'text-purple-600',
  'text-orange-600', 'text-pink-600', 'text-cyan-600', 'text-rose-600',
];

function flattenMenuItems(items: MenuItem[]): { title: string; path: string; permission?: string; icon: string }[] {
  const flat: { title: string; path: string; permission?: string; icon: string }[] = [];
  for (const item of items) {
    if (item.subItems) {
      for (const sub of item.subItems) {
        flat.push({ title: sub.title, path: sub.path, permission: sub.permission, icon: item.icon });
      }
    } else if (item.path !== '/') {
      flat.push({ title: item.title, path: item.path, permission: item.permission, icon: item.icon });
    }
  }
  return flat;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.get();
        if (res.success) {
          setData(res.data);
        }
      } catch {
        setError('Impossible de charger le tableau de bord');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const userPermissions = user?.permissions ?? [];
  const isAdmin = user?.role?.nom === 'ADMIN' || user?.role?.nom === 'Administrateur';

  const quickLinks = flattenMenuItems(menuItems).filter((item) => {
    if (!item.permission) return true;
    if (isAdmin) return true;
    return userPermissions.includes(item.permission);
  });

  const statCards = data
    ? [
        { title: 'Produits', value: data.statistiques.total_produits, icon: Package, color: 'blue' as const },
        { title: 'En stock', value: data.statistiques.produits_en_stock, icon: Warehouse, color: 'green' as const },
        { title: 'Clients Aériens', value: data.statistiques.clients_aeriens, icon: Users, color: 'indigo' as const },
        { title: 'À valider', value: data.statistiques.commandes_en_attente, icon: FileText, color: 'orange' as const },
        { title: 'Rupture', value: data.statistiques.produits_rupture, icon: AlertTriangle, color: 'red' as const },
      ]
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton width={300} height={28} />
              <Skeleton width={200} height={16} />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Salut {user?.full_name}
              </h1>
              <p className="text-gray-500 mt-1">
                {user?.ville?.nom}{user?.ville?.nom && user?.departement?.nom ? ' — ' : ''}{user?.departement?.nom}
              </p>
            </>
          )}
        </div>
        <Button className="bg-royal-700 hover:bg-royal-800 text-white shadow-lg shadow-royal-200 transition-all">
          Administration
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton width={80} height={14} />
                  <Skeleton width={60} height={28} className="mt-2" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={<stat.icon className="w-5 h-5" />}
                color={stat.color}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-lg font-bold text-gray-800">Activités récentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton width={8} height={8} circle />
                    <div className="flex-1 space-y-1">
                      <Skeleton width="60%" height={14} />
                      <Skeleton width="30%" height={12} />
                    </div>
                  </div>
                ))
              : data?.activites_recentes?.length
                ? data.activites_recentes.slice(0, 6).map((activity, index) => (
                    <ActiviteItem key={index} activity={activity} />
                  ))
                : (
                  <p className="text-gray-400 text-sm text-center py-4">Aucune activité récente</p>
                )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-gray-800">Alertes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton width="80%" height={14} />
                      <Skeleton width="40%" height={12} />
                    </div>
                  ))
                : (
                  <>
                    <AlerteBadge
                      label="Stock bas"
                      count={data?.alertes?.stock_bas?.length ?? 0}
                      color="text-orange-600 bg-orange-50"
                    />
                    <AlerteBadge
                      label="Péremption proche"
                      count={data?.alertes?.peremption_proche?.length ?? 0}
                      color="text-red-600 bg-red-50"
                    />
                    <AlerteBadge
                      label="Retours en attente"
                      count={data?.statistiques?.retours_en_attente ?? 0}
                      color="text-purple-600 bg-purple-50"
                    />
                    <AlerteBadge
                      label="Factures impayées"
                      count={data?.statistiques?.factures_impayees ?? 0}
                      color="text-pink-600 bg-pink-50"
                    />
                  </>
                )}
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm bg-gray-50/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800">Accès rapide</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {quickLinks.map((item, index) => {
                const Icon = iconMap[item.icon] || Package;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-royal-500 hover:bg-royal-50 transition-all active:scale-95"
                  >
                    <Icon className={cn('w-6 h-6 mb-2', iconColors[index % iconColors.length])} />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide text-center">
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-100">
        <p>© 2026 Fondeg Catering Congo S.A. All Rights Reserved.</p>
      </div>
    </div>
  );
}

function ActiviteItem({ activity }: { activity: ActiviteRecente }) {
  const isEntree = activity.type === 'Entrée';
  return (
    <div className="flex gap-4 group">
      <div
        className={cn(
          'mt-1.5 w-2 h-2 rounded-full flex-shrink-0',
          isEntree ? 'bg-green-500' : 'bg-blue-500',
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{activity.utilisateur}</span>{' '}
          {activity.libelle}{' '}
          <span className="font-medium">{activity.produit}</span>
          {' '}({activity.quantite})
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{activity.date}</p>
      </div>
    </div>
  );
}

function AlerteBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg', color)}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );
}
