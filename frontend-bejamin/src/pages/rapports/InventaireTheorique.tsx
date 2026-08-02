import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { DataTablePagination } from '../../components/ui/DataTablePagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RapportTablePDF } from '../../components/pdf/RapportTablePDF';
import type { Column } from '../../components/pdf/RapportTablePDF';
import { inventaireService } from '../../services/inventaire';
import { periodeInventaireService } from '../../services/periode-inventaire';
import type { PeriodeInventaire, Inventaire } from '../../types/validation';
import { Search, RefreshCw, FileText, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

export function InventaireTheorique() {
  const [periodes, setPeriodes] = useState<PeriodeInventaire[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>('');
  const [data, setData] = useState<Inventaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [allData, setAllData] = useState<Inventaire[]>([]);

  const fetchPeriodes = useCallback(async () => {
    try {
      const res = await periodeInventaireService.list({ per_page: '200', sort_by: 'id', sort_order: 'desc' });
      if (res.success) {
        setPeriodes(res.data.data.filter((p) => p.statut === 'CLOTURE'));
      }
    } catch {
      //
    }
  }, []);

  useEffect(() => { fetchPeriodes(); }, [fetchPeriodes]);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    if (!selectedPeriodeId) {
      setData([]);
      setTotal(0);
      setLastPage(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await inventaireService.list({ periode_id: selectedPeriodeId, per_page: String(pageSize), page: String(currentPage), ...(searchTerm && { search: searchTerm }) });
      if (res.success) {
        setData(res.data.data);
        setTotal(res.data.total);
        setLastPage(res.data.last_page);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodeId, currentPage, searchTerm, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAllData = useCallback(async () => {
    if (!selectedPeriodeId) {
      setAllData([]);
      return;
    }
    try {
      const res = await inventaireService.list({ periode_id: selectedPeriodeId, per_page: '5000', ...(searchTerm && { search: searchTerm }) });
      if (res.success) setAllData(res.data.data);
    } catch {
      //
    }
  }, [selectedPeriodeId, searchTerm]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handlePeriodeChange = (value: string) => {
    setSelectedPeriodeId(value);
    setCurrentPage(1);
    setSearchInput('');
    setSearchTerm('');
  };

  const getEcartDisplay = (ecart: number) => {
    if (ecart > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="font-mono">+{ecart}</span>
          <span className="text-xs text-green-500 ml-1">(excédent)</span>
        </span>
      );
    }
    if (ecart < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
          <TrendingDown className="w-3.5 h-3.5" />
          <span className="font-mono">{ecart}</span>
          <span className="text-xs text-red-500 ml-1">(manquant)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
        <Minus className="w-3.5 h-3.5" />
        <span className="font-mono">0</span>
      </span>
    );
  };

  const totalTheorique = allData.reduce((s, i) => s + (i.stock_theorique || 0), 0);
  const totalPhysique = allData.reduce((s, i) => s + (i.stock_physique_compte || 0), 0);
  const totalEcart = allData.reduce((s, i) => s + (i.ecart || 0), 0);
  const totalEcartSaisie = allData.reduce((s, i) => s + ((i.ecart_saisie ?? i.ecart) || 0), 0);

  const periodeLabel = periodes.find((p) => String(p.id) === selectedPeriodeId)?.libelle ?? '';

  const pdfColumns: Column[] = [
    { key: 'produit', label: 'Produit', width: '24%', render: (r) => r.produit },
    { key: 'code', label: 'Code article', width: '12%', render: (r) => r.code },
    { key: 'magasin', label: 'Magasin', width: '14%', render: (r) => r.magasin },
    { key: 'theorique', label: 'Stock théorique', width: '10%', align: 'right', render: (r) => r.theorique },
    { key: 'physique', label: 'Stock physique', width: '10%', align: 'right', render: (r) => r.physique },
    { key: 'ecart', label: 'Écart', width: '9%', align: 'right', render: (r) => r.ecart },
    { key: 'ecart_saisie', label: 'Écart (saisie)', width: '11%', align: 'right', render: (r) => r.ecart_saisie },
    { key: 'commentaire', label: 'Commentaire', width: '10%', render: (r) => r.commentaire },
  ];

  const pdfRows = allData.map((i) => ({
    produit: i.produit?.nom || '-',
    code: i.produit?.code_article || '-',
    magasin: i.magasin?.nom || '-',
    theorique: String(i.stock_theorique),
    physique: String(i.stock_physique_compte),
    ecart: String(i.ecart),
    ecart_saisie: String(i.ecart_saisie ?? i.ecart),
    commentaire: i.commentaire || '-',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaire théorique</h1>
          <p className="text-sm text-gray-500 mt-1">{selectedPeriodeId ? `${total} produit${total > 1 ? 's' : ''}` : 'Sélectionnez une période'}</p>
        </div>
        <div className="flex items-center gap-2">
          {allData.length > 0 && (
            <PDFDownloadLink
              document={
                <RapportTablePDF
                  title="Rapport inventaire théorique"
                  subtitle={periodeLabel || undefined}
                  orientation="landscape"
                  columns={pdfColumns}
                  rows={pdfRows}
                  stats={[
                    { label: 'Stock théorique', value: String(totalTheorique) },
                    { label: 'Stock physique', value: String(totalPhysique) },
                    { label: 'Écart', value: String(totalEcart) },
                    { label: 'Écart (saisie)', value: String(totalEcartSaisie) },
                  ]}
                />
              }
              fileName={`inventaire-theorique_${periodeLabel.replace(/\s+/g, '-')}.pdf`}
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
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FileText className="w-4 h-4 text-gray-400" />
          <Select
            value={selectedPeriodeId}
            onValueChange={handlePeriodeChange}
          >
            <SelectTrigger className="w-72 h-9 bg-white border-gray-200">
              <SelectValue placeholder="Sélectionnez une période clôturée" />
            </SelectTrigger>
            <SelectContent>
              {periodes.length === 0 ? (
                <SelectItem value="" disabled>Aucune période clôturée</SelectItem>
              ) : (
                periodes.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.libelle} ({p.magasin?.nom || '-'})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        {selectedPeriodeId && (
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Input
              placeholder="Rechercher un produit..."
              className="pl-3 pr-10 border-gray-200 h-9 text-sm"
              value={searchInput}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearchTerm(searchInput); setCurrentPage(1); } }}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="button"
              onClick={() => { setSearchTerm(searchInput); setCurrentPage(1); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-royal-700 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Inventaires</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedPeriodeId ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Sélectionnez une période</p>
              <p className="text-sm mt-1">Choisissez une période d'inventaire pour voir les produits</p>
            </div>
          ) : loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Code article</TableHead>
                    <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Stock physique</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Écart</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Écart (saisie)</TableHead>
                    <TableHead className="font-semibold text-gray-600">Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun inventaire</p>
              <p className="text-sm mt-1">Aucun enregistrement d'inventaire pour cette période</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Code article</TableHead>
                      <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock physique</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Écart</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Écart (saisie)</TableHead>
                      <TableHead className="font-semibold text-gray-600">Commentaire</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((inv, i) => (
                      <TableRow key={inv.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">{inv.produit?.nom || '-'}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">{inv.produit?.code_article || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{inv.magasin?.nom || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">{inv.stock_theorique}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">{inv.stock_physique_compte}</TableCell>
                        <TableCell className="text-center">{getEcartDisplay(inv.ecart)}</TableCell>
                        <TableCell className="text-center">{getEcartDisplay(inv.ecart_saisie ?? inv.ecart)}</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{inv.commentaire || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination currentPage={currentPage} lastPage={lastPage} total={total} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
