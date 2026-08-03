import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RapportEntreeRecettePDF } from '../components/pdf/RapportEntreeRecettePDF';
import { entreeRecetteService } from '../services/entree-recette';
import { ficheTechniqueService } from '../services/fiche-technique';
import { partenaireService } from '../services/partenaire';
import type { EntreeRecette, FicheTechnique } from '../types/fiche-technique';
import { Search, RefreshCw, FileText, DollarSign, Repeat, Download, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

export function RapportRecette() {
  const [data, setData] = useState<EntreeRecette[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ficheId, setFicheId] = useState('');
  const [partenaireId, setPartenaireId] = useState('');
  const [fiches, setFiches] = useState<FicheTechnique[]>([]);
  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: String(pageSize), page: String(currentPage) };
      if (searchTerm) params.search = searchTerm;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (ficheId) params.fiche_id = ficheId;
      if (partenaireId) params.partenaire_id = partenaireId;
      const res = await entreeRecetteService.list(params);
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
  }, [currentPage, pageSize, searchTerm, dateFrom, dateTo, ficheId, partenaireId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const [ft, c] = await Promise.all([
          ficheTechniqueService.list({ per_page: '500' }),
          partenaireService.getClients({ per_page: '500' }),
        ]);
        if (ft.success) setFiches(ft.data.data);
        if (c.success) setClients(c.data.data);
      } catch { /* */ }
    })();
  }, []);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const totalPortions = data.reduce((s, r) => s + (Number(r.nombre_portions) || 0), 0);
  const totalCout = data.reduce((s, r) => s + (Number(r.fiche_technique?.cout_unitaire) || 0) * (Number(r.nombre_portions) || 0), 0);

  const resetFilters = () => {
    setSearchInput(''); setSearchTerm(''); setDateFrom(''); setDateTo('');
    setFicheId(''); setPartenaireId(''); setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport entrées recette</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} entrée${total > 1 ? 's' : ''} recette`}</p>
        </div>
        <div className="flex items-center gap-2">
          {data.length > 0 && (
            <PDFDownloadLink document={<RapportEntreeRecettePDF recettes={data} />} fileName="rapport-entrees-recette.pdf">
              {({ loading: pdfLoading }) => (
                <Button variant="outline" disabled={pdfLoading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  {pdfLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                  {pdfLoading ? 'Génération...' : 'PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          )}
          <Button variant="outline" onClick={resetFilters} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Rechercher (recette, client)..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 font-medium block mb-1.5">Recette</label>
            <SearchableSelect
              options={fiches.map(f => ({ id: f.id, nom: f.nom, sousTitre: f.code ? `[${f.code}]` : undefined }))}
              value={ficheId}
              onValueChange={(v) => { setFicheId(v); setCurrentPage(1); }}
              placeholder="Toutes"
              searchPlaceholder="Rechercher une recette..."
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 font-medium block mb-1.5">Client</label>
            <SearchableSelect
              options={clients.map(c => ({ id: c.id, nom: c.nom }))}
              value={partenaireId}
              onValueChange={(v) => { setPartenaireId(v); setCurrentPage(1); }}
              placeholder="Tous"
              searchPlaceholder="Rechercher un client..."
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 font-medium block mb-1.5">Du :</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-royal-500 focus:ring-royal-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 font-medium block mb-1.5">Au :</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-royal-500 focus:ring-royal-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-royal-50">
                <FileText className="w-5 h-5 text-royal-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Entrées recette</p>
                <p className="text-xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <Repeat className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Portions (passagers, page)</p>
                <p className="text-xl font-bold text-gray-900">{totalPortions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50">
                <DollarSign className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Coût total (page)</p>
                <p className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(totalCout)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Entrées recette</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <th key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-5 bg-gray-200 rounded" style={{ width: `${60 + j * 20}px` }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune entrée recette</p>
              <p className="text-sm mt-1">Enregistrez des entrées recette pour voir le rapport</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">N°</th>
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Date</th>
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Client</th>
                      <th className="text-left font-semibold text-gray-600 px-4 py-3">Recette</th>
                      <th className="text-right font-semibold text-gray-600 px-4 py-3">Portions</th>
                      <th className="text-right font-semibold text-gray-600 px-4 py-3">Coût total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={r.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <td className="px-4 py-3 font-mono text-sm text-royal-700">{r.id}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(r.date_production)}</td>
                        <td className="px-4 py-3 text-gray-700">{r.partenaire?.nom || '-'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {r.fiche_technique?.code ? `[${r.fiche_technique.code}] ` : ''}{r.fiche_technique?.nom || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">{r.nombre_portions ?? 0}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                          {formatCurrency((Number(r.fiche_technique?.cout_unitaire) || 0) * (Number(r.nombre_portions) || 0))}
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
    </div>
  );
}
