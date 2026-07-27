import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { permissionService } from '../services/permission';
import {
  ArrowLeft, Save, Loader2, Key, Code2, FileText, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ConfigurationPermissionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [form, setForm] = useState({ code: '', nom: '', description: '', actif: true });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (id) {
      permissionService.get(Number(id))
        .then((res) => {
          if (res.success) {
            setForm({
              code: res.data.code,
              nom: res.data.nom,
              description: res.data.description || '',
              actif: res.data.actif,
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
        await permissionService.update(Number(id), form);
        toast('Permission modifiée avec succès', 'success');
      } else {
        await permissionService.create(form);
        toast('Permission créée avec succès', 'success');
      }
      navigate('/configuration/permissions');
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
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/configuration/permissions')} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-400 text-gray-500 hover:text-gray-100 hover:border-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier la permission' : 'Nouvelle permission'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing ? 'Modifier les informations de la permission' : 'Créer une nouvelle permission d\'accès'}
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-violet-700" />
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Key className="w-5 h-5 text-violet-700" />
            <h2 className="text-base font-bold text-gray-800">Informations générales</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <LabelIcon icon={Code2} error={formErrors.code}>Code *</LabelIcon>
              <Input
                value={form.code}
                onChange={(e) => { setForm((f) => ({ ...f, code: e.target.value })); setFormErrors((f) => ({ ...f, code: '' })); }}
                placeholder="Ex: article_create, user_delete"
                className={cn('h-11 border-gray-200 shadow-sm', formErrors.code ? 'border-red-400' : '')}
              />
              {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
            </div>

            <div>
              <LabelIcon icon={FileText} error={formErrors.nom}>Nom *</LabelIcon>
              <Input
                value={form.nom}
                onChange={(e) => { setForm((f) => ({ ...f, nom: e.target.value })); setFormErrors((f) => ({ ...f, nom: '' })); }}
                placeholder="Nom de la permission"
                className={cn('h-11 border-gray-200 shadow-sm', formErrors.nom ? 'border-red-400' : '')}
              />
              {formErrors.nom && <p className="text-xs text-red-500 mt-1">{formErrors.nom}</p>}
            </div>

            <div>
              <LabelIcon icon={FileText}>Description</LabelIcon>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description (optionnelle)"
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
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
                  form.actif ? 'bg-violet-600' : 'bg-gray-300',
                )}
              >
                <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', form.actif ? 'translate-x-6' : 'translate-x-1')} />
              </button>
              <div className="flex items-center gap-2">
                {form.actif ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                <span className="text-sm font-medium text-gray-900">{form.actif ? 'Permission active' : 'Permission inactive'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => navigate('/configuration/permissions')}
                className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
                Annuler
              </Button>
              <Button type="submit" disabled={saving}
                className="h-11 px-8 bg-violet-700 hover:bg-violet-800 text-white font-medium rounded-xl shadow-sm">
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
  );
}
