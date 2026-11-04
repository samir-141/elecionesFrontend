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
import { Shield, Sliders, Activity, RefreshCw, School, Flag, Users, Award } from 'lucide-react';

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
  const [aulas, setAulas] = useState<Aula[]>(AULAS_DEFAULT);
  const [partidos, setPartidos] = useState<Partido[]>(PARTIDOS_DEFAULT);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ciclo' | 'reglas' | 'aulas' | 'partidos' | 'padron' | 'escrutinio' | 'auditoria'>('ciclo');
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await eleccionApiService.obtenerEleccion();
      setEleccion(data);
      const logs = await eleccionApiService.obtenerAuditoria(data.id);
      setAuditLogs(logs);

      const savedAulas = localStorage.getItem('aulas_eleccion');
      if (savedAulas) setAulas(JSON.parse(savedAulas));

      const savedPartidos = localStorage.getItem('partidos_eleccion');
      if (savedPartidos) setPartidos(JSON.parse(savedPartidos));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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
  };

  const handleCerrar = async () => {
    const cerrada = await eleccionApiService.cerrarEleccion(eleccion.id);
    setEleccion(cerrada);
    const logs = await eleccionApiService.obtenerAuditoria(eleccion.id);
    setAuditLogs(logs);
  };

  const handleCrearAula = async (aulaData: { numero: number; nombre: string; capacidad: number }) => {
    const nuevaAula: Aula = {
      id: `aula-${Date.now()}`,
      eleccion_id: eleccion.id,
      ...aulaData,
    };
    const updated = [...aulas, nuevaAula];
    setAulas(updated);
    localStorage.setItem('aulas_eleccion', JSON.stringify(updated));
  };

  const handleCrearPartido = async (partidoData: { numero_lista: number; nombre: string; lema?: string; logo_url?: string }) => {
    const nuevoPartido: Partido = {
      id: `partido-${Date.now()}`,
      eleccion_id: eleccion.id,
      lema: partidoData.lema || null,
      logo_url: partidoData.logo_url || null,
      ...partidoData,
    };
    const updated = [...partidos, nuevoPartido];
    setPartidos(updated);
    localStorage.setItem('partidos_eleccion', JSON.stringify(updated));
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{eleccion.nombre}</h2>
          <p className="text-sm text-slate-500 mt-1">{eleccion.descripcion}</p>
        </div>

        <button
          onClick={cargarDatos}
          className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors self-start md:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Actualizar Estado
        </button>
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
          <Users className="w-4 h-4" />
          <span>Padrón CSV</span>
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
          <CicloVidaPanel eleccion={eleccion} onAbrir={handleAbrir} onCerrar={handleCerrar} />
        )}

        {activeTab === 'reglas' && (
          <ReglasConfiguracion eleccion={eleccion} onSaveReglas={handleSaveReglas} />
        )}

        {activeTab === 'aulas' && (
          <AulasManager
            aulas={aulas}
            eleccionEstado={eleccion.estado}
            onCrearAula={handleCrearAula}
            onAbrirPuerta={(aulaId) => onVerPantallaPuerta?.(aulaId)}
          />
        )}

        {activeTab === 'partidos' && (
          <PartidosManager
            partidos={partidos}
            eleccionEstado={eleccion.estado}
            onCrearPartido={handleCrearPartido}
          />
        )}

        {activeTab === 'padron' && (
          <PadronImportador
            eleccionId={eleccion.id}
            eleccionEstado={eleccion.estado}
            onImportarExitoso={cargarDatos}
          />
        )}

        {activeTab === 'escrutinio' && (
          <EscrutinioPanel
            eleccion={eleccion}
            onEleccionActualizada={(nueva) => setEleccion(nueva)}
          />
        )}

        {activeTab === 'auditoria' && <AuditoriaTabla logs={auditLogs} />}
      </div>
    </div>
  );
}
