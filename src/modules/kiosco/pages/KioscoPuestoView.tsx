import { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Copy,
  Clock,
  Maximize,
  Minimize,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CedulaVotacion } from '../components/CedulaVotacion';
import {
  puestosKioscoService,
  SolicitudEmparejamientoResponse,
} from '../services/puestos-kiosco.service';

interface KioscoConfig {
  aulaId: string;
  aulaNombre: string;
  puestoNumero: number;
}

export function KioscoPuestoView() {
  // Configuración del Puesto (Mesa / Puesto)
  const [config, setConfig] = useState<KioscoConfig | null>(() => {
    try {
      const saved = localStorage.getItem('kiosco_config');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [aulasDisponibles, setAulasDisponibles] = useState<
    Array<{ id: string; numero: number; nombre: string }>
  >([]);
  const [modalConfigOpen, setModalConfigOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estados de Emparejamiento Real
  const [emparejado, setEmparejado] = useState(false);
  const [puestoId, setPuestoId] = useState<string | null>(null);
  const [tokenSesion, setTokenSesion] = useState<string | null>(null);
  const [qrData, setQrData] = useState<SolicitudEmparejamientoResponse | null>(null);
  const [qrCargando, setQrCargando] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [segundosExpiracion, setSegundosExpiracion] = useState(300);

  // Estados de Heartbeat y Sincronización
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const [tokenVotoActivo, setTokenVotoActivo] = useState<string | null>(null);

  const sincronizandoRef = useRef(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 1. Cargar datos de la elección activa y Aulas
  useEffect(() => {
    puestosKioscoService
      .obtenerEleccionActiva()
      .then((eleccion) => {
        if (eleccion?.aulas && eleccion.aulas.length > 0) {
          setAulasDisponibles(eleccion.aulas);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Verificar si ya existe una sesión guardada y activa
  useEffect(() => {
    if (config) {
      try {
        const sesionGuardada = localStorage.getItem(`kiosco_sesion_${config.aulaId}_${config.puestoNumero}`);
        if (sesionGuardada) {
          const parsed = JSON.parse(sesionGuardada);
          if (parsed.puesto_id && parsed.token_sesion) {
            puestosKioscoService
              .sincronizar(parsed.puesto_id, parsed.token_sesion)
              .then((res) => {
                if (res.ok) {
                  setPuestoId(parsed.puesto_id);
                  setTokenSesion(parsed.token_sesion);
                  setEmparejado(true);
                  setLastHeartbeat(new Date());
                } else {
                  localStorage.removeItem(`kiosco_sesion_${config.aulaId}_${config.puestoNumero}`);
                  localStorage.removeItem('kiosco_config');
                  setConfig(null);
                  generarQrEmparejamiento();
                }
              })
              .catch(() => {
                generarQrEmparejamiento();
              });
            return;
          }
        }
      } catch {
        // Ignorar
      }
    }

    if (!emparejado) {
      generarQrEmparejamiento();
    }
  }, [config]);

  // 3. Generar un QR Real de Máquina: Sin datos predeterminados, toma lugar al escanearse
  const generarQrEmparejamiento = async () => {
    setQrCargando(true);
    setQrError(null);
    try {
      const data = await puestosKioscoService.solicitarEmparejamiento();
      setQrData(data);
      if (data.puesto_id) {
        setPuestoId(data.puesto_id);
      }
      setSegundosExpiracion(600);
    } catch (err: any) {
      setQrError(err.message || 'Error al conectar con el servidor electoral.');
    } finally {
      setQrCargando(false);
    }
  };

  // 4. Temporizador de expiración visual del QR
  useEffect(() => {
    if (emparejado || !qrData) return;

    const timer = setInterval(() => {
      setSegundosExpiracion((prev) => {
        if (prev <= 1) {
          generarQrEmparejamiento();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emparejado, qrData]);

  // Sonido institucional de apertura y activación de cédula
  const reproducirChimeActivacion = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notas = [523.25, 659.25, 783.99]; // Acorde C5 - E5 - G5
      notas.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.45);
      });
    } catch {}
  };

  // 5. Polling de Verificación del QR: Detecta cuando el docente lo autoriza
  useEffect(() => {
    if (emparejado || !qrData?.qr_token) return;

    const interval = setInterval(async () => {
      try {
        const res = await puestosKioscoService.verificarQr(qrData.qr_token);
        if (res.status === 'APPROVED' && res.token_sesion && res.puesto_id) {
          reproducirChimeActivacion();
          setPuestoId(res.puesto_id);
          setTokenSesion(res.token_sesion);
          setEmparejado(true);
          setLastHeartbeat(new Date());

          const nuevaConfig: KioscoConfig = {
            aulaId: res.aula_id || config?.aulaId || '',
            aulaNombre: res.aula_nombre || config?.aulaNombre || 'Mesa Electoral',
            puestoNumero: res.numero_puesto || config?.puestoNumero || 1,
          };
          setConfig(nuevaConfig);
          localStorage.setItem('kiosco_config', JSON.stringify(nuevaConfig));

          localStorage.setItem(
            `kiosco_sesion_${nuevaConfig.aulaId}_${nuevaConfig.puestoNumero}`,
            JSON.stringify({
              puesto_id: res.puesto_id,
              token_sesion: res.token_sesion,
            }),
          );
        } else if (res.status === 'EXPIRED') {
          generarQrEmparejamiento();
        }
      } catch {
        // Ignorar errores transitorios de polling
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [emparejado, qrData, config]);

  // 6. Polling de Sincronización y Heartbeat en Tiempo Real (1 segundo) (ADR-005 & Invariante I10)
  useEffect(() => {
    if (!emparejado || !puestoId || !tokenSesion) return;

    const syncInterval = setInterval(async () => {
      if (sincronizandoRef.current) return;
      sincronizandoRef.current = true;

      try {
        const res = await puestosKioscoService.sincronizar(puestoId, tokenSesion);
        setLastHeartbeat(new Date());

        // Si el docente confirmó la habilitación: ACTIVACIÓN AUTOMÁTICA DE CÉDULA
        if (res.estado === 'RESERVADO' && res.token_voto) {
          if (!tokenVotoActivo) {
            reproducirChimeActivacion();
          }
          setTokenVotoActivo(res.token_voto);
        } else if (res.estado === 'LIBRE' && tokenVotoActivo) {
          // Si el docente canceló la habilitación o el voto concluyó
          setTokenVotoActivo(null);
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Token de sesión no válido')) {
          handleDesvincular();
        }
      } finally {
        sincronizandoRef.current = false;
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [emparejado, puestoId, tokenSesion, tokenVotoActivo]);

  const handleCopiarToken = () => {
    if (!qrData?.qr_token) return;
    navigator.clipboard.writeText(qrData.qr_token);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleDesvincular = async () => {
    if (puestoId && tokenSesion) {
      await puestosKioscoService.desvincular(puestoId, tokenSesion).catch(() => {});
    }
    if (config) {
      localStorage.removeItem(`kiosco_sesion_${config.aulaId}_${config.puestoNumero}`);
      localStorage.removeItem('kiosco_config');
    }
    setConfig(null);
    setEmparejado(false);
    setPuestoId(null);
    setTokenSesion(null);
    setTokenVotoActivo(null);
    generarQrEmparejamiento();
  };

  const handleVotoTerminado = () => {
    setTokenVotoActivo(null);
    setLastHeartbeat(new Date());
  };

  const formatMinutos = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full min-h-screen flex flex-col justify-center items-center p-3 sm:p-6 relative select-none bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white overflow-y-auto">
      {/* Barra superior flotante de la Terminal (Sin navegación a otros módulos) */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-6 sm:right-6 flex justify-between items-center pointer-events-auto z-20">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300 shadow-sm">
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              emparejado ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="font-bold text-white tracking-wide">Terminal de Votación</span>
          {config ? (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium">{config.aulaNombre}</span>
              <span className="text-slate-500">•</span>
              <span className="font-extrabold text-blue-400">Puesto #{config.puestoNumero}</span>
            </>
          ) : (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 font-bold">En espera de asignación de mesa</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Ventana' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </div>

      {/* MODO 1: CÉDULA ELECTORAL ACTIVA (EL ESTUDIANTE ESTÁ VOTANDO CON SU TOKEN) */}
      {tokenVotoActivo ? (
        <div className="w-full max-w-4xl animate-in fade-in zoom-in-95">
          <CedulaVotacion
            tokenVoto={tokenVotoActivo}
            onVotoFinalizado={handleVotoTerminado}
          />
        </div>
      ) : !emparejado ? (
        /* MODO 2: PUESTO DESCONECTADO - CÓDIGO QR EFÍMERO DINÁMICO (TOMA LUGAR AL ESCANEARSE) */
        <Card className="max-w-md w-full border-2 border-slate-300 shadow-xl text-center animate-in fade-in">
          <CardHeader className="pb-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-900 mx-auto flex items-center justify-center mb-2 shadow-inner">
              <QrCode className="w-7 h-7" />
            </div>
            <div className="text-[11px] uppercase font-black tracking-widest text-indigo-600">
              Terminal de Votación Estudiantil
            </div>
            <CardTitle className="text-2xl font-black text-slate-900">
              Máquina de Votación
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 font-medium">
              Estado: <strong className="text-amber-600 font-bold">Sin Asignar (Esperando Escaneo)</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
              {qrCargando ? (
                <div className="w-52 h-52 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-500">Generando código de máquina...</span>
                </div>
              ) : qrError ? (
                <div className="w-52 h-52 bg-red-50 text-red-700 rounded-xl border border-red-200 p-4 flex flex-col items-center justify-center text-xs space-y-2">
                  <p className="font-bold">Error de conexión</p>
                  <p>{qrError}</p>
                  <Button size="sm" onClick={generarQrEmparejamiento}>
                    Reintentar
                  </Button>
                </div>
              ) : qrData?.qr_data_url ? (
                /* QR REAL GENERADO POR EL BACKEND */
                <div className="relative group">
                  <div className="w-52 h-52 bg-white p-2 rounded-xl border-2 border-indigo-300 shadow-sm flex items-center justify-center">
                    <img
                      src={qrData.qr_data_url}
                      alt="Código QR de Validación de Máquina"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md border border-indigo-100">
                      <Clock className="w-3 h-3 text-indigo-600" />
                      Expira en: {formatMinutos(segundosExpiracion)}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1 text-center">
                <p className="text-xs font-bold text-slate-800">
                  Escanee este código con el Panel del Docente o Administrador
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Al autorizar esta máquina, tomará su lugar automáticamente en la mesa correspondiente.
                </p>
              </div>

              {/* Código corto de identificación de la máquina */}
              {qrData?.codigo_corto && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 w-full text-center">
                  <span className="text-[10px] text-indigo-800 uppercase font-black block tracking-wider">
                    Identificador de Máquina
                  </span>
                  <span className="text-2xl font-mono font-black text-indigo-950 tracking-widest">
                    {qrData.codigo_corto}
                  </span>
                </div>
              )}

              {/* Token en texto plano para entrada manual alternativa */}
              {qrData?.qr_token && (
                <div className="w-full pt-1 border-t border-slate-200">
                  <div className="text-[10px] text-slate-500 mb-1 font-semibold">
                    Token QR Completo:
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      readOnly
                      value={qrData.qr_token}
                      className="bg-white border rounded px-2 py-1 text-[10px] font-mono text-slate-600 flex-1 select-all"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopiarToken}
                      className="h-7 text-xs px-2"
                      title="Copiar token"
                    >
                      {copiado ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Estado de espera en tiempo real */}
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-indigo-900 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Esperando que el Docente o Admin escanee el código...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* MODO 3: BANNER DE ESPERA OFICIAL DEL PUESTO EMPAREJADO (ADR-005 & I10) */
        <div className="w-full max-w-3xl space-y-6 text-center animate-in fade-in zoom-in-95">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 text-white shadow-2xl border-4 border-slate-800 flex flex-col items-center justify-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>Puesto Activo y Supervisado</span>
            </div>

            <div>
              <div className="text-6xl sm:text-8xl font-black tracking-tight text-white mb-2">
                PUESTO {config?.puestoNumero}
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-300">
                {config?.aulaNombre}
              </h3>
            </div>

            <div className="max-w-md p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-sm text-slate-200 font-medium">
              Acércate a la mesa del docente de aula con tu DNI físico para habilitar tu sufragio en esta pantalla.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-4 border-t border-white/10 w-full">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-emerald-400" />
                Heartbeat en vivo (último: {lastHeartbeat.toLocaleTimeString()})
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Invariante I10: Puesto ciego (Zero-Knowledge)
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 px-4">
            <span>
              Sesión activa:{' '}
              <code className="font-mono text-slate-700">{tokenSesion?.substring(0, 16)}...</code>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDesvincular}
              className="text-xs text-slate-400 hover:text-red-700 hover:bg-red-50"
            >
              Desvincular Puesto
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Mesa y Puesto para la Terminal */}
      {modalConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-sm w-full bg-white shadow-2xl animate-in zoom-in-95">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Configurar Terminal Kiosco
              </CardTitle>
              <CardDescription className="text-xs">
                Asigna a qué mesa y número corresponde este dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mesa Electoral / Aula
                </label>
                <select
                  value={config?.aulaId}
                  onChange={(e) => {
                    const aula = aulasDisponibles.find((a) => a.id === e.target.value);
                    if (aula && config) {
                      setConfig({ ...config, aulaId: aula.id, aulaNombre: aula.nombre });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  {aulasDisponibles.map((aula) => (
                    <option key={aula.id} value={aula.id}>
                      {aula.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Puesto en esta Mesa
                </label>
                <select
                  value={config?.puestoNumero}
                  onChange={(e) => {
                    if (config) {
                      setConfig({ ...config, puestoNumero: Number(e.target.value) });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value={1}>Puesto #1</option>
                  <option value={2}>Puesto #2</option>
                  <option value={3}>Puesto #3</option>
                  <option value={4}>Puesto #4</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setModalConfigOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (config) {
                      localStorage.setItem('kiosco_config', JSON.stringify(config));
                      handleDesvincular();
                      setModalConfigOpen(false);
                    }
                  }}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white"
                >
                  Guardar y Reiniciar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
