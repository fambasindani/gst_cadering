import { useCallback, useEffect, useState } from 'react';
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
import { bonCommandeService } from '../services/bon-commande';
import type { BonCommande } from '../types/bon-commande';
import {
  Search, CheckCircle, XCircle, RefreshCw, FileText, Eye, Building2, DollarSign, Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const statutConfig: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-amber-100 text-amber-800' },
  ENVOYÉ: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800' },
  'REÇU PARTIELLEMENT': { label: 'Reçu partiellement', color: 'bg-purple-100 text-purple-800' },
  REÇU: { label: 'Reçu', color: 'bg-emerald-100 text-emerald-800' },
  ANNULE: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
};

const validationStatutConfig: Record<string, { label: string; color: string }> = {
  'EN ATTENTE': { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  VALIDÉ: { label: 'Validé', color: 'bg-emerald-100 text-emerald-800' },
  REJETÉ: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
};

export function ValidationBonCommande() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<BonCommande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [actionTarget, setActionTarget] = useState<BonCommande | null>(null);
  const [actionType, setActionType] = useState<'validate' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        statut_validation: 'EN ATTENTE',
        sort_by: 'id',
        sort_order: 'desc',
        per_page: String(pageSize),
        page: String(currentPage),
      };
      if (searchTerm) params.search = searchTerm;
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
  }, [currentPage, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === 'validate') {
        await bonCommandeService.validate(actionTarget.id);
        toast('Bon de commande validé avec succès', 'success');
      } else {
        await bonCommandeService.reject(actionTarget.id);
        toast('Bon de commande rejeté', 'success');
      }
      setActionTarget(null);
      setActionType(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || "Une erreur s'est produite", 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openAction = (item: BonCommande, type: 'validate' | 'reject') => {
    setActionTarget(item);
    setActionType(type);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation des bons de commande</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} bon${total > 1 ? 's' : ''} en attente`}</p>
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
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Bons de commande en attente de validation</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">N° Commande</TableHead>
                    <TableHead className="font-semibold text-gray-600">Fournisseur</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-32 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun bon de commande en attente</p>
              <p className="text-sm mt-1">Tous les bons de commande ont été traités</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">N° Commande</TableHead>
                      <TableHead className="font-semibold text-gray-600">Fournisseur</TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((b, i) => {
                      const sc = statutConfig[b.statut] || { label: b.statut, color: 'bg-gray-100 text-gray-600' };
                      const vsc = validationStatutConfig[b.statut_validation] || { label: b.statut_validation, color: 'bg-gray-100 text-gray-600' };
                      const lignes = b.lignes || [];
                      const totalMt = lignes.reduce((s, l) => s + l.quantite_commandee * l.prix_unitaire_ht, 0);
                      return (
                        <TableRow key={b.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="font-mono text-sm font-medium text-gray-900">{b.numero_commande}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{b.partenaire?.nom || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                            {b.date_commande ? new Date(b.date_commande).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                              {formatCurrency(totalMt, b.devise?.code)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', sc.color)}>
                                {sc.label}
                              </span>
                              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', vsc.color)}>
                                {vsc.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/bon-commande/${b.id}`)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Détails">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openAction(b, 'validate')}
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Valider">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openAction(b, 'reject')}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Rejeter">
                                <XCircle className="w-4 h-4" />
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

      <ConfirmModal
        isOpen={!!actionTarget && !!actionType}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        onConfirm={handleAction}
        title={actionType === 'validate' ? 'Valider le bon' : 'Rejeter le bon'}
        message={
          actionType === 'validate'
            ? `Confirmer la validation du bon "${actionTarget?.numero_commande}" ?`
            : `Confirmer le rejet du bon "${actionTarget?.numero_commande}" ?`
        }
        confirmLabel={actionType === 'validate' ? 'Valider' : 'Rejeter'}
        variant={actionType === 'validate' ? 'info' : 'danger'}
        loading={actionLoading}
      />
    </div>
  );
}
