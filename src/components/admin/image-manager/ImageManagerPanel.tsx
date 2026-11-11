import { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Globe,
  Building2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { ArchivoMedia, ConfiguracionInstitucional, MediaCategoria } from '../../../types';
import { formatBytes, MEDIA_CATEGORY_LIST } from '../../../lib/supabase/storage-config';
import {
  mediaDiagnosticService,
  SupabaseDiagnosticReport,
} from '../../../services/images/media-diagnostic.service';
import { imageUpdateService } from '../../../services/images/image-update.service';
import {
  imageDeleteService,
  ImageInUseConflictError,
} from '../../../services/images/image-delete.service';
import { SupabaseDiagnosticBanner } from './SupabaseDiagnosticBanner';
import { ImageUploadModal } from './ImageUploadModal';
import { ImageDetailsModal } from './ImageDetailsModal';

interface Props {
  eleccionId: string;
  onDataChanged?: () => void;
}

export function ImageManagerPanel({ eleccionId, onDataChanged }: Props) {
  const [diagnostico, setDiagnostico] = useState<SupabaseDiagnosticReport | null>(null);
  const [diagLoading, setDiagLoading] = useState(true);
  const [diagError, setDiagError] = useState<string | null>(null);

  const [items, setItems] = useState<ArchivoMedia[]>([]);
  const [resumen, setResumen] = useState({ total: 0, en_uso: 0, sin_uso: 0, total_bytes: 0 });
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [soloSinUso, setSoloSinUso] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDefaultCat, setUploadDefaultCat] = useState<MediaCategoria>('material-electoral');
  const [uploadEntidadTipo, setUploadEntidadTipo] = useState<string | undefined>(undefined);
  const [detalleMedia, setDetalleMedia] = useState<ArchivoMedia | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Confirmación de eliminación
  const [deleteTarget, setDeleteTarget] = useState<ArchivoMedia | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  // Identidad institucional pública
  const [instConfig, setInstConfig] = useState<ConfiguracionInstitucional>({
    clave: 'global',
    nombre_institucion: 'Municipio Estudiantil',
    subtitulo: 'Sistema Electoral Escolar',
    titulo_portada: 'Elecciones de Municipio Escolar 2026',
    logo_url: null,
    banner_url: null,
  });
  const [savingInst, setSavingInst] = useState(false);

  const cargarDiagnostico = async () => {
    try {
      setDiagLoading(true);
      setDiagError(null);
      const rep = await mediaDiagnosticService.ejecutarDiagnostico();
      setDiagnostico(rep);
    } catch (err: any) {
      setDiagError(err.message || 'Error al diagnosticar Supabase Storage.');
    } finally {
      setDiagLoading(false);
    }
  };

  const cargarImagenes = async () => {
    try {
      setLoadingList(true);
      setListError(null);
      const res = await imageUpdateService.listarImagenes({
        categoria: categoriaFiltro,
        soloSinUso,
        q: busqueda,
      });
      setItems(res.items);
      setResumen(res.resumen);
    } catch (err: any) {
      setListError(err.message || 'No se pudo cargar la galería.');
    } finally {
      setLoadingList(false);
    }
  };

  const cargarInstitucion = async () => {
    const pub = await imageUpdateService.obtenerInstitucionalPublica();
    if (pub?.institucion) {
      setInstConfig(pub.institucion);
    }
  };

  useEffect(() => {
    cargarDiagnostico();
    cargarInstitucion();
  }, []);

  useEffect(() => {
    cargarImagenes();
  }, [categoriaFiltro, soloSinUso]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cargarImagenes();
  };

  const handleCopyUrl = async (media: ArchivoMedia) => {
    const url = media.url_visualizacion || media.url_publica;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedId(media.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleConfirmDelete = async (forzar: boolean) => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await imageDeleteService.eliminarImagen(deleteTarget.id, forzar);
      setDeleteFeedback(`Imagen "${deleteTarget.nombre_original}" eliminada correctamente.`);
      setDeleteTarget(null);
      await cargarImagenes();
      await cargarInstitucion();
      onDataChanged?.();
    } catch (err: any) {
      if (err instanceof ImageInUseConflictError) {
        // Actualizar target para mostrar detalle y permitir confirmación forzada
        setDeleteTarget({
          ...deleteTarget,
          en_uso: true,
          usado_en: err.usadoEn,
        });
      } else {
        setListError(err.message || 'No se pudo eliminar la imagen.');
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleGuardarIdentidad = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingInst(true);
      const updated = await imageUpdateService.actualizarInstitucional({
        nombre_institucion: instConfig.nombre_institucion,
        subtitulo: instConfig.subtitulo,
        titulo_portada: instConfig.titulo_portada,
      });
      setInstConfig(updated);
      setDeleteFeedback('Identidad visual institucional actualizada.');
      onDataChanged?.();
    } catch (err: any) {
      setListError(err.message || 'No se pudo actualizar la identidad institucional.');
    } finally {
      setSavingInst(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Diagnóstico en Primera Ejecución y Estado de Conexión */}
      <SupabaseDiagnosticBanner
        report={diagnostico}
        loading={diagLoading}
        error={diagError}
        onRevalidar={cargarDiagnostico}
        onReportUpdated={setDiagnostico}
      />

      {deleteFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{deleteFeedback}</span>
          </div>
          <button onClick={() => setDeleteFeedback(null)} className="text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {listError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{listError}</span>
          </div>
          <button onClick={() => setListError(null)} className="text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Identidad Visual Institucional */}
      <Card className="border border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-800" />
              <div>
                <CardTitle className="text-base font-black text-slate-900">
                  Identidad Visual Institucional y Portada
                </CardTitle>
                <CardDescription className="text-xs">
                  Administra el escudo oficial (Navbar) y el banner de bienvenida del portal electoral
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {instConfig.logo_url ? (
                  <img src={instConfig.logo_url} alt="Escudo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900">Escudo / Logo Institucional</div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!diagnostico?.listoParaOperar}
                    onClick={() => {
                      setUploadDefaultCat('instituciones');
                      setUploadEntidadTipo('institucion_logo');
                      setUploadOpen(true);
                    }}
                    className="h-7 text-[11px] font-bold"
                  >
                    Subir Logo
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-20 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {instConfig.banner_url ? (
                  <img src={instConfig.banner_url} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900">Banner Portada</div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!diagnostico?.listoParaOperar}
                  onClick={() => {
                    setUploadDefaultCat('instituciones');
                    setUploadEntidadTipo('institucion_banner');
                    setUploadOpen(true);
                  }}
                  className="h-7 text-[11px] font-bold"
                >
                  Subir Banner
                </Button>
              </div>
            </div>

            <form onSubmit={handleGuardarIdentidad} className="space-y-2">
              <input
                type="text"
                value={instConfig.nombre_institucion}
                onChange={(e) => setInstConfig({ ...instConfig, nombre_institucion: e.target.value })}
                placeholder="Nombre Institución"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={instConfig.titulo_portada}
                  onChange={(e) => setInstConfig({ ...instConfig, titulo_portada: e.target.value })}
                  placeholder="Título Portada"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <Button type="submit" size="sm" disabled={savingInst} className="text-xs font-bold bg-blue-900">
                  {savingInst ? '...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* 3. Biblioteca Centralizada de Imágenes */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-black text-slate-900">
                Repositorio Central de Imágenes ({resumen.total})
              </CardTitle>
              <CardDescription className="text-xs">
                Almacenamiento usado: <strong>{formatBytes(resumen.total_bytes)}</strong> • En uso:{' '}
                <strong className="text-emerald-700">{resumen.en_uso}</strong> • Sin uso:{' '}
                <strong className="text-amber-700">{resumen.sin_uso}</strong>
              </CardDescription>
            </div>

            <Button
              size="sm"
              disabled={!diagnostico?.listoParaOperar}
              onClick={() => {
                setUploadDefaultCat(
                  categoriaFiltro !== 'todas' ? (categoriaFiltro as MediaCategoria) : 'material-electoral',
                );
                setUploadEntidadTipo(undefined);
                setUploadOpen(true);
              }}
              className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Subir Nueva Imagen
            </Button>
          </div>

          {/* Barra de Filtros */}
          <div className="pt-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoriaFiltro('todas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  categoriaFiltro === 'todas'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Todas
              </button>
              {MEDIA_CATEGORY_LIST.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaFiltro(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    categoriaFiltro === cat.id
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre original o descripción..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <Button type="submit" variant="outline" size="sm" className="text-xs">
                  Buscar
                </Button>
              </form>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloSinUso}
                  onChange={(e) => setSoloSinUso(e.target.checked)}
                  className="rounded border-slate-300 text-blue-900"
                />
                Mostrar solo imágenes sin uso ({resumen.sin_uso})
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loadingList ? (
            <div className="py-12 text-center text-xs text-slate-500">Cargando imágenes...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-600">No hay imágenes registradas en esta vista</div>
              <p className="text-xs max-w-md mx-auto">
                {diagnostico?.listoParaOperar
                  ? 'Sube una imagen con el botón superior o desde el gestor de partidos y candidatos.'
                  : 'Configura las credenciales de Supabase Storage en el diagnóstico superior para habilitar las cargas.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((media) => {
                const imgSrc = media.url_visualizacion || media.url_publica;
                return (
                  <div
                    key={media.id}
                    className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-40 bg-slate-100 relative flex items-center justify-center overflow-hidden p-2">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={media.alt_text || media.nombre_original}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}

                        <div className="absolute top-2 left-2 flex gap-1">
                          <span
                            className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs ${
                              media.es_privado
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-white/95 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {media.es_privado ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                            {media.es_privado ? 'Privado' : 'Público'}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${
                              media.en_uso
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {media.en_uso ? 'En uso' : 'Sin uso'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <div className="text-xs font-bold text-slate-900 truncate" title={media.nombre_original}>
                          {media.nombre_original}
                        </div>
                        <div className="text-[11px] text-slate-500 flex justify-between">
                          <span>{media.categoria}</span>
                          <span>{formatBytes(media.tamano_bytes)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetalleMedia(media)}
                        className="h-7 px-2 text-[11px] font-bold text-blue-800"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Ver / Editar
                      </Button>

                      <div className="flex items-center gap-1">
                        {imgSrc && (
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(media)}
                            title="Copiar URL"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                          >
                            {copiedId === media.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(media)}
                          title="Eliminar imagen"
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Subir Imagen */}
      <ImageUploadModal
        isOpen={uploadOpen}
        defaultCategoria={uploadDefaultCat}
        eleccionId={eleccionId}
        entidadTipo={uploadEntidadTipo}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          cargarImagenes();
          cargarInstitucion();
          onDataChanged?.();
        }}
      />

      {/* Modal Detalle y Reemplazo */}
      <ImageDetailsModal
        media={detalleMedia}
        onClose={() => setDetalleMedia(null)}
        onUpdated={(updated) => {
          setDetalleMedia(updated);
          cargarImagenes();
          cargarInstitucion();
          onDataChanged?.();
        }}
      />

      {/* Modal Confirmación Eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirmar Eliminación</h3>
                <p className="text-xs text-slate-500">Se eliminará de Supabase Storage y de PostgreSQL</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 mb-3">
              Archivo: <strong>{deleteTarget.nombre_original}</strong>
            </p>

            {deleteTarget.usado_en && deleteTarget.usado_en.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-4 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>¡Advertencia! Imagen actualmente en uso:</span>
                </div>
                <ul className="list-disc pl-4 text-[11px]">
                  {deleteTarget.usado_en.map((u, idx) => (
                    <li key={idx}>{u.etiqueta}</li>
                  ))}
                </ul>
                <p className="text-[11px]">
                  Si confirmas, se desvinculará automáticamente de esas entidades y la imagen dejará de mostrarse.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirmDelete(deleteTarget.usado_en.length > 0)}
                disabled={deleting}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs"
              >
                {deleting
                  ? 'Eliminando...'
                  : deleteTarget.usado_en.length > 0
                  ? 'Desvincular y Eliminar'
                  : 'Eliminar Imagen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

