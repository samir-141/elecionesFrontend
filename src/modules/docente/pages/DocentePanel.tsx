import { useState, useEffect, useRef } from 'react';
import { DocenteLogin } from '../components/DocenteLogin';
import { DniScannerModal } from '../components/DniScannerModal';
import { ElectorFichaModal } from '../components/ElectorFichaModal';
import { RealtimeQrScanner } from '../components/RealtimeQrScanner';
import {
  habilitacionApiService,
  ElectorConsultado,
  HabilitacionConfirmada,
} from '../services/habilitacion.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  School,
  Monitor,
  QrCode,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  Clock,
  Ban,
  ArrowRight,
  Camera,
  Video,
  X,
  Users,
  Flag,
  Search,
} from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { getApiBaseUrl } from '../../../config/api';
import { uploadWithProgress } from '../../../services/images/image-upload.service';
import { validateImageFileClient } from '../../../services/images/image-validation.service';

interface PuestoAula {
  id: string;
  numero_puesto: number;
  estado: 'LIBRE' | 'RESERVADO' | 'FUERA_SERVICIO';
  ultimo_heartbeat: string;
}

export function DocentePanel() {
  const [tabActiva, setTabActiva] = useState<'acreditacion' | 'salon' | 'partidos'>('acreditacion');

  const [docente, setDocente] = useState<{
    id: string;
    username: string;
    aula: { id: string; numero: number; nombre: string };
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem('docente_auth');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!parsed?.id || !parsed?.aula?.id || !UUID_REGEX.test(parsed.id) || !UUID_REGEX.test(parsed.aula.id)) {
        sessionStorage.removeItem('docente_auth');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [puestos, setPuestos] = useState<PuestoAula[]>([]);

  // Estados del Modal de Emparejamiento por QR
  const [showPairModal, setShowPairModal] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [pairFeedback, setPairFeedback] = useState<string | null>(null);
  const [pairError, setPairError] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estados del Flujo de Habilitación
  const [scannerOpen, setScannerOpen] = useState(false);
  const [fichaOpen, setFichaOpen] = useState(false);
  const [electorConsultado, setElectorConsultado] = useState<ElectorConsultado | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Estado de Reserva Activa en Pantalla
  const [reservaActiva, setReservaActiva] = useState<{
    electorId: string;
    puestoNumero: number;
    puestoId: string;
    segundosRestantes: number;
  } | null>(null);
  const [votoCompletadoFeedback, setVotoCompletadoFeedback] = useState<string | null>(null);

  // Estados de Mi Salón
  const [salonData, setSalonData] = useState<{
    aula: { id: string; numero: number; nombre: string };
    total_asignados: number;
    total_votaron: number;
    total_pendientes: number;
    porcentaje_avance: number;
    electores: Array<{
      id: string;
      dni: string;
      nombres: string;
      apellidos: string;
      grado_seccion: string;
      estado: 'PENDIENTE' | 'HABILITADO' | 'VOTO';
    }>;
  } | null>(null);
  const [busquedaSalon, setBusquedaSalon] = useState('');
  const [loadingSalon, setLoadingSalon] = useState(false);

  // Estados de Listas Electorales
  const [partidosList, setPartidosList] = useState<any[]>([]);
  const [loadingPartidos, setLoadingPartidos] = useState(false);

  // Avatar privado del docente (URL firmada temporal desde Supabase Storage)
  const [docenteAvatarUrl, setDocenteAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const cargarAvatarDocente = async () => {
    const token = sessionStorage.getItem('docente_token');
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/docente/media/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocenteAvatarUrl(data?.url || null);
      }
    } catch {
      // Ignorar silenciosamente si backend o Supabase Storage aún no configurados
    }
  };

  const handleSubirAvatarDocente = async (file: File | null) => {
    if (!file) return;
    const token = sessionStorage.getItem('docente_token');
    if (!token) {
      setAvatarError('Inicia sesión nuevamente para subir tu fotografía de perfil.');
      return;
    }

    try {
      setAvatarError(null);
      const check = await validateImageFileClient(file);
      if (!check.valid) {
        setAvatarError(check.error || 'Archivo inválido.');
        return;
      }

      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      const uploaded = await uploadWithProgress<{ url_visualizacion?: string | null }>({
        url: `${getApiBaseUrl()}/docente/media/avatar`,
        method: 'POST',
        formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      setDocenteAvatarUrl(uploaded?.url_visualizacion || null);
    } catch (err: any) {
      setAvatarError(err.message || 'No se pudo cargar tu fotografía.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const cargarSalonDocente = async () => {
    if (!docente?.aula?.id) return;
    try {
      setLoadingSalon(true);
      const data = await habilitacionApiService.obtenerSalon(docente.aula.id);
      setSalonData(data);
    } catch {
      // Ignorar fallback
    } finally {
      setLoadingSalon(false);
    }
  };

  const cargarPartidosDocente = async () => {
    try {
      setLoadingPartidos(true);
      const data = await habilitacionApiService.obtenerPartidos();
      setPartidosList(data || []);
    } catch {
      // Ignorar fallback
    } finally {
      setLoadingPartidos(false);
    }
  };

  useEffect(() => {
    if (docente?.aula?.id) {
      cargarSalonDocente();
      cargarPartidosDocente();
      cargarAvatarDocente();
    }
  }, [docente?.aula?.id]);

  // 1. Cargar Puestos reales desde el Backend
  const cargarPuestosBackend = async (aulaId: string) => {
    try {
      const data = await habilitacionApiService.listarPuestos(aulaId);
      const mapeados: PuestoAula[] = data.map((p) => {
        let heartbeatStr = 'Sin señal';
        if (p.ultimo_heartbeat) {
          const diffSegundos = Math.floor((Date.now() - new Date(p.ultimo_heartbeat).getTime()) / 1000);
          heartbeatStr = diffSegundos < 8 ? 'Hace segundos' : `Hace ${diffSegundos}s`;
        }
        return {
          id: p.id,
          numero_puesto: p.numero_puesto,
          estado: p.estado,
          ultimo_heartbeat: heartbeatStr,
        };
      });
      setPuestos(mapeados);

      // Si había una reserva en curso y el puesto ya se liberó, celebrar que votó
      setReservaActiva((prev) => {
        if (!prev) return null;
        const puestoActual = mapeados.find((p) => p.id === prev.puestoId);
        if (puestoActual && puestoActual.estado === 'LIBRE') {
          setVotoCompletadoFeedback(`¡Voto completado con éxito en el Puesto #${prev.puestoNumero}! Puesto liberado para el siguiente elector.`);
          setTimeout(() => setVotoCompletadoFeedback(null), 6000);
          return null;
        }
        return prev;
      });
    } catch {
      // Ignorar errores transitorios de red
    }
  };

  // 2. Intervalo continuo de recarga de puestos cada 2.5 segundos
  useEffect(() => {
    if (!docente?.aula?.id) return;

    cargarPuestosBackend(docente.aula.id);
    const interval = setInterval(() => {
      cargarPuestosBackend(docente.aula.id);
    }, 2500);

    return () => clearInterval(interval);
  }, [docente]);

  // 3. Temporizador regresivo para reserva activa (3 min / 180s por defecto)
  useEffect(() => {
    if (!reservaActiva) return;

    if (reservaActiva.segundosRestantes <= 0) {
      if (docente) cargarPuestosBackend(docente.aula.id);
      setReservaActiva(null);
      return;
    }

    const timer = setInterval(() => {
      setReservaActiva((prev) => (prev ? { ...prev, segundosRestantes: prev.segundosRestantes - 1 } : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [reservaActiva, docente]);

  // Al abrir el modal de emparejamiento, reiniciar estados e iniciar escáner en tiempo real
  useEffect(() => {
    if (showPairModal) {
      setScannerActive(true);
      setPairError(null);
      setPairFeedback(null);
    }
  }, [showPairModal]);

  const handleQrDetectedRealtime = async (token: string) => {
    setQrInput(token);
    await emparejarPuestoConToken(token);
  };

  // Captura y decodificación de foto directa (funciona en HTTP y HTTPS en todos los móviles)
  const handleFotoCapturada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingPhoto(true);
    setPairError(null);

    try {
      const objectUrl = URL.createObjectURL(file);
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromImageUrl(objectUrl);
      URL.revokeObjectURL(objectUrl);

      if (result) {
        const texto = result.getText().trim();
        setQrInput(texto);
        await emparejarPuestoConToken(texto);
      } else {
        throw new Error('No se detectó contenido en el QR');
      }
    } catch {
      setPairError(
        'No se detectó un código QR legible en la foto. Intenta tomarla de nuevo más cerca y enfocada, o ingresa el código manual.',
      );
    } finally {
      setIsReadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!docente) {
    return (
      <DocenteLogin
        onLoginSuccess={(d) => {
          sessionStorage.setItem('docente_auth', JSON.stringify(d));
          setDocente(d);
        }}
      />
    );
  }

  // 1. Escaneo / Consulta de DNI del Elector
  const handleDniDetected = async (dni: string, origen: 'CAMARA' | 'MANUAL') => {
    setIsConsulting(true);
    setScanError(null);
    try {
      const elector = await habilitacionApiService.consultarDni(
        docente.aula.id,
        docente.id,
        dni,
        origen,
      );
      setElectorConsultado(elector);
      setScannerOpen(false);
      setFichaOpen(true);
    } catch (err: any) {
      setScanError(err.message || 'Error al validar el DNI del elector.');
    } finally {
      setIsConsulting(false);
    }
  };

  // 2. Confirmación y Reserva Atómica con Row Lock (ADR-006)
  const handleConfirmarHabilitacion = async (electorId: string, puestoIdDeseado?: string) => {
    setIsConfirming(true);
    setConfirmError(null);
    try {
      const res: HabilitacionConfirmada = await habilitacionApiService.confirmarHabilitacion(
        docente.aula.id,
        docente.id,
        electorId,
        puestoIdDeseado,
      );

      // Recargar puestos en vivo y salón
      await cargarPuestosBackend(docente.aula.id);
      await cargarSalonDocente();

      // Activar aviso y cuenta regresiva
      setReservaActiva({
        electorId,
        puestoNumero: res.puesto_numero,
        puestoId: res.puesto_id,
        segundosRestantes: res.tiempo_reserva_segundos,
      });

      setFichaOpen(false);
      setElectorConsultado(null);
    } catch (err: any) {
      setConfirmError(err.message || 'Error al reservar el puesto de votación.');
    } finally {
      setIsConfirming(false);
    }
  };

  // 3. Cancelación manual de la reserva
  const handleCancelarReserva = async () => {
    if (!reservaActiva) return;
    try {
      await habilitacionApiService.cancelarHabilitacion(
        docente.aula.id,
        docente.id,
        reservaActiva.electorId,
        'Cancelado manualmente por el docente en panel',
      );

      await cargarPuestosBackend(docente.aula.id);
      setReservaActiva(null);
    } catch (err: any) {
      alert(err.message || 'Error al cancelar la reserva');
    }
  };

  // 4. Emparejar Puesto Real mediante el Código QR del Kiosco (por token directo o foto)
  const emparejarPuestoConToken = async (token: string) => {
    if (!token.trim()) return;

    setIsPairing(true);
    setPairError(null);
    setPairFeedback(null);
    try {
      const res = await habilitacionApiService.emparejarPuesto(
        docente.aula.id,
        docente.id,
        token.trim(),
      );

      setPairFeedback(`¡Puesto #${res.numero_puesto} validado y activado exitosamente en ${docente.aula.nombre}!`);
      setQrInput('');
      await cargarPuestosBackend(docente.aula.id);

      setTimeout(() => {
        setShowPairModal(false);
        setPairFeedback(null);
      }, 2000);
    } catch (err: any) {
      setPairError(err.message || 'Error al emparejar el puesto con el código QR.');
    } finally {
      setIsPairing(false);
    }
  };

  const handleEmparejarPuesto = async () => {
    await emparejarPuestoConToken(qrInput);
  };

  const handleCerrarSesion = () => {
    sessionStorage.removeItem('docente_auth');
    sessionStorage.removeItem('docente_token');
    setDocenteAvatarUrl(null);
    setDocente(null);
  };

  const puestosLibres = puestos.filter((p) => p.estado === 'LIBRE').length;

  const formatoTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 py-2">
      {/* Tarjeta de Aula Asignada */}
      <div className="bg-emerald-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <label
              className="relative w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center font-bold text-lg shadow-inner overflow-hidden cursor-pointer group border border-emerald-700"
              title="Cambiar foto de perfil privada del docente"
            >
              {docenteAvatarUrl ? (
                <img src={docenteAvatarUrl} alt={docente.username} className="w-full h-full object-cover" />
              ) : (
                <School className="w-6 h-6 text-emerald-200" />
              )}
              <span className="absolute inset-0 bg-slate-900/60 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {uploadingAvatar ? '...' : 'Foto'}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={(e) => handleSubirAvatarDocente(e.target.files?.[0] || null)}
              />
            </label>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">Docente de Aula</div>
              <h2 className="text-lg font-black">{docente.aula.nombre}</h2>
              <p className="text-xs text-emerald-200">Usuario: {docente.username}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCerrarSesion}
            className="text-xs border-emerald-700 bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" /> Salir
          </Button>
        </div>

        {avatarError && (
          <div className="text-[11px] bg-rose-900/60 border border-rose-700 text-rose-100 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span>{avatarError}</span>
            <button onClick={() => setAvatarError(null)} className="ml-2 text-rose-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Voto Concluido Exitosamente */}
      {votoCompletadoFeedback && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md flex items-center gap-2.5 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold leading-snug">{votoCompletadoFeedback}</span>
        </div>
      )}

      {/* Pestañas de Navegación del Docente */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs space-x-1">
        <button
          onClick={() => setTabActiva('acreditacion')}
          className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            tabActiva === 'acreditacion'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Barcode className="w-3.5 h-3.5" />
          <span>Acreditar & Puestos</span>
        </button>

        <button
          onClick={() => {
            setTabActiva('salon');
            cargarSalonDocente();
          }}
          className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            tabActiva === 'salon'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Mi Salón ({salonData?.total_asignados ?? '...'})</span>
        </button>

        <button
          onClick={() => {
            setTabActiva('partidos');
            cargarPartidosDocente();
          }}
          className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            tabActiva === 'partidos'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Listas ({partidosList.length})</span>
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: ACREDITACIÓN Y PUESTOS */}
      {tabActiva === 'acreditacion' && (
        <div className="space-y-4">
          {/* Banner de Reserva Activa en Curso */}
      {reservaActiva && (
        <Card className="border-2 border-amber-500 bg-amber-50 shadow-md animate-in fade-in slide-in-from-top-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700 animate-pulse" /> Reserva Activa en Proceso
              </span>
              <span className="font-mono text-sm font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                Expira en: {formatoTiempo(reservaActiva.segundosRestantes)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Destino</span>
                <span className="text-xl font-black text-slate-900 flex items-center gap-1">
                  Puesto #{reservaActiva.puestoNumero} <ArrowRight className="w-4 h-4 text-emerald-700" />
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelarReserva}
                className="text-xs font-semibold bg-red-600 hover:bg-red-700"
              >
                <Ban className="w-3.5 h-3.5 mr-1" /> Cancelar Reserva
              </Button>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Indique al estudiante que se acerque al Puesto #{reservaActiva.puestoNumero} para emitir su voto.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Monitor en Vivo de Puestos del Aula */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-emerald-700" />
              <CardTitle className="text-base font-bold">Puestos del Aula ({puestos.length})</CardTitle>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800 font-bold">
              {puestosLibres} Libre(s)
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Disponibilidad en tiempo real para asignar electores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {puestos.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500">
              No hay puestos registrados en esta mesa. Use el botón inferior para emparejar uno.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {puestos.map((puesto) => (
                <div
                  key={puesto.id}
                  className={`p-2.5 border rounded-xl flex flex-col justify-between items-center text-center shadow-xs transition-colors ${
                    puesto.estado === 'LIBRE'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : puesto.estado === 'RESERVADO'
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="text-xs font-extrabold text-slate-900">Puesto #{puesto.numero_puesto}</div>
                  <div className="my-1">
                    <Badge
                      variant={
                        puesto.estado === 'LIBRE'
                          ? 'success'
                          : puesto.estado === 'RESERVADO'
                          ? 'default'
                          : 'destructive'
                      }
                      className="text-[9px] font-bold px-1.5 py-0.5"
                    >
                      {puesto.estado}
                    </Badge>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono truncate w-full">{puesto.ultimo_heartbeat}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPairError(null);
                setPairFeedback(null);
                setShowPairModal(true);
              }}
              className="w-full text-xs font-semibold border-emerald-300 text-emerald-900 bg-emerald-50/40 hover:bg-emerald-100/80"
            >
              <QrCode className="w-4 h-4 mr-1.5 text-emerald-700" />
              Validar y Emparejar Puesto con QR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Acción Principal: Habilitación de Estudiantes */}
      <Card className="border-2 border-emerald-600 bg-gradient-to-b from-emerald-50/40 to-white shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-base font-black text-slate-900">Habilitación de Elector</CardTitle>
          <CardDescription className="text-xs">
            Escanea el código de barras o escribe el DNI para autorizar el voto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {puestos.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
              <p className="text-xs text-amber-800 font-medium">
                ⚠️ Aún no hay máquinas de votación vinculadas a esta aula. Vincula al menos una máquina escaneando su código QR para comenzar las votaciones.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setPairError(null);
                  setPairFeedback(null);
                  setShowPairModal(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                <QrCode className="w-3.5 h-3.5 mr-1" />
                Vincular Máquina con QR
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="touch"
                onClick={() => {
                  setScanError(null);
                  setScannerOpen(true);
                }}
                disabled={puestosLibres === 0}
                className={`w-full font-bold text-base shadow-sm ${
                  puestosLibres > 0
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Barcode className="w-5 h-5 mr-2" />
                {puestosLibres > 0 ? 'Escanear DNI de Estudiante' : 'Sin Puestos Libres (Espere...)'}
              </Button>

              {puestosLibres === 0 && (
                <p className="text-xs text-amber-700 text-center font-medium">
                  Todos los puestos de votación están ocupados. Espere a que un alumno termine de votar.
                </p>
              )}
            </>
          )}

          <p className="text-[11px] text-slate-500 text-center">
            Invariante I17: La cámara lee el DNI en local. Cero almacenamiento o envío de fotos.
          </p>
        </CardContent>
      </Card>
      </div>
      )}

      {/* CONTENIDO PESTAÑA 2: MI SALÓN (PADRÓN DEL AULA) */}
      {tabActiva === 'salon' && (
        <div className="space-y-4">
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900">
                    Estudiantes de {docente.aula.nombre}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Padrón oficial de electores asignados a esta mesa
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cargarSalonDocente}
                  disabled={loadingSalon}
                  className="text-xs h-8"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingSalon ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Padrón</span>
                  <span className="text-lg font-black text-slate-900">{salonData?.total_asignados ?? 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Ya Votaron</span>
                  <span className="text-lg font-black text-emerald-700">{salonData?.total_votaron ?? 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 shadow-xs">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Pendientes</span>
                  <span className="text-lg font-black text-amber-700">{salonData?.total_pendientes ?? 0}</span>
                </div>
              </div>

              {/* Barra de Progreso de Participación */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Avance de la Mesa</span>
                  <span>{salonData?.porcentaje_avance ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${salonData?.porcentaje_avance ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Buscador de Estudiantes */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar estudiante por DNI o apellido..."
                  value={busquedaSalon}
                  onChange={(e) => setBusquedaSalon(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Lista de Alumnos */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {salonData?.electores
                  ?.filter((e) => {
                    if (!busquedaSalon.trim()) return true;
                    const q = busquedaSalon.toLowerCase();
                    return (
                      e.dni.includes(q) ||
                      e.nombres.toLowerCase().includes(q) ||
                      e.apellidos.toLowerCase().includes(q)
                    );
                  })
                  .map((elector) => (
                    <div
                      key={elector.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {elector.apellidos}, {elector.nombres}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          DNI: {elector.dni} • Grado: {elector.grado_seccion}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {elector.estado === 'VOTO' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black">
                            ✓ VOTÓ
                          </Badge>
                        ) : elector.estado === 'HABILITADO' ? (
                          <Badge className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black">
                            EN CABINA
                          </Badge>
                        ) : (
                          <>
                            <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                              PENDIENTE
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDniDetected(elector.dni, 'MANUAL')}
                              className="h-6 px-2 text-[10px] font-bold border-emerald-600 text-emerald-700 hover:bg-emerald-50 shrink-0"
                            >
                              Habilitar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                {salonData?.electores && salonData.electores.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No hay electores asignados a esta aula aún.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: LISTAS ELECTORALES POSTULANTES */}
      {tabActiva === 'partidos' && (
        <div className="space-y-4">
          <Card className="border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900">
                    Listas Electorales Oficiales
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Partidos inscritos para la elección estudiantil
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cargarPartidosDocente}
                  disabled={loadingPartidos}
                  className="text-xs h-8"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingPartidos ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {partidosList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No hay listas registradas en el proceso electoral.
                </div>
              ) : (
                partidosList.map((partido) => (
                  <div
                    key={partido.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 flex items-start space-x-3.5 shadow-xs"
                  >
                    {partido.logo_url ? (
                      <div className="w-11 h-11 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center p-1 shrink-0">
                        <img
                          src={partido.logo_url}
                          alt={partido.nombre}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black text-lg shrink-0">
                        #{partido.numero_lista}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-black text-sm text-slate-900">{partido.nombre}</div>
                      {partido.lema && (
                        <p className="text-xs text-slate-600 mt-0.5 italic">
                          "{partido.lema}"
                        </p>
                      )}
                      <div className="mt-2 text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                        Lista Oficial #{partido.numero_lista}
                      </div>
                      {partido.candidatos && partido.candidatos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {partido.candidatos.map((cand: any) => (
                            <span
                              key={cand.id}
                              className="inline-flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-slate-700"
                            >
                              {cand.foto_url && (
                                <img
                                  src={cand.foto_url}
                                  alt={cand.nombres}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              )}
                              <span>
                                {cand.nombres} {cand.apellidos} ({cand.cargo})
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal 1: Escáner / Teclado DNI */}
      <DniScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDniDetected={handleDniDetected}
        isLoading={isConsulting}
        errorMessage={scanError}
      />

      {/* Modal 2: Ficha y Confirmación con Checkbox de Presencia */}
      <ElectorFichaModal
        isOpen={fichaOpen}
        elector={electorConsultado}
        puestosDisponibles={puestos}
        onClose={() => {
          setFichaOpen(false);
          setElectorConsultado(null);
        }}
        onConfirm={handleConfirmarHabilitacion}
        isLoading={isConfirming}
        errorMessage={confirmError}
      />

      {/* Modal de Validación y Emparejamiento por QR REAL */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-xl animate-in fade-in zoom-in-95">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-base">
                  <QrCode className="w-5 h-5 text-emerald-700" />
                  <span>Validar Puesto con Código QR</span>
                </div>
                <button
                  onClick={() => setShowPairModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs">
                Escanea con la cámara de este dispositivo el código QR del Kiosco o ingresa el código.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pairFeedback ? (
                <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pairFeedback}</span>
                </div>
              ) : (
                <>
                  {pairError && (
                    <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{pairError}</span>
                    </div>
                  )}

                  {/* Input de archivo nativo como alternativa universal */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFotoCapturada}
                  />

                  {/* SECCIÓN PRINCIPAL: Escáner de Video en Tiempo Real con Html5Qrcode */}
                  {scannerActive ? (
                    <div className="space-y-2">
                      <RealtimeQrScanner
                        onScanSuccess={handleQrDetectedRealtime}
                        onError={(err) => setPairError(err)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScannerActive(false)}
                        className="w-full text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Pausar Escáner / Ingreso Manual
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <Button
                        type="button"
                        size="touch"
                        onClick={() => {
                          setPairError(null);
                          setScannerActive(true);
                        }}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                      >
                        <Video className="w-5 h-5 text-emerald-200" />
                        <span>Encender Escáner en Tiempo Real</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isReadingPhoto || isPairing}
                        className="w-full text-xs text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4 text-slate-500" />
                        <span>O tomar foto fija al QR con la cámara</span>
                      </Button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Token QR del Puesto (o pegado)
                    </label>
                    <input
                      type="text"
                      placeholder="Pega o escanea el token QR del puesto..."
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border text-[11px] text-slate-600 space-y-1">
                    <p className="flex items-center gap-1 font-semibold text-slate-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Reglas de Emparejamiento:
                    </p>
                    <p>• El QR expira a los 5 minutos y se consume en un único uso (ADR-005).</p>
                    <p>• Invariante I13: Solo puedes autorizar puestos de tu propia aula ({docente.aula.nombre}).</p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPairModal(false)}
                      disabled={isPairing}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEmparejarPuesto}
                      disabled={!qrInput.trim() || isPairing}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                    >
                      {isPairing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Autorizar Puesto
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
