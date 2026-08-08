import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { StatCard } from '../components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { menuItems } from '../data/mockData';
import type { MenuItem } from '../types';
import {
  Package, ArrowRight, AlertTriangle, Users, Warehouse, PackageX, FileText,
  TrendingUp, PieChart as PieChartIcon, Trophy, Crown, Bell, Activity,
  Layers, ShoppingCart, CalendarClock, Filter, RotateCcw, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';
import { dashboardService } from '../services/dashboard';
import type {
  DashboardData, ActiviteRecente, TopProduit, TopFournisseur, VariationPrix,
} from '../types/dashboard';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const iconMap: Record<string, React.ElementType> = {
  Home: Package, Package: Package, FileText: FileText, CheckCircle: TrendingUp,
  Warehouse: Warehouse, BookOpen: Layers, Receipt: ShoppingCart, Settings: Layers,
  Users: Users, ClipboardList: FileText, BarChart3: TrendingUp, MapPin: Warehouse,
  Globe: ShoppingCart,
};

const iconColors = [
  'text-blue-600', 'text-indigo-600', 'text-emerald-600', 'text-purple-600',
  'text-orange-600', 'text-pink-600', 'text-cyan-600', 'text-rose-600',
];

const PIE_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#F59E0B', '#E11D48', '#06B6D4',
  '#DB2777', '#4F46E5', '#16A34A', '#D97706',
];

const RANK_COLORS = ['bg-amber-400 text-amber-950', 'bg-gray-300 text-gray-700', 'bg-orange-300 text-orange-900'];

const MOIS = [
  { v: '1', label: 'Janvier' }, { v: '2', label: 'Février' }, { v: '3', label: 'Mars' },
  { v: '4', label: 'Avril' }, { v: '5', label: 'Mai' }, { v: '6', label: 'Juin' },
  { v: '7', label: 'Juillet' }, { v: '8', label: 'Août' }, { v: '9', label: 'Septembre' },
  { v: '10', label: 'Octobre' }, { v: '11', label: 'Novembre' }, { v: '12', label: 'Décembre' },
];

function periodLabel(month: string, year: string): string {
  if (month !== 'all' && year !== 'all') {
    const m = MOIS.find((x) => x.v === month);
    return `Période : ${m?.label ?? month} ${year}`;
  }
  if (year !== 'all') return `Période : année ${year}`;
  if (month !== 'all') {
    const m = MOIS.find((x) => x.v === month);
    return `Période : ${m?.label ?? month}`;
  }
  return 'Période : 6 derniers mois';
}

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
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (filterYear !== 'all') {
      if (filterMonth !== 'all') {
        const lastDay = new Date(Number(filterYear), Number(filterMonth), 0).getDate();
        params.date_debut = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
        params.date_fin = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else {
        params.date_debut = `${filterYear}-01-01`;
        params.date_fin = `${filterYear}-12-31`;
      }
    }
    return params;
  }, [filterMonth, filterYear]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardService.get(buildParams());
      if (res.success) {
        setData(res.data);
      }
    } catch {
      setError('Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const userPermissions = user?.permissions ?? [];
  const isAdmin = user?.role?.nom === 'ADMIN' || user?.role?.nom === 'Administrateur';

  const quickLinks = flattenMenuItems(menuItems).filter((item) => {
    if (!item.permission) return true;
    if (isAdmin) return true;
    return userPermissions.includes(item.permission);
  });

  const stats = data?.statistiques;

  const statCards = stats
    ? [
        { title: 'Produits', value: stats.total_produits, icon: Package, color: 'blue' as const },
        { title: 'En stock', value: stats.produits_en_stock, icon: Warehouse, color: 'green' as const },
        { title: 'Stock bas', value: stats.produits_stock_bas, icon: AlertTriangle, color: 'orange' as const },
        { title: 'À valider', value: stats.commandes_en_attente, icon: FileText, color: 'purple' as const },
        { title: 'Clients', value: stats.total_clients, icon: Users, color: 'indigo' as const },
        { title: 'Rupture', value: stats.produits_rupture, icon: PackageX, color: 'red' as const },
      ]
    : [];

  const maxVendu = Math.max(...(data?.top_produits ?? []).map((p) => p.total_vendu), 1);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* En-tête */}
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
                Tableau de bord
              </h1>
              <p className="text-gray-500 mt-1">
                {user?.magasin?.nom}{user?.magasin?.nom && user?.departement?.nom ? ' — ' : ''}{user?.departement?.nom}
              </p>
              <p className="text-xs font-medium text-royal-700 mt-1 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" />
                {periodLabel(filterMonth, filterYear)}
              </p>
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <span className="flex items-center gap-1.5 px-1 text-xs font-semibold text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              Période
            </span>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-36 h-9 bg-white border-gray-200 text-sm">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {MOIS.map((m) => (
                  <SelectItem key={m.v} value={m.v}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-28 h-9 bg-white border-gray-200 text-sm">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes années</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterMonth !== 'all' || filterYear !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const resetNow = new Date();
                  setFilterMonth(String(resetNow.getMonth() + 1));
                  setFilterYear(String(resetNow.getFullYear()));
                }}
                className="h-9 px-2 text-gray-500 hover:text-gray-800"
                title="Revenir au mois en cours"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isAdmin || userPermissions.includes('config:utilisateurs:view') ? (
            <Button onClick={() => navigate('/configuration/utilisateurs')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-lg shadow-royal-200 transition-all">
              Administration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton width={80} height={14} />
                  <Skeleton width={60} height={28} className="mt-2" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={<stat.icon className="h-6 w-6" />}
                color={stat.color}
              />
            ))}
      </div>

      {/* Bandeau récapitulatif */}
      {!loading && stats && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
            <SummaryItem icon={Layers} label="Stock total" value={`${stats.stock_total} unités`} color="text-blue-600" />
            <SummaryItem icon={TrendingUp} label="Valeur du stock" value={formatCurrency(stats.valeur_stock)} color="text-emerald-600" />
            <SummaryItem icon={ShoppingCart} label="Commandes validées" value={stats.commandes_validees} color="text-purple-600" />
            <SummaryItem icon={CalendarClock} label="Péremption 7 j" value={stats.lots_peremption_proche} color="text-orange-600" />
          </div>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="w-4 h-4" /></span>
              Évolution des commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton height={280} />
            ) : !data?.evolution_commandes?.length ? (
              <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                <TrendingUp className="w-10 h-10 mb-2" />
                <p className="text-sm">Aucune donnée sur la période sélectionnée</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.evolution_commandes} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total" name="Commandes" radius={[8, 8, 0, 0]}>
                    {data.evolution_commandes.map((_, idx: number) => (
                      <Cell key={idx} fill={idx === data.evolution_commandes!.length - 1 ? '#1D4ED8' : '#93C5FD'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-purple-50 text-purple-600"><PieChartIcon className="w-4 h-4" /></span>
              Répartition par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton height={280} />
            ) : !data?.repartition_categorie?.length ? (
              <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                <PieChartIcon className="w-10 h-10 mb-2" />
                <p className="text-sm">Aucune catégorie</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.repartition_categorie}
                    dataKey="total"
                    nameKey="categorie"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={2}
                  >
                    {data.repartition_categorie.map((_, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top produits / Top fournisseurs / Alertes / Variations de prix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600"><Trophy className="w-4 h-4" /></span>
              Top produits
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={32} />)
            ) : !data?.top_produits?.length ? (
              <div className="text-center py-10 text-gray-400 text-sm">Aucune vente enregistrée</div>
            ) : (
              data.top_produits.slice(0, 5).map((p: TopProduit, idx: number) => (
                <TopProduitRow key={p.id} produit={p} rank={idx} max={maxVendu} />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Crown className="w-4 h-4" /></span>
              Top fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={32} />)
            ) : !data?.top_fournisseurs?.length ? (
              <div className="text-center py-10 text-gray-400 text-sm">Aucun fournisseur</div>
            ) : (
              data.top_fournisseurs.slice(0, 5).map((f: TopFournisseur, idx: number) => (
                <TopFournisseurRow key={f.id} fournisseur={f} rank={idx} />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-red-50 text-red-600"><Bell className="w-4 h-4" /></span>
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton width="80%" height={14} />
                  <Skeleton width="40%" height={12} />
                </div>
              ))
            ) : (
              <>
                <AlerteBadge
                  label="Stock bas"
                  count={data?.alertes?.stock_bas?.length ?? 0}
                  className="bg-orange-50 text-orange-700"
                  onClick={() => navigate('/rapports/stock-bas')}
                />
                <AlerteBadge
                  label="Péremption proche"
                  count={data?.alertes?.peremption_proche?.length ?? 0}
                  className="bg-red-50 text-red-700"
                  onClick={() => navigate('/stock/lot-serie?peremption_proche=1')}
                />
                <AlerteBadge
                  label="Retours en attente"
                  count={stats?.retours_en_attente ?? 0}
                  className="bg-purple-50 text-purple-700"
                  onClick={() => navigate('/stock/retour?statut=EN%20ATTENTE')}
                />
                <AlerteBadge
                  label="Commandes à valider"
                  count={stats?.commandes_en_attente ?? 0}
                  className="bg-blue-50 text-blue-700"
                  onClick={() => navigate('/validation/bon-commande')}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="w-4 h-4" /></span>
              Variations de prix
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={32} />)
            ) : !data?.alertes?.variations_prix?.length ? (
              <div className="text-center py-10 text-gray-400 text-sm">Aucune variation de prix</div>
            ) : (
              data.alertes.variations_prix.slice(0, 5).map((v: VariationPrix) => (
                <VariationPrixRow key={v.id} variation={v} onClick={() => navigate(`/produits/${v.id}`)} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activités récentes / Accès rapide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Activity className="w-4 h-4" /></span>
              Activités récentes
            </CardTitle>
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

        <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-gray-50 to-white">
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
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-royal-500 hover:bg-royal-50 hover:shadow-md transition-all active:scale-95"
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

      <div className="text-center text-xs text-gray-600 pt-6 border-t border-gray-200">
        <p>© 2026 Fondeg Catering Congo S.A. All Rights Reserved.</p>
      </div>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className={cn('p-2.5 rounded-xl bg-gray-50', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-base font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TopProduitRow({ produit, rank, max }: { produit: TopProduit; rank: number; max: number }) {
  const pct = max > 0 ? Math.round((produit.total_vendu / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
          RANK_COLORS[rank] ?? 'bg-gray-100 text-gray-600',
        )}>
          {rank + 1}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-gray-800">{produit.nom}</span>
        <span className="text-sm font-bold text-gray-900">{produit.total_vendu}</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-royal-500 to-royal-700 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TopFournisseurRow({ fournisseur, rank }: { fournisseur: TopFournisseur; rank: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
        RANK_COLORS[rank] ?? 'bg-gray-100 text-gray-600',
      )}>
        {rank + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{fournisseur.nom}</p>
        <p className="text-xs text-gray-400">{fournisseur.total_commandes} bon{fournisseur.total_commandes > 1 ? 's' : ''} de commande</p>
      </div>
      <span className="text-sm font-bold text-emerald-600">{formatCurrency(fournisseur.total_montant)}</span>
    </div>
  );
}

function VariationPrixRow({ variation, onClick }: { variation: VariationPrix; onClick: () => void }) {
  const isHausse = variation.type === 'hausse';
  const Icon = isHausse ? ArrowUpRight : ArrowDownRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg bg-gray-50 transition-all hover:bg-gray-100 hover:shadow-sm active:scale-[0.99] cursor-pointer group text-left"
    >
      <span className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
        isHausse ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
      )}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{variation.nom}</p>
        <p className="text-xs text-gray-400">
          {formatCurrency(variation.ancien_prix)} → {formatCurrency(variation.nouveau_prix)}
        </p>
      </div>
      <span className={cn('text-xs font-bold', isHausse ? 'text-emerald-600' : 'text-red-600')}>
        {isHausse ? '+' : ''}{variation.pourcentage}%
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
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

function AlerteBadge({ label, count, className, onClick }: { label: string; count: number; className: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all hover:brightness-95 active:scale-[0.99] cursor-pointer group', className)}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-sm font-bold">{count}</span>
        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    </button>
  );
}
