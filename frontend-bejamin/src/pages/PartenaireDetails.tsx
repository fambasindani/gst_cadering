import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Building2, Plane, Package, MapPin, Mail, Phone, Globe,
  ArrowLeft, Pencil, Hash, CheckCircle, XCircle, User, FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { partenaireService } from '../services/partenaire';
import type { Partenaire } from '../types/partenaire';

export function PartenaireDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [partner, setPartner] = useState<Partenaire | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partenaireService.get(Number(id)).then((res) => {
      if (res.success) setPartner(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-royal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Partenaire introuvable</p>
        <Button onClick={() => navigate('/partenaire')} className="mt-4">Retour</Button>
      </div>
    );
  }

  const isClient = partner.type === 'client' || partner.type === 'both';
  const isFournisseur = partner.type === 'fournisseur' || partner.type === 'both';
  const isAerien = partner.type_client === 'aerien' || partner.type_client === 'both';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/partenaire')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{partner.nom}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Détails du partenaire</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/partenaire/${id}/modifier`)} className="bg-royal-700 hover:bg-royal-800 text-white">
          <Pencil className="w-4 h-4 mr-2" /> Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm md:col-span-2">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-royal-700" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Type</Label>
                <div className="mt-1">
                  {isFournisseur && !isClient ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                      <Package className="w-4 h-4 mr-1.5" />
                      Fournisseur
                    </span>
                  ) : isAerien ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
                      <Plane className="w-4 h-4 mr-1.5" />
                      Client Aérien
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                      <Building2 className="w-4 h-4 mr-1.5" />
                      Client Non Aérien
                    </span>
                  )}
                </div>
              </div>
              {partner.code_iata && (
                <div>
                  <Label>Code IATA</Label>
                  <p className="mt-1 text-sm font-mono text-gray-900">{partner.code_iata}</p>
                </div>
              )}
              <div>
                <Label>Adresse</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900">{partner.adresse || '-'}</p>
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900">{partner.email || '-'}</p>
                </div>
              </div>
              <div>
                <Label>Téléphone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900">{partner.telephone || '-'}</p>
                </div>
              </div>
              <div>
                <Label>Identifiant fiscal</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900">{partner.identifiant_fiscal || '-'}</p>
                </div>
              </div>
              <div>
                <Label>Magasin</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900">{partner.magasin?.nom || '-'}</p>
                </div>
              </div>
              <div>
                <Label>Statut</Label>
                <div className="mt-1">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    partner.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600',
                  )}>
                    {partner.actif ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Actif</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Inactif</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-royal-700" />
                Type
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <span className={cn(
                  'p-4 rounded-full mb-3',
                  isFournisseur && !isClient ? 'bg-blue-50' : isAerien ? 'bg-indigo-50' : 'bg-purple-50',
                )}>
                  {isFournisseur && !isClient ? (
                    <Package className="w-8 h-8 text-blue-600" />
                  ) : isAerien ? (
                    <Plane className="w-8 h-8 text-indigo-600" />
                  ) : (
                    <Building2 className="w-8 h-8 text-purple-600" />
                  )}
                </span>
                <p className="font-semibold text-gray-900">
                  {isFournisseur && !isClient ? 'Fournisseur' : isAerien ? 'Client Aérien' : 'Client Non Aérien'}
                </p>
                {isClient && (
                  <p className="text-xs text-gray-400 mt-1">
                    Type client : {partner.type_client === 'aerien' ? 'Aérien' : partner.type_client === 'non_aerien' ? 'Non Aérien' : 'Les deux'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-royal-700" />
                Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center">
              <span className={cn(
                'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium',
                partner.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600',
              )}>
                {partner.actif ? (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Actif</>
                ) : (
                  <><XCircle className="w-4 h-4 mr-2" /> Inactif</>
                )}
              </span>
              <p className="text-xs text-gray-400 mt-2">
                {partner.actif ? 'Ce partenaire est actif' : 'Ce partenaire est désactivé'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</p>;
}
