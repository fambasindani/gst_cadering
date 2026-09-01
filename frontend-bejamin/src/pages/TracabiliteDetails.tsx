import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuthStore } from '../store/authStore';
import { tracabiliteService } from '../services/tracabilite';
import type { Tracabilite } from '../types/tracabilite';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { TracabilitePDF } from '../components/pdf/TracabilitePDF';
import { ArrowLeft, Package, Calendar, User, Building2, Hash, Edit3, Trash2, Printer } from 'lucide-react';
import { ConfirmModal } from '../components/ui/confirm-modal';

export function TracabiliteDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const { user } = useAuthStore();

  const [data, setData] = useState<Tracabilite | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Tracabilite | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await tracabiliteService.get(Number(id));
      if (res.success) {
        setData(res.data);
      }
    } catch {
      toast('Traçabilité non trouvée', 'error');
      navigate('/stock/tracabilite');
    } finally {
      setLoading(false);
    }
  }, [id, toast, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await tracabiliteService.delete(deleteTarget.id);
      toast('Traçabilité supprimée avec succès', 'success');
      navigate('/stock/tracabilite');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/tracabilite')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Détail traçabilité</h1>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const InfoItem = ({ icon: Icon, label, value, mono }: {
    icon: React.ElementType;
    label: string;
    value: string | null | undefined;
    mono?: boolean;
  }) => (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-royal-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-royal-700" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>
          {value || '-'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/tracabilite')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Traçabilité {data.numero_tracabilite}</h1>
        </div>
        {(isAdmin || data.id_utilisateur === user?.id) && (
          <div className="flex items-center gap-2">
            <PDFDownloadLink
              document={<TracabilitePDF data={data} />}
              fileName={`Tracabilite-${data.numero_tracabilite}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pdfLoading}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Printer className="w-4 h-4 mr-1" />
                  {pdfLoading ? 'Préparation...' : 'Imprimer'}
                </Button>
              )}
            </PDFDownloadLink>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/stock/tracabilite/${data.id}/modifier`)}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Edit3 className="w-4 h-4 mr-1" /> Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(data)}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-royal-700" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Hash} label="N° Traçabilité" value={data.numero_tracabilite} mono />
            <InfoItem icon={Calendar} label="Date" value={data.date_tracabilite ? new Date(data.date_tracabilite).toLocaleDateString('fr-FR') : null} />
            <InfoItem icon={User} label="Enregistré par" value={data.utilisateur?.full_name} />
            <InfoItem icon={Package} label="Lot" value={data.lot?.numero_lot} mono />
            <InfoItem icon={Package} label="Produit" value={data.lot?.produit?.nom} />
            <InfoItem icon={Hash} label="Quantité" value={String(data.quantite)} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-royal-700" />
              Détails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Building2} label="Magasin" value={data.lot?.magasin?.nom} />
            <InfoItem icon={Building2} label="Département" value={data.departement?.nom} />
            <InfoItem icon={Building2} label="Client" value={data.partenaire?.nom} />
            <InfoItem icon={User} label="Fournisseur (lot)" value={data.lot?.partenaire?.nom} />
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Commentaire</p>
              <p className="text-sm text-gray-900">{data.commentaire || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la traçabilité"
        message={`Confirmer la suppression de "${deleteTarget?.numero_tracabilite}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
