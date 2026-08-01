import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Plus, Search, Pencil, Trash2, Eye, Users, Building2, Plane, Package,
  CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { partenaireService } from '../services/partenaire';
import type { Partenaire } from '../types/partenaire';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';

const FILTER_TABS = [
  { label: 'Tous', value: '' },
  { label: 'Clients Aériens', value: 'client-aerien' },
  { label: 'Clients Non Aériens', value: 'client-non-aerien' },
  { label: 'Fournisseurs', value: 'fournisseur' },
];

export function Partenaires() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('type') || '';

  const [data, setData] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Partenaire | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      if (activeFilter === 'client-aerien') {
        params.type_client = 'aerien';
        params.type = 'client';
      } else if (activeFilter === 'client-non-aerien') {
        params.type_client = 'non_aerien';
        params.type = 'client';
      } else if (activeFilter === 'fournisseur') {
        params.type = 'fournisseur';
      }

      const res = await partenaireService.list(params);
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
  }, [currentPage, pageSize, searchTerm, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (value: string) => {
    setSearchParams(value ? { type: value } : {});
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await partenaireService.delete(deleteTarget.id);
      toast('Partenaire supprimé avec succès', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partenaires</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} partenaire${total > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            title="Actualiser"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button
            className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm"
            onClick={() => navigate('/partenaire/creer')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau partenaire
          </Button>
        </div>
      </div>

      {/* Filtres par type */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeFilter === tab.value
                ? 'bg-royal-700 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-royal-300 hover:text-royal-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher un partenaire..."
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

      {/* Tableau */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Liste des partenaires</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Type</TableHead>
                    <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-600">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Magasin</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell>
                        <div className="h-5 w-36 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-200 rounded mt-1.5" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-4 w-28 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-200 rounded mt-1" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-16 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell><div className="h-8 w-20 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun partenaire trouvé</p>
              <p className="text-sm mt-1">Commencez par créer un nouveau partenaire</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-600">Type</TableHead>
                      <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-gray-600">Contact</TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Magasin</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((p, index) => (
                      <TableRow key={p.id} className={cn(
                        'hover:bg-royal-50/50 transition-colors',
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                      )}>
                        <TableCell>
                          <TypeBadge type={p.type} typeClient={p.type_client} />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          <div>{p.nom}</div>
                          {p.code_iata && (
                            <div className="text-xs text-gray-400 font-mono mt-0.5">IATA: {p.code_iata}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">{p.email || '-'}</div>
                          <div className="text-xs text-gray-400">{p.telephone || '-'}</div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                          {p.magasin?.nom || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            p.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600',
                          )}>
                            {p.actif ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Actif</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" /> Inactif</>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => navigate(`/partenaire/${p.id}`)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                              title="Détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => navigate(`/partenaire/${p.id}/modifier`)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setDeleteTarget(p)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Supprimer"
                            >
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
        onConfirm={handleDeleteConfirm}
        title="Supprimer le partenaire"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.nom}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function TypeBadge({ type, typeClient }: { type: string; typeClient: string | null }) {
  const isClient = type === 'client' || type === 'both';
  const isFournisseur = type === 'fournisseur' || type === 'both';
  const isAerien = typeClient === 'aerien' || typeClient === 'both';

  if (isFournisseur && !isClient) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
        <Package className="w-3 h-3 mr-1" />
        Fournisseur
      </span>
    );
  }
  if (isAerien) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
        <Plane className="w-3 h-3 mr-1" />
        Client Aérien
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
      <Building2 className="w-3 h-3 mr-1" />
      Client Non Aérien
    </span>
  );
}
