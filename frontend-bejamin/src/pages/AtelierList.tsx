import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuthStore } from '../store/authStore';
import { atelierService } from '../services/atelier';
import type { AtelierTracabilite } from '../types/atelier';
import { Search, RefreshCw, Eye, Edit3, Trash2, Factory, Filter, Plus, FileDown } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { AtelierPdfDocument } from '../components/pdf/AtelierPdfDocument';
import { cn } from '../lib/utils';

export function AtelierList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const { user } = useAuthStore();

  const [data, setData] = useState<AtelierTracabilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<AtelierTracabilite | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [typeAtelier, setTypeAtelier] = useState('');

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: String(pageSize),
        page: String(currentPage),
        sort_by: 'date_operation',
        sort_order: 'desc',
      };
      if (searchTerm) params.search = searchTerm;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      if (typeAtelier) params.type_atelier = typeAtelier;

      const res = await atelierService.list(params);
      if (res.success) {
        setData(res.data.data);
        setTotal(res.data.total);
        setLastPage(res.data.last_page);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, pageSize, dateDebut, dateFin, typeAtelier]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await atelierService.delete(deleteTarget.id);
      toast('Atelier supprimé avec succès', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setDateDebut('');
    setDateFin('');
    setTypeAtelier('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || dateDebut || dateFin || typeAtelier;

  const handlePrintPdf = async (type: 'DRESSAGE' | 'MONTAGE') => {
    setPdfLoading(true);
    try {
      const params: Record<string, string> = { per_page: '5000', type_atelier: type };
      if (searchTerm) params.search = searchTerm;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const res = await atelierService.list(params);
      if (!res.success || !res.data?.data?.length) {
        toast(`Aucune donnée ${type} à imprimer`, 'error');
        return;
      }
      const blob = await pdf(<AtelierPdfDocument data={res.data.data} type={type} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atelier-${type.toLowerCase()}-${dateDebut || 'tout'}-${dateFin || 'tout'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Erreur lors de la génération du PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const typeBadge = (type: string) => {
    const isDressage = type === 'DRESSAGE';
    return (
      <span className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        isDressage ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
      )}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atelier</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} enregistrement(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} className="border-gray-300">
            <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
          </Button>
          <Button variant="outline" onClick={() => handlePrintPdf('DRESSAGE')} disabled={pdfLoading} className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <FileDown className="w-4 h-4 mr-2" /> {pdfLoading ? '...' : 'PDF Dressage'}
          </Button>
          <Button variant="outline" onClick={() => handlePrintPdf('MONTAGE')} disabled={pdfLoading} className="border-purple-300 text-purple-700 hover:bg-purple-50">
            <FileDown className="w-4 h-4 mr-2" /> {pdfLoading ? '...' : 'PDF Montage'}
          </Button>
          <Button onClick={() => navigate('/stock/atelier/creer')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Nouvel atelier
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher (compagnie, opérateur, lot, code)..."
                value={searchInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchTerm(searchInput);
                    setCurrentPage(1);
                  }
                }}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <select
                value={typeAtelier}
                onChange={(e) => { setTypeAtelier(e.target.value); setCurrentPage(1); }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Tous les types</option>
                <option value="DRESSAGE">DRESSAGE</option>
                <option value="MONTAGE">MONTAGE</option>
              </select>
            </div>
            <div>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => { setDateDebut(e.target.value); setCurrentPage(1); }}
                placeholder="Date début"
              />
            </div>
            <div>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => { setDateFin(e.target.value); setCurrentPage(1); }}
                placeholder="Date fin"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => { setSearchTerm(searchInput); setCurrentPage(1); }}>
              <Filter className="w-4 h-4 mr-1" /> Filtrer
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-gray-500">
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-royal-700" />
            Liste des ateliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Compagnie</TableHead>
                    <TableHead>Opérateur</TableHead>
                    <TableHead>Code prestation</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Cycle/Classe</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 bg-gray-200 rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Factory className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun atelier trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Aucun enregistrement ne correspond à vos critères</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Type</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Compagnie</TableHead>
                      <TableHead className="font-semibold text-gray-600">Opérateur</TableHead>
                      <TableHead className="font-semibold text-gray-600">Code prestation</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Qté</TableHead>
                      <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                      <TableHead className="font-semibold text-gray-600">Cycle/Classe</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, i) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          'hover:bg-royal-50/50 transition-colors',
                          i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        )}
                      >
                        <TableCell>{typeBadge(item.type_atelier)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(item.date_operation)}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {item.partenaire?.nom || '-'}
                        </TableCell>
                        <TableCell>{item.utilisateur?.full_name || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.code_prestation || '-'}
                        </TableCell>
                        <TableCell className="text-center font-mono font-medium">
                          {item.quantite ?? '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.lot?.numero_lot || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.cycle_classe || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-royal-600 hover:text-royal-700 hover:bg-royal-50 rounded-lg"
                              onClick={() => navigate(`/stock/atelier/${item.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(isAdmin || item.id_utilisateur === user?.id) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                                  onClick={() => navigate(`/stock/atelier/${item.id}/modifier`)}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                  onClick={() => setDeleteTarget(item)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'atelier"
        message={`Confirmer la suppression de l'atelier "${deleteTarget?.type_atelier} — ${deleteTarget?.partenaire?.nom || ''}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
