import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useToast } from '../hooks/useToast';
import { inventaireService } from '../services/inventaire';
import { periodeInventaireService } from '../services/periode-inventaire';
import type { PeriodeInventaire, Inventaire } from '../types/validation';
import { Search, RefreshCw, FileText, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

export function AjustementProduit() {
  const { toast } = useToast();

  const [periodes, setPeriodes] = useState<PeriodeInventaire[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>('');
  const [data, setData] = useState<Inventaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [generating, setGenerating] = useState(false);

  const fetchPeriodes = useCallback(async () => {
    try {
      const res = await periodeInventaireService.list({ per_page: '200' });
      if (res.success) {
        setPeriodes(res.data.data);
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
      const res = await inventaireService.list({ periode_id: selectedPeriodeId, per_page: String(pageSize), page: String(currentPage) });
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
  }, [selectedPeriodeId, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerateAjustements = async () => {
    if (!selectedPeriodeId) return;
    setGenerating(true);
    try {
      const res = await inventaireService.generateAjustements(Number(selectedPeriodeId));
      if (res.success) {
        toast(`${res.data.ajustements.length} ajustement${res.data.ajustements.length > 1 ? 's' : ''} généré${res.data.ajustements.length > 1 ? 's' : ''}`, 'success');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la génération des ajustements', 'error');
    } finally {
      setGenerating(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajustement par produit</h1>
          <p className="text-sm text-gray-500 mt-1">{selectedPeriodeId ? `${total} produit${total > 1 ? 's' : ''}` : 'Sélectionnez une période'}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPeriodeId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAjustements}
              disabled={generating}
              className="border-royal-200 text-royal-700 hover:bg-royal-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-1.5" />
              )}
              Générer ajustements
            </Button>
          )}
          <Button variant="outline" onClick={fetchData} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FileText className="w-4 h-4 text-gray-400" />
          <Select
            value={selectedPeriodeId}
            onValueChange={(v) => { setSelectedPeriodeId(v); setCurrentPage(1); }}
          >
            <SelectTrigger className="w-72 h-9 bg-white border-gray-200">
              <SelectValue placeholder="Sélectionnez une période" />
            </SelectTrigger>
            <SelectContent>
              {periodes.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.libelle} ({p.ville?.nom || '-'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                    <TableHead className="font-semibold text-gray-600">Ville</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Stock physique</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Écart</TableHead>
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
                      <TableHead className="font-semibold text-gray-600">Ville</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock physique</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Écart</TableHead>
                      <TableHead className="font-semibold text-gray-600">Commentaire</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((inv, i) => (
                      <TableRow key={inv.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">{inv.produit?.nom || '-'}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">{inv.produit?.code_article || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{inv.ville?.nom || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">{inv.stock_theorique}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">{inv.stock_physique_compte}</TableCell>
                        <TableCell className="text-center">{getEcartDisplay(inv.ecart)}</TableCell>
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
