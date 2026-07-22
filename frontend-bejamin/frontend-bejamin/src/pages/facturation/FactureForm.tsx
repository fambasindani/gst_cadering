import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { useToast } from '../../hooks/useToast';
import { factureService } from '../../services/facture';
import { produitService } from '../../services/produit';
import { ArrowLeft, Save, Loader2, Plus, Trash2, FileText, MapPin, Hash, DollarSign, Package } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LigneRow {
  key: string;
  id_produit: string;
  quantite: string;
  prix_unitaire_ht: string;
  remise: string;
  id_lot: string;
}

let rowKeyCounter = 0;
const newRow = (): LigneRow => ({
  key: `l_${++rowKeyCounter}`,
  id_produit: '',
  quantite: '1',
  prix_unitaire_ht: '',
  remise: '0',
  id_lot: '',
});

export function FactureForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);
  const [villes, setVilles] = useState<{ id: number; nom: string }[]>([]);
  const [devises, setDevises] = useState<{ id: number; code: string; nom: string; symbole: string }[]>([]);
  const [produits, setProduits] = useState<{ id: number; nom: string; code_article: string }[]>([]);
  const [bons, setBons] = useState<{ id: number; numero_commande: string }[]>([]);

  const [values, setValues] = useState({
    numero_facture: '', date_facture: new Date().toISOString().split('T')[0],
    date_echeance: '', id_partenaire_client: '', id_bon_commande: '',
    id_ville: '', id_devise: '', commentaire: '',
  });

  const [lignes, setLignes] = useState<LigneRow[]>([newRow()]);

  useEffect(() => {
    Promise.allSettled([
      factureService.getClients(),
      factureService.getVilles(),
      factureService.getDevises(),
      factureService.getProduits(),
      factureService.getBonsCommandes(),
    ]).then(([c, v, d, p, b]) => {
      if (c.status === 'fulfilled' && c.value.success) setClients(c.value.data.data);
      if (v.status === 'fulfilled' && v.value.success) setVilles(v.value.data.data);
      if (d.status === 'fulfilled' && d.value.success) setDevises(d.value.data.data);
      if (p.status === 'fulfilled' && p.value.success) setProduits(p.value.data.data);
      if (b.status === 'fulfilled' && b.value.success) setBons(b.value.data.data);
      const rejected = [c, v, d, p, b].filter(r => r.status === 'rejected');
      if (rejected.length > 0) {
        console.warn('FactureForm : certains appels API ont échoué', rejected);
      }
    });
  }, []);

  useEffect(() => {
    if (id) {
      setLoading(true);
      factureService.get(Number(id))
        .then((res) => {
          if (res.success) {
            const f = res.data;
            setValues({
              numero_facture: f.numero_facture, date_facture: f.date_facture?.split('T')[0] || '',
              date_echeance: f.date_echeance?.split('T')[0] || '',
              id_partenaire_client: String(f.id_partenaire_client),
              id_bon_commande: f.id_bon_commande ? String(f.id_bon_commande) : '',
              id_ville: String(f.id_ville), id_devise: String(f.id_devise),
              commentaire: f.commentaire || '',
            });
            if (f.lignes && f.lignes.length > 0) {
              setLignes(f.lignes.map((l) => ({
                key: `l_${++rowKeyCounter}`,
                id_produit: String(l.id_produit),
                quantite: String(l.quantite),
                prix_unitaire_ht: String(l.prix_unitaire_ht),
                remise: String(l.remise || 0),
                id_lot: l.id_lot ? String(l.id_lot) : '',
              })));
            }
          }
        })
        .catch(() => toast('Erreur de chargement', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const set = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const updateLigne = (key: string, field: string, value: string) => {
    setLignes(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));
  };

  const removeLigne = (key: string) => { if (lignes.length > 1) setLignes(prev => prev.filter(r => r.key !== key)); };
  const addLigne = () => setLignes(prev => [...prev, newRow()]);

  const onProduitChange = (key: string, produitId: string) => {
    updateLigne(key, 'id_produit', produitId);
    if (!produitId) return;
    produitService.get(Number(produitId)).then((res) => {
      if (!res.success) return;
      const hp = res.data.historique_prix;
      if (hp && hp.length > 0) {
        const sorted = [...hp].sort((a, b) => new Date(b.date_application).getTime() - new Date(a.date_application).getTime());
        const dernier = sorted[0];
        if (dernier.prix_vente_ht) updateLigne(key, 'prix_unitaire_ht', String(dernier.prix_vente_ht));
      }
    }).catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFieldErrors({});
    const payload = {
      ...values,
      id_bon_commande: values.id_bon_commande || undefined,
      lignes: lignes.map(({ key, ...r }) => ({
        ...r,
        quantite: Number(r.quantite),
        prix_unitaire_ht: Number(r.prix_unitaire_ht),
        remise: Number(r.remise),
        id_lot: r.id_lot || undefined,
      })),
    };
    try {
      if (isEdit && id) {
        await factureService.update(Number(id), payload);
        toast('Facture modifiée', 'success');
      } else {
        await factureService.create(payload as never);
        toast('Facture créée', 'success');
      }
      navigate('/facturation/factures');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  const LabelIcon = ({ icon: Icon, children, required, error }: { icon?: React.ElementType; children: React.ReactNode; required?: boolean; error?: string }) => (
    <Label className={cn('flex items-center gap-1.5 text-sm font-semibold mb-1.5', error ? 'text-red-500' : 'text-gray-700')}>
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );

  const errorClass = (error?: string) => cn(error && 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/facturation/factures')}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier la facture' : 'Nouvelle facture'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? 'Modifier les informations' : 'Créer une nouvelle facture'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-royal-500 to-royal-700" />
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <FileText className="w-5 h-5 text-royal-700" />
              <h2 className="text-base font-bold text-gray-800">Informations générales</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <LabelIcon icon={Hash} required error={fieldErrors.numero_facture}>Numéro facture</LabelIcon>
                <Input value={values.numero_facture} onChange={(e) => set('numero_facture', e.target.value)}
                  placeholder="Ex: FAC-2026-001" className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.numero_facture))} />
                {fieldErrors.numero_facture && <p className="text-xs text-red-500 mt-1">{fieldErrors.numero_facture}</p>}
              </div>
              <div>
                <LabelIcon required error={fieldErrors.date_facture}>Date facture</LabelIcon>
                <Input type="date" value={values.date_facture} onChange={(e) => set('date_facture', e.target.value)}
                  className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.date_facture))} />
                {fieldErrors.date_facture && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_facture}</p>}
              </div>
              <div>
                <LabelIcon required error={fieldErrors.date_echeance}>Date échéance</LabelIcon>
                <Input type="date" value={values.date_echeance} onChange={(e) => set('date_echeance', e.target.value)}
                  className={cn('h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.date_echeance))} />
                {fieldErrors.date_echeance && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_echeance}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <LabelIcon icon={Package} required error={fieldErrors.id_partenaire_client}>Client</LabelIcon>
                <Select value={values.id_partenaire_client} onValueChange={(v) => set('id_partenaire_client', v)}>
                  <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.id_partenaire_client))}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
                {fieldErrors.id_partenaire_client && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_partenaire_client}</p>}
              </div>
              <div>
                <LabelIcon error={fieldErrors.id_bon_commande}>Bon de commande</LabelIcon>
                <Select value={values.id_bon_commande} onValueChange={(v) => set('id_bon_commande', v)}>
                  <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.id_bon_commande))}>
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Aucun</SelectItem>
                    {bons.map((b) => (<SelectItem key={b.id} value={String(b.id)}>{b.numero_commande}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <LabelIcon icon={MapPin} required error={fieldErrors.id_ville}>Ville</LabelIcon>
                <Select value={values.id_ville} onValueChange={(v) => set('id_ville', v)}>
                  <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.id_ville))}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {villes.map((v) => (<SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
                {fieldErrors.id_ville && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_ville}</p>}
              </div>
              <div>
                <LabelIcon icon={DollarSign} required error={fieldErrors.id_devise}>Devise</LabelIcon>
                <Select value={values.id_devise} onValueChange={(v) => set('id_devise', v)}>
                  <SelectTrigger className={cn('w-full h-11 border-gray-200 shadow-sm', errorClass(fieldErrors.id_devise))}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {devises.map((d) => (<SelectItem key={d.id} value={String(d.id)}>{d.code} - {d.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
                {fieldErrors.id_devise && <p className="text-xs text-red-500 mt-1">{fieldErrors.id_devise}</p>}
              </div>
            </div>

            <div>
              <LabelIcon>Commentaire</LabelIcon>
              <Textarea value={values.commentaire} onChange={(e) => set('commentaire', e.target.value)}
                rows={2} className="border-gray-200 shadow-sm" placeholder="Optionnel" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden mt-6">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-gray-800">Lignes de la facture</h2>
              </div>
              <Button type="button" size="sm" onClick={addLigne}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs rounded-lg">
                <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Produit *</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Qté *</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">P.U. HT *</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Remise %</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Total HT</TableHead>
                    <TableHead className="text-center w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((r, i) => {
                    const totalLigne = (Number(r.quantite) || 0) * (Number(r.prix_unitaire_ht) || 0) * (1 - (Number(r.remise) || 0) / 100);
                    return (
                      <TableRow key={r.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <TableCell className="min-w-[200px]">
                          <Select value={r.id_produit} onValueChange={(v) => onProduitChange(r.key, v)}>
                            <SelectTrigger className="w-full border-gray-200 shadow-sm">
                              <SelectValue placeholder="Produit" />
                            </SelectTrigger>
                            <SelectContent>
                              {produits.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.code_article ? `[${p.code_article}] ${p.nom}` : p.nom}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="w-24">
                          <Input type="number" min="1" step="1" value={r.quantite}
                            onChange={(e) => updateLigne(r.key, 'quantite', e.target.value)}
                            className="text-right h-10 border-gray-200 shadow-sm px-2" />
                        </TableCell>
                        <TableCell className="w-28">
                          <Input type="number" step="0.01" min="0" value={r.prix_unitaire_ht}
                            onChange={(e) => updateLigne(r.key, 'prix_unitaire_ht', e.target.value)}
                            className="text-right h-10 border-gray-200 shadow-sm" placeholder="0.00" />
                        </TableCell>
                        <TableCell className="w-24">
                          <Input type="number" step="1" min="0" max="100" value={r.remise}
                            onChange={(e) => updateLigne(r.key, 'remise', e.target.value)}
                            className="text-right h-10 border-gray-200 shadow-sm px-2" />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-gray-800 w-28">
                          {totalLigne.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center w-12">
                          <button type="button" onClick={() => removeLigne(r.key)} disabled={lignes.length <= 1}
                            className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <Button type="button" size="sm" onClick={addLigne}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs rounded-lg">
                <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une ligne
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/facturation/factures')}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="h-11 px-8 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-xl shadow-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {isEdit ? 'Enregistrer' : 'Créer la facture'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
