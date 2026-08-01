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
import type { RapportStockData } from '../../types/rapport';
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
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function RapportStock() {
  const today = new Date().toISOString().split('T')[0];
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(today);
  const [data, setData] = useState<RapportStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const lignes = data?.lignes ?? [];
  const stats = data?.statistiques;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await rapportService.rapportStock({ date_debut: dateDebut, date_fin: dateFin });
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
    { key: 'numero', label: 'N°', width: '4%', align: 'right', render: (r) => r.numero },
    { key: 'designation', label: 'Désignation', width: '17%', render: (r) => r.designation },
    { key: 'unite', label: 'Unit', width: '5%', render: (r) => r.unite },
    { key: 'prix', label: 'Prix unit', width: '9%', align: 'right', render: (r) => formatMoney(Number(r.prix_unitaire), r.devise) },
    { key: 'qte_initiale', label: 'Qté Initiale', width: '7%', align: 'right', render: (r) => formatNumber(Number(r.qte_initiale)) },
    { key: 'valeur_initiale', label: 'Valeur', width: '8%', align: 'right', render: (r) => formatMoney(Number(r.valeur_initiale), r.devise) },
    { key: 'qte_entree', label: 'Qté Entrée', width: '7%', align: 'right', render: (r) => formatNumber(Number(r.qte_entree)) },
    { key: 'valeur_entree', label: 'Valeur', width: '8%', align: 'right', render: (r) => formatMoney(Number(r.valeur_entree), r.devise) },
    { key: 'qte_sortie', label: 'Qté sortie', width: '7%', align: 'right', render: (r) => formatNumber(Number(r.qte_sortie)) },
    { key: 'valeur_sortie', label: 'Valeur', width: '8%', align: 'right', render: (r) => formatMoney(Number(r.valeur_sortie), r.devise) },
    { key: 'qte_finale', label: 'Qté finale', width: '7%', align: 'right', render: (r) => formatNumber(Number(r.qte_finale)) },
    { key: 'valeur_finale', label: 'Valeur', width: '8%', align: 'right', render: (r) => formatMoney(Number(r.valeur_finale), r.devise) },
  ];

  const pdfRows = lignes.map((l) => ({
    numero: String(l.numero),
    designation: l.designation,
    unite: l.unite,
    devise: l.devise,
    prix_unitaire: String(l.prix_unitaire),
    qte_initiale: String(l.qte_initiale),
    valeur_initiale: String(l.valeur_initiale),
    qte_entree: String(l.qte_entree),
    valeur_entree: String(l.valeur_entree),
    qte_sortie: String(l.qte_sortie),
    valeur_sortie: String(l.valeur_sortie),
    qte_finale: String(l.qte_finale),
    valeur_finale: String(l.valeur_finale),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport de stock</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${stats?.total_produits ?? 0} article${(stats?.total_produits ?? 0) > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {lignes.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport de stock"
                  orientation="landscape"
                  columns={pdfColumns}
                  rows={pdfRows}
                  period={`Période : du ${formatDateFr(dateDebut)} au ${formatDateFr(dateFin)}`}
                  stats={[
                    { label: 'Qté Initiale', value: formatNumber(stats?.total_qte_initiale ?? 0) },
                    { label: 'Qté Entrée', value: formatNumber(stats?.total_qte_entree ?? 0) },
                    { label: 'Qté Sortie', value: formatNumber(stats?.total_qte_sortie ?? 0) },
                    { label: 'Qté Finale', value: formatNumber(stats?.total_qte_finale ?? 0) },
                  ]}
                  totals={[
                    { label: 'Total initial', value: formatMoney(stats?.total_valeur_initiale ?? 0) },
                    { label: 'Total entrées', value: formatMoney(stats?.total_valeur_entree ?? 0) },
                    { label: 'Total sorties', value: formatMoney(stats?.total_valeur_sortie ?? 0) },
                    { label: 'Total final', value: formatMoney(stats?.total_valeur_finale ?? 0) },
                  ]}
                />
              }
              fileName="rapport-de-stock.pdf"
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
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
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
                    className="h-11 border-gray-200 shadow-sm w-48"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">au</span>
                  <Input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="h-11 border-gray-200 shadow-sm w-48"
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
                    <TableHead className="font-semibold text-gray-600" rowSpan={2}>N°</TableHead>
                    <TableHead className="font-semibold text-gray-600" rowSpan={2}>Désignation</TableHead>
                    <TableHead className="font-semibold text-gray-600" rowSpan={2}>Unit</TableHead>
                    <TableHead className="font-semibold text-gray-600" rowSpan={2}>Prix unit</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600" colSpan={2}>Stock Initial</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600" colSpan={2}>Entrées</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600" colSpan={2}>Sorties</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600" colSpan={2}>Stock Final</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 12 }).map((_, j) => (
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
              <p className="text-sm mt-1">{searched ? 'Aucun mouvement de stock sur la période sélectionnée' : 'Sélectionnez une période puis cliquez sur Générer'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600" rowSpan={2}>N°</TableHead>
                    <TableHead className="font-semibold text-gray-600" rowSpan={2}>Désignation</TableHead>
                    <TableHead className="font-semibold text-gray-600" rowSpan={2}>Unit</TableHead>
                    <TableHead className="font-semibold text-gray-600" rowSpan={2}>Prix unit</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600" colSpan={2}>Stock Initial</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600" colSpan={2}>Entrées</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600" colSpan={2}>Sorties</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600" colSpan={2}>Stock Final</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l, i) => (
                    <TableRow key={l.numero} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="text-sm font-medium text-gray-700">{l.numero}</TableCell>
                      <TableCell className="font-medium text-gray-900">{l.designation}</TableCell>
                      <TableCell className="text-sm text-gray-600">{l.unite}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatMoney(l.prix_unitaire, l.devise)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatNumber(l.qte_initiale)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">{formatMoney(l.valeur_initiale, l.devise)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-700">{formatNumber(l.qte_entree)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-700">{formatMoney(l.valeur_entree, l.devise)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-700">{formatNumber(l.qte_sortie)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-700">{formatMoney(l.valeur_sortie, l.devise)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{formatNumber(l.qte_finale)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{formatMoney(l.valeur_finale, l.devise)}</TableCell>
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
