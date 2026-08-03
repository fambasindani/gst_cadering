import { useCallback, useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { ficheTechniqueService } from '../services/fiche-technique';
import { entreeRecetteService } from '../services/entree-recette';
import { partenaireService } from '../services/partenaire';
import { EntreeRecettePDF } from '../components/pdf/EntreeRecettePDF';
import type { FicheTechnique, EntreeRecette } from '../types/fiche-technique';
import {
  Save, Loader2, FileText, CalendarDays, DollarSign, Scale, CheckCircle2, Users, Repeat, Trash2, ClipboardList, Download,
} from 'lucide-react';
import { formatCurrency } from '../lib/format';

export function EntreeRecette() {
  const { toast } = useToast();

  const [fiches, setFiches] = useState<FicheTechnique[]>([]);
  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);
  const [selectedFiche, setSelectedFiche] = useState<FicheTechnique | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ recette: EntreeRecette; nombre_portions: number; nombre_passages: number; cout_total: number; cout_unitaire: number } | null>(null);
  const [form, setForm] = useState({
    id_fiche_technique: '', id_partenaire: '', nombre_portions: '',
    date_production: new Date().toISOString().slice(0, 10), commentaire: '',
  });

  // Historique
  const [history, setHistory] = useState<EntreeRecette[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<EntreeRecette | null>(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await entreeRecetteService.list({ per_page: String(pageSize), page: String(currentPage) });
      if (res.success) {
        setHistory(res.data.data);
        setTotal(res.data.total);
        setLastPage(res.data.last_page);
      }
    } catch { /* */ } finally {
      setHistoryLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    (async () => {
      try {
        const [ft, c] = await Promise.all([
          ficheTechniqueService.list({ per_page: '500', actif: '1' }),
          partenaireService.getClients({ actif: '1' }),
        ]);
        if (ft.success) setFiches(ft.data.data);
        if (c.success) setClients(c.data.data);
      } catch { /* */ }
    })();
  }, []);

  const handleFicheChange = (id: string) => {
    setForm(f => ({ ...f, id_fiche_technique: id }));
    setSelectedFiche(fiches.find(f => String(f.id) === id) || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        id_fiche_technique: Number(form.id_fiche_technique),
        id_partenaire: Number(form.id_partenaire),
        nombre_portions: Number(form.nombre_portions),
        date_production: form.date_production,
        commentaire: form.commentaire || undefined,
      };
      const res = await entreeRecetteService.produire(payload);
      if (res.success && res.data) {
        toast('Entrée recette enregistrée avec succès', 'success');
        setResult(res.data);
        fetchHistory();
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      const msg = error.message || (error.errors ? Object.values(error.errors).flat().join(', ') : 'Erreur lors de l\'enregistrement');
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await entreeRecetteService.delete(deleteTarget.id);
      toast('Entrée recette supprimée', 'success');
      setDeleteTarget(null);
      fetchHistory();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    }
  };

  const LabelIcon = ({ icon: Icon, children, required }: { icon?: React.ElementType; children: React.ReactNode; required?: boolean }) => (
    <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );

  const resetForm = () => {
    setForm({
      id_fiche_technique: '', id_partenaire: '', nombre_portions: '',
      date_production: new Date().toISOString().slice(0, 10), commentaire: '',
    });
    setSelectedFiche(null);
    setResult(null);
  };

  const portions = Number(form.nombre_portions) || 0;
  const passagesCalcules = selectedFiche && portions > 0
    ? Math.max(1, Math.ceil(portions / Math.max(Number(selectedFiche.rendement) || 1, 1)))
    : 0;
  const coutTotalEstime = selectedFiche ? (Number(selectedFiche.cout_unitaire) || 0) * portions : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Entrée recette</h1>
        <p className="text-sm text-gray-500 mt-0.5">Commande de production client (sans impact sur le stock)</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-royal-700" />
                  <h2 className="text-base font-bold text-gray-800">Recette</h2>
                </div>

                <div>
                  <LabelIcon icon={FileText} required>Fiche recette</LabelIcon>
                  <Select value={form.id_fiche_technique} onValueChange={handleFicheChange}>
                    <SelectTrigger className="w-full h-11 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Sélectionner une recette" />
                    </SelectTrigger>
                    <SelectContent>
                      {fiches.map((f) => (<SelectItem key={f.id} value={String(f.id)}>[{f.code}] {f.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFiche && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Scale className="w-4 h-4 text-royal-700" />
                      <span className="font-medium">Rendement :</span>
                      <span>{selectedFiche.rendement} portion(s) de {Number(selectedFiche.poids_portion) || 0} {selectedFiche.unite_poids_portion || 'gm'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <DollarSign className="w-4 h-4 text-royal-700" />
                      <span className="font-medium">Coût total recette :</span>
                      <span>{formatCurrency(selectedFiche.cout_total)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <DollarSign className="w-4 h-4 text-royal-700" />
                      <span className="font-medium">Coût unitaire :</span>
                      <span>{formatCurrency(selectedFiche.cout_unitaire)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <DollarSign className="w-4 h-4 text-royal-700" />
                      <span className="font-medium">Coût / kg :</span>
                      <span>{formatCurrency(selectedFiche.prix_kg)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <LabelIcon icon={Users} required>Client</LabelIcon>
                  <SearchableSelect
                    options={clients.map(c => ({ id: c.id, nom: c.nom }))}
                    value={form.id_partenaire}
                    onValueChange={(v) => setForm(f => ({ ...f, id_partenaire: v }))}
                    placeholder="Sélectionner un client"
                    searchPlaceholder="Rechercher un client..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Repeat} required>Nombre de portions (passagers)</LabelIcon>
                    <Input type="number" min="1" value={form.nombre_portions}
                      onChange={e => setForm(f => ({ ...f, nombre_portions: e.target.value }))}
                      className="h-11 border-gray-200 shadow-sm" />
                    {selectedFiche && portions > 0 && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        = {passagesCalcules} passage{passagesCalcules > 1 ? 's' : ''} de {selectedFiche.rendement} portion(s)
                      </p>
                    )}
                  </div>
                  <div>
                    <LabelIcon icon={CalendarDays} required>Date production</LabelIcon>
                    <Input type="date" value={form.date_production}
                      onChange={e => setForm(f => ({ ...f, date_production: e.target.value }))}
                      className="h-11 border-gray-200 shadow-sm" />
                  </div>
                </div>

                <div>
                  <LabelIcon>Commentaire</LabelIcon>
                  <Textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                    rows={2} className="border-gray-200 shadow-sm" placeholder="Optionnel" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <DollarSign className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Résumé</h2>
                </div>
                {selectedFiche ? (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Portions (passagers)</div>
                      <div className="text-xl font-semibold text-gray-900">{portions || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Passages nécessaires</div>
                      <div className="text-lg font-semibold text-gray-900">{passagesCalcules || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Coût unitaire (par portion)</div>
                      <div className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(selectedFiche.cout_unitaire)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Coût total estimé ({portions} portion(s))</div>
                      <div className="text-2xl font-bold text-royal-700 font-mono">{formatCurrency(coutTotalEstime)}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400 py-4 text-center">Sélectionnez une fiche recette</div>
                )}
              </CardContent>
            </Card>

            {result && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-700" />
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    Entrée recette enregistrée
                  </div>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p><span className="font-medium">Client :</span> {result.recette.partenaire?.nom || '-'}</p>
                    <p><span className="font-medium">Portions (passagers) :</span> {result.nombre_portions}</p>
                    <p><span className="font-medium">Passages :</span> {result.nombre_passages}</p>
                    <p><span className="font-medium">Date :</span> {result.recette.date_production ? new Date(result.recette.date_production).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</p>
                    <p><span className="font-medium">Coût total :</span> {formatCurrency(result.cout_total ?? 0)}</p>
                  </div>
                  <Button type="button" onClick={resetForm} variant="outline" size="sm" className="w-full mt-2">
                    Nouvelle entrée recette
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {!result && (
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Button type="submit" disabled={submitting || !form.id_fiche_technique || !form.id_partenaire || !form.nombre_portions}
              className="h-11 px-8 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl shadow-sm">
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Enregistrer l'entrée recette</>
              )}
            </Button>
          </div>
        )}
      </form>

      <Card className="border-0 shadow-sm overflow-hidden mt-4">
        <div className="h-1.5 bg-gradient-to-r from-sky-500 to-sky-700" />
        <CardContent className="p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
            <ClipboardList className="w-5 h-5 text-sky-700" />
            <h2 className="text-base font-bold text-gray-800">Historique des entrées recette</h2>
            <span className="text-sm text-gray-400 ml-auto">{total} enregistrement(s)</span>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-royal-700" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Aucune entrée recette enregistrée</div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Recette</th>
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Client</th>
                      <th className="text-right font-semibold text-gray-600 px-4 py-3">Portions</th>
                      <th className="text-right font-semibold text-gray-600 px-4 py-3">Passages</th>
                      <th className="text-right font-semibold text-gray-600 px-4 py-3">Coût total</th>
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Date</th>
                      <th className="text-center w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={h.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {h.fiche_technique?.code ? `[${h.fiche_technique.code}] ` : ''}{h.fiche_technique?.nom || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{h.partenaire?.nom || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">{h.nombre_portions ?? 0}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-400">{h.nombre_passages}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                          {formatCurrency((Number(h.fiche_technique?.cout_unitaire) || 0) * (Number(h.nombre_portions) || 0))}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {h.date_production ? new Date(h.date_production).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <PDFDownloadLink
                              document={<EntreeRecettePDF recette={h} />}
                              fileName={`entree-recette-${h.id}.pdf`}
                            >
                              {({ loading: pdfLoading }) => (
                                <button
                                  type="button"
                                  disabled={pdfLoading}
                                  className="p-1.5 rounded text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-40"
                                  title="Imprimer le rapport"
                                >
                                  {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                </button>
                              )}
                            </PDFDownloadLink>
                            <button
                              onClick={() => setDeleteTarget(h)}
                              className="p-1.5 rounded text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                lastPage={lastPage}
                total={total}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'entrée recette"
        message="Supprimer cet enregistrement ? Cette action est irréversible."
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
