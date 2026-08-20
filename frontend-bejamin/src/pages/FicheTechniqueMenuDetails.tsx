import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/useToast';
import { ficheTechniqueMenuService } from '../services/fiche-technique-menu';
import type { FicheTechniqueMenu } from '../types/fiche-technique-menu';
import {
  ArrowLeft, Loader2, Pencil, FileBarChart, Hash, CalendarDays, CalendarRange,
  Landmark, MapPin, UtensilsCrossed, Layers,
} from 'lucide-react';
import { formatCurrency } from '../lib/format';

export function FicheTechniqueMenuDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [menu, setMenu] = useState<FicheTechniqueMenu | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await ficheTechniqueMenuService.get(Number(id));
      if (res.success) setMenu(res.data);
    } catch {
      toast('Fiche technique non trouvée', 'error');
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

  if (!menu) return null;

  const nbItems = (menu.parties || []).reduce((s, p) => s + (p.items?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/recettes/fiche-technique')} className="flex items-center gap-2 text-gray-600 hover:text-royal-700 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{menu.nom}</h1>
              <Badge variant="secondary" className="font-mono">{menu.code}</Badge>
              <Badge variant={menu.actif ? 'success' : 'secondary'}>{menu.actif ? 'Actif' : 'Inactif'}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {menu.parties?.length || 0} partie(s) · {nbItems} item(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/recettes/fiche-technique/${menu.id}/modifier`)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Pencil className="w-4 h-4 mr-1.5" /> Modifier
          </Button>
          <Button onClick={() => navigate(`/recettes/rapport-ft?menu=${menu.id}`)} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <FileBarChart className="w-4 h-4 mr-1.5" /> Générer un rapport
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-royal-50"><CalendarDays className="w-4 h-4 text-royal-700" /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Cycle</p>
                <p className="text-base font-bold text-gray-900">{menu.cycle || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50"><CalendarRange className="w-4 h-4 text-indigo-700" /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Périodicité</p>
                <p className="text-base font-bold text-gray-900">{menu.periodicite || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50"><Hash className="w-4 h-4 text-emerald-700" /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Validité</p>
                <p className="text-base font-bold text-gray-900">{menu.validite || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50"><Landmark className="w-4 h-4 text-amber-700" /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Client</p>
                <p className="text-base font-bold text-gray-900">{menu.partenaire?.nom || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-50"><MapPin className="w-4 h-4 text-sky-700" /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Magasin</p>
                <p className="text-base font-bold text-gray-900">{menu.magasin?.nom || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><Layers className="w-4 h-4 text-purple-700" /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Parties</p>
                <p className="text-base font-bold text-gray-900">{menu.parties?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {menu.description && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-sm text-gray-600">{menu.description}</CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {(menu.parties || []).map((p) => {
          const somme = (p.items || []).reduce((s, i) => s + (Number(i.pourcentage) || 0), 0);
          return (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-royal-700" />
                  {p.nom}
                </CardTitle>
                <Badge variant={Math.round(somme) === 100 ? 'success' : 'warning'}>{somme} %</Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left font-semibold text-gray-600 px-4 py-2">Recette / Produit</th>
                        <th className="text-center font-semibold text-gray-600 px-4 py-2">%</th>
                        <th className="text-right font-semibold text-gray-600 px-4 py-2">Coût / passager</th>
                        <th className="text-right font-semibold text-gray-600 px-4 py-2">Coût / 100 pass.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(p.items || []).map((i) => {
                        const coutUnitaire = i.fiche_technique
                          ? Number(i.fiche_technique.cout_unitaire)
                          : (i.produit ? Number(i.produit.prix_unitaire ?? 0) : 0);
                        return (
                          <tr key={i.id} className="border-t border-gray-100 hover:bg-royal-50/50 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-gray-900">{i.designation || i.fiche_technique?.nom || i.produit?.nom || '-'}</div>
                              {(i.fiche_technique || i.produit) && (
                                <div className="text-xs text-gray-500 font-mono">
                                  {i.fiche_technique ? i.fiche_technique.code : i.produit?.code_article}
                                  {i.produit && <span className="ml-2 text-orange-600 font-medium">Produit</span>}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono text-gray-700">{i.pourcentage}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                              {formatCurrency(coutUnitaire * (Number(i.pourcentage) || 0) / 100)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-medium text-gray-900">
                              {formatCurrency(coutUnitaire * (Number(i.pourcentage) || 0))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
