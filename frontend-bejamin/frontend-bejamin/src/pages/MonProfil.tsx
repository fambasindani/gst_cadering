import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Save, User, Shield, MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';

export function MonProfil() {
  const { user, login: updateStoreUser } = useAuthStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    mot_de_passe: '',
    mot_de_passe_confirmation: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const payload: Record<string, string> = {};
    if (form.nom !== user?.nom) payload.nom = form.nom;
    if (form.prenom !== user?.prenom) payload.prenom = form.prenom;
    if (form.email !== user?.email) payload.email = form.email;
    if (form.mot_de_passe) {
      payload.mot_de_passe = form.mot_de_passe;
      payload.mot_de_passe_confirmation = form.mot_de_passe_confirmation;
    }

    if (Object.keys(payload).length === 0) return;

    try {
      setSaving(true);
      const res = await authService.updateProfile(payload);
      if (res.success) {
        // Update the store with new user data
        useAuthStore.setState({ user: res.data.utilisateur });
        setSuccess('Profil mis à jour avec succès');
        setForm(prev => ({ ...prev, mot_de_passe: '', mot_de_passe_confirmation: '' }));
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const fieldErrs: Record<string, string> = {};
        Object.entries(error.errors).forEach(([key, msgs]) => {
          fieldErrs[key] = (msgs as string[])[0];
        });
        setFieldErrors(fieldErrs);
      }
      setError(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton height={40} width={250} />
        <Skeleton height={200} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-sm text-gray-500">Consultez et modifiez vos informations personnelles</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="overflow-hidden rounded-xl shadow-sm border-0">
          <div className="bg-gradient-to-r from-royal-700 to-royal-500 px-6 py-4">
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Identité
            </CardTitle>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  className={fieldErrors.nom ? 'border-red-500' : ''}
                />
                {fieldErrors.nom && <p className="text-xs text-red-500">{fieldErrors.nom}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  className={fieldErrors.prenom ? 'border-red-500' : ''}
                />
                {fieldErrors.prenom && <p className="text-xs text-red-500">{fieldErrors.prenom}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={fieldErrors.email ? 'border-red-500' : ''}
              />
              {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl shadow-sm border-0">
          <div className="bg-gradient-to-r from-amber-700 to-amber-500 px-6 py-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Mot de passe
            </CardTitle>
          </div>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-gray-500">Laissez vide pour conserver le mot de passe actuel.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mot_de_passe">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="mot_de_passe"
                    name="mot_de_passe"
                    type={showPassword ? 'text' : 'password'}
                    value={form.mot_de_passe}
                    onChange={handleChange}
                    className={fieldErrors.mot_de_passe ? 'border-red-500 pr-10' : 'pr-10'}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.mot_de_passe && <p className="text-xs text-red-500">{fieldErrors.mot_de_passe}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mot_de_passe_confirmation">Confirmer le mot de passe</Label>
                <Input
                  id="mot_de_passe_confirmation"
                  name="mot_de_passe_confirmation"
                  type="password"
                  value={form.mot_de_passe_confirmation}
                  onChange={handleChange}
                  className={fieldErrors.mot_de_passe_confirmation ? 'border-red-500' : ''}
                  placeholder="••••••••"
                />
                {fieldErrors.mot_de_passe_confirmation && <p className="text-xs text-red-500">{fieldErrors.mot_de_passe_confirmation}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl shadow-sm border-0">
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informations
            </CardTitle>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Rôle</p>
                <p className="font-medium">{user.role?.nom || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ville</p>
                <p className="font-medium">{user.ville?.nom || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Département</p>
                <p className="font-medium">{user.departement?.nom || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Zone</p>
                <p className="font-medium">{user.zone?.nom || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Emplacement</p>
                <p className="font-medium">{user.emplacement?.nom || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dernière connexion</p>
                <p className="font-medium">{user.derniere_connexion ? new Date(user.derniere_connexion).toLocaleDateString('fr-FR') : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving} className="bg-royal-700 hover:bg-royal-800 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
