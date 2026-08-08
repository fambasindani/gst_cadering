import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { bonCommandeService, type ReceptionItem, type CorrectionItem } from '../services/bon-commande';
import type { BonCommande } from '../types/bon-commande';
import { ReceptionPDF, type ReceptionPDFData } from '../components/pdf/ReceptionPDF';
import {
  ArrowLeft, PackagePlus, Loader2, FileText, Building2, MapPin, Calendar, Package, RefreshCw, CheckCircle, Printer,
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
  const [lastReception, setLastReception] = useState<{ bon: BonCommande; reception: ReceptionPDFData } | null>(null);
  const [receptionData, setReceptionData] = useState<Record<number, {
    quantite_recue: string;
    quantite_recue_correction: string;
    numero_lot: string;
    date_peremption: string;
    prix_achat_ht_unitaire: string;
    date_reception: string;
    reference_document: string;
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

  const generateReference = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    return `REC-${yy}${mm}-${rand}`;
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
          date_reception: new Date().toISOString().split('T')[0],
          reference_document: b.numero_commande || '',
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
    const lignes = bon?.lignes || [];
    const parsed: Record<string, string> = {};

    const mapByIndex = (group: 'receptions' | 'corrections', order: number[]) => {
      for (const [key, msgs] of Object.entries(errors)) {
        const parts = key.split('.');
        if (parts.length >= 3 && parts[0] === group) {
          const idx = parseInt(parts[1], 10);
          const field = parts.slice(2).join('.');
          const ligneId = order[idx];
          if (ligneId) {
            parsed[`${ligneId}.${field}`] = Array.isArray(msgs) ? msgs[0] : String(msgs);
          }
        }
      }
    };

    // L'ordre des tableaux `receptions`/`corrections` envoyés au backend :
    // seules les lignes avec quantité > 0 (réceptions) ou dont la correction diffère
    // sont poussées. On reconstruit ces ordres pour aligner les index d'erreur.
    const receptionsOrder: number[] = [];
    const correctionsOrder: number[] = [];
    for (const [ligneId, data] of Object.entries(receptionData)) {
      const id = Number(ligneId);
      if ((Number(data.quantite_recue) || 0) > 0) {
        receptionsOrder.push(id);
      }
      const l = lignes.find((x) => x.id === id);
      if (l && Number(data.quantite_recue_correction) !== l.quantite_recue) {
        correctionsOrder.push(id);
      }
    }

    mapByIndex('receptions', receptionsOrder);
    mapByIndex('corrections', correctionsOrder);
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
            date_reception: data.date_reception,
            reference_document: data.reference_document,
          });
        }
        if (l && Number(data.quantite_recue_correction) !== l.quantite_recue) {
          corrections.push({
            id_ligne_commande: Number(ligneId),
            nouvelle_quantite_recue: Number(data.quantite_recue_correction) || 0,
          });
        }
      }

      const res = await bonCommandeService.receive(Number(id), {
        receptions,
        corrections,
      });
      if (res.success) {
        const statut = res.data?.statut;
        const referenceReception = (res.data as unknown as { reference_reception?: string })?.reference_reception;
        const msg = corrections.length > 0
          ? (statut === 'REÇU' ? 'Réception corrigée avec succès (complète)' : 'Réception corrigée avec succès')
          : (statut === 'REÇU' ? 'Réception complète effectuée avec succès' : 'Réception partielle effectuée avec succès');
        toast(msg, 'success');

        const updatedBon = { ...bon, statut, quantite_recue: undefined } as BonCommande;
        const recLignes = receptions.map((r) => {
          const l = lignes.find((x) => x.id === r.id_ligne_commande);
          const prix = Number(r.prix_achat_ht_unitaire) || Number(l?.prix_unitaire_ht) || 0;
          return {
            id: r.id_ligne_commande,
            date: r.date_reception ?? new Date().toISOString().split('T')[0],
            id_ligne: r.id_ligne_commande,
            produit: l?.produit?.nom || '',
            code_article: l?.produit?.code_article || '',
            numero_lot: r.numero_lot || '',
            quantite: Number(r.quantite_recue) || 0,
            prix_unitaire: prix,
            montant: (Number(r.quantite_recue) || 0) * prix,
            statut: '',
          };
        });

        setLastReception({
          bon: updatedBon,
          reception: {
            reference_reception: referenceReception || 'REC-' + Date.now(),
            date: recLignes[0]?.date ?? new Date().toISOString().split('T')[0],
            quantite: recLignes.reduce((s, l) => s + l.quantite, 0),
            montant: recLignes.reduce((s, l) => s + l.montant, 0),
            lignes: recLignes,
          },
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {lastReception ? (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Réception enregistrée</h2>
              <p className="text-sm text-gray-500 mt-1">
                {bon.numero_commande} — {bon.statut === 'REÇU' ? 'réception complète' : 'réception partielle'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Référence de réception : <span className="font-mono font-medium text-emerald-700">{lastReception.reception.reference_reception}</span>
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2.5 font-semibold">Produit</th>
                    <th className="px-4 py-2.5 font-semibold">Lot</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Quantité</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Prix unit.</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {lastReception.reception.lignes.map((l) => (
                    <tr key={l.id} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{l.produit || '-'}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{l.numero_lot || '-'}</td>
                      <td className="px-4 py-2.5 font-mono text-right text-gray-900">{l.quantite}</td>
                      <td className="px-4 py-2.5 font-mono text-right text-gray-700">{formatCurrency(l.prix_unitaire)}</td>
                      <td className="px-4 py-2.5 font-mono text-right font-medium text-gray-900">{formatCurrency(l.montant)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-semibold text-gray-600">Total</td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-medium text-gray-600">
                      {lastReception.reception.quantite}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-emerald-700">
                      {formatCurrency(lastReception.reception.montant)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <PDFDownloadLink
                document={<ReceptionPDF bon={lastReception.bon} reception={lastReception.reception} />}
                fileName={`Reception-${lastReception.reception.reference_reception}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Button disabled={pdfLoading} className="w-full sm:w-auto h-11 px-6 bg-royal-700 hover:bg-royal-800 text-white rounded-xl shadow-sm">
                    {pdfLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                    {pdfLoading ? 'Préparation...' : 'Imprimer le bon de réception'}
                  </Button>
                )}
              </PDFDownloadLink>
              <Button
                variant="outline"
                onClick={() => {
                  if (bon.statut === 'REÇU') {
                    navigate('/bon-commande');
                  } else {
                    navigate('/reception');
                  }
                }}
                className="w-full sm:w-auto h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                Terminer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Date de réception *</Label>
                      <Input type="date" value={rd.date_reception}
                        onChange={(e) => updateLigne(l.id, 'date_reception', e.target.value)}
                        className={errorClass(fieldErrors[`${l.id}.date_reception`])} />
                      {fieldErrors[`${l.id}.date_reception`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.date_reception`]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Référence bon</Label>
                      <div className="flex items-center gap-2">
                        <Input value={rd.reference_document}
                          onChange={(e) => updateLigne(l.id, 'reference_document', e.target.value)}
                          placeholder="N° de référence (automatique ou saisi)"
                          className={errorClass(fieldErrors[`${l.id}.reference_document`])} />
                        <Button type="button" variant="outline"
                          onClick={() => updateLigne(l.id, 'reference_document', generateReference())}
                          className="h-10 px-3 border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0" title="Générer une référence">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      {fieldErrors[`${l.id}.reference_document`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`${l.id}.reference_document`]}</p>
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
        </>
      )}
    </div>
  );
}
