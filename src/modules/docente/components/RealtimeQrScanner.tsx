import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { RefreshCw, AlertTriangle, ShieldCheck, Lock, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface RealtimeQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onError?: (errorMessage: string) => void;
}

export function RealtimeQrScanner({ onScanSuccess, onError }: RealtimeQrScannerProps) {
  const [starting, setStarting] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isHttpInsecure, setIsHttpInsecure] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const scannerContainerId = 'qr-realtime-scanner-container';

  const reproducirBeepExito = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
  };

  useEffect(() => {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (window.location.protocol === 'http:' && !isLocal) {
      setIsHttpInsecure(true);
      setStarting(false);
      setCameraError('HTTP_INSECURE');
      return;
    }

    isStoppingRef.current = false;

    const startCamera = async () => {
      setStarting(true);
      setCameraError(null);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const container = document.getElementById(scannerContainerId);
      if (!container) {
        setCameraError('El contenedor visual de la cámara no está listo.');
        setStarting(false);
        return;
      }

      try {
        const qrScanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = qrScanner;

        const scanConfig = {
          fps: 15,
          qrbox: (viewWidth: number, viewHeight: number) => {
            const edge = Math.min(viewWidth, viewHeight);
            const boxSize = Math.floor(edge * 0.75);
            return { width: boxSize, height: boxSize };
          },
          aspectRatio: 1.0,
        };

        const handleSuccess = async (decodedText: string) => {
          if (isStoppingRef.current) return;
          isStoppingRef.current = true;

          reproducirBeepExito();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([80, 40, 80]);
            } catch {}
          }

          try {
            await qrScanner.stop();
          } catch {}

          onScanSuccess(decodedText.trim());
        };

        try {
          await qrScanner.start(
            { facingMode: 'environment' },
            scanConfig,
            handleSuccess,
            () => {}
          );
        } catch (envErr: any) {
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              const chosenCamera = devices[devices.length - 1].id;
              await qrScanner.start(
                chosenCamera,
                scanConfig,
                handleSuccess,
                () => {}
              );
            } else {
              await qrScanner.start(
                { facingMode: 'user' },
                scanConfig,
                handleSuccess,
                () => {}
              );
            }
          } catch (fallbackErr: any) {
            throw fallbackErr || envErr;
          }
        }

        setStarting(false);
      } catch (err: any) {
        if (isStoppingRef.current) return;
        setStarting(false);

        const errorStr = String(err?.message || err);
        let errorMsg = 'No se pudo activar la cámara.';

        if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission')) {
          errorMsg = 'Permiso denegado: Por favor pulsa en el candado de la barra de direcciones y activa el permiso de «Cámara».';
        } else if (errorStr.includes('NotFoundError') || errorStr.includes('DevicesNotFoundError')) {
          errorMsg = 'No se detectó cámara en este dispositivo.';
        } else if (errorStr.includes('NotReadableError') || errorStr.includes('TrackStartError')) {
          errorMsg = 'La cámara está siendo usada por otra aplicación o pestaña.';
        } else {
          errorMsg = `Error al abrir cámara: ${errorStr}`;
        }

        setCameraError(errorMsg);
        if (onError) onError(errorMsg);
      }
    };

    startCamera();

    return () => {
      isStoppingRef.current = true;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
        scannerRef.current = null;
      }
    };
  }, []);

  const handleCambiarAHttps = () => {
    const port = window.location.port ? `:${window.location.port}` : '';
    const httpsUrl = `https://${window.location.hostname}${port}${window.location.pathname}${window.location.search}`;
    window.location.href = httpsUrl;
  };

  return (
    <div className="space-y-3">
      {isHttpInsecure && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Lock className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Se Requiere Conexión HTTPS Segura
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Android y Chrome <strong>bloquean la cámara en tiempo real</strong> cuando se navega por <code>http://</code>. Para encender la cámara y escanear el QR, debes usar la conexión <strong>HTTPS</strong>.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="touch"
            onClick={handleCambiarAHttps}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 py-3"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <span>Pasar a HTTPS Seguro (Activar Cámara)</span>
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>

          <div className="text-[11px] bg-white/80 p-2.5 rounded-xl border border-amber-200 text-amber-900 leading-tight">
            <strong>💡 Paso de Activación en Celular:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Pulsa el botón verde superior.</li>
              <li>Chrome mostrará: <em>«La conexión no es privada»</em>.</li>
              <li>Toca <strong>«Configuración avanzada»</strong> y luego <strong>«Acceder a {window.location.hostname} (sitio no seguro)»</strong>.</li>
              <li>¡Listo! El navegador te pedirá permiso y la cámara se encenderá al instante.</li>
            </ol>
          </div>
        </div>
      )}

      {!isHttpInsecure && (
        <div className="relative aspect-square max-w-[280px] sm:max-w-[320px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-2xl flex items-center justify-center">
          <div id={scannerContainerId} className="w-full h-full object-cover" />

          {!starting && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-[72%] h-[72%] border-2 border-dashed border-emerald-400/70 rounded-xl relative overflow-hidden">
                <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                <div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse"
                  style={{
                    animation: 'scannerMove 2s infinite ease-in-out alternate',
                  }}
                />
              </div>

              <div className="absolute bottom-2 px-3 py-1 bg-black/70 backdrop-blur-xs rounded-full text-[11px] text-emerald-300 font-semibold tracking-wide border border-emerald-500/30">
                Enfoca el código QR del Kiosco
              </div>
            </div>
          )}

          {starting && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs p-4 text-center space-y-3 z-10">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="space-y-1">
                <span className="font-extrabold text-sm block">Activando Cámara...</span>
                <span className="text-[11px] text-slate-300 block">
                  Si tu navegador solicita permiso, pulsa <strong>«Permitir»</strong>.
                </span>
              </div>
            </div>
          )}

          {cameraError && !starting && (
            <div className="absolute inset-0 bg-red-950/95 text-red-100 flex flex-col items-center justify-center text-xs p-4 text-center space-y-2.5 z-10">
              <AlertTriangle className="w-9 h-9 text-red-400" />
              <span className="font-black text-sm text-white">No se Pudo Iniciar la Cámara</span>
              <p className="text-[11px] leading-relaxed max-w-[240px] text-red-200">
                {cameraError}
              </p>
              <div className="pt-2 flex flex-col gap-1.5 w-full max-w-[220px]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="text-xs border-red-400 text-red-100 bg-red-900/60 hover:bg-red-800"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Reintentar Cámara
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes scannerMove {
          0% {
            transform: translateY(10px);
          }
          100% {
            transform: translateY(190px);
          }
        }
      `}</style>
    </div>
  );
}
