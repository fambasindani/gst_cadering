import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { atelierService } from '../services/atelier';
import { lotService } from '../services/lot';
import { partenaireService } from '../services/partenaire';
import { ArrowLeft, Save, Loader2, Factory, User, Plus, Trash2, Thermometer } from 'lucide-react';
import type { Lot } from '../types/lot';

interface Ligne {
  key: string;
  id_lot: string;
  id_partenaire: string;
  code_prestation: string;
  quantite: string;
  produits_utilises: string;
  code_couleur_produit_dlc: string;
  cycle_classe: string;
  heure_debut: string;
  temperature_surface_debut: string;
  heure_fin: string;
  temperature_surface_fin: string;
  action_corrective: string;
}

const emptyLigne = (): Ligne => ({
  key: crypto.randomUUID(),
  id_lot: '', id_partenaire: '', code_prestation: '', quantite: '', produits_utilises: '',
  code_couleur_produit_dlc: '', cycle_classe: '', heure_debut: '',
  temperature_surface_debut: '', heure_fin: '', temperature_surface_fin: '', action_corrective: '',
});

export function AtelierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [lots, setLots] = useState<Lot[]>([]);
  const [partenaires, setPartenaires] = useState<{ id: number; nom: string; code_iata?: string }[]>([]);

  const [typeAtelier, setTypeAtelier] = useState('');
  const [dateOperation, setDateOperation] = useState(new Date().toISOString().split('T')[0]);
  const [temperatureAtelier, setTemperatureAtelier] = useState('');
  const [lignes, setLignes] = useState<Ligne[]>([emptyLigne()]);

  const [editForm, setEditForm] = useState({
    type_atelier: '', date_operation: '', id_lot: '', id_partenaire: '',
    temperature_atelier: '', code_prestation: '', quantite: '', produits_utilises: '',
    code_couleur_produit_dlc: '', cycle_classe: '', heure_debut: '',
    temperature_surface_debut: '', heure_fin: '', temperature_surface_fin: '', action_corrective: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lotsRes, clientsRes] = await Promise.all([
        lotService.list({ per_page: '500', statut_validation: 'VALIDÉ' }),
        partenaireService.getClients(),
      ]);
      if (lotsRes.success && lotsRes.data?.data) setLots(lotsRes.data.data);
      if (clientsRes.success && clientsRes.data?.data) setPartenaires(clientsRes.data.data);

      if (isEdit && id) {
        const editResult = await atelierService.get(Number(id));
        if (editResult.success && editResult.data) {
          const a = editResult.data;
          setEditForm({
            type_atelier: a.type_atelier || '', date_operation: a.date_operation || '',
            id_lot: a.id_lot ? String(a.id_lot) : '', id_partenaire: a.id_partenaire ? String(a.id_partenaire) : '',
            temperature_atelier: a.temperature_atelier != null ? String(a.temperature_atelier) : '',
            code_prestation: a.code_prestation || '', quantite: a.quantite || '',
            produits_utilises: a.produits_utilises || '', code_couleur_produit_dlc: a.code_couleur_produit_dlc || '',
            cycle_classe: a.cycle_classe || '', heure_debut: a.heure_debut || '',
            temperature_surface_debut: a.temperature_surface_debut != null ? String(a.temperature_surface_debut) : '',
            heure_fin: a.heure_fin || '',
            temperature_surface_fin: a.temperature_surface_fin != null ? String(a.temperature_surface_fin) : '',
            action_corrective: a.action_corrective || '',
          });
        }
      }
    } catch {
      toast('Erreur lors du chargement des données', 'error');
      if (isEdit) navigate('/stock/atelier');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, toast, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateLigne = (key: string, field: string, value: string) => {
    setLignes(prev => prev.map(l => l.key === key ? { ...l, [field]: value } : l));
  };

  const lotOptions = lots.map(l => ({ id: l.id, nom: l.numero_lot, sousTitre: l.produit?.nom || '' }));
  const clientOptions = partenaires.map(p => ({ id: p.id, nom: p.nom, sousTitre: p.code_iata || '' }));

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!typeAtelier) { setErrors({ type_atelier: 'Le type est requis' }); return; }
    if (!dateOperation) { setErrors({ date_operation: 'La date est requise' }); return; }

    const validLignes = lignes.filter(l => l.id_lot || l.code_prestation || l.produits_utilises);
    if (validLignes.length === 0) { setErrors({ lignes: 'Ajoutez au moins une ligne avec un lot' }); return; }

    setSaving(true);
    try {
      await atelierService.createBulk({
        type_atelier: typeAtelier,
        date_operation: dateOperation,
        temperature_atelier: temperatureAtelier ? Number(temperatureAtelier) : null,
        lignes: validLignes.map(l => ({
          id_lot: l.id_lot ? Number(l.id_lot) : null,
          id_partenaire: l.id_partenaire ? Number(l.id_partenaire) : null,
          code_prestation: l.code_prestation || null,
          quantite: l.quantite || null,
          produits_utilises: l.produits_utilises || null,
          code_couleur_produit_dlc: l.code_couleur_produit_dlc || null,
          cycle_classe: l.cycle_classe || null,
          heure_debut: l.heure_debut || null,
          temperature_surface_debut: l.temperature_surface_debut ? Number(l.temperature_surface_debut) : null,
          heure_fin: l.heure_fin || null,
          temperature_surface_fin: l.temperature_surface_fin ? Number(l.temperature_surface_fin) : null,
          action_corrective: l.action_corrective || null,
        })),
      });
      toast(`${validLignes.length} atelier(s) créé(s) avec succès`, 'success');
      navigate('/stock/atelier');
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(error.errors)) flat[key] = msgs[0];
        setErrors(flat);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!editForm.type_atelier) { setErrors({ type_atelier: 'Le type est requis' }); return; }
    if (!editForm.date_operation) { setErrors({ date_operation: 'La date est requise' }); return; }

    setSaving(true);
    try {
      await atelierService.update(Number(id), {
        type_atelier: editForm.type_atelier, date_operation: editForm.date_operation,
        id_lot: editForm.id_lot ? Number(editForm.id_lot) : null,
        id_partenaire: editForm.id_partenaire ? Number(editForm.id_partenaire) : null,
        temperature_atelier: editForm.temperature_atelier ? Number(editForm.temperature_atelier) : null,
        code_prestation: editForm.code_prestation || null, quantite: editForm.quantite || null,
        produits_utilises: editForm.produits_utilises || null,
        code_couleur_produit_dlc: editForm.code_couleur_produit_dlc || null,
        cycle_classe: editForm.cycle_classe || null, heure_debut: editForm.heure_debut || null,
        temperature_surface_debut: editForm.temperature_surface_debut ? Number(editForm.temperature_surface_debut) : null,
        heure_fin: editForm.heure_fin || null,
        temperature_surface_fin: editForm.temperature_surface_fin ? Number(editForm.temperature_surface_fin) : null,
        action_corrective: editForm.action_corrective || null,
      });
      toast('Atelier mis à jour avec succès', 'success');
      navigate('/stock/atelier');
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(error.errors)) flat[key] = msgs[0];
        setErrors(flat);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateEditField = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/atelier')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="pt-6"><div className="animate-pulse space-y-4">{Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-12 bg-gray-200 rounded" />)}</div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (isEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/stock/atelier')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
            <h1 className="text-2xl font-bold text-gray-900">Modifier l'atelier</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-8 h-8 rounded-full bg-royal-100 flex items-center justify-center"><User className="w-4 h-4 text-royal-700" /></div>
            <div><p className="font-medium text-gray-900">{user?.full_name || '—'}</p><p className="text-xs text-gray-400">Opérateur</p></div>
          </div>
        </div>
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5 text-amber-600" /> Informations générales</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'atelier *</label>
                    <select value={editForm.type_atelier} onChange={(e) => updateEditField('type_atelier', e.target.value)} className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.type_atelier ? 'border-red-400' : 'border-input'}`}>
                      <option value="">Sélectionner</option>
                      <option value="DRESSAGE">DRESSAGE</option>
                      <option value="MONTAGE">MONTAGE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'opération *</label>
                    <Input type="date" value={editForm.date_operation} onChange={(e) => updateEditField('date_operation', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lot (produit)</label>
                  <SearchableSelect options={lotOptions} value={editForm.id_lot} onValueChange={(v) => updateEditField('id_lot', v)} placeholder="Sélectionner un lot..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client / Compagnie</label>
                  <SearchableSelect options={clientOptions} value={editForm.id_partenaire} onValueChange={(v) => updateEditField('id_partenaire', v)} placeholder="Sélectionner un client..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Code prestation</label><Input value={editForm.code_prestation} onChange={(e) => updateEditField('code_prestation', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label><Input value={editForm.quantite} onChange={(e) => updateEditField('quantite', e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5 text-royal-700" /> Détails</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Produits utilisés</label><Input value={editForm.produits_utilises} onChange={(e) => updateEditField('produits_utilises', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Couleur / DLC</label><Input value={editForm.code_couleur_produit_dlc} onChange={(e) => updateEditField('code_couleur_produit_dlc', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Cycle / Classe</label><Input value={editForm.cycle_classe} onChange={(e) => updateEditField('cycle_classe', e.target.value)} /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">T° atelier (°C)</label><Input type="number" step="0.1" value={editForm.temperature_atelier} onChange={(e) => updateEditField('temperature_atelier', e.target.value)} /></div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Thermometer className="w-5 h-5 text-amber-600" /> Températures surface</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label><Input type="time" value={editForm.heure_debut} onChange={(e) => updateEditField('heure_debut', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">T° surface début</label><Input type="number" step="0.1" value={editForm.temperature_surface_debut} onChange={(e) => updateEditField('temperature_surface_debut', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label><Input type="time" value={editForm.heure_fin} onChange={(e) => updateEditField('heure_fin', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">T° surface fin</label><Input type="number" step="0.1" value={editForm.temperature_surface_fin} onChange={(e) => updateEditField('temperature_surface_fin', e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5 text-red-600" /> Action corrective</CardTitle></CardHeader>
              <CardContent>
                <textarea value={editForm.action_corrective} onChange={(e) => updateEditField('action_corrective', e.target.value)} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Action corrective si besoin..." />
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/stock/atelier')} className="border-gray-300">Annuler</Button>
            <Button type="submit" disabled={saving} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Mettre à jour
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/atelier')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
          <h1 className="text-2xl font-bold text-gray-900">Nouvel atelier</h1>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">{lignes.length} ligne(s)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-8 h-8 rounded-full bg-royal-100 flex items-center justify-center"><User className="w-4 h-4 text-royal-700" /></div>
          <div><p className="font-medium text-gray-900">{user?.full_name || '—'}</p><p className="text-xs text-gray-400">Opérateur</p></div>
        </div>
      </div>

      <form onSubmit={handleBulkSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5 text-amber-600" /> Informations communes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'atelier *</label>
                <select value={typeAtelier} onChange={(e) => { setTypeAtelier(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.type_atelier; return n; }); }} className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.type_atelier ? 'border-red-400' : 'border-input'}`}>
                  <option value="">Sélectionner</option>
                  <option value="DRESSAGE">DRESSAGE</option>
                  <option value="MONTAGE">MONTAGE</option>
                </select>
                {errors.type_atelier && <p className="text-red-500 text-xs mt-1">{errors.type_atelier}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'opération *</label>
                <Input type="date" value={dateOperation} onChange={(e) => { setDateOperation(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.date_operation; return n; }); }} className={errors.date_operation ? 'border-red-400' : ''} />
                {errors.date_operation && <p className="text-red-500 text-xs mt-1">{errors.date_operation}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">T° atelier (°C)</label>
                <Input type="number" step="0.1" value={temperatureAtelier} onChange={(e) => setTemperatureAtelier(e.target.value)} placeholder="Ex: 12.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5 text-royal-700" /> Lignes d'atelier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {errors.lignes && <p className="text-red-500 text-sm">{errors.lignes}</p>}
            {lignes.map((ligne, idx) => (
              <div key={ligne.key} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ligne {idx + 1}</span>
                  {lignes.length > 1 && (
                    <button type="button" onClick={() => setLignes(prev => prev.filter(l => l.key !== ligne.key))} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Lot (produit) *</label>
                    <SearchableSelect options={lotOptions} value={ligne.id_lot} onValueChange={(v) => updateLigne(ligne.key, 'id_lot', v)} placeholder="Lot..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Client / Compagnie</label>
                    <SearchableSelect options={clientOptions} value={ligne.id_partenaire} onValueChange={(v) => updateLigne(ligne.key, 'id_partenaire', v)} placeholder="Client..." />
                  </div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Code prestation</label><Input value={ligne.code_prestation} onChange={(e) => updateLigne(ligne.key, 'code_prestation', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Quantité</label><Input value={ligne.quantite} onChange={(e) => updateLigne(ligne.key, 'quantite', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Couleur / DLC</label><Input value={ligne.code_couleur_produit_dlc} onChange={(e) => updateLigne(ligne.key, 'code_couleur_produit_dlc', e.target.value)} /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Produits utilisés</label><Input value={ligne.produits_utilises} onChange={(e) => updateLigne(ligne.key, 'produits_utilises', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Cycle / Classe</label><Input value={ligne.cycle_classe} onChange={(e) => updateLigne(ligne.key, 'cycle_classe', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Début</label><Input type="time" value={ligne.heure_debut} onChange={(e) => updateLigne(ligne.key, 'heure_debut', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">T° début</label><Input type="number" step="0.1" value={ligne.temperature_surface_debut} onChange={(e) => updateLigne(ligne.key, 'temperature_surface_debut', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Fin</label><Input type="time" value={ligne.heure_fin} onChange={(e) => updateLigne(ligne.key, 'heure_fin', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">T° fin</label><Input type="number" step="0.1" value={ligne.temperature_surface_fin} onChange={(e) => updateLigne(ligne.key, 'temperature_surface_fin', e.target.value)} /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Action corrective</label><Input value={ligne.action_corrective} onChange={(e) => updateLigne(ligne.key, 'action_corrective', e.target.value)} /></div>
                </div>
              </div>
            ))}
            <div className="mt-3">
              <Button type="button" size="sm" onClick={() => setLignes(prev => [...prev, emptyLigne()])}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs rounded-lg">
                <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une ligne
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/stock/atelier')} className="border-gray-300">Annuler</Button>
          <Button type="submit" disabled={saving} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer {lignes.filter(l => l.id_lot).length > 0 ? `(${lignes.filter(l => l.id_lot).length})` : ''}
          </Button>
        </div>
      </form>
    </div>
  );
}
