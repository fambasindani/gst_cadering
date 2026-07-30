import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { retourService } from '../services/retour';
import { bonCommandeService } from '../services/bon-commande';
import { partenaireService } from '../services/partenaire';
import { lotService } from '../services/lot';
import {
  ArrowLeft, Plus, Trash2, Loader2, Building2, Truck, MapPin, CalendarDays, Package, MessageSquare,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function RetourForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [retourType, setRetourType] = useState<'client' | 'fournisseur' | null>(null);
  const [villes, setVilles] = useState<{ id: number; nom: string }[]>([]);
  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);
  const [fournisseurs, setFournisseurs] = useState<{ id: number; nom: string }[]>([]);
  const [lots, setLots] = useState<{ id: number; numero_lot: string; quantite_disponible: number; produit?: { id: number; nom: string } | null }[]>([]);
  const [form, setForm] = useState({
    date_retour: '', id_partenaire_client: '',
    id_partenaire_dest: '', id_ville: '', commentaire: '',
    lignes: [{ id_lot: '', quantite_retournee: '', motif: '' }],
  });

  const errClass = (field: string) => fieldErrors[field] && 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30';

  useEffect(() => {
    bonCommandeService.getVilles().then(r => { if (r.success) setVilles(r.data.data); }).catch(() => {});
    partenaireService.getClients().then(r => { if (r.success) setClients(r.data.data); }).catch(() => {});
    partenaireService.getFournisseurs().then(r => { if (r.success) setFournisseurs(r.data.data); }).catch(() => {});
    lotService.list({ per_page: '500', statut: 'VALIDÉ' }).then(r => { if (r.success) setLots(r.data.data); }).catch(() => {});

    if (id) {
      retourService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const r = res.data;
            const type = r.id_partenaire_client ? 'client' : 'fournisseur';
            setRetourType(type);
            setForm({
              date_retour: r.date_retour.split('T')[0],
              id_partenaire_client: r.id_partenaire_client ? String(r.id_partenaire_client) : '',
              id_partenaire_dest: r.id_partenaire_dest ? String(r.id_partenaire_dest) : '',
              id_ville: String(r.id_ville),
              commentaire: r.commentaire || '',
              lignes: r.lignes?.map(l => ({
                id_lot: String(l.id_lot),
                quantite_retournee: String(l.quantite_retournee),
                motif: l.motif || '',
              })) || [{ id_lot: '', quantite_retournee: '', motif: '' }],
            });
          }
        })
        .catch(() => toast('Erreur lors du chargement', 'error'))
        .finally(() => setLoading(false));
    } else {
      const now = new Date().toISOString().split('T')[0];
      setForm(f => ({ ...f, date_retour: now }));
      setLoading(false);
    }
  }, [id]);

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const updateLigne = (idx: number, field: string, value: string) => {
    setFieldErrors(f => { const n = { ...f }; delete n[`lignes.${idx}.${field}`]; return n; });
    setForm(f => {
      const lignes = [...f.lignes];
      lignes[idx] = { ...lignes[idx], [field]: value };
      return { ...f, lignes };
    });
  };

  const addLigne = () => setForm(f => ({ ...f, lignes: [...f.lignes, { id_lot: '', quantite_retournee: '', motif: '' }] }));
  const removeLigne = (idx: number) => setForm(f => ({ ...f, lignes: f.lignes.filter((_, i) => i !== idx) }));

  const LabelIcon = ({ icon: Icon, children, required, error }: { icon?: React.ElementType; children: React.ReactNode; required?: boolean; error?: string }) => (
    <Label className={cn('flex items-center gap-1.5 text-sm font-semibold mb-1.5', error ? 'text-red-500' : 'text-gray-700')}>
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!form.date_retour) errors.date_retour = 'La date est requise';
    if (!form.id_ville) errors.id_ville = 'La ville est requise';
    if (!retourType) {
      errors.retourType = 'Sélectionnez le type de retour';
    } else if (retourType === 'client' && !form.id_partenaire_client) {
      errors.id_partenaire_client = 'Choisissez un client';
    } else if (retourType === 'fournisseur' && !form.id_partenaire_dest) {
      errors.id_partenaire_dest = 'Choisissez un fournisseur';
    }

    form.lignes.forEach((l, idx) => {
      if (!l.id_lot) errors[`lignes.${idx}.id_lot`] = 'Lot requis';
      if (!l.quantite_retournee || Number(l.quantite_retournee) < 1) errors[`lignes.${idx}.quantite_retournee`] = 'Qté invalide';
    });

    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        date_retour: form.date_retour,
        id_ville: Number(form.id_ville),
        lignes: form.lignes
          .filter(l => l.id_lot && l.quantite_retournee)
          .map(l => ({ id_lot: Number(l.id_lot), quantite_retournee: Number(l.quantite_retournee), motif: l.motif || undefined })),
      };
      if (retourType === 'client' && form.id_partenaire_client) payload.id_partenaire_client = Number(form.id_partenaire_client);
      if (retourType === 'fournisseur' && form.id_partenaire_dest) payload.id_partenaire_dest = Number(form.id_partenaire_dest);
      if (form.commentaire) payload.commentaire = form.commentaire;

      if (isEdit) {
        await retourService.update(Number(id), payload);
        toast('Retour modifié avec succès', 'success');
      } else {
        await retourService.create(payload);
        toast('Retour créé avec succès', 'success');
      }
      navigate('/stock/retour');
    } catch (err: unknown) {
      const error = err as { message?: string; error?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(error.errors)) flat[k] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        setFieldErrors(flat);
      }
      toast(error.error || error.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/stock/retour')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-400 text-gray-500 hover:text-gray-100 hover:border-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier le retour' : 'Nouveau retour'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? 'Modifier le retour' : 'Créer un retour client ou fournisseur'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <Package className="w-5 h-5 text-royal-600" />
                  <h2 className="text-base font-semibold text-gray-900">Informations générales</h2>
                </div>

                <div className="space-y-1.5">
                  <LabelIcon icon={CalendarDays} required error={fieldErrors.date_retour}>Date</LabelIcon>
                  <Input type="date" value={form.date_retour} onChange={e => set('date_retour', e.target.value)}
                    className={errClass('date_retour')} />
                  {fieldErrors.date_retour && <p className="text-red-500 text-xs">{fieldErrors.date_retour}</p>}
                </div>

                <div className="space-y-1.5">
                  <LabelIcon required error={fieldErrors.retourType}>Type de retour</LabelIcon>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setRetourType('client'); setForm(f => ({ ...f, id_partenaire_client: '', id_partenaire_dest: '' })); setFieldErrors(f => { const n = { ...f }; delete n.retourType; return n; }); }}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold border-2 transition-all ${retourType === 'client' ? 'border-royal-600 bg-royal-50 text-royal-800' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                      <div className="flex items-center justify-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Retour client
                      </div>
                    </button>
                    <button type="button" onClick={() => { setRetourType('fournisseur'); setForm(f => ({ ...f, id_partenaire_client: '', id_partenaire_dest: '' })); setFieldErrors(f => { const n = { ...f }; delete n.retourType; return n; }); }}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold border-2 transition-all ${retourType === 'fournisseur' ? 'border-royal-600 bg-royal-50 text-royal-800' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                      <div className="flex items-center justify-center gap-2">
                        <Truck className="w-4 h-4" />
                        Retour fournisseur
                      </div>
                    </button>
                  </div>
                  {fieldErrors.retourType && <p className="text-red-500 text-xs">{fieldErrors.retourType}</p>}
                </div>

                {retourType === 'client' && (
                  <div className="space-y-1.5">
                    <LabelIcon icon={Building2} required error={fieldErrors.id_partenaire_client}>Client</LabelIcon>
                    <SearchableSelect
                      options={clients}
                      value={form.id_partenaire_client}
                      onValueChange={v => set('id_partenaire_client', v)}
                      placeholder="Sélectionner un client"
                      searchPlaceholder="Rechercher un client..."
                      error={fieldErrors.id_partenaire_client}
                    />
                  </div>
                )}

                {retourType === 'fournisseur' && (
                  <div className="space-y-1.5">
                    <LabelIcon icon={Truck} required error={fieldErrors.id_partenaire_dest}>Fournisseur</LabelIcon>
                    <SearchableSelect
                      options={fournisseurs}
                      value={form.id_partenaire_dest}
                      onValueChange={v => set('id_partenaire_dest', v)}
                      placeholder="Sélectionner un fournisseur"
                      searchPlaceholder="Rechercher un fournisseur..."
                      error={fieldErrors.id_partenaire_dest}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <LabelIcon icon={MapPin} required error={fieldErrors.id_ville}>Ville</LabelIcon>
                  <SearchableSelect
                    options={villes}
                    value={form.id_ville}
                    onValueChange={v => set('id_ville', v)}
                    placeholder="Sélectionner une ville"
                    searchPlaceholder="Rechercher une ville..."
                    error={fieldErrors.id_ville}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <h2 className="text-base font-semibold text-gray-900">Lignes de retour</h2>
                  </div>
                  <Button type="button" size="sm" onClick={addLigne} variant="outline" className="border-gray-200 text-gray-600">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
                  </Button>
                </div>

                {form.lignes.map((ligne, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Lot *</Label>
                      <SearchableSelect
                        options={lots.map(l => ({ id: l.id, nom: l.produit ? `[${l.produit.nom}] ${l.numero_lot}` : l.numero_lot, sousTitre: `dispo: ${l.quantite_disponible}` }))}
                        value={ligne.id_lot}
                        onValueChange={v => updateLigne(idx, 'id_lot', v)}
                        placeholder="Sélectionner un lot"
                        searchPlaceholder="Rechercher un lot..."
                        error={fieldErrors[`lignes.${idx}.id_lot`]}
                      />
                    </div>
                    <div className="w-24 space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Qté *</Label>
                      <Input type="number" min="1" value={ligne.quantite_retournee} onChange={e => updateLigne(idx, 'quantite_retournee', e.target.value)}
                        className={`h-9 text-sm ${errClass(`lignes.${idx}.quantite_retournee`)}`} placeholder="0" />
                      {fieldErrors[`lignes.${idx}.quantite_retournee`] && <p className="text-red-500 text-xs">{fieldErrors[`lignes.${idx}.quantite_retournee`]}</p>}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Motif</Label>
                      <Input value={ligne.motif} onChange={e => updateLigne(idx, 'motif', e.target.value)}
                        className="h-9 text-sm" placeholder="Optionnel" />
                    </div>
                    {form.lignes.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLigne(idx)}
                        className="h-9 w-9 p-0 mt-5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-400" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <h2 className="text-base font-semibold text-gray-900">Commentaire</h2>
                </div>
                <textarea value={form.commentaire} onChange={e => set('commentaire', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm min-h-[160px] focus:border-royal-500 focus:ring-1 focus:ring-royal-500 resize-none transition-colors"
                  placeholder="Ajouter un commentaire (optionnel)" />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={submitting}
                className="w-full bg-royal-700 hover:bg-royal-800 text-white shadow-sm h-11 font-semibold">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</> : (isEdit ? 'Enregistrer les modifications' : 'Créer le retour')}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/stock/retour')} disabled={submitting}
                className="w-full border-gray-200 text-gray-600 h-11">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}