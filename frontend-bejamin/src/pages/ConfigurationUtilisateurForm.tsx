import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useToast } from '../hooks/useToast';
import { utilisateurService } from '../services/utilisateur';
import { roleService } from '../services/role';
import { villeService } from '../services/ville';
import { api } from '../services/api';
import {
  ArrowLeft, Save, Loader2, User, Mail, Shield, MapPin, Building2, Map, Locate, Lock, Key, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SelectOption { id: number; nom: string }

export function ConfigurationUtilisateurForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const initialForm = {
    nom: '', prenom: '', email: '',
    id_role: '', id_ville: '', id_departement: '', id_zone: '', id_emplacement: '',
    actif: true, mot_de_passe: '', mot_de_passe_confirmation: '',
  };
  const [form, setForm] = useState({ ...initialForm });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const [roles, setRoles] = useState<SelectOption[]>([]);
  const [villes, setVilles] = useState<SelectOption[]>([]);
  const [departements, setDepartements] = useState<SelectOption[]>([]);
  const [zones, setZones] = useState<SelectOption[]>([]);
  const [emplacements, setEmplacements] = useState<SelectOption[]>([]);

  useEffect(() => {
    villeService.list({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setVilles(res.data.data); })
      .catch(() => {});
    roleService.list({ per_page: '200', sort_by: 'nom', sort_order: 'asc' })
      .then((res) => { if (res.success) setRoles(res.data.data); })
      .catch(() => {});
    api.get<{ success: boolean; data: { data: SelectOption[] } }>('/config/departements', { params: { per_page: '200', sort_by: 'nom', sort_order: 'asc' } })
      .then((res) => { if (res.success) setDepartements(res.data.data); })
      .catch(() => {});
    api.get<{ success: boolean; data: { data: SelectOption[] } }>('/config/zones', { params: { per_page: '200', sort_by: 'nom', sort_order: 'asc' } })
      .then((res) => { if (res.success) setZones(res.data.data); })
      .catch(() => {});
    api.get<{ success: boolean; data: { data: SelectOption[] } }>('/config/emplacements', { params: { per_page: '200', sort_by: 'nom', sort_order: 'asc' } })
      .then((res) => { if (res.success) setEmplacements(res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      utilisateurService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const u = res.data;
            setForm({
              nom: u.nom,
              prenom: u.prenom,
              email: u.email,
              id_role: String(u.role?.id || ''),
              id_ville: String(u.ville?.id || ''),
              id_departement: String(u.departement?.id || ''),
              id_zone: String(u.zone?.id || ''),
              id_emplacement: String(u.emplacement?.id || ''),
              actif: u.actif,
              mot_de_passe: '',
              mot_de_passe_confirmation: '',
            });
          }
        })
        .catch(() => toast('Erreur lors du chargement', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        id_role: form.id_role,
        id_ville: form.id_ville,
        id_departement: form.id_departement,
        id_zone: form.id_zone,
        id_emplacement: form.id_emplacement,
        actif: form.actif,
      };
      if (form.mot_de_passe) {
        payload.mot_de_passe = form.mot_de_passe;
        payload.mot_de_passe_confirmation = form.mot_de_passe_confirmation;
      }

      if (isEditing) {
        await utilisateurService.update(Number(id), payload);
        toast('Utilisateur modifié avec succès', 'success');
      } else {
        payload.mot_de_passe = form.mot_de_passe;
        payload.mot_de_passe_confirmation = form.mot_de_passe_confirmation;
        await utilisateurService.create(payload as any);
        toast('Utilisateur créé avec succès', 'success');
      }
      navigate('/configuration/utilisateurs');
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
        <button onClick={() => navigate('/configuration/utilisateurs')} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-400 text-gray-500 hover:text-gray-100 hover:border-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing ? "Modifier les informations de l'utilisateur" : 'Créer un nouvel utilisateur et lui attribuer un rôle'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <User className="w-5 h-5 text-blue-700" />
                  <h2 className="text-base font-bold text-gray-800">Identité</h2>
                </div>

                <div>
                  <LabelIcon icon={User} error={fieldErrors.nom}>Nom *</LabelIcon>
                  <Input value={form.nom}
                    onChange={(e) => { setForm((f) => ({ ...f, nom: e.target.value })); setFieldErrors((f) => ({ ...f, nom: '' })); }}
                    placeholder="Nom de famille"
                    className={cn('h-11 border-gray-200 shadow-sm', fieldErrors.nom ? 'border-red-400' : '')} />
                  {fieldErrors.nom && <p className="text-xs text-red-500 mt-1">{fieldErrors.nom}</p>}
                </div>

                <div>
                  <LabelIcon icon={User} error={fieldErrors.prenom}>Prénom *</LabelIcon>
                  <Input value={form.prenom}
                    onChange={(e) => { setForm((f) => ({ ...f, prenom: e.target.value })); setFieldErrors((f) => ({ ...f, prenom: '' })); }}
                    placeholder="Prénom"
                    className={cn('h-11 border-gray-200 shadow-sm', fieldErrors.prenom ? 'border-red-400' : '')} />
                  {fieldErrors.prenom && <p className="text-xs text-red-500 mt-1">{fieldErrors.prenom}</p>}
                </div>

                <div>
                  <LabelIcon icon={Mail} error={fieldErrors.email}>Email *</LabelIcon>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={form.email}
                      onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setFieldErrors((f) => ({ ...f, email: '' })); }}
                      placeholder="exemple@email.com"
                      className={cn('h-11 border-gray-200 shadow-sm pl-9', fieldErrors.email ? 'border-red-400' : '')} />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <LabelIcon icon={Shield} error={fieldErrors.id_role}>Rôle *</LabelIcon>
                  <Select value={form.id_role} onValueChange={(v) => { setForm((f) => ({ ...f, id_role: v })); setFieldErrors((f) => ({ ...f, id_role: '' })); }}>
                    <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', fieldErrors.id_role ? 'border-red-400' : '')}>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (<SelectItem key={r.id} value={String(r.id)}>{r.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.id_role && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_role}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <MapPin className="w-5 h-5 text-amber-700" />
                  <h2 className="text-base font-bold text-gray-800">Localisation</h2>
                </div>

                <div>
                  <LabelIcon icon={MapPin} error={fieldErrors.id_ville}>Ville *</LabelIcon>
                  <Select value={form.id_ville} onValueChange={(v) => { setForm((f) => ({ ...f, id_ville: v })); setFieldErrors((f) => ({ ...f, id_ville: '' })); }}>
                    <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', fieldErrors.id_ville ? 'border-red-400' : '')}>
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {villes.map((v) => (<SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.id_ville && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_ville}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Building2}>Département</LabelIcon>
                    <Select value={form.id_departement} onValueChange={(v) => { setForm((f) => ({ ...f, id_departement: v })); setFieldErrors((f) => ({ ...f, id_departement: '' })); }}>
                      <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', fieldErrors.id_departement ? 'border-red-400' : '')}>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {departements.map((d) => (<SelectItem key={d.id} value={String(d.id)}>{d.nom}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.id_departement && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_departement}</p>}
                  </div>
                  <div>
                    <LabelIcon icon={Map}>Zone</LabelIcon>
                    <Select value={form.id_zone} onValueChange={(v) => { setForm((f) => ({ ...f, id_zone: v })); setFieldErrors((f) => ({ ...f, id_zone: '' })); }}>
                      <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', fieldErrors.id_zone ? 'border-red-400' : '')}>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => (<SelectItem key={z.id} value={String(z.id)}>{z.nom}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.id_zone && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_zone}</p>}
                  </div>
                </div>

                <div>
                  <LabelIcon icon={Locate}>Emplacement</LabelIcon>
                  <Select value={form.id_emplacement} onValueChange={(v) => { setForm((f) => ({ ...f, id_emplacement: v })); setFieldErrors((f) => ({ ...f, id_emplacement: '' })); }}>
                    <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', fieldErrors.id_emplacement ? 'border-red-400' : '')}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {emplacements.map((e) => (<SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.id_emplacement && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_emplacement}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-rose-500 to-rose-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <Lock className="w-5 h-5 text-rose-700" />
                  <h2 className="text-base font-bold text-gray-800">
                    {isEditing ? 'Changer le mot de passe' : 'Mot de passe'}
                  </h2>
                </div>

                {isEditing && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 flex-shrink-0" />
                    Laissez vide pour conserver le mot de passe actuel
                  </p>
                )}

                <div>
                  <LabelIcon icon={Lock} error={fieldErrors.mot_de_passe}>
                    {isEditing ? 'Nouveau mot de passe' : 'Mot de passe *'}
                  </LabelIcon>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="password" value={form.mot_de_passe}
                      onChange={(e) => { setForm((f) => ({ ...f, mot_de_passe: e.target.value })); setFieldErrors((f) => ({ ...f, mot_de_passe: '' })); }}
                      placeholder={isEditing ? 'Nouveau mot de passe' : 'Mot de passe'}
                      className={cn('h-11 border-gray-200 shadow-sm pl-9', fieldErrors.mot_de_passe ? 'border-red-400' : '')} />
                  </div>
                  {fieldErrors.mot_de_passe && <p className="text-xs text-red-500 mt-1">{fieldErrors.mot_de_passe}</p>}
                </div>

                <div>
                  <LabelIcon icon={Lock} error={fieldErrors.mot_de_passe_confirmation}>
                    {isEditing ? 'Confirmation du nouveau mot de passe' : 'Confirmation mot de passe *'}
                  </LabelIcon>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="password" value={form.mot_de_passe_confirmation}
                      onChange={(e) => { setForm((f) => ({ ...f, mot_de_passe_confirmation: e.target.value })); setFieldErrors((f) => ({ ...f, mot_de_passe_confirmation: '' })); }}
                      placeholder="Confirmer le mot de passe"
                      className={cn('h-11 border-gray-200 shadow-sm pl-9', fieldErrors.mot_de_passe_confirmation ? 'border-red-400' : '')} />
                  </div>
                  {fieldErrors.mot_de_passe_confirmation && <p className="text-xs text-red-500 mt-1">{fieldErrors.mot_de_passe_confirmation}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-base font-bold text-gray-800">Statut</h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, actif: !f.actif }))}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                      form.actif ? 'bg-emerald-600' : 'bg-gray-300',
                    )}
                  >
                    <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', form.actif ? 'translate-x-6' : 'translate-x-1')} />
                  </button>
                  <div className="flex items-center gap-2">
                    {form.actif ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm font-medium text-gray-900">{form.actif ? 'Utilisateur actif' : 'Utilisateur inactif'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/configuration/utilisateurs')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {isEditing ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
