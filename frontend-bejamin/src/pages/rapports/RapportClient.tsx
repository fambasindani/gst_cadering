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
import type { ClientRapport } from '../../types/rapport';
import { RefreshCw, FileText, Users, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

export function RapportClient() {
  const [data, setData] = useState<ClientRapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const totalCommandes = data.reduce((s, c) => s + c.statistiques.total_commandes, 0);
  const totalMontant = data.reduce((s, c) => s + c.statistiques.total_montant, 0);
  const totalProduits = data.reduce((s, c) => s + c.statistiques.total_produits, 0);
  const total = data.length;
  const lastPage = Math.ceil(total / pageSize);
  const displayed = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.date_debut = dateFrom;
      if (dateTo) params.date_fin = dateTo;
      const res = await rapportService.rapportClient(params);
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
    { key: 'client', label: 'Client', width: '24%', render: (r) => r.client },
    { key: 'commandes', label: 'N° commandes', width: '16%', align: 'right', render: (r) => r.commandes },
    { key: 'montant', label: 'Montant total', width: '22%', align: 'right', render: (r) => r.montant },
    { key: 'produits', label: 'Produits', width: '16%', align: 'right', render: (r) => r.produits },
    { key: 'moyenne', label: 'Moyenne/commande', width: '22%', align: 'right', render: (r) => r.moyenne },
  ];

  const pdfRows = data.map((c) => ({
    client: c.client.nom,
    commandes: String(c.statistiques.total_commandes),
    montant: formatCurrency(c.statistiques.total_montant),
    produits: String(c.statistiques.total_produits),
    moyenne: formatCurrency(c.statistiques.moyenne_par_commande),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport clients</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${data.length} client${data.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {data.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport clients"
                  subtitle={dateFrom || dateTo ? `Du ${dateFrom || '...'} au ${dateTo || '...'}` : undefined}
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={[
                    { label: 'Total clients', value: String(data.length) },
                    { label: 'Total commandes', value: String(totalCommandes) },
                    { label: 'Montant total', value: formatCurrency(totalMontant) },
                    { label: 'Total produits', value: String(totalProduits) },
                  ]}
                  totals={[
                    { label: 'Total commandes', value: String(totalCommandes) },
                    { label: 'Montant total', value: formatCurrency(totalMontant) },
                  ]}
                />
              }
              fileName="rapport-client.pdf"
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
                <Users className="w-5 h-5 text-royal-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total clients</p>
                <p className="text-xl font-bold text-gray-900">{data.length}</p>
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
                <p className="text-xs text-gray-500 font-medium">Total commandes</p>
                <p className="text-xl font-bold text-gray-900">{totalCommandes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50">
                <FileText className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Montant total</p>
                <p className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(totalMontant)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-50">
                <Users className="w-5 h-5 text-violet-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total produits</p>
                <p className="text-xl font-bold text-gray-900">{totalProduits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">N° commandes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant total</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Produits</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Moyenne/commande</TableHead>
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
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune donnée</p>
              <p className="text-sm mt-1">Aucune activité client trouvée pour cette période</p>
            </div>
          ) : (<>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">N° commandes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant total</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Produits</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Moyenne/commande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((c, i) => (
                    <TableRow key={c.client.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-medium text-gray-900">{c.client.nom}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{c.statistiques.total_commandes}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{formatCurrency(c.statistiques.total_montant)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{c.statistiques.total_produits}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{formatCurrency(c.statistiques.moyenne_par_commande)}</TableCell>
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
