import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { Modal } from '../components/ui/modal';
import { bonCommandeService } from '../services/bon-commande';
import { BonCommandePDF } from '../components/pdf/BonCommandePDF';
import { ReceptionPDF } from '../components/pdf/ReceptionPDF';
import type { BonCommande, ReceptionListe } from '../types/bon-commande';
import {
  ArrowLeft, Pencil, FileText, Truck, CheckCircle, XCircle, Ban, Printer, PackagePlus, Package, Eye,
  Building2, MapPin, Calendar, DollarSign, MessageSquare, User, Clock, Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const statutConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  ENVOYÉ: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Truck },
  'REÇU PARTIELLEMENT': { label: 'Reçu partiellement', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
  REÇU: { label: 'Reçu', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  CLOTURE: { label: 'Clôturé', color: 'bg-red-100 text-red-800 border-red-200', icon: Ban },
};

export function BonCommandeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [bon, setBon] = useState<BonCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmValidate, setConfirmValidate] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [receptionDetail, setReceptionDetail] = useState<ReceptionListe | null>(null);



  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await bonCommandeService.get(Number(id));
      if (res.success) setBon(res.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async (action: string, fn: () => Promise<{ success: boolean; message: string }>, successMsg: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fn();
      if (res.success) {
        toast(successMsg, 'success');
        fetchData();
        return true;
      }
      return false;
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || `Erreur lors de ${action}`, 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-5 bg-gray-200 rounded w-3/4" />)}</CardContent></Card>
          </div>
          <div className="space-y-6">
            <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-5 bg-gray-200 rounded" />)}</CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!bon) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Bon non trouvé</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/bon-commande')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
      </div>
    );
  }

  const sc = statutConfig[bon.statut] || { label: bon.statut, color: 'bg-gray-100 text-gray-600', icon: Clock };
  const StatutIcon = sc.icon;
  const lignes = bon.lignes || [];
  const total = lignes.reduce((s, l) => s + l.quantite_commandee * l.prix_unitaire_ht, 0);
  const totalRecu = lignes.reduce(
    (s, l) => s + (l.montant_recu !== undefined ? l.montant_recu : l.quantite_recue * l.prix_unitaire_ht),
    0,
  );
  const deviseCode = bon.devise?.code || lignes[0]?.devise?.code || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/bon-commande')} className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{bon.numero_commande}</h1>
              <Badge className={cn('text-xs font-medium', sc.color)}>
                <StatutIcon className="w-3 h-3 mr-1" />
                {sc.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Créé le {bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR') : '-'}
              {bon.utilisateur ? ` par ${bon.utilisateur.prenom} ${bon.utilisateur.nom}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PDFDownloadLink document={<BonCommandePDF bon={bon} />} fileName={`BC-${bon.numero_commande}.pdf`}>
            {({ loading: pdfLoading }) => (
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50" disabled={pdfLoading}>
                <Printer className="w-4 h-4 mr-2" />
                {pdfLoading ? 'Préparation...' : 'Imprimer'}
              </Button>
            )}
          </PDFDownloadLink>
          {bon.statut === 'BROUILLON' || isAdmin ? (
            <Button onClick={() => navigate(`/bon-commande/${id}/modifier`)} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
              <Pencil className="w-4 h-4 mr-2" /> Modifier
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-royal-600" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <DetailItem icon={<Building2 className="w-4 h-4" />} label="Fournisseur" value={bon.partenaire?.nom || '-'} />
                <DetailItem icon={<MapPin className="w-4 h-4" />} label="Destination" value={bon.magasin_destination?.nom || '-'} />
                <DetailItem icon={<Calendar className="w-4 h-4" />} label="Date commande" value={bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR') : '-'} />
                <DetailItem icon={<Calendar className="w-4 h-4" />} label="Livraison prévue" value={bon.date_livraison_prevue ? new Date(bon.date_livraison_prevue).toLocaleDateString('fr-FR') : '-'} />
                <DetailItem icon={<DollarSign className="w-4 h-4" />} label="Devise" value={bon.devise?.code || '-'} />
                <DetailItem icon={<User className="w-4 h-4" />} label="Créé par" value={bon.utilisateur ? `${bon.utilisateur.prenom} ${bon.utilisateur.nom}` : '-'} />
                {bon.valide_par ? (
                  <DetailItem icon={<CheckCircle className="w-4 h-4" />} label="Validé par" value={`${bon.valide_par.prenom} ${bon.valide_par.nom}`} />
                ) : null}
                {bon.date_validation ? (
                  <DetailItem icon={<Calendar className="w-4 h-4" />} label="Date validation" value={new Date(bon.date_validation).toLocaleDateString('fr-FR')} />
                ) : null}
                {bon.commentaire ? (
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-500 flex items-center gap-1.5 mb-1"><MessageSquare className="w-4 h-4" /> Commentaire</dt>
                    <dd className="text-sm text-gray-900">{bon.commentaire}</dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-royal-600" />
                Lignes de commande
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Qté cmd.</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Qté reçue</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Prix unit.</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Prix reçu</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((l, i) => {
                      const prixRecu = l.quantite_recue > 0 && l.montant_recu !== undefined
                        ? l.montant_recu / l.quantite_recue
                        : null;
                      const prixBon = Number(l.prix_unitaire_ht) || 0;
                      const variation = prixRecu !== null && Math.abs(prixRecu - prixBon) > 0.005;
                      return (
                        <>
                        <TableRow key={l.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell>
                            <div className="text-sm font-medium text-gray-900">{l.produit?.nom || '-'}</div>
                            <div className="text-xs text-gray-500 font-mono">{l.produit?.code_article || ''}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-900">{l.quantite_commandee}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">{l.quantite_recue || '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">
                            {formatCurrency(prixBon, l.devise?.code || deviseCode)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {prixRecu !== null ? (
                              <>
                                <div className={cn('font-medium', variation ? (prixRecu > prixBon ? 'text-emerald-700' : 'text-amber-700') : 'text-gray-700')}>
                                  {formatCurrency(prixRecu, l.devise?.code || deviseCode)}
                                </div>
                                {variation ? (
                                  <div className="text-[11px] font-normal text-amber-600">
                                    {prixRecu > prixBon ? '+' : ''}{formatCurrency(prixRecu - prixBon, l.devise?.code || deviseCode)} vs bon
                                  </div>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                            <div>{formatCurrency(l.quantite_commandee * prixBon, l.devise?.code || deviseCode)}</div>
                            {l.quantite_recue > 0 && l.quantite_recue < l.quantite_commandee ? (
                              <div className="text-xs text-amber-700 font-normal">
                                Reçu : {l.quantite_recue} sur {l.quantite_commandee}
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                        {l.receptions && l.receptions.length > 0 ? (
                          <TableRow key={`${l.id}-rec`} className="bg-royal-50/40">
                            <TableCell colSpan={6} className="px-4 py-2">
                              <div className="text-xs font-semibold text-royal-700 mb-1">
                                Détail des réceptions ({l.receptions.length})
                              </div>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs font-semibold text-gray-500">Date</TableHead>
                                      <TableHead className="text-xs font-semibold text-gray-500">Lot</TableHead>
                                      <TableHead className="text-xs font-semibold text-gray-500 text-right">Quantité</TableHead>
                                      <TableHead className="text-xs font-semibold text-gray-500 text-right">Prix unit.</TableHead>
                                      <TableHead className="text-xs font-semibold text-gray-500 text-right">Montant</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {l.receptions.map((rec) => (
                                      <TableRow key={rec.id}>
                                        <TableCell className="text-xs text-gray-600">
                                          {rec.date ? new Date(rec.date).toLocaleDateString('fr-FR') : '-'}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600 font-mono">{rec.numero_lot}</TableCell>
                                        <TableCell className="text-xs text-gray-600 font-mono text-right">{rec.quantite}</TableCell>
                                        <TableCell className="text-xs text-gray-600 font-mono text-right">
                                          {formatCurrency(rec.prix_unitaire, l.devise?.code || deviseCode)}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-800 font-mono text-right">
                                          {formatCurrency(rec.montant, l.devise?.code || deviseCode)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t border-gray-100 p-4 flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total HT</div>
                  <div className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(total, deviseCode)}</div>
                  {bon.statut === 'REÇU PARTIELLEMENT' || bon.statut === 'REÇU' ? (
                    <div className="text-sm text-gray-500 mt-1">Reçu (prix réception): {formatCurrency(totalRecu, deviseCode)}</div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {bon.receptions_liste && bon.receptions_liste.length > 0 ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-royal-600" />
                  Réceptions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Référence</TableHead>
                        <TableHead className="font-semibold text-gray-600">Date</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Quantité</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bon.receptions_liste.map((rec, i) => (
                        <TableRow key={rec.reference_reception} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="text-sm font-mono text-royal-700 font-medium">{rec.reference_reception}</TableCell>
                          <TableCell className="text-sm text-gray-700">
                            {rec.date ? new Date(rec.date).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-900">{rec.quantite}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                            {formatCurrency(rec.montant, deviseCode)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReceptionDetail(rec)}
                                className="border-gray-200 text-gray-600 hover:bg-royal-50 hover:text-royal-700"
                                title={`Détails de ${rec.reference_reception}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <PDFDownloadLink
                                document={<ReceptionPDF bon={bon} reception={rec} />}
                                fileName={`Reception-${rec.reference_reception}.pdf`}
                              >
                                {({ loading: pdfLoading }) => (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pdfLoading}
                                    className="border-gray-200 text-gray-600 hover:bg-royal-50 hover:text-royal-700"
                                    title={`Imprimer ${rec.reference_reception}`}
                                  >
                                    {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                                  </Button>
                                )}
                              </PDFDownloadLink>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {bon.statut === 'BROUILLON' ? (
                <>
                  <Button onClick={() => setConfirmValidate(true)}
                    disabled={actionLoading} className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white">
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Valider
                  </Button>
                  <Button onClick={() => setConfirmReject(true)}
                    disabled={actionLoading} className="w-full justify-start bg-red-600 hover:bg-red-700 text-white">
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Rejeter
                  </Button>
                  <Button onClick={() => navigate(`/bon-commande/${id}/modifier`)}
                    variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Pencil className="w-4 h-4 mr-2" /> Modifier
                  </Button>
                </>
              ) : null}

              {bon.statut === 'ENVOYÉ' || bon.statut === 'REÇU PARTIELLEMENT' || (isAdmin && bon.statut === 'REÇU') ? (
                <Button onClick={() => navigate(`/reception/${id}`)}
                  disabled={actionLoading} className="w-full justify-start bg-royal-600 hover:bg-royal-700 text-white">
                  <PackagePlus className="w-4 h-4 mr-2" />
                  {bon.statut === 'REÇU' ? 'Corriger la réception' : 'Réceptionner'}
                </Button>
              ) : null}

              {bon.statut === 'ENVOYÉ' || bon.statut === 'REÇU PARTIELLEMENT' ? (
                <Button onClick={() => setConfirmCancel(true)}
                  disabled={actionLoading} variant="outline" className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50">
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                  Clôturer
                </Button>
              ) : null}

              <PDFDownloadLink document={<BonCommandePDF bon={bon} />} fileName={`BC-${bon.numero_commande}.pdf`}>
                {({ loading: pdfLoading }) => (
                  <Button variant="outline" disabled={pdfLoading} className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Printer className="w-4 h-4 mr-2" />
                    {pdfLoading ? 'Préparation...' : 'Imprimer / PDF'}
                  </Button>
                )}
              </PDFDownloadLink>

              <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => navigate('/bon-commande')}>
                <FileText className="w-4 h-4 mr-2" /> Tous les bons
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={!!receptionDetail}
        onClose={() => setReceptionDetail(null)}
        title={`Réception ${receptionDetail?.reference_reception || ''}`}
        description={receptionDetail?.date ? `Date : ${new Date(receptionDetail.date).toLocaleDateString('fr-FR')}` : undefined}
        maxWidth="2xl"
      >
        {receptionDetail ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 overflow-hidden">
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
                  {receptionDetail.lignes.map((l) => (
                    <tr key={l.id} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{l.produit || '-'}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{l.numero_lot || '-'}</td>
                      <td className="px-4 py-2.5 font-mono text-right text-gray-900">{l.quantite}</td>
                      <td className="px-4 py-2.5 font-mono text-right text-gray-700">{formatCurrency(l.prix_unitaire, deviseCode)}</td>
                      <td className="px-4 py-2.5 font-mono text-right font-medium text-gray-900">{formatCurrency(l.montant, deviseCode)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-semibold text-gray-600">Total</td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-medium text-gray-600">{receptionDetail.quantite}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-royal-700">
                      {formatCurrency(receptionDetail.montant, deviseCode)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <PDFDownloadLink
                document={<ReceptionPDF bon={bon} reception={receptionDetail} />}
                fileName={`Reception-${receptionDetail.reference_reception}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Button disabled={pdfLoading} className="bg-royal-700 hover:bg-royal-800 text-white rounded-xl shadow-sm">
                    {pdfLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                    {pdfLoading ? 'Préparation...' : 'Imprimer le bon de réception'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmModal
        isOpen={confirmValidate}
        onClose={() => setConfirmValidate(false)}
        onConfirm={async () => {
          setConfirmValidate(false);
          const ok = await doAction('validation', () => bonCommandeService.validate(Number(id)), 'Bon validé avec succès');
          if (ok) navigate(`/reception/${id}`);
        }}
        title="Valider le bon"
        message={`Confirmer la validation du bon "${bon?.numero_commande || ''}" ?`}
        variant="warning"
        confirmLabel="Valider"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={confirmReject}
        onClose={() => setConfirmReject(false)}
        onConfirm={async () => {
          setConfirmReject(false);
          await doAction('rejet', () => bonCommandeService.reject(Number(id)), 'Bon rejeté');
        }}
        title="Rejeter le bon"
        message={`Confirmer le rejet du bon "${bon?.numero_commande || ''}" ?`}
        variant="danger"
        confirmLabel="Rejeter"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={async () => {
          setConfirmCancel(false);
          await doAction('clôture', () => bonCommandeService.cloturer(Number(id)), 'Bon clôturé');
        }}
        title="Clôturer le bon"
        message={`Confirmer la clôture du bon "${bon?.numero_commande || ''}" ?`}
        variant="danger"
        confirmLabel="Clôturer"
        loading={actionLoading}
      />
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-gray-500 flex items-center gap-1.5 mb-1">{icon} {label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
