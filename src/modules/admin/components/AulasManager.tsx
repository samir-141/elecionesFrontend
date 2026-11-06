import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  School,
  Plus,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Users,
  Unlink,
  ArrowRightLeft,
  Search,
  X,
  PlusCircle,
  QrCode,
  AlertTriangle,
  Trash2,
  Edit2,
  Key,
  UserPlus,
  UserMinus,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { eleccionApiService } from '../services/eleccion.service';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ElectorItem {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  grado_seccion: string;
  estado: 'PENDIENTE' | 'HABILITADO' | 'VOTO';
}

interface PuestoItem {
  id: string;
  numero_puesto: number;
  estado: 'LIBRE' | 'RESERVADO' | 'FUERA_SERVICIO' | 'HABILITADO' | 'VOTANDO';
  ultimo_heartbeat?: string | null;
}

interface DocenteItem {
  id: string;
  username: string;
  activo: boolean;
}

interface AulaData {
  id: string;
  numero: number;
  nombre: string;
  capacidad: number;
  docentes?: DocenteItem[];
  puestos?: PuestoItem[];
  electores?: ElectorItem[];
  _count?: {
    electores: number;
    puestos: number;
    docentes: number;
  };
}

interface Props {
  aulas: AulaData[];
  eleccionId: string;
  eleccionEstado: string;
  onCrearAula: (aula: { numero: number; nombre: string; capacidad: number }) => Promise<void>;
  onAbrirPuerta: (aulaId: string) => void;
  onActualizar?: () => Promise<void>;
}

export function AulasManager({
  aulas,
  eleccionId,
  eleccionEstado,
  onCrearAula,
  onAbrirPuerta,
  onActualizar,
}: Props) {
  const [numero, setNumero] = useState(aulas.length + 1);
  const [nombre, setNombre] = useState(`Mesa ${aulas.length + 1}`);
  const [capacidad, setCapacidad] = useState(45);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar siguiente número sugerido
  useEffect(() => {
    const siguienteNum = (aulas.length > 0 ? Math.max(...aulas.map((a) => a.numero)) : 0) + 1;
    setNumero(siguienteNum);
    setNombre(`Mesa ${siguienteNum}`);
  }, [aulas]);

  // Modal: Editar Aula
  const [aulaEditando, setAulaEditando] = useState<AulaData | null>(null);
  const [editNombreAula, setEditNombreAula] = useState('');
  const [editCapacidadAula, setEditCapacidadAula] = useState(45);
  const [editAulaLoading, setEditAulaLoading] = useState(false);

  // Modal: Asignar / Cambiar Docente
  const [aulaAsignandoDocente, setAulaAsignandoDocente] = useState<AulaData | null>(null);
  const [docenteUsername, setDocenteUsername] = useState('');
  const [docentePassword, setDocentePassword] = useState('docente123');
  const [docenteLoading, setDocenteLoading] = useState(false);

  // Modal: Ver Credenciales Docente
  const [docenteCredencialesModal, setDocenteCredencialesModal] = useState<{
    aulaNombre: string;
    username: string;
  } | null>(null);

  // Modal: Ver y Distribuir Estudiantes
  const [aulaSeleccionadaEstudiantes, setAulaSeleccionadaEstudiantes] = useState<AulaData | null>(null);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [moverLoading, setMoverLoading] = useState<string | null>(null);

  // Modal: Vincular Máquina / Puesto
  const [aulaSeleccionadaVincular, setAulaSeleccionadaVincular] = useState<AulaData | null>(null);
  const [codigoMaquina, setCodigoMaquina] = useState('');
  const [vincularLoading, setVincularLoading] = useState(false);

  // Desvincular Puesto Loading
  const [desvinculandoId, setDesvinculandoId] = useState<string | null>(null);

  const isLocked = eleccionEstado !== 'BORRADOR';

  const handleAbrirAsignarDocente = (aula: AulaData) => {
    setAulaAsignandoDocente(aula);
    const docenteExistente = aula.docentes && aula.docentes.length > 0 ? aula.docentes[0] : null;
    setDocenteUsername(docenteExistente ? docenteExistente.username : `docente${aula.numero}`);
    setDocentePassword('docente123');
  };

  const handleConfirmarAsignarDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aulaAsignandoDocente) return;
    try {
      setDocenteLoading(true);
      setErrorMsg(null);
      await eleccionApiService.asignarDocente(eleccionId, {
        aula_id: aulaAsignandoDocente.id,
        username: docenteUsername.trim(),
        password: docentePassword.trim(),
      });
      setFeedback(`Docente "${docenteUsername.trim()}" asignado correctamente a ${aulaAsignandoDocente.nombre}.`);
      setAulaAsignandoDocente(null);
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al asignar docente');
    } finally {
      setDocenteLoading(false);
    }
  };

  const handleQuitarDocente = async (docenteId: string, docenteUser: string, aulaNombre: string) => {
    if (!window.confirm(`¿Seguro que deseas quitar al docente "${docenteUser}" de la ${aulaNombre}? La mesa quedará sin docente asignado.`)) {
      return;
    }
    try {
      setErrorMsg(null);
      await eleccionApiService.quitarDocente(docenteId);
      setFeedback(`Se quitó al docente "${docenteUser}" de la ${aulaNombre}.`);
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al quitar docente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      setSaving(true);
      setFeedback(null);
      setErrorMsg(null);
      await onCrearAula({ numero, nombre, capacidad });
      setFeedback('Aula / Mesa creada correctamente.');
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear aula.');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarAula = async (aulaId: string, aulaNombre: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la "${aulaNombre}"? Esta acción borrará sus máquinas asociadas.`)) {
      return;
    }
    try {
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/admin/aulas/${aulaId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error al eliminar mesa' }));
        throw new Error(err.message || 'Error al eliminar la mesa');
      }
      setFeedback(`Mesa "${aulaNombre}" eliminada correctamente.`);
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar la mesa');
    }
  };

  const handleAbrirEditarAula = (aula: AulaData) => {
    setAulaEditando(aula);
    setEditNombreAula(aula.nombre);
    setEditCapacidadAula(aula.capacidad);
  };

  const handleGuardarEditarAula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aulaEditando) return;
    try {
      setEditAulaLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/admin/aulas/${aulaEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
        body: JSON.stringify({
          nombre: editNombreAula,
          capacidad: editCapacidadAula,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error al actualizar aula' }));
        throw new Error(err.message || 'Error al actualizar aula');
      }
      setFeedback(`Mesa "${editNombreAula}" actualizada exitosamente.`);
      setAulaEditando(null);
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar aula');
    } finally {
      setEditAulaLoading(false);
    }
  };

  const handleDesvincularPuesto = async (puestoId: string, aulaNombre: string, puestoNum: number) => {
    if (!window.confirm(`¿Seguro que deseas desvincular el Puesto #${puestoNum} del ${aulaNombre}? Volverá al estado LIBRE y solicitará emparejamiento nuevamente.`)) {
      return;
    }
    try {
      setDesvinculandoId(puestoId);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/admin/puestos/${puestoId}/desvincular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al desvincular puesto');
      }
      setFeedback(`Puesto #${puestoNum} desvinculado exitosamente.`);
      onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al desvincular puesto');
    } finally {
      setDesvinculandoId(null);
    }
  };

  const handleMoverElector = async (electorId: string, nuevaAulaId: string, nombreAlumno: string) => {
    if (!nuevaAulaId) return;
    try {
      setMoverLoading(electorId);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/admin/electores/${electorId}/mover-aula`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
        body: JSON.stringify({ nuevaAulaId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al reasignar estudiante');
      }
      setFeedback(`Estudiante ${nombreAlumno} reasignado de mesa exitosamente.`);
      await onActualizar?.();

      // Refrescar lista del modal
      if (aulaSeleccionadaEstudiantes) {
        const aulaActualizada = aulas.find((a) => a.id === aulaSeleccionadaEstudiantes.id);
        if (aulaActualizada) setAulaSeleccionadaEstudiantes(aulaActualizada);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo mover al estudiante');
    } finally {
      setMoverLoading(null);
    }
  };

  const handleVincularMaquina = async () => {
    if (!aulaSeleccionadaVincular || !codigoMaquina.trim()) return;
    try {
      setVincularLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/admin/aulas/${aulaSeleccionadaVincular.id}/puestos/autorizar-maquina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
        body: JSON.stringify({ token_qr: codigoMaquina.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al vincular máquina');
      }
      setFeedback(`Máquina vinculada exitosamente al ${aulaSeleccionadaVincular.nombre}.`);
      setCodigoMaquina('');
      setAulaSeleccionadaVincular(null);
      onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo vincular la máquina');
    } finally {
      setVincularLoading(false);
    }
  };

  const handleCrearPuestoDirecto = async (aulaId: string) => {
    try {
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/admin/aulas/${aulaId}/puestos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al agregar puesto');
      }
      setFeedback('Nuevo puesto habilitado en la mesa.');
      onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al agregar puesto');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas Globales de Feedback */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulario de Alta de Aula (Solo en BORRADOR) */}
      {!isLocked && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <School className="w-5 h-5 text-blue-800" />
              <CardTitle className="text-base font-bold">Registrar Nueva Aula / Mesa de Votación</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Define los salones institucionales donde se ubicarán los docentes y las mesas de sufragio estudiantil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Número
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numero}
                  onChange={(e) => setNumero(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Nombre de Mesa / Salón
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mesa 1 (Pabellón A - 1er piso)"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Aforo / Capacidad
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={capacidad}
                  onChange={(e) => setCapacidad(parseInt(e.target.value, 10) || 45)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end pt-1">
                <Button type="submit" disabled={saving} size="sm" className="bg-blue-900 text-white font-bold text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {saving ? 'Guardando...' : 'Crear Aula / Mesa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cartas de Aulas Configuradas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Cartas de Aulas y Mesas de Votación ({aulas.length})
            </h3>
            <p className="text-xs text-slate-500">
              Supervisión de máquinas vinculadas, docentes asignados y distribución de estudiantes por mesa
            </p>
          </div>
          {isLocked && <Badge className="bg-slate-800 text-white text-[10px]">Configuración Bloqueada</Badge>}
        </div>

        {aulas.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No hay aulas registradas en esta elección.</p>
            <p className="text-xs text-slate-400 mt-1">Registra al menos una mesa para habilitar el proceso electoral.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {aulas.map((aula) => {
              const electores = aula.electores || [];
              const totalElectores = electores.length;
              const votaron = electores.filter((e) => e.estado === 'VOTO').length;
              const pendientes = totalElectores - votaron;
              const porcentaje = totalElectores > 0 ? Math.round((votaron / totalElectores) * 100) : 0;

              const puestos = aula.puestos || [];
              const docente = aula.docentes && aula.docentes.length > 0 ? aula.docentes[0] : null;

              return (
                <Card
                  key={aula.id}
                  className="border-2 border-slate-200 hover:border-blue-400 transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden bg-white"
                >
                  {/* Encabezado de la Carta */}
                  <CardHeader className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600/80 text-blue-100 border border-blue-400/30">
                        Mesa / Aula #{aula.numero}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] text-slate-300 font-mono mr-1">Aforo: {aula.capacidad}</span>
                        {!isLocked && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarAula(aula)}
                              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
                              title="Editar nombre y aforo de la mesa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarAula(aula.id, aula.nombre)}
                              className="text-slate-400 hover:text-red-300 p-1 rounded hover:bg-white/10"
                              title="Eliminar mesa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base font-black text-white mt-1.5 leading-snug">
                      {aula.nombre}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between text-xs">
                    {/* 1. Docente Responsable */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                              docente ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            <Users className="w-4 h-4 text-emerald-700" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">
                              Docente a Cargo
                            </span>
                            <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                              {docente ? (
                                docente.username
                              ) : (
                                <span className="text-slate-400 italic font-normal">Sin docente asignado</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <Badge
                          className={`text-[9px] uppercase px-1.5 py-0.5 ${
                            docente?.activo
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {docente ? 'Asignado' : 'Pendiente'}
                        </Badge>
                      </div>

                      {/* Botones de Acción del Docente */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/70">
                        {docente ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setDocenteCredencialesModal({
                                  aulaNombre: aula.nombre,
                                  username: docente.username,
                                })
                              }
                              className="text-[10px] font-bold text-blue-700 hover:text-blue-900 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 flex items-center gap-1 border border-blue-200 transition-colors"
                              title="Ver credenciales de acceso docente"
                            >
                              <Key className="w-3 h-3 text-blue-600" />
                              Ver Claves
                            </button>

                            {!isLocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAbrirAsignarDocente(aula)}
                                  className="text-[10px] font-bold text-slate-700 hover:text-slate-900 px-2 py-1 rounded bg-white hover:bg-slate-100 flex items-center gap-1 border border-slate-200 transition-colors"
                                  title="Cambiar o reasignar docente de esta mesa"
                                >
                                  <UserCheck className="w-3 h-3 text-slate-600" />
                                  Cambiar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleQuitarDocente(docente.id, docente.username, aula.nombre)}
                                  className="text-[10px] font-bold text-red-600 hover:text-red-800 px-2 py-1 rounded bg-red-50 hover:bg-red-100 flex items-center gap-1 border border-red-200 transition-colors"
                                  title="Quitar docente a cargo de esta mesa"
                                >
                                  <UserMinus className="w-3 h-3 text-red-500" />
                                  Quitar
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          !isLocked && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirAsignarDocente(aula)}
                              className="h-6 text-[10px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2 flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3 text-emerald-600" /> Asignar Docente
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {/* 2. Métricas de Estudiantes Asignados */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-bold">Alumnos que votan aquí:</span>
                        <span className="font-mono font-black text-slate-900">
                          {votaron}/{totalElectores} ({porcentaje}%)
                        </span>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-600 h-2 transition-all duration-500 rounded-full"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="text-emerald-700 font-bold">✓ {votaron} votaron</span>
                        <span className="text-slate-600 font-medium">⏳ {pendientes} pendientes</span>
                      </div>
                    </div>

                    {/* 3. Máquinas / Puestos Habilitados */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <Monitor className="w-3.5 h-3.5 text-blue-700" /> Máquinas Habilitadas ({puestos.length})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCrearPuestoDirecto(aula.id)}
                          className="h-6 text-[10px] font-bold text-blue-700 hover:bg-blue-50 px-1.5"
                          title="Habilitar nuevo puesto en esta mesa"
                        >
                          <PlusCircle className="w-3 h-3 mr-1" /> Puesto
                        </Button>
                      </div>

                      {puestos.length === 0 ? (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] text-center">
                          No hay máquinas vinculadas a esta mesa.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {puestos.map((puesto) => {
                            const isLibre = puesto.estado === 'LIBRE';
                            const isVotando = puesto.estado === 'VOTANDO' || puesto.estado === 'RESERVADO';

                            return (
                              <div
                                key={puesto.id}
                                className="p-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white flex items-center justify-between gap-2 transition-colors"
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <div
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isLibre ? 'bg-emerald-500' : isVotando ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'
                                    }`}
                                  />
                                  <span className="font-bold text-slate-800 text-[11px] truncate">
                                    Puesto #{puesto.numero_puesto}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                      isLibre
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : isVotando
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {puesto.estado}
                                  </span>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={desvinculandoId === puesto.id}
                                  onClick={() =>
                                    handleDesvincularPuesto(puesto.id, aula.nombre, puesto.numero_puesto)
                                  }
                                  className="h-6 px-1.5 text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50"
                                  title="Desvincular máquina de esta mesa"
                                >
                                  <Unlink className="w-3 h-3 mr-1" />
                                  <span>Desvincular</span>
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 4. Botones de Acción de la Mesa */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAulaSeleccionadaVincular(aula)}
                          className="text-[11px] font-bold text-blue-900 border-blue-200 hover:bg-blue-50 hover:border-blue-400"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1 text-blue-700" />
                          Vincular QR
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAulaSeleccionadaEstudiantes(aula);
                            setBusquedaEstudiante('');
                          }}
                          className="text-[11px] font-bold text-slate-800 border-slate-200 hover:bg-slate-50"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-indigo-700" />
                          Distribuir
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAbrirPuerta(aula.id)}
                        className="w-full text-[11px] font-bold text-slate-600 hover:text-blue-900 hover:bg-blue-50/60"
                      >
                        <Monitor className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
                        Abrir Pantalla de Puerta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: DISTRIBUIR / REASIGNAR ESTUDIANTES */}
      {aulaSeleccionadaEstudiantes && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full bg-white shadow-2xl animate-in fade-in zoom-in-95 border-2 border-slate-200 max-h-[90vh] flex flex-col">
            <CardHeader className="bg-slate-900 text-white pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                    Estudiantes de {aulaSeleccionadaEstudiantes.nombre}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300 mt-0.5">
                    Total: {aulaSeleccionadaEstudiantes.electores?.length || 0} alumnos asignados a esta mesa. Puedes
                    distribuirlos a otras aulas si es necesario.
                  </CardDescription>
                </div>
                <button
                  onClick={() => setAulaSeleccionadaEstudiantes(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Buscador dentro del modal */}
              <div className="pt-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-4.5" />
                <input
                  type="text"
                  placeholder="Buscar por DNI, nombres o apellidos..."
                  value={busquedaEstudiante}
                  onChange={(e) => setBusquedaEstudiante(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800 text-white placeholder-slate-400 rounded-lg text-xs border border-slate-700 focus:outline-hidden"
                />
              </div>
            </CardHeader>

            <CardContent className="p-4 overflow-y-auto flex-1 space-y-2">
              {(() => {
                const list = (aulaSeleccionadaEstudiantes.electores || []).filter((e) => {
                  if (!busquedaEstudiante) return true;
                  const q = busquedaEstudiante.toLowerCase();
                  return (
                    e.dni.includes(q) ||
                    e.nombres.toLowerCase().includes(q) ||
                    e.apellidos.toLowerCase().includes(q)
                  );
                });

                if (list.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No se encontraron estudiantes con ese criterio.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-slate-100">
                    {list.map((elector) => {
                      const yaVoto = elector.estado === 'VOTO';

                      return (
                        <div
                          key={elector.id}
                          className="py-2.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 rounded-lg text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{elector.dni}</span>
                              <span className="font-bold text-slate-800">
                                {elector.apellidos}, {elector.nombres}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                {elector.grado_seccion}
                              </span>
                            </div>
                            <div className="text-[11px] mt-0.5">
                              {yaVoto ? (
                                <span className="text-emerald-700 font-bold">✓ Votó satisfactoriamente</span>
                              ) : (
                                <span className="text-slate-500">⏳ Pendiente de sufragio</span>
                              )}
                            </div>
                          </div>

                          {/* Reasignar a otra aula */}
                          {!yaVoto ? (
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <select
                                aria-label="Mover a otra mesa"
                                className="text-[11px] font-semibold bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-600"
                                defaultValue=""
                                onChange={(e) => {
                                  const destId = e.target.value;
                                  if (destId) {
                                    handleMoverElector(
                                      elector.id,
                                      destId,
                                      `${elector.nombres} ${elector.apellidos}`,
                                    );
                                  }
                                }}
                                disabled={moverLoading === elector.id}
                              >
                                <option value="" disabled>
                                  Mover a otra mesa...
                                </option>
                                {aulas
                                  .filter((a) => a.id !== aulaSeleccionadaEstudiantes.id)
                                  .map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.nombre}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] self-start sm:self-center">
                              Voto Registrado
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 2: VINCULAR MÁQUINA A ESTA MESA */}
      {aulaSeleccionadaVincular && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-2xl animate-in fade-in zoom-in-95 border-2 border-slate-200">
            <CardHeader className="bg-blue-950 text-white pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-base font-black text-white">Vincular Máquina</CardTitle>
                </div>
                <button
                  onClick={() => setAulaSeleccionadaVincular(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-blue-200 mt-0.5">
                Asigna un terminal o tablet a <strong>{aulaSeleccionadaVincular.nombre}</strong>.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Abre la pantalla de la máquina en <strong>/kiosco</strong> y copia o escanea el código token de
                emparejamiento que aparece en su pantalla.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Código Token de la Máquina / QR
                </label>
                <input
                  type="text"
                  placeholder="Ej. pegue el token QR de la pantalla..."
                  value={codigoMaquina}
                  onChange={(e) => setCodigoMaquina(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAulaSeleccionadaVincular(null)}
                  disabled={vincularLoading}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleVincularMaquina}
                  disabled={vincularLoading || !codigoMaquina.trim()}
                  className="bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  {vincularLoading ? 'Vinculando...' : 'Autorizar y Vincular'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 3: EDITAR AULA */}
      {aulaEditando && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-2xl animate-in fade-in zoom-in-95 border-2 border-slate-200">
            <CardHeader className="bg-slate-900 text-white pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit2 className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-base font-black text-white">Editar Mesa #{aulaEditando.numero}</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setAulaEditando(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleGuardarEditarAula} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nombre de Mesa / Salón
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombreAula}
                    onChange={(e) => setEditNombreAula(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Aforo / Capacidad
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    required
                    value={editCapacidadAula}
                    onChange={(e) => setEditCapacidadAula(parseInt(e.target.value, 10) || 45)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAulaEditando(null)}
                    disabled={editAulaLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={editAulaLoading || !editNombreAula.trim()}
                    className="bg-blue-900 hover:bg-blue-950 text-white font-bold"
                  >
                    {editAulaLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 4: VER CREDENCIALES DOCENTE */}
      {docenteCredencialesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-2xl animate-in fade-in zoom-in-95 border-2 border-slate-200">
            <CardHeader className="bg-emerald-900 text-white pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-emerald-300" />
                  <CardTitle className="text-base font-black text-white">Credenciales Docente de Aula</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setDocenteCredencialesModal(null)}
                  className="text-emerald-200 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-emerald-200 mt-0.5">
                Mesa asignada: <strong>{docenteCredencialesModal.aulaNombre}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Usuario de acceso</span>
                  <span className="text-sm font-bold text-slate-900">{docenteCredencialesModal.username}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Contraseña</span>
                  <span className="text-sm font-bold text-slate-900">docente123</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">PIN 2FA / TOTP (Demo)</span>
                  <span className="text-sm font-bold text-emerald-700">000000 <span className="font-sans text-[11px] text-slate-500 font-normal">o</span> 123456</span>
                </div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                El docente asignado ingresa desde el menú superior en <strong>Encargados &rarr; Docente de Aula</strong> con estas credenciales para habilitar electores y supervisar sus máquinas.
              </p>
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setDocenteCredencialesModal(null)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                >
                  Entendido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 5: ASIGNAR / CAMBIAR DOCENTE */}
      {aulaAsignandoDocente && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-2xl animate-in fade-in zoom-in-95 border-2 border-slate-200">
            <CardHeader className="bg-emerald-950 text-white pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <CardTitle className="text-base font-black text-white">
                    Asignar Docente a Cargo
                  </CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setAulaAsignandoDocente(null)}
                  className="text-emerald-300 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-emerald-200 mt-0.5">
                Mesa: <strong>{aulaAsignandoDocente.nombre}</strong> (Mesa #{aulaAsignandoDocente.numero})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleConfirmarAsignarDocente} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Usuario de Acceso del Docente
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    placeholder="Ej. docente1 o prof_garcia"
                    value={docenteUsername}
                    onChange={(e) => setDocenteUsername(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Nombre de usuario con el que el docente iniciará sesión.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Contraseña Inicial
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={docentePassword}
                    onChange={(e) => setDocentePassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Contraseña de ingreso (mínimo 6 caracteres).
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Segundo Factor 2FA Automático</span>
                    <span>El profesor podrá validar su identidad usando Authenticator o con el PIN demo escolar <strong>000000</strong> o <strong>123456</strong>.</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAulaAsignandoDocente(null)}
                    disabled={docenteLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={docenteLoading || !docenteUsername.trim()}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                  >
                    {docenteLoading ? 'Asignando...' : 'Guardar y Asignar Docente'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
