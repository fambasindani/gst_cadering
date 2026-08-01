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
import type { BonCommandeRapport } from '../../types/rapport';
import { RefreshCw, FileText, ShoppingCart, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

export function BonCommandeRapport() {
  const [data, setData] = useState<BonCommandeRapport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const bons = data?.bons_commande ?? [];
  const stats = data?.statistiques;
  const total = bons.length;
  const lastPage = Math.ceil(total / pageSize);
  const displayed = bons.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.date_debut = dateFrom;
      if (dateTo) params.date_fin = dateTo;
      const res = await rapportService.bonCommande(params);
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
    { key: 'numero', label: 'N° commande', width: '18%', render: (r) => r.numero },
    { key: 'date', label: 'Date', width: '14%', render: (r) => r.date },
    { key: 'fournisseur', label: 'Fournisseur', width: '25%', render: (r) => r.fournisseur },
    { key: 'magasin', label: 'Magasin', width: '15%', render: (r) => r.magasin },
    { key: 'nbLignes', label: 'Nb lignes', width: '12%', align: 'right', render: (r) => r.nbLignes },
    { key: 'montant', label: 'Montant HT', width: '16%', align: 'right', render: (r) => r.montant },
  ];

  const pdfRows = bons.map((b) => ({
    numero: b.numero_commande,
    date: b.date_commande ? new Date(b.date_commande).toLocaleDateString('fr-FR') : '-',
    fournisseur: b.partenaire?.nom ?? '-',
    magasin: b.magasin_destination?.nom ?? '-',
    nbLignes: String(b.lignes?.length ?? 0),
    montant: formatCurrency(b.montant_total_ht),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport bons de commande</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${stats?.total_bons ?? 0} bon${(stats?.total_bons ?? 0) > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {bons.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport bons de commande"
                  subtitle={dateFrom || dateTo ? `Du ${dateFrom || '...'} au ${dateTo || '...'}` : undefined}
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={stats ? [
                    { label: 'Total bons', value: String(stats.total_bons) },
                    { label: 'Total lignes', value: String(stats.total_lignes) },
                    { label: 'Montant total', value: formatCurrency(stats.total_montant_ht) },
                  ] : undefined}
                  totals={[{ label: 'Montant total HT', value: formatCurrency(stats?.total_montant_ht ?? 0) }]}
                />
              }
              fileName="rapport-bon-commande.pdf"
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-royal-50">
                <ShoppingCart className="w-5 h-5 text-royal-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total bons</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_bons ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <FileText className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total lignes</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_lignes ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50">
                <ShoppingCart className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Montant total</p>
                <p className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(stats?.total_montant_ht ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Bons de commande</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">N° commande</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Fournisseur</TableHead>
                    <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Nb lignes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 bg-gray-200 rounded" style={{ width: `${60 + j * 15}px` }} /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : bons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune donnée</p>
              <p className="text-sm mt-1">Aucun bon de commande trouvé pour cette période</p>
            </div>
          ) : (<>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">N° commande</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Fournisseur</TableHead>
                    <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Nb lignes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((b, i) => (
                    <TableRow key={b.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-mono text-sm font-medium text-royal-700">{b.numero_commande}</TableCell>
                      <TableCell className="text-sm text-gray-600">{b.date_commande ? new Date(b.date_commande).toLocaleDateString('fr-FR') : '-'}</TableCell>
                      <TableCell className="font-medium text-gray-900">{b.partenaire?.nom ?? '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{b.magasin_destination?.nom ?? '-'}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{b.lignes?.length ?? 0}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{formatCurrency(b.montant_total_ht)}</TableCell>
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
