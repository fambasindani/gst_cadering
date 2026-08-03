import type { RapportFicheTechniqueData } from '../../types/fiche-technique-menu';
import { formatCurrency } from '../../lib/format';

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

const fmt = (n: number | string | null | undefined, decimals = 2) =>
  Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function InfoItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 ${className || ''}`}>
      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

export function RapportFicheTechniqueView({ data }: { data: RapportFicheTechniqueData }) {
  const { menu, parties, totalArticles, coutTotalFiche, coutParPassagerTotal } = data;
  const passagers = Number(data.rapport.nombre_passagers) || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Fiche technique — {menu.nom}</h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-royal-700 bg-royal-50 px-3 py-1 rounded-md">Code : {menu.code}</span>
            <span className="text-sm text-gray-500 font-mono">N° {data.rapport.id}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <InfoItem label="Cycle" value={menu.cycle || '-'} />
          <InfoItem label="Périodicité" value={menu.periodicite || '-'} />
          <InfoItem label="Validité" value={menu.validite || '-'} />
          <InfoItem label="Client" value={menu.partenaire?.nom || '-'} />
          <InfoItem label="Compagnie" value={data.rapport.partenaire?.nom || '-'} />
          <InfoItem label="Date" value={formatDate(data.rapport.date_rapport)} />
          <InfoItem label="Magasin" value={menu.magasin?.nom || '-'} />
          <InfoItem label="Passagers" value={fmt(passagers, 0)} />
          <InfoItem label="Coût par passager" value={formatCurrency(coutParPassagerTotal)} className="sm:col-span-1 lg:col-span-2" />
        </div>
      </div>

      {parties.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium text-gray-700">Aucune partie dans cette fiche technique</p>
        </div>
      ) : (
        parties.map((partie) => (
          <div key={partie.id} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-royal-700 text-white flex items-center justify-between">
              <h3 className="font-semibold">{partie.nom}</h3>
              <span className="text-sm">{partie.items.length} item(s)</span>
            </div>
            {partie.items.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">Aucun item dans cette partie.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left font-semibold text-gray-600 px-5 py-2">Code article</th>
                      <th className="text-left font-semibold text-gray-600 px-5 py-2">Désignation</th>
                      <th className="text-right font-semibold text-gray-600 px-5 py-2">% passagers</th>
                      <th className="text-right font-semibold text-gray-600 px-5 py-2">Coût total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partie.items.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-5 py-2.5 font-mono text-xs text-royal-700">{item.code}</td>
                        <td className="px-5 py-2.5 text-gray-800 font-medium">{item.designation}</td>
                        <td className="px-5 py-2.5 text-right text-gray-600">{fmt(item.pourcentage)} %</td>
                        <td className="px-5 py-2.5 text-right font-mono font-semibold text-royal-700">{formatCurrency(item.coutTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-800 text-white flex items-center justify-between">
          <h3 className="font-semibold">Récapitulatif des articles consommés</h3>
          <span className="text-sm">{totalArticles.length} article(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left font-semibold text-gray-600 px-5 py-2">Code article</th>
                <th className="text-left font-semibold text-gray-600 px-5 py-2">Désignation</th>
                <th className="text-center font-semibold text-gray-600 px-5 py-2">U</th>
                <th className="text-right font-semibold text-gray-600 px-5 py-2">Quantité totale</th>
                <th className="text-right font-semibold text-gray-600 px-5 py-2">Prix unitaire</th>
                <th className="text-right font-semibold text-gray-600 px-5 py-2">Coût total</th>
              </tr>
            </thead>
            <tbody>
              {totalArticles.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-4 text-center text-gray-500">Aucun article consommé.</td></tr>
              )}
              {totalArticles.map((a, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-5 py-2.5 font-mono text-xs text-royal-700">{a.code_article || '-'}</td>
                  <td className="px-5 py-2.5 text-gray-800">{a.nom}</td>
                  <td className="px-5 py-2.5 text-center text-gray-500">{a.unite}</td>
                  <td className="px-5 py-2.5 text-right font-mono font-medium text-gray-900">{fmt(a.quantiteTotale, 3)}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-gray-600">{formatCurrency(a.prixUnitaire)}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-gray-900">{formatCurrency(a.coutTotal)}</td>
                </tr>
              ))}
              {totalArticles.length > 0 && (
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={5} className="px-5 py-3 font-bold text-gray-900">TOTAL</td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-royal-700">{formatCurrency(coutTotalFiche)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-royal-200 bg-royal-50 p-4 text-center">
          <p className="text-xs text-royal-700 font-medium uppercase tracking-wide">Passagers</p>
          <p className="text-2xl font-bold text-royal-800 font-mono">{fmt(passagers, 0)}</p>
        </div>
        <div className="rounded-xl border border-royal-200 bg-royal-50 p-4 text-center">
          <p className="text-xs text-royal-700 font-medium uppercase tracking-wide">Coût par passager</p>
          <p className="text-2xl font-bold text-royal-800 font-mono">{formatCurrency(coutParPassagerTotal)}</p>
        </div>
        <div className="rounded-xl border border-royal-200 bg-royal-50 p-4 text-center">
          <p className="text-xs text-royal-700 font-medium uppercase tracking-wide">Coût total</p>
          <p className="text-2xl font-bold text-royal-800 font-mono">{formatCurrency(coutTotalFiche)}</p>
        </div>
      </div>
    </div>
  );
}
