import { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { parametreService } from '../services/parametre';
import type { Parametre } from '../types/parametre';
import { Settings, Save, Lock, Unlock, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

export function ConfigurationParametre() {
  const { toast } = useToast();
  const [parametres, setParametres] = useState<Parametre[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [stats, setStats] = useState({ total: 0, modifiables: 0, nonModifiables: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await parametreService.list({ per_page: '9999' });
      if (res.success) {
        const items = res.data.data;
        setParametres(items);

        const values: Record<string, string> = {};
        items.forEach((p) => { values[p.cle] = p.valeur || ''; });
        setEditValues(values);

        const modifiables = items.filter((p) => p.est_modifiable).length;
        setStats({ total: items.length, modifiables, nonModifiables: items.length - modifiables });
      }
    } catch {
      toast('Erreur lors du chargement des paramètres', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleValueChange = (cle: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [cle]: value }));
  };

  const handleSave = async (param: Parametre) => {
    setSavingId(param.cle);
    try {
      await parametreService.updateByCle(param.cle, { valeur: editValues[param.cle] });
      toast(`Paramètre "${param.cle}" mis à jour`, 'success');
      fetchAll();
    } catch {
      toast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-1">Configuration du système</p>
        </div>
        <Button variant="outline" onClick={fetchAll} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total paramètres</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Unlock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.modifiables}</p>
              <p className="text-xs text-gray-500">Modifiables</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.nonModifiables}</p>
              <p className="text-xs text-gray-500">Non modifiables</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-48 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : parametres.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 py-12 text-center">
            <Settings className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-700">Aucun paramètre trouvé</p>
            <p className="text-sm text-gray-500 mt-1">Aucun paramètre n'a été configuré</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parametres.map((param) => (
            <Card key={param.cle} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {param.est_modifiable ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <h3 className="text-sm font-semibold text-gray-800 font-mono">{param.cle}</h3>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    param.est_modifiable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {param.est_modifiable ? 'Modifiable' : 'Lecture seule'}
                  </span>
                </div>

                {param.description && (
                  <p className="text-xs text-gray-500 mb-3">{param.description}</p>
                )}

                <div className="mt-auto">
                  {param.est_modifiable ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editValues[param.cle] ?? ''}
                        onChange={(e) => handleValueChange(param.cle, e.target.value)}
                        className="flex-1"
                        placeholder="Valeur"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSave(param)}
                        disabled={savingId === param.cle || editValues[param.cle] === param.valeur}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs rounded-lg shrink-0"
                      >
                        {savingId === param.cle ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800">
                      {param.valeur || '-'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
