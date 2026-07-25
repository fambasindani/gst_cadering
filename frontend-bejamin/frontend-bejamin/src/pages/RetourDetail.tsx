import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { retourService } from '../services/retour';
import type { Retour } from '../types/retour';
import { ArrowLeft, RotateCcw, Building2, MapPin, Shield, User, Calendar, Tag, MessageSquare, Package, CheckCircle, Edit3 } from 'lucide-react';
import { cn } from '../lib/utils';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const validationConfig: Record<string, { label: string; color: string }> = {
  'EN ATTENTE': { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  'VALIDÉ': { label: 'Validé', color: 'bg-emerald-100 text-emerald-800' },
  'REJETÉ': { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
};

export function RetourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [retour, setRetour] = useState<Retour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    retourService.get(Number(id))
      .then((res) => { if (res.success) setRetour(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton height={40} width={280} />
        <Skeleton height={200} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (!retour) {
    return (
      <div className="text-center py-12 text-gray-500">
        <RotateCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-700">Retour introuvable</p>
      </div>
    );
  }

  const vc = validationConfig[retour.statut_validation] || { label: retour.statut_validation, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/stock/retour')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-royal-100 text-royal-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{retour.numero_retour}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Détail du retour stock</p>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {retour.statut_validation === 'EN ATTENTE' && (
            <Button variant="outline" onClick={() => navigate(`/stock/retour/${retour.id}/modifier`)}
              className="border-royal-200 text-royal-700 hover:bg-royal-50">
              <Edit3 className="w-4 h-4 mr-1.5" /> Modifier
            </Button>
          )}
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium', vc.color)}>
            {vc.label}
          </span>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  N° Retour
                </p>
                <p className="text-sm font-mono font-medium text-gray-900 mt-1">{retour.numero_retour}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Date
                </p>
                <p className="text-sm text-gray-900 mt-1">{new Date(retour.date_retour).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  Client / Provenance
                </p>
                <p className="text-sm text-gray-900 mt-1">{retour.partenaire_client?.nom || retour.zone_provenance?.nom || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  Destination
                </p>
                <p className="text-sm text-gray-900 mt-1">{retour.partenaire_dest?.nom || retour.zone_dest?.nom || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  Ville
                </p>
                <p className="text-sm text-gray-900 mt-1">{retour.ville?.nom || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  Statut
                </p>
                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1', vc.color)}>
                  {vc.label}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Créé par
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {retour.utilisateur ? `${retour.utilisateur.prenom} ${retour.utilisateur.nom}` : '-'}
                </p>
              </div>
              {retour.valide_par && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                    Validé par
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {`${retour.valide_par.prenom} ${retour.valide_par.nom}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {retour.commentaire && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                Commentaire
              </p>
              <p className="text-sm text-gray-900 mt-1">{retour.commentaire}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {retour.lignes && retour.lignes.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-royal-700" />
              Lignes de retour ({retour.lignes.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté retournée</TableHead>
                    <TableHead className="font-semibold text-gray-600">Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retour.lignes.map((l, idx) => (
                    <TableRow key={l.id || idx} className={cn(idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="text-sm text-gray-900">{l.lot?.produit?.nom || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">{l.lot?.numero_lot || '-'}</TableCell>
                      <TableCell className="text-right text-sm font-mono text-gray-900">{l.quantite_retournee}</TableCell>
                      <TableCell className="text-sm text-gray-600">{l.motif || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
