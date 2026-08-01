import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { useToast } from '../hooks/useToast';
import { ficheTechniqueService } from '../services/fiche-technique';
import { FicheTechniquePDF } from '../components/pdf/FicheTechniquePDF';
import type { FicheTechnique } from '../types/fiche-technique';
import {
  ArrowLeft, Pencil, FileText, CheckCircle, XCircle, Copy, Download,
  Package, MapPin, Hash, DollarSign, MessageSquare, Loader2, Eye,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

export function FicheTechniqueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fiche, setFiche] = useState<FicheTechnique | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await ficheTechniqueService.get(Number(id));
      if (res.success) setFiche(res.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async (label: string, fn: () => Promise<{ success: boolean; message: string }>, successMsg: string) => {
    setActionLoading(true);
    try {
      const res = await fn();
      if (res.success) {
        toast(successMsg, 'success');
        fetchData();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || `Erreur lors de ${label}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-5 bg-gray-200 rounded w-3/4" />)}</CardContent></Card>
          </div>
          <div className="space-y-6">
            <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-5 bg-gray-200 rounded" />)}</CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!fiche) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Fiche technique non trouvée</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/recettes/creation')}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
      </div>
    );
  }

  const lignes = fiche.lignes || [];
  const totalCout = lignes.reduce((s, l) => s + Number(l.cout_total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/recettes/creation')} className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{fiche.nom}</h1>
              <Badge variant={fiche.actif ? 'success' : 'secondary'} className="text-xs">
                {fiche.actif ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-mono text-royal-700 font-medium">{fiche.code}</span>
              {fiche.created_at ? ` — Créé le ${new Date(fiche.created_at).toLocaleDateString('fr-FR')}` : ''}
              {fiche.updated_at && fiche.updated_at !== fiche.created_at ? ` — Modifié le ${new Date(fiche.updated_at).toLocaleDateString('fr-FR')}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PDFDownloadLink document={<FicheTechniquePDF fiche={fiche} />} fileName={`FT-${fiche.code}.pdf`}>
            {({ loading: pdfLoading }) => (
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50" disabled={pdfLoading}>
                <Download className="w-4 h-4 mr-2" />
                {pdfLoading ? 'Préparation...' : 'PDF'}
              </Button>
            )}
          </PDFDownloadLink>
          <Button onClick={() => navigate(`/recettes/creation/${id}/modifier`)} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Pencil className="w-4 h-4 mr-2" /> Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-royal-600" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <DetailItem icon={<Hash className="w-4 h-4" />} label="Code" value={fiche.code} />
                <DetailItem icon={<MapPin className="w-4 h-4" />} label="Magasin" value={fiche.magasin?.nom || '-'} />
                <DetailItem icon={<Eye className="w-4 h-4" />} label="Rendement" value={`${fiche.rendement} portion(s)`} />
                <DetailItem icon={<Package className="w-4 h-4" />} label="Poids d'une portion" value={`${Number(fiche.poids_portion) || 0} ${fiche.unite_poids_portion || 'gm'}`} />
                {fiche.description ? (
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-500 flex items-center gap-1.5 mb-1"><MessageSquare className="w-4 h-4" /> Description</dt>
                    <dd className="text-sm text-gray-900">{fiche.description}</dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Ingrédients
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Ingrédient</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Unité</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Rend %</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Coût achat net</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Poids net</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Poids brut</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Coût matière</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Rend. cuisson</TableHead>
                      <TableHead className="font-semibold text-gray-600">Commentaire</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((l, i) => (
                      <TableRow key={l.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">{l.ingredient?.nom || '-'}</div>
                          <div className="text-xs text-gray-500 font-mono">{l.ingredient?.code_article || ''}</div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-700">{l.unite?.symbole || l.unite?.nom || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-900">{Number(l.rendement) || 0}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-700">{formatCurrency(Number(l.prix_unitaire))}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-700">{Number(l.poids_net) || 0}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-700">{Number(l.poids_brut) || 0}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-gray-900">{formatCurrency(Number(l.cout_total))}</TableCell>
                        <TableCell className="text-center text-sm">
                          <Badge variant={l.rendement_apres_cuisson ? 'success' : 'secondary'} className="text-xs">
                            {l.rendement_apres_cuisson ? 'Oui' : 'Non'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[150px] truncate">{l.commentaire || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t border-gray-100 p-4 flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Coût total de la recette</div>
                  <div className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(fiche.cout_total || totalCout)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                Coûts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-500">Coût total</div>
                <div className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(fiche.cout_total || totalCout)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Coût unitaire</div>
                <div className="text-lg font-semibold text-gray-900 font-mono">{formatCurrency(fiche.cout_unitaire)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Coût / kg</div>
                <div className="text-lg font-semibold text-gray-900 font-mono">{formatCurrency(fiche.prix_kg)}</div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-500">Rendement</div>
                <div className="text-lg font-semibold text-gray-900">{fiche.rendement} portion(s)</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Ingrédients</div>
                <div className="text-lg font-semibold text-gray-900">{lignes.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button onClick={() => navigate(`/recettes/creation/${id}/modifier`)}
                className="w-full justify-start bg-royal-700 hover:bg-royal-800 text-white">
                <Pencil className="w-4 h-4 mr-2" /> Modifier
              </Button>

              <Button onClick={() => doAction('duplication',
                () => ficheTechniqueService.duplicate(Number(id)),
                'Fiche technique dupliquée avec succès')}
                disabled={actionLoading} variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                Dupliquer
              </Button>

              <Button onClick={() => doAction('activation/désactivation',
                () => ficheTechniqueService.toggle(Number(id)),
                fiche.actif ? 'Fiche technique désactivée' : 'Fiche technique activée')}
                disabled={actionLoading} variant="outline" className={cn(
                  'w-full justify-start border-gray-200 hover:bg-gray-50',
                  fiche.actif ? 'text-red-700' : 'text-emerald-700'
                )}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : fiche.actif ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {fiche.actif ? 'Désactiver' : 'Activer'}
              </Button>

              <PDFDownloadLink document={<FicheTechniquePDF fiche={fiche} />} fileName={`FT-${fiche.code}.pdf`}>
                {({ loading: pdfLoading }) => (
                  <Button variant="outline" disabled={pdfLoading} className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Download className="w-4 h-4 mr-2" />
                    {pdfLoading ? 'Préparation...' : 'Imprimer / PDF'}
                  </Button>
                )}
              </PDFDownloadLink>

              <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => navigate('/recettes/creation')}>
                <FileText className="w-4 h-4 mr-2" /> Toutes les fiches
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-gray-500 flex items-center gap-1.5 mb-1">{icon} {label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
