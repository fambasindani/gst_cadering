import { useEffect, useState } from 'react';
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
import { DeviseSelect } from '../../components/ui/DeviseSelect';
import { StatutMouvementBadge } from '../../components/ui/StatutMouvementBadge';
import type { RapportClientData } from '../../types/rapport';
import { RefreshCw, Package, Download, Calendar, Search, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';
import { downloadCsv } from '../../lib/exportCsv';

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

export function RapportClient() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [data, setData] = useState<RapportClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [tauxCdf, setTauxCdf] = useState<number | null>(null);
  const [devise, setDevise] = useState<'USD' | 'CDF'>('USD');

  const lignes = data?.lignes ?? [];
  const stats = data?.statistiques;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (clientSearch.trim()) params.client = clientSearch.trim();
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const res = await rapportService.rapportClient(params);
      if (res.success) {
        setData(res.data);
        setSearched(true);
      }
      const tres = await tauxConversionService.getActuel();
      if (tres.success && tres.data) setTauxCdf(tres.data.taux);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const deviseCode = devise === 'CDF' ? 'CDF' : '$';

  const exportCsv = async () => {
    const params: Record<string, string> = {};
    if (clientSearch.trim()) params.client = clientSearch.trim();
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    await downloadCsv('/rapports/client/export', params, 'rapport-clients.csv');
  };

  const pdfColumns: Column[] = [
    { key: 'numero', label: 'N°', width: '4%', align: 'right', render: (r) => r.numero },
    { key: 'designation', label: 'Designation', width: '22%', render: (r) => r.designation },
    { key: 'article', label: 'Article', width: '16%', render: (r) => r.article },
    { key: 'unite', label: 'Unit', width: '6%', render: (r) => r.unite },
    { key: 'prix', label: 'Prix unit', width: '12%', align: 'right', render: (r) => formatMoney(Number(r.prix_unitaire), deviseCode) },
    { key: 'qte', label: 'Qté', width: '8%', align: 'right', render: (r) => r.quantite },
    { key: 'valeur', label: devise === 'CDF' ? 'Valeur (CDF)' : 'Valeur', width: '14%', align: 'right', render: (r) => r.valeur },
    { key: 'statut', label: 'Statut', width: '8%', render: (r) => r.statut },
  ];

  const pdfRows = lignes.map((l) => {
    const valeur = Number(l.valeur) || 0;
    return {
      numero: String(l.numero),
      designation: l.designation,
      article: l.article,
      unite: l.unite,
      devise: l.devise,
      prix_unitaire: String(devise === 'CDF' && tauxCdf != null ? (Number(l.prix_unitaire) * tauxCdf).toFixed(2) : l.prix_unitaire),
      quantite: String(l.quantite),
      valeur: devise === 'CDF' && tauxCdf != null ? formatMoney(valeur * tauxCdf, 'CDF') : formatMoney(valeur, '$'),
      statut: l.statut === 'REJETÉ' ? 'Rejeté' : 'Validé',
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport clients</h1>
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
                  title="Rapport clients"
                  columns={pdfColumns}
                  rows={pdfRows}
                  period={`Période : du ${formatDateFr(dateDebut)} au ${formatDateFr(dateFin)}${clientSearch ? ` — Client : ${clientSearch}` : ''}`}
                  stats={[
                    { label: 'Lignes', value: formatNumber(stats?.total_lignes ?? 0) },
                    { label: 'Qté totale', value: formatNumber(stats?.total_quantite ?? 0) },
                    { label: 'Valeur totale', value: devise === 'CDF' && tauxCdf != null ? formatMoney((stats?.total_valeur ?? 0) * tauxCdf, 'CDF') : formatMoney(stats?.total_valeur ?? 0, '$') },
                    ...(stats?.total_rejets ? [{ label: 'Rejets (hors totaux)', value: formatNumber(stats.total_rejets) }] : []),
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
                <Search className="w-4 h-4 text-gray-400" />
                Client
              </label>
              <Input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchData(); }}
                placeholder="Nom ou code du client"
                className="h-11 border-gray-200 shadow-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Periode
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

      <Card className="border-0 shadow-sm">
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    {['N°', 'Designation', 'Article', 'Unit', 'Prix unit', 'Qté', devise === 'CDF' ? 'Valeur (CDF)' : 'Valeur', 'Statut'].map((h) => (
                      <TableHead key={h} className="font-semibold text-gray-600">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 bg-gray-200 rounded" style={{ width: `${50 + j * 12}px` }} /></TableCell>
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
              <p className="text-sm mt-1">{searched ? 'Aucune consommation client sur la période sélectionnée' : 'Aucune donnée'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600 w-12">N°</TableHead>
                    <TableHead className="font-semibold text-gray-600">Designation</TableHead>
                    <TableHead className="font-semibold text-gray-600">Article</TableHead>
                    <TableHead className="font-semibold text-gray-600">Unit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Prix unit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">{devise === 'CDF' ? 'Valeur (CDF)' : 'Valeur'}</TableHead>
                    <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l, i) => {
                    const valeur = Number(l.valeur) || 0;
                    const rejete = l.statut === 'REJETÉ';
                    return (
                    <TableRow key={l.numero} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50', rejete && 'opacity-60')}>
                      <TableCell className="text-sm font-medium text-gray-700">{l.numero}</TableCell>
                      <TableCell className="font-medium text-gray-900">{l.designation}</TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">{l.article}</TableCell>
                      <TableCell className="text-sm text-gray-600">{l.unite}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{devise === 'CDF' && tauxCdf != null ? formatMoney(l.prix_unitaire * tauxCdf, 'CDF') : formatMoney(l.prix_unitaire, '$')}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{l.quantite}</TableCell>
                      <TableCell className={cn('text-right font-mono text-sm font-semibold', rejete ? 'text-gray-500 line-through' : 'text-gray-900')}>{devise === 'CDF' && tauxCdf != null ? formatMoney(valeur * tauxCdf, 'CDF') : formatMoney(valeur, '$')}</TableCell>
                      <TableCell><StatutMouvementBadge statut={l.statut} /></TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
