import { useState, useEffect } from 'react';
import { Eleccion } from '../../../types';
import {
  escrutinioApiService,
  ResultadoEscrutinioOficial,
} from '../services/escrutinio.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Printer,
  Vote,
  Hash,
  TrendingUp,
} from 'lucide-react';

interface Props {
  eleccion: Eleccion;
  onEleccionActualizada: (nueva: Eleccion) => void;
}

const COLORES = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export function EscrutinioPanel({ eleccion, onEleccionActualizada }: Props) {
  const [resultado, setResultado] = useState<ResultadoEscrutinioOficial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarResultado();
  }, [eleccion.id, eleccion.estado]);

  const cargarResultado = async () => {
    const res = await escrutinioApiService.obtenerResultado(eleccion.id);
    if (res) setResultado(res);
  };

  const handleEjecutarEscrutinio = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await escrutinioApiService.ejecutarEscrutinio(eleccion.id);
      setResultado(res);
      onEleccionActualizada({
        ...eleccion,
        estado: 'ESCRUTADA',
      });
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar el escrutinio oficial');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirActa = () => {
    window.print();
  };

  // Preparar datos para los gráficos Recharts
  const chartData = resultado
    ? [
        ...resultado.conteo_partidos.partidos.map((p) => ({
          name: p.nombre,
          votos: p.votos,
          porcentaje: p.porcentaje,
        })),
        {
          name: 'Voto en Blanco',
          votos: resultado.conteo_partidos.votos_blanco,
          porcentaje: resultado.conteo_partidos.porcentaje_blanco,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-blue-700" />
            <h2 className="text-xl font-black text-slate-900">Escrutinio y Cómputo Final</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conteo aleatorizado (I19), aplicación de fórmulas electorales y reporte con huella SHA-256
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {resultado && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImprimirActa}
              className="text-xs font-semibold"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Imprimir Acta Oficial
            </Button>
          )}

          {eleccion.estado === 'CERRADA' && (
            <Button
              size="sm"
              onClick={handleEjecutarEscrutinio}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Escrutando Urna...
                </>
              ) : (
                'Ejecutar Escrutinio Oficial'
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Si la elección aún no está CERRADA ni ESCRUTADA */}
      {eleccion.estado !== 'CERRADA' && eleccion.estado !== 'ESCRUTADA' && !resultado && (
        <Card className="border-dashed border-2 border-slate-300 text-center p-8">
          <CardContent className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
              <Vote className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Escrutinio no disponible aún</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              La elección se encuentra actualmente en estado <strong>{eleccion.estado}</strong>. Para ejecutar el
              conteo oficial de la urna, primero debe cerrarse el proceso de votación en la pestaña "Ciclo de Vida".
            </p>
          </CardContent>
        </Card>
      )}

      {/* PANEL DE RESULTADOS CONSOLIDADOS */}
      {resultado && (
        <div className="space-y-6">
          {/* 1. Proclamación Oficial y Dictamen Electoral */}
          <Card className="border-2 border-blue-600 bg-gradient-to-r from-blue-50/70 via-white to-blue-50/40 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-blue-700 font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dictamen Electoral Oficial
                </span>
                <Badge variant={resultado.quorum_cumplido ? 'success' : 'destructive'} className="text-xs font-bold">
                  {resultado.quorum_cumplido ? 'Quórum Válido' : 'Sin Quórum'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {resultado.requiere_segunda_vuelta ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <h3 className="text-base font-black text-amber-900 mb-1">
                    SEGUNDA VUELTA ELECTORAL REQUERIDA
                  </h3>
                  <p className="text-xs text-amber-800">
                    Ninguna lista alcanzó el porcentaje mínimo ({resultado.porcentajes_calculados.umbral_minimo_ganar}%)
                    para ganar en primera vuelta. Pasan a la segunda vuelta:
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {resultado.partidos_segunda_vuelta?.map((p) => (
                      <span
                        key={p.id}
                        className="bg-white px-3 py-1 rounded-lg border border-amber-300 font-bold text-xs text-slate-800"
                      >
                        Lista #{p.numero_lista}: {p.nombre} ({p.porcentaje}%)
                      </span>
                    ))}
                  </div>
                </div>
              ) : resultado.ganador ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800">
                      Lista Ganadora en Primera Vuelta
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      {resultado.ganador.nombre}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Lista #{resultado.ganador.numero_lista} • {resultado.ganador.lema || 'Compromiso estudiantil'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-700">{resultado.ganador.porcentaje}%</div>
                    <span className="text-[10px] text-slate-500 font-bold">{resultado.ganador.votos} votos válidos</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 p-4 rounded-xl border text-center">
                  <h3 className="text-base font-bold text-slate-800">Elección Declarada Desierta</h3>
                  <p className="text-xs text-slate-500">No se alcanzó el quórum electoral requerido de participación.</p>
                </div>
              )}

              {/* Métricas de Participación y Balance Invariante I14 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Votos en Urna</span>
                  <span className="text-lg font-black text-slate-900">{resultado.total_votos_urna}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Electores Votaron</span>
                  <span className="text-lg font-black text-slate-900">{resultado.total_electores_votaron}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Participación</span>
                  <span className="text-lg font-black text-blue-700">
                    {resultado.porcentajes_calculados.participacion_porcentaje}%
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Invariante I14</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Balance 100%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Gráficos Visuales Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Barras */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-700" />
                  <CardTitle className="text-sm font-bold">Distribución de Votos por Lista</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Votación nominal por opción electoral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          name === 'votos' ? `${value} votos` : `${value}%`,
                          name === 'votos' ? 'Votos' : 'Porcentaje',
                        ]}
                      />
                      <Bar dataKey="votos" fill="#2563eb" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico Circular de Porcentajes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Porcentaje Electoral</CardTitle>
                <CardDescription className="text-xs">
                  Base: {resultado.porcentajes_calculados.base_calculo === 'TOTAL_EMITIDOS' ? 'Total Emitidos' : 'Votos Válidos'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="votos"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`pie-cell-${index}`} fill={COLORES[index % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} votos`, 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-1.5 pt-2 text-xs">
                  {chartData.map((item, idx) => (
                    <div key={item.name} className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: COLORES[idx % COLORES.length] }}
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="font-bold text-slate-800">{item.porcentaje}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Tabla Desglosada Oficial */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Acta de Resultados Electorales</CardTitle>
              <CardDescription className="text-xs">
                Cómputo final consolidado de la mesa institucional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Lista #</th>
                      <th className="py-2.5 px-3">Candidatura / Opción</th>
                      <th className="py-2.5 px-3 text-right">Votos Obtenidos</th>
                      <th className="py-2.5 px-3 text-right">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultado.conteo_partidos.partidos.map((partido) => (
                      <tr key={partido.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {partido.numero_lista}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{partido.nombre}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                          {partido.votos}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700">
                          {partido.porcentaje}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/80 font-bold">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">-</td>
                      <td className="py-2.5 px-3 text-slate-700">Voto en Blanco</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {resultado.conteo_partidos.votos_blanco}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {resultado.conteo_partidos.porcentaje_blanco}%
                      </td>
                    </tr>
                    <tr className="border-t-2 border-slate-300 font-black bg-slate-100/70">
                      <td className="py-3 px-3 text-slate-800" colSpan={2}>
                        TOTAL DE VOTOS EN URNA (INVARIANTE I14)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-900">
                        {resultado.total_votos_urna}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700">100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 4. Tarjeta de Integridad Criptográfica (Huella SHA-256) */}
          <Card className="bg-slate-900 text-white border-0 shadow-lg">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center space-x-2 text-blue-400">
                <Hash className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Huella Criptográfica SHA-256 Inmutable
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Esta huella fue calculada y congelada al momento de abrir la elección (ADR-008). Garantiza que ninguna
                regla, padrón o lista fue alterada durante el proceso de votación.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 break-all select-all">
                {eleccion.huella_sha256 || 'Huella no disponible (Elección en borrador)'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

