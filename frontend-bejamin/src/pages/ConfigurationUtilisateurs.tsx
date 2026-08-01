import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { utilisateurService } from '../services/utilisateur';
import { roleService } from '../services/role';
import { magasinService } from '../services/magasin';
import { api } from '../services/api';
import type { Utilisateur } from '../types/auth';
import {
  Plus, Search, Pencil, Trash2, RefreshCw, Users, CheckCircle, XCircle, Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ConfigurationUtilisateurs() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [magasinFilter, setMagasinFilter] = useState('_all');
  const [roleFilter, setRoleFilter] = useState('_all');
  const [magasins, setMagasins] = useState<{ id: number; nom: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; nom: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [deleteTarget, setDeleteTarget] = useState<Utilisateur | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        per_page: String(pageSize),
        page: String(currentPage),
        sort_by: 'id',
        sort_order: 'desc',
      };
      if (searchTerm) params.search = searchTerm;
      if (magasinFilter && magasinFilter !== '_all') params.magasin_id = magasinFilter;
      if (roleFilter && roleFilter !== '_all') params.role_id = roleFilter;

      const res = await utilisateurService.list(params);
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
  }, [currentPage, searchTerm, magasinFilter, roleFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    magasinService.list({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setMagasins(res.data.data); })
      .catch(() => {});
    roleService.list({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setRoles(res.data.data); })
      .catch(() => {});
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/departements', { params: { per_page: '200', sort_by: 'nom', sort_order: 'asc' } })
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await utilisateurService.delete(deleteTarget.id);
      toast('Utilisateur supprimé avec succès', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActif = async (user: Utilisateur) => {
    try {
      setTogglingId(user.id);
      await utilisateurService.toggleActif(user.id);
      toast(user.actif ? 'Utilisateur désactivé' : 'Utilisateur activé', 'success');
      fetchData();
    } catch {
      toast("Erreur lors du changement d'état", 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} utilisateur${total > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setMagasinFilter('_all'); setRoleFilter('_all'); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/configuration/utilisateurs/nouveau')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher un utilisateur..."
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
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Shield className="w-4 h-4 text-gray-400" />
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44 h-9 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous les rôles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={magasinFilter} onValueChange={(v) => { setMagasinFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44 h-9 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous les magasins</SelectItem>
              {magasins.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                    <TableHead className="font-semibold text-gray-600">Prénom</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-600">Email</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-600">Rôle</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Magasin</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-40 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-16 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell><div className="h-8 w-24 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun utilisateur trouvé</p>
              <p className="text-sm mt-1">Commencez par créer un nouvel utilisateur</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                      <TableHead className="font-semibold text-gray-600">Prénom</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-gray-600">Email</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-gray-600">Rôle</TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Magasin</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((u, i) => (
                      <TableRow key={u.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">{u.nom}</TableCell>
                        <TableCell className="text-gray-700">{u.prenom}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-600">{u.email}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                            <Shield className="w-3 h-3 mr-1" />
                            {u.role?.nom || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-gray-600">{u.magasin?.nom || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            u.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600',
                          )}>
                            {u.actif ? <><CheckCircle className="w-3 h-3 mr-1" /> Actif</> : <><XCircle className="w-3 h-3 mr-1" /> Inactif</>}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/configuration/utilisateurs/${u.id}/modifier`)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Modifier">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleActif(u)} disabled={togglingId === u.id}
                              className={cn('h-8 w-8 p-0 rounded-lg',
                                u.actif
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50')}
                              title={u.actif ? 'Désactiver' : 'Activer'}>
                              {u.actif ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u)}
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
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.nom} ${deleteTarget?.prenom}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
