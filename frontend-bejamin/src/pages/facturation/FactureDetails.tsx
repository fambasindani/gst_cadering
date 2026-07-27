import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { useToast } from '../../hooks/useToast';
import { factureService } from '../../services/facture';
import type { Facture } from '../../types/facturation';
import { formatCurrency } from '../../lib/format';
import { FacturePDF } from '../../components/pdf/FacturePDF';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  ArrowLeft, Loader2, Download, FileText, Building, DollarSign, Package,
  Send, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

function formatDate(d: string | null | undefined): string {
  if (!d) return '-';
  const p = d.split('T')[0] || d;
  const [y, m, day] = p.split('-');
  return `${day}/${m}/${y}`;
}

const statutVariants: Record<string, 'warning' | 'info' | 'success' | 'destructive'> = {
  BROUILLON: 'warning',
  EMISE: 'info',
  PAYEE: 'success',
  ANNULEE: 'destructive',
};

const statutLabels: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EMISE: 'Émise',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
};

export function FactureDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ key: string; label: string; variant: 'danger' | 'warning' | 'info' } | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await factureService.get(Number(id));
      if (res.success) setFacture(res.data);
    } catch {
      toast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async () => {
    if (!facture || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.key === 'emettre') {
        await factureService.emettre(facture.id);
        toast('Facture émise', 'success');
      } else if (confirmAction.key === 'payer') {
        await factureService.marquerPayee(facture.id);
        toast('Facture marquée comme payée', 'success');
      } else if (confirmAction.key === 'annuler') {
        await factureService.annuler(facture.id);
        toast('Facture annulée', 'success');
      } else if (confirmAction.key === 'generer-sortie') {
        await factureService.genererSortieStock(facture.id);
        toast('Sortie(s) de stock générée(s) avec succès', 'success');
      }
      setConfirmAction(null);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Erreur";
      toast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const lignes = facture?.lignes || [];
  const paiements = facture?.paiements || [];
  const avoirs = facture?.avoirs || [];
  const sorties = facture?.mouvements || [];
  const hasSorties = sorties.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="text-center py-20 text-gray-500">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>Facture non trouvée</p>
        <Button variant="outline" onClick={() => navigate('/facturation/factures')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/facturation/factures')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Facture {facture.numero_facture}</h1>
            <Badge variant={statutVariants[facture.statut] || 'secondary'} className="text-xs">
              {statutLabels[facture.statut] || facture.statut}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Créée le {formatDate(facture.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          {facture.statut === 'BROUILLON' && (
            <>
              <Button type="button" onClick={() => setConfirmAction({ key: 'emettre', label: 'Émettre cette facture ?', variant: 'info' })}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Send className="w-4 h-4 mr-1.5" /> Émettre
              </Button>
              <Button variant="outline" onClick={() => navigate(`/facturation/factures/${facture.id}/modifier`)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <FileText className="w-4 h-4 mr-1.5" /> Modifier
              </Button>
            </>
          )}
          {facture.statut === 'EMISE' && (
            <>
              <Button type="button" onClick={() => setConfirmAction({ key: 'payer', label: 'Marquer cette facture comme payée ?', variant: 'info' })}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                <CheckCircle className="w-4 h-4 mr-1.5" /> Marquer payée
              </Button>
              <Button type="button" onClick={() => setConfirmAction({ key: 'generer-sortie', label: 'Générer la sortie stock à partir des lignes de cette facture ?', variant: 'info' })}
                disabled={hasSorties}
                className={cn(hasSorties ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700', 'text-white shadow-sm')}>
                <Package className="w-4 h-4 mr-1.5" /> {hasSorties ? `${sorties.length} sortie(s) déjà` : 'Sortie stock'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmAction({ key: 'annuler', label: 'Annuler cette facture ?', variant: 'danger' })}
                className="border-red-300 text-red-700 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-1.5" /> Annuler
              </Button>
            </>
          )}
          {facture.statut === 'PAYEE' && (
            <Button type="button" onClick={() => setConfirmAction({ key: 'generer-sortie', label: 'Générer la sortie stock à partir des lignes de cette facture ?', variant: 'info' })}
              disabled={hasSorties}
              className={cn(hasSorties ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700', 'text-white shadow-sm')}>
              <Package className="w-4 h-4 mr-1.5" /> {hasSorties ? `${sorties.length} sortie(s) déjà` : 'Sortie stock'}
            </Button>
          )}
          <PDFDownloadLink document={<FacturePDF facture={facture} />} fileName={`FAC-${facture.numero_facture}.pdf`}>
            {({ loading: pdfLoading }) => (
              <Button type="button" variant="outline" disabled={pdfLoading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-1.5" /> {pdfLoading ? '...' : 'PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FileText className="w-5 h-5 text-royal-700" />
                <h2 className="text-base font-bold text-gray-800">Informations</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-gray-500">Numéro</span><p className="font-mono font-medium text-gray-900">{facture.numero_facture}</p></div>
                <div><span className="text-sm text-gray-500">Date</span><p className="font-medium text-gray-900">{formatDate(facture.date_facture)}</p></div>
                <div><span className="text-sm text-gray-500">Échéance</span><p className="font-medium text-gray-900">{formatDate(facture.date_echeance)}</p></div>
                <div><span className="text-sm text-gray-500">Devise</span><p className="font-medium text-gray-900">{facture.devise?.code || '-'}</p></div>
                {facture.bon_commande && (
                  <div className="col-span-2"><span className="text-sm text-gray-500">Bon de commande</span><p className="font-medium text-gray-900">{facture.bon_commande.numero_commande}</p></div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
            <CardContent className="p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
                <Package className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-gray-800">Lignes de la facture</h2>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">P.U. HT</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Remise</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-6">Aucune ligne</TableCell></TableRow>
                    ) : lignes.map((l, i) => {
                      const totalLigne = l.quantite * l.prix_unitaire_ht * (1 - (l.remise || 0) / 100);
                      return (
                        <TableRow key={l.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <TableCell className="font-medium text-gray-900">{l.produit?.nom || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{l.lot?.numero_lot || '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{l.quantite}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(l.prix_unitaire_ht, facture.devise?.code)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{l.remise || 0}%</TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(totalLigne, facture.devise?.code)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {sorties.length > 0 && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
                  <Package className="w-5 h-5 text-orange-700" />
                  <h2 className="text-base font-bold text-gray-800">Sorties stock liées</h2>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                        <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorties.map((s, i) => (
                        <TableRow key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <TableCell className="text-sm text-gray-900">{s.lot?.numero_lot || '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-red-600">{s.quantite}</TableCell>
                          <TableCell>
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              s.statut_validation === 'VALIDÉ' ? 'bg-emerald-100 text-emerald-800' :
                              s.statut_validation === 'EN ATTENTE' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            )}>
                              {s.statut_validation === 'VALIDÉ' ? 'Validé' :
                               s.statut_validation === 'EN ATTENTE' ? 'En attente' : 'Rejeté'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {paiements.length > 0 && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
                  <DollarSign className="w-5 h-5 text-blue-700" />
                  <h2 className="text-base font-bold text-gray-800">Paiements</h2>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Date</TableHead>
                        <TableHead className="font-semibold text-gray-600">Mode</TableHead>
                        <TableHead className="font-semibold text-gray-600">Référence</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paiements.map((p, i) => (
                        <TableRow key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <TableCell className="text-sm">{formatDate(p.date_paiement)}</TableCell>
                          <TableCell className="text-sm">{p.mode_paiement}</TableCell>
                          <TableCell className="text-sm">{p.reference || '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-green-600">{formatCurrency(p.montant, facture.devise?.code)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {avoirs.length > 0 && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-red-400 to-red-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
                  <FileText className="w-5 h-5 text-red-700" />
                  <h2 className="text-base font-bold text-gray-800">Avoirs</h2>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Numéro</TableHead>
                        <TableHead className="font-semibold text-gray-600">Date</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {avoirs.map((a, i) => (
                        <TableRow key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <TableCell className="font-mono text-sm font-medium text-royal-700">
                            <button onClick={() => navigate(`/facturation/avoirs/${a.id}`)} className="hover:underline">{a.numero_avoir}</button>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(a.date_avoir)}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-red-600">{formatCurrency(a.montant_ht, facture.devise?.code)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Building className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-gray-800">Client</h2>
              </div>
              <div>
                <div className="text-sm text-gray-500">Raison sociale</div>
                <div className="font-medium text-gray-900">{facture.client?.nom || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Ville</div>
                <div className="font-medium text-gray-900">{facture.ville?.nom || '-'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <DollarSign className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-gray-800">Montant</h2>
              </div>
              <div>
                <div className="text-sm text-gray-500">Montant HT</div>
                <div className="text-xl font-semibold text-gray-900">{formatCurrency(facture.montant_ht, facture.devise?.code)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Montant TTC</div>
                <div className="text-xl font-semibold text-gray-900">{formatCurrency(facture.montant_ttc, facture.devise?.code)}</div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="text-sm text-gray-500">Total payé</div>
                <div className="text-lg font-semibold text-green-600">{formatCurrency(facture.total_paye ?? 0, facture.devise?.code)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Solde</div>
                <div className={cn('text-lg font-semibold', (facture.solde || 0) > 0 ? 'text-red-600' : 'text-green-600')}>
                  {formatCurrency(facture.solde ?? facture.montant_ttc, facture.devise?.code)}
                </div>
              </div>
            </CardContent>
          </Card>

          {facture.commentaire && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-gray-400 to-gray-500" />
              <CardContent className="p-6">
                <div className="text-sm text-gray-500 mb-1">Commentaire</div>
                <p className="text-sm text-gray-700">{facture.commentaire}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title="Confirmation"
        message={confirmAction?.label || ''}
        variant={confirmAction?.variant || 'info'}
        confirmLabel="Confirmer"
        loading={actionLoading}
      />
    </div>
  );
}
