import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { SlidePanel } from '../components/ui/SlidePanel';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { mouvementStockService } from '../services/mouvement-stock';
import { typeMouvementService } from '../services/type-mouvement';
import type { TypeMouvement } from '../services/type-mouvement';
import { lotService } from '../services/lot';
import type { MouvementStock } from '../types/validation';
import {
  Search, RefreshCw, Plus, Package, ArrowDown, Loader2, Pencil, Trash2, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function EntreeStockForm() {
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [data, setData] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingMvt, setEditingMvt] = useState<MouvementStock | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MouvementStock | null>(null);
  const [validateTarget, setValidateTarget] = useState<MouvementStock | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MouvementStock | null>(null);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage), sort_by: 'date_mouvement', sort_order: 'desc', sens: '1' };
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
  }, [currentPage, searchTerm, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await mouvementStockService.delete(deleteTarget.id);
      if (res.success) {
        toast('Entrée supprimée', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleValidate = async (id: number) => {
    setValidatingId(id);
    try {
      await mouvementStockService.validate(id);
      toast('Entrée validée avec succès', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string; error?: string };
      toast(error.message || error.error || 'Erreur lors de la validation', 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setRejectingId(id);
    try {
      await mouvementStockService.reject(id);
      toast('Entrée rejetée', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors du rejet', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const handleConfirmValidate = async () => {
    if (!validateTarget) return;
    await handleValidate(validateTarget.id);
    setValidateTarget(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    await handleReject(rejectTarget.id);
    setRejectTarget(null);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrée stock</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} mouvement${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => { setEditingMvt(null); setSlideOpen(true); }} className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvelle entrée
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
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
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Entrées récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                    <TableHead className="font-semibold text-gray-600">Type</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Réf.</TableHead>
                    <TableHead className="text-center w-20 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune entrée</p>
              <p className="text-sm mt-1">Cliquez sur "Nouvelle entrée" pour commencer</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                      <TableHead className="font-semibold text-gray-600">Type</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Réf.</TableHead>
                      <TableHead className="text-center w-20 font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((m, i) => (
                      <TableRow key={m.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">{m.lot?.produit?.nom || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{m.lot?.numero_lot || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-sm text-gray-700">{m.type_mouvement?.libelle || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-emerald-700">+{m.quantite}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{m.reference_document || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {m.statut_validation === 'EN ATTENTE' ? (
                              <>
                                <button
                                  onClick={() => setValidateTarget(m)}
                                  disabled={validatingId === m.id || rejectingId === m.id}
                                  className="p-1.5 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                                  title="Valider"
                                >
                                  {validatingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => setRejectTarget(m)}
                                  disabled={rejectingId === m.id || validatingId === m.id}
                                  className="p-1.5 rounded text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40"
                                  title="Rejeter"
                                >
                                  {rejectingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                </button>
                              </>
                            ) : null}
                            {(isAdmin || m.statut_validation === 'EN ATTENTE') && (
                              <>
                                <button
                                  onClick={() => { setEditingMvt(m); setSlideOpen(true); }}
                                  className="p-1.5 rounded text-gray-500 hover:text-royal-700 hover:bg-royal-50 transition-colors"
                                  title="Modifier"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(m)}
                                  className="p-1.5 rounded text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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

      <EntreeFormSlide
        isOpen={slideOpen}
        editingMvt={editingMvt}
        onClose={() => { setSlideOpen(false); setEditingMvt(null); }}
        onSuccess={() => { setSlideOpen(false); setEditingMvt(null); fetchData(); }}
      />

      <ConfirmModal
        isOpen={Boolean(validateTarget)}
        onClose={() => setValidateTarget(null)}
        onConfirm={handleConfirmValidate}
        title="Valider l'entrée"
        message={`Confirmer la validation de l'entrée du lot "${validateTarget?.lot?.numero_lot || '-'}" ?`}
        variant="warning"
        confirmLabel="Valider"
        loading={validatingId !== null}
      />

      <ConfirmModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        title="Rejeter l'entrée"
        message={`Confirmer le rejet de l'entrée du lot "${rejectTarget?.lot?.numero_lot || '-'}" ?`}
        variant="danger"
        confirmLabel="Rejeter"
        loading={rejectingId !== null}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'entrée"
        message={`Supprimer l'entrée du lot "${deleteTarget?.lot?.numero_lot || '-'}" ?`}
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function EntreeFormSlide({ isOpen, editingMvt, onClose, onSuccess }: { isOpen: boolean; editingMvt: MouvementStock | null; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [types, setTypes] = useState<TypeMouvement[]>([]);
  const [lots, setLots] = useState<{ id: number; numero_lot: string; quantite_disponible: number; produit?: { nom: string } | null }[]>([]);
  const [form, setForm] = useState({ id_lot: '', id_type_mouvement: '', quantite: '', date_mouvement: '', reference_document: '', commentaire: '' });

  const isEdit = Boolean(editingMvt);

  useEffect(() => {
    if (!isOpen) return;
    if (editingMvt) {
      setForm({
        id_lot: String(editingMvt.id_lot),
        id_type_mouvement: String(editingMvt.id_type_mouvement),
        quantite: String(editingMvt.quantite),
        date_mouvement: editingMvt.date_mouvement || '',
        reference_document: editingMvt.reference_document || '',
        commentaire: editingMvt.commentaire || '',
      });
    } else {
      setForm({ id_lot: '', id_type_mouvement: '', quantite: '', date_mouvement: new Date().toISOString().split('T')[0], reference_document: '', commentaire: '' });
    }
    typeMouvementService.getEntree().then(r => { if (r.success) setTypes(r.data); }).catch(() => {});
    lotService.list({ per_page: '500', statut: 'VALIDÉ' }).then(r => { if (r.success) setLots(r.data.data); }).catch(() => {});
  }, [isOpen, editingMvt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, string | number> = {
        id_lot: Number(form.id_lot),
        id_type_mouvement: Number(form.id_type_mouvement),
        quantite: Number(form.quantite),
      };
      if (form.date_mouvement) payload.date_mouvement = form.date_mouvement;
      if (form.reference_document) payload.reference_document = form.reference_document;
      if (form.commentaire) payload.commentaire = form.commentaire;

      if (isEdit && editingMvt) {
        const res = await mouvementStockService.update(editingMvt.id, payload);
        if (res.success) {
          toast('Entrée modifiée avec succès', 'success');
          onSuccess();
        }
      } else {
        const res = await mouvementStockService.create(payload);
        if (res.success) {
          toast('Entrée stock créée avec succès', 'success');
          onSuccess();
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={isEdit ? 'Modifier l\'entrée stock' : 'Nouvelle entrée stock'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Type d'entrée *</label>
          <SearchableSelect
            options={types.map(t => ({ id: t.id, nom: t.libelle }))}
            value={form.id_type_mouvement}
            onValueChange={v => setForm(f => ({ ...f, id_type_mouvement: v }))}
            placeholder="Type de mouvement"
            searchPlaceholder="Rechercher un type..."
            className="w-full bg-white/10 border-white/20 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Lot *</label>
          <SearchableSelect
            options={lots.map(l => ({ id: l.id, nom: l.numero_lot, sousTitre: `${l.produit?.nom ? `${l.produit.nom} - ` : ''}dispo: ${l.quantite_disponible}` }))}
            value={form.id_lot}
            onValueChange={v => setForm(f => ({ ...f, id_lot: v }))}
            placeholder="Sélectionner un lot"
            searchPlaceholder="Rechercher un lot..."
            className="w-full bg-white/10 border-white/20 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Quantité *</label>
          <Input type="number" min="1" value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Date mouvement</label>
          <Input type="date" value={form.date_mouvement} onChange={e => setForm(f => ({ ...f, date_mouvement: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Référence document</label>
          <Input value={form.reference_document} onChange={e => setForm(f => ({ ...f, reference_document: e.target.value }))} className="bg-white/10 border-white/20 text-white" placeholder="N° bon, facture..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Commentaire</label>
          <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-2 text-sm min-h-[80px]" placeholder="Optionnel" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">Annuler</Button>
          <Button type="submit" disabled={submitting || !form.id_lot || !form.id_type_mouvement || !form.quantite}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isEdit ? 'Modification...' : 'Création...'}</> : isEdit ? 'Modifier' : 'Créer l\'entrée'}
          </Button>
        </div>
      </form>
    </SlidePanel>
  );
}
