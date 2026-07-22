import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { SlidePanel } from '../components/ui/SlidePanel';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { retourService } from '../services/retour';
import { bonCommandeService } from '../services/bon-commande';
import { lotService } from '../services/lot';
import type { Retour } from '../types/retour';
import {
  Search, RefreshCw, Eye, CheckCircle, XCircle, Edit3, Trash2, Plus, Loader2, Building2, RotateCcw, Package,
} from 'lucide-react';
import { cn } from '../lib/utils';

const validationConfig: Record<string, { label: string; color: string }> = {
  'EN ATTENTE': { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  'VALIDÉ': { label: 'Validé', color: 'bg-emerald-100 text-emerald-800' },
  'REJETÉ': { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
};

export function RetourStock() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<Retour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [slideType, setSlideType] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedRetour, setSelectedRetour] = useState<Retour | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Retour | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage), sort_by: 'id', sort_order: 'desc' };
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
  }, [currentPage, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await retourService.delete(deleteTarget.id);
      toast('Retour supprimé avec succès', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async (id: number) => {
    try {
      await retourService.validate(id);
      toast('Retour validé avec succès', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la validation', 'error');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await retourService.reject(id);
      toast('Retour rejeté', 'success');
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors du rejet', 'error');
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

  const openSlide = (type: 'create' | 'edit' | 'view', retour?: Retour) => {
    setSlideType(type);
    setSelectedRetour(retour || null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retour stock</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} retour${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => openSlide('create')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau retour
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
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
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Liste des retours</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">N° Retour</TableHead>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="font-semibold text-gray-600">Destination</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-36 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <RotateCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun retour trouvé</p>
              <p className="text-sm mt-1">Créez un nouveau retour pour commencer</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">N° Retour</TableHead>
                      <TableHead className="font-semibold text-gray-600">Client</TableHead>
                      <TableHead className="font-semibold text-gray-600">Destination</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((r, i) => {
                      const vc = validationConfig[r.statut_validation] || { label: r.statut_validation, color: 'bg-gray-100 text-gray-600' };
                      return (
                        <TableRow key={r.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="font-mono text-sm font-medium text-gray-900">{r.numero_retour}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-900">{r.partenaire_client?.nom || r.zone_provenance?.nom || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{r.partenaire_dest?.nom || r.zone_dest?.nom || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {r.date_retour ? new Date(r.date_retour).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', vc.color)}>
                              {vc.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/stock/retour/${r.id}`)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Détails">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openSlide('edit', r)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Modifier">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              {r.statut_validation === 'EN ATTENTE' && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleValidate(r.id)}
                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Valider">
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleReject(r.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Rejeter">
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {r.statut_validation === 'VALIDÉ' && (
                                <Button size="sm" onClick={() => handleTraiter(r.id)}
                                  className="h-8 px-3 bg-royal-600 hover:bg-royal-700 text-white text-xs font-medium rounded-lg shadow-sm" title="Traiter">
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                  Traiter
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Supprimer">
                                <Trash2 className="w-4 h-4" />
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

      <RetourFormSlide
        isOpen={slideType === 'create' || slideType === 'edit'}
        onClose={() => { setSlideType(null); setSelectedRetour(null); }}
        retour={selectedRetour}
        onSuccess={() => { setSlideType(null); setSelectedRetour(null); fetchData(); }}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le retour"
        message={`Confirmer la suppression du retour "${deleteTarget?.numero_retour}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}

function RetourFormSlide({ isOpen, onClose, retour, onSuccess }: { isOpen: boolean; onClose: () => void; retour: Retour | null; onSuccess: () => void }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [villes, setVilles] = useState<{ id: number; nom: string }[]>([]);
  const [partenaires, setPartenaires] = useState<{ id: number; nom: string }[]>([]);
  const [lots, setLots] = useState<{ id: number; numero_lot: string; quantite_disponible: number }[]>([]);
  const [form, setForm] = useState({
    numero_retour: '', date_retour: '', id_partenaire_client: '', id_zone_provenance: '',
    id_partenaire_dest: '', id_zone_dest: '', id_ville: '', commentaire: '',
    lignes: [{ id_lot: '', quantite_retournee: '', motif: '' }],
  });

  useEffect(() => {
    if (!isOpen) return;
    if (retour) {
      setForm({
        numero_retour: retour.numero_retour,
        date_retour: retour.date_retour.split('T')[0],
        id_partenaire_client: retour.id_partenaire_client ? String(retour.id_partenaire_client) : '',
        id_zone_provenance: '',
        id_partenaire_dest: retour.id_partenaire_dest ? String(retour.id_partenaire_dest) : '',
        id_zone_dest: '',
        id_ville: String(retour.id_ville),
        commentaire: retour.commentaire || '',
        lignes: retour.lignes?.map(l => ({
          id_lot: String(l.id_lot),
          quantite_retournee: String(l.quantite_retournee),
          motif: l.motif || '',
        })) || [{ id_lot: '', quantite_retournee: '', motif: '' }],
      });
    } else {
      const now = new Date().toISOString().split('T')[0];
      setForm({ numero_retour: '', date_retour: now, id_partenaire_client: '', id_zone_provenance: '', id_partenaire_dest: '', id_zone_dest: '', id_ville: '', commentaire: '', lignes: [{ id_lot: '', quantite_retournee: '', motif: '' }] });
    }
    bonCommandeService.getVilles().then(r => { if (r.success) setVilles(r.data.data); }).catch(() => {});
    bonCommandeService.getPartenaires().then(r => { if (r.success) setPartenaires(r.data.data); }).catch(() => {});
    lotService.list({ per_page: '500', statut: 'VALIDÉ' }).then(r => { if (r.success) setLots(r.data.data); }).catch(() => {});
  }, [isOpen, retour]);

  const updateLigne = (idx: number, field: string, value: string) => {
    setForm(f => {
      const lignes = [...f.lignes];
      lignes[idx] = { ...lignes[idx], [field]: value };
      return { ...f, lignes };
    });
  };

  const addLigne = () => {
    setForm(f => ({ ...f, lignes: [...f.lignes, { id_lot: '', quantite_retournee: '', motif: '' }] }));
  };

  const removeLigne = (idx: number) => {
    setForm(f => ({ ...f, lignes: f.lignes.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        numero_retour: form.numero_retour,
        date_retour: form.date_retour,
        id_ville: Number(form.id_ville),
        lignes: form.lignes
          .filter(l => l.id_lot && l.quantite_retournee)
          .map(l => ({ id_lot: Number(l.id_lot), quantite_retournee: Number(l.quantite_retournee), motif: l.motif || undefined })),
      };
      if (form.id_partenaire_client) payload.id_partenaire_client = Number(form.id_partenaire_client);
      if (form.id_partenaire_dest) payload.id_partenaire_dest = Number(form.id_partenaire_dest);
      if (form.commentaire) payload.commentaire = form.commentaire;

      if (retour) {
        await retourService.update(retour.id, payload);
        toast('Retour modifié avec succès', 'success');
      } else {
        await retourService.create(payload);
        toast('Retour créé avec succès', 'success');
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={retour ? 'Modifier le retour' : 'Nouveau retour'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">N° Retour *</label>
            <Input value={form.numero_retour} onChange={e => setForm(f => ({ ...f, numero_retour: e.target.value }))} className="bg-white/10 border-white/20 text-white" placeholder="Ex: RET-2024-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Date *</label>
            <Input type="date" value={form.date_retour} onChange={e => setForm(f => ({ ...f, date_retour: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Provenance (client)</label>
            <Select value={form.id_partenaire_client} onValueChange={v => setForm(f => ({ ...f, id_partenaire_client: v }))}>
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white"><SelectValue placeholder="Client (opt.)" /></SelectTrigger>
              <SelectContent>
                {partenaires.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Destination (fournisseur)</label>
            <Select value={form.id_partenaire_dest} onValueChange={v => setForm(f => ({ ...f, id_partenaire_dest: v }))}>
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white"><SelectValue placeholder="Fournisseur (opt.)" /></SelectTrigger>
              <SelectContent>
                {partenaires.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Ville *</label>
          <Select value={form.id_ville} onValueChange={v => setForm(f => ({ ...f, id_ville: v }))}>
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white"><SelectValue placeholder="Ville" /></SelectTrigger>
            <SelectContent>
              {villes.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-white/20 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-white/80">Lignes de retour</label>
            <Button type="button" size="sm" onClick={addLigne} className="bg-white/10 hover:bg-white/20 text-white text-xs">
              <Plus className="w-3 h-3 mr-1" /> Ajouter
            </Button>
          </div>
          {form.lignes.map((ligne, idx) => (
            <div key={idx} className="flex items-start gap-2 mb-2 p-2 rounded-lg bg-white/5">
              <div className="flex-1">
                <Select value={ligne.id_lot} onValueChange={v => updateLigne(idx, 'id_lot', v)}>
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white text-sm"><SelectValue placeholder="Lot" /></SelectTrigger>
                  <SelectContent>
                    {lots.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.numero_lot} (dispo: {l.quantite_disponible})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Input type="number" min="1" value={ligne.quantite_retournee} onChange={e => updateLigne(idx, 'quantite_retournee', e.target.value)}
                  className="bg-white/10 border-white/20 text-white text-sm" placeholder="Qté" />
              </div>
              <div className="flex-1">
                <Input value={ligne.motif} onChange={e => updateLigne(idx, 'motif', e.target.value)}
                  className="bg-white/10 border-white/20 text-white text-sm" placeholder="Motif (opt.)" />
              </div>
              {form.lignes.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLigne(idx)}
                  className="h-9 w-9 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Commentaire</label>
          <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-2 text-sm min-h-[60px]" placeholder="Optionnel" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">Annuler</Button>
          <Button type="submit" disabled={submitting || !form.numero_retour || !form.date_retour || !form.id_ville || form.lignes.every(l => !l.id_lot)}
            className="flex-1 bg-royal-600 hover:bg-royal-700 text-white shadow-sm">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</> : (retour ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </form>
    </SlidePanel>
  );
}



