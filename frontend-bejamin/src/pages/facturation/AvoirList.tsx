import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { DataTablePagination } from '../../components/ui/DataTablePagination';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import { useToast } from '../../hooks/useToast';
import { avoirService } from '../../services/avoir';
import type { Avoir } from '../../types/facturation';
import { formatCurrency } from '../../lib/format';
import {
  Search, RefreshCw, Plus, Eye, Trash2, FileText,
} from 'lucide-react';
import { cn } from '../../lib/utils';

function formatDate(d: string | null | undefined): string {
  if (!d) return '-';
  const p = d.split('T')[0] || d;
  const [y, m, day] = p.split('-');
  return `${day}/${m}/${y}`;
}

export function AvoirList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<Avoir[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<Avoir | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage) };
      if (searchTerm) params.search = searchTerm;
      const res = await avoirService.list(params);
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
      await avoirService.delete(deleteTarget.id);
      toast('Avoir supprimé', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    }
  };

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avoirs</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} avoir${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/facturation/avoirs/creer')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvel avoir
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher (numéro)..."
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
          <CardTitle className="text-lg font-semibold">Liste des avoirs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Numéro</TableHead>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Facture origine</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                    <TableHead className="text-center w-20 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-20 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun avoir</p>
              <p className="text-sm mt-1">Cliquez sur "Nouvel avoir" pour créer un avoir</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Numéro</TableHead>
                      <TableHead className="font-semibold text-gray-600">Client</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Facture origine</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                      <TableHead className="text-center w-20 font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((a, i) => (
                      <TableRow key={a.id} className={cn('hover:bg-royal-50/50 transition-colors cursor-pointer', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')} onClick={() => navigate(`/facturation/avoirs/${a.id}`)}>
                        <TableCell className="font-mono text-sm font-medium text-royal-700">{a.numero_avoir}</TableCell>
                        <TableCell className="font-medium text-gray-900">{a.client?.nom || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(a.date_avoir)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{a.facture_origine?.numero_facture || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-red-600">{formatCurrency(a.montant_ht, a.devise?.code)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => navigate(`/facturation/avoirs/${a.id}`)} className="p-1.5 rounded text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Voir">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
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
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'avoir"
        message={`Supprimer l'avoir "${deleteTarget?.numero_avoir}" ? Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
