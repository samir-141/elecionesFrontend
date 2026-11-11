import { useState, useEffect } from 'react';
import { Eleccion, ReglasEleccion, Aula, Partido } from '../../../types';
import { eleccionApiService, ELECCION_INICIAL_DEFAULT } from '../services/eleccion.service';
import { CicloVidaPanel } from '../components/CicloVidaPanel';
import { ReglasConfiguracion } from '../components/ReglasConfiguracion';
import { AuditoriaTabla } from '../components/AuditoriaTabla';
import { AulasManager } from '../components/AulasManager';
import { PartidosManager } from '../components/PartidosManager';
import { PadronImportador } from '../components/PadronImportador';
import { EscrutinioPanel } from '../components/EscrutinioPanel';
import { ImageManagerPanel } from '../../../components/admin/image-manager/ImageManagerPanel';
import { Shield, Sliders, Activity, RefreshCw, School, Flag, Award, ChevronDown, FileSpreadsheet, Edit2, Trash2, AlertTriangle, CheckCircle2, X, Image as ImageIcon } from 'lucide-react';

interface Props {
  onVerPantallaPuerta?: (aulaId: string) => void;
}

const AULAS_DEFAULT: Aula[] = [
  { id: 'aula-1', eleccion_id: 'default', numero: 1, nombre: 'Aula 1 (Pabellón A)', capacidad: 45 },
  { id: 'aula-2', eleccion_id: 'default', numero: 2, nombre: 'Aula 2 (Pabellón B)', capacidad: 45 },
];

const PARTIDOS_DEFAULT: Partido[] = [
  { id: 'p-1', eleccion_id: 'default', numero_lista: 1, nombre: 'Innovación Estudiantil', lema: 'Liderazgo y tecnología', logo_url: null },
  { id: 'p-2', eleccion_id: 'default', numero_lista: 2, nombre: 'Fuerza Escolar Unida', lema: 'Compromiso y transparencia', logo_url: null },
];

export function AdminDashboard({ onVerPantallaPuerta }: Props) {
  const [eleccion, setEleccion] = useState<Eleccion>(ELECCION_INICIAL_DEFAULT);
  const [todasElecciones, setTodasElecciones] = useState<any[]>([]);
  const [aulas, setAulas] = useState<Aula[]>(AULAS_DEFAULT);
  const [partidos, setPartidos] = useState<Partido[]>(PARTIDOS_DEFAULT);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ciclo' | 'reglas' | 'aulas' | 'partidos' | 'imagenes' | 'padron' | 'escrutinio' | 'auditoria'>('ciclo');
  const [loading, setLoading] = useState(true);

  // Estados para Modal de Edición de Elección
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Estados para Modal de Eliminación de Elección
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Mensaje de notificación / feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cargarListaElecciones = async () => {
    try {
      const lista = await eleccionApiService.listarElecciones();
      setTodasElecciones(lista || []);
    } catch {
      // Ignorar fallback
    }
  };

  const cargarDatos = async (eleccionId?: string) => {
    try {
      setLoading(true);
      const data = await eleccionApiService.obtenerEleccion(eleccionId || eleccion.id || 'activa');
      setEleccion(data);
      const logs = await eleccionApiService.obtenerAuditoria(data.id);
      setAuditLogs(logs);

      await cargarListaElecciones();

      // Cargar Aulas enriquecidas desde el Backend
      try {
        const resAulas = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/admin/elecciones/${data.id}/aulas`);
        if (resAulas.ok) {
          const listaAulas = await resAulas.json();
          setAulas(listaAulas);
        }
      } catch {
        const savedAulas = localStorage.getItem('aulas_eleccion');
        if (savedAulas) setAulas(JSON.parse(savedAulas));
      }

      // Cargar Partidos desde el Backend
      try {
        const resPartidos = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/admin/elecciones/${data.id}/partidos`);
        if (resPartidos.ok) {
          const listaPartidos = await resPartidos.json();
          setPartidos(listaPartidos);
        }
      } catch {
        const savedPartidos = localStorage.getItem('partidos_eleccion');
        if (savedPartidos) setPartidos(JSON.parse(savedPartidos));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos('activa');
  }, []);

  const handleSeleccionarEleccion = async (id: string) => {
    await cargarDatos(id);
  };

  const handleSaveReglas = async (nuevasReglas: Partial<ReglasEleccion>) => {
    const actualizada = await eleccionApiService.actualizarReglas(eleccion.id, nuevasReglas);
    setEleccion(actualizada);
    const logs = await eleccionApiService.obtenerAuditoria(eleccion.id);
    setAuditLogs(logs);
  };

  const handleAbrir = async () => {
    const abierta = await eleccionApiService.abrirEleccion(eleccion.id);
    setEleccion(abierta);
    const logs = await eleccionApiService.obtenerAuditoria(eleccion.id);
    setAuditLogs(logs);
    await cargarListaElecciones();
  };

  const handleCerrar = async () => {
    const cerrada = await eleccionApiService.cerrarEleccion(eleccion.id);
    setEleccion(cerrada);
    const logs = await eleccionApiService.obtenerAuditoria(eleccion.id);
    setAuditLogs(logs);
    await cargarListaElecciones();
  };

  const handleReaperturar = async () => {
    const reaperturada = await eleccionApiService.reaperturarEleccion(eleccion.id);
    setEleccion(reaperturada);
    const logs = await eleccionApiService.obtenerAuditoria(eleccion.id);
    setAuditLogs(logs);
    await cargarListaElecciones();
  };

  const handleCrearNueva = async (params: {
    nombre: string;
    descripcion?: string;
    clonarConfiguracion?: boolean;
    clonarPadron?: boolean;
    eleccionOrigenId?: string;
  }) => {
    const nueva = await eleccionApiService.crearNuevaEleccion(params);
    setEleccion(nueva);
    const logs = await eleccionApiService.obtenerAuditoria(nueva.id);
    setAuditLogs(logs);
    await cargarListaElecciones();
    setActiveTab('ciclo');
  };

  const handleCrearAula = async (aulaData: { numero: number; nombre: string; capacidad: number }) => {
    await eleccionApiService.crearAula(eleccion.id, aulaData);
    await cargarDatos(eleccion.id);
  };

  const handleCrearPartido = async (partidoData: {
    numero_lista: number;
    nombre: string;
    lema?: string;
    logo_url?: string | null;
    logo_media_id?: string | null;
  }) => {
    await eleccionApiService.crearPartido(eleccion.id, partidoData);
    await cargarDatos(eleccion.id);
  };

  const abrirModalEditar = () => {
    setEditNombre(eleccion.nombre);
    setEditDescripcion(eleccion.descripcion || '');
    setShowModalEditar(true);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre.trim()) {
      setFeedbackMessage({ type: 'error', text: 'El nombre de la elección no puede estar vacío.' });
      return;
    }

    try {
      setSavingEdit(true);
      const actualizada = await eleccionApiService.actualizarEleccion(eleccion.id, {
        nombre: editNombre.trim(),
        descripcion: editDescripcion.trim(),
      });
      setEleccion(actualizada);
      await cargarListaElecciones();
      setShowModalEditar(false);
      setFeedbackMessage({ type: 'success', text: 'Datos de la elección actualizados correctamente.' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error al actualizar la elección.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (eleccion.estado === 'ABIERTA') {
      setFeedbackMessage({
        type: 'error',
        text: 'No es posible eliminar una elección en curso (ABIERTA). Debe cerrarla previamente.',
      });
      return;
    }

    try {
      setDeleting(true);
      await eleccionApiService.eliminarEleccion(eleccion.id);

      // Obtener lista actualizada
      const listaRestante = await eleccionApiService.listarElecciones();
      setTodasElecciones(listaRestante || []);

      setShowModalEliminar(false);
      setFeedbackMessage({
        type: 'success',
        text: `La elección "${eleccion.nombre}" fue eliminada exitosamente.`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);

      // Si quedan otras elecciones, seleccionar la primera disponible
      if (listaRestante && listaRestante.length > 0) {
        await cargarDatos(listaRestante[0].id);
      } else {
        await cargarDatos('activa');
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error al eliminar la elección.' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando panel administrativo...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de Feedback si existe */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Encabezado del Panel Institucional */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-800 tracking-wider uppercase mb-1">
            <Shield className="w-4 h-4" />
            <span>Panel de Control Electoral</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{eleccion.nombre}</h2>
            <span
              className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-full ${
                eleccion.estado === 'ABIERTA'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : eleccion.estado === 'BORRADOR'
                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                  : eleccion.estado === 'CERRADA'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
              }`}
            >
              {eleccion.estado}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{eleccion.descripcion || 'Proceso electoral institucional'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {/* Selector de Elecciones */}
          {todasElecciones.length > 0 && (
            <div className="relative">
              <select
                aria-label="Seleccionar proceso electoral"
                value={eleccion.id}
                onChange={(e) => handleSeleccionarEleccion(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                {todasElecciones.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.nombre} ({el.estado})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          )}

          {/* Botón Editar Elección */}
          <button
            onClick={abrirModalEditar}
            title="Editar nombre y descripción de este proceso electoral"
            className="inline-flex items-center text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
            Editar
          </button>

          {/* Botón Eliminar Elección */}
          <button
            onClick={() => setShowModalEliminar(true)}
            title="Eliminar este proceso electoral y sus datos asociados"
            className="inline-flex items-center text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-lg px-3 py-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
            Eliminar
          </button>

          {/* Botón Actualizar Estado */}
          <button
            onClick={() => cargarDatos()}
            title="Recargar datos del proceso"
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1">
        <button
          onClick={() => setActiveTab('ciclo')}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'ciclo'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Ciclo de Vida</span>
        </button>

        <button
          onClick={() => setActiveTab('reglas')}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'reglas'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Reglas Electorales</span>
        </button>

        <button
          onClick={() => setActiveTab('aulas')}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'aulas'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Aulas ({aulas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('partidos')}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'partidos'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Partidos ({partidos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('imagenes')}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'imagenes'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Imágenes & Storage</span>
        </button>

        <button
          onClick={() => setActiveTab('padron')}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'padron'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Padrón (Excel / CSV)</span>
        </button>

        <button
          onClick={() => setActiveTab('escrutinio')}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'escrutinio'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Escrutinio y Cómputo</span>
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'auditoria'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Auditoría</span>
        </button>
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div>
        {activeTab === 'ciclo' && (
          <CicloVidaPanel
            eleccion={eleccion}
            onAbrir={handleAbrir}
            onCerrar={handleCerrar}
            onReaperturar={handleReaperturar}
            onEditar={abrirModalEditar}
            onEliminar={() => setShowModalEliminar(true)}
            onCrearNueva={handleCrearNueva}
            onIrAEscrutinio={() => setActiveTab('escrutinio')}
          />
        )}

        {activeTab === 'reglas' && (
          <ReglasConfiguracion eleccion={eleccion} onSaveReglas={handleSaveReglas} />
        )}

        {activeTab === 'aulas' && (
          <AulasManager
            aulas={aulas}
            eleccionId={eleccion.id}
            eleccionEstado={eleccion.estado}
            onCrearAula={handleCrearAula}
            onAbrirPuerta={(aulaId) => onVerPantallaPuerta?.(aulaId)}
            onActualizar={cargarDatos}
          />
        )}

        {activeTab === 'partidos' && (
          <PartidosManager
            partidos={partidos}
            eleccionId={eleccion.id}
            eleccionEstado={eleccion.estado}
            onCrearPartido={handleCrearPartido}
            onActualizar={cargarDatos}
          />
        )}

        {activeTab === 'imagenes' && (
          <ImageManagerPanel
            eleccionId={eleccion.id}
            onDataChanged={() => cargarDatos(eleccion.id)}
          />
        )}

        {activeTab === 'padron' && (
          <PadronImportador
            eleccionId={eleccion.id}
            eleccionEstado={eleccion.estado}
            aulas={aulas}
            onImportarExitoso={() => cargarDatos()}
          />
        )}

        {activeTab === 'escrutinio' && (
          <EscrutinioPanel
            eleccion={eleccion}
            onEleccionActualizada={(nueva) => {
              setEleccion(nueva);
              cargarListaElecciones();
            }}
          />
        )}

        {activeTab === 'auditoria' && <AuditoriaTabla logs={auditLogs} />}
      </div>

      {/* Modal Editar Elección */}
      {showModalEditar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Editar Proceso Electoral</h3>
                  <p className="text-xs text-slate-500">Modifica los datos institucionales de esta elección</p>
                </div>
              </div>
              <button
                onClick={() => setShowModalEditar(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre de la Elección *
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Ej. Elección Municipio Escolar 2026"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descripción / Propósito
                </label>
                <textarea
                  rows={3}
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  placeholder="Descripción de la convocatoria o directiva estudiantil..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModalEditar(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editNombre.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Elección */}
      {showModalEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">¿Eliminar este Proceso Electoral?</h3>
                <p className="text-xs text-slate-500">Acción permanente e irreversible</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Elección a eliminar:</span>
                <span className="font-bold text-slate-900">{eleccion.nombre}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Estado actual:</span>
                <span className="font-bold px-2 py-0.5 rounded-full text-[11px] bg-slate-200 text-slate-800">
                  {eleccion.estado}
                </span>
              </div>
            </div>

            {eleccion.estado === 'ABIERTA' ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-5 space-y-1">
                <div className="flex items-center font-bold gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Elección en Curso (ABIERTA)</span>
                </div>
                <p>
                  No es posible eliminar una elección con sufragios activos. Debe cerrarla previamente en la pestaña <strong>Ciclo de Vida</strong> para resguardar la consistencia de los kioscos de votación.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs mb-5 space-y-2">
                <div className="flex items-center font-bold gap-1.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Advertencia de Eliminación Completa</span>
                </div>
                <p>
                  Al confirmar, se eliminarán de forma definitiva todos los registros vinculados a esta elección:
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-rose-800 text-[11px]">
                  <li>Aulas y puestos de votación vinculados</li>
                  <li>Listas partidarias inscritas</li>
                  <li>Padrón de estudiantes y asignaciones docentes</li>
                  <li>Urnas de sufragio, actas de escrutinio y auditorías</li>
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModalEliminar(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={deleting || eleccion.estado === 'ABIERTA'}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
