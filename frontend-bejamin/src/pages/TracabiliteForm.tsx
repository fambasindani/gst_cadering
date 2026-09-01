import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { tracabiliteService } from '../services/tracabilite';
import { lotService } from '../services/lot';
import { departementService } from '../services/departement';
import { partenaireService } from '../services/partenaire';
import type { Lot } from '../types/lot';
import type { Departement } from '../types/departement';
import { ArrowLeft, Save, Loader2, Package, Plus, Trash2, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface LigneForm {
  key: string;
  id_lot: string;
  quantite: string;
  commentaire: string;
}

let ligneKeyCounter = 0;
const newLigne = (): LigneForm => ({
  key: `ligne_${++ligneKeyCounter}`,
  id_lot: '',
  quantite: '',
  commentaire: '',
});

export function TracabiliteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lots, setLots] = useState<Lot[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);

  const [dateTracabilite, setDateTracabilite] = useState(new Date().toISOString().split('T')[0]);
  const [idDepartement, setIdDepartement] = useState('');
  const [idPartenaire, setIdPartenaire] = useState('');
  const [lignes, setLignes] = useState<LigneForm[]>([newLigne()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lotsResult, deptResult, clientResult] = await Promise.allSettled([
        lotService.list({ per_page: '500', sort_by: 'numero_lot', sort_order: 'asc' }),
        departementService.list({ per_page: '500' }),
        partenaireService.getClients(),
      ]);

      if (lotsResult.status === 'fulfilled' && lotsResult.value.success && lotsResult.value.data?.data) {
        setLots(lotsResult.value.data.data);
      } else {
        toast('Erreur lors du chargement des lots', 'error');
      }

      if (deptResult.status === 'fulfilled' && deptResult.value.success && deptResult.value.data?.data) {
        setDepartements(deptResult.value.data.data);
      } else {
        toast('Erreur lors du chargement des départements', 'error');
      }

      if (clientResult.status === 'fulfilled' && clientResult.value.success && clientResult.value.data?.data) {
        setClients(clientResult.value.data.data);
      } else {
        toast('Erreur lors du chargement des clients', 'error');
      }

      if (isEdit && id) {
        const editResult = await tracabiliteService.get(Number(id));
        if (editResult.success && editResult.data) {
          const t = editResult.data as {
            date_tracabilite: string;
            id_departement: number | null;
            id_partenaire: number | null;
            id_lot: number;
            quantite: number;
            commentaire: string | null;
          };
          setDateTracabilite(t.date_tracabilite || new Date().toISOString().split('T')[0]);
          setIdDepartement(t.id_departement ? String(t.id_departement) : '');
          setIdPartenaire(t.id_partenaire ? String(t.id_partenaire) : '');
          setLignes([{
            key: `ligne_${++ligneKeyCounter}`,
            id_lot: String(t.id_lot),
            quantite: String(t.quantite),
            commentaire: t.commentaire || '',
          }]);
        }
      }
    } catch {
      toast('Erreur lors du chargement des données', 'error');
      if (isEdit) {
        navigate('/stock/tracabilite');
      }
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, toast, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateLigne = (key: string, field: string, value: string) => {
    setLignes((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
    setErrors((prev) => {
      const n = { ...prev };
      for (const k of Object.keys(n)) {
        if (k.startsWith('lignes.') && k.endsWith(`.${field}`)) delete n[k];
      }
      return n;
    });
  };

  const removeLigne = (key: string) => {
    if (lignes.length > 1) setLignes((prev) => prev.filter((l) => l.key !== key));
  };

  const addLigne = () => setLignes((prev) => [...prev, newLigne()]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors: Record<string, string> = {};
    if (!dateTracabilite) {
      validationErrors.date_tracabilite = 'La date est requise';
    }

    const lignesValides: LigneForm[] = [];
    const lotsVus = new Set<string>();
    lignes.forEach((l, i) => {
      if (!l.id_lot && !l.quantite && !l.commentaire) return;
      if (!l.id_lot) {
        validationErrors[`lignes.${i}.id_lot`] = 'Sélectionnez un lot';
        return;
      }
      if (lotsVus.has(l.id_lot)) {
        validationErrors[`lignes.${i}.id_lot`] = 'Lot déjà ajouté';
        return;
      }
      if (!l.quantite || parseInt(l.quantite) < 1) {
        validationErrors[`lignes.${i}.quantite`] = 'Quantité invalide';
        return;
      }
      lotsVus.add(l.id_lot);
      lignesValides.push(l);
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (lignesValides.length === 0) {
      setErrors({ general: 'Ajoutez au moins un lot' });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await tracabiliteService.update(Number(id), {
          id_lot: Number(lignesValides[0].id_lot),
          id_departement: idDepartement ? Number(idDepartement) : null,
          id_partenaire: idPartenaire ? Number(idPartenaire) : null,
          quantite: parseInt(lignesValides[0].quantite),
          commentaire: lignesValides[0].commentaire || null,
          date_tracabilite: dateTracabilite,
        });
        toast('Traçabilité mise à jour avec succès', 'success');
      } else {
        await tracabiliteService.createMultiple({
          id_departement: idDepartement ? Number(idDepartement) : null,
          id_partenaire: idPartenaire ? Number(idPartenaire) : null,
          date_tracabilite: dateTracabilite,
          lignes: lignesValides.map((l) => ({
            id_lot: Number(l.id_lot),
            quantite: parseInt(l.quantite),
            commentaire: l.commentaire || undefined,
          })),
        });
        toast(`${lignesValides.length} traçabilité(s) créée(s) avec succès`, 'success');
      }
      navigate('/stock/tracabilite');
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(error.errors)) {
          flat[key] = msgs[0];
        }
        setErrors(flat);
      }
      toast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const getLotInfo = (lotId: string) => lots.find((l) => l.id === Number(lotId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/tracabilite')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier la traçabilité' : 'Nouvelle traçabilité'}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-8 h-8 rounded-full bg-royal-100 flex items-center justify-center">
            <User className="w-4 h-4 text-royal-700" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.full_name || '—'}</p>
            <p className="text-xs text-gray-400">Utilisateur connecté</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-royal-700" />
              Informations communes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de traçabilité <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={dateTracabilite}
                  onChange={(e) => setDateTracabilite(e.target.value)}
                  className={errors.date_tracabilite ? 'border-red-500' : ''}
                />
                {errors.date_tracabilite && (
                  <p className="text-sm text-red-500 mt-1">{errors.date_tracabilite}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <SearchableSelect
                  options={departements.map((d) => ({ id: d.id, nom: d.nom }))}
                  value={idDepartement}
                  onValueChange={setIdDepartement}
                  placeholder="Tous les départements"
                  searchPlaceholder="Rechercher..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <SearchableSelect
                  options={clients.map((c) => ({ id: c.id, nom: c.nom }))}
                  value={idPartenaire}
                  onValueChange={setIdPartenaire}
                  placeholder="Tous les clients"
                  searchPlaceholder="Rechercher un client..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                {isEdit ? 'Détails' : 'Lots à enregistrer'}
              </span>
              {!isEdit && (
                <span className="text-sm font-normal text-gray-500">
                  {lignes.filter((l) => l.id_lot).length} lot(s) sélectionné(s)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        {!isEdit && <TableHead className="font-semibold text-gray-600 w-12">N°</TableHead>}
                        <TableHead className="font-semibold text-gray-600">Lot *</TableHead>
                        <TableHead className="font-semibold text-gray-600">Produit</TableHead>
                        <TableHead className="font-semibold text-gray-600 w-32">Quantité *</TableHead>
                        <TableHead className="font-semibold text-gray-600">Commentaire</TableHead>
                        {!isEdit && <TableHead className="text-center w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lignes.map((l, i) => {
                        const lotInfo = getLotInfo(l.id_lot);
                        return (
                          <TableRow
                            key={l.key}
                            className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}
                          >
                            {!isEdit && (
                              <TableCell className="text-center text-sm text-gray-400 font-mono">
                                {i + 1}
                              </TableCell>
                            )}
                            <TableCell className="min-w-[280px]">
                              <SearchableSelect
                                options={lots.map((lo) => ({
                                  id: lo.id,
                                  nom: lo.numero_lot,
                                  sousTitre: lo.produit?.nom || '',
                                }))}
                                value={l.id_lot}
                                onValueChange={(v) => updateLigne(l.key, 'id_lot', v)}
                                placeholder="Sélectionner un lot"
                                searchPlaceholder="Rechercher un lot..."
                                error={errors[`lignes.${i}.id_lot`]}
                              />
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {lotInfo?.produit?.nom || (
                                <span className="text-gray-300">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={l.quantite}
                                onChange={(e) => updateLigne(l.key, 'quantite', e.target.value)}
                                placeholder="Qté"
                                className={cn(
                                  'text-right h-10',
                                  errors[`lignes.${i}.quantite`] && 'border-red-400'
                                )}
                              />
                              {errors[`lignes.${i}.quantite`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`lignes.${i}.quantite`]}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={l.commentaire}
                                onChange={(e) => updateLigne(l.key, 'commentaire', e.target.value)}
                                placeholder="Optionnel"
                                className="h-10"
                              />
                            </TableCell>
                            {!isEdit && (
                              <TableCell className="text-center">
                                <button
                                  type="button"
                                  onClick={() => removeLigne(l.key)}
                                  disabled={lignes.length <= 1}
                                  className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Supprimer la ligne"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

                {!isEdit && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addLigne}
                    className="bg-royal-100 text-royal-700 hover:bg-royal-200 border-0 shadow-sm text-xs rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un lot
                  </Button>
                )}

                {!isEdit && lignes.filter((l) => l.id_lot && l.quantite).length > 0 && (
                  <div className="bg-royal-50 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-royal-800 mb-2">Récapitulatif</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Lots</p>
                        <p className="font-bold text-gray-900">{lignes.filter((l) => l.id_lot).length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quantité totale</p>
                        <p className="font-bold text-gray-900">
                          {lignes.reduce((s, l) => s + (parseInt(l.quantite) || 0), 0)}
                        </p>
                      </div>
                      {idDepartement && (
                        <div>
                          <p className="text-gray-500">Département</p>
                          <p className="font-bold text-gray-900">
                            {departements.find((d) => d.id === Number(idDepartement))?.nom || '—'}
                          </p>
                        </div>
                      )}
                      {idPartenaire && (
                        <div>
                          <p className="text-gray-500">Client</p>
                          <p className="font-bold text-gray-900">
                            {clients.find((c) => c.id === Number(idPartenaire))?.nom || '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/stock/tracabilite')}
                    className="border-gray-300"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isEdit ? 'Mettre à jour' : 'Enregistrer tout'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
