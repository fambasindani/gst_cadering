import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { mouvementStockService } from '../services/mouvement-stock';
import type { MouvementStock } from '../types/validation';
import {
  Search, RefreshCw, Plus, Package, ArrowUp, Loader2, Pencil, Trash2, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function SortieStockForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [data, setData] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<MouvementStock | null>(null);
  const [validateTarget, setValidateTarget] = useState<MouvementStock | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MouvementStock | null>(null);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage), sort_by: 'date_mouvement', sort_order: 'desc', sens: '-1' };
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
  }, [currentPage, searchTerm, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await mouvementStockService.delete(deleteTarget.id);
      if (res.success) {
        toast('Sortie supprimée', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleValidate = async (id: number) => {
    setValidatingId(id);
    try {
      await mouvementStockService.validate(id);
      toast('Sortie validée avec succès', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string; error?: string };
      toast(error.message || error.error || 'Erreur lors de la validation', 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setRejectingId(id);
    try {
      await mouvementStockService.reject(id);
      toast('Sortie rejetée', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors du rejet', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const handleConfirmValidate = async () => {
    if (!validateTarget) return;
    await handleValidate(validateTarget.id);
    setValidateTarget(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    await handleReject(rejectTarget.id);
    setRejectTarget(null);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sortie stock</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} mouvement${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/stock/sortie/creer')} className="bg-amber-700 hover:bg-amber-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvelle sortie
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher (produit, référence)..."
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
          <CardTitle className="text-lg font-semibold">Sorties récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="font-semibold text-gray-600">Département</TableHead>
                    <TableHead className="font-semibold text-gray-600">Type</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="text-center w-20 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune sortie</p>
              <p className="text-sm mt-1">Cliquez sur "Nouvelle sortie" pour commencer</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                      <TableHead className="font-semibold text-gray-600">Client</TableHead>
                      <TableHead className="font-semibold text-gray-600">Département</TableHead>
                      <TableHead className="font-semibold text-gray-600">Type</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="text-center w-20 font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((m, i) => (
                      <TableRow key={m.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">{m.lot?.produit?.nom || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{m.lot?.numero_lot || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{m.partenaire?.nom || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{m.departement?.nom || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ArrowUp className="w-3.5 h-3.5 text-red-600" />
                            <span className="text-sm text-gray-700">{m.type_mouvement?.libelle || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-red-700">{m.quantite}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {m.statut_validation === 'EN ATTENTE' ? (
                              <>
                                <button
                                  onClick={() => setValidateTarget(m)}
                                  disabled={validatingId === m.id || rejectingId === m.id}
                                  className="p-1.5 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                                  title="Valider"
                                >
                                  {validatingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => setRejectTarget(m)}
                                  disabled={rejectingId === m.id || validatingId === m.id}
                                  className="p-1.5 rounded text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40"
                                  title="Rejeter"
                                >
                                  {rejectingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                </button>
                              </>
                            ) : null}
                            {(isAdmin || m.statut_validation === 'EN ATTENTE') && (
                              <>
                                <button
                                  onClick={() => navigate(`/stock/sortie/${m.id}/modifier`)}
                                  className="p-1.5 rounded text-gray-500 hover:text-royal-700 hover:bg-royal-50 transition-colors"
                                  title="Modifier"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(m)}
                                  className="p-1.5 rounded text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
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
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={Boolean(validateTarget)}
        onClose={() => setValidateTarget(null)}
        onConfirm={handleConfirmValidate}
        title="Valider la sortie"
        message={`Confirmer la validation de la sortie du lot "${validateTarget?.lot?.numero_lot || '-'}" ?`}
        variant="warning"
        confirmLabel="Valider"
        loading={validatingId !== null}
      />

      <ConfirmModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        title="Rejeter la sortie"
        message={`Confirmer le rejet de la sortie du lot "${rejectTarget?.lot?.numero_lot || '-'}" ?`}
        variant="danger"
        confirmLabel="Rejeter"
        loading={rejectingId !== null}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la sortie"
        message={`Supprimer la sortie du lot "${deleteTarget?.lot?.numero_lot || '-'}" ?`}
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
