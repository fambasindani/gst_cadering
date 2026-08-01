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
import type { RapportStockPhysiqueLogiqueData } from '../../types/rapport';
import { RefreshCw, Package, Download, Calendar } from 'lucide-react';
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

export function InventaireTheorique() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [data, setData] = useState<RapportStockPhysiqueLogiqueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const lignes = data?.lignes ?? [];
  const stats = data?.statistiques;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const res = await rapportService.rapportStockPhysiqueLogique(params);
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
    { key: 'numero', label: 'N°', width: '3%', align: 'right', render: (r) => r.numero },
    { key: 'designation', label: 'Designation', width: '16%', render: (r) => r.designation },
    { key: 'unite', label: 'Unit', width: '4%', render: (r) => r.unite },
    { key: 'prix', label: 'Prix unit', width: '7%', align: 'right', render: (r) => formatMoney(Number(r.prix_unitaire), r.devise) },
    { key: 'qte_physique', label: 'Qté Physique', width: '7%', align: 'right', render: (r) => formatNumber(Number(r.qte_physique)) },
    { key: 'val_physique', label: 'Val.Phys.', width: '9%', align: 'right', render: (r) => formatMoney(Number(r.valeur_physique), r.devise) },
    { key: 'qte_logique', label: 'Qté Logique', width: '7%', align: 'right', render: (r) => formatNumber(Number(r.qte_logique)) },
    { key: 'val_logique', label: 'Val.Log.', width: '9%', align: 'right', render: (r) => formatMoney(Number(r.valeur_logique), r.devise) },
    { key: 'ecart', label: 'Ecart', width: '7%', align: 'right', render: (r) => formatNumber(Number(r.ecart)) },
    { key: 'val_ecart', label: 'Val.Ecart.', width: '9%', align: 'right', render: (r) => formatMoney(Number(r.valeur_ecart), r.devise) },
  ];

  const pdfRows = lignes.map((l) => ({
    numero: String(l.numero),
    designation: l.designation,
    unite: l.unite,
    devise: l.devise,
    prix_unitaire: String(l.prix_unitaire),
    qte_physique: String(l.qte_physique),
    valeur_physique: String(l.valeur_physique),
    qte_logique: String(l.qte_logique),
    valeur_logique: String(l.valeur_logique),
    ecart: String(l.ecart),
    valeur_ecart: String(l.valeur_ecart),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport stock logique/physique</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${lignes.length} article${lignes.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {lignes.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport stock logique/physique"
                  orientation="landscape"
                  columns={pdfColumns}
                  rows={pdfRows}
                  period={`Période : du ${formatDateFr(dateDebut)} au ${formatDateFr(dateFin)}`}
                  stats={[
                    { label: 'Qté Physique', value: formatNumber(stats?.total_qte_physique ?? 0) },
                    { label: 'Qté Logique', value: formatNumber(stats?.total_qte_logique ?? 0) },
                    { label: 'Ecart', value: formatNumber(stats?.total_ecart ?? 0) },
                    { label: 'Val. Ecart', value: formatMoney(stats?.total_valeur_ecart ?? 0) },
                  ]}
                />
              }
              fileName="rapport-stock-logique-physique.pdf"
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
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              Periode
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">du</span>
                <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="h-11 border-gray-200 shadow-sm w-48" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">au</span>
                <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="h-11 border-gray-200 shadow-sm w-48" />
              </div>
              <Button onClick={fetchData} disabled={loading} className="h-11 px-6 bg-royal-700 hover:bg-royal-800 text-white shadow-sm font-medium">
                Générer
              </Button>
            </div>
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
                    {['N°', 'Designation', 'Unit', 'Prix unit', 'Qté Physique', 'Val.Phys.', 'Qté Logique', 'Val.Log.', 'Ecart', 'Val.Ecart.'].map((h) => (
                      <TableHead key={h} className="font-semibold text-gray-600">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 bg-gray-200 rounded" style={{ width: `${40 + j * 10}px` }} /></TableCell>
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
              <p className="text-sm mt-1">{searched ? 'Aucun article en stock' : 'Aucune donnée'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600 w-12">N°</TableHead>
                    <TableHead className="font-semibold text-gray-600">Designation</TableHead>
                    <TableHead className="font-semibold text-gray-600">Unit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Prix unit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté Physique</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Val.Phys.</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté Logique</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Val.Log.</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Ecart</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Val.Ecart.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l, i) => (
                    <TableRow key={l.numero} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="text-sm font-medium text-gray-700">{l.numero}</TableCell>
                      <TableCell className="font-medium text-gray-900">{l.designation}</TableCell>
                      <TableCell className="text-sm text-gray-600">{l.unite}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatMoney(l.prix_unitaire, l.devise)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatNumber(l.qte_physique)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatMoney(l.valeur_physique, l.devise)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatNumber(l.qte_logique)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatMoney(l.valeur_logique, l.devise)}</TableCell>
                      <TableCell className={cn('text-right font-mono text-sm font-semibold', l.ecart !== 0 ? 'text-amber-600' : 'text-gray-700')}>{formatNumber(l.ecart)}</TableCell>
                      <TableCell className={cn('text-right font-mono text-sm font-semibold', l.ecart !== 0 ? 'text-amber-600' : 'text-gray-700')}>{formatMoney(l.valeur_ecart, l.devise)}</TableCell>
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
