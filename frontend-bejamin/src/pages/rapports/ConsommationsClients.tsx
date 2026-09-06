import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RapportTablePDF } from '../../components/pdf/RapportTablePDF';
import type { Column } from '../../components/pdf/RapportTablePDF';
import { rapportService } from '../../services/rapport';
import { tauxConversionService } from '../../services/taux-conversion';
import { partenaireService } from '../../services/partenaire';
import { DeviseSelect } from '../../components/ui/DeviseSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import type { ConsommationsClientsData } from '../../types/rapport';
import { RefreshCw, FileText, Download, Users, DollarSign, Eye, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { DataTablePagination } from '../../components/ui/DataTablePagination';
import { downloadCsv } from '../../lib/exportCsv';

export function ConsommationsClients() {
  const navigate = useNavigate();
  const [data, setData] = useState<ConsommationsClientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientOptions, setClientOptions] = useState<{ id: number; nom: string }[]>([]);
  const [tauxCdf, setTauxCdf] = useState<number | null>(null);
  const [devise, setDevise] = useState<'USD' | 'CDF'>('USD');

  const consommations = data?.consommations ?? [];
  const stats = data?.statistiques;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const displayed = consommations.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = consommations.length;
  const lastPage = Math.ceil(total / pageSize);

  useEffect(() => {
    partenaireService.getClients({ per_page: '500' })
      .then((res) => { if (res.success && res.data) setClientOptions(res.data.data); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (clientId) params.client_id = String(clientId);
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
  }, [clientId, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    tauxConversionService.getActuel()
      .then((tres) => { if (tres.success && tres.data) setTauxCdf(tres.data.taux); })
      .catch(() => {});
  }, []);

  const handleReset = () => {
    setClientId(null);
    setDateFrom('');
    setDateTo('');
  };

  const exportCsv = async () => {
    const params: Record<string, string> = {};
    if (clientId) params.client_id = String(clientId);
    if (dateFrom) params.date_debut = dateFrom;
    if (dateTo) params.date_fin = dateTo;
    await downloadCsv('/rapports/consommations-clients/export', params, 'consommations-clients.csv');
  };

  const colMoyenneLabel = devise === 'CDF' ? 'Moy/commande (CDF)' : 'Moy/commande';

  const pdfColumns: Column[] = [
    { key: 'client', label: 'Client', width: '26%', render: (r) => r.client },
    { key: 'commandes', label: 'N° commandes', width: '20%', align: 'right', render: (r) => r.commandes },
    { key: 'produits', label: 'Produits', width: '24%', align: 'right', render: (r) => r.produits },
    { key: 'moyenne', label: colMoyenneLabel, width: '30%', align: 'right', render: (r) => r.moyenne },
  ];

  const pdfRows = consommations.map((c) => ({
    client: c.client.nom,
    commandes: String(c.total_commandes),
    produits: String(c.total_produits),
    moyenne: devise === 'CDF' && tauxCdf != null ? formatCurrency(c.moyenne_par_commande * tauxCdf, 'CDF') : formatCurrency(c.moyenne_par_commande, '$'),
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
            <Button variant="outline" onClick={() => { exportCsv().catch(() => {}); }} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-1.5" /> CSV / Excel
            </Button>
          )}
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
          <Button variant="outline" onClick={handleReset} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Réinitialiser
          </Button>
          <Button variant="outline" onClick={fetchData} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                Client
              </label>
              <SearchableSelect
                options={clientOptions.map((c) => ({ id: c.id, nom: c.nom }))}
                value={clientId ? String(clientId) : ''}
                onValueChange={(val: string) => setClientId(val ? Number(val) : null)}
                placeholder="Tous les clients"
                className="h-11"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                Période
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">du</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-11 border-gray-200 shadow-sm w-44"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">au</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-11 border-gray-200 shadow-sm w-44"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Devise
              </label>
              <DeviseSelect value={devise} onChange={setDevise} />
            </div>
            <Button onClick={fetchData} disabled={loading} className="h-11 px-6 bg-royal-700 hover:bg-royal-800 text-white shadow-sm font-medium">
              Générer
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <p className="text-xs text-gray-500 font-medium">Total sorties</p>
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

      {/* Top 5 meilleurs clients */}
      {consommations.length > 0 && (
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-royal-50 text-royal-600"><TrendingUp className="w-4 h-4" /></span>
              Top 5 meilleurs clients
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {[...consommations]
              .sort((a, b) => b.total_produits - a.total_produits)
              .slice(0, 5)
              .map((c, i) => {
                const maxProduits = Math.max(...consommations.map((x) => x.total_produits), 1);
                const pct = Math.round((c.total_produits / maxProduits) * 100);
                const RANK_COLORS = ['bg-amber-400 text-amber-950', 'bg-gray-300 text-gray-700', 'bg-orange-300 text-orange-900'];
                return (
                  <div key={c.client.id} className="cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 -m-1.5 transition-colors" onClick={() => navigate(`/rapports/consommations/${c.client.id}`)}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        RANK_COLORS[i] ?? 'bg-gray-100 text-gray-600',
                      )}>
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium text-gray-800">{c.client.nom}</span>
                      <span className="text-sm font-bold text-gray-900">{c.total_produits} produits</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-royal-500 to-royal-700 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{c.total_commandes} sortie{c.total_commandes > 1 ? 's' : ''}</p>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">N° commandes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Produits</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">{colMoyenneLabel}</TableHead>
                    <TableHead className="w-12"></TableHead>
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
                    <TableHead className="text-right font-semibold text-gray-600">{colMoyenneLabel}</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600 w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((c, i) => (
                    <TableRow key={c.client.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-medium text-gray-900">{c.client.nom}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{c.total_commandes}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{c.total_produits}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{devise === 'CDF' && tauxCdf != null ? formatCurrency(c.moyenne_par_commande * tauxCdf, 'CDF') : formatCurrency(c.moyenne_par_commande, '$')}</TableCell>
                      <TableCell className="text-center">
                        <button onClick={() => navigate(`/rapports/consommations/${c.client.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-royal-700 hover:bg-royal-50 transition-colors" title="Voir les détails">
                          <Eye className="w-4 h-4" />
                        </button>
                      </TableCell>
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
