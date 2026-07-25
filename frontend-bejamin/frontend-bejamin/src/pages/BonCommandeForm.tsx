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
import { useToast } from '../hooks/useToast';
import { bonCommandeService } from '../services/bon-commande';
import { produitService } from '../services/produit';
import { ArrowLeft, Save, Loader2, Plus, Trash2, FileText, Building2, MapPin, CalendarDays, DollarSign, MessageSquare, Package, Hash, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

interface SelectOption { id: number; nom: string; code_article?: string; symbole?: string; code?: string }

interface LigneRow {
  key: string;
  id_produit: string;
  quantite_commandee: string;
  prix_unitaire_ht: string;
  id_devise: string;
}

let ligneKeyCounter = 0;
const newLigne = (): LigneRow => ({
  key: `ligne_${++ligneKeyCounter}`,
  id_produit: '',
  quantite_commandee: '1',
  prix_unitaire_ht: '',
  id_devise: '',
});

export function BonCommandeForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [fournisseurs, setFournisseurs] = useState<SelectOption[]>([]);
  const [villes, setVilles] = useState<SelectOption[]>([]);
  const [devises, setDevises] = useState<SelectOption[]>([]);
  const [produits, setProduits] = useState<SelectOption[]>([]);

  const [values, setValues] = useState({
    numero_commande: '', id_partenaire: '', id_ville_destination: '',
    date_commande: new Date().toISOString().slice(0, 10),
    date_livraison_prevue: '', id_devise: '', commentaire: '',
  });

  const [lignes, setLignes] = useState<LigneRow[]>([newLigne()]);

  useEffect(() => {
    bonCommandeService.getPartenaires({ type: 'fournisseur' }).then((res) => { if (res.success) setFournisseurs(res.data.data); });
    bonCommandeService.getVilles().then((res) => { if (res.success) setVilles(res.data.data); });
    bonCommandeService.getDevises().then((res) => { if (res.success) setDevises(res.data.data); });
    bonCommandeService.getProduits().then((res) => { if (res.success) setProduits(res.data.data); });
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      bonCommandeService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const b = res.data;
            setValues({
              numero_commande: b.numero_commande, id_partenaire: String(b.id_partenaire),
              id_ville_destination: String(b.id_ville_destination), date_commande: b.date_commande || '',
              date_livraison_prevue: b.date_livraison_prevue || '', id_devise: b.id_devise ? String(b.id_devise) : '',
              commentaire: b.commentaire || '',
            });
            if (b.lignes && b.lignes.length > 0) {
              setLignes(b.lignes.map((l) => ({
                key: `ligne_${++ligneKeyCounter}`, id_produit: String(l.id_produit),
                quantite_commandee: String(l.quantite_commandee), prix_unitaire_ht: String(l.prix_unitaire_ht),
                id_devise: String(l.id_devise),
              })));
            }
          }
        })
        .catch(() => toast('Erreur de chargement', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const updateLigne = (key: string, field: string, value: string) => {
    setLignes(prev => prev.map(l => l.key === key ? { ...l, [field]: value } : l));
  };

  const onProduitChange = (key: string, produitId: string) => {
    updateLigne(key, 'id_produit', produitId);
    if (!produitId) return;
    produitService.get(Number(produitId)).then((res) => {
      if (!res.success) return;
      const hp = res.data.historique_prix;
      if (hp && hp.length > 0) {
        const prixTries = [...hp].sort((a, b) => new Date(b.date_application).getTime() - new Date(a.date_application).getTime());
        const dernier = prixTries[0];
        updateLigne(key, 'prix_unitaire_ht', String(dernier.prix_achat_ht));
        if (dernier.id_devise) updateLigne(key, 'id_devise', String(dernier.id_devise));
      }
    }).catch(() => {});
  };

  const removeLigne = (key: string) => { if (lignes.length > 1) setLignes(prev => prev.filter(l => l.key !== key)); };
  const addLigne = () => setLignes(prev => [...prev, newLigne()]);
  const totalEstime = lignes.reduce((s, l) => s + (Number(l.quantite_commandee) || 0) * (Number(l.prix_unitaire_ht) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    const payload = { ...values, lignes: lignes.map(({ key, ...l }) => ({ ...l })) };
    try {
      if (isEdit && id) {
        await bonCommandeService.update(Number(id), payload);
        toast('Bon modifié avec succès', 'success');
      } else {
        await bonCommandeService.create(payload as never);
        toast('Bon créé avec succès', 'success');
      }
      navigate('/bon-commande');
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]>; message?: string };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(error.errors)) flat[k] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        setFieldErrors(flat);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
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
        <button onClick={() => navigate('/bon-commande')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier le bon de commande' : 'Nouveau bon de commande'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Modifier les informations du bon de commande' : 'Créer un nouveau bon de commande'}
          </p>
        </div>
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

                <div>
                  <LabelIcon icon={Hash} required error={fieldErrors.numero_commande}>Numéro de commande</LabelIcon>
                  <Input value={values.numero_commande} onChange={(e) => set('numero_commande', e.target.value)}
                    placeholder="Ex: BC-2026-001" className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.numero_commande))} />
                  {fieldErrors.numero_commande && <p className="text-xs text-red-500 mt-1">{fieldErrors.numero_commande}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Building2} required error={fieldErrors.id_partenaire}>Fournisseur</LabelIcon>
                    <SearchableSelect
                      options={fournisseurs.map(p => ({ id: p.id, nom: p.nom }))}
                      value={values.id_partenaire}
                      onValueChange={v => set('id_partenaire', v)}
                      placeholder="Sélectionner un fournisseur"
                      searchPlaceholder="Rechercher un fournisseur..."
                      error={fieldErrors.id_partenaire}
                    />
                  </div>
                  <div>
                    <LabelIcon icon={MapPin} required error={fieldErrors.id_ville_destination}>Destination</LabelIcon>
                    <SearchableSelect
                      options={villes.map(v => ({ id: v.id, nom: v.nom }))}
                      value={values.id_ville_destination}
                      onValueChange={v => set('id_ville_destination', v)}
                      placeholder="Sélectionner une ville"
                      searchPlaceholder="Rechercher une ville..."
                      error={fieldErrors.id_ville_destination}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={CalendarDays} required error={fieldErrors.date_commande}>Date commande</LabelIcon>
                    <Input type="date" value={values.date_commande} onChange={(e) => set('date_commande', e.target.value)}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.date_commande))} />
                    {fieldErrors.date_commande && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_commande}</p>}
                  </div>
                  <div>
                    <LabelIcon icon={CalendarDays} error={fieldErrors.date_livraison_prevue}>Date livraison prévue</LabelIcon>
                    <Input type="date" value={values.date_livraison_prevue} onChange={(e) => set('date_livraison_prevue', e.target.value)}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.date_livraison_prevue))} />
                    {fieldErrors.date_livraison_prevue && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_livraison_prevue}</p>}
                  </div>
                </div>

                <div>
                  <LabelIcon icon={DollarSign} error={fieldErrors.id_devise}>Devise</LabelIcon>
                  <SearchableSelect
                    options={devises.map(d => ({ id: d.id, nom: d.nom, sousTitre: d.symbole }))}
                    value={values.id_devise}
                    onValueChange={v => set('id_devise', v)}
                    placeholder="Sélectionner une devise"
                    searchPlaceholder="Rechercher..."
                    error={fieldErrors.id_devise}
                  />
                </div>

                <div>
                  <LabelIcon icon={MessageSquare}>Commentaire</LabelIcon>
                  <Textarea value={values.commentaire} onChange={(e) => set('commentaire', e.target.value)}
                    rows={2} className="border-gray-200 shadow-sm" placeholder="Optionnel" />
                </div>
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
                  <div className="text-sm text-gray-500">Total estimé HT</div>
                  <div className="text-2xl font-bold text-gray-900 font-mono">{formatCurrency(totalEstime)}</div>
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
                <h2 className="text-base font-bold text-gray-800">Lignes de commande</h2>
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
                    <TableHead className="font-semibold text-gray-600">Produit *</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté *</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Prix unit. HT *</TableHead>
                    <TableHead className="font-semibold text-gray-600">Devise *</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Total HT</TableHead>
                    {!isEdit && <TableHead className="text-center w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l, i) => (
                    <TableRow key={l.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <TableCell className="min-w-[200px]">
                        <SearchableSelect
                          options={produits.map(p => ({ id: p.id, nom: p.nom, sousTitre: p.code_article }))}
                          value={l.id_produit}
                          onValueChange={(v) => onProduitChange(l.key, v)}
                          placeholder="Produit"
                          searchPlaceholder="Rechercher un produit..."
                          error={fieldErrors[`lignes.${i}.id_produit`]}
                        />
                      </TableCell>
                      <TableCell className="w-24">
                        <Input type="number" min="1" value={l.quantite_commandee}
                          onChange={(e) => updateLigne(l.key, 'quantite_commandee', e.target.value)}
                          className={cn('text-right h-10 border-gray-200 shadow-sm', fieldErrors[`lignes.${i}.quantite_commandee`] && 'border-red-400')} />
                      </TableCell>
                      <TableCell className="w-28">
                        <Input type="number" step="0.01" min="0" value={l.prix_unitaire_ht}
                          onChange={(e) => updateLigne(l.key, 'prix_unitaire_ht', e.target.value)}
                          className={cn('text-right h-10 border-gray-200 shadow-sm', fieldErrors[`lignes.${i}.prix_unitaire_ht`] && 'border-red-400')} />
                      </TableCell>
                      <TableCell className="w-36">
                        <SearchableSelect
                          options={devises.map(d => ({ id: d.id, nom: d.nom, sousTitre: d.code }))}
                          value={l.id_devise}
                          onValueChange={(v) => updateLigne(l.key, 'id_devise', v)}
                          placeholder="Devise"
                          searchPlaceholder="Rechercher..."
                          error={fieldErrors[`lignes.${i}.id_devise`]}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                        {formatCurrency((Number(l.quantite_commandee) || 0) * (Number(l.prix_unitaire_ht) || 0))}
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
                  ))}
                </TableBody>
              </Table>
            </div>

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

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/bon-commande')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {isEdit ? 'Enregistrer les modifications' : 'Créer le bon de commande'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
