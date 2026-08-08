import { useEffect, useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { SlidePanel } from '../components/ui/SlidePanel';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { tauxConversionService } from '../services/taux-conversion';
import type { TauxConversion } from '../types/taux-conversion';
import {
  Plus, Search, Pencil, Trash2, RefreshCw, Banknote, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ConfigurationTauxConversion() {
  const { toast } = useToast();

  const [data, setData] = useState<TauxConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tauxActuel, setTauxActuel] = useState<TauxConversion | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<TauxConversion | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TauxConversion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    code_devise: 'CDF',
    nom: 'Franc Congolais',
    taux: '',
    date_application: new Date().toISOString().slice(0, 10),
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

      const [res, actuel] = await Promise.all([
        tauxConversionService.list(params),
        tauxConversionService.getActuel(),
      ]);
      if (res.success) {
        setData(res.data.data);
        setTotal(res.data.total);
        setLastPage(res.data.last_page);
      }
      if (actuel.success) setTauxActuel(actuel.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      code_devise: 'CDF',
      nom: 'Franc Congolais',
      taux: '',
      date_application: new Date().toISOString().slice(0, 10),
      actif: true,
    });
    setFieldErrors({});
    setPanelOpen(true);
  };

  const openEdit = (t: TauxConversion) => {
    setEditing(t);
    setForm({
      code_devise: t.code_devise,
      nom: t.nom || '',
      taux: String(t.taux),
      date_application: t.date_application || new Date().toISOString().slice(0, 10),
      actif: t.actif,
    });
    setFieldErrors({});
    setPanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      setSaving(true);
      const payload = {
        ...form,
        taux: String(form.taux).replace(',', '.'),
      };
      if (editing) {
        await tauxConversionService.update(editing.id, payload as any);
        toast('Taux de conversion modifié avec succès', 'success');
      } else {
        await tauxConversionService.create(payload as any);
        toast('Taux de conversion créé avec succès', 'success');
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
      await tauxConversionService.delete(deleteTarget.id);
      toast('Taux de conversion supprimé avec succès', 'success');
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
          <h1 className="text-2xl font-bold text-gray-900">Taux de change</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${total} taux enregistré${total > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); fetchData(); }} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={openCreate} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau taux
          </Button>
        </div>
      </div>

      {tauxActuel ? (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-royal-700 to-royal-600 text-white">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/70">Taux de change actuel</p>
                <p className="text-xl font-bold font-mono">1 USD = {tauxActuel.taux.toLocaleString('fr-FR')} {tauxActuel.code_devise}</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/15">
              Depuis le {tauxActuel.date_application ? new Date(tauxActuel.date_application).toLocaleDateString('fr-FR') : '-'}
            </span>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher un taux..."
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
          <CardTitle className="text-lg font-semibold">Historique des taux de conversion</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Devise</TableHead>
                    <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Taux (1 USD =)</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date d'application</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-12 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-20 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-16 bg-gray-200 rounded-full mx-auto" /></TableCell>
                      <TableCell><div className="h-8 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Banknote className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun taux de conversion</p>
              <p className="text-sm mt-1">Enregistrez le taux de change de votre monnaie locale</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Devise</TableHead>
                      <TableHead className="font-semibold text-gray-600">Nom</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Taux (1 USD =)</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date d'application</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Statut</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((d, i) => (
                      <TableRow key={d.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-medium text-gray-900 font-mono">{d.code_devise}</TableCell>
                        <TableCell>{d.nom || '-'}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-gray-900">
                          {d.taux.toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {d.date_application ? new Date(d.date_application).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
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
        title={editing ? 'Modifier le taux de conversion' : 'Nouveau taux de conversion'}
        width="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-white/80">Code devise *</Label>
            <Input
              value={form.code_devise}
              onChange={(e) => { setForm((f) => ({ ...f, code_devise: e.target.value.toUpperCase() })); setFieldErrors((f) => ({ ...f, code_devise: '' })); }}
              placeholder="EX: CDF"
              maxLength={10}
              className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11 uppercase",
                fieldErrors.code_devise ? 'border-red-400' : 'border-royal-600')}
            />
            {fieldErrors.code_devise && <p className="text-red-400 text-xs mt-1">{fieldErrors.code_devise}</p>}
          </div>

          <div>
            <Label className="text-sm font-medium text-white/80">Nom</Label>
            <Input
              value={form.nom}
              onChange={(e) => { setForm((f) => ({ ...f, nom: e.target.value })); setFieldErrors((f) => ({ ...f, nom: '' })); }}
              placeholder="Franc Congolais"
              className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11",
                fieldErrors.nom ? 'border-red-400' : 'border-royal-600')}
            />
            {fieldErrors.nom && <p className="text-red-400 text-xs mt-1">{fieldErrors.nom}</p>}
          </div>

          <div>
            <Label className="text-sm font-medium text-white/80">Taux (1 USD = ?) *</Label>
            <Input
              type="number" step="0.01" min="0.01"
              value={form.taux}
              onChange={(e) => { setForm((f) => ({ ...f, taux: e.target.value })); setFieldErrors((f) => ({ ...f, taux: '' })); }}
              placeholder="2300"
              className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11",
                fieldErrors.taux ? 'border-red-400' : 'border-royal-600')}
            />
            {fieldErrors.taux && <p className="text-red-400 text-xs mt-1">{fieldErrors.taux}</p>}
            <p className="text-xs text-white/50 mt-1">Ex. : 1 USD = 2300 CDF → saisissez 2300</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-white/80">Date d'application *</Label>
            <Input
              type="date"
              value={form.date_application}
              onChange={(e) => { setForm((f) => ({ ...f, date_application: e.target.value })); setFieldErrors((f) => ({ ...f, date_application: '' })); }}
              className={cn("mt-1.5 bg-royal-700 text-white placeholder:text-white/40 focus:border-royal-500 focus:ring-royal-500 h-11",
                fieldErrors.date_application ? 'border-red-400' : 'border-royal-600')}
            />
            {fieldErrors.date_application && <p className="text-red-400 text-xs mt-1">{fieldErrors.date_application}</p>}
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
                <span className="text-sm font-medium text-white">Taux actif</span>
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
        title="Supprimer le taux de conversion"
        message={`Êtes-vous sûr de vouloir supprimer ce taux (${deleteTarget?.taux} ${deleteTarget?.code_devise}) ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
