import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { lotService } from '../services/lot';
import { bonCommandeService } from '../services/bon-commande';
import {
  ArrowLeft, Save, Loader2, Package, Barcode, MapPin, Building2, CalendarDays, DollarSign, MessageSquare, Tag, Warehouse,
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
    lotService.get(Number(id)).then(res => {
      if (res.success) {
        const l = res.data;
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
      const error = err as { message?: string };
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Package className="w-5 h-5 text-royal-700" />
                  <h2 className="text-base font-bold text-gray-800">Identification du produit</h2>
                </div>

                <div>
                  <Label icon={Package} required>Produit</Label>
                  <Select value={form.id_produit} onValueChange={v => setForm(f => ({ ...f, id_produit: v }))}>
                    <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {produits.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{p.nom}</span>
                            <span className="text-xs text-gray-400">({p.code})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label icon={Tag} required>Numéro de lot</Label>
                    <Input value={form.numero_lot} onChange={e => setForm(f => ({ ...f, numero_lot: e.target.value }))}
                      className="h-11 border-gray-200 shadow-sm" placeholder="Ex: LOT-2024-001" />
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
                      onChange={e => setForm(f => ({ ...f, quantite_recue: e.target.value }))}
                      className="h-11 border-gray-200 shadow-sm" placeholder="0" />
                  </div>
                  <div>
                    <Label icon={CalendarDays} required>Date de péremption</Label>
                    <Input type="date" value={form.date_peremption}
                      onChange={e => setForm(f => ({ ...f, date_peremption: e.target.value }))}
                      className="h-11 border-gray-200 shadow-sm" />
                  </div>
                </div>

                <div>
                  <Label icon={CalendarDays}>Date de fabrication</Label>
                  <Input type="date" value={form.date_fabrication}
                    onChange={e => setForm(f => ({ ...f, date_fabrication: e.target.value }))}
                    className="h-11 border-gray-200 shadow-sm" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-base font-bold text-gray-800">Stockage</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label icon={MapPin} required>Ville</Label>
                    <Select value={form.id_ville} onValueChange={handleVilleChange}>
                      <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                        <SelectValue placeholder="Sélectionner une ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {villes.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label icon={Warehouse} required>Zone</Label>
                    <Select value={form.id_zone} onValueChange={handleZoneChange} disabled={!form.id_ville}>
                      <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                        <SelectValue placeholder={form.id_ville ? 'Sélectionner une zone' : 'Choisissez une ville d\'abord'} />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map(z => <SelectItem key={z.id} value={String(z.id)}>{z.nom}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label icon={MapPin}>Emplacement</Label>
                  <Select value={form.id_emplacement} onValueChange={v => setForm(f => ({ ...f, id_emplacement: v }))} disabled={!form.id_zone}>
                    <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                      <SelectValue placeholder={form.id_zone ? 'Sélectionner un emplacement (optionnel)' : 'Choisissez une zone d\'abord'} />
                    </SelectTrigger>
                    <SelectContent>
                      {emplacements.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <DollarSign className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Fournisseur & Prix</h2>
                </div>

                <div>
                  <Label icon={Building2}>Fournisseur</Label>
                  <Select value={form.id_partenaire} onValueChange={v => setForm(f => ({ ...f, id_partenaire: v }))}>
                    <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {partenaires.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label icon={DollarSign}>Prix achat unitaire HT</Label>
                  <div className="relative">
                    <Input type="number" step="0.01" min="0" value={form.prix_achat_ht_unitaire}
                      onChange={e => setForm(f => ({ ...f, prix_achat_ht_unitaire: e.target.value }))}
                      className="h-11 border-gray-200 shadow-sm pl-8" placeholder="0,00" />
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label icon={DollarSign}>Devise</Label>
                  <Select value={form.id_devise} onValueChange={v => setForm(f => ({ ...f, id_devise: v }))}>
                    <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {devises.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.code} - {d.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 to-sky-700" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <MessageSquare className="w-5 h-5 text-sky-700" />
                  <h2 className="text-base font-bold text-gray-800">Note</h2>
                </div>

                <div>
                  <Label>Commentaire</Label>
                  <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 shadow-sm px-4 py-3 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-royal-500/20 focus:border-royal-500 transition-all"
                    placeholder="Ajouter une note ou un commentaire..." />
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
          <Button type="submit" disabled={saving || !isValid}
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
