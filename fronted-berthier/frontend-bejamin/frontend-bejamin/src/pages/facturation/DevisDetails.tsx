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
import { devisService } from '../../services/devis';
import type { Devis } from '../../types/facturation';
import { formatCurrency } from '../../lib/format';
import { DevisPDF } from '../../components/pdf/DevisPDF';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  ArrowLeft, Loader2, Download, FileText, MapPin, Hash, DollarSign, Package, Building,
  Send, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';

function formatDate(d: string | null | undefined): string {
  if (!d) return '-';
  const p = d.split('T')[0] || d;
  const [y, m, day] = p.split('-');
  return `${day}/${m}/${y}`;
}

const statutVariants: Record<string, 'warning' | 'info' | 'success' | 'destructive' | 'secondary'> = {
  BROUILLON: 'warning',
  ENVOYE: 'info',
  ACCEPTE: 'success',
  REFUSE: 'destructive',
  TRANSFORME_EN_COMMANDE: 'secondary',
};

const statutLabels: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  TRANSFORME_EN_COMMANDE: 'Transformé en commande',
};

export function DevisDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [devis, setDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ key: string; label: string; variant: 'danger' | 'warning' | 'info' } | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await devisService.get(Number(id));
      if (res.success) setDevis(res.data);
    } catch {
      toast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async () => {
    if (!devis || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.key === 'envoyer') {
        await devisService.changeStatut(devis.id, 'ENVOYE');
        toast('Devis envoyé', 'success');
      } else if (confirmAction.key === 'accepter') {
        await devisService.changeStatut(devis.id, 'ACCEPTE');
        toast('Devis accepté', 'success');
      } else if (confirmAction.key === 'refuser') {
        await devisService.changeStatut(devis.id, 'REFUSE');
        toast('Devis refusé', 'success');
      } else if (confirmAction.key === 'transformer') {
        await devisService.transformerEnCommande(devis.id);
        toast('Devis transformé en commande', 'success');
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

  const lignes = devis?.lignes || [];
  const actions: { key: string; label: string; icon: React.ElementType; variant: 'default' | 'outline'; className?: string; confirmVariant: 'danger' | 'warning' | 'info'; confirmMsg: string }[] = [];

  if (devis?.statut === 'BROUILLON') {
    actions.push({ key: 'envoyer', label: 'Envoyer', icon: Send, variant: 'default', className: 'bg-blue-600 hover:bg-blue-700 text-white', confirmVariant: 'info', confirmMsg: 'Envoyer le devis au client ?' });
  }
  if (devis?.statut === 'ENVOYE') {
    actions.push({ key: 'accepter', label: 'Accepter', icon: CheckCircle, variant: 'default', className: 'bg-green-600 hover:bg-green-700 text-white', confirmVariant: 'info', confirmMsg: 'Accepter ce devis ?' });
    actions.push({ key: 'refuser', label: 'Refuser', icon: XCircle, variant: 'outline', className: 'border-red-300 text-red-700 hover:bg-red-50', confirmVariant: 'danger', confirmMsg: 'Refuser ce devis ?' });
  }
  if (devis?.statut === 'ACCEPTE') {
    actions.push({ key: 'transformer', label: 'Transformer en commande', icon: RefreshCw, variant: 'default', className: 'bg-royal-700 hover:bg-royal-800 text-white', confirmVariant: 'info', confirmMsg: 'Transformer ce devis en bon de commande ?' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  if (!devis) {
    return (
      <div className="text-center py-20 text-gray-500">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>Devis non trouvé</p>
        <Button variant="outline" onClick={() => navigate('/facturation/devis')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/facturation/devis')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Devis {devis.numero_devis}</h1>
            <Badge variant={statutVariants[devis.statut] || 'secondary'} className="text-xs">
              {statutLabels[devis.statut] || devis.statut}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Créé le {formatDate(devis.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions.map((a) => (
            <Button key={a.key} type="button" variant={a.variant}
              onClick={() => setConfirmAction({ key: a.key, label: a.confirmMsg, variant: a.confirmVariant })}
              className={cn('shadow-sm', a.className)}>
              <a.icon className="w-4 h-4 mr-1.5" /> {a.label}
            </Button>
          ))}
          {devis.statut === 'BROUILLON' && (
            <Button variant="outline" onClick={() => navigate(`/facturation/devis/${devis.id}/modifier`)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <FileText className="w-4 h-4 mr-1.5" /> Modifier
            </Button>
          )}
          <PDFDownloadLink document={<DevisPDF devis={devis} />} fileName={`DEV-${devis.numero_devis}.pdf`}>
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
                <div><span className="text-sm text-gray-500">Numéro</span><p className="font-mono font-medium text-gray-900">{devis.numero_devis}</p></div>
                <div><span className="text-sm text-gray-500">Date</span><p className="font-medium text-gray-900">{formatDate(devis.date_devis)}</p></div>
                <div><span className="text-sm text-gray-500">Validité</span><p className="font-medium text-gray-900">{formatDate(devis.date_validite) || 'N/D'}</p></div>
                <div><span className="text-sm text-gray-500">Devise</span><p className="font-medium text-gray-900">{devis.devise?.code || '-'}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
            <CardContent className="p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
                <Package className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-gray-800">Lignes du devis</h2>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">P.U. HT</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Remise</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-6">Aucune ligne</TableCell></TableRow>
                    ) : lignes.map((l, i) => {
                      const totalLigne = l.quantite * l.prix_unitaire_ht * (1 - (l.remise || 0) / 100);
                      return (
                        <TableRow key={l.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <TableCell className="font-medium text-gray-900">{l.produit?.nom || '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{l.quantite}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(l.prix_unitaire_ht, devis.devise?.code)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{l.remise || 0}%</TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(totalLigne, devis.devise?.code)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
                <div className="font-medium text-gray-900">{devis.client?.nom || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Ville</div>
                <div className="font-medium text-gray-900">{devis.ville?.nom || '-'}</div>
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
                <div className="text-sm text-gray-500">Total HT</div>
                <div className="text-xl font-semibold text-gray-900">{formatCurrency(devis.montant_ht, devis.devise?.code)}</div>
              </div>
            </CardContent>
          </Card>

          {devis.commentaire && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-gray-400 to-gray-500" />
              <CardContent className="p-6">
                <div className="text-sm text-gray-500 mb-1">Commentaire</div>
                <p className="text-sm text-gray-700">{devis.commentaire}</p>
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
