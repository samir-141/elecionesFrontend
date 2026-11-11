import { useEffect, useState } from 'react';
import { Search, School, Users, ShieldAlert } from 'lucide-react';
import { imageUpdateService } from '../../services/images/image-update.service';
import { ConfiguracionInstitucional } from '../../types';

interface ElectorPuerta {
  id: string;
  nombres: string;
  apellidos: string;
  grado_seccion: string;
}

interface Props {
  aulaNumero?: number;
  aulaNombre?: string;
}

// Datos de demostración cívica
const ELECTORES_DEMO: ElectorPuerta[] = [
  { id: '1', apellidos: 'Alvarado Benítez', nombres: 'Carlos Daniel', grado_seccion: '5to A' },
  { id: '2', apellidos: 'Cáceres Mendoza', nombres: 'Lucía Fernanda', grado_seccion: '5to A' },
  { id: '3', apellidos: 'Espinoza Rivera', nombres: 'Mateo Alejandro', grado_seccion: '5to A' },
  { id: '4', apellidos: 'Flores Quispe', nombres: 'Valeria Nicole', grado_seccion: '5to A' },
  { id: '5', apellidos: 'Gutiérrez Salazar', nombres: 'Joaquín Andrés', grado_seccion: '5to A' },
  { id: '6', apellidos: 'Huamán Paredes', nombres: 'Camila Sofía', grado_seccion: '5to A' },
  { id: '7', apellidos: 'López Morales', nombres: 'Diego Sebastián', grado_seccion: '5to A' },
  { id: '8', apellidos: 'Mendoza Ramos', nombres: 'Adriana Belén', grado_seccion: '5to A' },
  { id: '9', apellidos: 'Navarro Silva', nombres: 'Gabriel Ignacio', grado_seccion: '5to A' },
  { id: '10', apellidos: 'Pérez Gómez', nombres: 'Juan Carlos', grado_seccion: '5to A' },
  { id: '11', apellidos: 'Quispe Mamani', nombres: 'Fiorella Stefany', grado_seccion: '5to A' },
  { id: '12', apellidos: 'Rojas Vega', nombres: 'Sebastián Alonso', grado_seccion: '5to A' },
];

export function PantallaPuertaView({ aulaNumero = 1, aulaNombre = 'Aula 1 (Pabellón A)' }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [institucion, setInstitucion] = useState<ConfiguracionInstitucional | null>(null);

  useEffect(() => {
    imageUpdateService.obtenerInstitucionalPublica().then((res) => {
      if (res?.institucion) setInstitucion(res.institucion);
    });
  }, []);

  const filtrados = ELECTORES_DEMO.filter((e) =>
    `${e.apellidos} ${e.nombres}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-6 sm:p-10 font-sans">
      {/* Encabezado Cívico Institucional para TV / Monitor */}
      <header className="border-b border-slate-800 pb-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {institucion?.logo_url && (
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              <img
                src={institucion.logo_url}
                alt={institucion.nombre_institucion}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-2xl shadow-lg">
            #{aulaNumero}
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
              Pantalla Pública de Asignación de Aula
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">{aulaNombre}</h1>
            <p className="text-sm text-slate-400">{institucion?.titulo_portada || 'Elección Municipio Escolar 2026'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white text-base">{ELECTORES_DEMO.length}</span>
            <span className="text-slate-400 text-xs">Electores Asignados</span>
          </div>
        </div>
      </header>

      {/* Barra de Búsqueda Rápida para el Estudiante */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Busca tus apellidos para verificar tu aula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-800">
          <ShieldAlert className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
          <span>
            <strong>Invariante I1:</strong> Esta pantalla solo confirma que votas aquí. Por ley y anonimato, jamás muestra si ya votaste.
          </span>
        </div>
      </div>

      {/* Lista Alfabética de Estudiantes (Diseñada para Lectura a Distancia) */}
      <div className="flex-1 bg-slate-800/50 border border-slate-800 rounded-2xl p-4 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1">
          {filtrados.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              No se encontraron alumnos con el término "{busqueda}".
            </div>
          ) : (
            filtrados.map((elector, idx) => (
              <div
                key={elector.id}
                className="p-3.5 bg-slate-800 rounded-xl border border-slate-700/70 hover:border-blue-500 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-500 w-6 text-right">
                    {idx + 1}.
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm tracking-wide">
                      {elector.apellidos}
                    </h3>
                    <p className="text-xs text-slate-400">{elector.nombres}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-700 text-blue-300 rounded-lg">
                  {elector.grado_seccion}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pie Institucional */}
      <footer className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-between">
        <span>Presenta tu DNI ante el docente del aula para ser habilitado.</span>
        <span className="flex items-center gap-1 text-slate-400">
          <School className="w-3.5 h-3.5 text-blue-400" /> Sistema Electoral Escolar
        </span>
      </footer>
    </div>
  );
}

