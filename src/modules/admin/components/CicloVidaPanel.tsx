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
} from 'lucide-react';

interface Props {
  eleccion: Eleccion;
  onAbrir: () => Promise<void>;
  onCerrar: () => Promise<void>;
}

export function CicloVidaPanel({ eleccion, onAbrir, onCerrar }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirmAbrir, setShowConfirmAbrir] = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    </div>
  );
}
