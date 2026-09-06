import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { rapportService } from '../../services/rapport';
import { tauxConversionService } from '../../services/taux-conversion';
import { DeviseSelect } from '../../components/ui/DeviseSelect';
import type { ConsommationClientDetail } from '../../types/rapport';
import {
  ArrowLeft, Users, Package, DollarSign, TrendingUp,
  FileText, Eye, Building2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

export function ConsommationClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<ConsommationClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tauxCdf, setTauxCdf] = useState<number | null>(null);
  const [devise, setDevise] = useState<'USD' | 'CDF'>('USD');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      const dd = searchParams.get('date_debut');
      const df = searchParams.get('date_fin');
      if (dd) params.date_debut = dd;
      if (df) params.date_fin = df;
      const res = await rapportService.consommationClientDetail(Number(id), Object.keys(params).length ? params : undefined);
      if (res.success) setData(res.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [id, searchParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    tauxConversionService.getActuel()
      .then((tres) => { if (tres.success && tres.data) setTauxCdf(tres.data.taux); })
      .catch(() => {});
  }, []);

  const client = data?.client;
  const mouvements = data?.mouvements ?? [];
  const details = data?.details_produits ?? [];
  const stats = data?.statistiques;

  const fmt = (amount: number) =>
    devise === 'CDF' && tauxCdf != null
      ? formatCurrency(amount * tauxCdf, 'CDF')
      : formatCurrency(amount, '$');

  const displayed = mouvements.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = mouvements.length;
  const lastPage = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Client non trouvé</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/rapports/consommations')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rapports/consommations')} className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{client.nom}</h1>
              {client.code_iata && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-royal-100 text-royal-700">{client.code_iata}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">{client.email || client.telephone || ''}</p>
          </div>
        </div>
        <DeviseSelect value={devise} onChange={setDevise} />
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-royal-100"
          iconColor="text-royal-700"
          label="Sorties"
          value={String(stats?.total_sorties ?? 0)}
        />
        <SummaryCard
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          label="Produits consommés"
          value={String(stats?.total_produits ?? 0)}
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          label="Valeur totale"
          value={fmt(stats?.total_valeur ?? 0)}
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-purple-100"
          iconColor="text-purple-700"
          label="Moy. produits/sortie"
          value={String(stats?.moyenne_par_sortie ?? 0)}
        />
      </div>

      {/* Détail des produits */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-royal-600" />
            Produits consommés ({details.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                  <TableHead className="font-semibold text-gray-600">Code</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">Qté totale</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">N° sorties</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((d, i) => (
                  <TableRow key={d.produit?.id ?? i} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                    <TableCell className="font-medium text-gray-900">{d.produit?.nom || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono">{d.produit?.code_article || '-'}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">{d.quantite_totale}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">{d.nombre_sorties}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">{fmt(d.valeur_totale)}</TableCell>
                  </TableRow>
                ))}
                {details.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={2} className="text-right text-gray-700">TOTAL</TableCell>
                    <TableCell className="text-right font-mono text-sm">{stats?.total_produits ?? 0}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{stats?.total_sorties ?? 0}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(stats?.total_valeur ?? 0)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Liste des sorties */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4 text-royal-600" />
            Détail des sorties ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-600">Date</TableHead>
                  <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                  <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                  <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">Prix unit.</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((m, i) => {
                  const produit = m.lot?.produit;
                  const prix = Number(m.lot?.prix_achat_ht_unitaire ?? 0);
                  const valeur = Math.abs(m.quantite) * prix;
                  return (
                    <TableRow key={m.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="text-sm text-gray-600">{m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-'}</TableCell>
                      <TableCell className="font-medium text-gray-900">{produit?.nom || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-500 font-mono">{m.lot?.numero_lot || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {m.lot?.magasin?.nom || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{Math.abs(m.quantite)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{fmt(prix)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{fmt(valeur)}</TableCell>
                    </TableRow>
                  );
                })}
                {displayed.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Aucune sortie</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {total > 20 && (
            <DataTablePagination currentPage={currentPage} lastPage={lastPage} pageSize={pageSize} total={total} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, iconBg, iconColor, label, value }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', iconBg)}>
            <span className={iconColor}>{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900 font-mono truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
