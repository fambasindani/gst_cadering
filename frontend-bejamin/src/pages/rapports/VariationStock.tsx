import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RapportTablePDF } from '../../components/pdf/RapportTablePDF';
import type { Column } from '../../components/pdf/RapportTablePDF';
import { rapportService } from '../../services/rapport';
import type { VariationStockData } from '../../types/rapport';
import { RefreshCw, TrendingUp, Download, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

export function VariationStock() {
  const [data, setData] = useState<VariationStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const mouvements = data?.mouvements ?? [];
  const stats = data?.statistiques;
  const total = mouvements.length;
  const lastPage = Math.ceil(total / pageSize);
  const displayed = mouvements.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.date_debut = dateFrom;
      if (dateTo) params.date_fin = dateTo;
      const res = await rapportService.variationStock(params);
      if (res.success) {
        setData(res.data);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  const pdfColumns: Column[] = [
    { key: 'date', label: 'Date', width: '16%', render: (r) => r.date },
    { key: 'produit', label: 'Produit', width: '28%', render: (r) => r.produit },
    { key: 'type', label: 'Type', width: '18%', render: (r) => r.type },
    { key: 'qte', label: 'Qté', width: '14%', align: 'right', render: (r) => r.qte },
    { key: 'ville', label: 'Ville', width: '24%', render: (r) => r.ville },
  ];

  const pdfRows = mouvements.map((m) => ({
    date: m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-',
    produit: m.lot?.produit?.nom ?? '-',
    type: m.type_mouvement?.libelle ?? '-',
    qte: String(m.quantite),
    ville: m.lot?.ville?.nom ?? '-',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Variation de stock</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${stats?.total_mouvements ?? 0} mouvement${(stats?.total_mouvements ?? 0) > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {mouvements.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Variation de stock"
                  subtitle={dateFrom || dateTo ? `Du ${dateFrom || '...'} au ${dateTo || '...'}` : undefined}
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={stats ? [
                    { label: 'Total mouvements', value: String(stats.total_mouvements) },
                    { label: 'Total entrées', value: String(stats.total_entrees) },
                    { label: 'Total sorties', value: String(stats.total_sorties) },
                    { label: 'Variation', value: String(stats.variation) },
                  ] : undefined}
                  totals={[{ label: 'Variation nette', value: String(stats?.variation ?? 0) }]}
                />
              }
              fileName="variation-stock.pdf"
            >
              {({ loading: pdfLoading }) => (
                <Button variant="outline" disabled={pdfLoading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Download className="w-4 h-4 mr-1.5" />
                  {pdfLoading ? 'Génération...' : 'PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          )}
          <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Du :</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:border-royal-500 focus:ring-royal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Au :</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:border-royal-500 focus:ring-royal-500"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-royal-50">
                <ArrowUpDown className="w-5 h-5 text-royal-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total mouvements</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_mouvements ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total entrées</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_entrees ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50">
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total sorties</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_sorties ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-50">
                <TrendingUp className="w-5 h-5 text-violet-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Variation</p>
                <p className="text-xl font-bold text-gray-900">{stats?.variation ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Mouvements de stock</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Type</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="font-semibold text-gray-600">Ville</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 bg-gray-200 rounded" style={{ width: `${60 + j * 15}px` }} /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : mouvements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune donnée</p>
              <p className="text-sm mt-1">Aucun mouvement de stock trouvé pour cette période</p>
            </div>
          ) : (<>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Type</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="font-semibold text-gray-600">Ville</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((m, i) => (
                    <TableRow key={m.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="text-sm text-gray-600">{m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-'}</TableCell>
                      <TableCell className="font-medium text-gray-900">{m.lot?.produit?.nom ?? '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{m.type_mouvement?.libelle ?? '-'}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{m.quantite}</TableCell>
                      <TableCell className="text-sm text-gray-600">{m.lot?.ville?.nom ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DataTablePagination
              currentPage={currentPage}
              lastPage={lastPage}
              total={total}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </>)}
        </CardContent>
      </Card>
    </div>
  );
}
