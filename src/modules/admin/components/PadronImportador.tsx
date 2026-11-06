import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Users,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Search,
  RefreshCw,
  Lock,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Aula } from '../../../types';
import { eleccionApiService } from '../services/eleccion.service';

interface Props {
  eleccionId: string;
  eleccionEstado: string;
  aulas?: Aula[];
  onImportarExitoso: () => void;
}

interface ElectorFilaValida {
  dni: string;
  nombres: string;
  apellidos: string;
  grado_seccion: string;
  aula_numero: number;
}

interface ErrorFila {
  fila: number;
  dni?: string;
  motivo: string;
}

const CSV_EJEMPLO = `dni,nombres,apellidos,grado_seccion,aula_numero
70112231,Juan Carlos,Pérez Gómez,5to A,1
70112232,María Elena,Rojas Quispe,5to A,1
70112233,Lucas Mateo,Castillo Vega,5to B,2
70112234,Sofía Nicole,Mendoza Ríos,5to B,2
70112235,Alexander,Huamán Castro,4to A,1`;

export function PadronImportador({ eleccionId, eleccionEstado, aulas = [], onImportarExitoso }: Props) {
  // Estados para Carga e Importación
  const [csvContent, setCsvContent] = useState('');
  const [mostrarTextarea, setMostrarTextarea] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Estados de Validación y Previsualización
  const [preview, setPreview] = useState<{
    total: number;
    validos: ElectorFilaValida[];
    errores: ErrorFila[];
    puede_importar: boolean;
    nombreArchivo?: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados para Consulta y Exploración del Padrón Registrado
  const [padronRegistrado, setPadronRegistrado] = useState<any[]>([]);
  const [totalPadron, setTotalPadron] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [cargandoPadron, setCargandoPadron] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLocked = eleccionEstado !== 'BORRADOR';

  // Cargar Padrón Registrado desde la BD
  const cargarPadronRegistrado = useCallback(async (pag = 1, query = busqueda) => {
    try {
      setCargandoPadron(true);
      const data = await eleccionApiService.obtenerPadron(eleccionId, pag, 15, query);
      setPadronRegistrado(data.electores || []);
      setTotalPadron(data.total || 0);
      setPaginaActual(data.pagina || 1);
      setTotalPaginas(data.total_paginas || 1);
    } catch (err) {
      console.error('Error al cargar padrón registrado:', err);
    } finally {
      setCargandoPadron(false);
    }
  }, [eleccionId, busqueda]);

  useEffect(() => {
    cargarPadronRegistrado(1, busqueda);
  }, [eleccionId, busqueda, cargarPadronRegistrado]);

  // 1. Descargar Plantilla Oficial Excel (.xlsx)
  const handleDescargarPlantillaExcel = () => {
    const filasEjemplo = [
      {
        dni: '70112231',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez Gómez',
        grado_seccion: '5to A',
        aula_numero: aulas.length > 0 ? aulas[0].numero : 1,
      },
      {
        dni: '70112232',
        nombres: 'María Elena',
        apellidos: 'Rojas Quispe',
        grado_seccion: '5to A',
        aula_numero: aulas.length > 0 ? aulas[0].numero : 1,
      },
      {
        dni: '70112233',
        nombres: 'Lucas Mateo',
        apellidos: 'Castillo Vega',
        grado_seccion: '5to B',
        aula_numero: aulas.length > 1 ? aulas[1].numero : 2,
      },
      {
        dni: '70112234',
        nombres: 'Sofía Nicole',
        apellidos: 'Mendoza Ríos',
        grado_seccion: '5to B',
        aula_numero: aulas.length > 1 ? aulas[1].numero : 2,
      },
      {
        dni: '70112235',
        nombres: 'Alexander',
        apellidos: 'Huamán Castro',
        grado_seccion: '4to A',
        aula_numero: aulas.length > 0 ? aulas[0].numero : 1,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(filasEjemplo, {
      header: ['dni', 'nombres', 'apellidos', 'grado_seccion', 'aula_numero'],
    });

    // Ancho de columnas óptimo
    ws['!cols'] = [
      { wch: 14 }, // dni
      { wch: 22 }, // nombres
      { wch: 24 }, // apellidos
      { wch: 16 }, // grado_seccion
      { wch: 14 }, // aula_numero
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Padrón_Electoral');
    XLSX.writeFile(wb, 'plantilla_oficial_padron_electoral.xlsx');
  };

  // 2. Descargar Plantilla CSV
  const handleDescargarPlantillaCsv = () => {
    const blob = new Blob([CSV_EJEMPLO], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_padron_electoral.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Copiar al Portapapeles
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(CSV_EJEMPLO);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // 4. Exportar Padrón Registrado Actual a Excel
  const handleExportarPadronExcel = async () => {
    try {
      setExportandoExcel(true);
      const todos = await eleccionApiService.obtenerTodosElectores(eleccionId);
      if (!todos || todos.length === 0) {
        alert('No hay electores registrados para exportar.');
        return;
      }

      const filas = todos.map((e: any) => ({
        DNI: e.dni,
        NOMBRES: e.nombres,
        APELLIDOS: e.apellidos,
        GRADO_SECCION: e.grado_seccion,
        NUMERO_AULA: e.aula?.numero || e.aula_numero || 1,
        NOMBRE_AULA: e.aula?.nombre || `Mesa #${e.aula_numero || 1}`,
        ESTADO_VOTO: e.estado || 'PENDIENTE',
      }));

      const ws = XLSX.utils.json_to_sheet(filas);
      ws['!cols'] = [
        { wch: 14 },
        { wch: 22 },
        { wch: 24 },
        { wch: 16 },
        { wch: 14 },
        { wch: 26 },
        { wch: 14 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Padron_Registrado');
      XLSX.writeFile(wb, `padron_electoral_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      alert('Error al exportar padrón a Excel: ' + (err.message || 'Error desconocido'));
    } finally {
      setExportandoExcel(false);
    }
  };

  // Función Normalizadora Inteligente de Filas (acepta variaciones de encabezado)
  const normalizarFilaObjeto = (rawRow: Record<string, any>): Partial<ElectorFilaValida> => {
    const row: Partial<ElectorFilaValida> = {};

    for (const key of Object.keys(rawRow)) {
      const cleanKey = key
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_');

      const val = rawRow[key];
      if (val === undefined || val === null || val === '') continue;

      if (cleanKey.includes('dni') || cleanKey.includes('doc') || cleanKey.includes('cedula')) {
        row.dni = String(val).trim();
      } else if (cleanKey.includes('nom')) {
        row.nombres = String(val).trim();
      } else if (cleanKey.includes('ape')) {
        row.apellidos = String(val).trim();
      } else if (
        cleanKey.includes('grad') ||
        cleanKey.includes('secc') ||
        cleanKey.includes('nivel') ||
        cleanKey.includes('curs')
      ) {
        row.grado_seccion = String(val).trim();
      } else if (
        cleanKey.includes('aul') ||
        cleanKey.includes('mes') ||
        cleanKey.includes('sal')
      ) {
        row.aula_numero = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10);
      }
    }

    return row;
  };

  // Validación Exhaustiva de Filas
  const validarFilas = (filasNormalizadas: Partial<ElectorFilaValida>[], nombreArchivo?: string) => {
    const validos: ElectorFilaValida[] = [];
    const errores: ErrorFila[] = [];
    const dnisVistos = new Set<string>();

    const mapaAulasValidas = new Set<number>();
    if (aulas && aulas.length > 0) {
      aulas.forEach((a) => mapaAulasValidas.add(a.numero));
    }

    filasNormalizadas.forEach((fila, index) => {
      const numFila = index + 2; // +2 considerando encabezado
      const dni = fila.dni ? String(fila.dni).trim() : '';
      const nombres = fila.nombres ? String(fila.nombres).trim() : '';
      const apellidos = fila.apellidos ? String(fila.apellidos).trim() : '';
      const gradoSeccion = fila.grado_seccion ? String(fila.grado_seccion).trim() : 'General';
      const aulaNumero = fila.aula_numero;

      if (!dni || dni.length < 6 || dni.length > 15) {
        errores.push({
          fila: numFila,
          dni: dni || '(vacío)',
          motivo: 'DNI inválido (debe tener entre 6 y 15 dígitos/caracteres).',
        });
        return;
      }

      if (dnisVistos.has(dni)) {
        errores.push({
          fila: numFila,
          dni,
          motivo: 'DNI duplicado dentro del mismo documento.',
        });
        return;
      }
      dnisVistos.add(dni);

      if (!nombres || !apellidos) {
        errores.push({
          fila: numFila,
          dni,
          motivo: 'Faltan nombres o apellidos del estudiante.',
        });
        return;
      }

      if (aulaNumero === undefined || isNaN(aulaNumero) || aulaNumero <= 0) {
        errores.push({
          fila: numFila,
          dni,
          motivo: 'Número de aula no especificado o inválido.',
        });
        return;
      }

      // Si tenemos aulas configuradas en la elección, verificar coincidencia
      if (mapaAulasValidas.size > 0 && !mapaAulasValidas.has(aulaNumero)) {
        errores.push({
          fila: numFila,
          dni,
          motivo: `El Aula #${aulaNumero} no existe en esta elección. Aulas configuradas: [${Array.from(mapaAulasValidas).join(', ')}].`,
        });
        return;
      }

      validos.push({
        dni,
        nombres,
        apellidos,
        grado_seccion: gradoSeccion,
        aula_numero: aulaNumero,
      });
    });

    setPreview({
      total: filasNormalizadas.length,
      validos,
      errores,
      puede_importar: validos.length > 0 && errores.length === 0,
      nombreArchivo,
    });
  };

  // Procesar archivo seleccionado (Excel o CSV)
  const procesarArchivo = (file: File) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setArchivoSeleccionado(file.name);

    const fileNameLower = file.name.toLowerCase();
    const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            setErrorMessage('El archivo Excel no contiene ninguna hoja de datos.');
            return;
          }
          const sheet = workbook.Sheets[firstSheetName];
          const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            setErrorMessage('La hoja de cálculo está vacía o no tiene filas válidas.');
            return;
          }

          const filasNormalizadas = rawRows.map(normalizarFilaObjeto);
          validarFilas(filasNormalizadas, file.name);
        } catch (err: any) {
          console.error('Error al parsear Excel:', err);
          setErrorMessage('No se pudo procesar el archivo Excel. Verifica el formato del archivo.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Es archivo de texto / CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        setCsvContent(text);
        procesarTextoPlanoCsv(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  // Procesar contenido CSV en texto
  const procesarTextoPlanoCsv = (texto: string, nombreArchivo = 'Entrada de Texto') => {
    const lineas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lineas.length <= 1) {
      setErrorMessage('El contenido CSV debe tener una cabecera y al menos un elector.');
      setPreview(null);
      return;
    }

    const separador = lineas[0].includes(';') ? ';' : lineas[0].includes('\t') ? '\t' : ',';
    const cabeceras = lineas[0].split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    const filasNormalizadas: Partial<ElectorFilaValida>[] = [];

    for (let i = 1; i < lineas.length; i++) {
      const celdas = lineas[i].split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const objFila: Record<string, any> = {};

      cabeceras.forEach((cab, idx) => {
        objFila[cab] = celdas[idx] !== undefined ? celdas[idx] : '';
      });

      // Si la cabecera era estándar (5 columnas posicionales)
      if (celdas.length >= 5 && (!objFila.dni || !objFila.nombres)) {
        objFila.dni = celdas[0];
        objFila.nombres = celdas[1];
        objFila.apellidos = celdas[2];
        objFila.grado_seccion = celdas[3];
        objFila.aula_numero = celdas[4];
      }

      filasNormalizadas.push(normalizarFilaObjeto(objFila));
    }

    validarFilas(filasNormalizadas, nombreArchivo);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivo(file);
  };

  // Confirmar e Importar al Backend y Base de Datos
  const handleConfirmarImportacion = async () => {
    if (!preview || !preview.puede_importar) return;
    try {
      setImporting(true);
      setErrorMessage(null);

      const res = await eleccionApiService.confirmarPadron(eleccionId, preview.validos);

      setSuccessMessage(
        `¡Padrón importado con éxito! Se registraron ${res.total_registrados || preview.validos.length} electores en la base de datos oficial.`,
      );
      setPreview(null);
      setCsvContent('');
      setArchivoSeleccionado(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Recargar padrón registrado en la tabla
      await cargarPadronRegistrado(1);
      onImportarExitoso();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al persistir el padrón en la base de datos.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TARJETA 1: ESTRUCTURA OFICIAL Y DESCARGA (SIEMPRE DISPONIBLE) */}
      <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-900 text-white rounded-lg shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Estructura y Plantilla Oficial del Padrón
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Descarga la estructura oficial para preparar o auditar la lista de electores institucional.
                </CardDescription>
              </div>
            </div>

            {/* Badges de Estado */}
            <div>
              {isLocked ? (
                <Badge variant="default" className="bg-amber-600 text-white flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Padrón Congelado ({eleccionEstado})
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500 text-emerald-800 bg-emerald-50">
                  Listo para Cargar (Borrador)
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Fila de Botones de Descarga de Estructura */}
          <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <Button
              onClick={handleDescargarPlantillaExcel}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Descargar Plantilla Oficial Excel (.xlsx)
            </Button>

            <Button
              onClick={handleDescargarPlantillaCsv}
              variant="outline"
              className="border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              <FileDown className="w-4 h-4 mr-1.5 text-blue-700" />
              Descargar Plantilla CSV (.csv)
            </Button>

            <Button
              onClick={handleCopyTemplate}
              variant="outline"
              className="border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              {copiedTemplate ? (
                <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 mr-1.5 text-slate-500" />
              )}
              {copiedTemplate ? 'Formato Copiado' : 'Copiar Formato'}
            </Button>
          </div>

          {/* Guía Rápida de la Estructura de Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
            <div className="p-2 bg-white rounded border border-slate-100">
              <span className="font-bold text-blue-900 block font-mono">1. dni</span>
              <span className="text-[11px] text-slate-500">Documento de identidad único (ej. 70112233)</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-100">
              <span className="font-bold text-blue-900 block font-mono">2. nombres</span>
              <span className="text-[11px] text-slate-500">Nombres del estudiante (ej. Juan Carlos)</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-100">
              <span className="font-bold text-blue-900 block font-mono">3. apellidos</span>
              <span className="text-[11px] text-slate-500">Apellidos completos (ej. Pérez Gómez)</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-100">
              <span className="font-bold text-blue-900 block font-mono">4. grado_seccion</span>
              <span className="text-[11px] text-slate-500">Grado y sección (ej. 5to A, 4to B)</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-100">
              <span className="font-bold text-blue-900 block font-mono">5. aula_numero</span>
              <span className="text-[11px] text-slate-500">
                Número de mesa/aula asignada {aulas.length > 0 ? `(ej. ${aulas.map((a) => a.numero).join(', ')})` : '(ej. 1, 2)'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MENSAJES DE ESTADO */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-sm flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* TARJETA 2: IMPORTACIÓN (SOLO ACTIVA CUANDO ESTÁ EN BORRADOR) */}
      {!isLocked ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-blue-800" />
              <CardTitle className="text-base font-bold text-slate-900">
                Carga de Archivo Excel (.xlsx, .xls) o CSV
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Selecciona o arrastra tu archivo con el padrón electoral. El sistema validará automáticamente cada fila antes de importar.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Zona Dropzone para arrastrar y soltar */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/70 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-full">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {archivoSeleccionado ? (
                    <span className="text-blue-900">Archivo seleccionado: {archivoSeleccionado}</span>
                  ) : (
                    <span>Arrastra tu archivo aquí o haz clic para explorar</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Formatos compatibles: Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) o Padrón <strong>.csv</strong>
                </p>
              </div>
            </div>

            {/* Alternativa: Pegar CSV directamente */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setMostrarTextarea(!mostrarTextarea)}
                className="text-xs text-blue-800 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                {mostrarTextarea ? 'Ocultar entrada de texto directo' : '¿Prefieres pegar texto CSV directamente? Haz clic aquí'}
              </button>
            </div>

            {mostrarTextarea && (
              <div className="space-y-2 pt-2">
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={(e) => {
                    setCsvContent(e.target.value);
                    setPreview(null);
                  }}
                  placeholder={CSV_EJEMPLO}
                  className="w-full font-mono text-xs p-3 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                />
                <Button
                  onClick={() => procesarTextoPlanoCsv(csvContent)}
                  disabled={!csvContent.trim()}
                  size="sm"
                  className="bg-blue-900 text-white text-xs"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Validar Texto Pegado
                </Button>
              </div>
            )}

            {/* Vista Previa y Resumen de Validación */}
            {preview && (
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Resultado de Validación: {preview.nombreArchivo || 'Archivo'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Total procesados: <span className="font-bold">{preview.total}</span> • Válidos:{' '}
                      <span className="text-emerald-700 font-bold">{preview.validos.length}</span> • Errores:{' '}
                      <span className={preview.errores.length > 0 ? 'text-red-700 font-bold' : 'text-slate-500'}>
                        {preview.errores.length}
                      </span>
                    </p>
                  </div>

                  {preview.puede_importar ? (
                    <Button
                      onClick={handleConfirmarImportacion}
                      disabled={importing}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 text-xs shadow-md"
                    >
                      <UploadCloud className="w-4 h-4 mr-2" />
                      {importing
                        ? 'Guardando en Base de Datos...'
                        : `Confirmar e Importar ${preview.validos.length} Electores`}
                    </Button>
                  ) : (
                    <Badge variant="destructive" className="py-1 px-3 text-xs">
                      Corrige los errores antes de importar
                    </Badge>
                  )}
                </div>

                {/* Lista de Errores detectados */}
                {preview.errores.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2">
                    <div className="font-bold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-700" />
                      Se encontraron {preview.errores.length} error(es) en el documento:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-red-800 max-h-48 overflow-y-auto font-mono text-[11px]">
                      {preview.errores.map((err, idx) => (
                        <li key={idx}>
                          Fila #{err.fila}: {err.motivo} {err.dni ? `(DNI: ${err.dni})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tabla de Muestra con los Electores Válidos */}
                {preview.validos.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Vista previa de datos (mostrando los primeros {Math.min(10, preview.validos.length)}):</span>
                      <span className="text-slate-500 font-normal">Asegúrate de que los campos coincidan con la columna correcta</span>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60 overflow-y-auto bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0">
                          <tr>
                            <th className="py-2 px-3">DNI</th>
                            <th className="py-2 px-3">Estudiante (Apellidos y Nombres)</th>
                            <th className="py-2 px-3">Grado / Sección</th>
                            <th className="py-2 px-3">Aula / Mesa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {preview.validos.slice(0, 10).map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{row.dni}</td>
                              <td className="py-2 px-3">
                                {row.apellidos}, {row.nombres}
                              </td>
                              <td className="py-2 px-3">{row.grado_seccion}</td>
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                                  Mesa #{row.aula_numero}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Aviso de Inmutabilidad cuando la Elección está Abierta o Cerrada */
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Padrón Congelado por Proceso Activo</span>
            <p className="mt-0.5 text-amber-800">
              La elección actual se encuentra en estado <strong>{eleccionEstado}</strong> y su padrón está sellado
              criptográficamente mediante huella digital SHA-256. Por principios de integridad y transparencia democrática,
              no se admiten modificaciones ni nuevas importaciones mientras la votación esté en curso.
            </p>
            <p className="mt-1 text-amber-700 font-medium">
              Puedes descargar la plantilla oficial en Excel arriba para preparar futuras elecciones, o exportar el padrón
              registrado a continuación.
            </p>
          </div>
        </div>
      )}

      {/* TARJETA 3: PADRÓN ELECTORAL REGISTRADO EN ESTA ELECCIÓN */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-900" />
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Padrón Electoral Registrado ({totalPadron} Electores)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Lista oficial de electores habilitados en la base de datos para este proceso.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportarPadronExcel}
                disabled={exportandoExcel || totalPadron === 0}
                className="text-xs bg-white text-emerald-800 hover:bg-emerald-50 border-emerald-300 font-semibold"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {exportandoExcel ? 'Generando Excel...' : 'Exportar Padrón a Excel (.xlsx)'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => cargarPadronRegistrado(paginaActual)}
                disabled={cargandoPadron}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${cargandoPadron ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Buscador de Estudiantes */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar elector por DNI, nombres, apellidos o grado..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Tabla de Electores Registrados */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">DNI</th>
                  <th className="py-2.5 px-3">Estudiante (Apellidos y Nombres)</th>
                  <th className="py-2.5 px-3">Grado / Sección</th>
                  <th className="py-2.5 px-3">Mesa / Aula Asignada</th>
                  <th className="py-2.5 px-3 text-center">Estado de Voto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {cargandoPadron ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-900" />
                      Cargando padrón electoral...
                    </td>
                  </tr>
                ) : padronRegistrado.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No se encontraron electores en esta elección.
                      {!isLocked && ' Carga un archivo Excel o CSV arriba para agregar electores.'}
                    </td>
                  </tr>
                ) : (
                  padronRegistrado.map((elector: any) => (
                    <tr key={elector.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{elector.dni}</td>
                      <td className="py-2.5 px-3 font-medium">
                        {elector.apellidos}, {elector.nombres}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{elector.grado_seccion}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-blue-900">
                          {elector.aula?.nombre || `Mesa #${elector.aula?.numero || elector.aula_numero || 1}`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            elector.estado === 'VOTO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : elector.estado === 'HABILITADO'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {elector.estado === 'VOTO'
                            ? 'Votó'
                            : elector.estado === 'HABILITADO'
                            ? 'En Cabina'
                            : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>
                Página {paginaActual} de {totalPaginas} ({totalPadron} electores en total)
              </span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaActual <= 1}
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaActual >= totalPaginas}
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
