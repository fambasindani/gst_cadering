import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { permissionService } from '../services/permission';
import type { Permission } from '../types/auth';
import {
  Plus, Search, Pencil, Trash2, RefreshCw, Key, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ConfigurationPermissions() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        per_page: String(pageSize),
        page: String(currentPage),
        sort_by: 'id',
        sort_order: 'desc',
      };
      if (searchTerm) params.search = searchTerm;

      const res = await permissionService.list(params);
      if (res.success) {
        setData(res.data.data);
        setTotal(res.data.total);
        setLastPage(res.data.last_page);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, pageSize]);

  const handleToggleActif = async (perm: Permission) => {
    try {
      await permissionService.toggleActif(perm.id);
      toast(perm.actif ? 'Permission désactivée' : 'Permission activée', 'success');
      fetchData();
    } catch {
      toast('Erreur lors de la modification', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await permissionService.delete(deleteTarget.id);
      toast('Permission supprimée avec succès', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} permission${total > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/configuration/permissions/nouveau')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle permission
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher une permission..."
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
          <CardTitle className="text-lg font-semibold">Liste des permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code</TableHead>
                    <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                    <TableHead className="font-semibold text-gray-600">Description</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-16 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell><div className="h-8 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Key className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune permission trouvée</p>
              <p className="text-sm mt-1">Commencez par créer une nouvelle permission</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Code</TableHead>
                      <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                      <TableHead className="font-semibold text-gray-600">Description</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((perm, i) => (
                      <TableRow key={perm.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell>
                          <code className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-mono">{perm.code}</code>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{perm.nom}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[250px] truncate">{perm.description || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            perm.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600',
                          )}>
                            {perm.actif ? <><CheckCircle className="w-3 h-3 mr-1" /> Actif</> : <><XCircle className="w-3 h-3 mr-1" /> Inactif</>}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/configuration/permissions/${perm.id}/modifier`)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Modifier">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleActif(perm)}
                              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg" title={perm.actif ? 'Désactiver' : 'Activer'}>
                              {perm.actif ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(perm)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la permission"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.nom}" ? Cette action est irréversible.${deleteTarget ? ' Certains rôles utilisent peut-être cette permission.' : ''}`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
