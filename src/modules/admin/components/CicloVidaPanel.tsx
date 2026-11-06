import { useState, useEffect } from 'react';
import { Eleccion, EleccionEstado } from '../../../types';
import { eleccionApiService } from '../services/eleccion.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Play,
  Square,
  Copy,
  Check,
  Hash,
  AlertTriangle,
  ShieldCheck,
  School,
  Vote,
  Users,
  Smartphone,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  PlusCircle,
  Award,
} from 'lucide-react';

interface Props {
  eleccion: Eleccion;
  onAbrir: () => Promise<void>;
  onCerrar: () => Promise<void>;
  onReaperturar?: () => Promise<void>;
  onCrearNueva?: (params: {
    nombre: string;
    descripcion?: string;
    clonarConfiguracion?: boolean;
    clonarPadron?: boolean;
    eleccionOrigenId?: string;
  }) => Promise<void>;
  onIrAEscrutinio?: () => void;
}

export function CicloVidaPanel({
  eleccion,
  onAbrir,
  onCerrar,
  onReaperturar,
  onCrearNueva,
  onIrAEscrutinio,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirmAbrir, setShowConfirmAbrir] = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);
  const [showConfirmReaperturar, setShowConfirmReaperturar] = useState(false);
  const [showModalNuevaEleccion, setShowModalNuevaEleccion] = useState(false);
  const [nombreNuevaEleccion, setNombreNuevaEleccion] = useState('');
  const [descripcionNuevaEleccion, setDescripcionNuevaEleccion] = useState('');
  const [clonarConfiguracion, setClonarConfiguracion] = useState(true);
  const [clonarPadron, setClonarPadron] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializar nombre por defecto al montar o cambiar
  useEffect(() => {
    const añoActual = new Date().getFullYear();
    setNombreNuevaEleccion(`Elección Municipio Escolar ${añoActual + 1}`);
    setDescripcionNuevaEleccion('Proceso electoral institucional para el municipio estudiantil');
  }, [eleccion.id]);

  // Estado de validación de precondiciones y mesas
  const [precondiciones, setPrecondiciones] = useState<any | null>(null);
  const [loadingCheck, setLoadingCheck] = useState(false);

  useEffect(() => {
    cargarPrecondiciones();
  }, [eleccion.id, eleccion.estado]);

  const cargarPrecondiciones = async () => {
    try {
      setLoadingCheck(true);
      const data = await eleccionApiService.obtenerPrecondiciones(eleccion.id);
      setPrecondiciones(data);
    } catch {
      // Ignorar si no está disponible
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleAutoInicializar = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await eleccionApiService.inicializarMesasDemo(eleccion.id);
      await cargarPrecondiciones();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al auto-configurar las mesas');
    } finally {
      setLoading(false);
    }
  };

  const etapas: { estado: EleccionEstado; label: string; desc: string }[] = [
    { estado: 'BORRADOR', label: '1. Borrador', desc: 'Validación de Mesas' },
    { estado: 'ABIERTA', label: '2. Abierta', desc: 'Votación Activa Multi-Dispositivo' },
    { estado: 'CERRADA', label: '3. Cerrada', desc: 'Control I14 y Balance' },
    { estado: 'ESCRUTADA', label: '4. Escrutada', desc: 'Conteo y Resultados' },
  ];

  const getEtapaIndex = (estado: EleccionEstado) => {
    switch (estado) {
      case 'BORRADOR':
        return 0;
      case 'ABIERTA':
        return 1;
      case 'CERRADA':
        return 2;
      case 'ESCRUTADA':
        return 3;
    }
  };

  const currentIndex = getEtapaIndex(eleccion.estado);

  const handleCopyHash = () => {
    if (eleccion.huella_sha256) {
      navigator.clipboard.writeText(eleccion.huella_sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAbrir = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await onAbrir();
      setShowConfirmAbrir(false);
      await cargarPrecondiciones();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al abrir la elección.');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await onCerrar();
      setShowConfirmCerrar(false);
      await cargarPrecondiciones();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cerrar la elección.');
    } finally {
      setLoading(false);
    }
  };

  const handleReaperturar = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      if (onReaperturar) {
        await onReaperturar();
      } else {
        await eleccionApiService.reaperturarEleccion(eleccion.id);
      }
      setShowConfirmReaperturar(false);
      await cargarPrecondiciones();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al reaperturar la elección.');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearNuevaEleccion = async () => {
    if (!nombreNuevaEleccion.trim()) {
      setErrorMsg('El nombre de la nueva elección es obligatorio.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const params = {
        nombre: nombreNuevaEleccion.trim(),
        descripcion: descripcionNuevaEleccion.trim() || undefined,
        clonarConfiguracion,
        clonarPadron,
        eleccionOrigenId: eleccion.id,
      };

      if (onCrearNueva) {
        await onCrearNueva(params);
      } else {
        await eleccionApiService.crearNuevaEleccion(params);
        window.location.reload();
      }
      setShowModalNuevaEleccion(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la nueva elección.');
    } finally {
      setLoading(false);
    }
  };

  const listoParaAbrir = precondiciones?.listo_para_abrir ?? false;

  return (
    <div className="space-y-6">
      {/* 1. Barra de Progreso del Ciclo de Vida */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Ciclo de Vida de la Elección</CardTitle>
              <CardDescription>Transición formal de estados y control de apertura</CardDescription>
            </div>
            <div>
              <Badge
                variant={
                  eleccion.estado === 'ABIERTA'
                    ? 'success'
                    : eleccion.estado === 'BORRADOR'
                    ? 'secondary'
                    : 'default'
                }
                className="text-sm px-3.5 py-1.5 font-black uppercase tracking-wider"
              >
                ESTADO: {eleccion.estado}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {etapas.map((etapa, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={etapa.estado}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'border-blue-700 bg-blue-50/70 shadow-sm ring-1 ring-blue-500'
                      : isPast
                      ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                      : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900">{etapa.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{etapa.desc}</div>
                  {isCurrent && (
                    <div className="mt-2 inline-block px-2.5 py-0.5 bg-blue-700 text-white text-[10px] font-bold rounded-full">
                      FASE ACTUAL
                    </div>
                  )}
                  {isPast && (
                    <div className="mt-2 inline-block px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                      ✓ COMPLETADO
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. VALIDACIÓN DE MESAS Y REQUISITOS (EN ESTADO BORRADOR) */}
      {eleccion.estado === 'BORRADOR' && (
        <Card className="border-2 border-slate-300 shadow-sm bg-gradient-to-b from-slate-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Validación de Mesas y Requisitos Electorales
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comprobación técnica obligatoria antes de aperturar la votación
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cargarPrecondiciones}
                  disabled={loadingCheck}
                  className="text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingCheck ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>

                {!listoParaAbrir && (
                  <Button
                    size="sm"
                    onClick={handleAutoInicializar}
                    disabled={loading}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Auto-configurar Mesas Institucionales
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {precondiciones?.requisitos && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Aulas / Mesas */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    precondiciones.requisitos.aulas.ok
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-amber-50/60 border-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <School className="w-4 h-4 text-slate-700" />
                    {precondiciones.requisitos.aulas.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Mesas de Votación</span>
                    <span className="text-xs font-bold text-slate-900">
                      {precondiciones.requisitos.aulas.mensaje}
                    </span>
                  </div>
                </div>

                {/* 2. Puestos */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    precondiciones.requisitos.puestos.ok
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-amber-50/60 border-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <Vote className="w-4 h-4 text-slate-700" />
                    {precondiciones.requisitos.puestos.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Puestos Activos</span>
                    <span className="text-xs font-bold text-slate-900">
                      {precondiciones.requisitos.puestos.mensaje}
                    </span>
                  </div>
                </div>

                {/* 3. Docentes */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    precondiciones.requisitos.docentes.ok
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-amber-50/60 border-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <Smartphone className="w-4 h-4 text-slate-700" />
                    {precondiciones.requisitos.docentes.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Docentes de Mesa</span>
                    <span className="text-xs font-bold text-slate-900">
                      {precondiciones.requisitos.docentes.mensaje}
                    </span>
                  </div>
                </div>

                {/* 4. Partidos */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    precondiciones.requisitos.partidos.ok
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-amber-50/60 border-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <Users className="w-4 h-4 text-slate-700" />
                    {precondiciones.requisitos.partidos.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Listas Inscritas</span>
                    <span className="text-xs font-bold text-slate-900">
                      {precondiciones.requisitos.partidos.mensaje}
                    </span>
                  </div>
                </div>

                {/* 5. Padrón */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    precondiciones.requisitos.padron.ok
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-amber-50/60 border-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    {precondiciones.requisitos.padron.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Padrón Alumnos</span>
                    <span className="text-xs font-bold text-slate-900">
                      {precondiciones.requisitos.padron.mensaje}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                {listoParaAbrir ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Todas las mesas y requisitos están
                    validados. La elección está lista para ser aperturada.
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Faltan requisitos para la apertura. Haz
                    clic en "Auto-configurar Mesas Institucionales" para completar todo automáticamente.
                  </span>
                )}
              </div>

              <Button
                size="touch"
                onClick={() => setShowConfirmAbrir(true)}
                disabled={!listoParaAbrir || loading}
                className={`font-black text-sm px-6 shadow-md transition-all ${
                  listoParaAbrir
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white animate-pulse'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 mr-2" />
                Aperturar Elección (Iniciar Votación)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. GUÍA PARA PRUEBAS MULTI-DISPOSITIVO (CUANDO ESTÁ ABIERTA) */}
      {eleccion.estado === 'ABIERTA' && (
        <Card className="border-2 border-emerald-600 bg-emerald-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2.5 text-emerald-900">
              <Smartphone className="w-5 h-5 text-emerald-700" />
              <CardTitle className="text-base font-bold">
                ¡Elección Abierta! Guía de Prueba en Múltiples Dispositivos
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-emerald-800">
              Abre los siguientes enlaces en tu celular, tablet o navegador para probar los diferentes roles:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Rol 1: Docente de Mesa */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="font-black text-emerald-900 uppercase text-[10px] tracking-wider">
                  1. Panel Docente (Celular)
                </div>
                <div className="text-slate-800 font-bold">Ruta: /docente</div>
                <p className="text-[11px] text-slate-500">
                  Usuario: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">docente1</code> • Clave:{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">docente123</code>
                </p>
                <p className="text-[10px] text-emerald-700 font-medium">
                  Escanea el DNI o ingresa: 71000001
                </p>
              </div>

              {/* Rol 2: Terminal Kiosco */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="font-black text-blue-900 uppercase text-[10px] tracking-wider">
                  2. Puesto Kiosco (Tablet/Laptop)
                </div>
                <div className="text-slate-800 font-bold">Ruta: /kiosco</div>
                <p className="text-[11px] text-slate-500">
                  Pantalla táctil que muestra la cédula digital y recibe el voto del estudiante.
                </p>
                <p className="text-[10px] text-blue-700 font-medium">Voto secreto 100% anónimo</p>
              </div>

              {/* Rol 3: Pantalla de Puerta */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="font-black text-indigo-900 uppercase text-[10px] tracking-wider">
                  3. Pantalla Puerta (Monitor/TV)
                </div>
                <div className="text-slate-800 font-bold">Ruta: /puerta</div>
                <p className="text-[11px] text-slate-500">
                  Muestra la ubicación del aula para los alumnos con Invariante I1 (sin decir si votó).
                </p>
                <p className="text-[10px] text-indigo-700 font-medium">Buscador instantáneo por DNI</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                size="touch"
                onClick={() => setShowConfirmCerrar(true)}
                className="bg-red-700 hover:bg-red-800 text-white font-bold text-sm"
              >
                <Square className="w-4 h-4 mr-2" />
                Cerrar Elección (Detener Votación)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Huella Criptográfica SHA-256 (Si la elección fue abierta) */}
      {eleccion.huella_sha256 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/60">
          <CardHeader>
            <div className="flex items-center space-x-2 text-blue-900 font-bold">
              <Hash className="w-5 h-5 text-blue-700" />
              <span>Huella Criptográfica Inmutable (SHA-256)</span>
            </div>
            <CardDescription className="text-slate-600">
              Suma de comprobación inmutable del padrón, partidos y reglas electorales generada al momento de la apertura formal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <code className="bg-white border border-blue-200 text-blue-950 font-mono text-xs p-3 rounded-lg flex-1 w-full break-all shadow-inner">
                {eleccion.huella_sha256}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHash}
                className="shrink-0 bg-white hover:bg-slate-100"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 inline" /> Esta huella garantiza que ningún registro fue alterado tras iniciar las votaciones.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 4. OPCIONES DE CONTINUIDAD Y GESTIÓN ELECTORAL (CUANDO ESTÁ CERRADA O ESCRUTADA) */}
      {(eleccion.estado === 'CERRADA' || eleccion.estado === 'ESCRUTADA') && (
        <Card className="border-2 border-indigo-200 bg-white shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-white tracking-wide">
                    {eleccion.estado === 'CERRADA'
                      ? 'Acciones de Continuidad del Proceso Electoral'
                      : 'Proceso Electoral Concluido — Gestión de Nuevas Elecciones'}
                  </CardTitle>
                  <CardDescription className="text-xs text-indigo-200">
                    {eleccion.estado === 'CERRADA'
                      ? 'La recepción de votos está cerrada. Puedes continuar votaciones, computar resultados o iniciar un nuevo proceso.'
                      : 'Esta elección ha sido escrutada y cuenta con resultados oficiales. Puedes arrancar una nueva convocatoria institucional.'}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-indigo-600/60 text-indigo-100 border border-indigo-400/30 text-xs uppercase px-2.5 py-1">
                Fase {eleccion.estado === 'CERRADA' ? '3 • Balance Cuantitativo' : '4 • Escrutinio Final'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Opción 1: Reaperturar Elección (solo si está CERRADA) */}
              {eleccion.estado === 'CERRADA' && (
                <div className="bg-gradient-to-b from-amber-50/70 to-white p-5 rounded-xl border-2 border-amber-300 flex flex-col justify-between shadow-xs hover:border-amber-400 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-amber-700" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Pausada
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Reaperturar Votación</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Reanuda temporalmente el proceso de sufragio si se amplió el horario escolar o faltan alumnos por votar. Los puestos y docentes volverán a estar habilitados de inmediato.
                    </p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-amber-200/60">
                    <Button
                      onClick={() => setShowConfirmReaperturar(true)}
                      disabled={loading}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Reaperturar Votación
                    </Button>
                  </div>
                </div>
              )}

              {/* Opción 2: Pasar a Escrutinio Oficial */}
              <div className="bg-gradient-to-b from-indigo-50/70 to-white p-5 rounded-xl border-2 border-indigo-200 flex flex-col justify-between shadow-xs hover:border-indigo-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                      <Award className="w-5 h-5 text-indigo-700" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {eleccion.estado === 'ESCRUTADA' ? 'Completado' : 'Recomendado'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Escrutinio y Cómputo Oficial</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {eleccion.estado === 'ESCRUTADA'
                      ? 'Consulta las actas oficiales consolidadas, gráficos de resultados, listas ganadoras y métricas de participación estudiantil.'
                      : 'Ejecuta el cómputo seguro de la urna digital, verifica quórum institucional y proclama a la lista directiva ganadora.'}
                  </p>
                </div>
                <div className="pt-4 mt-2 border-t border-indigo-200/60">
                  <Button
                    onClick={() => onIrAEscrutinio ? onIrAEscrutinio() : null}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs"
                  >
                    <Award className="w-3.5 h-3.5 mr-1.5" />
                    {eleccion.estado === 'ESCRUTADA' ? 'Ver Resultados y Acta' : 'Ir a Escrutinio y Cómputo'}
                  </Button>
                </div>
              </div>

              {/* Opción 3: Iniciar Nuevo Proceso Electoral */}
              <div className="bg-gradient-to-b from-emerald-50/70 to-white p-5 rounded-xl border-2 border-emerald-300 flex flex-col justify-between shadow-xs hover:border-emerald-400 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <PlusCircle className="w-5 h-5 text-emerald-700" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Nuevo Proceso
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Crear Nueva Elección</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Inicia un nuevo proceso electoral (e.g. Segunda Vuelta 2026, Municipio Escolar 2027) en estado BORRADOR. Puedes duplicar las mesas, puestos y padrón con un solo clic.
                  </p>
                </div>
                <div className="pt-4 mt-2 border-t border-emerald-200/60">
                  <Button
                    onClick={() => setShowModalNuevaEleccion(true)}
                    disabled={loading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    Iniciar Nueva Elección...
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Modal de Confirmación: ABRIR */}
      {showConfirmAbrir && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader>
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <span>¿Confirmar Apertura de la Elección?</span>
              </div>
              <CardDescription>
                Esta acción es irreversible y pondrá en marcha el proceso electoral en las aulas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                <p>✓ <strong>Reglas congeladas:</strong> No se podrán editar porcentajes ni opciones.</p>
                <p>✓ <strong>Padrón bloqueado:</strong> No se podrán agregar ni quitar electores.</p>
                <p>✓ <strong>Huella SHA-256:</strong> Se calculará el hash criptográfico inmutable.</p>
                <p>✓ <strong>Puestos activos:</strong> Los docentes podrán empezar a habilitar alumnos.</p>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <Button variant="outline" onClick={() => setShowConfirmAbrir(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAbrir}
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  {loading ? 'Calculando Hash y Abriendo...' : 'Sí, Aperturar Elección'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmación: CERRAR */}
      {showConfirmCerrar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader>
              <div className="flex items-center space-x-2 text-red-700 font-bold text-lg">
                <AlertTriangle className="w-6 h-6" />
                <span>¿Cerrar Definitivamente la Elección?</span>
              </div>
              <CardDescription>
                Se detendrá la recepción de sufragios en todos los puestos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>
                El sistema verificará matemáticamente el <strong>Invariante I14</strong>:
              </p>
              <div className="bg-slate-100 p-3 rounded-lg font-mono text-xs text-slate-800">
                Total votos en Urna == Total electores en estado "Votó"
              </div>
              <p className="text-xs text-slate-500">
                Si existe alguna discrepancia, el cierre será rechazado y se registrará un incidente administrativo.
              </p>
              <div className="flex justify-end space-x-3 pt-3">
                <Button variant="outline" onClick={() => setShowConfirmCerrar(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCerrar}
                  disabled={loading}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold"
                >
                  {loading ? 'Verificando Balance I14...' : 'Sí, Cerrar Elección'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmación: REAPERTURAR */}
      {showConfirmReaperturar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader>
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-lg">
                <RotateCcw className="w-6 h-6 text-amber-600" />
                <span>¿Reaperturar Votación Electoral?</span>
              </div>
              <CardDescription>
                Esta acción devolverá la elección al estado ABIERTA para permitir que continúen los sufragios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200 text-xs space-y-1.5 text-amber-900">
                <p>✓ <strong>Puestos de Votación:</strong> Los kioscos volverán a admitir emisión de cédulas.</p>
                <p>✓ <strong>Mesa de Docentes:</strong> Podrán continuar escaneando DNIs y habilitando electores.</p>
                <p>✓ <strong>Auditoría:</strong> Se registrará formalmente el evento <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">REAPERTURAR_ELECCION</code>.</p>
                <p>✓ <strong>Integridad:</strong> Los votos previamente emitidos en la urna se mantienen 100% seguros.</p>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => setShowConfirmReaperturar(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleReaperturar}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {loading ? 'Reaperturando Proceso...' : 'Sí, Reaperturar Votación'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: CREAR NUEVA ELECCIÓN */}
      {showModalNuevaEleccion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader>
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-lg">
                <PlusCircle className="w-6 h-6 text-blue-700" />
                <span>Iniciar Nuevo Proceso Electoral</span>
              </div>
              <CardDescription>
                Crea una nueva convocatoria electoral en estado BORRADOR para su posterior validación y apertura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nombre del Proceso Electoral *
                  </label>
                  <input
                    type="text"
                    value={nombreNuevaEleccion}
                    onChange={(e) => setNombreNuevaEleccion(e.target.value)}
                    placeholder="Ej. Elección Municipio Escolar 2027 o Segunda Vuelta"
                    className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={descripcionNuevaEleccion}
                    onChange={(e) => setDescripcionNuevaEleccion(e.target.value)}
                    placeholder="Objetivo o descripción de la elección institucional..."
                    className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clonarConfiguracion}
                      onChange={(e) => setClonarConfiguracion(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-800 font-semibold">
                      Clonar configuración (Mesas, Puestos, Docentes y Listas postulantes)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 ml-6">
                    Reutiliza la estructura física y partidos de la elección actual para no tener que volver a registrarlos.
                  </p>

                  <label className="flex items-center space-x-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={clonarPadron}
                      onChange={(e) => setClonarPadron(e.target.checked)}
                      disabled={!clonarConfiguracion}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 disabled:opacity-50"
                    />
                    <span className={`text-xs font-semibold ${!clonarConfiguracion ? 'text-slate-400' : 'text-slate-800'}`}>
                      Copiar padrón electoral de estudiantes (reiniciados a estado Pendiente)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 ml-6">
                    Permite a los estudiantes votar en esta nueva elección comenzando todos limpios desde cero.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setShowModalNuevaEleccion(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCrearNuevaEleccion}
                  disabled={loading || !nombreNuevaEleccion.trim()}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  {loading ? 'Creando Proceso...' : 'Crear Elección en Borrador'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
