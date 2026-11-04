import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Users, Copy, Check } from 'lucide-react';

interface Props {
  eleccionId: string;
  eleccionEstado: string;
  onImportarExitoso: () => void;
}

const CSV_EJEMPLO = `dni,nombres,apellidos,grado_seccion,aula_numero
70112233,Juan Carlos,Perez Gomez,5to A,1
70112234,Maria Elena,Rojas Quispe,5to A,1
70112235,Lucas Mateo,Castillo Vega,5to B,2
70112236,Sofia Nicole,Mendoza Rios,5to B,2`;

export function PadronImportador({ eleccionEstado, onImportarExitoso }: Props) {
  const [csvContent, setCsvContent] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLocked = eleccionEstado !== 'BORRADOR';

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(CSV_EJEMPLO);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string || '');
      setPreview(null);
      setSuccessMessage(null);
    };
    reader.readAsText(file);
  };

  const handlePrevisualizar = () => {
    if (!csvContent.trim()) return;

    // Validación local client-side rápida y transparente
    const lineas = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lineas.length <= 1) {
      alert('El archivo CSV debe contener una cabecera y al menos un elector.');
      return;
    }

    const separador = lineas[0].includes(';') ? ';' : ',';
    const validos: any[] = [];
    const errores: any[] = [];
    const dnis = new Set<string>();

    for (let i = 1; i < lineas.length; i++) {
      const col = lineas[i].split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (col.length < 5) {
        errores.push({ fila: i + 1, motivo: 'Columnas incompletas' });
        continue;
      }
      const [dni, nombres, apellidos, grado_seccion, aula_numero] = col;
      if (!dni || dni.length < 6) {
        errores.push({ fila: i + 1, dni, motivo: 'DNI inválido' });
        continue;
      }
      if (dnis.has(dni)) {
        errores.push({ fila: i + 1, dni, motivo: 'DNI duplicado en el archivo' });
        continue;
      }
      dnis.add(dni);

      validos.push({
        dni,
        nombres,
        apellidos,
        grado_seccion,
        aula_numero: parseInt(aula_numero, 10) || 1,
      });
    }

    setPreview({
      total: lineas.length - 1,
      validos,
      errores,
      puede_importar: validos.length > 0 && errores.length === 0,
    });
  };

  const handleConfirmarImportacion = async () => {
    if (!preview || !preview.puede_importar) return;
    try {
      setImporting(true);
      // Guardar en el padrón local para pruebas y notificar
      const padronActual = JSON.parse(localStorage.getItem('padron_electores') || '[]');
      const nuevos = preview.validos.map((v: any, index: number) => ({
        id: `elector-${Date.now()}-${index}`,
        ...v,
        estado: 'PENDIENTE',
      }));
      localStorage.setItem('padron_electores', JSON.stringify([...padronActual, ...nuevos]));
      setSuccessMessage(`¡Éxito! Se importaron ${nuevos.length} electores al padrón electoral.`);
      setPreview(null);
      setCsvContent('');
      onImportarExitoso();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-800" />
              <CardTitle className="text-lg">Importación del Padrón Electoral (CSV)</CardTitle>
            </div>
            {isLocked && <Badge variant="default">Padrón Congelado</Badge>}
          </div>
          <CardDescription>
            Carga la lista oficial de estudiantes habilitados para votar. Formato requerido: <code>dni, nombres, apellidos, grado_seccion, aula_numero</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isLocked ? (
            <>
              {/* Opciones de Entrada de Archivo / Plantilla */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border rounded-lg text-xs">
                <span className="text-slate-600">
                  ¿No tienes el formato exacto? Copia la plantilla de ejemplo:
                </span>
                <Button variant="outline" size="sm" onClick={handleCopyTemplate} className="text-xs bg-white">
                  {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedTemplate ? 'Plantilla Copiada' : 'Copiar Plantilla CSV'}
                </Button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pegar contenido CSV o arrastrar archivo:
                </label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => {
                    setCsvContent(e.target.value);
                    setPreview(null);
                  }}
                  placeholder={CSV_EJEMPLO}
                  className="w-full font-mono text-xs p-3 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300"
                />

                <Button
                  onClick={handlePrevisualizar}
                  disabled={!csvContent.trim()}
                  size="sm"
                  className="bg-blue-900 text-white w-full sm:w-auto"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  Previsualizar y Validar
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4 bg-slate-100 rounded-lg text-slate-600 text-sm text-center">
              El padrón se encuentra <strong>congelado</strong> debido a que la elección ya fue abierta. No se admiten modificaciones.
            </div>
          )}

          {/* Vista Previa de Validación */}
          {preview && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Resumen de Validación del Archivo</h4>
                  <p className="text-xs text-slate-500">
                    Total filas: {preview.total} • Válidas: <span className="text-emerald-700 font-bold">{preview.validos.length}</span> • Errores: <span className="text-red-700 font-bold">{preview.errores.length}</span>
                  </p>
                </div>

                {preview.puede_importar ? (
                  <Button
                    onClick={handleConfirmarImportacion}
                    disabled={importing}
                    size="touch"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <UploadCloud className="w-5 h-5 mr-2" />
                    {importing ? 'Importando a BD...' : `Confirmar e Importar ${preview.validos.length} Electores`}
                  </Button>
                ) : (
                  <Badge variant="destructive" className="py-1 px-3">
                    Corrige los errores antes de importar
                  </Badge>
                )}
              </div>

              {/* Errores detectados */}
              {preview.errores.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
                  <div className="font-bold text-red-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                    Se encontraron {preview.errores.length} error(es) en el archivo:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-red-800">
                    {preview.errores.map((err: any, idx: number) => (
                      <li key={idx}>
                        Fila #{err.fila}: {err.motivo} {err.dni ? `(DNI: ${err.dni})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tabla de Muestra */}
              <div className="border rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">DNI</th>
                      <th className="py-2 px-3">Nombres y Apellidos</th>
                      <th className="py-2 px-3">Grado / Sección</th>
                      <th className="py-2 px-3">Aula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {preview.validos.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono">{row.dni}</td>
                        <td className="py-2 px-3">{row.apellidos}, {row.nombres}</td>
                        <td className="py-2 px-3">{row.grado_seccion}</td>
                        <td className="py-2 px-3 font-semibold text-blue-900">Aula #{row.aula_numero}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
