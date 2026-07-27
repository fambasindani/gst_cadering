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
import type { RapportSortieData } from '../../types/rapport';
import { RefreshCw, FileText, Download, Package, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

export function RapportSortie() {
  const [data, setData] = useState<RapportSortieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const sorties = data?.sorties_par_produit ?? [];
  const stats = data?.statistiques;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const displayed = sorties.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = sorties.length;
  const lastPage = Math.ceil(total / pageSize);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.date_debut = dateFrom;
      if (dateTo) params.date_fin = dateTo;
      const res = await rapportService.rapportSortie(params);
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
    { key: 'code', label: 'Code article', width: '20%', render: (r) => r.code },
    { key: 'produit', label: 'Produit', width: '35%', render: (r) => r.produit },
    { key: 'qte', label: 'Qté totale', width: '20%', align: 'right', render: (r) => r.qte },
    { key: 'sorties', label: 'Nb sorties', width: '25%', align: 'right', render: (r) => r.sorties },
  ];

  const pdfRows = sorties.map((s) => ({
    code: s.produit.code_article,
    produit: s.produit.nom,
    qte: String(s.quantite_totale),
    sorties: String(s.sorties.length),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport sorties</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${sorties.length} produit${sorties.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {sorties.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport sorties"
                  subtitle={dateFrom || dateTo ? `Du ${dateFrom || '...'} au ${dateTo || '...'}` : undefined}
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={[
                    { label: 'Total sorties', value: String(stats?.total_sorties ?? 0) },
                    { label: 'Qté totale', value: String(stats?.total_quantite ?? 0) },
                  ]}
                  totals={[
                    { label: 'Total sorties', value: String(stats?.total_sorties ?? 0) },
                    { label: 'Qté totale', value: String(stats?.total_quantite ?? 0) },
                  ]}
                />
              }
              fileName="rapport-sorties.pdf"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-royal-50">
                <Package className="w-5 h-5 text-royal-700" />
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
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <Package className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Qté totale</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_quantite ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Sorties par produit</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code article</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté totale</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Nb sorties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 bg-gray-200 rounded" style={{ width: `${60 + j * 15}px` }} /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : sorties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune donnée</p>
              <p className="text-sm mt-1">Aucune sortie trouvée pour cette période</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code article</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté totale</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Nb sorties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((s, i) => (
                    <TableRow key={s.produit.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-mono text-sm font-medium text-royal-700">{s.produit.code_article}</TableCell>
                      <TableCell className="font-medium text-gray-900">{s.produit.nom}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{s.quantite_totale}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{s.sorties.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DataTablePagination currentPage={currentPage} lastPage={lastPage} pageSize={pageSize} total={total} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
