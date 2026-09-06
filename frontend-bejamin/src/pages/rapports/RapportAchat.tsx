import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { StatutMouvementBadge } from '../../components/ui/StatutMouvementBadge';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import type { RapportAchatData } from '../../types/rapport';
import { RefreshCw, Package, Download, Calendar, Store, DollarSign, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { downloadCsv } from '../../lib/exportCsv';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

function formatNumber(v: number): string {
  return (v ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatMoney(v: number, devise?: string): string {
  const formatted = formatNumber(v ?? 0);
  return devise ? `${formatted} ${devise}` : formatted;
}

function formatDateFr(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export function RapportAchat() {
  const navigate = useNavigate();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [fournisseurId, setFournisseurId] = useState<number | null>(null);
  const [fournisseurOptions, setFournisseurOptions] = useState<{ id: number; nom: string }[]>([]);
  const [data, setData] = useState<RapportAchatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [tauxCdf, setTauxCdf] = useState<number | null>(null);
  const [devise, setDevise] = useState<'USD' | 'CDF'>('USD');

  const lignes = data?.lignes ?? [];
  const stats = data?.statistiques;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const displayed = lignes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = lignes.length;
  const lastPage = Math.ceil(total / pageSize);

  useEffect(() => {
    partenaireService.getFournisseurs({ per_page: '500' })
      .then((res) => { if (res.success && res.data) setFournisseurOptions(res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    tauxConversionService.getActuel()
      .then((tres) => { if (tres.success && tres.data) setTauxCdf(tres.data.taux); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (fournisseurId) params.fournisseur_id = String(fournisseurId);
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const res = await rapportService.achatFull(params);
      if (res.success) {
        setData(res.data);
        setSearched(true);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [fournisseurId, dateDebut, dateFin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReset = () => {
    setFournisseurId(null);
    setDateDebut('');
    setDateFin('');
  };

  const exportCsv = async () => {
    const params: Record<string, string> = {};
    if (fournisseurId) params.fournisseur_id = String(fournisseurId);
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    await downloadCsv('/rapports/achat-full/export', params, 'rapport-achats.csv');
  };

  const deviseCode = devise === 'CDF' ? 'CDF' : '$';

  const pdfColumns: Column[] = [
    { key: 'numero', label: 'N°', width: '4%', align: 'right', render: (r) => r.numero },
    { key: 'date', label: 'Date', width: '10%', render: (r) => r.date },
    { key: 'article', label: 'Article', width: '22%', render: (r) => r.article },
    { key: 'unite', label: 'Unit', width: '6%', render: (r) => r.unite },
    { key: 'prix', label: 'Prix unit', width: '12%', align: 'right', render: (r) => formatMoney(Number(r.prix_unitaire), deviseCode) },
    { key: 'qte', label: 'Qté', width: '8%', align: 'right', render: (r) => r.quantite },
    { key: 'valeur', label: devise === 'CDF' ? 'Valeur (CDF)' : 'Valeur', width: '13%', align: 'right', render: (r) => r.valeur },
    { key: 'fournisseur', label: 'Fournisseur', width: '8%', render: (r) => r.fournisseur },
    { key: 'statut', label: 'Statut', width: '7%', render: (r) => r.statut },
  ];

  const pdfRows = lignes.map((l) => ({
    numero: String(l.numero),
    date: formatDateFr(l.date),
    article: l.article,
    unite: l.unite,
    devise: l.devise,
    prix_unitaire: String(devise === 'CDF' && tauxCdf != null ? (Number(l.prix_unitaire) * tauxCdf).toFixed(2) : l.prix_unitaire),
    quantite: String(l.quantite),
    valeur: devise === 'CDF' && tauxCdf != null ? formatMoney(Number(l.valeur) * tauxCdf, 'CDF') : formatMoney(Number(l.valeur), '$'),
    fournisseur: l.fournisseur || '—',
    statut: l.statut === 'REJETÉ' ? 'Rejeté' : 'Validé',
  }));

  const selectedFournisseur = fournisseurOptions.find((f) => f.id === fournisseurId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport achats</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${lignes.length} ligne${lignes.length > 1 ? 's' : ''}`}
            {!loading && (stats?.total_rejets ?? 0) > 0 && (
              <span className="text-red-600 font-medium"> (dont {stats?.total_rejets} rejetée{(stats?.total_rejets ?? 0) > 1 ? 's' : ''}, hors totaux)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lignes.length > 0 && (
            <Button variant="outline" onClick={() => { exportCsv().catch(() => {}); }} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-1.5" /> CSV / Excel
            </Button>
          )}
          {lignes.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport achats"
                  orientation="landscape"
                  columns={pdfColumns}
                  rows={pdfRows}
                  period={`Période : du ${formatDateFr(dateDebut || '')} au ${formatDateFr(dateFin || '')}${selectedFournisseur ? ` — Fournisseur : ${selectedFournisseur.nom}` : ''}`}
                  stats={[
                    { label: 'Lignes', value: formatNumber(stats?.total_lignes ?? 0) },
                    { label: 'Qté totale', value: formatNumber(stats?.total_quantite ?? 0) },
                    { label: 'Valeur totale', value: devise === 'CDF' && tauxCdf != null ? formatMoney((stats?.total_valeur ?? 0) * tauxCdf, 'CDF') : formatMoney(stats?.total_valeur ?? 0, '$') },
                    ...(stats?.total_rejets ? [{ label: 'Rejets (hors totaux)', value: formatNumber(stats.total_rejets) }] : []),
                  ]}
                />
              }
              fileName="rapport-achats.pdf"
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
                <Calendar className="w-4 h-4 text-gray-400" />
                Période
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">du</span>
                  <Input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="h-11 border-gray-200 shadow-sm w-44"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">au</span>
                  <Input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
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

      {!loading && lignes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-royal-50">
                  <Package className="w-5 h-5 text-royal-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Lignes</p>
                  <p className="text-xl font-bold text-gray-900">{stats?.total_lignes ?? 0}</p>
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
                  <p className="text-xl font-bold text-gray-900">{formatNumber(stats?.total_quantite ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-50">
                  <Package className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Valeur totale</p>
                  <p className="text-xl font-bold text-gray-900 font-mono">{devise === 'CDF' && tauxCdf != null ? formatMoney((stats?.total_valeur ?? 0) * tauxCdf, 'CDF') : formatMoney(stats?.total_valeur ?? 0, '$')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    {['N°', 'Date', 'Article', 'Unit', 'Prix unit', 'Qté', devise === 'CDF' ? 'Valeur (CDF)' : 'Valeur', 'Fournisseur', 'Statut'].map((h) => (
                      <TableHead key={h} className="font-semibold text-gray-600">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 bg-gray-200 rounded" style={{ width: `${45 + j * 12}px` }} /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : lignes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune donnée</p>
              <p className="text-sm mt-1">{searched ? 'Aucun achat sur la période sélectionnée' : 'Sélectionnez un fournisseur ou une période puis cliquez sur Générer'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600 w-12">N°</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Article</TableHead>
                    <TableHead className="font-semibold text-gray-600">Unit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Prix unit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">{devise === 'CDF' ? 'Valeur (CDF)' : 'Valeur'}</TableHead>
                    <TableHead className="font-semibold text-gray-600">Fournisseur</TableHead>
                    <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {displayed.map((l, i) => {
                     const rejete = l.statut === 'REJETÉ';
                     return (
                    <TableRow key={l.numero} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50', rejete && 'opacity-60')}>
                      <TableCell className="text-sm font-medium text-gray-700">{l.numero}</TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDateFr(l.date)}</TableCell>
                      <TableCell className="font-medium text-gray-900">{l.article}</TableCell>
                      <TableCell className="text-sm text-gray-600">{l.unite}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{devise === 'CDF' && tauxCdf != null ? formatMoney(l.prix_unitaire * tauxCdf, 'CDF') : formatMoney(l.prix_unitaire, '$')}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{l.quantite}</TableCell>
                      <TableCell className={cn('text-right font-mono text-sm font-semibold', rejete ? 'text-gray-500 line-through' : 'text-gray-900')}>{devise === 'CDF' && tauxCdf != null ? formatMoney(l.valeur * tauxCdf, 'CDF') : formatMoney(l.valeur, '$')}</TableCell>
                      <TableCell className="text-sm text-gray-600">{l.fournisseur || '—'}</TableCell>
                      <TableCell><StatutMouvementBadge statut={l.statut} /></TableCell>
                      <TableCell>
                        <button
                          onClick={() => navigate(`/rapports/achat/${l.id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
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
