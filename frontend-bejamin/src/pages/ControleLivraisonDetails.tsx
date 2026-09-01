import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuthStore } from '../store/authStore';
import { controleLivraisonService } from '../services/controle-livraison';
import type { ControleLivraison } from '../types/controle-livraison';
import { ArrowLeft, Truck, Calendar, User, Building2, Hash, Edit3, Trash2, Clock, Thermometer } from 'lucide-react';
import { ConfirmModal } from '../components/ui/confirm-modal';

export function ControleLivraisonDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const { user } = useAuthStore();

  const [data, setData] = useState<ControleLivraison | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ControleLivraison | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await controleLivraisonService.get(Number(id));
      if (res.success) {
        setData(res.data);
      }
    } catch {
      toast('Contrôle livraison non trouvé', 'error');
      navigate('/stock/controle-livraison');
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
      await controleLivraisonService.delete(deleteTarget.id);
      toast('Contrôle livraison supprimé avec succès', 'success');
      navigate('/stock/controle-livraison');
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/controle-livraison')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Détail contrôle livraison</h1>
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/controle-livraison')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Contrôle livraison — {data.date_operation ? new Date(data.date_operation).toLocaleDateString('fr-FR') : ''}
          </h1>
        </div>
        {(isAdmin || data.id_utilisateur === user?.id) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/stock/controle-livraison/${data.id}/modifier`)}
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
              <Truck className="w-5 h-5 text-royal-700" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Calendar} label="Date d'opération" value={data.date_operation ? new Date(data.date_operation).toLocaleDateString('fr-FR') : null} />
            <InfoItem icon={Hash} label="CIE / N° Vol" value={data.cie_numero_vol} mono />
            <InfoItem icon={Building2} label="Client" value={data.partenaire?.nom} />
            <InfoItem icon={User} label="Agent" value={data.utilisateur?.full_name} />
            <InfoItem icon={Truck} label="Camion propre" value={data.camion_propre != null ? (data.camion_propre ? 'Oui' : 'Non') : null} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-royal-700" />
              Températures & Horaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Clock} label="Heure début" value={data.heure_debut || null} />
            <InfoItem icon={Clock} label="Heure fin" value={data.heure_fin || null} />
            <InfoItem icon={Thermometer} label="Final holding temperature" value={data.final_holding_temperature != null ? `${data.final_holding_temperature}°C` : null} />
            <InfoItem icon={Thermometer} label="Réception client temperature" value={data.reception_client_temperature != null ? `${data.reception_client_temperature}°C` : null} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-royal-700" />
              Produit & Lot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={Hash} label="Plat / Produit" value={data.lot?.produit?.nom} />
            <InfoItem icon={Hash} label="Code article" value={data.lot?.produit?.code_article} mono />
            <InfoItem icon={Hash} label="N° Lot" value={data.lot?.numero_lot} mono />
            <InfoItem icon={Hash} label="Code prestation / classe" value={data.code_prestation_classe} />
            <InfoItem icon={Hash} label="Code couleur" value={data.code_couleur} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-royal-700" />
              Signatures & Remarques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={User} label="Signature superviseur" value={data.nom_signature_superviseur} />
            <InfoItem icon={User} label="Signature responsable client" value={data.nom_signature_responsable_client} />
            <InfoItem icon={User} label="Utilisateur" value={data.utilisateur?.full_name} />
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Commentaires</p>
              <p className="text-sm text-gray-900">{data.commentaires || '—'}</p>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Remarque générale</p>
              <p className="text-sm text-gray-900">{data.remarque_generale || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le contrôle livraison"
        message={`Confirmer la suppression du contrôle du "${deleteTarget?.date_operation ? new Date(deleteTarget.date_operation).toLocaleDateString('fr-FR') : ''}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
