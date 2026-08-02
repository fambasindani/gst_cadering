import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { produitService } from '../services/produit';
import { mouvementStockService } from '../services/mouvement-stock';
import type { Produit } from '../types/produit';
import type { MouvementStock } from '../types/validation';
import {
  ArrowLeft, Package, ArrowDownCircle, ArrowUpCircle, TrendingUp,
  Building2, Scale, Tag, FileText, Calendar, Hash, Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

export function StockMouvementProduitDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [produit, setProduit] = useState<Produit | null>(null);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateDebut, setDateDebut] = useState(searchParams.get('date_debut') || '');
  const [dateFin, setDateFin] = useState(searchParams.get('date_fin') || '');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {
        produit_id: id,
        per_page: '500',
        sort_by: 'date_mouvement',
        sort_order: 'desc',
      };
      if (searchParams.get('date_debut')) params.date_debut = searchParams.get('date_debut') as string;
      if (searchParams.get('date_fin')) params.date_fin = searchParams.get('date_fin') as string;
      const [pRes, mRes] = await Promise.all([
        produitService.get(Number(id)),
        mouvementStockService.list(params),
      ]);
      if (pRes.success) setProduit(pRes.data);
      if (mRes.success) setMouvements(mRes.data.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [id, searchParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyDates = () => {
    const params = new URLSearchParams();
    if (dateDebut) params.set('date_debut', dateDebut);
    if (dateFin) params.set('date_fin', dateFin);
    setSearchParams(params);
  };

  const totalEntrees = mouvements
    .filter((m) => m.type_mouvement?.sens === 1)
    .reduce((sum, m) => sum + m.quantite, 0);
  const totalSorties = mouvements
    .filter((m) => m.type_mouvement?.sens === -1)
    .reduce((sum, m) => sum + m.quantite, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Produit non trouvé</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/stock/mouvement-produit')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  const historique = produit.historique_prix || produit.historiquePrix || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/stock/mouvement-produit')}
            className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{produit.nom}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Code article: <span className="font-mono font-medium text-gray-700">{produit.code_article || '-'}</span>
            </p>
          </div>
        </div>
        <Badge className="bg-royal-50 text-royal-700 border border-royal-200 text-xs font-medium">
          Stock total : <strong className="ml-1">{produit.stock_total ?? '-'}</strong>
        </Badge>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Date début</Label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                className="border-gray-200 focus:border-royal-500 focus:ring-royal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Date fin</Label>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                className="border-gray-200 focus:border-royal-500 focus:ring-royal-500" />
            </div>
            <Button onClick={applyDates} className="bg-royal-700 hover:bg-royal-800 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Appliquer la période
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-royal-600" />
                  Entrées et sorties
                  {searchParams.get('date_debut') || searchParams.get('date_fin') ? (
                    <span className="text-xs font-normal text-gray-500">
                      ({searchParams.get('date_debut') || '...'} → {searchParams.get('date_fin') || '...'})
                    </span>
                  ) : null}
                </CardTitle>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <ArrowDownCircle className="w-4 h-4" /> Entrées: <strong>{totalEntrees}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-red-600 font-medium">
                    <ArrowUpCircle className="w-4 h-4" /> Sorties: <strong>{totalSorties}</strong>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {mouvements.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">Aucun mouvement sur cette période</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Date</TableHead>
                        <TableHead className="font-semibold text-gray-600">Type</TableHead>
                        <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                        <TableHead className="hidden md:table-cell font-semibold text-gray-600">Magasin</TableHead>
                        <TableHead className="hidden lg:table-cell font-semibold text-gray-600">Partenaire</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Quantité</TableHead>
                        <TableHead className="hidden md:table-cell font-semibold text-gray-600">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mouvements.map((m, i) => {
                        const sens = m.type_mouvement?.sens ?? 1;
                        const isEntree = sens === 1;
                        return (
                          <TableRow key={m.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                            <TableCell className="text-sm text-gray-700">
                              {m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-'}
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                'inline-flex items-center gap-1 text-xs font-medium',
                                isEntree ? 'text-emerald-700' : 'text-red-600',
                              )}>
                                {isEntree ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                                {m.type_mouvement?.libelle || (isEntree ? 'Entrée' : 'Sortie')}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-gray-700">{m.lot?.numero_lot || '-'}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-600">{m.lot?.magasin?.nom || m.magasin?.nom || '-'}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-gray-600">{m.partenaire?.nom || '-'}</TableCell>
                            <TableCell className={cn('text-right font-mono text-sm font-semibold', isEntree ? 'text-emerald-700' : 'text-red-600')}>
                              {isEntree ? '+' : '-'}{m.quantite}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-600">{m.statut_validation}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-royal-600" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Hash className="w-4 h-4" />
                <span className="text-gray-500">Code :</span>
                <span className="font-mono font-medium text-gray-900">{produit.code_article || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="w-4 h-4" />
                <span className="text-gray-500">Catégorie :</span>
                <span className="font-medium text-gray-900">{produit.categorie?.nom || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Scale className="w-4 h-4" />
                <span className="text-gray-500">Unité :</span>
                <span className="font-medium text-gray-900">{produit.unite ? `${produit.unite.nom} (${produit.unite.symbole})` : '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="w-4 h-4" />
                <span className="text-gray-500">Fournisseur :</span>
                <span className="font-medium text-gray-900">{produit.partenairePrincipal?.nom || produit.partenaire_principal?.nom || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-royal-600" />
                Historique des prix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {historique.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">Aucun historique de prix</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Date</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Prix achat HT</TableHead>
                        <TableHead className="hidden sm:table-cell font-semibold text-gray-600">Devise</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historique.map((h, i) => (
                        <TableRow key={h.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="text-sm text-gray-700">
                            {h.date_application ? new Date(h.date_application).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                            {formatCurrency(h.prix_achat_ht)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-gray-700">{h.devise?.code || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
