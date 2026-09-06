import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '../../components/ui/card';
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
import type { FournisseurRapport } from '../../types/rapport';
import { RefreshCw, FileText, Download, DollarSign, Users, Store } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { DataTablePagination } from '../../components/ui/DataTablePagination';
import { downloadCsv } from '../../lib/exportCsv';

export function RapportFournisseur() {
  const [data, setData] = useState<FournisseurRapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fournisseurId, setFournisseurId] = useState<number | null>(null);
  const [fournisseurOptions, setFournisseurOptions] = useState<{ id: number; nom: string }[]>([]);
  const [tauxCdf, setTauxCdf] = useState<number | null>(null);
  const [devise, setDevise] = useState<'USD' | 'CDF'>('USD');

  const totalCommandes = data.reduce((s, f) => s + f.statistiques.total_commandes, 0);
  const totalMontant = data.reduce((s, f) => s + f.statistiques.total_montant, 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const displayed = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = data.length;
  const lastPage = Math.ceil(total / pageSize);

  useEffect(() => {
    partenaireService.getFournisseurs({ per_page: '500' })
      .then((res) => { if (res.success && res.data) setFournisseurOptions(res.data.data); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (fournisseurId) params.fournisseur_id = String(fournisseurId);
      if (dateFrom) params.date_debut = dateFrom;
      if (dateTo) params.date_fin = dateTo;
      const res = await rapportService.rapportFournisseur(params);
      if (res.success) {
        setData(res.data);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [fournisseurId, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    tauxConversionService.getActuel()
      .then((tres) => { if (tres.success && tres.data) setTauxCdf(tres.data.taux); })
      .catch(() => {});
  }, []);

  const handleReset = () => {
    setFournisseurId(null);
    setDateFrom('');
    setDateTo('');
  };

  const exportCsv = async () => {
    const params: Record<string, string> = {};
    if (fournisseurId) params.fournisseur_id = String(fournisseurId);
    if (dateFrom) params.date_debut = dateFrom;
    if (dateTo) params.date_fin = dateTo;
    await downloadCsv('/rapports/fournisseur/export', params, 'rapport-fournisseurs.csv');
  };

  const colMontantLabel = devise === 'CDF' ? 'Montant total (CDF)' : 'Montant total';
  const colMoyenneLabel = devise === 'CDF' ? 'Moyenne/commande (CDF)' : 'Moyenne/commande';

  const pdfColumns: Column[] = [
    { key: 'fournisseur', label: 'Fournisseur', width: '20%', render: (r) => r.fournisseur },
    { key: 'commandes', label: 'N° commandes', width: '14%', align: 'right', render: (r) => r.commandes },
    { key: 'montant', label: colMontantLabel, width: '20%', align: 'right', render: (r) => r.montant },
    { key: 'produits', label: 'Produits', width: '12%', align: 'right', render: (r) => r.produits },
    { key: 'moyenne', label: colMoyenneLabel, width: '20%', align: 'right', render: (r) => r.moyenne },
  ];

  const pdfRows = data.map((f) => ({
    fournisseur: f.fournisseur.nom,
    commandes: String(f.statistiques.total_commandes),
    montant: devise === 'CDF' && tauxCdf != null ? formatCurrency(f.statistiques.total_montant * tauxCdf, 'CDF') : formatCurrency(f.statistiques.total_montant, '$'),
    produits: String(f.statistiques.total_produits),
    moyenne: devise === 'CDF' && tauxCdf != null ? formatCurrency(f.statistiques.moyenne_par_commande * tauxCdf, 'CDF') : formatCurrency(f.statistiques.moyenne_par_commande, '$'),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport fournisseurs</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${data.length} fournisseur${data.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {data.length > 0 && (
            <Button variant="outline" onClick={() => { exportCsv().catch(() => {}); }} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-1.5" /> CSV / Excel
            </Button>
          )}
          {data.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport fournisseurs"
                  subtitle={dateFrom || dateTo ? `Du ${dateFrom || '...'} au ${dateTo || '...'}` : undefined}
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={[
                    { label: 'Total fournisseurs', value: String(data.length) },
                    { label: 'Total commandes', value: String(totalCommandes) },
                    { label: 'Montant total', value: devise === 'CDF' && tauxCdf != null ? formatCurrency(totalMontant * tauxCdf, 'CDF') : formatCurrency(totalMontant, '$') },
                  ]}
                  totals={[
                    { label: 'Total commandes', value: String(totalCommandes) },
                    { label: 'Montant total', value: devise === 'CDF' && tauxCdf != null ? formatCurrency(totalMontant * tauxCdf, 'CDF') : formatCurrency(totalMontant, '$') },
                  ]}
                />
              }
              fileName="rapport-fournisseurs.pdf"
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
                <Store className="w-4 h-4 text-gray-400" />
                Fournisseur
              </label>
              <SearchableSelect
                options={fournisseurOptions.map((f) => ({ id: f.id, nom: f.nom }))}
                value={fournisseurId ? String(fournisseurId) : ''}
                onValueChange={(val: string) => setFournisseurId(val ? Number(val) : null)}
                placeholder="Tous les fournisseurs"
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
                <p className="text-xs text-gray-500 font-medium">Total fournisseurs</p>
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
                <DollarSign className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Montant total</p>
                <p className="text-xl font-bold text-gray-900 font-mono">{devise === 'CDF' && tauxCdf != null ? formatCurrency(totalMontant * tauxCdf, 'CDF') : formatCurrency(totalMontant, '$')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Fournisseur</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">N° commandes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">{colMontantLabel}</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Produits</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">{colMoyenneLabel}</TableHead>
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
              <p className="text-sm mt-1">Aucune activité fournisseur trouvée pour cette période</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Fournisseur</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">N° commandes</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">{colMontantLabel}</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Produits</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">{colMoyenneLabel}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((f, i) => (
                    <TableRow key={f.fournisseur.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-medium text-gray-900">{f.fournisseur.nom}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{f.statistiques.total_commandes}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{devise === 'CDF' && tauxCdf != null ? formatCurrency(f.statistiques.total_montant * tauxCdf, 'CDF') : formatCurrency(f.statistiques.total_montant, '$')}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{f.statistiques.total_produits}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{devise === 'CDF' && tauxCdf != null ? formatCurrency(f.statistiques.moyenne_par_commande * tauxCdf, 'CDF') : formatCurrency(f.statistiques.moyenne_par_commande, '$')}</TableCell>
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
