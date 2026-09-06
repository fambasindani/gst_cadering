import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useToast } from '../hooks/useToast';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { Modal } from '../components/ui/modal';
import { bonCommandeService } from '../services/bon-commande';
import { BonCommandePDF } from '../components/pdf/BonCommandePDF';
import { ReceptionPDF } from '../components/pdf/ReceptionPDF';
import type { BonCommande, ReceptionListe } from '../types/bon-commande';
import {
  ArrowLeft, Pencil, FileText, Truck, CheckCircle, Printer, PackagePlus, Package, Eye,
  Building2, MapPin, Calendar, DollarSign, User, Clock, Loader2, Ban, Hash,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const statutConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Clock }> = {
  BROUILLON: { label: 'Brouillon', color: 'text-amber-700', bg: 'bg-amber-500', border: 'border-amber-200', icon: Clock },
  'EN ATTENTE': { label: 'En attente', color: 'text-orange-700', bg: 'bg-orange-500', border: 'border-orange-200', icon: Clock },
  'REÇU PARTIELLEMENT': { label: 'Reçu partiellement', color: 'text-purple-700', bg: 'bg-purple-500', border: 'border-purple-200', icon: Truck },
  REÇU: { label: 'Reçu', color: 'text-emerald-700', bg: 'bg-emerald-500', border: 'border-emerald-200', icon: CheckCircle },
  CLOTURE: { label: 'Clôturé', color: 'text-red-700', bg: 'bg-red-500', border: 'border-red-200', icon: Clock },
};

function ReceptionStatutBadge({ statuts }: { statuts: string[] }) {
  const unique = [...new Set(statuts.filter(Boolean))];
  if (unique.length === 0) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">-</span>;
  if (unique.includes('REJETÉ')) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejeté</span>;
  if (unique.includes('EN ATTENTE')) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">En attente</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Validé</span>;
}

export function BonCommandeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();

  const [bon, setBon] = useState<BonCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [receptionDetail, setReceptionDetail] = useState<ReceptionListe | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

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
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!bon) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Bon non trouvé</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/bon-commande')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  const sc = statutConfig[bon.statut] || { label: bon.statut, color: 'text-gray-700', bg: 'bg-gray-400', border: 'border-gray-200', icon: Clock };
  const StatutIcon = sc.icon;
  const lignes = bon.lignes || [];
  const total = lignes.reduce((s, l) => s + l.quantite_commandee * l.prix_unitaire_ht, 0);
  const totalRecu = lignes.reduce(
    (s, l) => s + (l.montant_recu !== undefined ? l.montant_recu : l.quantite_recue * l.prix_unitaire_ht),
    0,
  );
  const deviseCode = bon.devise?.code || lignes[0]?.devise?.code || '';

  const qteCommandee = lignes.reduce((s, l) => s + l.quantite_commandee, 0);
  const qteRecue = lignes.reduce((s, l) => s + (l.quantite_recue || 0), 0);
  const pctRecu = qteCommandee > 0 ? Math.round((qteRecue / qteCommandee) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Banner header */}
      <div className={cn('relative overflow-hidden rounded-2xl border', sc.border)}>
        <div className={cn('absolute inset-0 opacity-10', sc.bg)} />
        <div className="relative px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/bon-commande')}
                className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-white/50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{bon.numero_commande}</h1>
                  <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm', sc.bg)}>
                    <StatutIcon className="w-3.5 h-3.5" />
                    {sc.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  {bon.utilisateur ? ` — par ${bon.utilisateur.prenom} ${bon.utilisateur.nom}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PDFDownloadLink document={<BonCommandePDF bon={bon} />} fileName={`BC-${bon.numero_commande}.pdf`}>
                {({ loading: pdfLoading }) => (
                  <Button variant="outline" className="bg-white/80 border-gray-200 text-gray-700 hover:bg-white" disabled={pdfLoading}>
                    <Printer className="w-4 h-4 mr-2" />
                    {pdfLoading ? 'Préparation...' : 'PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
              {bon.statut === 'BROUILLON' || isAdmin ? (
                <Button onClick={() => navigate(`/bon-commande/${id}/modifier`)}
                  className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
                  <Pencil className="w-4 h-4 mr-2" /> Modifier
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat icon={<DollarSign className="w-4 h-4" />} label="Montant" value={formatCurrency(total, deviseCode)} color="bg-royal-50 text-royal-700" />
        <MiniStat icon={<Package className="w-4 h-4" />} label="Reçu" value={formatCurrency(totalRecu, deviseCode)} color="bg-emerald-50 text-emerald-700" />
        <MiniStat icon={<Hash className="w-4 h-4" />} label="Lignes" value={`${lignes.length} produit(s)`} color="bg-gray-100 text-gray-700" />
        <MiniStat icon={<Truck className="w-4 h-4" />} label="Avancement" value={`${pctRecu}%`} color={pctRecu >= 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Infos en 2 colonnes sans card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard icon={<Building2 className="w-4 h-4 text-royal-600" />} label="Fournisseur" value={bon.partenaire?.nom || '-'} />
            <InfoCard icon={<MapPin className="w-4 h-4 text-gray-500" />} label="Destination" value={bon.magasin_destination?.nom || '-'} />
            <InfoCard icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Date commande" value={bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR') : '-'} />
            <InfoCard icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Livraison prévue" value={bon.date_livraison_prevue ? new Date(bon.date_livraison_prevue).toLocaleDateString('fr-FR') : '-'} />
            <InfoCard icon={<DollarSign className="w-4 h-4 text-gray-500" />} label="Devise" value={bon.devise?.code || '-'} />
            <InfoCard icon={<User className="w-4 h-4 text-gray-500" />} label="Créé par" value={bon.utilisateur ? `${bon.utilisateur.prenom} ${bon.utilisateur.nom}` : '-'} />
            {bon.valide_par && (
              <InfoCard icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} label="Validé par" value={`${bon.valide_par.prenom} ${bon.valide_par.nom}`} />
            )}
            {bon.date_validation && (
              <InfoCard icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Date validation" value={new Date(bon.date_validation).toLocaleDateString('fr-FR')} />
            )}
          </div>
          {bon.commentaire && (
            <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">Commentaire</p>
              <p className="text-sm text-gray-700">{bon.commentaire}</p>
            </div>
          )}

          {/* Tableau */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-royal-600" />
                Produits commandés ({lignes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600 w-8">#</TableHead>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Qté cmd.</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Reçue</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Prix unit.</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Prix reçu</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((l, i) => {
                      const prixBon = Number(l.prix_unitaire_ht) || 0;
                      const montantLigne = l.quantite_commandee * prixBon;
                      const recu = l.quantite_recue || 0;
                      const estComplet = recu >= l.quantite_commandee;
                      const estPartiel = recu > 0 && recu < l.quantite_commandee;
                      const prixRecu = recu > 0 && l.montant_recu !== undefined ? l.montant_recu / recu : null;
                      const variation = prixRecu !== null && Math.abs(prixRecu - prixBon) > 0.005;

                      return (
                        <TableRow key={l.id} className={cn('hover:bg-royal-50/30', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                          <TableCell className="text-xs text-gray-400 font-mono">{i + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 text-sm">{l.produit?.nom || '-'}</div>
                            <div className="text-xs text-gray-400 font-mono">{l.produit?.code_article || ''}</div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm text-gray-900">{l.quantite_commandee}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn('font-mono text-sm font-medium', estComplet ? 'text-emerald-700' : estPartiel ? 'text-amber-700' : 'text-gray-400')}>
                              {recu || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">{formatCurrency(prixBon, deviseCode)}</TableCell>
                          <TableCell className="text-right">
                            {prixRecu !== null ? (
                              <span className={cn('font-mono text-sm font-medium', variation ? (prixRecu > prixBon ? 'text-emerald-700' : 'text-amber-700') : 'text-gray-700')}>
                                {formatCurrency(prixRecu, deviseCode)}
                              </span>
                            ) : <span className="text-gray-300 text-sm">-</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-sm font-semibold text-gray-900">{formatCurrency(montantLigne, deviseCode)}</span>
                            {estPartiel && (
                              <div className="text-[10px] text-amber-600 text-right mt-0.5">
                                Reçu : {recu}/{l.quantite_commandee}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total commandé</p>
                    <p className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(total, deviseCode)}</p>
                  </div>
                  {totalRecu > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total reçu</p>
                      <p className="text-lg font-bold text-royal-700 font-mono">{formatCurrency(totalRecu, deviseCode)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Réceptions */}
          {bon.receptions_liste && bon.receptions_liste.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-royal-600" />
                  Réceptions ({bon.receptions_liste.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Référence</TableHead>
                        <TableHead className="font-semibold text-gray-600">Date</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                        <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bon.receptions_liste.map((rec, i) => (
                        <TableRow key={rec.reference_reception} className={cn('hover:bg-royal-50/30', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                          <TableCell className="font-mono text-sm font-medium text-royal-700">{rec.reference_reception}</TableCell>
                          <TableCell className="text-sm text-gray-700">
                            {rec.date ? new Date(rec.date).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-900">{rec.quantite}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">
                            {formatCurrency(rec.montant, deviseCode)}
                          </TableCell>
                          <TableCell className="text-center">
                            <ReceptionStatutBadge statuts={rec.lignes.map((l) => l.statut)} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setReceptionDetail(rec)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-royal-700 hover:bg-royal-50" title="Détails">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <PDFDownloadLink document={<ReceptionPDF bon={bon} reception={rec} />} fileName={`Reception-${rec.reference_reception}.pdf`}>
                                {({ loading: pdfLoading }) => (
                                  <Button variant="ghost" size="sm" disabled={pdfLoading}
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-royal-700 hover:bg-royal-50" title="Imprimer">
                                    {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
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
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className={cn('rounded-2xl border p-5 space-y-4', sc.border)}>
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-xl text-white', sc.bg)}>
                <StatutIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut actuel</p>
                <p className={cn('text-sm font-bold', sc.color)}>{sc.label}</p>
              </div>
            </div>

            <div className="w-full h-px bg-gray-200" />

            {bon.statut === 'BROUILLON' || bon.statut === 'EN ATTENTE' || bon.statut === 'REÇU PARTIELLEMENT' || (isAdmin && bon.statut === 'REÇU') ? (
              <Button onClick={() => navigate(`/reception/${id}`)}
                className="w-full bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
                <PackagePlus className="w-4 h-4 mr-2" />
                {bon.statut === 'REÇU' ? 'Corriger la réception' : 'Réceptionner'}
              </Button>
            ) : null}

            {bon.statut === 'BROUILLON' ? (
              <Button onClick={() => navigate(`/bon-commande/${id}/modifier`)}
                variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                <Pencil className="w-4 h-4 mr-2" /> Modifier
              </Button>
            ) : null}

            {bon.statut === 'REÇU PARTIELLEMENT' ? (
              <Button onClick={() => setConfirmCancel(true)}
                disabled={actionLoading} variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                Clôturer
              </Button>
            ) : null}

            <PDFDownloadLink document={<BonCommandePDF bon={bon} />} fileName={`BC-${bon.numero_commande}.pdf`} className="block">
              {({ loading: pdfLoading }) => (
                <Button variant="outline" disabled={pdfLoading} className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                  <Printer className="w-4 h-4 mr-2" />
                  {pdfLoading ? 'Préparation...' : 'Imprimer le bon'}
                </Button>
              )}
            </PDFDownloadLink>

            <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              onClick={() => navigate('/bon-commande')}>
              <FileText className="w-4 h-4 mr-2" /> Tous les bons
            </Button>
          </div>

          {/* Résumé dans la sidebar */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <SidebarInfo icon={<Building2 className="w-4 h-4 text-royal-600" />} label="Fournisseur" value={bon.partenaire?.nom || '-'} />
              <SidebarInfo icon={<MapPin className="w-4 h-4 text-gray-500" />} label="Destination" value={bon.magasin_destination?.nom || '-'} />
              <SidebarInfo icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Date" value={bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR') : '-'} />
              <SidebarInfo icon={<DollarSign className="w-4 h-4 text-gray-500" />} label="Montant" value={formatCurrency(total, deviseCode)} bold />
              {totalRecu > 0 && (
                <SidebarInfo icon={<Truck className="w-4 h-4 text-emerald-600" />} label="Reçu" value={formatCurrency(totalRecu, deviseCode)} bold />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal détail réception */}
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
                    <th className="px-4 py-2.5 font-semibold text-center">Statut</th>
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
                      <td className="px-4 py-2.5 text-center"><ReceptionStatutBadge statuts={[l.statut]} /></td>
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
            <div className="flex justify-end">
              <PDFDownloadLink document={<ReceptionPDF bon={bon} reception={receptionDetail} />} fileName={`Reception-${receptionDetail.reference_reception}.pdf`}>
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

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
      <div className={cn('p-2 rounded-lg', color)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
      <span className="flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function SidebarInfo({ icon, label, value, bold }: { icon: React.ReactNode; label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={cn('text-sm', bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900')}>{value}</span>
    </div>
  );
}
