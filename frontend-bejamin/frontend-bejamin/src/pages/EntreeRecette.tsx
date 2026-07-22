import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { ficheTechniqueService } from '../services/fiche-technique';
import { entreeRecetteService } from '../services/entree-recette';
import { produitService } from '../services/produit';
import type { FicheTechnique } from '../types/fiche-technique';
import {
  ArrowLeft, Save, Loader2, FileText, MapPin, Package, CalendarDays, Hash, DollarSign, Scale, Plus, CheckCircle2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

interface VilleOption { id: number; nom: string }
interface ZoneOption { id: number; nom: string }
interface EmplacementOption { id: number; nom: string }

export function EntreeRecette() {
  const { toast } = useToast();

  const [villes, setVilles] = useState<VilleOption[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [emplacements, setEmplacements] = useState<EmplacementOption[]>([]);
  const [fiches, setFiches] = useState<FicheTechnique[]>([]);
  const [selectedFiche, setSelectedFiche] = useState<FicheTechnique | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ lot: { numero_lot: string; quantite_disponible: number }; cout_total: number; cout_unitaire: number } | null>(null);
  const [form, setForm] = useState({
    id_fiche_technique: '', quantite_produite: '1', id_ville: '',
    id_zone: '', id_emplacement: '', date_production: new Date().toISOString().slice(0, 10),
    commentaire: '',
  });

  useEffect(() => {
    produitService.list().catch(() => {});
    (async () => {
      try {
        const [v, ft] = await Promise.all([
          api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/villes'),
          ficheTechniqueService.list({ per_page: '500', actif: '1' }),
        ]);
        if (v.success) setVilles(v.data.data);
        if (ft.success) setFiches(ft.data.data);
      } catch { /* */ }
    })();
  }, []);

  const handleFicheChange = (id: string) => {
    setForm(f => ({ ...f, id_fiche_technique: id, id_zone: '', id_emplacement: '' }));
    const fiche = fiches.find(f => String(f.id) === id);
    setSelectedFiche(fiche || null);
    if (fiche) {
      setForm(f => ({ ...f, id_ville: String(fiche.id_ville), id_zone: '', id_emplacement: '', id_fiche_technique: id }));
      loadZones(fiche.id_ville);
    }
  };

  const handleVilleChange = (villeId: string) => {
    setForm(f => ({ ...f, id_ville: villeId, id_zone: '', id_emplacement: '' }));
    if (villeId) loadZones(Number(villeId));
  };

  const loadZones = async (villeId: number) => {
    if (!villeId) { setZones([]); setEmplacements([]); return; }
    try {
      const z = await api.get<{ success: boolean; data: { id: number; nom: string }[] }>(`/config/zones/by-ville/${villeId}`);
      if (z.success) setZones(z.data);
    } catch { setZones([]); }
    setEmplacements([]);
  };

  const loadEmplacements = async (zoneId: number) => {
    if (!zoneId) { setEmplacements([]); return; }
    try {
      const e = await api.get<{ success: boolean; data: { id: number; nom: string }[] }>(`/config/emplacements/by-zone/${zoneId}`);
      if (e.success) setEmplacements(e.data);
    } catch { setEmplacements([]); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        id_fiche_technique: Number(form.id_fiche_technique),
        quantite_produite: Number(form.quantite_produite),
        id_ville: Number(form.id_ville),
        id_zone: Number(form.id_zone),
        id_emplacement: form.id_emplacement ? Number(form.id_emplacement) : undefined,
        date_production: form.date_production,
        commentaire: form.commentaire || undefined,
      };
      const res = await entreeRecetteService.produire(payload);
      if (res.success && res.data) {
        toast('Production enregistrée avec succès', 'success');
        setResult(res.data);
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      const msg = error.message || (error.errors ? Object.values(error.errors).flat().join(', ') : 'Erreur lors de la production');
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const LabelIcon = ({ icon: Icon, children, required }: { icon?: React.ElementType; children: React.ReactNode; required?: boolean }) => (
    <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );

  const resetForm = () => {
    setForm({
      id_fiche_technique: '', quantite_produite: '1', id_ville: '',
      id_zone: '', id_emplacement: '', date_production: new Date().toISOString().slice(0, 10), commentaire: '',
    });
    setSelectedFiche(null);
    setResult(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Entrée recette / Production</h1>
        <p className="text-sm text-gray-500 mt-0.5">Produire à partir d'une fiche technique</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-royal-700" />
                  <h2 className="text-base font-bold text-gray-800">Fiche technique</h2>
                </div>

                <div>
                  <LabelIcon icon={FileText} required>Fiche technique</LabelIcon>
                  <Select value={form.id_fiche_technique} onValueChange={handleFicheChange}>
                    <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Sélectionner une recette" />
                    </SelectTrigger>
                    <SelectContent>
                      {fiches.map((f) => (<SelectItem key={f.id} value={String(f.id)}>[{f.code}] {f.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFiche && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Package className="w-4 h-4 text-royal-700" />
                      <span className="font-medium">Produit fini :</span>
                      <span>{selectedFiche.produitFini?.nom || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Scale className="w-4 h-4 text-royal-700" />
                      <span className="font-medium">Rendement :</span>
                      <span>{selectedFiche.rendement} portion(s)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <DollarSign className="w-4 h-4 text-royal-700" />
                      <span className="font-medium">Coût unitaire :</span>
                      <span>{formatCurrency(selectedFiche.cout_unitaire)}</span>
                    </div>
                    {selectedFiche.lignes && selectedFiche.lignes.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-1.5">Ingrédients :</p>
                        <div className="space-y-1">
                          {selectedFiche.lignes.map((l) => (
                            <div key={l.id} className="flex items-center gap-2 text-xs text-gray-600">
                              <Plus className="w-3 h-3 text-emerald-600" />
                              <span>{l.quantite_ingredient} {l.unite?.symbole} {l.ingredient?.nom}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Package} required>Quantité à produire</LabelIcon>
                    <Input type="number" min="1" value={form.quantite_produite}
                      onChange={e => setForm(f => ({ ...f, quantite_produite: e.target.value }))}
                      className="h-11 border-gray-200 shadow-sm" />
                  </div>
                  <div>
                    <LabelIcon icon={CalendarDays} required>Date production</LabelIcon>
                    <Input type="date" value={form.date_production}
                      onChange={e => setForm(f => ({ ...f, date_production: e.target.value }))}
                      className="h-11 border-gray-200 shadow-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-base font-bold text-gray-800">Destination</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={MapPin} required>Ville</LabelIcon>
                    <Select value={form.id_ville} onValueChange={handleVilleChange}>
                      <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {villes.map((v) => (<SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <LabelIcon icon={MapPin} required>Zone</LabelIcon>
                    <Select key={`zone-${form.id_ville}`} value={form.id_zone} onValueChange={(v) => { setForm(f => ({ ...f, id_zone: v, id_emplacement: '' })); loadEmplacements(Number(v)); }}>
                      <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => (<SelectItem key={z.id} value={String(z.id)}>{z.nom}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <LabelIcon icon={MapPin}>Emplacement (optionnel)</LabelIcon>
                  <Select key={`empl-${form.id_zone}`} value={form.id_emplacement} onValueChange={(v) => setForm(f => ({ ...f, id_emplacement: v }))}>
                    <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {emplacements.map((e) => (<SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <LabelIcon>Commentaire</LabelIcon>
                  <Textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                    rows={2} className="border-gray-200 shadow-sm" placeholder="Optionnel" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <DollarSign className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Résumé</h2>
                </div>
                {selectedFiche ? (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Quantité</div>
                      <div className="text-xl font-semibold text-gray-900">{form.quantite_produite}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Coût unitaire estimé</div>
                      <div className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(selectedFiche.cout_unitaire)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Coût total estimé</div>
                      <div className="text-2xl font-bold text-royal-700 font-mono">{formatCurrency(selectedFiche.cout_unitaire * Number(form.quantite_produite))}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400 py-4 text-center">Sélectionnez une fiche technique</div>
                )}
              </CardContent>
            </Card>

            {result && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-700" />
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    Production réussie
                  </div>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p><span className="font-medium">Lot :</span> {result.lot?.numero_lot || '-'}</p>
                    <p><span className="font-medium">Quantité :</span> {result.lot?.quantite_disponible ?? 0}</p>
                    <p><span className="font-medium">Coût total :</span> {formatCurrency(result.cout_total ?? 0)}</p>
                    <p><span className="font-medium">Coût unitaire :</span> {formatCurrency(result.cout_unitaire ?? 0)}</p>
                  </div>
                  <Button type="button" onClick={resetForm} variant="outline" size="sm" className="w-full mt-2">
                    Nouvelle production
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {!result && (
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Button type="submit" disabled={submitting || !form.id_fiche_technique || !form.id_ville || !form.id_zone}
              className="h-11 px-8 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl shadow-sm">
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Production...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Lancer la production</>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
