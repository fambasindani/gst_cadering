import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import { useToast } from '../../hooks/useToast';
import { avoirService } from '../../services/avoir';
import type { Avoir } from '../../types/facturation';
import { formatCurrency } from '../../lib/format';
import {
  ArrowLeft, Loader2, FileText, Building, DollarSign,
} from 'lucide-react';

function formatDate(d: string | null | undefined): string {
  if (!d) return '-';
  const p = d.split('T')[0] || d;
  const [y, m, day] = p.split('-');
  return `${day}/${m}/${y}`;
}

export function AvoirDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [avoir, setAvoir] = useState<Avoir | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await avoirService.get(Number(id));
      if (res.success) setAvoir(res.data);
    } catch {
      toast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  if (!avoir) {
    return (
      <div className="text-center py-20 text-gray-500">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>Avoir non trouvé</p>
        <Button variant="outline" onClick={() => navigate('/facturation/avoirs')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/facturation/avoirs')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Avoir {avoir.numero_avoir}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Créé le {formatDate(avoir.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-700" />
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FileText className="w-5 h-5 text-red-700" />
                <h2 className="text-base font-bold text-gray-800">Informations</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-gray-500">Numéro</span><p className="font-mono font-medium text-gray-900">{avoir.numero_avoir}</p></div>
                <div><span className="text-sm text-gray-500">Date</span><p className="font-medium text-gray-900">{formatDate(avoir.date_avoir)}</p></div>
                <div><span className="text-sm text-gray-500">Facture d'origine</span><p className="font-medium text-gray-900">{avoir.facture_origine?.numero_facture || 'N/A'}</p></div>
                <div><span className="text-sm text-gray-500">Devise</span><p className="font-medium text-gray-900">{avoir.devise?.code || '-'}</p></div>
              </div>
            </CardContent>
          </Card>

          {avoir.commentaire && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-gray-400 to-gray-500" />
              <CardContent className="p-6">
                <div className="text-sm text-gray-500 mb-1">Commentaire</div>
                <p className="text-sm text-gray-700">{avoir.commentaire}</p>
              </CardContent>
            </Card>
          )}
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
                <div className="font-medium text-gray-900">{avoir.client?.nom || '-'}</div>
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
                <div className="text-sm text-gray-500">Montant HT</div>
                <div className="text-xl font-semibold text-red-600">{formatCurrency(avoir.montant_ht, avoir.devise?.code)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title=""
        message=""
      />
    </div>
  );
}
