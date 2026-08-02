import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle2, PackageCheck, FileClock } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { purgeService } from '../services/purge';
import type { PurgeStockResponse } from '../types/purge';

const SUPPRIME = [
  'Entrées et sorties de stock (mouvements)',
  'Lots et quantités en stock',
  'Bons de commande et réceptions',
  'Retours et avoires',
  'Entrées recette (productions)',
  'Inventaires et périodes d\'inventaire',
  'Audit (journal des activités)',
];

const CONSERVE = [
  'Produits',
  'Catégories, unités, devises',
  'Partenaires (clients, fournisseurs)',
  'Magasins et départements',
  'Utilisateurs, rôles et permissions',
  'Fiches techniques (recettes)',
  'Historique des prix',
];

export function PurgeStock() {
  const { toast } = useToast();

  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PurgeStockResponse['data'] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmed = confirmation.trim().toUpperCase() === 'PURGER';

  const handlePurge = async () => {
    try {
      setLoading(true);
      const res = await purgeService.purgeStock(confirmation);
      setResult(res.data);
      toast(res.message || 'Stock purgé avec succès', 'success');
    } catch (error) {
      const e = error as { message?: string; error?: string };
      toast(e.message || e.error || 'Erreur lors de la purge du stock', 'error');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const totalSupprime = result
    ? Object.values(result.supprime).reduce((s, n) => s + n, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-gray-900">Purge du stock</h2>
        <p className="text-sm text-gray-500">
          Vide toutes les entrées et sorties de stock et leurs dépendances (réservé à l'administrateur)
        </p>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Opération irréversible
          </CardTitle>
          <CardDescription>
            Cette action supprime définitivement toutes les données liées au stock et l'audit.
            Les produits et la configuration sont conservés.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Sera supprimé
              </h3>
              <ul className="space-y-1.5">
                {SUPPRIME.map((item) => (
                  <li key={item} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50/60 p-4">
              <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Sera conservé
              </h3>
              <ul className="space-y-1.5">
                {CONSERVE.map((item) => (
                  <li key={item} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
            <Label className="text-amber-800">
              Tapez <span className="font-bold">PURGER</span> pour activer le bouton de suppression
            </Label>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="PURGER"
              className="max-w-xs bg-white"
            />
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={!confirmed || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Purge en cours...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Purger le stock
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50/60 p-4">
              <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Stock purgé — {totalSupprime} enregistrements supprimés
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(result.supprime).map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between rounded-md bg-white border border-green-200 px-3 py-2 text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-green-700">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                <PackageCheck className="w-4 h-4" />
                Le stock repart de zéro. Les produits restent disponibles.
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-gray-500">
            <FileClock className="w-4 h-4 mt-0.5 shrink-0" />
            Recommandé lors d'une remise à zéro périodique (ex. tous les 5 ans). Une confirmation
            écrite « PURGER » est obligatoire.
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handlePurge}
        title="Purger le stock ?"
        message="Cette action est irréversible : toutes les entrées, sorties, lots, commandes, retours, avoirs, recettes, inventaires et les audits seront définitivement supprimés. Les produits, la configuration et l'historique des prix seront conservés."
        confirmLabel="Oui, purger"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
