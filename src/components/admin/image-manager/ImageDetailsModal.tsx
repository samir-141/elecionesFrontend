import { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  X,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { ArchivoMedia } from '../../../types';
import { formatBytes } from '../../../lib/supabase/storage-config';
import { imageUpdateService } from '../../../services/images/image-update.service';

interface Props {
  media: ArchivoMedia | null;
  onClose: () => void;
  onUpdated: (updated: ArchivoMedia) => void;
}

export function ImageDetailsModal({ media, onClose, onUpdated }: Props) {
  const [copied, setCopied] = useState(false);
  const [altText, setAltText] = useState(media?.alt_text || '');
  const [savingMeta, setSavingMeta] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!media) return null;

  const urlMostrable = media.url_visualizacion || media.url_publica;

  const handleCopyUrl = async () => {
    if (!urlMostrable) return;
    await navigator.clipboard.writeText(urlMostrable);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAlt = async () => {
    try {
      setSavingMeta(true);
      setErrorMsg(null);
      const upd = await imageUpdateService.actualizarMetadatos(media.id, {
        alt_text: altText,
      });
      setSuccessMsg('Descripción actualizada.');
      onUpdated({ ...media, ...upd });
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo actualizar.');
    } finally {
      setSavingMeta(false);
    }
  };

  const handleReplaceFile = async (file: File | null) => {
    if (!file) return;
    try {
      setReplacing(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setReplaceProgress(10);
      const replaced = await imageUpdateService.reemplazarImagen(media.id, file, (pct) =>
        setReplaceProgress(pct),
      );
      setSuccessMsg('Archivo reemplazado exitosamente en Supabase Storage y entidades vinculadas.');
      onUpdated({ ...media, ...replaced });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al reemplazar archivo.');
    } finally {
      setReplacing(false);
      setReplaceProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="min-w-0 pr-4">
            <h3 className="text-base font-black text-slate-900 truncate">{media.nombre_original}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  media.es_privado
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {media.es_privado ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {media.es_privado ? 'Privado (URL Firmada)' : 'Público'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">{media.categoria}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Previsualización y reemplazo */}
          <div className="space-y-3">
            <div className="aspect-square bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden p-2">
              {urlMostrable ? (
                <img
                  src={urlMostrable}
                  alt={media.alt_text || media.nombre_original}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              ) : (
                <span className="text-xs text-slate-400 text-center px-4">
                  Previsualización no disponible (revisa configuración de Supabase Storage)
                </span>
              )}
            </div>

            {urlMostrable && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="w-full text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? 'URL Copiada al Portapapeles' : media.es_privado ? 'Copiar URL Firmada Temporal' : 'Copiar URL Pública'}
              </Button>
            )}

            <label className="flex items-center justify-center w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold cursor-pointer transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${replacing ? 'animate-spin' : ''}`} />
              {replacing ? `Reemplazando (${replaceProgress}%)...` : 'Reemplazar Archivo de Imagen'}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                disabled={replacing}
                onChange={(e) => handleReplaceFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Metadatos técnicos y uso */}
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">ID del Archivo</span>
                <span className="font-mono text-[11px] text-slate-900 break-all">{media.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Nombre Interno Único</span>
                <span className="font-mono text-[11px] text-slate-900 break-all">{media.nombre_interno}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Bucket</span>
                  <span className="font-mono font-bold text-slate-800">{media.bucket}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Tamaño / MIME</span>
                  <span className="font-mono text-slate-800">
                    {formatBytes(media.tamano_bytes)} • {media.mime_type}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Ruta en Storage</span>
                <span className="font-mono text-[11px] text-slate-800 break-all">{media.ruta_archivo}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Subido por</span>
                  <span className="font-bold text-slate-800">{media.subido_por}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Fecha</span>
                  <span className="text-slate-800">
                    {new Date(media.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Uso actual en entidades */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                Referencias en Base de Datos ({media.usado_en.length})
              </span>
              {media.usado_en.length === 0 ? (
                <span className="text-amber-700 font-semibold">
                  Sin uso actualmente (candidata a limpieza si no la necesitas).
                </span>
              ) : (
                <ul className="space-y-1">
                  {media.usado_en.map((u, idx) => (
                    <li key={idx} className="font-medium text-slate-800">
                      • {u.etiqueta}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Edición rápida de Alt Text */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-600 block">
                Texto Alternativo / Descripción
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  placeholder="Descripción accesible..."
                />
                <Button size="sm" onClick={handleSaveAlt} disabled={savingMeta} className="text-xs">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {savingMeta ? '...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

