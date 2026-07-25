import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useToast } from '../hooks/useToast';
import { auditService } from '../services/audit';
import type { Audit, AuditStats, AuditTable, AuditAction } from '../types/audit';
import {
  Search, RefreshCw, Shield, Activity, Database, Calendar, User, Eye, FileText, Download,
} from 'lucide-react';
import { cn } from '../lib/utils';

const actionColors: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-800',
  UPDATE: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN_SUCCESS: 'bg-blue-100 text-blue-800',
  LOGIN_FAILED: 'bg-red-100 text-red-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  REGISTER: 'bg-emerald-100 text-emerald-800',
};

const actionLabels: Record<string, string> = {
  INSERT: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  LOGIN_SUCCESS: 'Connexion',
  LOGIN_FAILED: 'Échec connexion',
  LOGOUT: 'Déconnexion',
  REGISTER: 'Inscription',
};

export function AuditList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [stats, setStats] = useState<AuditStats | null>(null);
  const [tables, setTables] = useState<AuditTable[]>([]);
  const [allActions, setAllActions] = useState<AuditAction[]>([]);
  const [tableFilter, setTableFilter] = useState('_all');
  const [actionFilter, setActionFilter] = useState('_all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const [exportLoading, setExportLoading] = useState(false);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {
      per_page: String(pageSize),
      page: String(currentPage),
    };
    if (searchTerm) params.search = searchTerm;
    if (tableFilter && tableFilter !== '_all') params.table_cible = tableFilter;
    if (actionFilter && actionFilter !== '_all') params.action = actionFilter;
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    return params;
  }, [currentPage, searchTerm, tableFilter, actionFilter, dateDebut, dateFin, pageSize]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditService.list(buildParams());
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
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    auditService.statistiques()
      .then((res) => { if (res.success) setStats(res.data); })
      .catch(() => {});
    auditService.tables()
      .then((res) => { if (res.success) setTables(res.data); })
      .catch(() => {});
    auditService.actions()
      .then((res) => { if (res.success) setAllActions(res.data); })
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const params = buildParams();
      const token = localStorage.getItem('auth-token');
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`/api/audits/export?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audits_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Export démarré', 'success');
    } catch {
      toast("Erreur lors de l'export", 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-royal-100 text-royal-700">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {total > 0 ? `${total} entrée${total > 1 ? 's' : ''} d'audit` : 'Journal des activités'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            <Download className={cn('h-4 w-4 mr-2', exportLoading && 'animate-bounce')} />
            Exporter
          </Button>
          <Button variant="outline" onClick={() => { setSearchInput(''); setSearchTerm(''); setTableFilter('_all'); setActionFilter('_all'); setDateDebut(''); setDateFin(''); setCurrentPage(1); }} className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl" title="Actualiser">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-royal-500 to-royal-700" />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-royal-100 text-royal-700">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total_audits.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-gray-500">Total entrées</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-700" />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.par_action.length}</p>
                <p className="text-xs text-gray-500">Actions distinctes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-700" />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.par_table.length}</p>
                <p className="text-xs text-gray-500">Tables suivies</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-700" />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Dernière action</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {data.length > 0 ? formatDate(data[0].date_action) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Input
                placeholder="Rechercher dans l'audit..."
                className="pl-3 pr-24 border-gray-200 focus:border-royal-500 focus:ring-royal-500 h-10"
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
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40 h-10 bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Toutes les tables</SelectItem>
                  {tables.map((t) => (
                    <SelectItem key={t.table_cible} value={t.table_cible}>{t.table_cible} ({t.total})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-36 h-10 bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Toutes actions</SelectItem>
                  {allActions.map((a) => (
                    <SelectItem key={a.action} value={a.action}>{actionLabels[a.action] || a.action} ({a.total})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={dateDebut}
                onChange={(e) => { setDateDebut(e.target.value); setCurrentPage(1); }}
                className="w-36 h-10 border-gray-200 text-sm" />
              <span className="text-gray-400 text-sm">-</span>
              <Input type="date" value={dateFin}
                onChange={(e) => { setDateFin(e.target.value); setCurrentPage(1); }}
                className="w-36 h-10 border-gray-200 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Utilisateur</TableHead>
                    <TableHead className="font-semibold text-gray-600">Action</TableHead>
                    <TableHead className="font-semibold text-gray-600">Table</TableHead>
                    <TableHead className="font-semibold text-gray-600">ID</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-600">IP</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-5 w-32 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-6 w-20 bg-gray-200 rounded-full" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell><div className="h-5 w-12 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-8 w-12 bg-gray-200 rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Aucune entrée d'audit</p>
              <p className="text-sm mt-1">Les activités apparaîtront ici au fur et à mesure</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Utilisateur</TableHead>
                      <TableHead className="font-semibold text-gray-600">Action</TableHead>
                      <TableHead className="font-semibold text-gray-600">Table</TableHead>
                      <TableHead className="font-semibold text-gray-600">ID</TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-gray-600">IP</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((audit, i) => (
                      <TableRow key={audit.id} className={cn('hover:bg-royal-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(audit.date_action)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-royal-100 flex items-center justify-center text-royal-700 text-xs font-bold">
                              {audit.utilisateur ? `${audit.utilisateur.prenom[0]}${audit.utilisateur.nom[0]}` : '?'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {audit.utilisateur ? `${audit.utilisateur.prenom} ${audit.utilisateur.nom}` : 'Système'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            actionColors[audit.action] || 'bg-gray-100 text-gray-700',
                          )}>
                            {actionLabels[audit.action] || audit.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">{audit.table_cible}</code>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 font-mono">{audit.id_enregistrement ?? '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-gray-500 font-mono">{audit.adresse_ip}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/audit/${audit.id}`)}
                            className="h-8 w-8 p-0 text-royal-600 hover:text-royal-700 hover:bg-royal-50 rounded-lg" title="Voir détails">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination currentPage={currentPage} lastPage={lastPage} total={total} pageSize={pageSize}
                onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange} />
            </>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
