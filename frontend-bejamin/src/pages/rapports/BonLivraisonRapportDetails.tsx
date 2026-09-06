import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { bonCommandeService } from '../../services/bon-commande';
import { tauxConversionService } from '../../services/taux-conversion';
import { BonCommandePDF } from '../../components/pdf/BonCommandePDF';
import { ReceptionPDF } from '../../components/pdf/ReceptionPDF';
import type { BonCommande, ReceptionListe } from '../../types/bon-commande';
import {
  ArrowLeft, Printer, Package, Eye, Building2, MapPin, Calendar,
  DollarSign, User, Clock, FileText, Truck,
  Hash, CheckCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { Modal } from '../../components/ui/modal';

const statutConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  BROUILLON: { label: 'Brouillon', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  'EN ATTENTE': { label: 'En attente', color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock },
  'REÇU PARTIELLEMENT': { label: 'Reçu partiellement', color: 'text-purple-700', bg: 'bg-purple-100', icon: Truck },
  REÇU: { label: 'Reçu', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle },
  CLOTURE: { label: 'Clôturé', color: 'text-red-700', bg: 'bg-red-100', icon: Clock },
};

function ReceptionStatutBadge({ statuts }: { statuts: string[] }) {
  const unique = [...new Set(statuts.filter(Boolean))];
  if (unique.length === 0) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">-</span>;
  if (unique.includes('REJETÉ')) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejeté</span>;
  if (unique.includes('EN ATTENTE')) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">En attente</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Validé</span>;
}

export function BonLivraisonRapportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bon, setBon] = useState<BonCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [receptionDetail, setReceptionDetail] = useState<ReceptionListe | null>(null);
  const [tauxCdf, setTauxCdf] = useState<number | null>(null);

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

  useEffect(() => {
    tauxConversionService.getActuel()
      .then((tres) => { if (tres.success && tres.data) setTauxCdf(tres.data.taux); })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
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
        <Button variant="outline" className="mt-4" onClick={() => navigate('/rapports/bon-livraison')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au rapport
        </Button>
      </div>
    );
  }

  const sc = statutConfig[bon.statut] || { label: bon.statut, color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock };
  const StatutIcon = sc.icon;
  const lignes = bon.lignes || [];
  const nbLignes = lignes.length;

  const totalRecu = lignes.reduce(
    (s, l) => s + (l.montant_recu !== undefined ? l.montant_recu : l.quantite_recue * l.prix_unitaire_ht),
    0,
  );
  const deviseCode = bon.devise?.code || lignes[0]?.devise?.code || 'USD';

  const qteRecue = lignes.reduce((s, l) => s + (l.quantite_recue || 0), 0);
  const qteCommandee = lignes.reduce((s, l) => s + l.quantite_commandee, 0);
  const pctRecu = qteCommandee > 0 ? Math.round((qteRecue / qteCommandee) * 100) : 0;

  const lignesCompletes = lignes.filter(l => (l.quantite_recue || 0) >= l.quantite_commandee).length;
  const nbReceptions = bon.receptions_liste?.length || 0;

  const fmtMontant = (v: number) => formatCurrency(v, deviseCode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rapports/bon-livraison')} className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Bon de livraison</h1>
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold', sc.bg, sc.color)}>
                <StatutIcon className="w-4 h-4" />
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 font-mono">{bon.numero_commande}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PDFDownloadLink document={<BonCommandePDF bon={bon} />} fileName={`BL-${bon.numero_commande}.pdf`}>
            {({ loading: pdfLoading }) => (
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50" disabled={pdfLoading}>
                <Printer className="w-4 h-4 mr-2" />
                {pdfLoading ? 'Génération...' : 'Imprimer PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          label="Montant reçu"
          value={fmtMontant(totalRecu)}
          sub={tauxCdf != null ? formatCurrency(totalRecu * tauxCdf, 'CDF') : undefined}
        />
        <SummaryCard
          icon={<Truck className="w-5 h-5" />}
          iconBg="bg-purple-100"
          iconColor="text-purple-700"
          label="Réceptions"
          value={String(nbReceptions)}
          sub={`${lignesCompletes}/${nbLignes} ligne(s) complète(s)`}
        />
        <SummaryCard
          icon={<Hash className="w-5 h-5" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          label="Produits"
          value={String(nbLignes)}
          sub={`${qteRecue} unité(s) reçue(s)`}
        />
        <SummaryCard
          icon={<Calendar className="w-5 h-5" />}
          iconBg="bg-royal-100"
          iconColor="text-royal-700"
          label="Date réception"
          value={bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR') : '-'}
          sub={bon.date_livraison_prevue ? `Prévue : ${new Date(bon.date_livraison_prevue).toLocaleDateString('fr-FR')}` : undefined}
        />
      </div>

      {/* Barre de progression */}
      {qteCommandee > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Avancement de la livraison</span>
              <span className={cn('text-sm font-bold', pctRecu >= 100 ? 'text-emerald-700' : pctRecu > 0 ? 'text-amber-700' : 'text-gray-500')}>
                {pctRecu}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', pctRecu >= 100 ? 'bg-emerald-500' : 'bg-amber-400')}
                style={{ width: `${Math.min(pctRecu, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-500">
              <span>{qteRecue} / {qteCommandee} unités reçues</span>
              <span>{lignesCompletes} / {nbLignes} lignes complètes</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Infos + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-royal-600" />
                Informations du bon de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoRow icon={<Building2 className="w-4 h-4 text-royal-600" />} label="Fournisseur" value={bon.partenaire?.nom || '-'} />
                <InfoRow icon={<MapPin className="w-4 h-4 text-gray-500" />} label="Magasin destination" value={bon.magasin_destination?.nom || '-'} />
                <InfoRow icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Date de commande" value={bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR') : '-'} />
                <InfoRow icon={<DollarSign className="w-4 h-4 text-gray-500" />} label="Devise" value={deviseCode} />
                <InfoRow icon={<User className="w-4 h-4 text-gray-500" />} label="Créé par" value={bon.utilisateur ? `${bon.utilisateur.prenom} ${bon.utilisateur.nom}` : '-'} />
                {bon.valide_par && (
                  <InfoRow icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} label="Validé par" value={`${bon.valide_par.prenom} ${bon.valide_par.nom}`} />
                )}
              </div>
              {bon.commentaire && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-1">Commentaire</p>
                  <p className="text-sm text-gray-700">{bon.commentaire}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Produits reçus */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-royal-600" />
                Produits reçus ({nbLignes})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600 w-8">#</TableHead>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Qté commandée</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Qté reçue</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Prix unit.</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((l, i) => {
                      const prixBon = Number(l.prix_unitaire_ht) || 0;
                      const recu = l.quantite_recue || 0;
                      const montantRecu = l.montant_recu ?? (recu * prixBon);
                      const estComplet = recu >= l.quantite_commandee;

                      return (
                        <TableRow key={l.id} className={cn('hover:bg-royal-50/30', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                          <TableCell className="text-xs text-gray-400 font-mono">{i + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 text-sm">{l.produit?.nom || '-'}</div>
                            <div className="text-xs text-gray-400 font-mono">{l.produit?.code_article || ''}</div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm text-gray-500">{l.quantite_commandee}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn('font-mono text-sm font-semibold', estComplet ? 'text-emerald-700' : 'text-amber-700')}>
                              {recu}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">{fmtMontant(prixBon)}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">{fmtMontant(montantRecu)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Total reçu</p>
                    <p className="text-xl font-bold text-royal-700 font-mono">{fmtMontant(totalRecu)}</p>
                    {tauxCdf != null && <p className="text-xs text-gray-400 font-mono">{formatCurrency(totalRecu * tauxCdf, 'CDF')}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Résumé rapide */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold">Résumé rapide</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <SummaryMini label="Fournisseur" value={bon.partenaire?.nom || '-'} icon={<Building2 className="w-4 h-4 text-royal-600" />} />
              <SummaryMini label="Destination" value={bon.magasin_destination?.nom || '-'} icon={<MapPin className="w-4 h-4 text-gray-500" />} />
              <SummaryMini label="Lignes" value={`${nbLignes} produit(s)`} icon={<Package className="w-4 h-4 text-gray-500" />} />
              <SummaryMini label="Réceptions" value={`${nbReceptions} fois`} icon={<Truck className="w-4 h-4 text-gray-500" />} />
              <SummaryMini label="Statut" value={sc.label} icon={<StatutIcon className="w-4 h-4 text-gray-500" />} badge className={cn('px-2 py-0.5 rounded-full text-xs font-medium', sc.bg, sc.color)} />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <PDFDownloadLink document={<BonCommandePDF bon={bon} />} fileName={`BL-${bon.numero_commande}.pdf`}>
                {({ loading: pdfLoading }) => (
                  <Button variant="outline" disabled={pdfLoading} className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Printer className="w-4 h-4 mr-2" />
                    {pdfLoading ? 'Génération...' : 'Imprimer le bon de livraison'}
                  </Button>
                )}
              </PDFDownloadLink>
              <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => navigate('/rapports/bon-livraison')}>
                <FileText className="w-4 h-4 mr-2" /> Retour à la liste
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Réceptions */}
      {bon.receptions_liste && bon.receptions_liste.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4 text-royal-600" />
              Historique des réceptions ({bon.receptions_liste.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Référence</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté reçue</TableHead>
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
                                {pdfLoading ? <span className="w-4 h-4 border-2 border-gray-300 border-t-royal-700 rounded-full animate-spin" /> : <Printer className="w-4 h-4" />}
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
                    {pdfLoading ? <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                    {pdfLoading ? 'Préparation...' : 'Imprimer le bon de réception'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function SummaryCard({ icon, iconBg, iconColor, label, value, sub }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', iconBg)}>
            <span className={iconColor}>{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900 font-mono truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function SummaryMini({ label, value, icon, badge, className }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  badge?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      {badge ? (
        <span className={className}>{value}</span>
      ) : (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      )}
    </div>
  );
}
