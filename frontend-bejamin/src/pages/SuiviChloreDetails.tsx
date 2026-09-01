import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuthStore } from '../store/authStore';
import { suiviChloreService } from '../services/suivi-chlore';
import type { SuiviChlore } from '../types/suivi-chlore';
import { ArrowLeft, Droplets, Calendar, User, Building2, Hash, Edit3, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ui/confirm-modal';

export function SuiviChloreDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const { user } = useAuthStore();

  const [data, setData] = useState<SuiviChlore | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SuiviChlore | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await suiviChloreService.get(Number(id));
      if (res.success) {
        setData(res.data);
      }
    } catch {
      toast('Suivi chlore non trouvé', 'error');
      navigate('/stock/suivi-chlore');
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
      await suiviChloreService.delete(deleteTarget.id);
      toast('Suivi chlore supprimé avec succès', 'success');
      navigate('/stock/suivi-chlore');
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/suivi-chlore')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Détail suivi chlore</h1>
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/suivi-chlore')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Suivi chlore — {data.date_operation ? new Date(data.date_operation).toLocaleDateString('fr-FR') : ''}
          </h1>
        </div>
        {(isAdmin || data.id_utilisateur === user?.id) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/stock/suivi-chlore/${data.id}/modifier`)}
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
              <Droplets className="w-5 h-5 text-royal-700" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Calendar} label="Date d'opération" value={data.date_operation ? new Date(data.date_operation).toLocaleDateString('fr-FR') : null} />
            <InfoItem icon={User} label="Agent" value={data.utilisateur?.full_name} />
            <InfoItem icon={Hash} label="Produit" value={data.lot?.produit?.nom} />
            <InfoItem icon={Hash} label="Code article" value={data.lot?.produit?.code_article} mono />
            <InfoItem icon={Hash} label="Concentration" value={data.concentration_ppm != null ? `${data.concentration_ppm} ppm` : null} />
            <InfoItem icon={Hash} label="Temps de trempage" value={data.temps_trempage_minutes != null ? `${data.temps_trempage_minutes} min` : null} />
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
            <InfoItem icon={Hash} label="N° Lot" value={data.lot?.numero_lot} mono />
            <InfoItem icon={Building2} label="Client" value={data.partenaire?.nom} />
            <InfoItem icon={User} label="Utilisateur" value={data.utilisateur?.full_name} />
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Commentaire / Action corrective</p>
              <p className="text-sm text-gray-900">{data.commentaire_action_corrective || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le suivi chlore"
        message={`Confirmer la suppression du suivi du "${deleteTarget?.date_operation ? new Date(deleteTarget.date_operation).toLocaleDateString('fr-FR') : ''}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
