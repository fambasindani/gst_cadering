import { useEffect, useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { DataTablePagination } from '../components/ui/DataTablePagination';

import { SlidePanel } from '../components/ui/SlidePanel';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { periodeInventaireService } from '../services/periode-inventaire';
import { bonCommandeService } from '../services/bon-commande';
import type { PeriodeInventaire } from '../types/validation';
import {
  Plus, Search, RefreshCw, Calendar, Play, Square, Pencil, Trash2, Eye, Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';

const STATUT_STYLES: Record<string, { variant: 'info' | 'warning' | 'success' | 'destructive'; label: string }> = {
  PREVU: { variant: 'info', label: 'Prévu' },
  EN_COURS: { variant: 'warning', label: 'En cours' },
  CLOTURE: { variant: 'success', label: 'Clôturé' },
  ANNULE: { variant: 'destructive', label: 'Annulé' },
};

export function PeriodeInventaire() {
  const { toast } = useToast();

  const [data, setData] = useState<PeriodeInventaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<PeriodeInventaire | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PeriodeInventaire | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [detailPeriode, setDetailPeriode] = useState<PeriodeInventaire | null>(null);

  const [magasins, setMagasins] = useState<{ id: number; nom: string }[]>([]);

  const [form, setForm] = useState({
    libelle: '',
    date_debut: '',
    date_fin: '',
    id_magasin: '',
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      const res = await periodeInventaireService.list(params);
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
  }, [currentPage, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadMagasins = useCallback(async () => {
    try {
      const res = await bonCommandeService.getMagasins();
      if (res.success) {
        setMagasins(res.data.data);
      }
    } catch {
      // silent
    }
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ libelle: '', date_debut: '', date_fin: '', id_magasin: '', description: '' });
    setFieldErrors({});
    loadMagasins();
    setPanelOpen(true);
  };

  const openEdit = (item: PeriodeInventaire) => {
    setEditing(item);
    setForm({
      libelle: item.libelle,
      date_debut: item.date_debut ? item.date_debut.slice(0, 10) : '',
      date_fin: item.date_fin ? item.date_fin.slice(0, 10) : '',
      id_magasin: String(item.id_magasin),
      description: item.description || '',
    });
    setFieldErrors({});
    loadMagasins();
    setPanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    try {
      setSaving(true);
      if (editing) {
        await periodeInventaireService.update(editing.id, form);
        toast('Période modifiée avec succès', 'success');
      } else {
        await periodeInventaireService.create(form);
        toast('Période créée avec succès', 'success');
      }
      setPanelOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(error.errors)) {
          fieldErrors[field] = messages[0];
        }
        setFieldErrors(fieldErrors);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await periodeInventaireService.delete(deleteTarget.id);
      toast('Période supprimée avec succès', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStart = async (id: number) => {
    try {
      setActionLoading(id);
      await periodeInventaireService.start(id);
      toast('Période démarrée avec succès', 'success');
      fetchData();
    } catch {
      toast('Erreur lors du démarrage', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (id: number) => {
    try {
      setActionLoading(id);
      await periodeInventaireService.close(id);
      toast('Période clôturée avec succès', 'success');
      fetchData();
    } catch {
      toast('Erreur lors de la clôture', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = (item: PeriodeInventaire) => {
    const isLoading = actionLoading === item.id;

    if (item.statut === 'PREVU') {
      return (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleStart(item.id)} disabled={isLoading}
            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Démarrer">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Modifier">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    if (item.statut === 'EN_COURS') {
      return (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleClose(item.id)} disabled={isLoading}
            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Clôturer">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => setDetailPeriode(item)}
          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Voir">
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Périodes d'inventaire</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} période${total > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={openCreate} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle période
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher par libellé..."
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
          <CardTitle className="text-lg font-semibold">Liste des périodes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Libellé</TableHead>
                    <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date début</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date fin</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell><div className="h-8 w-24 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune période d'inventaire</p>
              <p className="text-sm mt-1">Commencez par créer une nouvelle période</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Libellé</TableHead>
                      <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date début</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date fin</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, i) => {
                      const statutStyle = STATUT_STYLES[item.statut];
                      return (
                        <TableRow key={item.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="font-medium text-gray-900">{item.libelle}</TableCell>
                          <TableCell className="text-sm text-gray-600">{item.magasin?.nom || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {item.date_debut ? new Date(item.date_debut).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {item.date_fin ? new Date(item.date_fin).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={statutStyle?.variant ?? 'secondary'}>
                              {statutStyle?.label ?? item.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {renderActions(item)}
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

      <SlidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Modifier la période' : 'Nouvelle période'}
        width="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-white/80">Libellé *</Label>
            <Input
              value={form.libelle}
              onChange={(e) => { setForm((f) => ({ ...f, libelle: e.target.value })); setFieldErrors((f) => ({ ...f, libelle: '' })); }}
              placeholder="Libellé de la période"
              className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11",
                fieldErrors.libelle ? 'border-red-400' : 'border-royal-600')}
            />
            {fieldErrors.libelle && <p className="text-red-400 text-xs mt-1">{fieldErrors.libelle}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-white/80">Date début *</Label>
              <Input
                type="date"
                value={form.date_debut}
                onChange={(e) => { setForm((f) => ({ ...f, date_debut: e.target.value })); setFieldErrors((f) => ({ ...f, date_debut: '' })); }}
                className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11 [color-scheme:dark]",
                  fieldErrors.date_debut ? 'border-red-400' : 'border-royal-600')}
              />
              {fieldErrors.date_debut && <p className="text-red-400 text-xs mt-1">{fieldErrors.date_debut}</p>}
            </div>
            <div>
              <Label className="text-sm font-medium text-white/80">Date fin *</Label>
              <Input
                type="date"
                value={form.date_fin}
                onChange={(e) => { setForm((f) => ({ ...f, date_fin: e.target.value })); setFieldErrors((f) => ({ ...f, date_fin: '' })); }}
                className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11 [color-scheme:dark]",
                  fieldErrors.date_fin ? 'border-red-400' : 'border-royal-600')}
              />
              {fieldErrors.date_fin && <p className="text-red-400 text-xs mt-1">{fieldErrors.date_fin}</p>}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-white/80">Magasin *</Label>
            <div className="mt-1.5">
              <SearchableSelect
                options={magasins.map(v => ({ id: v.id, nom: v.nom }))}
                value={form.id_magasin}
                onValueChange={(value) => { setForm((f) => ({ ...f, id_magasin: value })); setFieldErrors((f) => ({ ...f, id_magasin: '' })); }}
                placeholder="Sélectionner un magasin"
                searchPlaceholder="Rechercher un magasin..."
                className={cn(fieldErrors.id_magasin ? 'border-red-400' : '')}
              />
            </div>
            {fieldErrors.id_magasin && <p className="text-red-400 text-xs mt-1">{fieldErrors.id_magasin}</p>}
          </div>

          <div>
            <Label className="text-sm font-medium text-white/80">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setFieldErrors((f) => ({ ...f, description: '' })); }}
              placeholder="Description (optionnelle)"
              className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 border-royal-600 focus:border-royal-500 focus:ring-royal-500",
                fieldErrors.description ? 'border-red-400' : 'border-royal-600')}
            />
            {fieldErrors.description && <p className="text-red-400 text-xs mt-1">{fieldErrors.description}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-royal-700">
            <Button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="h-11 px-6 border border-royal-600 bg-royal-700 text-white/80 hover:bg-royal-600 hover:text-white rounded-lg"
            >
              Annuler
            </Button>
            <Button
              type="submit" disabled={saving}
              className="bg-royal-600 hover:bg-royal-500 text-white"
            >
              {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      <SlidePanel
        isOpen={!!detailPeriode}
        onClose={() => setDetailPeriode(null)}
        title={`Détails - ${detailPeriode?.libelle ?? ''}`}
        width="md"
      >
        {detailPeriode && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Libellé</h3>
              <p className="text-white text-base">{detailPeriode.libelle}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">Date début</h3>
                <p className="text-white text-base">{detailPeriode.date_debut?.slice(0, 10)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">Date fin</h3>
                <p className="text-white text-base">{detailPeriode.date_fin?.slice(0, 10)}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Magasin</h3>
              <p className="text-white text-base">{detailPeriode.magasin?.nom ?? '—'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Statut</h3>
              <Badge variant={STATUT_STYLES[detailPeriode.statut]?.variant ?? 'info'}>
                {STATUT_STYLES[detailPeriode.statut]?.label ?? detailPeriode.statut}
              </Badge>
            </div>
            {detailPeriode.description && (
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">Description</h3>
                <p className="text-white text-base whitespace-pre-wrap">{detailPeriode.description}</p>
              </div>
            )}
            <div className="pt-4 border-t border-royal-700">
              <Button
                type="button"
                onClick={() => setDetailPeriode(null)}
                className="h-11 px-6 border border-royal-600 bg-royal-700 text-white/80 hover:bg-royal-600 hover:text-white rounded-lg"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </SlidePanel>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la période"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.libelle}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
