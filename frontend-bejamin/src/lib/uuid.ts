/**
 * Génère une clé unique utilisable comme identifiant React.
 *
 * `crypto.randomUUID()` n'est disponible qu'en **contexte sécurisé**
 * (HTTPS ou localhost). Sur une IP en HTTP (ex. http://169.58.38.112/Fondeg/),
 * la fonction est `undefined` et le rendu crashe → page blanche.
 * On retombe donc sur un identifiant aléatoire classique.
 */
export function nouvelleCle(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Certains navigateurs exposent la fonction mais la refusent hors contexte sécurisé.
    }
  }

  return `cle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
