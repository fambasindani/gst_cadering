import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { auditService } from '../services/audit';
import type { Audit } from '../types/audit';
import { ArrowLeft, Shield, FileText, Calendar, User, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const actionColors: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-800',
  UPDATE: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN_SUCCESS: 'bg-blue-100 text-blue-800',
  LOGIN_FAILED: 'bg-red-100 text-red-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  REGISTER: 'bg-emerald-100 text-emerald-800',
};

const actionLabels: Record<string, string> = {
  INSERT: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  LOGIN_SUCCESS: 'Connexion',
  LOGIN_FAILED: 'Échec connexion',
  LOGOUT: 'Déconnexion',
  REGISTER: 'Inscription',
};

export function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    auditService.get(Number(id))
      .then((res) => { if (res.success) setAudit(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderValue = (val: unknown): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const DiffView = ({ oldVals, newVals }: { oldVals: Record<string, unknown> | null; newVals: Record<string, unknown> | null }) => {
    const keys = new Set([...Object.keys(oldVals || {}), ...Object.keys(newVals || {})]);
    const changedKeys = [...keys].filter(k => JSON.stringify(oldVals?.[k]) !== JSON.stringify(newVals?.[k]));
    if (changedKeys.length === 0) return <p className="text-sm text-gray-500 italic">Aucun changement détaillé</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-semibold text-gray-600">Champ</th>
              <th className="text-left py-2 pr-4 font-semibold text-gray-600">Ancienne valeur</th>
              <th className="text-left py-2 font-semibold text-gray-600">Nouvelle valeur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {changedKeys.map(key => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="py-2 pr-4 font-mono text-xs text-gray-700">{key}</td>
                <td className="py-2 pr-4">
                  <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-mono max-w-[200px] truncate">
                    {renderValue(oldVals?.[key])}
                  </span>
                </td>
                <td className="py-2">
                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-mono max-w-[200px] truncate">
                    {renderValue(newVals?.[key])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton height={40} width={280} />
        <Skeleton height={300} />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-700">Entrée d'audit introuvable</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/audit')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-royal-100 text-royal-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Détail de l'audit</h1>
              <p className="text-sm text-gray-500 mt-0.5">Entrée #{audit.id}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action</p>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1',
                  actionColors[audit.action] || 'bg-gray-100 text-gray-700',
                )}>
                  {actionLabels[audit.action] || audit.action}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Table</p>
                <code className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono mt-1">{audit.table_cible}</code>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID enregistrement</p>
                <p className="text-sm font-mono text-gray-900 mt-1">{audit.id_enregistrement ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Date
                </p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(audit.date_action)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Utilisateur
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {audit.utilisateur
                    ? `${audit.utilisateur.prenom} ${audit.utilisateur.nom} (${audit.utilisateur.email})`
                    : 'Système'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adresse IP</p>
                <p className="text-sm font-mono text-gray-900 mt-1">{audit.adresse_ip}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-gray-400" />
                  Navigateur
                </p>
                <p className="text-sm text-gray-600 mt-1 break-all">{audit.user_agent || '-'}</p>
              </div>
              {audit.route && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Route</p>
                  <code className="block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono mt-1 break-all">{audit.route}</code>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {(audit.anciennes_valeurs || audit.nouvelles_valeurs) && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-royal-700" />
              Modifications
            </h3>
            <DiffView oldVals={audit.anciennes_valeurs} newVals={audit.nouvelles_valeurs} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
