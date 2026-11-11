import React, { useState, useEffect } from 'react';
import { UploadCloud, X, AlertTriangle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { ArchivoMedia, MediaCategoria } from '../../../types';
import {
  formatBytes,
  MAX_IMAGE_SIZE_BYTES,
  MEDIA_CATEGORY_LIST,
} from '../../../lib/supabase/storage-config';
import { imageUploadService } from '../../../services/images/image-upload.service';
import { validateImageFileClient } from '../../../services/images/image-validation.service';

interface Props {
  isOpen: boolean;
  defaultCategoria?: MediaCategoria;
  lockCategoria?: boolean;
  eleccionId?: string;
  entidadTipo?: string;
  entidadId?: string;
  tituloModal?: string;
  onClose: () => void;
  onSuccess: (media: ArchivoMedia) => void;
}

export function ImageUploadModal({
  isOpen,
  defaultCategoria = 'listas',
  lockCategoria = false,
  eleccionId,
  entidadTipo,
  entidadId,
  tituloModal = 'Subir Nueva Imagen a Supabase Storage',
  onClose,
  onSuccess,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<MediaCategoria>(defaultCategoria);
  const [altText, setAltText] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setCategoria(defaultCategoria);
  }, [defaultCategoria, isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = async (file: File | null) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setProgress(0);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const check = await validateImageFileClient(file);
    if (!check.valid) {
      setSelectedFile(null);
      setErrorMsg(check.error || 'Archivo no válido.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Selecciona una imagen válida para continuar.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg(null);
      setProgress(5);

      const uploaded = await imageUploadService.uploadAdminImage({
        file: selectedFile,
        categoria,
        eleccionId,
        entidadTipo,
        entidadId,
        altText: altText.trim() || undefined,
        onProgress: (pct) => setProgress(pct),
      });

      setSuccessMsg(`Imagen "${uploaded.nombre_original}" subida y registrada correctamente.`);
      onSuccess(uploaded);
      setSelectedFile(null);
      setAltText('');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setProgress(0);
      }, 700);
    } catch (err: any) {
      setProgress(0);
      setErrorMsg(err.message || 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const categoriaMeta = MEDIA_CATEGORY_LIST.find((c) => c.id === categoria);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{tituloModal}</h3>
              <p className="text-xs text-slate-500">
                Formatos seguros: JPG, PNG, WEBP o SVG sanitizado (Máx. {formatBytes(MAX_IMAGE_SIZE_BYTES)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Selector de archivo con previsualización */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Archivo de Imagen *
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 bg-slate-50/70 hover:bg-blue-50/30 cursor-pointer transition-colors">
              {previewUrl ? (
                <div className="flex flex-col items-center space-y-2">
                  <img
                    src={previewUrl}
                    alt="Previsualización local"
                    className="max-h-40 rounded-xl border border-slate-200 shadow-xs object-contain bg-white p-1"
                  />
                  <div className="text-xs font-bold text-slate-800">{selectedFile?.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {selectedFile ? formatBytes(selectedFile.size) : ''} • Clic para cambiar
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="w-9 h-9 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    Haz clic para elegir o arrastra una imagen aquí
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Validación de firma binaria (magic bytes) y sanitización SVG activas
                  </div>
                </div>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Categoría / Bucket */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Categoría en Storage *
            </label>
            <select
              value={categoria}
              disabled={lockCategoria || uploading}
              onChange={(e) => setCategoria(e.target.value as MediaCategoria)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white disabled:bg-slate-100"
            >
              {MEDIA_CATEGORY_LIST.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.esPrivado ? 'Bucket Privado' : 'Bucket Público'})
                </option>
              ))}
            </select>
            {categoriaMeta && (
              <p className="text-[11px] text-slate-500 mt-1">
                {categoriaMeta.descripcion} → Bucket: <code className="font-mono">{categoriaMeta.bucket}</code>
              </p>
            )}
          </div>

          {/* Texto alternativo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción / Texto Alternativo (opcional)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={uploading}
              placeholder="Ej. Logotipo oficial Lista Innovación Escolar"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          {/* Barra de progreso real */}
          {(uploading || progress > 0) && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                <span>
                  {progress < 100
                    ? 'Subiendo a Supabase Storage y validando...'
                    : 'Procesando registro en PostgreSQL...'}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedFile || uploading}
              className="bg-blue-900 hover:bg-blue-950 text-white font-bold"
            >
              <UploadCloud className="w-4 h-4 mr-1.5" />
              {uploading ? 'Subiendo...' : 'Subir Imagen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

