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
import type { ConsommationsClientsData } from '../../types/rapport';
import { RefreshCw, FileText, Download, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

export function ConsommationsClients() {
  const [data, setData] = useState<ConsommationsClientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const consommations = data?.consommations ?? [];
  const stats = data?.statistiques;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const displayed = consommations.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = consommations.length;
  const lastPage = Math.ceil(total / pageSize);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.date_debut = dateFrom;
      if (dateTo) params.date_fin = dateTo;
      const res = await rapportService.consommationsClients(params);
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
    { key: 'client', label: 'Client', width: '26%', render: (r) => r.client },
    { key: 'commandes', label: 'N° commandes', width: '20%', align: 'right', render: (r) => r.commandes },
    { key: 'produits', label: 'Produits', width: '26%', align: 'right', render: (r) => r.produits },
    { key: 'moyenne', label: 'Moy/commande', width: '28%', align: 'right', render: (r) => r.moyenne },
  ];

  const pdfRows = consommations.map((c) => ({
    client: c.client.nom,
    commandes: String(c.total_commandes),
    produits: String(c.total_produits),
    moyenne: formatCurrency(c.moyenne_par_commande),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consommations clients</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${consommations.length} client${consommations.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {consommations.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Consommations clients"
                  subtitle={dateFrom || dateTo ? `Du ${dateFrom || '...'} au ${dateTo || '...'}` : undefined}
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={[
                    { label: 'Total clients', value: String(stats?.total_clients ?? 0) },
                    { label: 'Total commandes', value: String(stats?.total_commandes ?? 0) },
                    { label: 'Total produits', value: String(stats?.total_produits ?? 0) },
                  ]}
                  totals={[
                    { label: 'Total commandes', value: String(stats?.total_commandes ?? 0) },
                    { label: 'Total produits', value: String(stats?.total_produits ?? 0) },
                  ]}
                />
              }
              fileName="consommations-clients.pdf"
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
                <Users className="w-5 h-5 text-royal-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total clients</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_clients ?? 0}</p>
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
                <p className="text-xl font-bold text-gray-900">{stats?.total_commandes ?? 0}</p>
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
                <p className="text-xs text-gray-500 font-medium">Total produits</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_produits ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Consommations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">N° commandes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Produits</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Moy/commande</TableHead>
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
          ) : consommations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune donnée</p>
              <p className="text-sm mt-1">Aucune consommation trouvée pour cette période</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">N° commandes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Produits</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Moy/commande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((c, i) => (
                    <TableRow key={c.client.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-medium text-gray-900">{c.client.nom}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{c.total_commandes}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{c.total_produits}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{formatCurrency(c.moyenne_par_commande)}</TableCell>
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
