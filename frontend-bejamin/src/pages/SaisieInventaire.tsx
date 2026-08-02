import { useEffect, useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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

interface SaisieLigne {
  key: string;
  id_produit: string;
  stock_physique_compte: string;
  commentaire: string;
}

let ligneKeyCounter = 0;
const newLigne = (): SaisieLigne => ({ key: `ligne_${++ligneKeyCounter}`, id_produit: '', stock_physique_compte: '', commentaire: '' });

export function SaisieInventaire() {
  const { toast } = useToast();

  const [periodes, setPeriodes] = useState<PeriodeInventaire[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState<PeriodeInventaire | null>(null);

  const [produits, setProduits] = useState<{ id: number; nom: string; code_article: string }[]>([]);
  const [magasins, setMagasins] = useState<{ id: number; nom: string }[]>([]);

  const [lignes, setLignes] = useState<SaisieLigne[]>([newLigne()]);
  const [idMagasin, setIdMagasin] = useState('');
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
    setLignes([newLigne()]);
    setIdMagasin(String(selectedPeriode?.id_magasin ?? ''));
    setFieldErrors({});
  };

  const handlePeriodeChange = (value: string) => {
    setSelectedPeriodeId(value);
    setCurrentPage(1);
    const periode = periodes.find((p) => String(p.id) === value);
    setSelectedPeriode(periode ?? null);
    resetForm();
    if (periode) {
      setIdMagasin(String(periode.id_magasin));
    }
  };

  const openEdit = (inv: Inventaire) => {
    setEditingId(inv.id);
    setIdMagasin(String(inv.id_magasin));
    setLignes([{ key: newLigne().key, id_produit: String(inv.id_produit), stock_physique_compte: String(inv.stock_physique_compte), commentaire: inv.commentaire || '' }]);
    setFieldErrors({});
  };

  const updateLigne = (key: string, field: string, value: string) => {
    setLignes(prev => prev.map(l => l.key === key ? { ...l, [field]: value } : l));
    setFieldErrors(prev => {
      const n = { ...prev };
      for (const k of Object.keys(n)) {
        if (k.startsWith('lignes.') && k.endsWith(`.${field}`)) delete n[k];
      }
      return n;
    });
  };

  const removeLigne = (key: string) => { if (lignes.length > 1) setLignes(prev => prev.filter(l => l.key !== key)); };
  const addLigne = () => setLignes(prev => [...prev, newLigne()]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!selectedPeriodeId) {
      errors.id_periode = 'Sélectionnez une période';
    }
    if (!idMagasin) {
      errors.id_magasin = 'Sélectionnez un magasin';
    }

    const lignesValides: SaisieLigne[] = [];
    const produitsVus = new Set<string>();
    lignes.forEach((l, i) => {
      if (!l.id_produit && !l.stock_physique_compte && !l.commentaire) return;
      if (!l.id_produit) {
        errors[`lignes.${i}.id_produit`] = 'Sélectionnez un produit';
        return;
      }
      if (produitsVus.has(l.id_produit)) {
        errors[`lignes.${i}.id_produit`] = 'Produit déjà ajouté';
        return;
      }
      if (!l.stock_physique_compte || parseInt(l.stock_physique_compte) < 0) {
        errors[`lignes.${i}.stock_physique_compte`] = 'Stock physique invalide';
        return;
      }
      produitsVus.add(l.id_produit);
      lignesValides.push(l);
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (lignesValides.length === 0) {
      setFieldErrors({ ligne: 'Ajoutez au moins un produit' });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const l = lignesValides[0];
        await inventaireService.update(editingId, {
          stock_physique_compte: parseInt(l.stock_physique_compte),
          commentaire: l.commentaire,
        });
        toast('Inventaire modifié avec succès', 'success');
      } else {
        const res = await inventaireService.createMultiple({
          id_periode_inventaire: Number(selectedPeriodeId),
          id_magasin: Number(idMagasin),
          lignes: lignesValides.map((l) => ({
            id_produit: Number(l.id_produit),
            stock_physique_compte: parseInt(l.stock_physique_compte),
            commentaire: l.commentaire || undefined,
          })),
        });
        if (res.success) {
          toast(res.message || 'Inventaires créés avec succès', 'success');
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
              <div className="max-w-sm">
                <Label className="text-sm font-medium text-gray-700">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Magasin *
                </Label>
                <Select
                  value={idMagasin}
                  onValueChange={(value) => { setIdMagasin(value); setFieldErrors((f) => ({ ...f, id_magasin: '' })); }}
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

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit *</TableHead>
                      <TableHead className="font-semibold text-gray-600 w-36">Stock physique *</TableHead>
                      <TableHead className="font-semibold text-gray-600 min-w-[200px]">Commentaire</TableHead>
                      {!editingId && <TableHead className="text-center w-12" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((l, i) => (
                      <TableRow key={l.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <TableCell className="min-w-[280px]">
                          <SearchableSelect
                            options={produits.map((p) => ({ id: p.id, nom: `${p.nom} (${p.code_article})` }))}
                            value={l.id_produit}
                            onValueChange={(value) => updateLigne(l.key, 'id_produit', value)}
                            placeholder="Sélectionner un produit"
                            searchPlaceholder="Rechercher un produit..."
                            error={fieldErrors[`lignes.${i}.id_produit`]}
                            disabled={!!editingId}
                          />
                          {fieldErrors[`lignes.${i}.id_produit`] && <p className="text-red-500 text-xs mt-1">{fieldErrors[`lignes.${i}.id_produit`]}</p>}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number" min="0"
                            value={l.stock_physique_compte}
                            onChange={(e) => updateLigne(l.key, 'stock_physique_compte', e.target.value)}
                            placeholder="Quantité comptée"
                            className={cn('text-right h-10 border-gray-200 shadow-sm', fieldErrors[`lignes.${i}.stock_physique_compte`] && 'border-red-400')}
                          />
                          {fieldErrors[`lignes.${i}.stock_physique_compte`] && <p className="text-red-500 text-xs mt-1">{fieldErrors[`lignes.${i}.stock_physique_compte`]}</p>}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={l.commentaire}
                            onChange={(e) => updateLigne(l.key, 'commentaire', e.target.value)}
                            placeholder="Optionnel"
                            className="h-10 border-gray-200 shadow-sm"
                          />
                        </TableCell>
                        {!editingId && (
                          <TableCell className="text-center w-12">
                            <button
                              type="button"
                              onClick={() => removeLigne(l.key)}
                              disabled={lignes.length <= 1}
                              className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Supprimer la ligne"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {fieldErrors.ligne && <p className="text-red-500 text-xs">{fieldErrors.ligne}</p>}
              {fieldErrors.general && (
                <p className="text-red-500 text-xs">{fieldErrors.general}</p>
              )}

              {!editingId && (
                <Button
                  type="button" size="sm"
                  onClick={addLigne}
                  className="bg-royal-100 text-royal-700 hover:bg-royal-200 border-0 shadow-sm text-xs rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un produit
                </Button>
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
                  {saving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Enregistrer tout'}
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