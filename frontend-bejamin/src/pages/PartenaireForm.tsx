import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Card, CardContent } from '../components/ui/card';
import {
  Building2, Plane, Package, MapPin, Mail, Phone,
  FileText, Globe, ArrowLeft, Save, Hash, CheckCircle,
  User, Tag,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { partenaireService } from '../services/partenaire';
import { useToast } from '../hooks/useToast';
import type { Magasin } from '../types/partenaire';

interface FormData {
  type: string;
  type_client: string;
  code_iata: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  identifiant_fiscal: string;
  id_magasin: string;
  actif: boolean;
}

function validate(data: FormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!['fournisseur', 'client', 'both'].includes(data.type)) errs.type = 'Le type est obligatoire';
  if (!data.nom || data.nom.trim().length === 0) errs.nom = 'Le nom est obligatoire';
  else if (data.nom.length > 150) errs.nom = 'Le nom ne peut pas dépasser 150 caractères';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide';
  if (data.code_iata && data.code_iata.length > 10) errs.code_iata = 'Le code IATA ne peut pas dépasser 10 caractères';
  if (data.telephone && data.telephone.length > 20) errs.telephone = 'Le téléphone ne peut pas dépasser 20 caractères';
  if (data.identifiant_fiscal && data.identifiant_fiscal.length > 50) errs.identifiant_fiscal = "L'identifiant fiscal ne peut pas dépasser 50 caractères";
  return errs;
}

export function PartenaireForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const isEditing = !!id;
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [form, setForm] = useState<FormData>({
    type: 'client', type_client: 'aerien', code_iata: '', nom: '', adresse: '',
    telephone: '', email: '', identifiant_fiscal: '', id_magasin: '', actif: true,
  });

  useEffect(() => {
    partenaireService.getMagasins().then((res) => { if (res.success) setMagasins(res.data.data); }).catch(() => {});
    if (isEditing) {
      partenaireService.get(Number(id)).then((res) => {
        if (res.success) {
          const p = res.data;
          setForm({
            type: p.type, type_client: p.type_client || '', code_iata: p.code_iata || '',
            nom: p.nom, adresse: p.adresse || '', telephone: p.telephone || '',
            email: p.email || '', identifiant_fiscal: p.identifiant_fiscal || '',
            id_magasin: String(p.id_magasin || ''), actif: p.actif,
          });
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    const payload = { ...form };
    if (payload.type !== 'client' && payload.type !== 'both') { payload.type_client = ''; payload.code_iata = ''; }
    try {
      setSaving(true);
      if (isEditing) {
        await partenaireService.update(Number(id), payload);
        toast('Partenaire modifié avec succès', 'success');
      } else {
        await partenaireService.create(payload as any);
        toast('Partenaire créé avec succès', 'success');
      }
      navigate('/partenaire');
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(error.errors)) fieldErrors[field] = messages[0];
        setErrors(fieldErrors);
      }
      const errMsg = error.message || "Erreur lors de l'enregistrement";
      setGeneralError(errMsg);
      toast(errMsg, 'error');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-royal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showClientFields = form.type === 'client' || form.type === 'both';
  const showIata = form.type_client === 'aerien' || form.type_client === 'both';

  const LabelIcon = ({ icon: Icon, children, required, error }: { icon?: React.ElementType; children: React.ReactNode; required?: boolean; error?: string }) => (
    <Label className={cn('flex items-center gap-1.5 text-sm font-semibold mb-1.5', error ? 'text-red-500' : 'text-gray-700')}>
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/partenaire')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-400 text-gray-500 hover:text-gray-100 hover:border-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'Modifier le partenaire' : 'Nouveau partenaire'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing ? 'Modifier les informations du partenaire' : 'Ajouter un nouveau partenaire'}
          </p>
        </div>
      </div>

      {generalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{generalError}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
          <CardContent className="p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-5">
              <User className="w-5 h-5 text-royal-700" />
              <h2 className="text-base font-bold text-gray-800">Type de partenaire</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['fournisseur', 'client', 'both'] as const).map((type) => {
                const icons: Record<string, React.ReactNode> = {
                  fournisseur: <Package className="w-8 h-8" />,
                  client: <Building2 className="w-8 h-8" />,
                  both: <Globe className="w-8 h-8" />,
                };
                return (
                  <button key={type} type="button" onClick={() => handleChange('type', type)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-5 rounded-md border-2 transition-all',
                      form.type === type
                        ? 'border-royal-700 bg-royal-50 text-royal-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-royal-300 hover:bg-royal-50/50',
                    )}>
                    <span className={cn('p-3 rounded-full', form.type === type ? 'bg-royal-100 text-royal-700' : 'bg-gray-100 text-gray-500')}>
                      {icons[type]}
                    </span>
                    <span className="font-semibold text-sm">
                      {type === 'fournisseur' ? 'Fournisseur' : type === 'client' ? 'Client' : 'Les deux'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {type === 'fournisseur' ? 'Fournit des produits' : type === 'client' ? 'Achète des produits' : 'Client & fournisseur'}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.type && <p className="mt-3 text-sm text-red-500">{errors.type}</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mt-6">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <FileText className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-gray-800">Informations générales</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <LabelIcon icon={User} required error={errors.nom}>Nom</LabelIcon>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={form.nom} onChange={(e) => handleChange('nom', e.target.value)}
                    placeholder="Nom du partenaire"
                    className={cn('pl-10 h-11 border-gray-200 shadow-sm', errors.nom ? 'border-red-500' : '')} />
                </div>
                {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
              </div>
              <div>
                <LabelIcon icon={MapPin}>Adresse</LabelIcon>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={form.adresse} onChange={(e) => handleChange('adresse', e.target.value)}
                    placeholder="Adresse postale"
                    className="pl-10 h-11 border-gray-200 shadow-sm" />
                </div>
              </div>
              <div>
                <LabelIcon icon={Mail} error={errors.email}>Email</LabelIcon>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contact@exemple.com"
                    className={cn('pl-10 h-11 border-gray-200 shadow-sm', errors.email ? 'border-red-500' : '')} />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <LabelIcon icon={Phone} error={errors.telephone}>Téléphone</LabelIcon>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={form.telephone} onChange={(e) => handleChange('telephone', e.target.value)}
                    placeholder="+243 000 000 000"
                    className={cn('pl-10 h-11 border-gray-200 shadow-sm', errors.telephone ? 'border-red-500' : '')} />
                </div>
                {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
              </div>
              <div>
                <LabelIcon icon={Hash}>Identifiant fiscal</LabelIcon>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={form.identifiant_fiscal} onChange={(e) => handleChange('identifiant_fiscal', e.target.value)}
                    placeholder="NIF"
                    className="pl-10 h-11 border-gray-200 shadow-sm" />
                </div>
              </div>
              <div>
                <LabelIcon icon={MapPin}>Magasin</LabelIcon>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <SearchableSelect
                    options={magasins.map(v => ({ id: v.id, nom: v.nom }))}
                    value={form.id_magasin}
                    onValueChange={(value) => handleChange('id_magasin', value)}
                    placeholder="Sélectionner un magasin"
                    searchPlaceholder="Rechercher un magasin..."
                    error={errors.id_magasin}
                  />
                </div>
              </div>
            </div>

            {showClientFields && (
              <div className="pt-5 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-700" />
                  Informations client
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <LabelIcon icon={Building2}>Type client</LabelIcon>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <SearchableSelect
                        options={[
                          { id: 1, nom: 'Aérien' },
                          { id: 2, nom: 'Non Aérien' },
                          { id: 3, nom: 'Les deux' },
                        ]}
                        value={form.type_client}
                        onValueChange={(value) => handleChange('type_client', value)}
                        placeholder="Type de client"
                        searchPlaceholder="Rechercher un type..."
                        error={errors.type_client}
                      />
                    </div>
                  </div>
                  {showIata && (
                    <div>
                      <LabelIcon icon={Plane}>Code IATA</LabelIcon>
                      <div className="relative">
                        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input value={form.code_iata} onChange={(e) => handleChange('code_iata', e.target.value.toUpperCase())}
                          placeholder="EX: BA123" maxLength={10}
                          className="pl-10 h-11 border-gray-200 shadow-sm uppercase" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mt-6">
          <div className="h-1.5 bg-gradient-to-r from-sky-500 to-sky-700" />
          <CardContent className="p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
              <CheckCircle className="w-5 h-5 text-sky-700" />
              <h2 className="text-base font-bold text-gray-800">Statut</h2>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.actif} onChange={(e) => handleChange('actif', e.target.checked)}
                className="w-5 h-5 text-royal-700 border-gray-300 rounded focus:ring-royal-500" />
              <div>
                <span className="text-sm font-medium text-gray-700">Partenaire actif</span>
                <p className="text-xs text-gray-400">Décochez pour désactiver ce partenaire</p>
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/partenaire')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm">
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {isEditing ? 'Modifier' : 'Créer le partenaire'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
