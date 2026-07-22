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
import { bonCommandeService } from '../services/bon-commande';
import { BonCommandePDF } from '../components/pdf/BonCommandePDF';
import type { BonCommande } from '../types/bon-commande';
import {
  ArrowLeft, Pencil, FileText, Truck, CheckCircle, XCircle, Ban, Printer,
  Building2, MapPin, Calendar, DollarSign, MessageSquare, User, Clock, Loader2, PackagePlus,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const statutConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  ENVOYÉ: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Truck },
  'REÇU PARTIELLEMENT': { label: 'Reçu partiellement', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
  REÇU: { label: 'Reçu', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  ANNULE: { label: 'Annulé', color: 'bg-red-100 text-red-800 border-red-200', icon: Ban },
};

export function BonCommandeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bon, setBon] = useState<BonCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);



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

  const doAction = async (action: string, fn: () => Promise<{ success: boolean; message: string }>, successMsg: string) => {
    setActionLoading(true);
    try {
      const res = await fn();
      if (res.success) {
        toast(successMsg, 'success');
        fetchData();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || `Erreur lors de ${action}`, 'error');
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
  const totalRecu = lignes.reduce((s, l) => s + l.quantite_recue * l.prix_unitaire_ht, 0);
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
          {bon.statut === 'BROUILLON' ? (
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
                <DetailItem icon={<MapPin className="w-4 h-4" />} label="Destination" value={bon.ville_destination?.nom || '-'} />
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
                      <TableHead className="text-right font-semibold text-gray-600">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((l, i) => (
                      <TableRow key={l.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">{l.produit?.nom || '-'}</div>
                          <div className="text-xs text-gray-500 font-mono">{l.produit?.code_article || ''}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-900">{l.quantite_commandee}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-700">{l.quantite_recue || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-700">
                          {formatCurrency(Number(l.prix_unitaire_ht), l.devise?.code || deviseCode)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                          {formatCurrency(l.quantite_commandee * l.prix_unitaire_ht, l.devise?.code || deviseCode)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t border-gray-100 p-4 flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total HT</div>
                  <div className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(total, deviseCode)}</div>
                  {bon.statut === 'REÇU PARTIELLEMENT' || bon.statut === 'REÇU' ? (
                    <div className="text-sm text-gray-500 mt-1">Reçu: {formatCurrency(totalRecu, deviseCode)}</div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {bon.statut === 'BROUILLON' ? (
                <>
                  <Button onClick={() => doAction('validation', () => bonCommandeService.validate(Number(id)), 'Bon validé avec succès')}
                    disabled={actionLoading} className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white">
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Valider
                  </Button>
                  <Button onClick={() => doAction('rejet', () => bonCommandeService.reject(Number(id)), 'Bon rejeté')}
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

              {bon.statut === 'ENVOYÉ' || bon.statut === 'REÇU PARTIELLEMENT' ? (
                <>
                  <Button onClick={() => navigate(`/reception/${id}`)}
                    className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PackagePlus className="w-4 h-4 mr-2" />
                    Réceptionner
                  </Button>
                  <Button onClick={() => doAction('annulation', () => bonCommandeService.cancel(Number(id)), 'Bon annulé')}
                    disabled={actionLoading} variant="outline" className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50">
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                    Annuler
                  </Button>
                </>
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
