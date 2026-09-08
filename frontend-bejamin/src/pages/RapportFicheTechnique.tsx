import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useToast } from '../hooks/useToast';
import { ficheTechniqueMenuService } from '../services/fiche-technique-menu';
import { entreeFicheTechniqueService } from '../services/entree-fiche-technique';
import { partenaireService } from '../services/partenaire';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FicheTechniqueRapportPDF } from '../components/pdf/FicheTechniqueRapportPDF';
import { RapportFicheTechniqueView } from '../components/rapport/RapportFicheTechniqueView';
import type { FicheTechniqueMenu, RapportFicheTechniqueData, EntreeFicheTechnique } from '../types/fiche-technique-menu';
import { Search, RefreshCw, FileBarChart, Eye, Trash2, Download, Loader2, Save, Users, CalendarDays, Building2, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

const today = () => new Date().toISOString().slice(0, 10);

export function RapportFicheTechnique() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [menus, setMenus] = useState<FicheTechniqueMenu[]>([]);
  const [compagnies, setCompagnies] = useState<{ id: number; nom: string }[]>([]);

  const [menuId, setMenuId] = useState(searchParams.get('menu') || '');
  const [compagnieId, setCompagnieId] = useState('');
  const [passagers, setPassagers] = useState('');
  const [dateRapport, setDateRapport] = useState(today());
  const [commentaire, setCommentaire] = useState('');

  const [preview, setPreview] = useState<RapportFicheTechniqueData | null>(null);
  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<EntreeFicheTechnique[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<EntreeFicheTechnique | null>(null);

  const [filterClient, setFilterClient] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [mResult, cResult] = await Promise.allSettled([
          ficheTechniqueMenuService.list({ per_page: '500' }),
          partenaireService.getClients({ per_page: '500' }),
        ]);
        if (mResult.status === 'fulfilled' && mResult.value.success) setMenus(mResult.value.data.data.filter((x: { actif?: boolean }) => x.actif !== false));
        if (cResult.status === 'fulfilled' && cResult.value.success) setCompagnies(cResult.value.data.data);
      } catch { /* */ }
    })();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage) };
      if (filterClient) params.partenaire_id = filterClient;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      const res = await entreeFicheTechniqueService.list(params);
      if (res.success) {
        setHistory(res.data.data);
        setTotal(res.data.total);
        setLastPage(res.data.last_page);
      }
    } catch { /* */ } finally {
      setLoadingHistory(false);
    }
  }, [currentPage, pageSize, filterClient, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleApercu = async () => {
    if (!menuId || !passagers || Number(passagers) < 1) {
      toast('Sélectionnez une fiche technique et un nombre de passagers', 'error');
      return;
    }
    setComputing(true);
    try {
      const res = await entreeFicheTechniqueService.apercu({
        id_fiche_technique_menu: Number(menuId),
        nombre_passagers: Number(passagers),
        id_partenaire: compagnieId ? Number(compagnieId) : null,
      });
      if (res.success) setPreview(res.data);
    } catch {
      toast('Erreur lors du calcul de l\'aperçu', 'error');
    } finally {
      setComputing(false);
    }
  };

  const handleSave = async () => {
    if (!menuId || !compagnieId || !passagers || Number(passagers) < 1) {
      toast('Renseignez la fiche technique, le client et le nombre de passagers', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await entreeFicheTechniqueService.generer({
        id_fiche_technique_menu: Number(menuId),
        id_partenaire: Number(compagnieId),
        nombre_passagers: Number(passagers),
        date_rapport: dateRapport,
        commentaire: commentaire || undefined,
      });
      if (res.success) {
        toast('Rapport enregistré avec succès', 'success');
        navigate(`/recettes/rapport-ft/${res.data.rapport.id}`);
      }
    } catch {
      toast('Erreur lors de l\'enregistrement du rapport', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await entreeFicheTechniqueService.delete(deleteTarget.id);
      toast('Rapport supprimé', 'success');
      setDeleteTarget(null);
      fetchHistory();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    }
  };

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const selectedMenu = menus.find(m => String(m.id) === menuId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport fiche technique</h1>
          <p className="text-sm text-gray-500 mt-1">Sélectionnez la date, le client, la fiche technique et le nombre de passagers, puis validez pour obtenir le rapport.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Paramètres du rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                <CalendarDays className="w-4 h-4 text-gray-400" /> Date
              </Label>
              <input
                type="date"
                value={dateRapport}
                onChange={(e) => setDateRapport(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-royal-500 focus:ring-royal-500"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400" /> Client *
              </Label>
              <SearchableSelect
                options={compagnies.map(c => ({ id: c.id, nom: c.nom }))}
                value={compagnieId}
                onValueChange={setCompagnieId}
                placeholder="Sélectionner un client"
                searchPlaceholder="Rechercher un client..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                <FileBarChart className="w-4 h-4 text-gray-400" /> Fiche technique *
              </Label>
              <SearchableSelect
                options={menus.map(m => ({ id: m.id, nom: m.nom, sousTitre: m.code ? `[${m.code}]` : undefined }))}
                value={menuId}
                onValueChange={(v) => {
                  setMenuId(v);
                  setPreview(null);
                  const m = menus.find(x => String(x.id) === v);
                  if (m && m.id_partenaire && !compagnieId) setCompagnieId(String(m.id_partenaire));
                }}
                placeholder="Sélectionner une fiche technique"
                searchPlaceholder="Rechercher une fiche technique..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-700">
                <Users className="w-4 h-4 text-gray-400" /> Nombre de passagers *
              </Label>
              <Input
                type="number"
                min={1}
                value={passagers}
                onChange={(e) => { setPassagers(e.target.value); setPreview(null); }}
                placeholder="Ex : 200"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-sm font-semibold mb-1.5 block text-gray-700">Commentaire</Label>
            <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} placeholder="Commentaire (optionnel)..." />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={handleApercu} disabled={computing} className="border-royal-300 text-royal-700 hover:bg-royal-50">
              {computing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Search className="w-4 h-4 mr-1.5" />}
              {computing ? 'Calcul...' : 'Aperçu'}
            </Button>
            {preview && (
              <PDFDownloadLink document={<FicheTechniqueRapportPDF data={preview} />} fileName={`fiche-technique-${selectedMenu?.code || ''}.pdf`}>
                {({ loading: pdfLoading }) => (
                  <Button type="button" variant="outline" disabled={pdfLoading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    {pdfLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                    {pdfLoading ? 'Génération...' : 'PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
            <Button type="button" onClick={handleSave} disabled={saving} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              {saving ? 'Enregistrement...' : 'Valider le rapport'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <RapportFicheTechniqueView data={preview} />
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Historique des rapports</CardTitle>
          <Button variant="outline" onClick={fetchHistory} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <RefreshCw className={cn('w-4 h-4 mr-2', loadingHistory && 'animate-spin')} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs font-semibold text-gray-500 mb-1 block">Client</Label>
              <SearchableSelect
                options={compagnies.map(c => ({ id: c.id, nom: c.nom }))}
                value={filterClient}
                onValueChange={setFilterClient}
                placeholder="Tous les clients"
                searchPlaceholder="Rechercher..."
              />
            </div>
            <div className="min-w-[160px]">
              <Label className="text-xs font-semibold text-gray-500 mb-1 block">Date début</Label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-royal-500 focus:ring-royal-500"
              />
            </div>
            <div className="min-w-[160px]">
              <Label className="text-xs font-semibold text-gray-500 mb-1 block">Date fin</Label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-royal-500 focus:ring-royal-500"
              />
            </div>
            {(filterClient || filterDateFrom || filterDateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterClient(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                className="text-gray-500 hover:text-gray-700"
              >
                Effacer les filtres
              </Button>
            )}
          </div>
          {loadingHistory ? (
            <div className="text-center py-8 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileBarChart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucun rapport enregistré</p>
              <p className="text-sm mt-1">Validez un rapport pour le retrouver ici</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">N°</th>
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Date</th>
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Fiche technique</th>
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Client</th>
                      <th className="text-right font-semibold text-gray-600 px-4 py-3">Passagers</th>
                      <th className="text-center w-28 font-semibold text-gray-600 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r, i) => (
                      <tr key={r.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <td className="px-4 py-3 font-mono text-royal-700">{r.id}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(r.date_rapport)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.menu?.nom || '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{r.partenaire?.nom || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">{r.nombre_passagers}</td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/recettes/rapport-ft/${r.id}`)}
                              className="p-1.5 rounded text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Voir le rapport"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(r)}
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
        title="Supprimer le rapport"
        message={`Supprimer le rapport ${deleteTarget?.id ? `N° ${deleteTarget.id}` : ''} ? Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
