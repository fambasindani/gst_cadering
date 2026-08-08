import { useCallback, useEffect, useState } from 'react';
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
import { useIsAdmin } from '../hooks/useIsAdmin';
import { bonCommandeService } from '../services/bon-commande';
import type { BonCommande } from '../types/bon-commande';
import {
  Plus, Search, RefreshCw, Eye, Pencil, Trash2, FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const statutConfig: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-amber-100 text-amber-800' },
  ENVOYÉ: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800' },
  'REÇU PARTIELLEMENT': { label: 'Reçu partiellement', color: 'bg-purple-100 text-purple-800' },
  REÇU: { label: 'Reçu', color: 'bg-emerald-100 text-emerald-800' },
  CLOTURE: { label: 'Clôturé', color: 'bg-red-100 text-red-800' },
};

export function BonCommande() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [data, setData] = useState<BonCommande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statutFilter, setStatutFilter] = useState('_all');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<BonCommande | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage), sort_by: 'id', sort_order: 'desc' };
      if (searchTerm) params.search = searchTerm;
      if (statutFilter && statutFilter !== '_all') params.statut = statutFilter;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const res = await bonCommandeService.list(params);
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
  }, [currentPage, searchTerm, statutFilter, dateDebut, dateFin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bonCommandeService.delete(deleteTarget.id);
      toast('Bon de commande supprimé', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bons de commande</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} bon${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setDateDebut(''); setDateFin(''); setStatutFilter('_all'); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/bon-commande/creer')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau bon
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher (n° ou fournisseur)..."
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
          <FileText className="w-4 h-4 text-gray-400" />
          <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-48 h-9 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous les statuts</SelectItem>
              <SelectItem value="BROUILLON">Brouillon</SelectItem>
              <SelectItem value="ENVOYÉ">Envoyé</SelectItem>
              <SelectItem value="REÇU PARTIELLEMENT">Reçu partiellement</SelectItem>
              <SelectItem value="REÇU">Reçu</SelectItem>
              <SelectItem value="CLOTURE">Clôturé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Du :</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => { setDateDebut(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:border-royal-500 focus:ring-royal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Au :</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => { setDateFin(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:border-royal-500 focus:ring-royal-500"
            />
          </div>
          {(dateDebut || dateFin) && (
            <button
              type="button"
              onClick={() => { setDateDebut(''); setDateFin(''); setCurrentPage(1); }}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Liste des bons de commande</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">N° Commande</TableHead>
                    <TableHead className="font-semibold text-gray-600">Partenaire</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-600">Destination</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant (saisi)</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant (prix actuel)</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-24 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun bon de commande</p>
              <p className="text-sm mt-1">Créez votre premier bon de commande</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">N° Commande</TableHead>
                      <TableHead className="font-semibold text-gray-600">Partenaire</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-gray-600">Destination</TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Montant (saisi)</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Montant (prix actuel)</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((b, i) => {
                      const sc = statutConfig[b.statut] || { label: b.statut, color: 'bg-gray-100 text-gray-600' };
                      const lignes = b.lignes || [];
                      const totalMt = lignes.reduce((s, l) => s + l.quantite_commandee * l.prix_unitaire_ht, 0);
                      const totalActuel = b.montant_actuel ?? lignes.reduce((s, l) => s + l.quantite_commandee * (l.prix_actuel ?? l.prix_unitaire_ht), 0);
                      const diff = Math.abs(totalActuel - totalMt) > 0.005;
                      return (
                        <TableRow key={b.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="font-mono text-sm font-medium text-gray-900">{b.numero_commande}</TableCell>
                          <TableCell className="font-medium text-gray-900">{b.partenaire?.nom || '-'}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-gray-600">{b.magasin_destination?.nom || '-'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-gray-600">{b.date_commande ? new Date(b.date_commande).toLocaleDateString('fr-FR') : '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-gray-400 line-through decoration-gray-300">
                            {formatCurrency(totalMt, b.devise?.code)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold text-royal-700">
                            {formatCurrency(totalActuel, b.devise?.code)}
                            {diff && (
                              <span className="block text-[11px] font-medium text-amber-600">
                                {totalActuel > totalMt ? '+' : ''}{formatCurrency(totalActuel - totalMt, b.devise?.code)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', sc.color)}>
                              {sc.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/bon-commande/${b.id}`)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Détails">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {b.statut === 'BROUILLON' || isAdmin ? (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => navigate(`/bon-commande/${b.id}/modifier`)}
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Modifier">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(b)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Supprimer">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : null}
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le bon"
        message={`Supprimer le bon "${deleteTarget?.numero_commande}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
