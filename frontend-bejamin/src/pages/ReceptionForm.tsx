import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { bonCommandeService, type ReceptionItem, type CorrectionItem } from '../services/bon-commande';
import type { BonCommande } from '../types/bon-commande';
import {
  ArrowLeft, PackagePlus, Loader2, FileText, Building2, MapPin, Calendar, Package,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

export function ReceptionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [bon, setBon] = useState<BonCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [receptionData, setReceptionData] = useState<Record<number, {
    quantite_recue: string;
    quantite_recue_correction: string;
    numero_lot: string;
    date_peremption: string;
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
      if (reste > 0 || (isAdmin && l.quantite_recue > 0)) {
        initial[l.id] = {
          quantite_recue: String(reste > 0 ? reste : 0),
          quantite_recue_correction: String(l.quantite_recue),
          numero_lot: generateNumeroLot(),
          date_peremption: '',
          prix_achat_ht_unitaire: String(l.prix_unitaire_ht),
        };
      }
    }
    setReceptionData(initial);
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
      const lignes = bon.lignes || [];
      const receptions: ReceptionItem[] = [];
      const corrections: CorrectionItem[] = [];

      for (const [ligneId, data] of Object.entries(receptionData)) {
        const l = lignes.find((x) => x.id === Number(ligneId));
        const qty = Number(data.quantite_recue) || 0;
        if (qty > 0) {
          receptions.push({
            id_ligne_commande: Number(ligneId),
            quantite_recue: qty,
            numero_lot: data.numero_lot,
            date_peremption: data.date_peremption,
            prix_achat_ht_unitaire: Number(data.prix_achat_ht_unitaire) || undefined,
          });
        }
        if (l && Number(data.quantite_recue_correction) !== l.quantite_recue) {
          corrections.push({
            id_ligne_commande: Number(ligneId),
            nouvelle_quantite_recue: Number(data.quantite_recue_correction) || 0,
          });
        }
      }

      const res = await bonCommandeService.receive(Number(id), { receptions, corrections });
      if (res.success) {
        const statut = res.data?.statut;
        const msg = corrections.length > 0
          ? (statut === 'REÇU' ? 'Réception corrigée avec succès (complète)' : 'Réception corrigée avec succès')
          : (statut === 'REÇU' ? 'Réception complète effectuée avec succès' : 'Réception partielle effectuée avec succès');
        toast(msg, 'success');
        if (statut === 'REÇU') {
          navigate('/bon-commande');
        } else {
          navigate('/reception');
        }
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

  const statutNonReceptionnable = bon.statut !== 'ENVOYÉ' && bon.statut !== 'REÇU PARTIELLEMENT' && !(isAdmin && bon.statut === 'REÇU');
  const lignes = bon.lignes || [];

  const totalQuantite = Object.values(receptionData).reduce((sum, rd) => sum + (Number(rd.quantite_recue) || 0), 0);
  const totalPrix = Object.values(receptionData).reduce(
    (sum, rd) => sum + ((Number(rd.quantite_recue) || 0) * (Number(rd.prix_achat_ht_unitaire) || 0)),
    0,
  );

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
              <span className="text-gray-900">{bon.magasin_destination?.nom || '-'}</span>
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
            const rd = receptionData[l.id];
            if (!rd) return null;
            const recueCorrige = Number(rd.quantite_recue_correction) || 0;
            const reste = l.quantite_commandee - recueCorrige;
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
                      Reçu: <strong>{recueCorrige}</strong> |
                      Restant: <strong className="text-emerald-700">{Math.max(0, reste)}</strong>
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Qté à recevoir *</Label>
                      <Input type="number" min="1" max={Math.max(0, reste)} value={rd.quantite_recue}
                        disabled={reste <= 0}
                        onChange={(e) => updateLigne(l.id, 'quantite_recue', e.target.value)}
                        className={errorClass(fieldErrors[`${l.id}.quantite_recue`])} />
                      {fieldErrors[`${l.id}.quantite_recue`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.quantite_recue`]}</p>
                      )}
                    </div>
                    {isAdmin ? (
                      <div className="space-y-1">
                        <Label className="text-xs text-amber-700">Qté déjà reçue (correction)</Label>
                        <Input type="number" min="0" max={l.quantite_commandee} value={rd.quantite_recue_correction}
                          onChange={(e) => updateLigne(l.id, 'quantite_recue_correction', e.target.value)}
                          className={cn('border-amber-300 focus:border-amber-500 focus:ring-amber-500', errorClass(fieldErrors[`${l.id}.nouvelle_quantite_recue`]))} />
                      </div>
                    ) : null}
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
                </CardContent>
              </Card>
            );
          })}

          {totalQuantite > 0 ? (
            <Card className="border border-gray-200 shadow-sm bg-emerald-50/50">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Total à réceptionner : <strong className="text-emerald-700">{totalQuantite}</strong> unité{totalQuantite > 1 ? 's' : ''}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Total HT : <strong className="text-lg text-emerald-700">{formatCurrency(totalPrix)}</strong>
                </div>
              </CardContent>
            </Card>
          ) : null}

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
