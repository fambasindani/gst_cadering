import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { Badge } from '../components/ui/badge';
import { SlidePanel } from '../components/ui/SlidePanel';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { lotService } from '../services/lot';
import type { Lot } from '../types/lot';
import {
  Search, RefreshCw, Package, CheckCircle, XCircle, Edit3, Trash2, Plus, Eye, Barcode, Calendar,
} from 'lucide-react';
import { cn } from '../lib/utils';

const validationConfig: Record<string, { label: string; color: string }> = {
  'BROUILLON': { label: 'En attente', color: 'bg-gray-100 text-gray-700 border border-gray-300' },
  'EN ATTENTE': { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  'VALIDÉ': { label: 'Validé', color: 'bg-emerald-100 text-emerald-800' },
  'REJETÉ': { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
};

function isPeremptionProche(datePeremption: string): boolean {
  const d = new Date(datePeremption);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

function isPerime(datePeremption: string): boolean {
  return new Date(datePeremption) < new Date();
}

export function StockLotSerie() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = useIsAdmin();

  const [peremptionProche, setPeremptionProche] = useState(searchParams.get('peremption_proche') === '1');

  const [data, setData] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [viewLot, setViewLot] = useState<Lot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lot | null>(null);
  const [validateTarget, setValidateTarget] = useState<Lot | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Lot | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage), sort_by: 'id', sort_order: 'desc' };
      if (searchTerm) params.search = searchTerm;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      if (peremptionProche) params.peremption_proche = '1';
      const res = await lotService.list(params);
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
  }, [currentPage, searchTerm, dateDebut, dateFin, pageSize, peremptionProche]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await lotService.delete(deleteTarget.id);
      toast('Lot supprimé avec succès', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmValidate = async () => {
    if (!validateTarget) return;
    setActionLoading(true);
    try {
      await lotService.validate(validateTarget.id);
      toast('Lot validé avec succès', 'success');
      setValidateTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la validation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await lotService.reject(rejectTarget.id);
      toast('Lot rejeté', 'success');
      setRejectTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors du rejet', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lot / Série</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} lot${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setDateDebut(''); setDateFin(''); setPeremptionProche(false); setSearchParams({}); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/stock/lot-serie/creer')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau lot
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher (n° lot, produit, code QR)..."
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
        <div className="flex items-center gap-2">
          <Input type="date" value={dateDebut}
            onChange={(e) => { setDateDebut(e.target.value); setCurrentPage(1); }}
            className="w-36 h-10 border-gray-200 text-sm" />
          <span className="text-gray-400 text-sm">au</span>
          <Input type="date" value={dateFin}
            onChange={(e) => { setDateFin(e.target.value); setCurrentPage(1); }}
            className="w-36 h-10 border-gray-200 text-sm" />
        </div>
      </div>

      {peremptionProche && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <Calendar className="w-4 h-4" />
            Lots proches de la péremption (7 jours ou moins)
          </div>
          <button
            type="button"
            onClick={() => { setPeremptionProche(false); setSearchParams({}); setCurrentPage(1); }}
            className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
          >
            Afficher tous les lots
          </button>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {peremptionProche ? 'Lots proches de la péremption' : 'Liste des lots'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">N° Lot</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Disponible</TableHead>
                    <TableHead className="font-semibold text-gray-600">Péremption</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-36 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun lot trouvé</p>
              <p className="text-sm mt-1">Créez un nouveau lot pour commencer</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">N° Lot</TableHead>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Disponible</TableHead>
                      <TableHead className="font-semibold text-gray-600">Péremption</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((l, i) => {
                      const vc = validationConfig[l.statut_validation] || { label: l.statut_validation, color: 'bg-gray-100 text-gray-600' };
                      return (
                        <TableRow key={l.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="font-mono text-sm font-medium text-gray-900">{l.numero_lot}</TableCell>
                          <TableCell className="text-sm text-gray-900">{l.produit?.nom || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {l.magasin?.nom || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                            {l.quantite_disponible}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className={cn(
                                'text-sm',
                                isPerime(l.date_peremption) && 'text-red-600 font-medium',
                                isPeremptionProche(l.date_peremption) && !isPerime(l.date_peremption) && 'text-amber-600 font-medium',
                                !isPeremptionProche(l.date_peremption) && !isPerime(l.date_peremption) && 'text-gray-600',
                              )}>
                                {new Date(l.date_peremption).toLocaleDateString('fr-FR')}
                              </span>
                              {isPerime(l.date_peremption) && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Périmé</Badge>}
                              {isPeremptionProche(l.date_peremption) && !isPerime(l.date_peremption) &&
                                <Badge variant="warning" className="text-[10px] px-1.5 py-0">Exp. bientôt</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', vc.color)}>
                              {vc.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setViewLot(l)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Détails">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {l.code_qr && (
                                <Button variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Voir QR">
                                  <Barcode className="w-4 h-4" />
                                </Button>
                              )}
                              {(isAdmin || l.statut_validation !== 'VALIDÉ') && (
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/stock/lot-serie/${l.id}/modifier`)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Modifier">
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              )}
                              {l.statut_validation === 'EN ATTENTE' && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => setValidateTarget(l)}
                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Valider">
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => setRejectTarget(l)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Rejeter">
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {(isAdmin || l.statut_validation !== 'VALIDÉ') && (
                                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(l)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Supprimer">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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

      <LotViewSlide isOpen={!!viewLot} onClose={() => setViewLot(null)} lot={viewLot} />

      <ConfirmModal
        isOpen={!!validateTarget}
        onClose={() => setValidateTarget(null)}
        onConfirm={handleConfirmValidate}
        title="Valider le lot"
        message={`Confirmer la validation du lot "${validateTarget?.numero_lot}" ?`}
        variant="warning"
        confirmLabel="Valider"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        title="Rejeter le lot"
        message={`Confirmer le rejet du lot "${rejectTarget?.numero_lot}" ?`}
        variant="danger"
        confirmLabel="Rejeter"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le lot"
        message={`Confirmer la suppression du lot "${deleteTarget?.numero_lot}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}

function LotViewSlide({ isOpen, onClose, lot }: { isOpen: boolean; onClose: () => void; lot: Lot | null }) {
  if (!lot) return null;
  const vc = validationConfig[lot.statut_validation] || { label: lot.statut_validation, color: 'bg-gray-100 text-gray-600' };
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={`Lot ${lot.numero_lot}`}>
      <div className="space-y-4 text-white">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-white/60">N° Lot :</span>
            <p className="font-medium mt-0.5">{lot.numero_lot}</p>
          </div>
          <div>
            <span className="text-white/60">Produit :</span>
            <p className="font-medium mt-0.5">{lot.produit?.nom || '-'}</p>
          </div>
          <div>
            <span className="text-white/60">Magasin :</span>
            <p className="font-medium mt-0.5">{lot.magasin?.nom || '-'}</p>
          </div>
          <div>
            <span className="text-white/60">Quantité reçue :</span>
            <p className="font-medium mt-0.5">{lot.quantite_recue}</p>
          </div>
          <div>
            <span className="text-white/60">Quantité disponible :</span>
            <p className="font-medium mt-0.5">{lot.quantite_disponible}</p>
          </div>
          <div>
            <span className="text-white/60">Date réception :</span>
            <p className="font-medium mt-0.5">{lot.date_reception ? new Date(lot.date_reception).toLocaleDateString('fr-FR') : '-'}</p>
          </div>
          <div>
            <span className="text-white/60">Péremption :</span>
            <p className="font-medium mt-0.5">{new Date(lot.date_peremption).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <span className="text-white/60">Statut :</span>
            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1', vc.color)}>
              {vc.label}
            </span>
          </div>
        </div>
        {lot.partenaire && (
          <div className="text-sm">
            <span className="text-white/60">Fournisseur :</span>
            <p className="font-medium mt-0.5">{lot.partenaire?.nom || '-'}</p>
          </div>
        )}
        {lot.commentaire && (
          <div className="text-sm">
            <span className="text-white/60">Commentaire :</span>
            <p className="font-medium mt-0.5">{lot.commentaire}</p>
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
