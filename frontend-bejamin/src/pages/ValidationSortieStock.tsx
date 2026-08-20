import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { mouvementStockService } from '../services/mouvement-stock';
import type { MouvementStock } from '../types/validation';
import {
  Search, CheckCircle, XCircle, RefreshCw, Building2, ArrowUp,
} from 'lucide-react';
import { cn } from '../lib/utils';

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; color: string }> = {
    'EN ATTENTE': { label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    'VALIDÉ': { label: 'Validé', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    'REJETÉ': { label: 'Rejeté', color: 'bg-red-100 text-red-800 border-red-200' },
  };
  const config = map[statut] ?? { label: statut, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', config.color)}>
      {config.label}
    </span>
  );
}

type StatutOnglet = 'EN ATTENTE' | 'VALIDÉ' | 'REJETÉ' | 'ALL';

const onglets: { key: StatutOnglet; label: string }[] = [
  { key: 'EN ATTENTE', label: 'En attente' },
  { key: 'VALIDÉ', label: 'Validés' },
  { key: 'REJETÉ', label: 'Rejetés' },
  { key: 'ALL', label: 'Tous' },
];

export function ValidationSortieStock() {
  const { toast } = useToast();

  const [onglet, setOnglet] = useState<StatutOnglet>('EN ATTENTE');
  const [data, setData] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [validateTarget, setValidateTarget] = useState<MouvementStock | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MouvementStock | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: String(pageSize),
        page: String(currentPage),
        sens: '-1',
        sort_by: 'date_mouvement',
        sort_order: 'desc',
      };
      if (onglet !== 'ALL') params.statut = onglet;
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
  }, [currentPage, searchTerm, pageSize, onglet]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleValidate = async () => {
    if (!validateTarget) return;
    setActionLoading(true);
    try {
      await mouvementStockService.validate(validateTarget.id);
      toast('Sortie validée avec succès', 'success');
      setValidateTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string; error?: string };
      toast(error.message || error.error || 'Erreur lors de la validation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await mouvementStockService.reject(rejectTarget.id);
      toast('Sortie rejetée', 'success');
      setRejectTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string; error?: string };
      toast(error.message || error.error || 'Erreur lors du rejet', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const switchOnglet = (key: StatutOnglet) => { setOnglet(key); setCurrentPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation des sorties stock</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : onglet === 'ALL'
              ? `${total} sortie${total > 1 ? 's' : ''}`
              : `${total} sortie${total > 1 ? 's' : ''} ${onglet === 'EN ATTENTE' ? 'en attente' : onglet === 'VALIDÉ' ? 'validées' : 'rejetées'}`}
          </p>
        </div>
        <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {onglets.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => switchOnglet(o.key)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                onglet === o.key ? 'bg-royal-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {onglet === 'ALL' ? 'Historique des sorties' : onglet === 'EN ATTENTE' ? 'Sorties en attente' : onglet === 'VALIDÉ' ? 'Sorties validées' : 'Sorties rejetées'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Réf.</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center w-24 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-24 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">
                {onglet === 'ALL' ? 'Aucune sortie enregistrée' : onglet === 'EN ATTENTE' ? 'Aucune sortie en attente' : onglet === 'VALIDÉ' ? 'Aucune sortie validée' : 'Aucune sortie rejetée'}
              </p>
              <p className="text-sm mt-1">
                {onglet === 'EN ATTENTE' ? 'Toutes les sorties ont été traitées' : 'Consultez les autres onglets pour la trace'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-gray-600">Client</TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Réf.</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center w-24 font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((m, i) => (
                      <TableRow key={m.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">
                          <div className="flex items-center gap-1.5">
                            <ArrowUp className="w-3.5 h-3.5 text-red-600" />
                            <span>{m.lot?.produit?.nom || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{m.lot?.numero_lot || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            {m.partenaire?.nom || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-gray-600">{m.reference_document || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-red-700">{m.quantite}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge statut={m.statut_validation} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {m.statut_validation === 'EN ATTENTE' ? (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => setValidateTarget(m)}
                                  className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Valider">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setRejectTarget(m)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Rejeter">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
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
        isOpen={!!validateTarget}
        onClose={() => setValidateTarget(null)}
        onConfirm={handleValidate}
        title="Valider la sortie"
        message={`Confirmer la validation de la sortie du lot "${validateTarget?.lot?.numero_lot || '-'}" ?`}
        variant="warning"
        confirmLabel="Valider"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        title="Rejeter la sortie"
        message={`Confirmer le rejet de la sortie du lot "${rejectTarget?.lot?.numero_lot || '-'}" ?`}
        variant="danger"
        confirmLabel="Rejeter"
        loading={actionLoading}
      />
    </div>
  );
}