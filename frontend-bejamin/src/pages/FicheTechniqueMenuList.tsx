import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { ficheTechniqueMenuService } from '../services/fiche-technique-menu';
import type { FicheTechniqueMenu } from '../types/fiche-technique-menu';
import {
  Search, RefreshCw, Plus, Pencil, Trash2, Eye, UtensilsCrossed,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function FicheTechniqueMenuList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<FicheTechniqueMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<FicheTechniqueMenu | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage) };
      if (searchTerm) params.search = searchTerm;
      const res = await ficheTechniqueMenuService.list(params);
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
      await ficheTechniqueMenuService.delete(deleteTarget.id);
      toast('Fiche technique supprimée', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    }
  };

  const handleToggle = async (m: FicheTechniqueMenu) => {
    try {
      const res = await ficheTechniqueMenuService.toggle(m.id);
      if (res.success) toast(res.data.actif ? 'Fiche technique activée' : 'Fiche technique désactivée', 'success');
      fetchData();
    } catch {
      toast('Erreur lors du changement de statut', 'error');
    }
  };

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiches techniques</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} fiche${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/recettes/fiche-technique/nouveau')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvelle fiche
          </Button>
        </div>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Input
          placeholder="Rechercher (code, nom)..."
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

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Toutes les fiches techniques</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code</TableHead>
                    <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                    <TableHead className="font-semibold text-gray-600">Cycle</TableHead>
                    <TableHead className="font-semibold text-gray-600">Périodicité</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Parties</TableHead>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actif</TableHead>
                    <TableHead className="text-center w-32 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-10 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-5 w-8 bg-gray-200 rounded mx-auto" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-14 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-24 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune fiche technique</p>
              <p className="text-sm mt-1">Cliquez sur "Nouvelle fiche" pour composer un menu</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Code</TableHead>
                      <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                      <TableHead className="font-semibold text-gray-600">Cycle</TableHead>
                      <TableHead className="font-semibold text-gray-600">Périodicité</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Parties</TableHead>
                      <TableHead className="font-semibold text-gray-600">Client</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actif</TableHead>
                      <TableHead className="text-center w-32 font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((f, i) => (
                      <TableRow key={f.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-mono text-sm font-medium text-royal-700">{f.code}</TableCell>
                        <TableCell className="font-medium text-gray-900">{f.nom}</TableCell>
                        <TableCell className="text-gray-600">{f.cycle || '-'}</TableCell>
                        <TableCell className="text-gray-600">{f.periodicite || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">{f.nombre_parties ?? 0}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{f.partenaire?.nom || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={f.actif ? 'success' : 'secondary'} className="text-xs">
                            {f.actif ? 'Oui' : 'Non'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/recettes/fiche-technique/${f.id}`)}
                              className="p-1.5 rounded text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/recettes/fiche-technique/${f.id}/modifier`)}
                              className="p-1.5 rounded text-gray-500 hover:text-royal-700 hover:bg-royal-50 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggle(f)}
                              className="p-1.5 rounded text-gray-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title={f.actif ? 'Désactiver' : 'Activer'}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(f)}
                              className="p-1.5 rounded text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
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
        title="Supprimer la fiche technique"
        message={`Supprimer "${deleteTarget?.nom}" ? Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
