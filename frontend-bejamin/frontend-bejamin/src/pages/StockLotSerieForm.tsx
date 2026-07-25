import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { lotService } from '../services/lot';
import { bonCommandeService } from '../services/bon-commande';
import {
  ArrowLeft, Save, Loader2, Package, Barcode, MapPin, Building2, CalendarDays, DollarSign, MessageSquare, Tag, Warehouse, AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SelectOption { id: number; nom: string; code?: string }

export function StockLotSerieForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lotStatut, setLotStatut] = useState<string | null>(null);
  const estVerrouille = isEdit && lotStatut === 'VALIDÉ';
  const [produits, setProduits] = useState<SelectOption[]>([]);
  const [villes, setVilles] = useState<SelectOption[]>([]);
  const [zones, setZones] = useState<SelectOption[]>([]);
  const [emplacements, setEmplacements] = useState<SelectOption[]>([]);
  const [partenaires, setPartenaires] = useState<SelectOption[]>([]);
  const [devises, setDevises] = useState<SelectOption[]>([]);

  const [form, setForm] = useState({
    id_produit: '', numero_lot: '', id_ville: '', id_zone: '', id_emplacement: '',
    quantite_recue: '', date_peremption: '', date_fabrication: '',
    id_partenaire: '', prix_achat_ht_unitaire: '', id_devise: '', commentaire: '',
  });

  useEffect(() => {
    Promise.all([
      bonCommandeService.getProduits({ per_page: '500' }),
      bonCommandeService.getVilles({ per_page: '500' }),
      bonCommandeService.getPartenaires({ per_page: '500' }),
      bonCommandeService.getDevises({ per_page: '500' }),
    ]).then(([pr, vr, par, dr]) => {
      if (pr.success) setProduits(pr.data.data);
      if (vr.success) setVilles(vr.data.data);
      if (par.success) setPartenaires(par.data.data);
      if (dr.success) setDevises(dr.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setFieldErrors({});
    lotService.get(Number(id)).then(res => {
      if (res.success) {
        const l = res.data;
        setLotStatut(l.statut_validation);
        setForm({
          id_produit: String(l.id_produit), numero_lot: l.numero_lot || '',
          id_ville: String(l.id_ville), id_zone: String(l.id_zone),
          id_emplacement: l.id_emplacement ? String(l.id_emplacement) : '',
          quantite_recue: String(l.quantite_recue),
          date_peremption: l.date_peremption?.split('T')[0] || '',
          date_fabrication: l.date_fabrication?.split('T')[0] || '',
          id_partenaire: l.id_partenaire ? String(l.id_partenaire) : '',
          prix_achat_ht_unitaire: l.prix_achat_ht_unitaire ? String(l.prix_achat_ht_unitaire) : '',
          id_devise: l.id_devise ? String(l.id_devise) : '',
          commentaire: l.commentaire || '',
        });
        if (l.id_ville) loadZones(l.id_ville);
        if (l.id_emplacement) loadEmplacements(l.id_zone);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const loadZones = async (villeId: number) => {
    try { const r = await bonCommandeService.getZonesByVille(villeId); if (r.success) setZones(r.data); }
    catch { setZones([]); }
  };

  const loadEmplacements = async (zoneId: number) => {
    if (!zoneId) { setEmplacements([]); return; }
    try { const r = await bonCommandeService.getEmplacementsByZone(zoneId); if (r.success) setEmplacements(r.data); }
    catch { setEmplacements([]); }
  };

  const handleVilleChange = (v: string) => {
    setForm(f => ({ ...f, id_ville: v, id_zone: '', id_emplacement: '' }));
    if (v) loadZones(Number(v));
  };

  const handleZoneChange = (v: string) => {
    setForm(f => ({ ...f, id_zone: v, id_emplacement: '' }));
    if (v) loadEmplacements(Number(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const payload: Record<string, string | number> = {
        id_produit: Number(form.id_produit), numero_lot: form.numero_lot,
        id_ville: Number(form.id_ville), id_zone: Number(form.id_zone),
        quantite_recue: Number(form.quantite_recue), date_peremption: form.date_peremption,
      };
      if (form.id_emplacement) payload.id_emplacement = Number(form.id_emplacement);
      if (form.date_fabrication) payload.date_fabrication = form.date_fabrication;
      if (form.id_partenaire) payload.id_partenaire = Number(form.id_partenaire);
      if (form.prix_achat_ht_unitaire) payload.prix_achat_ht_unitaire = Number(form.prix_achat_ht_unitaire);
      if (form.id_devise) payload.id_devise = Number(form.id_devise);
      if (form.commentaire) payload.commentaire = form.commentaire;
      if (isEdit) {
        await lotService.update(Number(id), payload);
        toast('Lot modifié avec succès', 'success');
      } else {
        await lotService.create(payload);
        toast('Lot créé avec succès', 'success');
      }
      navigate('/stock/lot-serie');
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

  const isValid = form.id_produit && form.numero_lot && form.id_ville && form.id_zone && form.quantite_recue && form.date_peremption;

  const errorClass = (field: string) => fieldErrors[field] ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : 'border-gray-200';

  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p> : null;

  const FieldCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("p-5 rounded-xl border border-gray-100 bg-white/50 space-y-4", className)}>
      {children}
    </div>
  );

  const Label = ({ icon: Icon, children, required }: { icon?: React.ElementType; children: React.ReactNode; required?: boolean }) => (
    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/stock/lot-serie')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier le lot' : 'Nouveau lot'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Modifier les informations du lot' : 'Créer un nouveau lot dans le stock'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {estVerrouille && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Ce lot a déjà été validé et ne peut pas être modifié
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Package className="w-5 h-5 text-royal-700" />
                  <h2 className="text-base font-bold text-gray-800">Identification du produit</h2>
                </div>

                <div>
                  <Label icon={Package} required>Produit</Label>
                  <SearchableSelect
                    options={produits.map(p => ({ id: p.id, nom: p.nom, sousTitre: p.code }))}
                    value={form.id_produit}
                    onValueChange={v => { setFieldErrors(f => { const n = { ...f }; delete n.id_produit; return n; }); setForm(f => ({ ...f, id_produit: v })); }}
                    placeholder="Sélectionner un produit"
                    searchPlaceholder="Rechercher un produit..."
                    error={fieldErrors.id_produit}
                  />
                  <FieldError field="id_produit" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label icon={Tag} required>Numéro de lot</Label>
                    <Input value={form.numero_lot} onChange={e => { setFieldErrors(f => { const n = { ...f }; delete n.numero_lot; return n; }); setForm(f => ({ ...f, numero_lot: e.target.value })); }}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass('numero_lot'))} placeholder="Ex: LOT-2024-001" />
                    <FieldError field="numero_lot" />
                  </div>
                  <div>
                    <Label icon={Barcode}>Code QR</Label>
                    <Input disabled className="h-11 border-gray-200 bg-gray-50 text-gray-400" placeholder="Généré automatiquement" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label icon={Warehouse} required>Quantité reçue</Label>
                    <Input type="number" min="1" value={form.quantite_recue}
                      onChange={e => { setFieldErrors(f => { const n = { ...f }; delete n.quantite_recue; return n; }); setForm(f => ({ ...f, quantite_recue: e.target.value })); }}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass('quantite_recue'))} placeholder="0" />
                    <FieldError field="quantite_recue" />
                  </div>
                  <div>
                    <Label icon={CalendarDays} required>Date de péremption</Label>
                    <Input type="date" value={form.date_peremption}
                      onChange={e => { setFieldErrors(f => { const n = { ...f }; delete n.date_peremption; return n; }); setForm(f => ({ ...f, date_peremption: e.target.value })); }}
                      className={cn('h-11 border-gray-200 shadow-sm', errorClass('date_peremption'))} />
                    <FieldError field="date_peremption" />
                  </div>
                </div>

                <div>
                  <Label icon={CalendarDays}>Date de fabrication</Label>
                  <Input type="date" value={form.date_fabrication}
                    onChange={e => { setFieldErrors(f => { const n = { ...f }; delete n.date_fabrication; return n; }); setForm(f => ({ ...f, date_fabrication: e.target.value })); }}
                    className={cn('h-11 border-gray-200 shadow-sm', errorClass('date_fabrication'))} />
                  <FieldError field="date_fabrication" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-base font-bold text-gray-800">Stockage</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label icon={MapPin} required>Ville</Label>
                    <SearchableSelect
                      options={villes.map(v => ({ id: v.id, nom: v.nom }))}
                      value={form.id_ville}
                      onValueChange={v => { setFieldErrors(f => { const n = { ...f }; delete n.id_ville; return n; }); handleVilleChange(v); }}
                      placeholder="Sélectionner une ville"
                      searchPlaceholder="Rechercher une ville..."
                      error={fieldErrors.id_ville}
                    />
                    <FieldError field="id_ville" />
                  </div>
                  <div>
                    <Label icon={Warehouse} required>Zone</Label>
                    <SearchableSelect
                      options={zones.map(z => ({ id: z.id, nom: z.nom }))}
                      value={form.id_zone}
                      onValueChange={v => { setFieldErrors(f => { const n = { ...f }; delete n.id_zone; return n; }); handleZoneChange(v); }}
                      disabled={!form.id_ville}
                      placeholder={form.id_ville ? 'Sélectionner une zone' : "Choisissez une ville d'abord"}
                      searchPlaceholder="Rechercher une zone..."
                      error={fieldErrors.id_zone}
                    />
                    <FieldError field="id_zone" />
                  </div>
                </div>

                <div>
                  <Label icon={MapPin}>Emplacement</Label>
<SearchableSelect
                      options={emplacements.map(e => ({ id: e.id, nom: e.nom }))}
                      value={form.id_emplacement}
                      onValueChange={v => { setFieldErrors(f => { const n = { ...f }; delete n.id_emplacement; return n; }); setForm(f => ({ ...f, id_emplacement: v })); }}
                      disabled={!form.id_zone}
                      placeholder={form.id_zone ? 'Sélectionner un emplacement (optionnel)' : "Choisissez une zone d'abord"}
                      searchPlaceholder="Rechercher un emplacement..."
                      error={fieldErrors.id_emplacement}
                    />
                  <FieldError field="id_emplacement" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <DollarSign className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Fournisseur & Prix</h2>
                </div>

                <div>
                  <Label icon={Building2}>Fournisseur</Label>
<SearchableSelect
                      options={partenaires.map(p => ({ id: p.id, nom: p.nom }))}
                      value={form.id_partenaire}
                      onValueChange={v => { setFieldErrors(f => { const n = { ...f }; delete n.id_partenaire; return n; }); setForm(f => ({ ...f, id_partenaire: v })); }}
                      placeholder="Sélectionner"
                      searchPlaceholder="Rechercher un fournisseur..."
                      error={fieldErrors.id_partenaire}
                    />
                  <FieldError field="id_partenaire" />
                </div>

                <div>
                  <Label icon={DollarSign}>Prix achat unitaire HT</Label>
                  <div className="relative">
                    <Input type="number" step="0.01" min="0" value={form.prix_achat_ht_unitaire}
                      onChange={e => { setFieldErrors(f => { const n = { ...f }; delete n.prix_achat_ht_unitaire; return n; }); setForm(f => ({ ...f, prix_achat_ht_unitaire: e.target.value })); }}
                      className={cn('h-11 border-gray-200 shadow-sm pl-8', errorClass('prix_achat_ht_unitaire'))} placeholder="0,00" />
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <FieldError field="prix_achat_ht_unitaire" />
                </div>

                <div>
                  <Label icon={DollarSign}>Devise</Label>
<SearchableSelect
                      options={devises.map(d => ({ id: d.id, nom: `${d.code} - ${d.nom}`, sousTitre: d.code }))}
                      value={form.id_devise}
                      onValueChange={v => { setFieldErrors(f => { const n = { ...f }; delete n.id_devise; return n; }); setForm(f => ({ ...f, id_devise: v })); }}
                      placeholder="Sélectionner"
                      searchPlaceholder="Rechercher une devise..."
                      error={fieldErrors.id_devise}
                    />
                  <FieldError field="id_devise" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 to-sky-700" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <MessageSquare className="w-5 h-5 text-sky-700" />
                  <h2 className="text-base font-bold text-gray-800">Note</h2>
                </div>

                <div>
                  <Label>Commentaire</Label>
                  <textarea value={form.commentaire} onChange={e => { setFieldErrors(f => { const n = { ...f }; delete n.commentaire; return n; }); setForm(f => ({ ...f, commentaire: e.target.value })); }}
                    className={cn('w-full rounded-xl border border-gray-200 shadow-sm px-4 py-3 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-royal-500/20 focus:border-royal-500 transition-all', errorClass('commentaire'))}
                    placeholder="Ajouter une note ou un commentaire..." />
                  <FieldError field="commentaire" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/stock/lot-serie')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving || !isValid || estVerrouille}
            className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm transition-all disabled:opacity-50">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {isEdit ? 'Enregistrer les modifications' : 'Créer le lot'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
