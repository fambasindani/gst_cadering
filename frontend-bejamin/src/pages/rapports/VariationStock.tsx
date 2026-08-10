import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { VariationStockPDF } from '../../components/pdf/VariationStockPDF';
import { rapportService } from '../../services/rapport';
import { partenaireService } from '../../services/partenaire';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { RefreshCw, Download, Calendar, Calculator, Users, Percent } from 'lucide-react';
import { cn } from '../../lib/utils';

function formatNumber(v: number): string {
  return (v ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDateFr(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const moneyStyle = 'w-full h-9 border-gray-200 shadow-sm text-right font-mono';

export function VariationStock() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [calculating, setCalculating] = useState(false);

  const [clients, setClients] = useState<{ id: number; nom: string }[]>([]);
  const [clientId, setClientId] = useState('');
  const [ratioCA, setRatioCA] = useState('');
  const [ratioResult, setRatioResult] = useState<{ client: string; conso: number; ca: number; ratio: number } | null>(null);
  const [ratioLoading, setRatioLoading] = useState(false);

  useEffect(() => {
    partenaireService.getClients({ per_page: '500' })
      .then((r) => { if (r.success) setClients(r.data.data.map((c) => ({ id: c.id, nom: c.nom }))); })
      .catch(() => {});
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const num = (key: string) => Number(values[key]) || 0;
  const caTotal = num('caFood') + num('caHand');
  const totalAchat = num('achatsFood') + num('achatsLessiviels');
  const totalConso = num('consoFood');

  const calculer = async () => {
    setCalculating(true);
    try {
      const params: Record<string, string> = {};
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const res = await rapportService.variationStockCalcul(params);
      if (res.success) {
        const d = res.data;
        setValues((prev) => ({
          ...prev,
          stockInitial: String(d.stock_initial ?? 0),
          achatsFood: String(d.achats_food ?? 0),
          stockInitial2: String(d.stock_initial_lessiviels ?? 0),
          achatsLessiviels: String(d.achats_lessiviels ?? 0),
          consoFood: String(d.conso_food ?? 0),
          consoAerienne: String(d.conso_aerienne ?? 0),
          consoNonAerienne: String(d.conso_non_aerienne ?? 0),
        }));
      }
    } catch {
      //
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    calculer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculerRatio = async () => {
    if (!clientId) return;
    setRatioLoading(true);
    try {
      const params: Record<string, string> = { client_id: clientId };
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const res = await rapportService.rapportClient(params);
      if (res.success) {
        const conso = res.data.statistiques?.total_valeur ?? 0;
        const ca = Number(ratioCA) || 0;
        setRatioResult({
          client: res.data.lignes?.[0]?.client || '',
          conso,
          ca,
          ratio: conso > 0 ? ca / conso : 0,
        });
      }
    } catch {
      //
    } finally {
      setRatioLoading(false);
    }
  };

  const reset = () => {
    setDateDebut('');
    setDateFin('');
    setValues({});
  };

  const pdfValues = { ...values };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de variation stock</h1>
          <p className="text-sm text-gray-500 mt-1">Document comptable mensuel</p>
        </div>
        <div className="flex items-center gap-2">
          <PDFDownloadLink
            document={
              <VariationStockPDF
                period={`Période : du ${formatDateFr(dateDebut)} au ${formatDateFr(dateFin)}`}
                values={pdfValues}
              />
            }
            fileName="tableau-variation-stock.pdf"
          >
            {({ loading: pdfLoading }) => (
              <Button variant="outline" disabled={pdfLoading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-1.5" />
                {pdfLoading ? 'Génération...' : 'PDF'}
              </Button>
            )}
          </PDFDownloadLink>
          <Button variant="outline" onClick={reset} className="border-gray-300 text-gray-700 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            Periode
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">du</span>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="h-10 border-gray-200 shadow-sm w-44" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">au</span>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="h-10 border-gray-200 shadow-sm w-44" />
            </div>
            <Button onClick={calculer} disabled={calculating} className="h-10 px-5 bg-royal-700 hover:bg-royal-800 text-white shadow-sm font-medium">
              <Calculator className="w-4 h-4 mr-2" />
              {calculating ? 'Calcul...' : 'Calculer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-royal-700 text-white">
                  <th className="px-4 py-2.5 text-left font-semibold">Désignation</th>
                  <th className="px-4 py-2.5 text-right font-semibold w-48">Montant en $</th>
                  <th className="px-4 py-2.5 text-left font-semibold w-72">Observation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-royal-50/70">
                  <td colSpan={3} className="px-4 py-2.5 font-bold text-gray-800 border-b border-gray-200">CHIFFRE D'AFFAIRES (CA)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2 text-gray-800">Chiffre d'affaires réalisé* FOOD</td>
                  <td className="px-4 py-2"><Input type="number" value={values.caFood ?? ''} onChange={set('caFood')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2 text-xs text-gray-500">CA hors redevance aéroportuaire</td>
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="px-4 py-2 text-gray-800">Chiffre d'affaires Hand + divers</td>
                  <td className="px-4 py-2"><Input type="number" value={values.caHand ?? ''} onChange={set('caHand')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2 text-xs text-gray-500">CA hors redevance aéroportuaire</td>
                </tr>
                <tr className="bg-gray-200/70">
                  <td className="px-4 py-2.5 font-bold text-gray-900 border-b border-gray-300">MONTANT CHIFFRE D'AFFAIRES REALISE</td>
                  <td className="px-4 py-2.5 font-bold font-mono text-right text-gray-900 border-b border-gray-300">{formatNumber(caTotal)}</td>
                  <td className="px-4 py-2.5 border-b border-gray-300" />
                </tr>

                <tr className="bg-royal-50/70">
                  <td colSpan={3} className="px-4 py-2.5 font-bold text-gray-800 border-b border-gray-200">GESTION DES STOCKS ET ACHATS</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2 text-gray-800">Stock initial</td>
                  <td className="px-4 py-2"><Input type="number" value={values.stockInitial ?? ''} onChange={set('stockInitial')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2" />
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="px-4 py-2 text-gray-800">Achats Matières FOOD du mois*</td>
                  <td className="px-4 py-2"><Input type="number" value={values.achatsFood ?? ''} onChange={set('achatsFood')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2" />
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2 text-gray-800">Stock initial</td>
                  <td className="px-4 py-2"><Input type="number" value={values.stockInitial2 ?? ''} onChange={set('stockInitial2')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2" />
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="px-4 py-2 text-gray-800">Achats Matières et Lessiviels du mois*</td>
                  <td className="px-4 py-2"><Input type="number" value={values.achatsLessiviels ?? ''} onChange={set('achatsLessiviels')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2" />
                </tr>
                <tr className="bg-gray-200/70">
                  <td className="px-4 py-2.5 font-bold text-gray-900 border-b border-gray-300">TOTAL ACHAT MOIS</td>
                  <td className="px-4 py-2.5 font-bold font-mono text-right text-gray-900 border-b border-gray-300">{formatNumber(totalAchat)}</td>
                  <td className="px-4 py-2.5 border-b border-gray-300" />
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="px-4 py-2 text-gray-800">Valeur consommation matières FOOD du mois*</td>
                  <td className="px-4 py-2"><Input type="number" value={values.consoFood ?? ''} onChange={set('consoFood')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2" />
                </tr>
                <tr className="bg-gray-200/70">
                  <td className="px-4 py-2.5 font-bold text-gray-900 border-b border-gray-300">TOTAL CONSOMMATION MOIS</td>
                  <td className="px-4 py-2.5 font-bold font-mono text-right text-gray-900 border-b border-gray-300">{formatNumber(totalConso)}</td>
                  <td className="px-4 py-2.5 border-b border-gray-300" />
                </tr>

                <tr className="bg-royal-50/70">
                  <td colSpan={3} className="px-4 py-2.5 font-bold text-gray-800 border-b border-gray-200">NOTES ET VENTILATION ANALYTIQUE</td>
                </tr>
                <tr className="bg-gray-200/70 border-b border-gray-300">
                  <td className="px-4 py-2.5 font-bold text-gray-900">CONSOMMATION NON-AERIENNE</td>
                  <td className="px-4 py-2.5 font-bold font-mono text-right text-gray-900"><Input type="number" value={values.consoNonAerienne ?? ''} onChange={set('consoNonAerienne')} className={cn(moneyStyle, 'bg-transparent border-gray-300')} placeholder="0.00" /></td>
                  <td className="px-4 py-2.5" />
                </tr>
                <tr className="bg-gray-200/70 border-b border-gray-300">
                  <td className="px-4 py-2.5 font-bold text-gray-900">CONSOMMATION AERIENNE</td>
                  <td className="px-4 py-2.5 font-bold font-mono text-right text-gray-900"><Input type="number" value={values.consoAerienne ?? ''} onChange={set('consoAerienne')} className={cn(moneyStyle, 'bg-transparent border-gray-300')} placeholder="0.00" /></td>
                  <td className="px-4 py-2.5" />
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2 text-gray-800">RATIO ESTIME</td>
                  <td className="px-4 py-2"><Input type="number" value={values.ratio ?? ''} onChange={set('ratio')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2" />
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="px-4 py-2 text-gray-800">CA FOOD ESTIME</td>
                  <td className="px-4 py-2"><Input type="number" value={values.caFoodEstime ?? ''} onChange={set('caFoodEstime')} className={moneyStyle} placeholder="0.00" /></td>
                  <td className="px-4 py-2" />
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-xs italic text-gray-500">* Prière annexer (liste des) factures</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-royal-100 text-royal-700">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ratio d'un client</h2>
              <p className="text-sm text-gray-500">Chiffre d'affaires / Consommation par période</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                Client
              </label>
              <SearchableSelect
                options={clients}
                value={clientId}
                onValueChange={setClientId}
                placeholder="Sélectionner un client"
                searchPlaceholder="Rechercher un client..."
                className="w-full"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Periode
              </label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="h-11 border-gray-200 shadow-sm" />
                <span className="text-sm text-gray-600 font-medium">au</span>
                <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="h-11 border-gray-200 shadow-sm" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Calculator className="w-4 h-4 text-gray-400" />
                Chiffre d'affaires ($)
              </label>
              <Input type="number" value={ratioCA} onChange={(e) => setRatioCA(e.target.value)} placeholder="0.00" className={moneyStyle} />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={calculerRatio} disabled={!clientId || ratioLoading} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm font-medium h-11 px-5">
              <Calculator className="w-4 h-4 mr-2" />
              {ratioLoading ? 'Calcul...' : 'Calculer le ratio'}
            </Button>
          </div>

          {ratioResult && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Client</p>
                <p className="mt-1 font-bold text-gray-900">{ratioResult.client || '—'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Consommation ($)</p>
                <p className="mt-1 font-bold font-mono text-gray-900">{formatNumber(ratioResult.conso)}</p>
              </div>
              <div className="rounded-lg border border-royal-200 bg-royal-50 p-4">
                <p className="text-xs font-semibold text-royal-700 uppercase">Ratio (CA / Conso)</p>
                <p className="mt-1 font-bold font-mono text-royal-700">{ratioResult.conso > 0 ? ratioResult.ratio.toFixed(2) : '—'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
