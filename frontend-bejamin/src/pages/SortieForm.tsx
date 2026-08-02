import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { useToast } from '../hooks/useToast';
import { mouvementStockService } from '../services/mouvement-stock';
import { typeMouvementService } from '../services/type-mouvement';
import { lotService } from '../services/lot';
import { magasinService } from '../services/magasin';
import { departementService } from '../services/departement';
import { partenaireService } from '../services/partenaire';
import type { Lot } from '../types/lot';
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, User, Building2, Boxes, CalendarDays,
  MessageSquare, Package, ArrowUp, ShoppingCart,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

interface SelectOption { id: number; nom: string }

interface LigneRow {
  key: string;
  id_lot: string;
  quantite: string;
}

let ligneKeyCounter = 0;
const newLigne = (): LigneRow => ({ key: `ligne_${++ligneKeyCounter}`, id_lot: '', quantite: '' });

export function SortieForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [clients, setClients] = useState<SelectOption[]>([]);
  const [magasins, setMagasins] = useState<SelectOption[]>([]);
  const [departements, setDepartements] = useState<SelectOption[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [typeSortieId, setTypeSortieId] = useState<number>(0);

  const [values, setValues] = useState({
    id_partenaire: '', id_magasin: '', id_departement: '',
    date_mouvement: new Date().toISOString().split('T')[0],
    commentaire: '',
  });

  const [lignes, setLignes] = useState<LigneRow[]>([newLigne()]);

  const chargerDepartements = useCallback((magasinId: string) => {
    if (!magasinId) {
      setDepartements([]);
      return;
    }
    departementService.getByMagasin(Number(magasinId))
      .then((res) => { if (res.success) setDepartements(res.data); })
      .catch(() => setDepartements([]));
  }, []);

  useEffect(() => {
    partenaireService.getClients().then((res) => { if (res.success) setClients(res.data.data); }).catch(() => {});
    magasinService.list({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setMagasins(res.data.data); })
      .catch(() => {});
    typeMouvementService.getSortie().then((res) => { if (res.success && res.data.length > 0) setTypeSortieId(res.data[0].id); }).catch(() => {});
  }, []);

  useEffect(() => {
    const params: Record<string, string> = { per_page: '500', statut: 'VALIDÉ', sort_by: 'numero_lot', sort_order: 'asc' };
    if (values.id_magasin) params.magasin_id = values.id_magasin;
    lotService.list(params).then((r) => { if (r.success) setLots(r.data.data); }).catch(() => {});
  }, [values.id_magasin]);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      mouvementStockService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const m = res.data;
            setValues({
              id_partenaire: m.id_partenaire ? String(m.id_partenaire) : '',
              id_magasin: m.id_magasin ? String(m.id_magasin) : '',
              id_departement: m.id_departement ? String(m.id_departement) : '',
              date_mouvement: m.date_mouvement ? m.date_mouvement.slice(0, 10) : '',
              commentaire: m.commentaire || '',
            });
            setLignes([{ key: newLigne().key, id_lot: String(m.id_lot), quantite: String(m.quantite) }]);
            if (m.id_type_mouvement) setTypeSortieId(m.id_type_mouvement);
            if (m.id_magasin) chargerDepartements(String(m.id_magasin));
          }
        })
        .catch(() => toast('Erreur lors du chargement de la sortie', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, chargerDepartements, toast]);

  const set = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleMagasinChange = (v: string) => {
    setValues(prev => ({ ...prev, id_magasin: v, id_departement: '' }));
    setFieldErrors(prev => { const n = { ...prev }; delete n.id_magasin; delete n.id_departement; return n; });
    chargerDepartements(v);
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

  const selectedLot = (id_lot: string) => lots.find(x => x.id === Number(id_lot));

  const totalQte = lignes.reduce((s, l) => s + (Number(l.quantite) || 0), 0);
  const totalPrix = lignes.reduce((s, l) => {
    const lot = selectedLot(l.id_lot);
    return s + (Number(l.quantite) || 0) * (lot?.prix_achat_ht_unitaire || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!values.id_partenaire) errors.id_partenaire = 'Le client est requis';
    if (!values.id_magasin) errors.id_magasin = 'Le magasin est requis';
    if (!values.id_departement) errors.id_departement = 'Le département est requis';
    if (!values.date_mouvement) errors.date_mouvement = 'La date est requise';

    const lignesValides: LigneRow[] = [];
    lignes.forEach((l, i) => {
      if (!l.id_lot && !l.quantite) return;
      if (!l.id_lot) {
        errors[`lignes.${i}.id_lot`] = 'Sélectionnez un lot';
        return;
      }
      if (Number(l.quantite) <= 0) {
        errors[`lignes.${i}.quantite`] = 'Quantité invalide';
        return;
      }
      const lot = selectedLot(l.id_lot);
      if (lot && Number(l.quantite) > lot.quantite_disponible) {
        errors[`lignes.${i}.quantite`] = `Stock insuffisant (max ${lot.quantite_disponible})`;
        return;
      }
      lignesValides.push(l);
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast('Veuillez corriger les erreurs', 'error');
      return;
    }
    if (lignesValides.length === 0) {
      setFieldErrors({ ligne: 'Ajoutez au moins une ligne' });
      toast('Ajoutez au moins une ligne avec un lot et une quantité', 'error');
      return;
    }
    if (!typeSortieId) {
      toast('Type de sortie introuvable', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        const l = lignesValides[0];
        const payload: Record<string, string | number> = {
          id_partenaire: values.id_partenaire,
          id_magasin: values.id_magasin,
          id_departement: values.id_departement,
          id_type_mouvement: typeSortieId,
          id_lot: Number(l.id_lot),
          quantite: Number(l.quantite),
        };
        if (values.date_mouvement) payload.date_mouvement = values.date_mouvement;
        if (values.commentaire) payload.commentaire = values.commentaire;
        await mouvementStockService.update(Number(id), payload);
        toast('Sortie modifiée avec succès', 'success');
      } else {
        for (const l of lignesValides) {
          const payload: Record<string, string | number> = {
            id_partenaire: values.id_partenaire,
            id_magasin: values.id_magasin,
            id_departement: values.id_departement,
            id_type_mouvement: typeSortieId,
            id_lot: Number(l.id_lot),
            quantite: Number(l.quantite),
          };
          if (values.date_mouvement) payload.date_mouvement = values.date_mouvement;
          if (values.commentaire) payload.commentaire = values.commentaire;
          await mouvementStockService.create(payload);
        }
        toast('Sortie stock créée avec succès', 'success');
      }
      navigate('/stock/sortie');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
      </div>
    );
  }

  const LabelIcon = ({ icon: Icon, children, required, error }: { icon?: React.ElementType; children: React.ReactNode; required?: boolean; error?: string }) => (
    <Label className={cn('flex items-center gap-1.5 text-sm font-semibold mb-1.5', error ? 'text-red-500' : 'text-gray-700')}>
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );

  const errorClass = (error?: string) => cn(error && 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/stock/sortie')}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-400 text-gray-500 hover:text-gray-100 hover:border-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier la sortie stock' : 'Nouvelle sortie stock'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Modifier les informations de la sortie' : 'Enregistrer une sortie de stock'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <ArrowUp className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Informations de la sortie</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={User} required error={fieldErrors.id_partenaire}>Client</LabelIcon>
                    <SearchableSelect
                      options={clients.map(c => ({ id: c.id, nom: c.nom }))}
                      value={values.id_partenaire}
                      onValueChange={(v) => set('id_partenaire', v)}
                      placeholder="Sélectionner un client"
                      searchPlaceholder="Rechercher un client..."
                      error={fieldErrors.id_partenaire}
                    />
                  </div>
                  <div>
                    <LabelIcon icon={Building2} required error={fieldErrors.id_magasin}>Magasin</LabelIcon>
                    <SearchableSelect
                      options={magasins.map(m => ({ id: m.id, nom: m.nom }))}
                      value={values.id_magasin}
                      onValueChange={handleMagasinChange}
                      placeholder="Sélectionner un magasin"
                      searchPlaceholder="Rechercher un magasin..."
                      error={fieldErrors.id_magasin}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Boxes} required error={fieldErrors.id_departement}>Département</LabelIcon>
                    <SearchableSelect
                      options={departements.map(d => ({ id: d.id, nom: d.nom }))}
                      value={values.id_departement}
                      onValueChange={(v) => set('id_departement', v)}
                      placeholder={values.id_magasin ? 'Sélectionner un département' : 'Choisissez d\'abord un magasin'}
                      searchPlaceholder="Rechercher un département..."
                      disabled={!values.id_magasin}
                      error={fieldErrors.id_departement}
                    />
                  </div>
                  <div>
                    <LabelIcon icon={CalendarDays} required error={fieldErrors.date_mouvement}>Date</LabelIcon>
                    <Input type="date" value={values.date_mouvement} onChange={(e) => set('date_mouvement', e.target.value)}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.date_mouvement))} />
                    {fieldErrors.date_mouvement && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_mouvement}</p>}
                  </div>
                </div>

                <div>
                  <LabelIcon icon={MessageSquare}>Commentaire</LabelIcon>
                  <Textarea value={values.commentaire} onChange={(e) => set('commentaire', e.target.value)}
                    rows={2} className="border-gray-200 shadow-sm" placeholder="Optionnel" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-700" />
                    <h2 className="text-base font-bold text-gray-800">Produits à sortir</h2>
                  </div>
                  {!isEdit && (
                    <Button type="button" size="sm" onClick={addLigne}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs rounded-lg">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une ligne
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Lot *</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Quantité *</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Prix unit.</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                        {!isEdit && <TableHead className="text-center w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lignes.map((l, i) => {
                        const lot = selectedLot(l.id_lot);
                        return (
                          <TableRow key={l.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <TableCell className="min-w-[260px]">
                              <SearchableSelect
                                options={lots.map(x => ({ id: x.id, nom: `${x.numero_lot} - ${x.produit?.nom || 'Produit'}`, sousTitre: `dispo: ${x.quantite_disponible}` }))}
                                value={l.id_lot}
                                onValueChange={(v) => updateLigne(l.key, 'id_lot', v)}
                                placeholder="Sélectionner un lot"
                                searchPlaceholder="Rechercher un lot..."
                                error={fieldErrors[`lignes.${i}.id_lot`]}
                              />
                              {lot && (
                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                  <span>Dispo: <span className="font-medium text-gray-700">{lot.quantite_disponible}</span></span>
                                  <span>Péremption: <span className={cn('font-medium', lot.date_peremption && new Date(lot.date_peremption) < new Date() ? 'text-red-600' : 'text-gray-700')}>
                                    {lot.date_peremption ? new Date(lot.date_peremption).toLocaleDateString('fr-FR') : '-'}
                                  </span></span>
                                  <span>Prix unit.: <span className="font-medium text-gray-700">{lot.prix_achat_ht_unitaire != null ? formatCurrency(lot.prix_achat_ht_unitaire, '$') : '-'}</span></span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="w-36">
                              <Input type="number" min="1" value={l.quantite}
                                onChange={(e) => updateLigne(l.key, 'quantite', e.target.value)}
                                className={cn('text-right h-10 border-gray-200 shadow-sm', fieldErrors[`lignes.${i}.quantite`] && 'border-red-400')} />
                              {fieldErrors[`lignes.${i}.quantite`] && <p className="text-xs text-red-500 mt-1">{fieldErrors[`lignes.${i}.quantite`]}</p>}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-gray-600">
                              {lot && lot.prix_achat_ht_unitaire != null ? formatCurrency(lot.prix_achat_ht_unitaire, '$') : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                              {lot && lot.prix_achat_ht_unitaire != null ? formatCurrency((Number(l.quantite) || 0) * lot.prix_achat_ht_unitaire, '$') : '-'}
                            </TableCell>
                            {!isEdit && (
                              <TableCell className="text-center w-12">
                                <button type="button" onClick={() => removeLigne(l.key)} disabled={lignes.length <= 1}
                                  className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {fieldErrors.ligne && <p className="text-sm text-red-500 mt-2">{fieldErrors.ligne}</p>}

                {!isEdit && (
                  <div className="mt-4">
                    <Button type="button" size="sm" onClick={addLigne}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs rounded-lg">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une ligne
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <ShoppingCart className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Récapitulatif</h2>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Nombre de lignes</div>
                  <div className="text-xl font-semibold text-gray-900">{lignes.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Quantité totale</div>
                  <div className="text-2xl font-bold text-gray-900 font-mono">{totalQte}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total prix</div>
                  <div className="text-2xl font-bold text-amber-700 font-mono">{formatCurrency(totalPrix, '$')}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/stock/sortie')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="h-11 px-8 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-xl shadow-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {isEdit ? 'Enregistrer les modifications' : 'Créer la sortie'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
