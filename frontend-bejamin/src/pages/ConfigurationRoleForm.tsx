import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { roleService } from '../services/role';
import { permissionService } from '../services/permission';
import type { Permission } from '../types/auth';
import {
  ArrowLeft, Save, Loader2, Shield, FileText, CheckCircle, XCircle, Search,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ConfigurationRoleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [form, setForm] = useState({ nom: '', description: '', actif: true, permissions: [] as number[] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permSearch, setPermSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    permissionService.all({ per_page: '500', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setAllPermissions(Array.isArray(res.data) ? res.data : res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      roleService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const r = res.data;
            setForm({
              nom: r.nom,
              description: r.description || '',
              actif: r.actif,
              permissions: ((r as any).permissions || []).map((p: any) => p.id ?? p),
            });
          }
        })
        .catch(() => toast('Erreur lors du chargement', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    try {
      setSaving(true);
      if (isEditing) {
        await roleService.update(Number(id), form);
        toast('Rôle modifié avec succès', 'success');
      } else {
        await roleService.create(form);
        toast('Rôle créé avec succès', 'success');
      }
      navigate('/configuration/roles');
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(error.errors)) {
          fieldErrors[field] = messages[0];
        }
        setFormErrors(fieldErrors);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = allPermissions.filter(
    (p) => p.nom.toLowerCase().includes(permSearch.toLowerCase()) || p.code.toLowerCase().includes(permSearch.toLowerCase()),
  );

  const selectedCount = form.permissions.length;

  const LabelIcon = ({ icon: Icon, children, error }: { icon?: React.ElementType; children: React.ReactNode; error?: string }) => (
    <Label className={cn('flex items-center gap-1.5 text-sm font-semibold mb-1.5', error ? 'text-red-500' : 'text-gray-700')}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Label>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/configuration/roles')} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier le rôle' : 'Nouveau rôle'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing ? 'Modifier les informations du rôle' : 'Créer un nouveau rôle et définir ses permissions'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-700" />
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Shield className="w-5 h-5 text-indigo-700" />
                <h2 className="text-base font-bold text-gray-800">Détails du rôle</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <LabelIcon icon={FileText} error={formErrors.nom}>Nom *</LabelIcon>
                  <Input
                    value={form.nom}
                    onChange={(e) => { setForm((f) => ({ ...f, nom: e.target.value })); setFormErrors((f) => ({ ...f, nom: '' })); }}
                    placeholder="Ex: Super Admin, Gestionnaire"
                    className={cn('h-11 border-gray-200 shadow-sm', formErrors.nom ? 'border-red-400' : '')}
                  />
                  {formErrors.nom && <p className="text-xs text-red-500 mt-1">{formErrors.nom}</p>}
                </div>

                <div>
                  <LabelIcon icon={FileText}>Description</LabelIcon>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Description du rôle (optionnelle)"
                    rows={3}
                    className={cn('border-gray-200 shadow-sm resize-none', formErrors.description ? 'border-red-400' : '')}
                  />
                  {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, actif: !f.actif }))}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                      form.actif ? 'bg-indigo-600' : 'bg-gray-300',
                    )}
                  >
                    <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', form.actif ? 'translate-x-6' : 'translate-x-1')} />
                  </button>
                  <div className="flex items-center gap-2">
                    {form.actif ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm font-medium text-gray-900">{form.actif ? 'Rôle actif' : 'Rôle inactif'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={() => navigate('/configuration/roles')}
                    className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saving}
                    className="h-11 px-8 bg-indigo-700 hover:bg-indigo-800 text-white font-medium rounded-xl shadow-sm">
                    {saving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> {isEditing ? 'Modifier' : 'Créer'}</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Permissions</h2>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="Filtrer les permissions..."
                  className="h-10 pl-9 border-gray-200 shadow-sm text-sm"
                />
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredPermissions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">Aucune permission trouvée</div>
                ) : (
                  filteredPermissions.map(p => (
                    <label key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setForm(f => ({ ...f, permissions: [...f.permissions, p.id] }));
                          else setForm(f => ({ ...f, permissions: f.permissions.filter(id => id !== p.id) }));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.nom}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{p.code}</p>
                      </div>
                      {form.permissions.includes(p.id) && (
                        <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      )}
                    </label>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                <button type="button" onClick={() => setForm(f => ({ ...f, permissions: allPermissions.map(p => p.id) }))}
                  className="text-indigo-600 hover:text-indigo-800 font-medium underline">
                  Tout sélectionner
                </button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, permissions: [] }))}
                  className="text-indigo-600 hover:text-indigo-800 font-medium underline">
                  Tout désélectionner
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
