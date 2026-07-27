import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { SlidePanel } from '../components/ui/SlidePanel';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { produitService } from '../services/produit';
import { useToast } from '../hooks/useToast';
import type { Produit } from '../types/produit';
import type { StockResponse } from '../types/produit';
import type { HistoriquePrix } from '../types/produit';
import {
  ArrowLeft, Pencil, Package, DollarSign, Building2, AlertCircle,
  CheckCircle, XCircle, Scale, Hash, Barcode, Tag, FileText,
  Warehouse, TrendingUp, Calendar, Plus, Loader2, Trash2, Save,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';

export function ProduitDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [produit, setProduit] = useState<Produit | null>(null);
  const [stock, setStock] = useState<StockResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  const [prixPanelOpen, setPrixPanelOpen] = useState(false);
  const [editingPrix, setEditingPrix] = useState<HistoriquePrix | null>(null);
  const [deletePrixTarget, setDeletePrixTarget] = useState<HistoriquePrix | null>(null);
  const [devises, setDevises] = useState<Array<{ id: number; code: string; nom: string; symbole: string }>>([]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [pRes, sRes, dRes] = await Promise.all([
        produitService.get(Number(id)),
        produitService.getStock(Number(id)),
        produitService.getDevises({ per_page: '200', sort_by: 'nom', sort_order: 'asc' }),
      ]);
      if (pRes.success) setProduit(pRes.data);
      if (sRes.success) setStock(sRes.data);
      if (dRes.success) setDevises(dRes.data.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshData = () => {
    if (!id) return;
    produitService.get(Number(id)).then((res) => {
      if (res.success) setProduit(res.data);
    });
  };

  const handleToggle = async () => {
    if (!id) return;
    try {
      const res = await produitService.toggle(Number(id));
      if (res.success) {
        setProduit(res.data);
        toast(res.message, 'success');
      }
    } catch {
      toast("Erreur lors de la modification du statut", 'error');
    }
  };

  const [prixForm, setPrixForm] = useState({
    prix_achat_ht: '',
    prix_vente_ht: '',
    id_devise: '',
    date_application: new Date().toISOString().slice(0, 10),
    commentaire: '',
  });
  const [savingPrix, setSavingPrix] = useState(false);
  const [prixErrors, setPrixErrors] = useState<Record<string, string>>({});

  const handleAjouterPrix = async () => {
    if (!id) return;
    setSavingPrix(true);
    setPrixErrors({});
    try {
      if (editingPrix) {
        await produitService.updatePrix(editingPrix.id, {
          prix_achat_ht: Number(prixForm.prix_achat_ht),
          prix_vente_ht: prixForm.prix_vente_ht ? Number(prixForm.prix_vente_ht) : null,
          id_devise: Number(prixForm.id_devise),
          date_application: prixForm.date_application || undefined,
          commentaire: prixForm.commentaire || undefined,
        });
        toast('Prix modifié avec succès', 'success');
      } else {
        await produitService.addPrix({
          id_produit: Number(id),
          prix_achat_ht: Number(prixForm.prix_achat_ht),
          prix_vente_ht: prixForm.prix_vente_ht ? Number(prixForm.prix_vente_ht) : null,
          id_devise: Number(prixForm.id_devise),
          date_application: prixForm.date_application || undefined,
          commentaire: prixForm.commentaire || undefined,
        });
        toast('Prix ajouté avec succès', 'success');
      }
      setPrixPanelOpen(false);
      setEditingPrix(null);
      setPrixForm({
        prix_achat_ht: '',
        prix_vente_ht: '',
        id_devise: '',
        date_application: new Date().toISOString().slice(0, 10),
        commentaire: '',
      });
      refreshData();
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]>; message?: string };
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(error.errors)) {
          flat[k] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setPrixErrors(flat);
      }
      toast(error.message || "Erreur lors de l'enregistrement du prix", 'error');
    } finally {
      setSavingPrix(false);
    }
  };

  const handleDeletePrix = async () => {
    if (!deletePrixTarget) return;
    try {
      await produitService.deletePrix(deletePrixTarget.id);
      toast('Prix supprimé avec succès', 'success');
      setDeletePrixTarget(null);
      refreshData();
    } catch {
      toast("Erreur lors de la suppression du prix", 'error');
    }
  };

  const openEditPrix = (h: HistoriquePrix) => {
    setEditingPrix(h);
    setPrixForm({
      prix_achat_ht: String(h.prix_achat_ht),
      prix_vente_ht: h.prix_vente_ht != null ? String(h.prix_vente_ht) : '',
      id_devise: String(h.id_devise),
      date_application: h.date_application || new Date().toISOString().slice(0, 10),
      commentaire: h.commentaire || '',
    });
    setPrixPanelOpen(true);
  };

  const openNewPrix = () => {
    setEditingPrix(null);
    setPrixForm({
      prix_achat_ht: '',
      prix_vente_ht: '',
      id_devise: '',
      date_application: new Date().toISOString().slice(0, 10),
      commentaire: '',
    });
    setPrixPanelOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 bg-gray-200 rounded w-3/4" />
              ))}
            </CardContent></Card>
          </div>
          <div className="space-y-6">
            <Card><CardContent className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 bg-gray-200 rounded" />
              ))}
            </CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Produit non trouvé</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/produits')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  const historique = produit.historique_prix || [];
  const latestPrice = historique[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/produits')}
            className="p-0 h-9 w-9 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{produit.nom}</h1>
              <Badge
                variant={produit.actif ? 'default' : 'secondary'}
                className={cn(
                  'text-xs font-medium',
                  produit.actif ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200',
                )}
              >
                {produit.actif ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Code article: <span className="font-mono font-medium text-gray-700">{produit.code_article}</span>
              {produit.code_barre ? (
                <> | Code barre: <span className="font-mono font-medium text-gray-700">{produit.code_barre}</span></>
              ) : null}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/produits/${id}/modifier`)}
          className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-royal-600" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <DetailItem icon={<Hash className="w-4 h-4" />} label="Code article" value={produit.code_article} monospace />
                <DetailItem icon={<Barcode className="w-4 h-4" />} label="Code barre" value={produit.code_barre || '-'} monospace />
                <DetailItem icon={<Tag className="w-4 h-4" />} label="Catégorie" value={produit.categorie?.nom || '-'} />
                <DetailItem icon={<Scale className="w-4 h-4" />} label="Unité" value={produit.unite ? `${produit.unite.nom} (${produit.unite.symbole})` : '-'} />
                <DetailItem icon={<Building2 className="w-4 h-4" />} label="Fournisseur" value={produit.partenaire_principal?.nom || '-'} />
                <DetailItem icon={<AlertCircle className="w-4 h-4" />} label="Seuil d'alerte" value={String(produit.seuil_alerte ?? 0)} />
                {latestPrice ? (
                  <>
                    <DetailItem
                      icon={<DollarSign className="w-4 h-4" />}
                      label="Prix d'achat HT"
                      value={formatCurrency(latestPrice.prix_achat_ht, latestPrice.devise?.code)}
                    />
                    <DetailItem
                      icon={<TrendingUp className="w-4 h-4" />}
                      label="Prix de vente HT"
                      value={latestPrice.prix_vente_ht != null
                        ? formatCurrency(latestPrice.prix_vente_ht, latestPrice.devise?.code)
                        : '-'
                      }
                    />
                  </>
                ) : null}
                <div className="md:col-span-2">
                  <dt className="text-sm text-gray-500 flex items-center gap-1.5 mb-1">
                    <FileText className="w-4 h-4" /> Description
                  </dt>
                  <dd className="text-sm text-gray-900">{produit.description || '—'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-royal-600" />
                  Historique des prix
                </CardTitle>
                <Button
                  size="sm"
                  onClick={openNewPrix}
                  className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Nouveau prix
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {historique.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">Aucun historique de prix</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-600">Date</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Prix achat HT</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Prix vente HT</TableHead>
                        <TableHead className="font-semibold text-gray-600">Devise</TableHead>
                        <TableHead className="hidden md:table-cell font-semibold text-gray-600">Commentaire</TableHead>
                        <TableHead className="text-center font-semibold text-gray-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historique.map((h, i) => (
                        <TableRow key={h.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <TableCell className="text-sm text-gray-700">
                            {h.date_application ? new Date(h.date_application).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium text-gray-900">
                            {formatCurrency(h.prix_achat_ht)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">
                            {h.prix_vente_ht != null
                              ? formatCurrency(h.prix_vente_ht)
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">{h.devise?.code || '-'}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-gray-500">{h.commentaire || '-'}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditPrix(h)}
                                className="p-1 rounded text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                title="Modifier"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletePrixTarget(h)}
                                className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            className={cn(
              'border-0 shadow-sm',
              stock?.statut?.includes('Stock bas') ? 'ring-2 ring-amber-300' : '',
            )}
          >
            <CardHeader
              className={cn(
                'pb-3 border-b',
                stock?.statut?.includes('Stock bas') ? 'border-amber-100' : 'border-gray-100',
              )}
            >
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-royal-600" />
                Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {stock ? (
                <>
                  <div className="text-center py-3">
                    <div className="text-4xl font-bold text-gray-900">{stock.stock_total}</div>
                    <div className="text-sm text-gray-500 mt-1">Stock total ({stock.produit.unite})</div>
                  </div>

                  <div
                    className={cn(
                      'flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                      stock.statut.includes('Stock bas')
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-emerald-50 text-emerald-800',
                    )}
                  >
                    {stock.statut.includes('Stock bas') ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        {stock.statut}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Stock normal
                      </>
                    )}
                  </div>

                  {stock.stock_par_ville.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Répartition par ville</p>
                      {stock.stock_par_ville.map((sv) => (
                        <div key={sv.ville_id} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-gray-700">{sv.ville}</span>
                          <span
                            className={cn(
                              'text-sm font-mono font-semibold',
                              sv.stock <= (stock.seuil_alerte || 0) ? 'text-amber-600' : 'text-gray-900',
                            )}
                          >
                            {sv.stock}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
              )}
            </CardContent>
          </Card>

          {latestPrice ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-royal-600" />
                  Dernier prix
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Prix d'achat HT</div>
                  <div className="text-2xl font-bold text-gray-900 font-mono">
                    {formatCurrency(latestPrice.prix_achat_ht)}
                    <span className="text-sm font-medium text-gray-500 ml-1">{latestPrice.devise?.code || ''}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Prix de vente HT</div>
                  <div className="text-xl font-semibold text-gray-800 font-mono">
                    {latestPrice.prix_vente_ht != null
                      ? formatCurrency(latestPrice.prix_vente_ht, latestPrice.devise?.code)
                      : '-'
                    }
                  </div>
                </div>
                <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Depuis le {latestPrice.date_application
                    ? new Date(latestPrice.date_application).toLocaleDateString('fr-FR')
                    : '-'
                  }
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => navigate(`/produits/${id}/modifier`)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Modifier le produit
              </Button>
              <Button
                variant={produit.actif ? 'outline' : 'default'}
                className={cn(
                  'w-full justify-start',
                  produit.actif
                    ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600',
                )}
                onClick={handleToggle}
              >
                {produit.actif ? (
                  <XCircle className="w-4 h-4 mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {produit.actif ? 'Désactiver' : 'Activer'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => navigate('/produits')}
              >
                <Package className="w-4 h-4 mr-2" />
                Voir tous les produits
              </Button>
            </CardContent>
          </Card>
        </div>

        <SlidePanel
          isOpen={prixPanelOpen}
          onClose={() => { setPrixPanelOpen(false); setEditingPrix(null); }}
          title={editingPrix ? 'Modifier le prix' : 'Nouveau prix'}
          subtitle={produit?.nom || ''}
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className={cn('text-sm font-medium', prixErrors.prix_achat_ht ? 'text-red-400' : 'text-white/80')}>
                Prix d'achat HT *
              </Label>
              <Input
                type="number" step="0.01" min="0"
                value={prixForm.prix_achat_ht}
                onChange={(e) => setPrixForm((p) => ({ ...p, prix_achat_ht: e.target.value }))}
                className={cn('bg-royal-700 text-white placeholder:text-white/40 border-royal-600 focus:border-royal-500 focus:ring-royal-500', prixErrors.prix_achat_ht && 'border-red-400')}
                placeholder="0.00"
              />
              {prixErrors.prix_achat_ht ? (
                <p className="text-xs text-red-400 mt-1">{prixErrors.prix_achat_ht}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className={cn('text-sm font-medium', prixErrors.prix_vente_ht ? 'text-red-400' : 'text-white/80')}>
                Prix de vente HT
              </Label>
              <Input
                type="number" step="0.01" min="0"
                value={prixForm.prix_vente_ht}
                onChange={(e) => setPrixForm((p) => ({ ...p, prix_vente_ht: e.target.value }))}
                className={cn('bg-royal-700 text-white placeholder:text-white/40 border-royal-600 focus:border-royal-500 focus:ring-royal-500', prixErrors.prix_vente_ht && 'border-red-400')}
                placeholder="0.00"
              />
              {prixErrors.prix_vente_ht ? (
                <p className="text-xs text-red-400 mt-1">{prixErrors.prix_vente_ht}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className={cn('text-sm font-medium', prixErrors.id_devise ? 'text-red-400' : 'text-white/80')}>
                Devise *
              </Label>
              <Select
                value={prixForm.id_devise}
                onValueChange={(v) => setPrixForm((p) => ({ ...p, id_devise: v }))}
              >
                <SelectTrigger className={cn('bg-royal-700 border-royal-600 text-white focus:border-royal-500 focus:ring-royal-500', prixErrors.id_devise && 'border-red-400')}>
                  <SelectValue placeholder="Sélectionner une devise" />
                </SelectTrigger>
                <SelectContent>
                  {devises.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {prixErrors.id_devise ? (
                <p className="text-xs text-red-400 mt-1">{prixErrors.id_devise}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className={cn('text-sm font-medium', prixErrors.date_application ? 'text-red-400' : 'text-white/80')}>
                Date d'application
              </Label>
              <Input
                type="date"
                value={prixForm.date_application}
                onChange={(e) => setPrixForm((p) => ({ ...p, date_application: e.target.value }))}
                className={cn('bg-royal-700 text-white placeholder:text-white/40 border-royal-600 focus:border-royal-500 focus:ring-royal-500', prixErrors.date_application && 'border-red-400')}
              />
              {prixErrors.date_application ? (
                <p className="text-xs text-red-400 mt-1">{prixErrors.date_application}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className={cn('text-sm font-medium', prixErrors.commentaire ? 'text-red-400' : 'text-white/80')}>
                Commentaire
              </Label>
              <Input
                value={prixForm.commentaire}
                onChange={(e) => setPrixForm((p) => ({ ...p, commentaire: e.target.value }))}
                className={cn('bg-royal-700 text-white placeholder:text-white/40 border-royal-600 focus:border-royal-500 focus:ring-royal-500', prixErrors.commentaire && 'border-red-400')}
                placeholder="Raison du changement"
              />
              {prixErrors.commentaire ? (
                <p className="text-xs text-red-400 mt-1">{prixErrors.commentaire}</p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-royal-700">
            <Button
              variant="outline"
              onClick={() => { setPrixPanelOpen(false); setEditingPrix(null); }}
              className="flex-1 border-royal-600 bg-royal-700 text-white/80 hover:bg-royal-600 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAjouterPrix}
              disabled={savingPrix}
              className="flex-1 bg-royal-600 hover:bg-royal-500 text-white"
            >
              {savingPrix ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {savingPrix ? 'Enregistrement...' : editingPrix ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </SlidePanel>
      </div>

      <ConfirmModal
        isOpen={!!deletePrixTarget}
        onClose={() => setDeletePrixTarget(null)}
        onConfirm={handleDeletePrix}
        title="Supprimer le prix"
        message={`Supprimer le prix d'achat ${deletePrixTarget?.prix_achat_ht ? formatCurrency(deletePrixTarget.prix_achat_ht, deletePrixTarget?.devise?.code) : ''} du ${deletePrixTarget?.date_application ? new Date(deletePrixTarget.date_application).toLocaleDateString('fr-FR') : ''} ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
  monospace,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm text-gray-500 flex items-center gap-1.5 mb-1">{icon} {label}</dt>
      <dd className={cn('text-sm font-medium text-gray-900', monospace && 'font-mono')}>{value}</dd>
    </div>
  );
}
