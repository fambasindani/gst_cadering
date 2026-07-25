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
import type { RapportStockData } from '../../types/rapport';
import { RefreshCw, FileText, Package, Loader2, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DataTablePagination } from '../../components/ui/DataTablePagination';

export function RapportStock() {
  const [data, setData] = useState<RapportStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const items = data?.stock_par_produit ?? [];
  const stats = data?.statistiques;
  const total = items.length;
  const lastPage = Math.ceil(total / pageSize);
  const displayed = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await rapportService.rapportStock();
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
    { key: 'code', label: 'Code', width: '16%', render: (r) => r.code },
    { key: 'produit', label: 'Produit', width: '28%', render: (r) => r.produit },
    { key: 'categorie', label: 'Catégorie', width: '20%', render: (r) => r.categorie },
    { key: 'qte', label: 'Qté totale', width: '18%', align: 'right', render: (r) => r.qte },
    { key: 'lots', label: 'Nb lots', width: '18%', align: 'right', render: (r) => r.lots },
  ];

  const pdfRows = items.map((item) => ({
    code: item.produit.code_article,
    produit: item.produit.nom,
    categorie: item.produit.categorie?.nom ?? '-',
    qte: String(item.quantite_totale),
    lots: String(item.lots?.length ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport stock</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${stats?.total_produits ?? 0} produit${(stats?.total_produits ?? 0) > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport stock"
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={stats ? [
                    { label: 'Total produits', value: String(stats.total_produits) },
                    { label: 'Total lots', value: String(stats.total_lots) },
                    { label: 'Quantité totale', value: String(stats.total_quantite) },
                  ] : undefined}
                  totals={[{ label: 'Quantité totale', value: String(stats?.total_quantite ?? 0) }]}
                />
              }
              fileName="rapport-stock.pdf"
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
                <p className="text-xs text-gray-500 font-medium">Total lots</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_lots ?? 0}</p>
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
                <p className="text-xs text-gray-500 font-medium">Quantité totale</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_quantite ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Stock par produit</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Catégorie</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté totale</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Nb lots</TableHead>
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
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune donnée</p>
              <p className="text-sm mt-1">Aucun produit en stock</p>
            </div>
          ) : (<>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Catégorie</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté totale</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Nb lots</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((item, i) => (
                    <TableRow key={item.produit.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-mono text-sm font-medium text-royal-700">{item.produit.code_article}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.produit.nom}</TableCell>
                      <TableCell className="text-sm text-gray-600">{item.produit.categorie?.nom ?? '-'}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{item.quantite_totale}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">{item.lots?.length ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DataTablePagination
              currentPage={currentPage}
              lastPage={lastPage}
              total={total}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </>)}
        </CardContent>
      </Card>
    </div>
  );
}
