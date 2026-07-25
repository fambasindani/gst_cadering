import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { useToast } from '../hooks/useToast';
import { mouvementStockService } from '../services/mouvement-stock';
import type { MouvementStock } from '../types/validation';
import {
  Search, CheckCircle, XCircle, RefreshCw, Package, ArrowDown, ArrowUp, Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function EntrerStock() {
  const { toast } = useToast();

  const [data, setData] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        statut: 'EN ATTENTE',
        per_page: String(pageSize),
        page: String(currentPage),
        sort_by: 'date_mouvement',
        sort_order: 'desc',
      };
      if (searchTerm) params.search = searchTerm;
      const res = await mouvementStockService.list(params);
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
  }, [currentPage, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleValidate = async (id: number) => {
    setValidatingId(id);
    try {
      await mouvementStockService.validate(id);
      toast('Mouvement validé avec succès', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la validation', 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setRejectingId(id);
    try {
      await mouvementStockService.reject(id);
      toast('Mouvement rejeté', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors du rejet', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrer stock</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} mouvement${total > 1 ? 's' : ''} en attente`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher (produit, code, référence)..."
            className="pl-3 pr-24 border-gray-200 focus:border-royal-500 focus:ring-royal-500"
            value={searchInput}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearchTerm(searchInput); setCurrentPage(1); } }}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="button"
            onClick={() => { setSearchTerm(searchInput); setCurrentPage(1); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-royal-700 hover:bg-royal-800 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Rechercher
          </button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Mouvements en attente de validation</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                    <TableHead className="font-semibold text-gray-600">Type Mouvement</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Quantité</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Référence</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-28 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun mouvement en attente</p>
              <p className="text-sm mt-1">Tous les mouvements ont été traités</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                      <TableHead className="font-semibold text-gray-600">Type Mouvement</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Quantité</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Référence</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((m, i) => {
                      const sens = m.type_mouvement?.sens ?? 0;
                      const isEntry = sens === 1;
                      return (
                        <TableRow key={m.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="font-medium text-gray-900">
                            {m.lot?.produit?.nom || m.lot?.numero_lot || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {m.lot?.numero_lot || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isEntry ? (
                                <ArrowDown className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ArrowUp className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-sm text-gray-700">
                                {m.type_mouvement?.libelle || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                            {m.quantite}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {m.reference_document || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleValidate(m.id)}
                                disabled={validatingId === m.id || rejectingId === m.id}
                                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-sm"
                              >
                                {validatingId === m.id ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                )}
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReject(m.id)}
                                disabled={rejectingId === m.id || validatingId === m.id}
                                className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-sm"
                              >
                                {rejectingId === m.id ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                )}
                                Rejeter
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
