import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useToast } from '../hooks/useToast';
import { bonCommandeService, type ReceptionItem } from '../services/bon-commande';
import type { BonCommande } from '../types/bon-commande';
import {
  ArrowLeft, PackagePlus, Loader2, FileText, Building2, MapPin, Calendar, Package,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ReceptionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bon, setBon] = useState<BonCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [zones, setZones] = useState<{ id: number; nom: string; type_zone: string }[]>([]);
  const [emplacementsByZone, setEmplacementsByZone] = useState<Record<number, { id: number; nom: string }[]>>({});
  const [receptionData, setReceptionData] = useState<Record<number, {
    quantite_recue: string;
    numero_lot: string;
    date_peremption: string;
    id_zone: string;
    id_emplacement: string;
    prix_achat_ht_unitaire: string;
  }>>({});

  const fetchBon = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await bonCommandeService.get(Number(id));
      if (res.success) {
        setBon(res.data);
        initReceptionData(res.data);
      } else {
        toast('Bon de commande introuvable', 'error');
      }
    } catch {
      toast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBon(); }, [fetchBon]);

  const generateNumeroLot = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    return `LOT-${yy}${mm}-${rand}`;
  };

  const initReceptionData = (b: BonCommande) => {
    const initial: Record<number, typeof receptionData[number]> = {};
    for (const l of b.lignes || []) {
      const reste = l.quantite_commandee - l.quantite_recue;
      if (reste > 0) {
        initial[l.id] = {
          quantite_recue: String(reste),
          numero_lot: generateNumeroLot(),
          date_peremption: '',
          id_zone: '',
          id_emplacement: '',
          prix_achat_ht_unitaire: String(l.prix_unitaire_ht),
        };
      }
    }
    setReceptionData(initial);
    setZones([]);
    setEmplacementsByZone({});
    if (b.id_ville_destination) {
      bonCommandeService.getZonesByVille(b.id_ville_destination).then((r) => {
        if (r.success) setZones(r.data);
      });
    }
  };

  const handleZoneChange = (zoneId: string) => {
    if (!zoneId) return;
    const zid = Number(zoneId);
    if (emplacementsByZone[zid]) return;
    bonCommandeService.getEmplacementsByZone(zid).then((r) => {
      if (r.success) setEmplacementsByZone(prev => ({ ...prev, [zid]: r.data }));
    });
  };

  const updateLigne = (ligneId: number, field: string, value: string) => {
    setReceptionData(prev => ({ ...prev, [ligneId]: { ...prev[ligneId], [field]: value } }));
    const errKey = `${ligneId}.${field}`;
    if (fieldErrors[errKey]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[errKey]; return n; });
    }
  };

  const parseErrors = (errors: Record<string, string[]>) => {
    const ligneIds = Object.keys(receptionData);
    const parsed: Record<string, string> = {};
    for (const [key, msgs] of Object.entries(errors)) {
      const parts = key.split('.');
      if (parts.length >= 3 && parts[0] === 'receptions') {
        const idx = parseInt(parts[1], 10);
        const field = parts.slice(2).join('.');
        const ligneId = ligneIds[idx];
        if (ligneId) {
          parsed[`${ligneId}.${field}`] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
      }
    }
    return parsed;
  };

  const handleSubmit = async () => {
    if (!bon || !id) return;
    setSaving(true);
    setFieldErrors({});
    try {
      const receptions: ReceptionItem[] = Object.entries(receptionData).map(([ligneId, data]) => ({
        id_ligne_commande: Number(ligneId),
        quantite_recue: Number(data.quantite_recue) || 0,
        numero_lot: data.numero_lot,
        date_peremption: data.date_peremption,
        id_zone: Number(data.id_zone),
        id_emplacement: data.id_emplacement ? Number(data.id_emplacement) : null,
        prix_achat_ht_unitaire: Number(data.prix_achat_ht_unitaire) || undefined,
      }));
      const res = await bonCommandeService.receive(Number(id), { receptions });
      if (res.success) {
        toast('Réception effectuée avec succès', 'success');
        navigate('/reception');
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        setFieldErrors(parseErrors(error.errors));
        const details = Object.values(error.errors).flat().join(', ');
        toast(`Erreur de validation : ${details}`, 'error');
      } else {
        toast(error.message || 'Erreur lors de la réception', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const errorClass = (error?: string) => cn(error && 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  if (!bon) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Bon non trouvé</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/reception')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  const statutNonReceptionnable = bon.statut !== 'ENVOYÉ' && bon.statut !== 'REÇU PARTIELLEMENT';
  const lignes = bon.lignes || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/reception')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Réception - {bon.numero_commande}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bon de commande du {bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR') : '-'}</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Building2 className="w-4 h-4" />
              <span className="font-medium text-gray-700">Partenaire :</span>
              <span className="text-gray-900">{bon.partenaire?.nom || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="font-medium text-gray-700">Destination :</span>
              <span className="text-gray-900">{bon.ville_destination?.nom || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="font-medium text-gray-700">Livraison :</span>
              <span className="text-gray-900">
                {bon.date_livraison_prevue ? new Date(bon.date_livraison_prevue).toLocaleDateString('fr-FR') : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {statutNonReceptionnable ? (
        <Card className="border-0 shadow-sm bg-amber-50 border border-amber-200">
          <CardContent className="p-6 text-center">
            <p className="text-amber-800 font-medium">Ce bon de commande n'est pas en attente de réception</p>
            <p className="text-amber-600 text-sm mt-1">Statut actuel : {bon.statut}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/reception')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {lignes.map((l) => {
            const reste = l.quantite_commandee - l.quantite_recue;
            if (reste <= 0) return null;
            const rd = receptionData[l.id];
            if (!rd) return null;
            return (
              <Card key={l.id} className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      {l.produit?.nom || 'Produit'}
                    </CardTitle>
                    <span className="text-xs text-gray-500">
                      Commandé: <strong>{l.quantite_commandee}</strong> |
                      Reçu: <strong>{l.quantite_recue}</strong> |
                      Restant: <strong className="text-emerald-700">{reste}</strong>
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Qté à recevoir *</Label>
                      <Input type="number" min="1" max={reste} value={rd.quantite_recue}
                        onChange={(e) => updateLigne(l.id, 'quantite_recue', e.target.value)}
                        className={errorClass(fieldErrors[`${l.id}.quantite_recue`])} />
                      {fieldErrors[`${l.id}.quantite_recue`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.quantite_recue`]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Prix unit. HT</Label>
                      <Input type="number" step="0.01" min="0" value={rd.prix_achat_ht_unitaire}
                        onChange={(e) => updateLigne(l.id, 'prix_achat_ht_unitaire', e.target.value)}
                        className={errorClass(fieldErrors[`${l.id}.prix_achat_ht_unitaire`])} />
                      {fieldErrors[`${l.id}.prix_achat_ht_unitaire`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.prix_achat_ht_unitaire`]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">N° de lot *</Label>
                      <Input value={rd.numero_lot}
                        onChange={(e) => updateLigne(l.id, 'numero_lot', e.target.value)}
                        placeholder="Ex: LOT-001"
                        className={errorClass(fieldErrors[`${l.id}.numero_lot`])} />
                      {fieldErrors[`${l.id}.numero_lot`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.numero_lot`]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Date péremption *</Label>
                      <Input type="date" value={rd.date_peremption}
                        onChange={(e) => updateLigne(l.id, 'date_peremption', e.target.value)}
                        className={errorClass(fieldErrors[`${l.id}.date_peremption`])} />
                      {fieldErrors[`${l.id}.date_peremption`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.date_peremption`]}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Zone *</Label>
                      <Select value={rd.id_zone} onValueChange={(v) => {
                        updateLigne(l.id, 'id_zone', v);
                        handleZoneChange(v);
                      }}>
                        <SelectTrigger className={errorClass(fieldErrors[`${l.id}.id_zone`])}>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem key={z.id} value={String(z.id)}>{z.nom} ({z.type_zone})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors[`${l.id}.id_zone`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.id_zone`]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Emplacement</Label>
                      <Select value={rd.id_emplacement} onValueChange={(v) => updateLigne(l.id, 'id_emplacement', v)}>
                        <SelectTrigger className={errorClass(fieldErrors[`${l.id}.id_emplacement`])}>
                          <SelectValue placeholder="Optionnel" />
                        </SelectTrigger>
                        <SelectContent>
                          {(emplacementsByZone[Number(rd.id_zone)] || []).map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors[`${l.id}.id_emplacement`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.id_emplacement`]}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => navigate('/reception')}
              className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving}
              className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Réception en cours...</>
              ) : (
                <><PackagePlus className="w-4 h-4 mr-2" /> Valider la réception</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
