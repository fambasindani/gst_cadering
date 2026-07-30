import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent } from '../components/ui/card';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { useToast } from '../hooks/useToast';
import { produitService } from '../services/produit';
import { BarcodeScanner } from '../components/ui/barcode-scanner';
import {
  ArrowLeft, Save, Loader2, Scan, X, Package, Tag, Building2, Ruler, AlertTriangle, DollarSign, CalendarDays, MessageSquare, FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SelectOption { id: number; nom: string; symbole?: string }

export function ProduitForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [scannerOpen, setScannerOpen] = useState(false);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [unites, setUnites] = useState<SelectOption[]>([]);
  const [devises, setDevises] = useState<SelectOption[]>([]);
  const [fournisseurs, setFournisseurs] = useState<SelectOption[]>([]);

  useEffect(() => {
    produitService.getCategories({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setCategories(res.data.data); });
    produitService.getUnites({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setUnites(res.data.data); });
    produitService.getDevises({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setDevises(res.data.data); });
    produitService.getFournisseurs({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setFournisseurs(res.data.data); });
  }, []);

  const formFields = isEdit
    ? (['code_article', 'code_barre', 'nom', 'description', 'id_categorie', 'id_partenaire_principal', 'id_unite', 'seuil_alerte'] as const)
    : (['code_article', 'code_barre', 'nom', 'description', 'id_categorie', 'id_partenaire_principal', 'id_unite', 'seuil_alerte', 'prix_achat_ht', 'prix_vente_ht', 'id_devise', 'date_application', 'commentaire_prix'] as const);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of formFields) init[f] = '';
    init.actif = '1';
    init.seuil_alerte = '0';
    init.date_application = new Date().toISOString().slice(0, 10);
    return init;
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      produitService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const p = res.data;
            setValues({
              code_article: p.code_article || '',
              code_barre: p.code_barre || '',
              nom: p.nom || '',
              description: p.description || '',
              id_categorie: p.id_categorie ? String(p.id_categorie) : '',
              id_partenaire_principal: p.id_partenaire_principal ? String(p.id_partenaire_principal) : '',
              id_unite: p.id_unite ? String(p.id_unite) : '',
              seuil_alerte: String(p.seuil_alerte ?? 0),
              actif: p.actif ? '1' : '0',
            });
          }
        })
        .catch(() => { toast('Erreur lors du chargement du produit', 'error'); })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (isEdit && id) {
        await produitService.update(Number(id), values);
        toast('Produit modifié avec succès', 'success');
      } else {
        await produitService.create(values as never);
        toast('Produit créé avec succès', 'success');
      }
      navigate('/produits');
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]>; message?: string };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(error.errors)) flat[k] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        setFieldErrors(flat);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/produits')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-400 text-gray-500 hover:text-gray-100 hover:border-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Modifier les informations du produit' : 'Créer un nouveau produit dans le catalogue'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Package className="w-5 h-5 text-royal-700" />
                  <h2 className="text-base font-bold text-gray-800">Identification</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Tag} error={fieldErrors.code_article}>Code article</LabelIcon>
                    <Input value={values.code_article} onChange={(e) => set('code_article', e.target.value)}
                      placeholder="Auto-généré si vide" className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.code_article))} />
                    {fieldErrors.code_article && <p className="text-xs text-red-500 mt-1">{fieldErrors.code_article}</p>}
                  </div>
                  <div>
                    <LabelIcon icon={Tag} error={fieldErrors.code_barre}>Code barre / QR</LabelIcon>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input value={values.code_barre} onChange={(e) => set('code_barre', e.target.value)}
                          placeholder="Scanner ou saisir" className={cn('h-11 border-gray-200 shadow-sm pr-10', errorClass(fieldErrors.code_barre))} />
                        {values.code_barre && (
                          <button type="button" onClick={() => set('code_barre', '')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button type="button" onClick={() => setScannerOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-royal-700 bg-royal-50 hover:bg-royal-100 rounded-lg border border-royal-200 shrink-0">
                        <Scan className="w-4 h-4" />
                        <span className="hidden sm:inline">Scanner</span>
                      </button>
                    </div>
                    {fieldErrors.code_barre && <p className="text-xs text-red-500 mt-1">{fieldErrors.code_barre}</p>}
                  </div>
                </div>

                <div>
                  <LabelIcon icon={FileText} required error={fieldErrors.nom}>Nom</LabelIcon>
                  <Input value={values.nom} onChange={(e) => set('nom', e.target.value)}
                    placeholder="Nom du produit" className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.nom))} />
                  {fieldErrors.nom && <p className="text-xs text-red-500 mt-1">{fieldErrors.nom}</p>}
                </div>

                <div>
                  <LabelIcon icon={FileText} error={fieldErrors.description}>Description</LabelIcon>
                  <Textarea value={values.description} onChange={(e) => set('description', e.target.value)}
                    placeholder="Description du produit..." rows={3} className={cn('border-gray-200 shadow-sm', errorClass(fieldErrors.description))} />
                  {fieldErrors.description && <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Tag} error={fieldErrors.id_categorie}>Catégorie</LabelIcon>
                    <SearchableSelect
                      options={categories.map(c => ({ id: c.id, nom: c.nom }))}
                      value={values.id_categorie}
                      onValueChange={(v) => set('id_categorie', v)}
                      placeholder="Sélectionner une catégorie"
                      searchPlaceholder="Rechercher une catégorie..."
                      error={fieldErrors.id_categorie}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <LabelIcon icon={Ruler} required error={fieldErrors.id_unite}>Unité</LabelIcon>
                    <SearchableSelect
                      options={unites.map(u => ({ id: u.id, nom: u.nom, sousTitre: u.symbole }))}
                      value={values.id_unite}
                      onValueChange={(v) => set('id_unite', v)}
                      placeholder="Sélectionner une unité"
                      searchPlaceholder="Rechercher une unité..."
                      error={fieldErrors.id_unite}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Building2 className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Fournisseur & Alerte</h2>
                </div>

                <div>
                  <LabelIcon icon={Building2} error={fieldErrors.id_partenaire_principal}>Fournisseur principal</LabelIcon>
                  <SearchableSelect
                    options={fournisseurs.map(f => ({ id: f.id, nom: f.nom }))}
                    value={values.id_partenaire_principal}
                    onValueChange={(v) => set('id_partenaire_principal', v)}
                    placeholder="Sélectionner"
                    searchPlaceholder="Rechercher un fournisseur..."
                    error={fieldErrors.id_partenaire_principal}
                    className="w-full"
                  />
                </div>

                <div>
                  <LabelIcon icon={AlertTriangle} error={fieldErrors.seuil_alerte}>Seuil d'alerte</LabelIcon>
                  <Input type="number" min="0" value={values.seuil_alerte} onChange={(e) => set('seuil_alerte', e.target.value)}
                    className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.seuil_alerte))} />
                  {fieldErrors.seuil_alerte && <p className="text-xs text-red-500 mt-1">{fieldErrors.seuil_alerte}</p>}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Checkbox id="actif" checked={values.actif === '1'} onCheckedChange={(v) => set('actif', v ? '1' : '0')} />
                  <Label htmlFor="actif" className="text-sm font-medium text-gray-700">Produit actif</Label>
                </div>
              </CardContent>
            </Card>

            {!isEdit && (
              <Card className="border-0 shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <DollarSign className="w-5 h-5 text-emerald-700" />
                    <h2 className="text-base font-bold text-gray-800">Prix initial</h2>
                  </div>

                  <div>
                    <LabelIcon icon={DollarSign} required error={fieldErrors.prix_achat_ht}>Prix d'achat HT</LabelIcon>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="number" step="0.01" min="0" value={values.prix_achat_ht}
                        onChange={(e) => set('prix_achat_ht', e.target.value)}
                        placeholder="0,00" className={cn('h-11 border-gray-200 shadow-sm pl-9', errorClass(fieldErrors.prix_achat_ht))} />
                    </div>
                    {fieldErrors.prix_achat_ht && <p className="text-xs text-red-500 mt-1">{fieldErrors.prix_achat_ht}</p>}
                  </div>

                  <div>
                    <LabelIcon icon={DollarSign} error={fieldErrors.prix_vente_ht}>Prix de vente HT</LabelIcon>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="number" step="0.01" min="0" value={values.prix_vente_ht}
                        onChange={(e) => set('prix_vente_ht', e.target.value)}
                        placeholder="0,00" className={cn('h-11 border-gray-200 shadow-sm pl-9', errorClass(fieldErrors.prix_vente_ht))} />
                    </div>
                    {fieldErrors.prix_vente_ht && <p className="text-xs text-red-500 mt-1">{fieldErrors.prix_vente_ht}</p>}
                  </div>

                  <div>
                    <LabelIcon icon={DollarSign} required error={fieldErrors.id_devise}>Devise</LabelIcon>
                    <SearchableSelect
                      options={devises.map(d => ({ id: d.id, nom: d.nom, sousTitre: d.symbole }))}
                      value={values.id_devise}
                      onValueChange={(v) => set('id_devise', v)}
                      placeholder="Sélectionner"
                      searchPlaceholder="Rechercher une devise..."
                      error={fieldErrors.id_devise}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <LabelIcon icon={CalendarDays} required error={fieldErrors.date_application}>Date d'application</LabelIcon>
                    <Input type="date" value={values.date_application}
                      onChange={(e) => set('date_application', e.target.value)}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.date_application))} />
                    {fieldErrors.date_application && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_application}</p>}
                  </div>

                  <div>
                    <LabelIcon icon={MessageSquare} error={fieldErrors.commentaire_prix}>Commentaire</LabelIcon>
                    <Input value={values.commentaire_prix} onChange={(e) => set('commentaire_prix', e.target.value)}
                      placeholder="Prix initial" className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.commentaire_prix))} />
                    {fieldErrors.commentaire_prix && <p className="text-xs text-red-500 mt-1">{fieldErrors.commentaire_prix}</p>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={() => navigate('/produits')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}</>
            )}
          </Button>
        </div>
      </form>

      <BarcodeScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)}
        onScan={(code) => { set('code_barre', code); setScannerOpen(false); }} />
    </div>
  );
}
