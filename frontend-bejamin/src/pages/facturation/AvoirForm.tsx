import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useToast } from '../../hooks/useToast';
import { avoirService } from '../../services/avoir';
import { factureService } from '../../services/facture';
import { ArrowLeft, Save, Loader2, FileText, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AvoirForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);
  const [devises, setDevises] = useState<{ id: number; code: string; nom: string; symbole: string }[]>([]);
  const [factures, setFactures] = useState<{ id: number; numero_facture: string }[]>([]);

  const [values, setValues] = useState({
    numero_avoir: '', date_avoir: new Date().toISOString().split('T')[0],
    id_partenaire_client: '', id_facture_origine: '', id_retour: '',
    id_devise: '', montant_ht: '', commentaire: '',
  });

  useEffect(() => {
    Promise.allSettled([
      factureService.getClients(),
      factureService.getDevises(),
      factureService.list({ per_page: '200' }),
    ]).then(([c, d, f]) => {
      if (c.status === 'fulfilled' && c.value.success) setClients(c.value.data.data);
      if (d.status === 'fulfilled' && d.value.success) setDevises(d.value.data.data);
      if (f.status === 'fulfilled' && f.value.success) setFactures(f.value.data.data.map(fac => ({ id: fac.id, numero_facture: fac.numero_facture })));
    });
  }, []);

  const set = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFieldErrors({});
    const payload = {
      ...values,
      id_facture_origine: values.id_facture_origine || undefined,
      id_retour: values.id_retour || undefined,
    };
    try {
      await avoirService.create(payload as never);
      toast('Avoir créé', 'success');
      navigate('/facturation/avoirs');
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]>; message?: string };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(error.errors)) flat[k] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        setFieldErrors(flat);
      }
      toast(error.message || "Erreur d'enregistrement", 'error');
    } finally { setSaving(false); }
  };

  const LabelIcon = ({ icon: Icon, children, required, error }: { icon?: React.ElementType; children: React.ReactNode; required?: boolean; error?: string }) => (
    <Label className={cn('flex items-center gap-1.5 text-sm font-semibold mb-1.5', error ? 'text-red-500' : 'text-gray-700')}>
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );

  const errorClass = (error?: string) => cn(error && 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30');

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/facturation/avoirs')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouvel avoir</h1>
          <p className="text-sm text-gray-500 mt-0.5">Créer un avoir (note de crédit)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-700" />
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <FileText className="w-5 h-5 text-red-700" />
              <h2 className="text-base font-bold text-gray-800">Informations de l'avoir</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <LabelIcon required error={fieldErrors.numero_avoir}>Numéro avoir</LabelIcon>
                <Input value={values.numero_avoir} onChange={(e) => set('numero_avoir', e.target.value)}
                  placeholder="Ex: AV-2026-001" className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.numero_avoir))} />
                {fieldErrors.numero_avoir && <p className="text-xs text-red-500 mt-1">{fieldErrors.numero_avoir}</p>}
              </div>
              <div>
                <LabelIcon required error={fieldErrors.date_avoir}>Date</LabelIcon>
                <Input type="date" value={values.date_avoir} onChange={(e) => set('date_avoir', e.target.value)}
                  className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.date_avoir))} />
                {fieldErrors.date_avoir && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_avoir}</p>}
              </div>
            </div>

            <div>
              <LabelIcon required error={fieldErrors.id_partenaire_client}>Client</LabelIcon>
              <SearchableSelect
                options={clients.map(c => ({ id: c.id, nom: c.nom }))}
                value={values.id_partenaire_client}
                onValueChange={(v) => set('id_partenaire_client', v)}
                placeholder="Sélectionner"
                searchPlaceholder="Rechercher un client..."
                error={fieldErrors.id_partenaire_client}
                className="w-full"
              />
              {fieldErrors.id_partenaire_client && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_partenaire_client}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <LabelIcon error={fieldErrors.id_facture_origine}>Facture d'origine</LabelIcon>
                <SearchableSelect
                  options={factures.map(f => ({ id: f.id, nom: f.numero_facture }))}
                  value={values.id_facture_origine}
                  onValueChange={(v) => set('id_facture_origine', v)}
                  placeholder="Optionnelle (aucune)"
                  searchPlaceholder="Rechercher une facture..."
                  error={fieldErrors.id_facture_origine}
                />
              </div>
              <div>
                <LabelIcon icon={DollarSign} required error={fieldErrors.id_devise}>Devise</LabelIcon>
                <SearchableSelect
                  options={devises.map(d => ({ id: d.id, nom: `${d.code} - ${d.nom}` }))}
                  value={values.id_devise}
                  onValueChange={(v) => set('id_devise', v)}
                  placeholder="Sélectionner"
                  searchPlaceholder="Rechercher une devise..."
                  error={fieldErrors.id_devise}
                />
                {fieldErrors.id_devise && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_devise}</p>}
              </div>
            </div>

            <div>
              <LabelIcon required error={fieldErrors.montant_ht}>Montant HT</LabelIcon>
              <Input type="number" step="0.01" min="0.01" value={values.montant_ht}
                onChange={(e) => set('montant_ht', e.target.value)}
                className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.montant_ht))} />
              {fieldErrors.montant_ht && <p className="text-xs text-red-500 mt-1">{fieldErrors.montant_ht}</p>}
            </div>

            <div>
              <LabelIcon>Commentaire</LabelIcon>
              <Textarea value={values.commentaire} onChange={(e) => set('commentaire', e.target.value)}
                rows={2} className="border-gray-200 shadow-sm" placeholder="Optionnel" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/facturation/avoirs')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Créer l'avoir</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
