import { useEffect, useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { useToast } from '../hooks/useToast';
import { inventaireService } from '../services/inventaire';
import { periodeInventaireService } from '../services/periode-inventaire';
import { bonCommandeService } from '../services/bon-commande';
import type { PeriodeInventaire, Inventaire } from '../types/validation';
import {
  Search, RefreshCw, Plus, Loader2, Save, Trash2, Pencil, X, Package, MapPin,
  TrendingUp, TrendingDown, Minus, ClipboardList,
} from 'lucide-react';
import { cn } from '../lib/utils';

const STATUT_STYLES: Record<string, { variant: 'info' | 'warning' | 'success' | 'destructive'; label: string }> = {
  PREVU: { variant: 'info', label: 'Prévu' },
  EN_COURS: { variant: 'warning', label: 'En cours' },
  CLOTURE: { variant: 'success', label: 'Clôturé' },
  ANNULE: { variant: 'destructive', label: 'Annulé' },
};

export function SaisieInventaire() {
  const { toast } = useToast();

  const [periodes, setPeriodes] = useState<PeriodeInventaire[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState<PeriodeInventaire | null>(null);

  const [produits, setProduits] = useState<{ id: number; nom: string; code_article: string }[]>([]);
  const [magasins, setMagasins] = useState<{ id: number; nom: string }[]>([]);

  const [form, setForm] = useState({
    id_produit: '',
    id_magasin: '',
    stock_physique_compte: '',
    commentaire: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<Inventaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchPeriodes = useCallback(async () => {
    try {
      const res = await periodeInventaireService.list({ per_page: '200', sort_by: 'id', sort_order: 'desc' });
      if (res.success) {
        setPeriodes(res.data.data);
      }
    } catch {
      //
    }
  }, []);

  useEffect(() => { fetchPeriodes(); }, [fetchPeriodes]);

  const fetchProduits = useCallback(async () => {
    try {
      const res = await bonCommandeService.getProduits({ actif: '1' });
      if (res.success) {
        setProduits(res.data.data);
      }
    } catch {
      //
    }
  }, []);

  const fetchMagasins = useCallback(async () => {
    try {
      const res = await bonCommandeService.getMagasins();
      if (res.success) {
        setMagasins(res.data.data);
      }
    } catch {
      //
    }
  }, []);

  useEffect(() => { fetchProduits(); fetchMagasins(); }, [fetchProduits, fetchMagasins]);

  const fetchData = useCallback(async () => {
    if (!selectedPeriodeId) {
      setData([]);
      setTotal(0);
      setLastPage(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await inventaireService.list({
        periode_id: selectedPeriodeId,
        per_page: String(pageSize),
        page: String(currentPage),
      });
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
  }, [selectedPeriodeId, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ id_produit: '', id_magasin: String(selectedPeriode?.id_magasin ?? ''), stock_physique_compte: '', commentaire: '' });
    setFieldErrors({});
  };

  const handlePeriodeChange = (value: string) => {
    setSelectedPeriodeId(value);
    setCurrentPage(1);
    const periode = periodes.find((p) => String(p.id) === value);
    setSelectedPeriode(periode ?? null);
    resetForm();
    if (periode) {
      setForm((f) => ({ ...f, id_magasin: String(periode.id_magasin) }));
    }
  };

  const openEdit = (inv: Inventaire) => {
    setEditingId(inv.id);
    setForm({
      id_produit: String(inv.id_produit),
      id_magasin: String(inv.id_magasin),
      stock_physique_compte: String(inv.stock_physique_compte),
      commentaire: inv.commentaire || '',
    });
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!selectedPeriodeId) {
      setFieldErrors({ id_periode: 'Sélectionnez une période' });
      return;
    }
    if (!form.id_produit) {
      setFieldErrors((f) => ({ ...f, id_produit: 'Sélectionnez un produit' }));
      return;
    }
    if (!form.id_magasin) {
      setFieldErrors((f) => ({ ...f, id_magasin: 'Sélectionnez un magasin' }));
      return;
    }
    if (!form.stock_physique_compte || parseInt(form.stock_physique_compte) < 0) {
      setFieldErrors((f) => ({ ...f, stock_physique_compte: 'Saisissez un stock physique valide' }));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await inventaireService.update(editingId, {
          stock_physique_compte: parseInt(form.stock_physique_compte),
          commentaire: form.commentaire,
        });
        toast('Inventaire modifié avec succès', 'success');
      } else {
        const res = await inventaireService.create({
          id_periode_inventaire: Number(selectedPeriodeId),
          id_produit: Number(form.id_produit),
          id_magasin: Number(form.id_magasin),
          stock_physique_compte: parseInt(form.stock_physique_compte),
          commentaire: form.commentaire,
        });
        if (res.success) {
          toast('Inventaire créé avec succès', 'success');
        }
      }
      resetForm();
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const flat: Record<string, string> = {};
        Object.entries(error.errors).forEach(([, msgs]) => { if (msgs.length) flat.general = msgs[0]; });
        setFieldErrors(flat);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoading(id);
    try {
      await inventaireService.delete(id);
      toast('Inventaire supprimé', 'success');
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const periodesEnCours = periodes.filter((p) => p.statut === 'EN_COURS');

  const stats = {
    totalTheorique: data.reduce((s, i) => s + i.stock_theorique, 0),
    totalPhysique: data.reduce((s, i) => s + i.stock_physique_compte, 0),
    ecartsPositifs: data.filter((i) => i.ecart > 0).length,
    ecartsNegatifs: data.filter((i) => i.ecart < 0).length,
    sansEcart: data.filter((i) => i.ecart === 0).length,
  };

  const getEcartDisplay = (ecart: number) => {
    if (ecart > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="font-mono">+{ecart}</span>
        </span>
      );
    }
    if (ecart < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
          <TrendingDown className="w-3.5 h-3.5" />
          <span className="font-mono">{ecart}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
        <Minus className="w-3.5 h-3.5" />
        <span className="font-mono">0</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-royal-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-royal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saisie d'inventaire</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedPeriodeId ? `${total} enregistrement${total > 1 ? 's' : ''}` : 'Sélectionnez une période en cours'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { fetchPeriodes(); fetchData(); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-royal-500 to-royal-700" />
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400" />
              <Select
                value={selectedPeriodeId}
                onValueChange={handlePeriodeChange}
              >
                <SelectTrigger className="w-72 h-10 bg-white border-gray-200">
                  <SelectValue placeholder="Sélectionnez une période en cours" />
                </SelectTrigger>
                <SelectContent>
                  {periodesEnCours.length === 0 ? (
                    <SelectItem value="" disabled>Aucune période en cours</SelectItem>
                  ) : (
                    periodesEnCours.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.libelle} ({p.magasin?.nom || '-'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedPeriode && (
              <Badge variant={STATUT_STYLES[selectedPeriode.statut]?.variant ?? 'info'}>
                {STATUT_STYLES[selectedPeriode.statut]?.label ?? selectedPeriode.statut}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPeriodeId && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Produits</p>
                <p className="text-xl font-bold text-gray-900">{total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Excédents</p>
                <p className="text-xl font-bold text-gray-900">{stats.ecartsPositifs}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Manquants</p>
                <p className="text-xl font-bold text-gray-900">{stats.ecartsNegatifs}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Minus className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sans écart</p>
                <p className="text-xl font-bold text-gray-900">{stats.sansEcart}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedPeriodeId && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-700" />
          <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-amber-100/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {editingId ? <Pencil className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-amber-600" />}
                {editingId ? 'Modifier l\'enregistrement' : 'Nouvel enregistrement'}
              </CardTitle>
              {editingId && (
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Annuler
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Produit *</Label>
                  <SearchableSelect
                    options={produits.map((p) => ({ id: p.id, nom: `${p.nom} (${p.code_article})` }))}
                    value={form.id_produit}
                    onValueChange={(value) => { setForm((f) => ({ ...f, id_produit: value })); setFieldErrors((f) => ({ ...f, id_produit: '' })); }}
                    placeholder="Sélectionner un produit"
                    searchPlaceholder="Rechercher un produit..."
                    error={fieldErrors.id_produit}
                    disabled={!!editingId}
                  />
                  {fieldErrors.id_produit && <p className="text-red-500 text-xs mt-1">{fieldErrors.id_produit}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Magasin *
                  </Label>
                  <Select
                    value={form.id_magasin}
                    onValueChange={(value) => { setForm((f) => ({ ...f, id_magasin: value })); setFieldErrors((f) => ({ ...f, id_magasin: '' })); }}
                    disabled={!!editingId}
                  >
                    <SelectTrigger className={cn("mt-1.5 bg-white text-gray-900 border-gray-300 focus:border-royal-500 focus:ring-royal-500 h-11",
                      fieldErrors.id_magasin ? 'border-red-400' : '')}>
                      <SelectValue placeholder="Sélectionner un magasin" />
                    </SelectTrigger>
                    <SelectContent>
                      {magasins.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.id_magasin && <p className="text-red-500 text-xs mt-1">{fieldErrors.id_magasin}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Stock physique *</Label>
                  <Input
                    type="number" min="0"
                    value={form.stock_physique_compte}
                    onChange={(e) => { setForm((f) => ({ ...f, stock_physique_compte: e.target.value })); setFieldErrors((f) => ({ ...f, stock_physique_compte: '' })); }}
                    placeholder="Quantité comptée"
                    className={cn("mt-1.5 bg-white text-gray-900 border-gray-300 focus:border-royal-500 focus:ring-royal-500 h-11",
                      fieldErrors.stock_physique_compte ? 'border-red-400' : '')}
                  />
                  {fieldErrors.stock_physique_compte && <p className="text-red-500 text-xs mt-1">{fieldErrors.stock_physique_compte}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Commentaire</Label>
                  <Textarea
                    value={form.commentaire}
                    onChange={(e) => setForm((f) => ({ ...f, commentaire: e.target.value }))}
                    placeholder="Commentaire (optionnel)"
                    className="mt-1.5 bg-white text-gray-900 border-gray-300 focus:border-royal-500 focus:ring-royal-500"
                  />
                </div>
              </div>
              {fieldErrors.general && (
                <p className="text-red-500 text-xs">{fieldErrors.general}</p>
              )}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                {editingId && (
                  <Button
                    type="button" variant="outline"
                    onClick={resetForm}
                    className="border-gray-300 text-gray-700 h-11 px-6"
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  type="submit" disabled={saving}
                  className="bg-royal-700 hover:bg-royal-800 text-white h-11 px-6 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {saving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-royal-500 to-royal-700" />
        <CardHeader className="pb-3 bg-gradient-to-r from-royal-50 to-royal-100/30">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-royal-600" />
            Inventaires saisis
            {selectedPeriodeId && data.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">({total} résultat{total > 1 ? 's' : ''})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedPeriodeId ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-700">Sélectionnez une période</p>
              <p className="text-sm mt-1 max-w-md mx-auto">Choisissez une période d'inventaire en cours pour saisir ou consulter les inventaires</p>
            </div>
          ) : loading ? (
            <div className="p-6">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Code article</TableHead>
                      <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock physique</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Écart</TableHead>
                      <TableHead className="font-semibold text-gray-600">Commentaire</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600 w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                        <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                        <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                        <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                        <TableCell className="text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></TableCell>
                        <TableCell className="text-center"><div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" /></TableCell>
                        <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                        <TableCell className="text-center"><div className="h-8 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-700">Aucun inventaire</p>
              <p className="text-sm mt-1">Utilisez le formulaire ci-dessus pour saisir le premier inventaire</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Code article</TableHead>
                      <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock physique</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Écart</TableHead>
                      <TableHead className="font-semibold text-gray-600">Commentaire</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600 w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((inv, i) => (
                      <TableRow key={inv.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">{inv.produit?.nom || '-'}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">{inv.produit?.code_article || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{inv.magasin?.nom || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">{inv.stock_theorique}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{inv.stock_physique_compte}</TableCell>
                        <TableCell className="text-center">{getEcartDisplay(inv.ecart)}</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{inv.commentaire || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => openEdit(inv)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleDelete(inv.id)}
                              disabled={actionLoading === inv.id}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Supprimer"
                            >
                              {actionLoading === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination currentPage={currentPage} lastPage={lastPage} total={total} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}