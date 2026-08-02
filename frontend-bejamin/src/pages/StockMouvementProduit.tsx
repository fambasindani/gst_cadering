import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { produitService } from '../services/produit';
import type { Produit } from '../types/produit';
import {
  Search, RefreshCw, Eye, Package,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function StockMouvementProduit() {
  const navigate = useNavigate();

  const [data, setData] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: String(pageSize),
        page: String(currentPage),
      };
      if (searchTerm) params.search = searchTerm;
      const res = await produitService.list(params);
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
  }, [pageSize, currentPage, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const goToDetails = (p: Produit) => {
    const params = new URLSearchParams();
    if (dateDebut) params.set('date_debut', dateDebut);
    if (dateFin) params.set('date_fin', dateFin);
    const qs = params.toString();
    navigate(`/stock/mouvement-produit/${p.id}${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mouvements par produit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulter les entrées et sorties d'un produit sur une période
          </p>
        </div>
        <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setDateDebut(''); setDateFin(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Search className="w-5 h-5 text-royal-600" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1.5">
              <Label className="text-xs text-gray-500">Nom du produit</Label>
              <Input
                placeholder="Rechercher par nom du produit..."
                className="border-gray-200 focus:border-royal-500 focus:ring-royal-500"
                value={searchInput}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Date début</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="border-gray-200 focus:border-royal-500 focus:ring-royal-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Date fin</Label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="border-gray-200 focus:border-royal-500 focus:ring-royal-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={handleSearch} className="bg-royal-700 hover:bg-royal-800 text-white">
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-royal-600" />
            Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Code</TableHead>
                    <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-600">Catégorie</TableHead>
                    <TableHead className="font-semibold text-gray-600">Unité</TableHead>
                    <TableHead className="text-center w-24 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-40 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-20 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun produit trouvé</p>
              <p className="text-sm mt-1">Modifiez vos critères de recherche</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Code</TableHead>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Catégorie</TableHead>
                      <TableHead className="font-semibold text-gray-600">Unité</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((p) => (
                      <TableRow key={p.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm text-gray-700">{p.code_article || '-'}</TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">{p.nom}</TableCell>
                        <TableCell className="text-sm text-gray-600">{p.categorie?.nom || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{p.unite ? `${p.unite.nom} (${p.unite.symbole})` : '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => goToDetails(p)}
                            className="border-royal-200 text-royal-700 hover:bg-royal-50"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
