import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Camera, Keyboard, X, AlertCircle, ShieldCheck, RefreshCw, Lock } from 'lucide-react';

interface DniScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDniDetected: (dni: string, origen: 'CAMARA' | 'MANUAL') => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export function DniScannerModal({
  isOpen,
  onClose,
  onDniDetected,
  isLoading,
  errorMessage,
}: DniScannerModalProps) {
  const [modo, setModo] = useState<'CAMARA' | 'MANUAL'>('CAMARA');
  const [dniManual, setDniManual] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [isHttpInsecure, setIsHttpInsecure] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStoppingRef = useRef(false);
  const dniContainerId = 'dni-barcode-scanner-container';

  const reproducirBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046, audioCtx.currentTime); // C6
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) {
      detenerCamara();
      setDniManual('');
      setCameraError(null);
      return;
    }

    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (window.location.protocol === 'http:' && !isLocal) {
      setIsHttpInsecure(true);
      return;
    } else {
      setIsHttpInsecure(false);
    }

    if (modo === 'CAMARA') {
      iniciarCamara();
    } else {
      detenerCamara();
    }

    return () => {
      detenerCamara();
    };
  }, [isOpen, modo]);

  const iniciarCamara = async () => {
    detenerCamara();
    setCameraError(null);
    setCameraActive(false);
    isStoppingRef.current = false;

    await new Promise((resolve) => setTimeout(resolve, 150));

    const container = document.getElementById(dniContainerId);
    if (!container) return;

    try {
      const scanner = new Html5Qrcode(dniContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.PDF_417,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: (w: number, h: number) => {
          return {
            width: Math.floor(w * 0.85),
            height: Math.floor(h * 0.45),
          };
        },
      };

      const onScanSuccess = async (decodedText: string) => {
        if (isStoppingRef.current) return;
        isStoppingRef.current = true;

        const dniLimpio = decodedText.replace(/\D/g, '').slice(0, 8);
        if (dniLimpio.length >= 6) {
          reproducirBeep();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([60, 40, 60]);
            } catch {}
          }
          await detenerCamara();
          onDniDetected(dniLimpio, 'CAMARA');
        } else {
          isStoppingRef.current = false;
        }
      };

      try {
        await scanner.start(
          { facingMode: 'environment' },
          config,
          onScanSuccess,
          () => {}
        );
      } catch {
        // Fallback a cualquier cámara disponible
        await scanner.start(
          { facingMode: 'user' },
          config,
          onScanSuccess,
          () => {}
        );
      }

      setCameraActive(true);
    } catch (err: any) {
      if (isStoppingRef.current) return;
      setCameraError('No se pudo acceder a la cámara en vivo. Puedes tomar foto al DNI o ingresar el número.');
      setCameraActive(false);
    }
  };

  const detenerCamara = async () => {
    isStoppingRef.current = true;
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const handleFotoDniCapturada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingPhoto(true);
    setCameraError(null);

    try {
      const reader = new BrowserMultiFormatReader();
      const objectUrl = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(objectUrl);
      URL.revokeObjectURL(objectUrl);

      if (result) {
        const texto = result.getText().trim();
        const dniLimpio = texto.replace(/\D/g, '').slice(0, 8);
        if (dniLimpio.length >= 6) {
          await detenerCamara();
          onDniDetected(dniLimpio, 'CAMARA');
        } else {
          setCameraError(`Código leído (${texto}), pero no contiene un DNI de 8 dígitos.`);
        }
      }
    } catch {
      setCameraError('No se detectó un código nítido en la foto. Enfoca más de cerca o escribe el DNI.');
    } finally {
      setIsReadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dni = dniManual.trim();
    if (dni.length >= 6) {
      onDniDetected(dni, 'MANUAL');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <Card className="max-w-md w-full bg-white shadow-2xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <CardHeader className="bg-slate-900 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">Identificación de Elector</CardTitle>
                <CardDescription className="text-xs text-slate-300">
                  Verificación de DNI físico del estudiante
                </CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Modo: Cámara vs Teclado */}
          <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setModo('CAMARA')}
              className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                modo === 'CAMARA'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Escanear Código</span>
            </button>
            <button
              type="button"
              onClick={() => setModo('MANUAL')}
              className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                modo === 'MANUAL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Entrada Manual</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Aviso del Sistema:</span> {errorMessage}
              </div>
            </div>
          )}

          {modo === 'CAMARA' ? (
            <div className="space-y-3">
              {isHttpInsecure ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Cámara en vivo requiere HTTPS</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Estás navegando por HTTP. Puedes usar la foto al DNI o ingresar con HTTPS.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      const port = window.location.port ? `:${window.location.port}` : '';
                      window.location.href = `https://${window.location.hostname}${port}${window.location.pathname}${window.location.search}`;
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1.5" /> Entrar con HTTPS Seguro
                  </Button>
                </div>
              ) : null}

              {/* Input nativo de foto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFotoDniCapturada}
              />

              {/* Visor de escáner en tiempo real con Html5Qrcode */}
              <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center">
                <div id={dniContainerId} className="w-full h-full object-cover" />

                {!cameraActive && !cameraError && !isHttpInsecure && (
                  <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white text-xs space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span>Iniciando escáner en tiempo real...</span>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isReadingPhoto || isLoading}
                className="w-full text-xs text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                {isReadingPhoto ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Procesando foto del DNI...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                    <span>O capturar foto al código del DNI</span>
                  </>
                )}
              </Button>

              {cameraError && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  {cameraError}
                </div>
              )}

              <p className="text-[11px] text-slate-500 text-center">
                Invariante I17: La lectura se procesa en el navegador. Prohibido capturar o guardar fotos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Número de DNI del Estudiante
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Ej: 74839201"
                  value={dniManual}
                  onChange={(e) => setDniManual(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 text-lg font-mono font-bold tracking-widest text-center border-2 border-slate-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={dniManual.length < 6 || isLoading}
                size="touch"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verificando Padrón...
                  </>
                ) : (
                  'Buscar Elector en Aula'
                )}
              </Button>
            </form>
          )}

          <div className="pt-1 flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-500">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
