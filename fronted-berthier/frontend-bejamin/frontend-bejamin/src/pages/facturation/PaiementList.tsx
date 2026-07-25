import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { DataTablePagination } from '../../components/ui/DataTablePagination';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import { SlidePanel } from '../../components/ui/SlidePanel';
import { useToast } from '../../hooks/useToast';
import { paiementService } from '../../services/paiement';
import { factureService } from '../../services/facture';
import type { Paiement } from '../../types/facturation';
import { formatCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';
import {
  RefreshCw, Plus, Loader2, Trash2, DollarSign, CreditCard,
} from 'lucide-react';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

function formatDate(d: string | null | undefined): string {
  if (!d) return '-';
  const p = d.split('T')[0] || d;
  const [y, m, day] = p.split('-');
  return `${day}/${m}/${y}`;
}

const modePaiementLabels: Record<string, string> = {
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  ESPECES: 'Espèces',
  CARTE: 'Carte',
  AUTRE: 'Autre',
};

export function PaiementList() {
  const { toast } = useToast();

  const [data, setData] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<Paiement | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [factures, setFactures] = useState<{ id: number; numero_facture: string; client?: { nom: string } | null }[]>([]);

  const [form, setForm] = useState({
    id_facture: '', montant: '', date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: '', reference: '', commentaire: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage) };
      const res = await paiementService.list(params);
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
  }, [currentPage, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreatePanel = async () => {
    setForm({ id_facture: '', montant: '', date_paiement: new Date().toISOString().split('T')[0], mode_paiement: '', reference: '', commentaire: '' });
    setFieldErrors({});
    try {
      const res = await paiementService.list({ per_page: '200' });
      if (res.success) {
        const allFactures = res.data.data.map(p => p.facture).filter(Boolean) as { id: number; numero_facture: string; client?: { nom: string } | null }[];
        setFactures(allFactures);
      }
    } catch {
      try {
        const r = await factureService.list({ per_page: '200' });
        if (r.success) setFactures(r.data.data.map(f => ({ id: f.id, numero_facture: f.numero_facture, client: f.client })));
      } catch {}
    }
    setPanelOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFieldErrors({});
    try {
      await paiementService.create(form as never);
      toast('Paiement enregistré', 'success');
      setPanelOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]>; message?: string };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(error.errors)) flat[k] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        setFieldErrors(flat);
      }
      toast(error.message || "Erreur d'enregistrement", 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await paiementService.delete(deleteTarget.id);
      toast('Paiement supprimé', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    }
  };

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const LabelIcon = ({ children, required, error }: { children: React.ReactNode; required?: boolean; error?: string }) => (
    <Label className={cn('flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-white', error ? 'text-red-400' : 'text-white/80')}>
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} paiement${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={openCreatePanel} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau paiement
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Liste des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Facture</TableHead>
                    <TableHead className="font-semibold text-gray-600">Client</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Mode</TableHead>
                    <TableHead className="font-semibold text-gray-600">Référence</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                    <TableHead className="text-center w-12 font-semibold text-gray-600" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-20 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-20 bg-gray-200 rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-8 w-8 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun paiement</p>
              <p className="text-sm mt-1">Cliquez sur "Nouveau paiement" pour enregistrer un paiement</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Facture</TableHead>
                      <TableHead className="font-semibold text-gray-600">Client</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Mode</TableHead>
                      <TableHead className="font-semibold text-gray-600">Référence</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                      <TableHead className="text-center w-12 font-semibold text-gray-600" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((p, i) => (
                      <TableRow key={p.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="font-mono text-sm font-medium text-royal-700">{p.facture?.numero_facture || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{p.facture?.client?.nom || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(p.date_paiement)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{modePaiementLabels[p.mode_paiement] || p.mode_paiement}</TableCell>
                        <TableCell className="text-sm text-gray-600">{p.reference || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-green-600">{formatCurrency(p.montant)}</TableCell>
                        <TableCell className="text-center">
                          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le paiement"
        message={`Supprimer le paiement de ${deleteTarget ? formatCurrency(deleteTarget.montant) : ''} ? Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Supprimer"
      />

      <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="Nouveau paiement" width="lg">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <LabelIcon required error={fieldErrors.id_facture}>Facture</LabelIcon>
            <Select value={form.id_facture} onValueChange={(v) => set('id_facture', v)}>
              <SelectTrigger className={cn('w-full h-11 border-royal-700 bg-white/10 text-white', fieldErrors.id_facture && 'border-red-400')}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {factures.map((f) => (<SelectItem key={f.id} value={String(f.id)}>{f.numero_facture} - {f.client?.nom || ''}</SelectItem>))}
              </SelectContent>
            </Select>
            {fieldErrors.id_facture && <p className="text-xs text-red-400 mt-1">{fieldErrors.id_facture}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <LabelIcon required error={fieldErrors.montant}>Montant</LabelIcon>
              <Input type="number" step="0.01" min="0.01" value={form.montant}
                onChange={(e) => set('montant', e.target.value)}
                className={cn('h-11 border-royal-700 bg-white/10 text-white placeholder:text-white/40', fieldErrors.montant && 'border-red-400')} />
              {fieldErrors.montant && <p className="text-xs text-red-400 mt-1">{fieldErrors.montant}</p>}
            </div>
            <div>
              <LabelIcon required error={fieldErrors.date_paiement}>Date</LabelIcon>
              <Input type="date" value={form.date_paiement}
                onChange={(e) => set('date_paiement', e.target.value)}
                className={cn('h-11 border-royal-700 bg-white/10 text-white', fieldErrors.date_paiement && 'border-red-400')} />
              {fieldErrors.date_paiement && <p className="text-xs text-red-400 mt-1">{fieldErrors.date_paiement}</p>}
            </div>
          </div>

          <div>
            <LabelIcon required error={fieldErrors.mode_paiement}>Mode de paiement</LabelIcon>
            <Select value={form.mode_paiement} onValueChange={(v) => set('mode_paiement', v)}>
              <SelectTrigger className={cn('w-full h-11 border-royal-700 bg-white/10 text-white', fieldErrors.mode_paiement && 'border-red-400')}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIREMENT">Virement</SelectItem>
                <SelectItem value="CHEQUE">Chèque</SelectItem>
                <SelectItem value="ESPECES">Espèces</SelectItem>
                <SelectItem value="CARTE">Carte</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.mode_paiement && <p className="text-xs text-red-400 mt-1">{fieldErrors.mode_paiement}</p>}
          </div>

          <div>
            <LabelIcon error={fieldErrors.reference}>Référence</LabelIcon>
            <Input value={form.reference}
              onChange={(e) => set('reference', e.target.value)}
              className="h-11 border-royal-700 bg-white/10 text-white placeholder:text-white/40" placeholder="Optionnelle" />
          </div>

          <div>
            <LabelIcon>Commentaire</LabelIcon>
            <Textarea value={form.commentaire}
              onChange={(e) => set('commentaire', e.target.value)}
              rows={2} className="border-royal-700 bg-white/10 text-white placeholder:text-white/40" placeholder="Optionnel" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-royal-700">
            <Button type="button" onClick={() => setPanelOpen(false)}
              className="h-11 px-6 border border-white/20 text-white bg-transparent hover:bg-white/10 font-medium rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={saving}
              className="h-11 px-8 bg-white hover:bg-gray-100 text-royal-800 font-medium rounded-xl shadow-sm">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" /> Enregistrer</>
              )}
            </Button>
          </div>
        </form>
      </SlidePanel>
    </div>
  );
}
