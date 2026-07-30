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
import type { InventaireRapportData } from '../../types/rapport';
import { RefreshCw, FileText, Download, DollarSign, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

export function InventaireTheorique() {
  const [data, setData] = useState<InventaireRapportData | null>(null);
  const [loading, setLoading] = useState(true);

  const inventaire = data?.inventaire ?? [];
  const stats = data?.statistiques;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const displayed = inventaire.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = inventaire.length;
  const lastPage = Math.ceil(total / pageSize);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await rapportService.inventaireTheorique();
      if (res.success) {
        setData(res.data);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pdfColumns: Column[] = [
    { key: 'code', label: 'Code', width: '18%', render: (r) => r.code },
    { key: 'produit', label: 'Produit', width: '35%', render: (r) => r.produit },
    { key: 'stock', label: 'Stock théorique', width: '22%', align: 'right', render: (r) => r.stock },
    { key: 'valeur', label: 'Valeur', width: '25%', align: 'right', render: (r) => r.valeur },
  ];

  const pdfRows = inventaire.map((i) => ({
    code: i.produit.code_article,
    produit: i.produit.nom,
    stock: `${i.stock_theorique} ${i.unite}`,
    valeur: formatCurrency(i.valeur),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaire théorique</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${inventaire.length} produit${inventaire.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {inventaire.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Inventaire théorique"
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={[
                    { label: 'Total produits', value: String(stats?.total_produits ?? 0) },
                    { label: 'Stock total', value: String(stats?.total_stock ?? 0) },
                    { label: 'Valeur totale', value: formatCurrency(stats?.total_valeur ?? 0) },
                  ]}
                  totals={[
                    { label: 'Stock total', value: String(stats?.total_stock ?? 0) },
                    { label: 'Valeur totale', value: formatCurrency(stats?.total_valeur ?? 0) },
                  ]}
                />
              }
              fileName="inventaire-theorique.pdf"
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-royal-50">
                <Package className="w-5 h-5 text-royal-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total produits</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_produits ?? 0}</p>
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
                <p className="text-xs text-gray-500 font-medium">Stock total</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_stock ?? 0}</p>
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
                <p className="text-xs text-gray-500 font-medium">Valeur totale</p>
                <p className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(stats?.total_valeur ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Inventaire</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
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
          ) : inventaire.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune donnée</p>
              <p className="text-sm mt-1">Aucun produit en inventaire</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((item, i) => (
                    <TableRow key={item.produit.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-mono text-sm font-medium text-royal-700">{item.produit.code_article}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.produit.nom}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{item.stock_theorique} {item.unite}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{formatCurrency(item.valeur)}</TableCell>
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
