import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RapportTablePDF } from '../../components/pdf/RapportTablePDF';
import type { Column } from '../../components/pdf/RapportTablePDF';
import { rapportService } from '../../services/rapport';
import type { VariationPrix } from '../../types/dashboard';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';

function formatDateFr(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export function VariationsPrix() {
  const navigate = useNavigate();
  const [data, setData] = useState<VariationPrix[]>([]);
  const [stats, setStats] = useState<{ total: number; hausses: number; baisses: number }>({ total: 0, hausses: 0, baisses: 0 });
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const res = await rapportService.variationsPrix(params);
      if (res.success) {
        setData(res.data.variations);
        setStats(res.data.statistiques);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search.trim()
    ? data.filter((v) => v.nom.toLowerCase().includes(search.toLowerCase()))
    : data;

  const pdfColumns: Column[] = [
    { key: 'produit', label: 'Produit', width: '16%', render: (r) => r.produit },
    { key: 'ancien', label: 'Ancien prix', width: '12%', align: 'right', render: (r) => r.ancien },
    { key: 'nouveau', label: 'Nouveau prix', width: '12%', align: 'right', render: (r) => r.nouveau },
    { key: 'variation', label: 'Variation', width: '12%', align: 'right', render: (r) => r.variation },
    { key: 'pourcentage', label: '%', width: '10%', align: 'right', render: (r) => r.pourcentage },
    { key: 'type', label: 'Type', width: '14%', render: (r) => r.type },
    { key: 'date', label: 'Date', width: '12%', render: (r) => r.date },
  ];

  const pdfRows = filtered.map((v) => ({
    produit: v.nom,
    ancien: formatCurrency(v.ancien_prix, '$'),
    nouveau: formatCurrency(v.nouveau_prix, '$'),
    variation: `${v.type === 'hausse' ? '+' : ''}${formatCurrency(v.variation, '$')}`,
    pourcentage: `${v.type === 'hausse' ? '+' : ''}${v.pourcentage} %`,
    type: v.type === 'hausse' ? 'Hausse' : 'Baisse',
    date: v.date || '-',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Variations de prix</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${stats.total} variation${stats.total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Variations de prix"
                  orientation="landscape"
                  columns={pdfColumns}
                  rows={pdfRows}
                  period={dateDebut || dateFin ? `Période : du ${formatDateFr(dateDebut) || '...'} au ${formatDateFr(dateFin) || '...'}` : undefined}
                  stats={[
                    { label: 'Total variations', value: String(stats.total) },
                    { label: 'Hausses', value: String(stats.hausses) },
                    { label: 'Baisses', value: String(stats.baisses) },
                  ]}
                />
              }
              fileName="variations-prix.pdf"
            >
              {({ loading: pdfLoading }) => (
                <Button variant="outline" disabled={pdfLoading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Download className="w-4 h-4 mr-1.5" />
                  {pdfLoading ? 'Génération...' : 'PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          )}
          <Button variant="outline" onClick={fetchData} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-blue-50"><TrendingUp className="w-5 h-5 text-blue-600" /></span>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total variations</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-emerald-50"><TrendingUp className="w-5 h-5 text-emerald-600" /></span>
            <div>
              <p className="text-xs text-gray-500 font-medium">Hausses</p>
              <p className="text-xl font-bold text-emerald-700">{stats.hausses}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-red-50"><TrendingDown className="w-5 h-5 text-red-600" /></span>
            <div>
              <p className="text-xs text-gray-500 font-medium">Baisses</p>
              <p className="text-xl font-bold text-red-700">{stats.baisses}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">Produit</label>
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit..."
                className="h-11 border-gray-200 shadow-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Période
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">du</span>
                  <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="h-11 border-gray-200 shadow-sm w-44" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">au</span>
                  <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="h-11 border-gray-200 shadow-sm w-44" />
                </div>
              </div>
            </div>
            <Button onClick={fetchData} disabled={loading} className="h-11 px-6 bg-royal-700 hover:bg-royal-800 text-white shadow-sm font-medium">
              Appliquer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <div className="h-12 bg-gray-100" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={cn('h-14 animate-pulse', i % 2 === 0 ? 'bg-white' : 'bg-gray-50')} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune variation de prix</p>
              <p className="text-sm mt-1">Aucun produit n'a changé de prix sur la période sélectionnée</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left font-semibold text-gray-600 px-4 py-3">Produit</th>
                    <th className="text-right font-semibold text-gray-600 px-4 py-3">Ancien prix</th>
                    <th className="text-right font-semibold text-gray-600 px-4 py-3">Nouveau prix</th>
                    <th className="text-right font-semibold text-gray-600 px-4 py-3">Variation</th>
                    <th className="text-right font-semibold text-gray-600 px-4 py-3">%</th>
                    <th className="text-center font-semibold text-gray-600 px-4 py-3">Type</th>
                    <th className="text-center font-semibold text-gray-600 px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/produits/${v.id}`)}
                      className={cn('hover:bg-royal-50/50 transition-colors cursor-pointer', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{v.nom}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(v.ancien_prix, '$')}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">{formatCurrency(v.nouveau_prix, '$')}</td>
                      <td className={cn('px-4 py-3 text-right font-mono font-semibold', v.type === 'hausse' ? 'text-emerald-700' : 'text-red-700')}>
                        {v.type === 'hausse' ? '+' : ''}{formatCurrency(v.variation, '$')}
                      </td>
                      <td className={cn('px-4 py-3 text-right font-mono font-semibold', v.type === 'hausse' ? 'text-emerald-700' : 'text-red-700')}>
                        {v.type === 'hausse' ? '+' : ''}{v.pourcentage} %
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                          v.type === 'hausse' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                        )}>
                          {v.type === 'hausse' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {v.type === 'hausse' ? 'Hausse' : 'Baisse'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{v.date || formatDateFr('')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}