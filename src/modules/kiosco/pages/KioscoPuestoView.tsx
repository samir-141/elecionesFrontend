import { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Copy,
  Clock,
  Settings,
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

  // 1. Cargar datos de la elección activa y Aulas
  useEffect(() => {
    puestosKioscoService
      .obtenerEleccionActiva()
      .then((eleccion) => {
        if (eleccion?.aulas && eleccion.aulas.length > 0) {
          setAulasDisponibles(eleccion.aulas);
          if (!config) {
            const defaultConfig: KioscoConfig = {
              aulaId: eleccion.aulas[0].id,
              aulaNombre: eleccion.aulas[0].nombre,
              puestoNumero: 1,
            };
            setConfig(defaultConfig);
            localStorage.setItem('kiosco_config', JSON.stringify(defaultConfig));
          }
        }
      })
      .catch(() => {
        // Fallback predeterminado institucional
        if (!config) {
          const fallbackConfig: KioscoConfig = {
            aulaId: '0ac28a85-848a-416f-ac8d-a65bf08abbe8',
            aulaNombre: 'Mesa 1 (Pabellón A)',
            puestoNumero: 1,
          };
          setConfig(fallbackConfig);
          localStorage.setItem('kiosco_config', JSON.stringify(fallbackConfig));
        }
      });
  }, []);

  // 2. Verificar si ya existe una sesión guardada y activa
  useEffect(() => {
    if (!config) return;

    try {
      const sesionGuardada = localStorage.getItem(`kiosco_sesion_${config.aulaId}_${config.puestoNumero}`);
      if (sesionGuardada) {
        const parsed = JSON.parse(sesionGuardada);
        if (parsed.puesto_id && parsed.token_sesion) {
          // Validar contra el backend
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
      // Ignorar error de parsing
    }

    if (!emparejado) {
      generarQrEmparejamiento();
    }
  }, [config]);

  // 3. Generar un QR Real mediante backend
  const generarQrEmparejamiento = async () => {
    if (!config) return;
    setQrCargando(true);
    setQrError(null);
    try {
      const data = await puestosKioscoService.solicitarEmparejamiento(
        config.aulaId,
        config.puestoNumero,
      );
      setQrData(data);
      setPuestoId(data.puesto_id);
      setSegundosExpiracion(300);
    } catch (err: any) {
      setQrError(err.message || 'Error al conectar con el servidor para generar QR.');
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

  // 5. Polling de Verificación del QR: Detecta cuando el docente lo autoriza
  useEffect(() => {
    if (emparejado || !qrData?.qr_token) return;

    const interval = setInterval(async () => {
      try {
        const res = await puestosKioscoService.verificarQr(qrData.qr_token);
        if (res.status === 'APPROVED' && res.token_sesion && res.puesto_id && config) {
          setPuestoId(res.puesto_id);
          setTokenSesion(res.token_sesion);
          setEmparejado(true);
          setLastHeartbeat(new Date());
          localStorage.setItem(
            `kiosco_sesion_${config.aulaId}_${config.puestoNumero}`,
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
    }, 2000);

    return () => clearInterval(interval);
  }, [emparejado, qrData, config]);

  // 6. Polling de Sincronización y Heartbeat cuando está EMPAREJADO (ADR-005 & Invariante I10)
  useEffect(() => {
    if (!emparejado || !puestoId || !tokenSesion) return;

    const syncInterval = setInterval(async () => {
      if (sincronizandoRef.current) return;
      sincronizandoRef.current = true;

      try {
        const res = await puestosKioscoService.sincronizar(puestoId, tokenSesion);
        setLastHeartbeat(new Date());

        // Si el docente asignó un elector (RESERVADO con token_voto activo)
        if (res.estado === 'RESERVADO' && res.token_voto) {
          setTokenVotoActivo(res.token_voto);
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Token de sesión no válido')) {
          handleDesvincular();
        }
      } finally {
        sincronizandoRef.current = false;
      }
    }, 2500);

    return () => clearInterval(syncInterval);
  }, [emparejado, puestoId, tokenSesion]);

  const handleCopiarToken = () => {
    if (!qrData?.qr_token) return;
    navigator.clipboard.writeText(qrData.qr_token);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleDesvincular = async () => {
    if (puestoId && tokenSesion) {
      await puestosKioscoService.desvincular(puestoId, tokenSesion);
    }
    if (config) {
      localStorage.removeItem(`kiosco_sesion_${config.aulaId}_${config.puestoNumero}`);
    }
    setEmparejado(false);
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
    <div className="min-h-[85vh] flex flex-col justify-center items-center p-2 sm:p-4">
      {/* Barra superior de configuración rápida de Terminal */}
      <div className="w-full max-w-md flex justify-between items-center mb-3 px-2">
        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          <span>{config?.aulaNombre || 'Mesa Electoral'}</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-700">Puesto #{config?.puestoNumero || 1}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setModalConfigOpen(true)}
          className="text-xs text-slate-500 hover:text-slate-900 h-7 px-2"
        >
          <Settings className="w-3.5 h-3.5 mr-1" />
          Cambiar Mesa
        </Button>
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
        /* MODO 2: PUESTO DESCONECTADO - VALIDADOR REAL POR CÓDIGO QR EFÍMERO (ADR-005) */
        <Card className="max-w-md w-full border-2 border-slate-300 shadow-xl text-center animate-in fade-in">
          <CardHeader className="pb-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-900 mx-auto flex items-center justify-center mb-2 shadow-inner">
              <QrCode className="w-7 h-7" />
            </div>
            <div className="text-[11px] uppercase font-black tracking-widest text-indigo-600">
              Terminal de Votación Institucional
            </div>
            <CardTitle className="text-2xl font-black text-slate-900">
              Puesto #{config?.puestoNumero || 1}
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 font-medium">
              Asignado a: <strong className="text-slate-900">{config?.aulaNombre}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
              {qrCargando ? (
                <div className="w-52 h-52 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-500">Generando QR seguro...</span>
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
                      alt="Código QR de Validación de Puesto"
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
                  Docente de Mesa: Escanee este código QR con su celular o tablet
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Al autorizarlo desde el panel de docente, el puesto se activará automáticamente sin recargar la página.
                </p>
              </div>

              {/* Token en texto plano para entrada manual si la cámara del docente no está disponible */}
              {qrData?.qr_token && (
                <div className="w-full pt-1 border-t border-slate-200">
                  <div className="text-[10px] text-slate-500 mb-1 font-semibold">
                    Código de Autorización Manual:
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
              <span>Esperando que el Docente autorice el puesto...</span>
            </div>

            <div className="text-[10px] text-slate-400">
              Invariante ADR-005: El QR es de un solo uso y queda invalidado al emparejarse.
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
