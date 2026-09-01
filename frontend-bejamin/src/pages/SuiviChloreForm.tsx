import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { suiviChloreService } from '../services/suivi-chlore';
import { lotService } from '../services/lot';
import { partenaireService } from '../services/partenaire';
import { ArrowLeft, Save, Loader2, Droplets, User, Plus, Trash2 } from 'lucide-react';
import type { Lot } from '../types/lot';

interface Ligne {
  key: string;
  id_lot: string;
  concentration_ppm: string;
  temps_trempage_minutes: string;
  commentaire_action_corrective: string;
}

const emptyLigne = (): Ligne => ({
  key: crypto.randomUUID(),
  id_lot: '', concentration_ppm: '', temps_trempage_minutes: '', commentaire_action_corrective: '',
});

export function SuiviChloreForm() {
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

  const [dateOperation, setDateOperation] = useState(new Date().toISOString().split('T')[0]);
  const [idPartenaire, setIdPartenaire] = useState('');
  const [lignes, setLignes] = useState<Ligne[]>([emptyLigne()]);

  const [editForm, setEditForm] = useState({
    date_operation: '', id_lot: '', id_partenaire: '', concentration_ppm: '',
    temps_trempage_minutes: '', commentaire_action_corrective: '',
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
        const editResult = await suiviChloreService.get(Number(id));
        if (editResult.success && editResult.data) {
          const s = editResult.data;
          setEditForm({
            date_operation: s.date_operation || '', id_lot: s.id_lot ? String(s.id_lot) : '',
            id_partenaire: s.id_partenaire ? String(s.id_partenaire) : '',
            concentration_ppm: s.concentration_ppm != null ? String(s.concentration_ppm) : '',
            temps_trempage_minutes: s.temps_trempage_minutes != null ? String(s.temps_trempage_minutes) : '',
            commentaire_action_corrective: s.commentaire_action_corrective || '',
          });
        }
      }
    } catch {
      toast('Erreur lors du chargement des données', 'error');
      if (isEdit) navigate('/stock/suivi-chlore');
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
    if (!dateOperation) { setErrors({ date_operation: 'La date est requise' }); return; }

    const validLignes = lignes.filter(l => l.id_lot || l.concentration_ppm);
    if (validLignes.length === 0) { setErrors({ lignes: 'Ajoutez au moins une ligne avec un lot' }); return; }

    setSaving(true);
    try {
      await suiviChloreService.createBulk({
        date_operation: dateOperation,
        id_partenaire: idPartenaire ? Number(idPartenaire) : null,
        lignes: validLignes.map(l => ({
          id_lot: l.id_lot ? Number(l.id_lot) : null,
          concentration_ppm: l.concentration_ppm ? Number(l.concentration_ppm) : null,
          temps_trempage_minutes: l.temps_trempage_minutes ? Number(l.temps_trempage_minutes) : null,
          commentaire_action_corrective: l.commentaire_action_corrective || null,
        })),
      });
      toast(`${validLignes.length} suivi(s) chlore créé(s) avec succès`, 'success');
      navigate('/stock/suivi-chlore');
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
    if (!editForm.date_operation) { setErrors({ date_operation: 'La date est requise' }); return; }

    setSaving(true);
    try {
      await suiviChloreService.update(Number(id), {
        date_operation: editForm.date_operation,
        id_lot: editForm.id_lot ? Number(editForm.id_lot) : null,
        id_partenaire: editForm.id_partenaire ? Number(editForm.id_partenaire) : null,
        concentration_ppm: editForm.concentration_ppm ? Number(editForm.concentration_ppm) : null,
        temps_trempage_minutes: editForm.temps_trempage_minutes ? Number(editForm.temps_trempage_minutes) : null,
        commentaire_action_corrective: editForm.commentaire_action_corrective || null,
      });
      toast('Suivi chlore mis à jour avec succès', 'success');
      navigate('/stock/suivi-chlore');
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/suivi-chlore')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/stock/suivi-chlore')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
            <h1 className="text-2xl font-bold text-gray-900">Modifier le suivi chlore</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-8 h-8 rounded-full bg-royal-100 flex items-center justify-center"><User className="w-4 h-4 text-royal-700" /></div>
            <div><p className="font-medium text-gray-900">{user?.full_name || '—'}</p><p className="text-xs text-gray-400">Agent</p></div>
          </div>
        </div>
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-royal-700" /> Informations générales</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'opération *</label>
                  <Input type="date" value={editForm.date_operation} onChange={(e) => updateEditField('date_operation', e.target.value)} className={errors.date_operation ? 'border-red-400' : ''} />
                  {errors.date_operation && <p className="text-red-500 text-xs mt-1">{errors.date_operation}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produit (lot)</label>
                  <SearchableSelect options={lotOptions} value={editForm.id_lot} onValueChange={(v) => updateEditField('id_lot', v)} placeholder="Sélectionner un lot..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client / Compagnie</label>
                  <SearchableSelect options={clientOptions} value={editForm.id_partenaire} onValueChange={(v) => updateEditField('id_partenaire', v)} placeholder="Sélectionner un client..." />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-600" /> Résultats chlore</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Concentration (ppm)</label><Input type="number" step="0.1" value={editForm.concentration_ppm} onChange={(e) => updateEditField('concentration_ppm', e.target.value)} placeholder="50-100 ppm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Temps trempage (min)</label><Input type="number" value={editForm.temps_trempage_minutes} onChange={(e) => updateEditField('temps_trempage_minutes', e.target.value)} placeholder="5 min" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire / Action corrective</label>
                  <textarea value={editForm.commentaire_action_corrective} onChange={(e) => updateEditField('commentaire_action_corrective', e.target.value)} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="En cas de non-conformité..." />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/stock/suivi-chlore')} className="border-gray-300">Annuler</Button>
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/suivi-chlore')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau suivi chlore</h1>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">{lignes.length} ligne(s)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-8 h-8 rounded-full bg-royal-100 flex items-center justify-center"><User className="w-4 h-4 text-royal-700" /></div>
          <div><p className="font-medium text-gray-900">{user?.full_name || '—'}</p><p className="text-xs text-gray-400">Agent</p></div>
        </div>
      </div>

      <form onSubmit={handleBulkSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-royal-700" /> Informations communes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'opération *</label>
                <Input type="date" value={dateOperation} onChange={(e) => { setDateOperation(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.date_operation; return n; }); }} className={errors.date_operation ? 'border-red-400' : ''} />
                {errors.date_operation && <p className="text-red-500 text-xs mt-1">{errors.date_operation}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client / Compagnie (optionnel)</label>
                <SearchableSelect options={clientOptions} value={idPartenaire} onValueChange={setIdPartenaire} placeholder="Sélectionner un client..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-600" /> Lignes de suivi chlore</CardTitle></CardHeader>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Lot (produit) *</label>
                    <SearchableSelect options={lotOptions} value={ligne.id_lot} onValueChange={(v) => updateLigne(ligne.key, 'id_lot', v)} placeholder="Lot..." />
                  </div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Concentration (ppm)</label><Input type="number" step="0.1" value={ligne.concentration_ppm} onChange={(e) => updateLigne(ligne.key, 'concentration_ppm', e.target.value)} placeholder="50-100" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Temps trempage (min)</label><Input type="number" value={ligne.temps_trempage_minutes} onChange={(e) => updateLigne(ligne.key, 'temps_trempage_minutes', e.target.value)} placeholder="5" /></div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Commentaire / Action corrective</label>
                    <Input value={ligne.commentaire_action_corrective} onChange={(e) => updateLigne(ligne.key, 'commentaire_action_corrective', e.target.value)} placeholder="En cas de non-conformité..." />
                  </div>
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
          <Button type="button" variant="outline" onClick={() => navigate('/stock/suivi-chlore')} className="border-gray-300">Annuler</Button>
          <Button type="submit" disabled={saving} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer {lignes.filter(l => l.id_lot).length > 0 ? `(${lignes.filter(l => l.id_lot).length})` : ''}
          </Button>
        </div>
      </form>
    </div>
  );
}
