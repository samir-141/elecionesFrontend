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
import { Shield, Sliders, Activity, RefreshCw, School, Flag, Award, ChevronDown, FileSpreadsheet } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'ciclo' | 'reglas' | 'aulas' | 'partidos' | 'padron' | 'escrutinio' | 'auditoria'>('ciclo');
  const [loading, setLoading] = useState(true);

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

  const handleCrearPartido = async (partidoData: { numero_lista: number; nombre: string; lema?: string; logo_url?: string }) => {
    await eleccionApiService.crearPartido(eleccion.id, partidoData);
    await cargarDatos(eleccion.id);
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

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          {/* Selector de Elecciones si existen varias */}
          {todasElecciones.length > 1 && (
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

          <button
            onClick={() => cargarDatos()}
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Actualizar Estado
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
            eleccionEstado={eleccion.estado}
            onCrearPartido={handleCrearPartido}
            onActualizar={cargarDatos}
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
    </div>
  );
}
