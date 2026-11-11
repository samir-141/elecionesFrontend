import { MediaCategoria } from '../../types';

export interface MediaCategoryMeta {
  id: MediaCategoria;
  label: string;
  descripcion: string;
  esPrivado: boolean;
  bucket: string;
}

export const SUPABASE_PUBLIC_BUCKET = 'elecciones-media';
export const SUPABASE_PRIVATE_BUCKET = 'elecciones-privado';
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'] as const;

export const MEDIA_CATEGORY_LIST: MediaCategoryMeta[] = [
  {
    id: 'listas',
    label: 'Listas / Partidos',
    descripcion: 'Logotipos oficiales mostrados en la cédula de votación y listados.',
    esPrivado: false,
    bucket: SUPABASE_PUBLIC_BUCKET,
  },
  {
    id: 'candidatos',
    label: 'Candidatos',
    descripcion: 'Fotografías oficiales de los estudiantes postulantes por lista.',
    esPrivado: false,
    bucket: SUPABASE_PUBLIC_BUCKET,
  },
  {
    id: 'instituciones',
    label: 'Institución',
    descripcion: 'Escudo escolar, insignia institucional y banners principales.',
    esPrivado: false,
    bucket: SUPABASE_PUBLIC_BUCKET,
  },
  {
    id: 'organizaciones',
    label: 'Organizaciones',
    descripcion: 'Emblemas de agrupaciones o comités estudiantiles.',
    esPrivado: false,
    bucket: SUPABASE_PUBLIC_BUCKET,
  },
  {
    id: 'material-electoral',
    label: 'Material Electoral',
    descripcion: 'Afiches informativos, banners de campaña e instructivos visuales.',
    esPrivado: false,
    bucket: SUPABASE_PUBLIC_BUCKET,
  },
  {
    id: 'usuarios',
    label: 'Usuarios (Privado)',
    descripcion: 'Fotos de perfil de encargados/docentes protegidas mediante URL firmada.',
    esPrivado: true,
    bucket: SUPABASE_PRIVATE_BUCKET,
  },
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

