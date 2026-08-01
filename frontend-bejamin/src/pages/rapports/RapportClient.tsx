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
import type { RapportClientData } from '../../types/rapport';
import { RefreshCw, Package, Download, Calendar, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

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
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const pdfColumns: Column[] = [
    { key: 'numero', label: 'N°', width: '5%', align: 'right', render: (r) => r.numero },
    { key: 'designation', label: 'Designation', width: '26%', render: (r) => r.designation },
    { key: 'article', label: 'Article', width: '18%', render: (r) => r.article },
    { key: 'unite', label: 'Unit', width: '8%', render: (r) => r.unite },
    { key: 'prix', label: 'Prix unit', width: '15%', align: 'right', render: (r) => formatMoney(Number(r.prix_unitaire), r.devise) },
    { key: 'qte', label: 'Qté', width: '10%', align: 'right', render: (r) => r.quantite },
    { key: 'valeur', label: 'Valeur', width: '18%', align: 'right', render: (r) => formatMoney(Number(r.valeur), r.devise) },
  ];

  const pdfRows = lignes.map((l) => ({
    numero: String(l.numero),
    designation: l.designation,
    article: l.article,
    unite: l.unite,
    devise: l.devise,
    prix_unitaire: String(l.prix_unitaire),
    quantite: String(l.quantite),
    valeur: String(l.valeur),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport clients</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${lignes.length} ligne${lignes.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
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
                    { label: 'Valeur totale', value: formatMoney(stats?.total_valeur ?? 0) },
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
                    {['N°', 'Designation', 'Article', 'Unit', 'Prix unit', 'Qté', 'Valeur'].map((h) => (
                      <TableHead key={h} className="font-semibold text-gray-600">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
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
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l, i) => (
                    <TableRow key={l.numero} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="text-sm font-medium text-gray-700">{l.numero}</TableCell>
                      <TableCell className="font-medium text-gray-900">{l.designation}</TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">{l.article}</TableCell>
                      <TableCell className="text-sm text-gray-600">{l.unite}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatMoney(l.prix_unitaire, l.devise)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{l.quantite}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{formatMoney(l.valeur, l.devise)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
