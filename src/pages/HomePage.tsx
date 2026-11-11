import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Vote,
  School,
  Monitor,
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
  Users2,
  KeyRound,
  X,
  Search,
} from 'lucide-react';
import { eleccionApiService } from '../modules/admin/services/eleccion.service';
import { imageUpdateService } from '../services/images/image-update.service';
import { ConfiguracionInstitucional } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  const isAdmin = eleccionApiService.isAdminAuthenticated();
  const [showModalEncargados, setShowModalEncargados] = useState(false);
  const [institucion, setInstitucion] = useState<ConfiguracionInstitucional | null>(null);
  const [materialCampana, setMaterialCampana] = useState<
    Array<{ id: string; nombre_original: string; url_publica: string; alt_text: string | null }>
  >([]);

  useEffect(() => {
    imageUpdateService.obtenerInstitucionalPublica().then((res) => {
      if (res?.institucion) setInstitucion(res.institucion);
      if (res?.material_electoral) setMaterialCampana(res.material_electoral);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-3 sm:px-4">
      {/* Banner Principal Institucional */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-10 rounded-3xl shadow-xl text-center space-y-4">
        {institucion?.banner_url && (
          <img
            src={institucion.banner_url}
            alt={institucion.titulo_portada || 'Banner Electoral'}
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          />
        )}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 px-4 py-1.5 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Plataforma Cívica Escolar • Arquitectura Segura</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white max-w-2xl mx-auto">
            {institucion?.titulo_portada || 'Elecciones de Municipio Escolar 2026'}
          </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Sistema institucional de voto electrónico presencial con anonimato radical, urna digital de cuatro columnas y verificación criptográfica inmutable.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Voto Anónimo e Inmutable (I1, I2)
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Transacción Atómica en Urna I4
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Huella Criptográfica SHA-256
          </span>
        </div>
        </div>
      </div>

      {/* Selector Principal Simplificado: Solo 2 Opciones */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-slate-900">Selecciona el Modo de Acceso</h2>
          <p className="text-xs text-slate-500">Acceso exclusivo para emisión de votos o gestión por personal autorizado</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OPCIÓN 1: MESA DE VOTACIÓN (Antes Kiosco) */}
          <Card
            className="border-2 border-blue-200 hover:border-blue-600 transition-all shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between group overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white"
            onClick={() => navigate('/kiosco')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Vote className="w-7 h-7" />
                </div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-200">
                  Para Estudiantes
                </span>
              </div>
              <div className="pt-4">
                <div className="text-xs uppercase tracking-wider text-blue-700 font-extrabold">
                  Terminal de Sufragio Estudiantil
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                  Mesa de Votación
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <CardDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pantalla táctil aislada a pantalla completa para que los alumnos emitan su voto secreto con cédula barajada y opción en blanco.
              </CardDescription>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-blue-700 group-hover:text-blue-800">
                <span>Ingresar a Mesa de Votación</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* OPCIÓN 2: ENCARGADOS (NUEVO: DOCENTE O ADMINISTRADOR) */}
          <Card
            className="border-2 border-indigo-200 hover:border-indigo-600 transition-all shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between group overflow-hidden bg-gradient-to-b from-indigo-50/40 via-white to-white"
            onClick={() => setShowModalEncargados(true)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Users2 className="w-7 h-7" />
                </div>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-200">
                  Personal Autorizado
                </span>
              </div>
              <div className="pt-4">
                <div className="text-xs uppercase tracking-wider text-indigo-700 font-extrabold">
                  Supervisión y Control
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                  Encargados
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <CardDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Acceso con credenciales protegidas para <strong>Docentes de Aula</strong> (acreditación y mesas) y <strong>Administradores</strong> (configuración y escrutinio).
              </CardDescription>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-indigo-700 group-hover:text-indigo-800">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Seleccionar Docente o Administrador
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECCIÓN SEPARADA: LISTADO PÚBLICO (PANTALLA DE PUERTA / CONSULTA PADRÓN) */}
      <div className="pt-2">
        <div
          onClick={() => navigate('/puerta')}
          className="p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-400 bg-white shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-4 group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-700 flex items-center justify-center shrink-0 transition-colors">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  Consulta Pública de Padrón y Aulas
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  Acceso Público • Pantalla Puerta
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta en qué mesa y pabellón te corresponde votar buscando por DNI. No expone ningún dato del voto (Invariante I1).
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 group-hover:border-indigo-300 shrink-0"
          >
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Ver Padrón Público
          </Button>
        </div>
      </div>

      {/* Material Visual y Campaña Electoral (si el admin subió material-electoral) */}
      {materialCampana.length > 0 && (
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-base font-black text-slate-900">Material Informativo y Campaña Electoral</h3>
            <p className="text-xs text-slate-500">Información visual oficial del proceso democrático estudiantil</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {materialCampana.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <div className="h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={m.url_publica}
                    alt={m.alt_text || m.nombre_original}
                    className="w-full h-full object-cover"
                  />
                </div>
                {(m.alt_text || m.nombre_original) && (
                  <div className="p-3 text-xs font-semibold text-slate-700 truncate">
                    {m.alt_text || m.nombre_original}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: SELECCIONAR ENCARGADO (DOCENTE O ADMINISTRADOR) */}
      {showModalEncargados && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white shadow-2xl animate-in fade-in zoom-in-95 border-2 border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  <CardTitle className="text-lg font-black text-white">
                    Acceso para Encargados
                  </CardTitle>
                </div>
                <button
                  onClick={() => setShowModalEncargados(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-indigo-200 mt-1">
                Selecciona tu rol electoral autorizado para ingresar a tu panel correspondiente
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Opción A: Docente de Mesa */}
              <div
                onClick={() => {
                  setShowModalEncargados(false);
                  navigate('/docente');
                }}
                className="p-4 rounded-xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/80 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">Docente de Mesa / Aula</h4>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        2FA TOTP
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Acreditación de electores, escaneo de DNI con cámara y supervisión de puestos de su salón.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-700 group-hover:translate-x-1 transition-transform shrink-0 ml-3" />
              </div>

              {/* Opción B: Administrador Electoral */}
              <div
                onClick={() => {
                  setShowModalEncargados(false);
                  navigate(isAdmin ? '/admin' : '/admin/login');
                }}
                className="p-4 rounded-xl border-2 border-slate-300 hover:border-slate-800 bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">Administrador Electoral</h4>
                      <span className="text-[10px] font-mono bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                        {isAdmin ? 'Sesión Activa' : 'Protegido'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Ciclo de vida electoral, configuración de mesas, padrón CSV, auditoría y cómputo oficial.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-700 group-hover:translate-x-1 transition-transform shrink-0 ml-3" />
              </div>

              <div className="pt-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModalEncargados(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar y volver al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

