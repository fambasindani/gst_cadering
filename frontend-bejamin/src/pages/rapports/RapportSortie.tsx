import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RapportTablePDF } from '../../components/pdf/RapportTablePDF';
import type { Column } from '../../components/pdf/RapportTablePDF';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { rapportService } from '../../services/rapport';
import { partenaireService } from '../../services/partenaire';
import { departementService } from '../../services/departement';
import { tauxConversionService } from '../../services/taux-conversion';
import { DeviseSelect } from '../../components/ui/DeviseSelect';
import { StatutMouvementBadge } from '../../components/ui/StatutMouvementBadge';
import { downloadCsv } from '../../lib/exportCsv';
import type { RapportSortieData } from '../../types/rapport';
import { RefreshCw, Package, Download, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
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

export function RapportSortie() {
  const navigate = useNavigate();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);
  const [departementId, setDepartementId] = useState('');
  const [departements, setDepartements] = useState<{ id: number; nom: string }[]>([]);
  const [data, setData] = useState<RapportSortieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tauxCdf, setTauxCdf] = useState<number | null>(null);
  const [devise, setDevise] = useState<'USD' | 'CDF'>('USD');

  const lignes = data?.lignes ?? [];
  const stats = data?.statistiques;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const displayed = lignes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = lignes.length;
  const lastPage = Math.ceil(total / pageSize);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (clientId) params.client_id = clientId;
    if (departementId) params.departement_id = departementId;
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    return params;
  }, [clientId, departementId, dateDebut, dateFin]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rapportService.rapportSortie(buildParams());
      if (res.success) setData(res.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    tauxConversionService.getActuel()
      .then((tres) => { if (tres.success && tres.data) setTauxCdf(tres.data.taux); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    partenaireService.getClients()
      .then((res) => { if (res.success && res.data?.data) setClients(res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    departementService.list()
      .then((res) => { if (res.success && res.data?.data) setDepartements(res.data.data); })
      .catch(() => {});
  }, []);

  const handleExportCsv = () => {
    downloadCsv('/rapports/sortie/export', buildParams(), 'rapport-sorties.csv').catch(() => {});
  };

  const deviseCode = devise === 'CDF' ? 'CDF' : '$';

  const pdfColumns: Column[] = [
    { key: 'numero', label: 'N°', width: '4%', align: 'right', render: (r) => r.numero },
    { key: 'date', label: 'Date', width: '10%', render: (r) => r.date },
    { key: 'article', label: 'Article', width: '20%', render: (r) => r.article },
    { key: 'unite', label: 'Unit', width: '5%', render: (r) => r.unite },
    { key: 'prix', label: 'Prix unit', width: '10%', align: 'right', render: (r) => formatMoney(Number(r.prix_unitaire), deviseCode) },
    { key: 'qte', label: 'Qté', width: '7%', align: 'right', render: (r) => r.quantite },
    { key: 'valeur', label: devise === 'CDF' ? 'Valeur (CDF)' : 'Valeur', width: '12%', align: 'right', render: (r) => r.valeur },
    { key: 'client', label: 'Client', width: '12%', render: (r) => r.client },
    { key: 'departement', label: 'Département', width: '10%', render: (r) => r.departement },
    { key: 'statut', label: 'Statut', width: '7%', render: (r) => r.statut },
  ];

  const pdfRows = lignes.map((l) => ({
    numero: String(l.numero),
    date: formatDateFr(l.date),
    article: l.article,
    unite: l.unite,
    prix_unitaire: String(devise === 'CDF' && tauxCdf != null ? (Number(l.prix_unitaire) * tauxCdf).toFixed(2) : l.prix_unitaire),
    quantite: String(l.quantite),
    valeur: devise === 'CDF' && tauxCdf != null ? formatMoney(Number(l.valeur) * tauxCdf, 'CDF') : formatMoney(Number(l.valeur), '$'),
    client: l.client || '—',
    departement: l.departement || '—',
    statut: l.statut === 'REJETÉ' ? 'Rejeté' : 'Validé',
  }));

  const periodLabel = () => {
    if (!dateDebut && !dateFin) return 'Toutes les périodes';
    return `Du ${dateDebut || '...'} au ${dateFin || '...'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport sorties</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${lignes.length} ligne${lignes.length > 1 ? 's' : ''}`}
            {!loading && (stats?.total_rejets ?? 0) > 0 && (
              <span className="text-red-600 font-medium"> (dont {stats?.total_rejets} rejetée{(stats?.total_rejets ?? 0) > 1 ? 's' : ''}, hors totaux)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lignes.length > 0 && (
            <Button variant="outline" onClick={handleExportCsv} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-1.5" /> CSV / Excel
            </Button>
          )}
          {lignes.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport sorties"
                  orientation="landscape"
                  subtitle={periodLabel()}
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={[
                    { label: 'Lignes', value: formatNumber(stats?.total_lignes ?? 0) },
                    { label: 'Qté totale', value: formatNumber(stats?.total_quantite ?? 0) },
                    { label: 'Valeur totale', value: devise === 'CDF' && tauxCdf != null ? formatMoney((stats?.total_valeur ?? 0) * tauxCdf, 'CDF') : formatMoney(stats?.total_valeur ?? 0, '$') },
                    ...(stats?.total_rejets ? [{ label: 'Rejets (hors totaux)', value: formatNumber(stats.total_rejets) }] : []),
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
          <Button variant="outline" onClick={() => { setDateDebut(''); setDateFin(''); setClientId(''); setDepartementId(''); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-[220px]">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Client :</label>
            <SearchableSelect
              options={[{ id: 0, nom: 'Tous les clients' }, ...clients]}
              value={clientId || '0'}
              onValueChange={(v) => setClientId(v === '0' ? '' : v)}
              placeholder="Tous les clients"
              searchPlaceholder="Rechercher un client..."
              emptyMessage="Aucun client"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[220px]">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Département :</label>
            <SearchableSelect
              options={[{ id: 0, nom: 'Tous les départements' }, ...departements]}
              value={departementId || '0'}
              onValueChange={(v) => setDepartementId(v === '0' ? '' : v)}
              placeholder="Tous les départements"
              searchPlaceholder="Rechercher un département..."
              emptyMessage="Aucun département"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Du :</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:border-royal-500 focus:ring-royal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Au :</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:border-royal-500 focus:ring-royal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Devise :</label>
            <DeviseSelect value={devise} onChange={setDevise} />
          </div>
          {(clientId || departementId || dateDebut || dateFin) && (
            <button
              type="button"
              onClick={() => { setClientId(''); setDepartementId(''); setDateDebut(''); setDateFin(''); }}
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

      <Card className="border-0 shadow-sm">
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    {['N°', 'Date', 'Article', 'Unit', 'Prix unit', 'Qté', devise === 'CDF' ? 'Valeur (CDF)' : 'Valeur', 'Client', 'Département', 'Statut', 'Actions'].map((h) => (
                      <TableHead key={h} className="font-semibold text-gray-600">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 bg-gray-200 rounded" style={{ width: `${45 + j * 10}px` }} /></TableCell>
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
              <p className="text-sm mt-1">Aucune sortie trouvée pour les filtres sélectionnés</p>
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
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="font-semibold text-gray-600">Département</TableHead>
                    <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600 w-20">Actions</TableHead>
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
                      <TableCell className="text-sm text-gray-600">{l.client || '—'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{l.departement || '—'}</TableCell>
                      <TableCell><StatutMouvementBadge statut={l.statut} /></TableCell>
                      <TableCell className="text-center">
                        {l.id ? (
                          <button
                            onClick={() => navigate(`/rapports/sortie/${l.id}`)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-royal-700 hover:bg-royal-50 transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : <span className="text-gray-300">—</span>}
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
