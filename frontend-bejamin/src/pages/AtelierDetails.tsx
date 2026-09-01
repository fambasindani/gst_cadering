import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuthStore } from '../store/authStore';
import { atelierService } from '../services/atelier';
import type { AtelierTracabilite } from '../types/atelier';
import { ArrowLeft, Factory, Calendar, User, Thermometer, Clock, Hash, Edit3, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { cn } from '../lib/utils';

export function AtelierDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const { user } = useAuthStore();

  const [data, setData] = useState<AtelierTracabilite | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AtelierTracabilite | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await atelierService.get(Number(id));
      if (res.success) {
        setData(res.data);
      }
    } catch {
      toast('Atelier non trouvé', 'error');
      navigate('/stock/atelier');
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
      await atelierService.delete(deleteTarget.id);
      toast('Atelier supprimé avec succès', 'success');
      navigate('/stock/atelier');
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/atelier')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Détail atelier</h1>
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

  const typeBadge = (type: string) => {
    const isDressage = type === 'DRESSAGE';
    return (
      <span className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        isDressage ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
      )}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/atelier')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Atelier — {data.partenaire?.nom || 'Sans compagnie'}
          </h1>
          <div className="ml-2">{typeBadge(data.type_atelier)}</div>
        </div>
        {(isAdmin || data.id_utilisateur === user?.id) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/stock/atelier/${data.id}/modifier`)}
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
              <Factory className="w-5 h-5 text-royal-700" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Factory} label="Type d'atelier" value={data.type_atelier} />
            <InfoItem icon={Calendar} label="Date d'opération" value={formatDate(data.date_operation)} />
            <InfoItem icon={User} label="Opérateur" value={data.utilisateur?.full_name} />
            <InfoItem icon={Hash} label="Compagnie client" value={data.partenaire?.nom} />
            <InfoItem icon={Hash} label="Code prestation" value={data.code_prestation} mono />
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
            <InfoItem icon={Hash} label="Quantité" value={data.quantite} />
            <InfoItem icon={Hash} label="Numéro de lot" value={data.lot?.numero_lot} mono />
            <InfoItem icon={Hash} label="Produit" value={data.lot?.produit?.nom} />
            <InfoItem icon={Hash} label="Code article" value={data.lot?.produit?.code_article} mono />
            <InfoItem icon={Hash} label="Code couleur / DLC produit" value={data.code_couleur_produit_dlc} />
            <InfoItem icon={Hash} label="Cycle / Classe" value={data.cycle_classe} />
            <InfoItem icon={Hash} label="Produits utilisés" value={data.produits_utilises} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-600" />
              Températures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Thermometer} label="Température atelier" value={data.temperature_atelier} suffix=" °C" />
            <InfoItem icon={Clock} label="Heure début" value={data.heure_debut || '-'} />
            <InfoItem icon={Thermometer} label="Température surface début" value={data.temperature_surface_debut} suffix=" °C" />
            <InfoItem icon={Clock} label="Heure fin" value={data.heure_fin || '-'} />
            <InfoItem icon={Thermometer} label="Température surface fin" value={data.temperature_surface_fin} suffix=" °C" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-red-600" />
              Action corrective
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pt-1">
              <p className="text-xs text-gray-500 mb-1">Action corrective</p>
              <p className="text-sm text-gray-900">{data.action_corrective || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'atelier"
        message={`Confirmer la suppression de l'atelier "${deleteTarget?.type_atelier} — ${deleteTarget?.partenaire?.nom || ''}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
