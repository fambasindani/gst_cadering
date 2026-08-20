/**
 * Télécharge un export CSV depuis un endpoint de l'API (avec token d'auth).
 * Utilise la même base URL que le client API (VITE_API_URL) avec repli sur /api.
 */
export async function downloadCsv(
  path: string,
  params: Record<string, string>,
  filename: string,
): Promise<void> {
  const token = localStorage.getItem('auth-token');
  const query = new URLSearchParams(params).toString();
  const base = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api';
  const res = await fetch(`${base}${path}${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
