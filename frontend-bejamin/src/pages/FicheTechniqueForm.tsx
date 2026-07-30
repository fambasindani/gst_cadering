import { useEffect, useState } from 'react';
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
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FicheTechniquePDF } from '../components/pdf/FicheTechniquePDF';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { ficheTechniqueService } from '../services/fiche-technique';
import { produitService } from '../services/produit';
import { ArrowLeft, Save, Loader2, Plus, Trash2, FileText, MapPin, Hash, DollarSign, Package, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface IngredientRow {
  key: string;
  id_produit_ingredient: string;
  quantite_ingredient: string;
  id_unite: string;
  commentaire: string;
}

let rowKeyCounter = 0;
const newRow = (): IngredientRow => ({
  key: `ing_${++rowKeyCounter}`,
  id_produit_ingredient: '',
  quantite_ingredient: '',
  id_unite: '',
  commentaire: '',
});

export function FicheTechniqueForm() {
  const { id, action } = useParams<{ id: string; action: string }>();
  const isEdit = action === 'modifier';
  const isView = action !== 'modifier' && Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit || isView);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [produits, setProduits] = useState<{ id: number; nom: string; code_article: string }[]>([]);
  const [villes, setVilles] = useState<{ id: number; nom: string }[]>([]);
  const [unites, setUnites] = useState<{ id: number; nom: string; symbole: string }[]>([]);

  const [values, setValues] = useState({
    code: '', nom: '', description: '', id_produit_fini: '', rendement: '1', id_ville: '',
  });

  const [ingredients, setIngredients] = useState<IngredientRow[]>([newRow()]);
  const [ficheData, setFicheData] = useState<import('../types/fiche-technique').FicheTechnique | null>(null);

  useEffect(() => {
    produitService.list().then(r => { if (r.success) setProduits(r.data.data.filter(p => p.actif !== false).map(p => ({ id: p.id, nom: p.nom, code_article: p.code_article }))); }).catch(() => {});
    (async () => {
      try {
        const [v, u] = await Promise.all([
          api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/villes'),
          api.get<{ success: boolean; data: { data: { id: number; nom: string; symbole: string }[] } }>('/config/unites'),
        ]);
        if (v.success) setVilles(v.data.data);
        if (u.success) setUnites(u.data.data);
      } catch { /* */ }
    })();
  }, []);

  useEffect(() => {
    if (id && (isEdit || isView)) {
      setLoading(true);
      ficheTechniqueService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const f = res.data;
            setFicheData(f);
            setValues({
              code: f.code, nom: f.nom, description: f.description || '',
              id_produit_fini: String(f.id_produit_fini), rendement: String(f.rendement),
              id_ville: String(f.id_ville),
            });
            if (f.lignes && f.lignes.length > 0) {
              setIngredients(f.lignes.map((l) => ({
                key: `ing_${++rowKeyCounter}`, id_produit_ingredient: String(l.id_produit_ingredient),
                quantite_ingredient: String(l.quantite_ingredient), id_unite: String(l.id_unite),
                commentaire: l.commentaire || '',
              })));
            }
          }
        })
        .catch(() => toast('Erreur de chargement', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, isView]);

  const set = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const updateIngredient = (key: string, field: string, value: string) => {
    setIngredients(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));
  };

  const removeIngredient = (key: string) => { if (ingredients.length > 1) setIngredients(prev => prev.filter(r => r.key !== key)); };
  const addIngredient = () => setIngredients(prev => [...prev, newRow()]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFieldErrors({});
    const payload = {
      ...values, rendement: Number(values.rendement),
      lignes: ingredients.map(({ key, ...r }) => ({ ...r, quantite_ingredient: Number(r.quantite_ingredient) })),
    };
    try {
      if (isEdit && id) {
        await ficheTechniqueService.update(Number(id), payload);
        toast('Fiche technique modifiée', 'success');
        navigate(`/recettes/creation/${id}`);
      } else {
        await ficheTechniqueService.create(payload as never);
        toast('Fiche technique créée', 'success');
      }
      navigate('/recettes/creation');
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
        <button onClick={() => navigate('/recettes/creation')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-400 text-gray-500 hover:text-gray-100 hover:border-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {isView ? 'Détails fiche technique' : isEdit ? 'Modifier la fiche technique' : 'Nouvelle fiche technique'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isView ? 'Consultation de la fiche technique' : isEdit ? 'Modifier les informations' : 'Créer une nouvelle recette'}
          </p>
        </div>
        {isView && ficheData && (
          <PDFDownloadLink document={<FicheTechniquePDF fiche={ficheData} />} fileName={`FT-${ficheData.code}.pdf`}>
            {({ loading: pdfLoading }) => (
              <Button type="button" variant="outline" disabled={pdfLoading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-1.5" />
                {pdfLoading ? 'Génération...' : 'PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-royal-700" />
                  <h2 className="text-base font-bold text-gray-800">Informations générales</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Hash} required error={fieldErrors.code}>Code</LabelIcon>
                    <Input value={values.code} onChange={(e) => set('code', e.target.value)}
                      placeholder="Auto-généré si vide" readOnly={isView}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.code))} />
                    {fieldErrors.code && <p className="text-xs text-red-500 mt-1">{fieldErrors.code}</p>}
                  </div>
                  <div>
                    <LabelIcon icon={FileText} required error={fieldErrors.nom}>Nom</LabelIcon>
                    <Input value={values.nom} onChange={(e) => set('nom', e.target.value)}
                      placeholder="Nom de la recette" readOnly={isView}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.nom))} />
                    {fieldErrors.nom && <p className="text-xs text-red-500 mt-1">{fieldErrors.nom}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Package} required error={fieldErrors.id_produit_fini}>Produit fini</LabelIcon>
                    <SearchableSelect
                      options={produits.map(p => ({ id: p.id, nom: p.nom, sousTitre: p.code_article ? `[${p.code_article}]` : undefined }))}
                      value={values.id_produit_fini}
                      onValueChange={(v) => set('id_produit_fini', v)}
                      placeholder="Sélectionner"
                      searchPlaceholder="Rechercher un produit..."
                      error={fieldErrors.id_produit_fini}
                      disabled={isView}
                      className={cn('w-full', errorClass(fieldErrors.id_produit_fini))}
                    />
                  </div>
                  <div>
                    <LabelIcon icon={MapPin} required error={fieldErrors.id_ville}>Ville</LabelIcon>
                    <SearchableSelect
                      options={villes.map(v => ({ id: v.id, nom: v.nom }))}
                      value={values.id_ville}
                      onValueChange={(v) => set('id_ville', v)}
                      placeholder="Sélectionner"
                      searchPlaceholder="Rechercher une ville..."
                      error={fieldErrors.id_ville}
                      disabled={isView}
                      className={cn('w-full', errorClass(fieldErrors.id_ville))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon required error={fieldErrors.rendement}>Rendement (nombre de portions)</LabelIcon>
                    <Input type="number" min="1" value={values.rendement} onChange={(e) => set('rendement', e.target.value)}
                      readOnly={isView} className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.rendement))} />
                    {fieldErrors.rendement && <p className="text-xs text-red-500 mt-1">{fieldErrors.rendement}</p>}
                  </div>
                </div>

                <div>
                  <LabelIcon>Description</LabelIcon>
                  <Textarea value={values.description} onChange={(e) => set('description', e.target.value)}
                    rows={2} className="border-gray-200 shadow-sm" placeholder="Optionnelle" readOnly={isView} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <DollarSign className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Coûts</h2>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ingrédients</div>
                  <div className="text-xl font-semibold text-gray-900">{ingredients.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Rendement</div>
                  <div className="text-xl font-semibold text-gray-900">{values.rendement || 0} portion(s)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-0 shadow-sm mt-6">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-gray-800">Ingrédients</h2>
              </div>
              {!isView && (
                <Button type="button" size="sm" onClick={addIngredient}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs rounded-lg">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
                </Button>
              )}
            </div>

            <div className="rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Ingrédient *</TableHead>
                    <TableHead className="font-semibold text-gray-600">Unité *</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Quantité *</TableHead>
                    <TableHead className="font-semibold text-gray-600">Commentaire</TableHead>
                    {!isView && <TableHead className="text-center w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((r, i) => (
                    <TableRow key={r.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <TableCell className="min-w-[200px]">
                        <SearchableSelect
                          options={produits.map(p => ({ id: p.id, nom: p.nom, sousTitre: p.code_article ? `[${p.code_article}]` : undefined }))}
                          value={r.id_produit_ingredient}
                          onValueChange={(v) => updateIngredient(r.key, 'id_produit_ingredient', v)}
                          placeholder="Ingrédient"
                          searchPlaceholder="Rechercher un ingrédient..."
                          disabled={isView}
                        />
                      </TableCell>
                      <TableCell className="w-28">
                        <SearchableSelect
                          options={unites.map(u => ({ id: u.id, nom: u.symbole || u.nom }))}
                          value={r.id_unite}
                          onValueChange={(v) => updateIngredient(r.key, 'id_unite', v)}
                          placeholder="Unité"
                          searchPlaceholder="Rechercher une unité..."
                          disabled={isView}
                        />
                      </TableCell>
                      <TableCell className="w-24">
                        <Input type="number" step="0.01" min="0" value={r.quantite_ingredient}
                          onChange={(e) => updateIngredient(r.key, 'quantite_ingredient', e.target.value)}
                          readOnly={isView} className="text-right h-10 border-gray-200 shadow-sm" />
                      </TableCell>
                      <TableCell>
                        <Input value={r.commentaire} onChange={(e) => updateIngredient(r.key, 'commentaire', e.target.value)}
                          readOnly={isView} className="h-10 border-gray-200 shadow-sm" placeholder="Optionnel" />
                      </TableCell>
                      {!isView && (
                        <TableCell className="text-center w-12">
                          <button type="button" onClick={() => removeIngredient(r.key)} disabled={ingredients.length <= 1}
                            className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {!isView && (
              <div className="mt-4">
                <Button type="button" size="sm" onClick={addIngredient}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs rounded-lg">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un ingrédient
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!isView && (
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => navigate('/recettes/creation')}
              className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={saving}
              className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> {isEdit ? 'Enregistrer' : 'Créer la fiche'}</>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
