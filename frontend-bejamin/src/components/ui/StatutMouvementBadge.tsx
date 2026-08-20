import { Badge } from './badge';
import { cn } from '../../lib/utils';

/**
 * Badge de statut d'un mouvement dans les rapports.
 * « Rejeté » en rouge (ligne affichée pour la traçabilité, hors totaux),
 * « Validé » en vert.
 */
export function StatutMouvementBadge({ statut }: { statut?: string }) {
  if (statut === 'REJETÉ') {
    return (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-medium">
        Rejeté
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={cn('text-[10px] px-1.5 py-0 font-medium bg-emerald-100 text-emerald-700 border-emerald-200')}
    >
      Validé
    </Badge>
  );
}
