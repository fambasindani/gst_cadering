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
  DollarSign, User, Clock, FileText, Loader2, CheckCircle, Truck,
  Hash, TrendingUp, TrendingDown, AlertTriangle,
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

export function BonCommandeRapportDetails() {
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
        <Button variant="outline" className="mt-4" onClick={() => navigate('/rapports/bon-commande')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au rapport
        </Button>
      </div>
    );
  }

  const sc = statutConfig[bon.statut] || { label: bon.statut, color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock };
  const StatutIcon = sc.icon;
  const lignes = bon.lignes || [];
  const nbLignes = lignes.length;

  const totalCommande = lignes.reduce((s, l) => s + l.quantite_commandee * l.prix_unitaire_ht, 0);
  const totalRecu = lignes.reduce(
    (s, l) => s + (l.montant_recu !== undefined ? l.montant_recu : l.quantite_recue * l.prix_unitaire_ht),
    0,
  );
  const deviseCode = bon.devise?.code || lignes[0]?.devise?.code || 'USD';

  const qteCommandee = lignes.reduce((s, l) => s + l.quantite_commandee, 0);
  const qteRecue = lignes.reduce((s, l) => s + (l.quantite_recue || 0), 0);
  const pctRecu = qteCommandee > 0 ? Math.round((qteRecue / qteCommandee) * 100) : 0;

  const lignesRecues = lignes.filter(l => (l.quantite_recue || 0) > 0).length;
  const lignesCompletes = lignes.filter(l => (l.quantite_recue || 0) >= l.quantite_commandee).length;

  const nbReceptions = bon.receptions_liste?.length || 0;

  const hasVariation = lignes.some(l => {
    if (!l.quantite_recue || l.montant_recu === undefined) return false;
    const prixRecu = l.montant_recu / l.quantite_recue;
    return Math.abs(prixRecu - l.prix_unitaire_ht) > 0.005;
  });

  const fmtMontant = (v: number) => formatCurrency(v, deviseCode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rapports/bon-commande')} className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Bon de commande</h1>
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold', sc.bg, sc.color)}>
                <StatutIcon className="w-4 h-4" />
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 font-mono">{bon.numero_commande}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PDFDownloadLink document={<BonCommandePDF bon={bon} />} fileName={`BC-${bon.numero_commande}.pdf`}>
            {({ loading: pdfLoading }) => (
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50" disabled={pdfLoading}>
                <Printer className="w-4 h-4 mr-2" />
                {pdfLoading ? 'Génération...' : 'Imprimer PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Cartes résumé en haut */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-royal-100"
          iconColor="text-royal-700"
          label="Montant total"
          value={fmtMontant(totalCommande)}
          sub={tauxCdf != null ? formatCurrency(totalCommande * tauxCdf, 'CDF') : undefined}
        />
        <SummaryCard
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          label="Montant reçu"
          value={fmtMontant(totalRecu)}
          sub={tauxCdf != null ? formatCurrency(totalRecu * tauxCdf, 'CDF') : undefined}
          highlight={totalRecu > 0 && totalRecu < totalCommande}
        />
        <SummaryCard
          icon={<Truck className="w-5 h-5" />}
          iconBg="bg-purple-100"
          iconColor="text-purple-700"
          label="Réceptions"
          value={String(nbReceptions)}
          sub={`${lignesRecues}/${nbLignes} ligne(s) reçue(s)`}
        />
        <SummaryCard
          icon={<Hash className="w-5 h-5" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          label="Produits"
          value={String(nbLignes)}
          sub={`${lignesCompletes}/${nbLignes} complet(s)`}
        />
      </div>

      {/* Barre de progression */}
      {qteCommandee > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression de la réception</span>
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

      {/* Infos du bon + Montants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-royal-600" />
                Informations du bon de commande
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoRow icon={<Building2 className="w-4 h-4 text-royal-600" />} label="Fournisseur" value={bon.partenaire?.nom || '-'} />
                <InfoRow icon={<MapPin className="w-4 h-4 text-gray-500" />} label="Magasin destination" value={bon.magasin_destination?.nom || '-'} />
                <InfoRow icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Date de commande" value={bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'} />
                <InfoRow icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Livraison prévue" value={bon.date_livraison_prevue ? new Date(bon.date_livraison_prevue).toLocaleDateString('fr-FR') : '-'} />
                <InfoRow icon={<DollarSign className="w-4 h-4 text-gray-500" />} label="Devise" value={bon.devise?.code || '-'} />
                <InfoRow icon={<User className="w-4 h-4 text-gray-500" />} label="Créé par" value={bon.utilisateur ? `${bon.utilisateur.prenom} ${bon.utilisateur.nom}` : '-'} />
                {bon.valide_par && (
                  <InfoRow icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} label="Validé par" value={`${bon.valide_par.prenom} ${bon.valide_par.nom}`} />
                )}
                {bon.date_validation && (
                  <InfoRow icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Date validation" value={new Date(bon.date_validation).toLocaleDateString('fr-FR')} />
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

          {/* Lignes de commande */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-royal-600" />
                Produits commandés ({nbLignes})
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
                      <TableHead className="text-center font-semibold text-gray-600">Qté reçue</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Prix unit.</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Prix reçu</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((l, i) => {
                      const prixBon = Number(l.prix_unitaire_ht) || 0;
                      const montantLigne = l.quantite_commandee * prixBon;
                      const recu = l.quantite_recue || 0;
                      const pctLigne = l.quantite_commandee > 0 ? Math.round((recu / l.quantite_commandee) * 100) : 0;
                      const prixRecu = recu > 0 && l.montant_recu !== undefined ? l.montant_recu / recu : null;
                      const variation = prixRecu !== null && Math.abs(prixRecu - prixBon) > 0.005;
                      const estComplet = recu >= l.quantite_commandee;
                      const estPartiel = recu > 0 && recu < l.quantite_commandee;

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
                            {estPartiel && (
                              <div className="text-[10px] text-amber-600 mt-0.5">{pctLigne}%</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">{fmtMontant(prixBon)}</TableCell>
                          <TableCell className="text-right">
                            {prixRecu !== null ? (
                              <div>
                                <span className={cn('font-mono text-sm font-medium', variation ? (prixRecu > prixBon ? 'text-emerald-700' : 'text-amber-700') : 'text-gray-700')}>
                                  {fmtMontant(prixRecu)}
                                </span>
                                {variation && (
                                  <div className="text-[10px] flex items-center justify-end gap-0.5 mt-0.5">
                                    {prixRecu > prixBon ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-amber-600" />}
                                    <span className={prixRecu > prixBon ? 'text-emerald-600' : 'text-amber-600'}>
                                      {prixRecu > prixBon ? '+' : ''}{fmtMontant(prixRecu - prixBon)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : <span className="text-gray-300 text-sm">-</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-sm font-semibold text-gray-900">{fmtMontant(montantLigne)}</span>
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
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Total commandé</p>
                    <p className="text-xl font-bold text-gray-900 font-mono">{fmtMontant(totalCommande)}</p>
                    {tauxCdf != null && <p className="text-xs text-gray-400 font-mono">{formatCurrency(totalCommande * tauxCdf, 'CDF')}</p>}
                  </div>
                  {totalRecu > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Total reçu</p>
                      <p className="text-xl font-bold text-royal-700 font-mono">{fmtMontant(totalRecu)}</p>
                      {tauxCdf != null && <p className="text-xs text-gray-400 font-mono">{formatCurrency(totalRecu * tauxCdf, 'CDF')}</p>}
                      {totalRecu < totalCommande && (
                        <p className="text-xs text-amber-600 mt-0.5">Reste : {fmtMontant(totalCommande - totalRecu)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alerte variation prix */}
          {hasVariation && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Variation de prix détectée</p>
                <p className="text-xs text-amber-700 mt-1">
                  Certains produits ont été réceptionnés à un prix différent du prix du bon de commande.
                </p>
              </div>
            </div>
          )}

          {/* Résumé rapide */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold">Résumé rapide</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <SummaryMini label="Fournisseur" value={bon.partenaire?.nom || '-'} icon={<Building2 className="w-4 h-4 text-royal-600" />} />
              <SummaryMini label="Destination" value={bon.magasin_destination?.nom || '-'} icon={<MapPin className="w-4 h-4 text-gray-500" />} />
              <SummaryMini label="Date commande" value={bon.date_commande ? new Date(bon.date_commande).toLocaleDateString('fr-FR') : '-'} icon={<Calendar className="w-4 h-4 text-gray-500" />} />
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
              <PDFDownloadLink document={<BonCommandePDF bon={bon} />} fileName={`BC-${bon.numero_commande}.pdf`}>
                {({ loading: pdfLoading }) => (
                  <Button variant="outline" disabled={pdfLoading} className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Printer className="w-4 h-4 mr-2" />
                    {pdfLoading ? 'Génération...' : 'Imprimer le bon de commande'}
                  </Button>
                )}
              </PDFDownloadLink>
              <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => navigate('/rapports/bon-commande')}>
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
    </div>
  );
}

function SummaryCard({ icon, iconBg, iconColor, label, value, sub, highlight }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn('border-0 shadow-sm', highlight && 'ring-1 ring-amber-200')}>
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
