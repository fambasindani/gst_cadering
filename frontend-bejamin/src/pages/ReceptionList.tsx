import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { bonCommandeService } from '../services/bon-commande';
import type { BonCommande } from '../types/bon-commande';
import {
  Search, RefreshCw, PackagePlus, ArrowRight, Eye,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const statutConfig: Record<string, { label: string; color: string }> = {
  ENVOYÉ: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'REÇU PARTIELLEMENT': { label: 'Reçu partiellement', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  BROUILLON: { label: 'Brouillon', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  REÇU: { label: 'Reçu', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  ANNULE: { label: 'Annulé', color: 'bg-red-100 text-red-800 border-red-200' },
};

export function ReceptionList() {
  const navigate = useNavigate();

  const [data, setData] = useState<BonCommande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: String(pageSize),
        page: String(currentPage),
        statut: 'ENVOYÉ,REÇU PARTIELLEMENT',
      };
      if (searchTerm) params.search = searchTerm;
      const res = await bonCommandeService.list(params);
      if (res.success) {
        setData(res.data.data);
        setTotal(res.data.total);
        setLastPage(res.data.last_page);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentPage, searchTerm, pageSize]);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réceptions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} bon${total > 1 ? 's' : ''} à réceptionner`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher (numéro, partenaire)..."
            className="pl-3 pr-24 border-gray-200 focus:border-royal-500 focus:ring-royal-500"
            value={searchInput}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearchTerm(searchInput); setCurrentPage(1); } }}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="button"
            onClick={() => { setSearchTerm(searchInput); setCurrentPage(1); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-royal-700 hover:bg-royal-800 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Rechercher
          </button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-600" />
            Bons de commande à réceptionner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">N° commande</TableHead>
                    <TableHead className="font-semibold text-gray-600">Partenaire</TableHead>
                    <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Total HT</TableHead>
                    <TableHead className="text-center w-20 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-6 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-20 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <PackagePlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune réception en attente</p>
              <p className="text-sm mt-1">Les bons de commande envoyés apparaîtront ici</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">N° commande</TableHead>
                      <TableHead className="font-semibold text-gray-600">Partenaire</TableHead>
                      <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Total HT</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="text-center w-20 font-semibold text-gray-600">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((b, i) => {
                      const sc = statutConfig[b.statut] || { label: b.statut, color: 'bg-gray-100 text-gray-600' };
                      const totalLignes = (b.lignes || []).reduce((s, l) => s + l.quantite_commandee * l.prix_unitaire_ht, 0);
                      return (
                        <TableRow key={b.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="font-mono text-sm font-medium text-royal-700">{b.numero_commande}</TableCell>
                          <TableCell className="text-sm text-gray-900">{b.partenaire?.nom || '-'}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs font-medium', sc.color)}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-900">{formatCurrency(totalLignes)}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {b.date_commande ? new Date(b.date_commande).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => navigate(`/bon-commande/${b.id}`)}
                                className="p-1.5 rounded text-gray-500 hover:text-royal-700 hover:bg-royal-50 transition-colors" title="Détails">
                                <Eye className="w-4 h-4" />
                              </button>
                              <Button size="sm" onClick={() => navigate(`/reception/${b.id}`)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                                <ArrowRight className="w-3.5 h-3.5 mr-1" /> Réceptionner
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                lastPage={lastPage}
                total={total}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
