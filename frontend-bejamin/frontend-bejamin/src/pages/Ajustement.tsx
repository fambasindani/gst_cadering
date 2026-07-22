import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '../components/ui/pagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { useToast } from '../hooks/useToast';
import { periodeInventaireService } from '../services/periode-inventaire';
import { inventaireService } from '../services/inventaire';
import type { PeriodeInventaire, Ajustement } from '../types/validation';
import {
  Search, RefreshCw, FileText, Package, TrendingUp, TrendingDown, Minus, Loader2, Calendar,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

export function Ajustement() {
  const { toast } = useToast();

  const [periodes, setPeriodes] = useState<PeriodeInventaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState<PeriodeInventaire | null>(null);
  const [ajustements, setAjustements] = useState<Ajustement[]>([]);
  const [totalEcart, setTotalEcart] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { statut: 'CLOTURE', per_page: '20' };
      if (searchTerm) params.search = searchTerm;
      const res = await periodeInventaireService.list(params);
      if (res.success) {
        setPeriodes(res.data.data);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async (periode: PeriodeInventaire) => {
    setSelectedPeriode(periode);
    setGenerating(true);
    setModalOpen(true);
    try {
      const res = await inventaireService.generateAjustements(periode.id);
      if (res.success) {
        setAjustements(res.data?.ajustements ?? []);
        setTotalEcart(res.data?.total_ecart ?? 0);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la génération des ajustements', 'error');
      setModalOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  const getEcartBadge = (ecart: number) => {
    if (ecart > 0) {
      return <Badge variant="success" className="gap-1"><TrendingUp className="w-3 h-3" />+{ecart}</Badge>;
    }
    if (ecart < 0) {
      return <Badge variant="destructive" className="gap-1"><TrendingDown className="w-3 h-3" />{ecart}</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Minus className="w-3 h-3" />0</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajustements</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${periodes.length} période${periodes.length > 1 ? 's' : ''} clôturée${periodes.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher une période..."
            className="pl-3 pr-24 border-gray-200 focus:border-royal-500 focus:ring-royal-500"
            value={searchInput}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearchTerm(searchInput); } }}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="button"
            onClick={() => { setSearchTerm(searchInput); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-royal-700 hover:bg-royal-800 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Rechercher
          </button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Périodes clôturées</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Libellé</TableHead>
                    <TableHead className="font-semibold text-gray-600">Ville</TableHead>
                    <TableHead className="font-semibold text-gray-600">Période</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Total écart</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-20 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-32 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : periodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune période clôturée</p>
              <p className="text-sm mt-1">Les périodes clôturées apparaîtront ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Libellé</TableHead>
                    <TableHead className="font-semibold text-gray-600">Ville</TableHead>
                    <TableHead className="font-semibold text-gray-600">Période</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Total écart</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodes.map((p, i) => (
                    <TableRow key={p.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <TableCell className="font-medium text-gray-900">{p.libelle}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.ville?.nom || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(p.date_debut).toLocaleDateString('fr-FR')} - {new Date(p.date_fin).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                        {p.inventaires ? formatCurrency(p.inventaires.reduce((s, inv) => s + (inv.ecart || 0), 0), 'EUR') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerate(p)}
                          className="border-royal-200 text-royal-700 hover:bg-royal-50"
                        >
                          <FileText className="w-4 h-4 mr-1.5" />
                          Voir ajustements
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Ajustements - ${selectedPeriode?.libelle || ''}`}
        maxWidth="2xl"
      >
        {generating ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-royal-700 mb-3" />
            <p className="text-sm">Génération des ajustements en cours...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-royal-50 rounded-lg border border-royal-200">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-royal-700" />
                <span className="text-sm font-medium text-gray-700">Total écart</span>
              </div>
              <span className={cn(
                'text-lg font-bold font-mono',
                totalEcart > 0 ? 'text-green-600' : totalEcart < 0 ? 'text-red-600' : 'text-gray-600',
              )}>
                {formatCurrency(totalEcart, 'EUR')}
              </span>
            </div>

            {ajustements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p>Aucun ajustement à générer</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock théorique</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Stock physique</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Écart</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ajustements.map((aj, idx) => (
                      <TableRow key={idx} className={cn(idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">{aj.produit}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">{aj.stock_theorique}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">{aj.stock_physique}</TableCell>
                        <TableCell className="text-center">{getEcartBadge(aj.ecart)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
