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
import { pdf, PDFDownloadLink } from '@react-pdf/renderer';
import { TracabilitePDF } from '../components/pdf/TracabilitePDF';
import { TracabiliteListPDF } from '../components/pdf/TracabiliteListPDF';
import { tracabiliteService } from '../services/tracabilite';
import { utilisateurService } from '../services/utilisateur';
import type { Tracabilite } from '../types/tracabilite';
import type { Utilisateur } from '../types/auth';
import { Search, RefreshCw, Eye, Edit3, Trash2, Plus, Package, Filter, Printer, Download } from 'lucide-react';
import { cn } from '../lib/utils';

export function TracabiliteList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const { user } = useAuthStore();

  const [data, setData] = useState<Tracabilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<Tracabilite | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [utilisateurId, setUtilisateurId] = useState('');
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);

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
        sort_by: 'date_tracabilite',
        sort_order: 'desc',
      };
      if (searchTerm) params.search = searchTerm;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      if (utilisateurId && isAdmin) params.utilisateur_id = utilisateurId;

      const res = await tracabiliteService.list(params);
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
  }, [currentPage, searchTerm, pageSize, dateDebut, dateFin, utilisateurId, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isAdmin) {
      utilisateurService.list({ per_page: '500' }).then((res) => {
        if (res.success && res.data?.data) {
          setUtilisateurs(res.data.data);
        }
      }).catch(() => {});
    }
  }, [isAdmin]);

  const handleDownloadListPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: '5000',
        sort_by: 'date_tracabilite',
        sort_order: 'desc',
      };
      if (searchTerm) params.search = searchTerm;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      if (utilisateurId && isAdmin) params.utilisateur_id = utilisateurId;
      const res = await tracabiliteService.list(params);
      if (!res.success || !res.data?.data?.length) {
        toast('Aucune donnée à imprimer', 'error');
        return;
      }
      const blob = await pdf(
        <TracabiliteListPDF
          data={res.data.data}
          filters={{ dateDebut, dateFin, search: searchTerm }}
          total={res.data.data.length}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracabilite-${dateDebut || 'tout'}-${dateFin || 'tout'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Erreur lors de la génération du PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  }, [searchTerm, dateDebut, dateFin, utilisateurId, isAdmin, toast]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await tracabiliteService.delete(deleteTarget.id);
      toast('Traçabilité supprimée avec succès', 'success');
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
    setUtilisateurId('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || dateDebut || dateFin || utilisateurId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traçabilité</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} enregistrement(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} className="border-gray-300">
            <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
          </Button>
          <Button variant="outline" onClick={handleDownloadListPdf} disabled={pdfLoading} className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <Download className="w-4 h-4 mr-2" />
            {pdfLoading ? 'Génération...' : 'PDF'}
          </Button>
          <Button onClick={() => navigate('/stock/tracabilite/creer')} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle traçabilité
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher (n°, lot, produit, utilisateur)..."
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
            {isAdmin && (
              <div>
                <select
                  value={utilisateurId}
                  onChange={(e) => { setUtilisateurId(e.target.value); setCurrentPage(1); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tous les utilisateurs</option>
                  {utilisateurs.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
            )}
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
            <Package className="w-5 h-5 text-royal-700" />
            Liste des traçabilités
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>N° Traçabilité</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead>Date</TableHead>
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
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune traçabilité trouvée</p>
              <p className="text-sm text-gray-400 mt-1">Aucun enregistrement ne correspond à vos critères</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">N° Traçabilité</TableHead>
                      <TableHead className="font-semibold text-gray-600">Lot</TableHead>
                      <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                      <TableHead className="font-semibold text-gray-600">Utilisateur</TableHead>
                      <TableHead className="font-semibold text-gray-600">Département</TableHead>
                      <TableHead className="font-semibold text-gray-600">Client</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Quantité</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
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
                        <TableCell className="font-mono text-sm font-medium text-royal-700">
                          {item.numero_tracabilite}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.lot?.numero_lot || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.lot?.produit?.nom || '-'}</p>
                            <p className="text-xs text-gray-500">{item.lot?.produit?.code_article || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.utilisateur?.full_name || '-'}</TableCell>
                        <TableCell>{item.departement?.nom || '-'}</TableCell>
                        <TableCell>{item.partenaire?.nom || '-'}</TableCell>
                        <TableCell className="text-center font-mono font-medium">
                          {item.quantite}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.date_tracabilite ? new Date(item.date_tracabilite).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-royal-600 hover:text-royal-700 hover:bg-royal-50 rounded-lg"
                              onClick={() => navigate(`/stock/tracabilite/${item.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <PDFDownloadLink
                              document={<TracabilitePDF data={item} />}
                              fileName={`Tracabilite-${item.numero_tracabilite}.pdf`}
                            >
                              {({ loading: pdfLoading }) => (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={pdfLoading}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                                  title={pdfLoading ? 'Génération...' : 'Imprimer PDF'}
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                              )}
                            </PDFDownloadLink>
                            {(isAdmin || item.id_utilisateur === user?.id) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                                  onClick={() => navigate(`/stock/tracabilite/${item.id}/modifier`)}
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
        title="Supprimer la traçabilité"
        message={`Confirmer la suppression de "${deleteTarget?.numero_tracabilite}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
