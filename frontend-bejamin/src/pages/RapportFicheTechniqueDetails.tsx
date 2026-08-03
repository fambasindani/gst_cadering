import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FicheTechniqueRapportPDF } from '../components/pdf/FicheTechniqueRapportPDF';
import { RapportFicheTechniqueView } from '../components/rapport/RapportFicheTechniqueView';
import { useToast } from '../hooks/useToast';
import { entreeFicheTechniqueService } from '../services/entree-fiche-technique';
import type { RapportFicheTechniqueData } from '../types/fiche-technique-menu';
import { ArrowLeft, Loader2, Download } from 'lucide-react';

export function RapportFicheTechniqueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<RapportFicheTechniqueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await entreeFicheTechniqueService.get(Number(id));
      if (res.success) setData(res.data);
    } catch {
      toast('Rapport non trouvé', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-royal-700" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/recettes/rapport-ft')} className="flex items-center gap-2 text-gray-600 hover:text-royal-700 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Rapport N° {data.rapport.id}</h1>
        </div>
        <PDFDownloadLink document={<FicheTechniqueRapportPDF data={data} />} fileName={`fiche-technique-${data.menu.code || data.rapport.id}.pdf`}>
          {({ loading: pdfLoading }) => (
            <Button disabled={pdfLoading} className="bg-royal-700 hover:bg-royal-800 text-white shadow-sm">
              {pdfLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
              {pdfLoading ? 'Génération...' : 'Télécharger le PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {data.rapport.commentaire && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Commentaire : </span>{data.rapport.commentaire}
        </div>
      )}

      <RapportFicheTechniqueView data={data} />
    </div>
  );
}
