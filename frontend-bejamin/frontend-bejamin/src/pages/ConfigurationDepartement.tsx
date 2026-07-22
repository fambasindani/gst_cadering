import { useEffect, useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { SlidePanel } from '../components/ui/SlidePanel';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { departementService } from '../services/departement';
import type { Departement } from '../types/departement';
import {
  Plus, Search, Pencil, Trash2, RefreshCw, Globe, CheckCircle, XCircle, Building2,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ConfigurationDepartement() {
  const { toast } = useToast();

  const [data, setData] = useState<Departement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [villeFilter, setVilleFilter] = useState('_all');
  const [villes, setVilles] = useState<{ id: number; nom: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Departement | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Departement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    code: '',
    id_ville: '',
    actif: true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        per_page: String(pageSize),
        page: String(currentPage),
        sort_by: 'id',
        sort_order: 'desc',
      };
      if (searchTerm) params.search = searchTerm;
      if (villeFilter && villeFilter !== '_all') params.ville_id = villeFilter;

      const res = await departementService.list(params);
      if (res.success) {
        setData(res.data.data);
        setTotal(res.data.total);
        setLastPage(res.data.last_page);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, villeFilter, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    departementService.getVilles({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setVilles(res.data.data); })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', code: '', id_ville: '', actif: true });
    setFieldErrors({});
    setPanelOpen(true);
  };

  const openEdit = (dep: Departement) => {
    setEditing(dep);
    setForm({
      nom: dep.nom,
      code: dep.code || '',
      id_ville: String(dep.id_ville),
      actif: dep.actif,
    });
    setFieldErrors({});
    setPanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      setSaving(true);
      if (editing) {
        await departementService.update(editing.id, form);
        toast('Département modifié avec succès', 'success');
      } else {
        await departementService.create(form as any);
        toast('Département créé avec succès', 'success');
      }
      setPanelOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(error.errors)) {
          fieldErrors[field] = messages[0];
        }
        setFieldErrors(fieldErrors);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await departementService.delete(deleteTarget.id);
      toast('Département supprimé avec succès', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Départements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} département${total > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setVilleFilter('_all'); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={openCreate} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau département
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher un département..."
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
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Globe className="w-4 h-4 text-gray-400" />
          <Select value={villeFilter} onValueChange={(v) => { setVilleFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44 h-9 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Toutes les villes</SelectItem>
              {villes.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Liste des départements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                    <TableHead className="font-semibold text-gray-600">Code</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-600">Ville</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-36 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-16 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell><div className="h-8 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun département trouvé</p>
              <p className="text-sm mt-1">Commencez par créer un nouveau département</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                      <TableHead className="font-semibold text-gray-600">Code</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-gray-600">Ville</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((d, i) => (
                      <TableRow key={d.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900">{d.nom}</TableCell>
                        <TableCell><span className="text-sm font-mono text-gray-600">{d.code || '-'}</span></TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-600">{d.ville?.nom || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            d.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600',
                          )}>
                            {d.actif ? <><CheckCircle className="w-3 h-3 mr-1" /> Actif</> : <><XCircle className="w-3 h-3 mr-1" /> Inactif</>}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(d)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Modifier">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(d)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination currentPage={currentPage} lastPage={lastPage} total={total} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange} />
            </>
          )}
        </CardContent>
      </Card>

      <SlidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Modifier le département' : 'Nouveau département'}
        width="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-white/80">Nom *</Label>
            <Input
              value={form.nom}
              onChange={(e) => { setForm((f) => ({ ...f, nom: e.target.value })); setFieldErrors((f) => ({ ...f, nom: '' })); }}
              placeholder="Nom du département"
              className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11",
                fieldErrors.nom ? 'border-red-400' : 'border-royal-600')}
            />
            {fieldErrors.nom && <p className="text-red-400 text-xs mt-1">{fieldErrors.nom}</p>}
          </div>

          <div>
            <Label className="text-sm font-medium text-white/80">Code</Label>
            <Input
              value={form.code}
              onChange={(e) => { setForm((f) => ({ ...f, code: e.target.value })); setFieldErrors((f) => ({ ...f, code: '' })); }}
              placeholder="Code (optionnel)"
              className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11",
                fieldErrors.code ? 'border-red-400' : 'border-royal-600')}
            />
            {fieldErrors.code && <p className="text-red-400 text-xs mt-1">{fieldErrors.code}</p>}
          </div>

          <div>
            <Label className="text-sm font-medium text-white/80">Ville *</Label>
            <Select value={form.id_ville} onValueChange={(v) => { setForm((f) => ({ ...f, id_ville: v })); setFieldErrors((f) => ({ ...f, id_ville: '' })); }}>
              <SelectTrigger className={cn("mt-1.5 bg-royal-700 text-white focus:border-royal-500 focus:ring-royal-500 h-11",
                fieldErrors.id_ville ? 'border-red-400' : 'border-royal-600')}>
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
              <SelectContent>
                {villes.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.id_ville && <p className="text-red-400 text-xs mt-1">{fieldErrors.id_ville}</p>}
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
                className="w-5 h-5 text-royal-500 border-royal-400 rounded focus:ring-royal-500 bg-royal-700"
              />
              <div>
                <span className="text-sm font-medium text-white">Département actif</span>
                <p className="text-xs text-white/50">Décochez pour désactiver</p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-royal-700">
            <Button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="h-11 px-6 border border-royal-600 bg-royal-700 text-white/80 hover:bg-royal-600 hover:text-white rounded-lg"
            >
              Annuler
            </Button>
            <Button
              type="submit" disabled={saving}
              className="bg-royal-600 hover:bg-royal-500 text-white"
            >
              {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le département"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.nom}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
