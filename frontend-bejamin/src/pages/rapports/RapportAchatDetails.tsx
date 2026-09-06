import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { rapportService } from '../../services/rapport';
import { tauxConversionService } from '../../services/taux-conversion';
import { StatutMouvementBadge } from '../../components/ui/StatutMouvementBadge';
import type { MouvementStock } from '../../types/validation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft, Package, Hash, Calendar, Building2, MapPin,
  FileText, User, Clock, CheckCircle, DollarSign,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';

function formatDateFr(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export function RapportAchatDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mouvement, setMouvement] = useState<MouvementStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [tauxCdf, setTauxCdf] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await rapportService.mouvementDetail(Number(id));
      if (res.success && res.data) setMouvement(res.data);
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
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!mouvement) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Mouvement non trouvé</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/rapports/achat')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au rapport
        </Button>
      </div>
    );
  }

  const lot = mouvement.lot;
  const produit = lot?.produit;
  const prix = Number(lot?.prix_achat_ht_unitaire ?? 0);
  const valeur = mouvement.quantite * prix;
  const deviseCode = lot?.devise?.code || 'USD';
  const prixPondere = tauxCdf != null ? prix * tauxCdf : prix;
  const valeurCdf = tauxCdf != null ? valeur * tauxCdf : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rapports/achat')} className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{produit?.nom || 'Produit'}</h1>
              <StatutMouvementBadge statut={mouvement.statut_validation} />
            </div>
            <p className="text-sm text-gray-500 mt-1 font-mono">{produit?.code_article || ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-royal-100"
          iconColor="text-royal-700"
          label="Quantité"
          value={String(mouvement.quantite)}
          sub={produit?.unite?.nom || ''}
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          label="Prix unitaire"
          value={formatCurrency(prix, deviseCode)}
          sub={tauxCdf != null ? formatCurrency(prixPondere, 'CDF') : undefined}
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          label="Valeur"
          value={formatCurrency(valeur, deviseCode)}
          sub={valeurCdf != null ? formatCurrency(valeurCdf, 'CDF') : undefined}
        />
        <SummaryCard
          icon={<Calendar className="w-5 h-5" />}
          iconBg="bg-purple-100"
          iconColor="text-purple-700"
          label="Date"
          value={mouvement.date_mouvement ? formatDateFr(mouvement.date_mouvement) : '-'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-royal-600" />
                Produit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoRow icon={<Package className="w-4 h-4 text-royal-600" />} label="Nom" value={produit?.nom || '-'} />
                <InfoRow icon={<Hash className="w-4 h-4 text-gray-500" />} label="Code article" value={produit?.code_article || '-'} />
                <InfoRow icon={<Package className="w-4 h-4 text-gray-500" />} label="Unité" value={produit?.unite?.nom || '-'} />
                <InfoRow icon={<DollarSign className="w-4 h-4 text-gray-500" />} label="Prix unitaire" value={formatCurrency(prix, deviseCode)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Hash className="w-4 h-4 text-royal-600" />
                Détails du mouvement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoRow icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Date" value={mouvement.date_mouvement ? formatDateFr(mouvement.date_mouvement) : '-'} />
                <InfoRow icon={<Package className="w-4 h-4 text-gray-500" />} label="Quantité" value={String(mouvement.quantite)} />
                <InfoRow icon={<DollarSign className="w-4 h-4 text-gray-500" />} label="Valeur" value={formatCurrency(valeur, deviseCode)} />
                <InfoRow icon={<Hash className="w-4 h-4 text-gray-500" />} label="N° lot" value={lot?.numero_lot || '-'} />
                {mouvement.reference_document && (
                  <InfoRow icon={<FileText className="w-4 h-4 text-gray-500" />} label="Référence" value={mouvement.reference_document} />
                )}
                {mouvement.commentaire && (
                  <InfoRow icon={<FileText className="w-4 h-4 text-gray-500" />} label="Commentaire" value={mouvement.commentaire} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold">Informations</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <SummaryMini label="Fournisseur" value={lot?.partenaire?.nom || '-'} icon={<Building2 className="w-4 h-4 text-royal-600" />} />
              <SummaryMini label="Magasin" value={lot?.magasin?.nom || '-'} icon={<MapPin className="w-4 h-4 text-gray-500" />} />
              <SummaryMini label="Statut" value={mouvement.statut_validation} icon={<CheckCircle className="w-4 h-4 text-gray-500" />} badge className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                mouvement.statut_validation === 'VALIDÉ' ? 'bg-emerald-100 text-emerald-700' :
                mouvement.statut_validation === 'REJETÉ' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              )} />
              {mouvement.utilisateur && (
                <SummaryMini label="Créé par" value={`${mouvement.utilisateur.prenom} ${mouvement.utilisateur.nom}`} icon={<User className="w-4 h-4 text-gray-500" />} />
              )}
              {mouvement.valide_par && (
                <SummaryMini label="Validé par" value={`${mouvement.valide_par.prenom} ${mouvement.valide_par.nom}`} icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} />
              )}
              {mouvement.date_validation && (
                <SummaryMini label="Date validation" value={formatDateFr(mouvement.date_validation)} icon={<Clock className="w-4 h-4 text-gray-500" />} />
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/rapports/achat')}>
            <FileText className="w-4 h-4 mr-2" /> Retour à la liste
          </Button>
        </div>
      </div>
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
        <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{value}</span>
      )}
    </div>
  );
}
