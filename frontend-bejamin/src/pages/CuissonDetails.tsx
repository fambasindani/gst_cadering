import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuthStore } from '../store/authStore';
import { cuissonService } from '../services/cuisson';
import type { CuissonTracabilite } from '../types/cuisson';
import { ArrowLeft, Flame, Calendar, User, Thermometer, Clock, Hash, Edit3, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ui/confirm-modal';

export function CuissonDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const { user } = useAuthStore();

  const [data, setData] = useState<CuissonTracabilite | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CuissonTracabilite | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await cuissonService.get(Number(id));
      if (res.success) {
        setData(res.data);
      }
    } catch {
      toast('Cuisson non trouvée', 'error');
      navigate('/stock/cuisson');
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
      await cuissonService.delete(deleteTarget.id);
      toast('Cuisson supprimée avec succès', 'success');
      navigate('/stock/cuisson');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/cuisson')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Détail cuisson</h1>
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

  const InfoItem = ({ icon: Icon, label, value, mono, suffix }: {
    icon: React.ElementType;
    label: string;
    value: string | number | null | undefined;
    mono?: boolean;
    suffix?: string;
  }) => (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-royal-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-royal-700" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>
          {value != null && value !== '' ? `${value}${suffix || ''}` : '-'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/cuisson')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Cuisson — {data.lot?.produit?.nom || 'Sans produit'}</h1>
        </div>
        {(isAdmin || data.id_utilisateur === user?.id) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/stock/cuisson/${data.id}/modifier`)}
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
              <Flame className="w-5 h-5 text-royal-700" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Calendar} label="Date d'opération" value={formatDate(data.date_operation)} />
            <InfoItem icon={Hash} label="Produit" value={data.lot?.produit?.nom} />
            <InfoItem icon={Hash} label="Code article" value={data.lot?.produit?.code_article} mono />
            <InfoItem icon={User} label="Opérateur" value={data.utilisateur?.full_name} />
            <InfoItem icon={Hash} label="Client" value={data.partenaire?.nom} />
            <InfoItem icon={Hash} label="Mode cuisson" value={data.mode_cuisson} />
            <InfoItem icon={Hash} label="Code couleur" value={data.code_couleur} />
            <InfoItem icon={Hash} label="Mise en décongélation" value={data.mise_en_decongelation} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-royal-700" />
              Quantités & Lots
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Hash} label="Quantité avant cuisson" value={data.quantite_avant_cuisson} />
            <InfoItem icon={Hash} label="Quantité après cuisson" value={data.quantite_apres_cuisson} />
            <InfoItem icon={Hash} label="DLC / DLUO" value={data.dlc_dluo} />
            <InfoItem icon={Hash} label="Numéro de lot" value={data.lot?.numero_lot} mono />
            <InfoItem icon={Hash} label="Numéro lot créé" value={data.numero_lot_cree} mono />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-600" />
              Cuisson
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Clock} label="Heure fin cuisson" value={data.heure_fin_cuisson || '-'} />
            <InfoItem icon={Thermometer} label="Température cœur cuisson" value={data.temperature_coeur_cuisson} suffix=" °C" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-blue-600" />
              Refroidissement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Clock} label="Heure début refroidissement" value={data.heure_debut_refroidissement || '-'} />
            <InfoItem icon={Clock} label="Heure fin refroidissement" value={data.heure_fin_refroidissement || '-'} />
            <InfoItem icon={Thermometer} label="Température cœur refroidissement" value={data.temperature_coeur_refroidissement} suffix=" °C" />
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la cuisson"
        message={`Confirmer la suppression de la cuisson du "${deleteTarget?.lot?.produit?.nom || ''}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
