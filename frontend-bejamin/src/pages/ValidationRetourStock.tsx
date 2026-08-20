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
import { retourService } from '../services/retour';
import type { Retour } from '../types/retour';
import {
  Search, CheckCircle, XCircle, RefreshCw, Eye, Building2, RotateCcw, ClipboardCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; color: string }> = {
    'EN ATTENTE': { label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    'VALIDÉ': { label: 'Validé', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    'TRAITÉ': { label: 'Traité', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'REJETÉ': { label: 'Rejeté', color: 'bg-red-100 text-red-800 border-red-200' },
    'ANNULE': { label: 'Annulé', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  const config = map[statut] ?? { label: statut, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', config.color)}>
      {config.label}
    </span>
  );
}

type StatutOnglet = 'EN ATTENTE' | 'VALIDÉ' | 'ALL';

const onglets: { key: StatutOnglet; label: string }[] = [
  { key: 'EN ATTENTE', label: 'En attente' },
  { key: 'VALIDÉ', label: 'Validés / à traiter' },
  { key: 'ALL', label: 'Tous' },
];

export function ValidationRetourStock() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [onglet, setOnglet] = useState<StatutOnglet>('EN ATTENTE');
  const [data, setData] = useState<Retour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [validateTarget, setValidateTarget] = useState<Retour | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Retour | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: String(pageSize),
        page: String(currentPage),
        sort_by: 'id',
        sort_order: 'desc',
      };
      if (onglet === 'EN ATTENTE') params.statut = 'EN ATTENTE';
      if (onglet === 'VALIDÉ') params.statut = 'VALIDÉ,TRAITÉ';
      if (searchTerm) params.search = searchTerm;
      const res = await retourService.list(params);
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
      await retourService.validate(validateTarget.id);
      toast('Retour validé avec succès', 'success');
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
      await retourService.reject(rejectTarget.id);
      toast('Retour rejeté', 'success');
      setRejectTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string; error?: string };
      toast(error.message || error.error || 'Erreur lors du rejet', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTraiter = async (id: number) => {
    try {
      await retourService.traiter(id);
      toast('Retour traité avec succès', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors du traitement', 'error');
    }
  };

  const switchOnglet = (key: StatutOnglet) => { setOnglet(key); setCurrentPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation des retours stock</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : onglet === 'ALL'
              ? `${total} retour${total > 1 ? 's' : ''}`
              : `${total} retour${total > 1 ? 's' : ''} ${onglet === 'EN ATTENTE' ? 'en attente' : 'validés'}`}
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
            placeholder="Rechercher (n° retour, client)..."
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
            {onglet === 'ALL' ? 'Historique des retours' : onglet === 'EN ATTENTE' ? 'Retours en attente de validation' : 'Retours validés'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">N° Retour</TableHead>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-600">Destination</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center w-40 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-32 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <RotateCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">
                {onglet === 'ALL' ? 'Aucun retour enregistré' : onglet === 'EN ATTENTE' ? 'Aucun retour en attente' : 'Aucun retour validé'}
              </p>
              <p className="text-sm mt-1">
                {onglet === 'EN ATTENTE' ? 'Tous les retours ont été traités' : 'Consultez les autres onglets pour la trace'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">N° Retour</TableHead>
                      <TableHead className="font-semibold text-gray-600">Client</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-gray-600">Destination</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center w-40 font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((r, i) => (
                      <TableRow key={r.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-mono text-sm font-medium text-gray-900">{r.numero_retour}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-900">{r.partenaire_client?.nom || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-600">{r.partenaire_dest?.nom || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {r.date_retour ? new Date(r.date_retour).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge statut={r.statut_validation} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/stock/retour/${r.id}`)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Détails">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {r.statut_validation === 'EN ATTENTE' && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => setValidateTarget(r)}
                                  className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Valider">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setRejectTarget(r)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Rejeter">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {r.statut_validation === 'VALIDÉ' && (
                              <Button size="sm" onClick={() => handleTraiter(r.id)}
                                className="h-8 px-3 bg-royal-600 hover:bg-royal-700 text-white text-xs font-medium rounded-lg shadow-sm" title="Traiter">
                                <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                                Traiter
                              </Button>
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
        title="Valider le retour"
        message={`Confirmer la validation du retour "${validateTarget?.numero_retour}" ?`}
        variant="warning"
        confirmLabel="Valider"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        title="Rejeter le retour"
        message={`Confirmer le rejet du retour "${rejectTarget?.numero_retour}" ?`}
        variant="danger"
        confirmLabel="Rejeter"
        loading={actionLoading}
      />
    </div>
  );
}