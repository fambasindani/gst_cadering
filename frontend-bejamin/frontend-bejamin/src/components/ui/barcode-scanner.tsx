import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, QrCode, Barcode, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const SCANNER_ID = 'barcode-scanner-element';

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let cancelled = false;

    const start = async () => {
      const el = document.getElementById(SCANNER_ID);
      if (!el) return;

      setScanning(true);
      setError('');

      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            if (!cancelled) {
              onScan(decodedText);
              stopScanner();
            }
          },
          () => {},
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur d\'accès à la caméra');
        }
      } finally {
        if (!cancelled) setScanning(false);
      }
    };

    start();

    return () => { cancelled = true; stopScanner(); };
  }, [isOpen]);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-royal-700" />
            <Barcode className="w-5 h-5 text-royal-700" />
            <span className="text-lg font-semibold text-gray-900 ml-1">Scanner</span>
          </div>
          <button onClick={() => { stopScanner(); onClose(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: '280px' }}>
            <div id={SCANNER_ID} className="w-full" style={{ minHeight: '280px' }} />

            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                  <p className="text-sm text-white/80">Démarrage de la caméra...</p>
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 bg-royal-50 rounded-lg">
            <Camera className="w-5 h-5 text-royal-700 shrink-0" />
            <p className="text-sm text-royal-800">
              Placez le code-barres ou QR code dans le cadre
            </p>
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
              {error.includes('NotAllowed') && (
                <p className="text-xs text-red-500 mt-1">
                  Autorisez l'accès à la caméra dans les paramètres de votre navigateur
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => { stopScanner(); onClose(); }}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
