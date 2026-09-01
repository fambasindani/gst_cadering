import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { controleLivraisonService } from '../services/controle-livraison';
import { lotService } from '../services/lot';
import { partenaireService } from '../services/partenaire';
import { ArrowLeft, Save, Loader2, Truck, User, Plus, Trash2, Thermometer } from 'lucide-react';
import type { Lot } from '../types/lot';

interface Ligne {
  key: string;
  id_lot: string;
  code_prestation_classe: string;
  code_couleur: string;
  final_holding_temperature: string;
  reception_client_temperature: string;
  commentaires: string;
}

const emptyLigne = (): Ligne => ({
  key: crypto.randomUUID(),
  id_lot: '', code_prestation_classe: '', code_couleur: '',
  final_holding_temperature: '', reception_client_temperature: '', commentaires: '',
});

export function ControleLivraisonForm() {
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
  const [cieNumeroVol, setCieNumeroVol] = useState('');
  const [camionPropre, setCamionPropre] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [nomSuperviseur, setNomSuperviseur] = useState('');
  const [nomResponsable, setNomResponsable] = useState('');
  const [remarqueGenerale, setRemarqueGenerale] = useState('');
  const [lignes, setLignes] = useState<Ligne[]>([emptyLigne()]);

  const [editForm, setEditForm] = useState({
    date_operation: '', id_lot: '', id_partenaire: '', cie_numero_vol: '', camion_propre: '',
    heure_debut: '', heure_fin: '', code_prestation_classe: '', code_couleur: '',
    final_holding_temperature: '', reception_client_temperature: '', commentaires: '',
    nom_signature_superviseur: '', nom_signature_responsable_client: '', remarque_generale: '',
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
        const editResult = await controleLivraisonService.get(Number(id));
        if (editResult.success && editResult.data) {
          const c = editResult.data;
          setEditForm({
            date_operation: c.date_operation || '', id_lot: c.id_lot ? String(c.id_lot) : '',
            id_partenaire: c.id_partenaire ? String(c.id_partenaire) : '',
            cie_numero_vol: c.cie_numero_vol || '',
            camion_propre: c.camion_propre != null ? (c.camion_propre ? 'oui' : 'non') : '',
            heure_debut: c.heure_debut || '', heure_fin: c.heure_fin || '',
            code_prestation_classe: c.code_prestation_classe || '', code_couleur: c.code_couleur || '',
            final_holding_temperature: c.final_holding_temperature != null ? String(c.final_holding_temperature) : '',
            reception_client_temperature: c.reception_client_temperature != null ? String(c.reception_client_temperature) : '',
            commentaires: c.commentaires || '',
            nom_signature_superviseur: c.nom_signature_superviseur || '',
            nom_signature_responsable_client: c.nom_signature_responsable_client || '',
            remarque_generale: c.remarque_generale || '',
          });
        }
      }
    } catch {
      toast('Erreur lors du chargement des données', 'error');
      if (isEdit) navigate('/stock/controle-livraison');
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

    const validLignes = lignes.filter(l => l.id_lot || l.code_prestation_classe || l.code_couleur);
    if (validLignes.length === 0) { setErrors({ lignes: 'Ajoutez au moins une ligne avec un lot' }); return; }

    setSaving(true);
    try {
      await controleLivraisonService.createBulk({
        date_operation: dateOperation,
        id_partenaire: idPartenaire ? Number(idPartenaire) : null,
        cie_numero_vol: cieNumeroVol || null,
        camion_propre: camionPropre === 'oui' ? true : camionPropre === 'non' ? false : null,
        heure_debut: heureDebut || null,
        heure_fin: heureFin || null,
        nom_signature_superviseur: nomSuperviseur || null,
        nom_signature_responsable_client: nomResponsable || null,
        remarque_generale: remarqueGenerale || null,
        lignes: validLignes.map(l => ({
          id_lot: l.id_lot ? Number(l.id_lot) : null,
          code_prestation_classe: l.code_prestation_classe || null,
          code_couleur: l.code_couleur || null,
          final_holding_temperature: l.final_holding_temperature ? Number(l.final_holding_temperature) : null,
          reception_client_temperature: l.reception_client_temperature ? Number(l.reception_client_temperature) : null,
          commentaires: l.commentaires || null,
        })),
      });
      toast(`${validLignes.length} contrôle(s) livraison créé(s) avec succès`, 'success');
      navigate('/stock/controle-livraison');
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
      await controleLivraisonService.update(Number(id), {
        date_operation: editForm.date_operation,
        id_lot: editForm.id_lot ? Number(editForm.id_lot) : null,
        id_partenaire: editForm.id_partenaire ? Number(editForm.id_partenaire) : null,
        cie_numero_vol: editForm.cie_numero_vol || null,
        camion_propre: editForm.camion_propre === 'oui' ? true : editForm.camion_propre === 'non' ? false : null,
        heure_debut: editForm.heure_debut || null,
        heure_fin: editForm.heure_fin || null,
        code_prestation_classe: editForm.code_prestation_classe || null,
        code_couleur: editForm.code_couleur || null,
        final_holding_temperature: editForm.final_holding_temperature ? Number(editForm.final_holding_temperature) : null,
        reception_client_temperature: editForm.reception_client_temperature ? Number(editForm.reception_client_temperature) : null,
        commentaires: editForm.commentaires || null,
        nom_signature_superviseur: editForm.nom_signature_superviseur || null,
        nom_signature_responsable_client: editForm.nom_signature_responsable_client || null,
        remarque_generale: editForm.remarque_generale || null,
      });
      toast('Contrôle livraison mis à jour avec succès', 'success');
      navigate('/stock/controle-livraison');
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/controle-livraison')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/stock/controle-livraison')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
            <h1 className="text-2xl font-bold text-gray-900">Modifier le contrôle livraison</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-8 h-8 rounded-full bg-royal-100 flex items-center justify-center"><User className="w-4 h-4 text-royal-700" /></div>
            <div><p className="font-medium text-gray-900">{user?.full_name || '—'}</p><p className="text-xs text-gray-400">Agent</p></div>
          </div>
        </div>
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-royal-700" /> Informations générales</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date d'opération *</label><Input type="date" value={editForm.date_operation} onChange={(e) => updateEditField('date_operation', e.target.value)} className={errors.date_operation ? 'border-red-400' : ''} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">CIE / N° Vol</label><Input value={editForm.cie_numero_vol} onChange={(e) => updateEditField('cie_numero_vol', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Client</label><SearchableSelect options={clientOptions} value={editForm.id_partenaire} onValueChange={(v) => updateEditField('id_partenaire', v)} placeholder="Client..." /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Produit (lot)</label><SearchableSelect options={lotOptions} value={editForm.id_lot} onValueChange={(v) => updateEditField('id_lot', v)} placeholder="Lot..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Code prestation</label><Input value={editForm.code_prestation_classe} onChange={(e) => updateEditField('code_prestation_classe', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Code couleur</label><Input value={editForm.code_couleur} onChange={(e) => updateEditField('code_couleur', e.target.value)} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Camion propre</label>
                  <select value={editForm.camion_propre} onChange={(e) => updateEditField('camion_propre', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Non renseigné</option><option value="oui">Oui</option><option value="non">Non</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Thermometer className="w-5 h-5 text-amber-600" /> Températures & Horaires</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label><Input type="time" value={editForm.heure_debut} onChange={(e) => updateEditField('heure_debut', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label><Input type="time" value={editForm.heure_fin} onChange={(e) => updateEditField('heure_fin', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Final holding T°</label><Input type="number" step="0.1" value={editForm.final_holding_temperature} onChange={(e) => updateEditField('final_holding_temperature', e.target.value)} placeholder="+3°C max 5°C" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Réception client T°</label><Input type="number" step="0.1" value={editForm.reception_client_temperature} onChange={(e) => updateEditField('reception_client_temperature', e.target.value)} placeholder="Max +8°C" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label><textarea value={editForm.commentaires} onChange={(e) => updateEditField('commentaires', e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-royal-700" /> Signatures</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Superviseur</label><Input value={editForm.nom_signature_superviseur} onChange={(e) => updateEditField('nom_signature_superviseur', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Responsable client</label><Input value={editForm.nom_signature_responsable_client} onChange={(e) => updateEditField('nom_signature_responsable_client', e.target.value)} /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Remarque générale</label><textarea value={editForm.remarque_generale} onChange={(e) => updateEditField('remarque_generale', e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/stock/controle-livraison')} className="border-gray-300">Annuler</Button>
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/controle-livraison')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau contrôle livraison</h1>
          <span className="inline-flex items-center rounded-full bg-royal-100 px-3 py-1 text-sm font-medium text-royal-800">{lignes.length} ligne(s)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-8 h-8 rounded-full bg-royal-100 flex items-center justify-center"><User className="w-4 h-4 text-royal-700" /></div>
          <div><p className="font-medium text-gray-900">{user?.full_name || '—'}</p><p className="text-xs text-gray-400">Agent</p></div>
        </div>
      </div>

      <form onSubmit={handleBulkSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-royal-700" /> Informations communes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'opération *</label>
                <Input type="date" value={dateOperation} onChange={(e) => { setDateOperation(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.date_operation; return n; }); }} className={errors.date_operation ? 'border-red-400' : ''} />
                {errors.date_operation && <p className="text-red-500 text-xs mt-1">{errors.date_operation}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client / Compagnie</label>
                <SearchableSelect options={clientOptions} value={idPartenaire} onValueChange={setIdPartenaire} placeholder="Sélectionner un client..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIE / N° Vol</label>
                <Input value={cieNumeroVol} onChange={(e) => setCieNumeroVol(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Camion propre</label>
                <select value={camionPropre} onChange={(e) => setCamionPropre(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Non renseigné</option><option value="oui">Oui</option><option value="non">Non</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label><Input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label><Input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Superviseur</label><Input value={nomSuperviseur} onChange={(e) => setNomSuperviseur(e.target.value)} placeholder="Nom et signature" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Responsable client</label><Input value={nomResponsable} onChange={(e) => setNomResponsable(e.target.value)} placeholder="Nom et signature" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Remarque générale</label><Input value={remarqueGenerale} onChange={(e) => setRemarqueGenerale(e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Thermometer className="w-5 h-5 text-amber-600" /> Lignes de contrôle</CardTitle></CardHeader>
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
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Lot (produit) *</label>
                    <SearchableSelect options={lotOptions} value={ligne.id_lot} onValueChange={(v) => updateLigne(ligne.key, 'id_lot', v)} placeholder="Lot..." />
                  </div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Code prestation</label><Input value={ligne.code_prestation_classe} onChange={(e) => updateLigne(ligne.key, 'code_prestation_classe', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Code couleur</label><Input value={ligne.code_couleur} onChange={(e) => updateLigne(ligne.key, 'code_couleur', e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">T° final holding</label><Input type="number" step="0.1" value={ligne.final_holding_temperature} onChange={(e) => updateLigne(ligne.key, 'final_holding_temperature', e.target.value)} placeholder="+3°C" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">T° réception client</label><Input type="number" step="0.1" value={ligne.reception_client_temperature} onChange={(e) => updateLigne(ligne.key, 'reception_client_temperature', e.target.value)} placeholder="+8°C" /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Commentaires</label><Input value={ligne.commentaires} onChange={(e) => updateLigne(ligne.key, 'commentaires', e.target.value)} /></div>
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
          <Button type="button" variant="outline" onClick={() => navigate('/stock/controle-livraison')} className="border-gray-300">Annuler</Button>
          <Button type="submit" disabled={saving} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer {lignes.filter(l => l.id_lot).length > 0 ? `(${lignes.filter(l => l.id_lot).length})` : ''}
          </Button>
        </div>
      </form>
    </div>
  );
}
