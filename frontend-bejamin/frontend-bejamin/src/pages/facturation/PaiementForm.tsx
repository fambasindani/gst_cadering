import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { useToast } from '../../hooks/useToast';
import { paiementService } from '../../services/paiement';
import { factureService } from '../../services/facture';
import { ArrowLeft, Save, Loader2, CreditCard } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PaiementForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [factures, setFactures] = useState<{ id: number; numero_facture: string; client?: { nom: string } | null }[]>([]);

  const [values, setValues] = useState({
    id_facture: '', montant: '', date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: '', reference: '', commentaire: '',
  });

  useEffect(() => {
    factureService.list({ per_page: '200' }).then(r => {
      if (r.success) setFactures(r.data.data.map(f => ({ id: f.id, numero_facture: f.numero_facture, client: f.client })));
    }).catch(() => {});
  }, []);

  const set = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFieldErrors({});
    try {
      await paiementService.create(values as never);
      toast('Paiement enregistré', 'success');
      navigate('/facturation/paiements');
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

  const LabelIcon = ({ children, required, error }: { children: React.ReactNode; required?: boolean; error?: string }) => (
    <Label className={cn('flex items-center gap-1.5 text-sm font-semibold mb-1.5', error ? 'text-red-500' : 'text-gray-700')}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );

  const errorClass = (error?: string) => cn(error && 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30');

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/facturation/paiements')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouveau paiement</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enregistrer un paiement sur une facture</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700" />
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <CreditCard className="w-5 h-5 text-blue-700" />
              <h2 className="text-base font-bold text-gray-800">Détails du paiement</h2>
            </div>

            <div>
              <LabelIcon required error={fieldErrors.id_facture}>Facture</LabelIcon>
              <Select value={values.id_facture} onValueChange={(v) => set('id_facture', v)}>
                <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.id_facture))}>
                  <SelectValue placeholder="Sélectionner une facture" />
                </SelectTrigger>
                <SelectContent>
                  {factures.map((f) => (<SelectItem key={f.id} value={String(f.id)}>{f.numero_facture} - {f.client?.nom || ''}</SelectItem>))}
                </SelectContent>
              </Select>
              {fieldErrors.id_facture && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_facture}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <LabelIcon required error={fieldErrors.montant}>Montant</LabelIcon>
                <Input type="number" step="0.01" min="0.01" value={values.montant}
                  onChange={(e) => set('montant', e.target.value)}
                  className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.montant))} />
                {fieldErrors.montant && <p className="text-xs text-red-500 mt-1">{fieldErrors.montant}</p>}
              </div>
              <div>
                <LabelIcon required error={fieldErrors.date_paiement}>Date de paiement</LabelIcon>
                <Input type="date" value={values.date_paiement}
                  onChange={(e) => set('date_paiement', e.target.value)}
                  className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.date_paiement))} />
                {fieldErrors.date_paiement && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_paiement}</p>}
              </div>
            </div>

            <div>
              <LabelIcon required error={fieldErrors.mode_paiement}>Mode de paiement</LabelIcon>
              <Select value={values.mode_paiement} onValueChange={(v) => set('mode_paiement', v)}>
                <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.mode_paiement))}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIREMENT">Virement</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                  <SelectItem value="ESPECES">Espèces</SelectItem>
                  <SelectItem value="CARTE">Carte</SelectItem>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.mode_paiement && <p className="text-xs text-red-500 mt-1">{fieldErrors.mode_paiement}</p>}
            </div>

            <div>
              <LabelIcon error={fieldErrors.reference}>Référence</LabelIcon>
              <Input value={values.reference} onChange={(e) => set('reference', e.target.value)}
                className="h-11 border-gray-200 shadow-sm" placeholder="Optionnelle" />
            </div>

            <div>
              <LabelIcon>Commentaire</LabelIcon>
              <Textarea value={values.commentaire} onChange={(e) => set('commentaire', e.target.value)}
                rows={2} className="border-gray-200 shadow-sm" placeholder="Optionnel" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/facturation/paiements')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Enregistrer</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
