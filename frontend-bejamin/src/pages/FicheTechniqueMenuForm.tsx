import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { ficheTechniqueMenuService } from '../services/fiche-technique-menu';
import { ficheTechniqueService } from '../services/fiche-technique';
import { produitService } from '../services/produit';
import { partenaireService } from '../services/partenaire';
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, UtensilsCrossed, Hash, CalendarDays,
  CalendarRange, Users, MapPin, Percent,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ItemRow {
  key: string;
  nomPartie: string;
  selection: string;
  pourcentage: string;
}

let rowKeyCounter = 0;
const newItem = (): ItemRow => ({
  key: `item_${++rowKeyCounter}`,
  nomPartie: '',
  selection: '',
  pourcentage: '100',
});

const PARTIES_SUGGESTEES = ['Entrée', 'Plat', 'Pain et beurre', 'Fromage', 'Dessert', 'Extra'];

interface RecetteOption { id: number; nom: string; code: string; cout_unitaire: number }
interface ProduitOption { id: number; nom: string; code_article: string }

export function FicheTechniqueMenuForm() {
  const { id, action } = useParams<{ id: string; action: string }>();
  const isEdit = action === 'modifier';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [recettes, setRecettes] = useState<RecetteOption[]>([]);
  const [produits, setProduits] = useState<ProduitOption[]>([]);
  const [magasins, setMagasins] = useState<{ id: number; nom: string }[]>([]);
  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);

  const [values, setValues] = useState({
    code: '', nom: '', description: '', cycle: '', periodicite: '', validite: '',
    id_partenaire: '', id_magasin: '', actif: true,
  });

  const [items, setItems] = useState<ItemRow[]>([newItem()]);

  useEffect(() => {
    ficheTechniqueService.list({ per_page: '500' }).then(r => {
      if (r.success) setRecettes(r.data.data.filter(f => f.actif !== false).map(f => ({ id: f.id, nom: f.nom, code: f.code, cout_unitaire: f.cout_unitaire })));
    }).catch(() => {});
    produitService.list({ per_page: '500' }).then(r => {
      if (r.success) setProduits(r.data.data.map(p => ({ id: p.id, nom: p.nom, code_article: p.code_article })));
    }).catch(() => {});
    (async () => {
      try {
        const [m, c] = await Promise.all([
          api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/magasins'),
          partenaireService.getClients({ per_page: '500' }),
        ]);
        if (m.success) setMagasins(m.data.data);
        if (c.success) setClients(c.data.data);
      } catch { /* */ }
    })();
  }, []);

  useEffect(() => {
    if (id && isEdit) {
      setLoading(true);
      ficheTechniqueMenuService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const f = res.data;
            setValues({
              code: f.code, nom: f.nom, description: f.description || '',
              cycle: f.cycle || '', periodicite: f.periodicite || '', validite: f.validite || '',
              id_partenaire: f.id_partenaire ? String(f.id_partenaire) : '',
              id_magasin: String(f.id_magasin), actif: Boolean(f.actif),
            });
            if (f.parties && f.parties.length > 0) {
              const flat: ItemRow[] = [];
              f.parties.forEach((p) => {
                (p.items || []).forEach((i) => {
                  flat.push({
                    key: `item_${++rowKeyCounter}`,
                    nomPartie: p.nom,
                    selection: i.id_fiche_technique ? `recette:${i.id_fiche_technique}` : (i.id_produit ? `produit:${i.id_produit}` : ''),
                    pourcentage: String(i.pourcentage),
                  });
                });
              });
              setItems(flat);
            }
          }
        })
        .catch(() => toast('Erreur de chargement', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (field: string, value: string | boolean) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const updateItem = (itemKey: string, field: string, value: string) => {
    setItems(prev => prev.map(i => i.key === itemKey ? { ...i, [field]: value } : i));
  };

  const removeItem = (itemKey: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(i => i.key !== itemKey));
  };
  const addItem = () => setItems(prev => [...prev, newItem()]);

  const sommeTotale = items.reduce((s, i) => s + (Number(i.pourcentage) || 0), 0);

  const itemOptions = [
    ...recettes.map(r => ({ id: r.id, nom: `${r.nom} [${r.code}]`, value: `recette:${r.id}`, sousTitre: `Recette · Coût unit. ${r.cout_unitaire}` })),
    ...produits.map(p => ({ id: p.id + 100000, nom: `${p.nom} [${p.code_article}]`, value: `produit:${p.id}`, sousTitre: 'Produit' })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFieldErrors({});

    if (!values.id_magasin) {
      setFieldErrors({ id_magasin: 'Le magasin est requis.' });
      setSaving(false);
      return;
    }
    if (!values.id_partenaire) {
      setFieldErrors({ id_partenaire: 'Le client est requis.' });
      setSaving(false);
      return;
    }
    const itemsIncomplets = items.some(i => !i.nomPartie.trim() || !i.selection);
    if (itemsIncomplets) {
      setFieldErrors({ items: 'Chaque ligne doit avoir un nom de partie et une fiche recette ou un produit.' });
      setSaving(false);
      return;
    }

    const payload = {
      ...values,
      id_partenaire: values.id_partenaire ? Number(values.id_partenaire) : null,
      id_magasin: Number(values.id_magasin),
      items: items.map(i => {
        const [type, itemId] = i.selection.split(':');
        return {
          nom_partie: i.nomPartie.trim(),
          id_fiche_technique: type === 'recette' ? Number(itemId) : null,
          id_produit: type === 'produit' ? Number(itemId) : null,
          pourcentage: Number(i.pourcentage) || 0,
        };
      }),
    };

    try {
      if (isEdit && id) {
        await ficheTechniqueMenuService.update(Number(id), payload);
        toast('Fiche technique modifiée', 'success');
        navigate(`/recettes/fiche-technique/${id}`);
      } else {
        const res = await ficheTechniqueMenuService.create(payload);
        toast('Fiche technique créée', 'success');
        navigate(`/recettes/fiche-technique/${res.data.id}`);
      }
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]>; message?: string };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(error.errors)) flat[k] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        setFieldErrors(flat);
      }
      toast(error.message || 'Erreur', 'error');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/recettes/fiche-technique')} className="flex items-center gap-2 text-gray-600 hover:text-royal-700 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour aux fiches techniques
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Modifier la fiche technique' : 'Nouvelle fiche technique'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Informations générales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                  <Hash className="w-4 h-4 text-gray-400" /> Code
                </Label>
                <Input value={values.code} onChange={(e) => set('code', e.target.value)} placeholder="Auto" disabled />
              </div>
              <div className="lg:col-span-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                  <UtensilsCrossed className="w-4 h-4 text-gray-400" /> Nom *
                </Label>
                <Input value={values.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Ex : Menu DC200 FONDEG" className={cn(fieldErrors.nom && 'border-red-400')} />
                {fieldErrors.nom && <p className="text-xs text-red-500 mt-1">{fieldErrors.nom}</p>}
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                  <CalendarDays className="w-4 h-4 text-gray-400" /> Cycle
                </Label>
                <Input value={values.cycle} onChange={(e) => set('cycle', e.target.value)} placeholder="Ex : 1" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                  <CalendarRange className="w-4 h-4 text-gray-400" /> Périodicité
                </Label>
                <Input value={values.periodicite} onChange={(e) => set('periodicite', e.target.value)} placeholder="Ex : JAN-AVR-JUIL-OCT" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-700">Validité</Label>
                <Input value={values.validite} onChange={(e) => set('validite', e.target.value)} placeholder="Ex : 2025" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                  <Users className="w-4 h-4 text-gray-400" /> Client *
                </Label>
                <SearchableSelect
                  options={clients.map(p => ({ id: p.id, nom: p.nom }))}
                  value={values.id_partenaire}
                  onValueChange={(v) => set('id_partenaire', v)}
                  placeholder="Sélectionner un client (compagnie)"
                  searchPlaceholder="Rechercher un client..."
                />
                {fieldErrors.id_partenaire && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_partenaire}</p>}
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" /> Magasin *
                </Label>
                <SearchableSelect
                  options={magasins.map(m => ({ id: m.id, nom: m.nom }))}
                  value={values.id_magasin}
                  onValueChange={(v) => set('id_magasin', v)}
                  placeholder="Sélectionner un magasin"
                  searchPlaceholder="Rechercher un magasin..."
                />
                {fieldErrors.id_magasin && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_magasin}</p>}
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-sm font-semibold mb-1.5 block text-gray-700">Description</Label>
              <Textarea value={values.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Description du menu..." />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Checkbox checked={values.actif} onCheckedChange={(v) => set('actif', Boolean(v))} />
              <span className="text-sm text-gray-700">Fiche technique active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Items du menu</CardTitle>
            <p className="text-sm text-gray-500">Chaque ligne a son nom de partie (ex. DESSERT, PLAT). Sélectionnez une fiche recette ou un produit. Le pourcentage indique la part des passagers concernés (100 % = tous).</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {fieldErrors.items && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fieldErrors.items}</p>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left font-semibold text-gray-600 px-4 py-2 w-40">Nom de la partie *</th>
                    <th className="text-left font-semibold text-gray-600 px-4 py-2 w-1/2">Recette ou produit *</th>
                    <th className="text-left font-semibold text-gray-600 px-4 py-2 w-32">Pourcentage (%)</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key} className="border-t border-gray-100">
                      <td className="px-4 py-2">
                        <Input
                          value={item.nomPartie}
                          onChange={(e) => updateItem(item.key, 'nomPartie', e.target.value)}
                          placeholder="Ex : DESSERT"
                          list={`parties-suggestions`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <SearchableSelect
                          options={itemOptions}
                          value={item.selection}
                          onValueChange={(v) => updateItem(item.key, 'selection', v)}
                          placeholder="Choisir une fiche recette ou un produit"
                          searchPlaceholder="Rechercher une recette ou un produit..."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <Percent className="w-4 h-4 text-gray-400" />
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={item.pourcentage}
                            onChange={(e) => updateItem(item.key, 'pourcentage', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
                          disabled={items.length <= 1}
                          title="Retirer la ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <datalist id={`parties-suggestions`}>
                {PARTIES_SUGGESTEES.map(s => <option key={s} value={s} />)}
              </datalist>
              <Button type="button" variant="outline" onClick={addItem} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Plus className="w-4 h-4 mr-1.5" /> Ajouter une ligne
              </Button>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-gray-700">Total pourcentages</Label>
                <Badge variant={Math.round(sommeTotale) === 100 ? 'success' : 'warning'} className="text-sm">
                  {sommeTotale} %
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/recettes/fiche-technique')} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Annuler
          </Button>
          <Button type="submit" disabled={saving} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
