import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Vote, School, Monitor, ShieldCheck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { eleccionApiService } from '../modules/admin/services/eleccion.service';

export function HomePage() {
  const navigate = useNavigate();
  const isAdmin = eleccionApiService.isAdminAuthenticated();

  const modulos = [
    {
      titulo: 'Kiosco de Votación',
      subtitulo: 'Para Estudiantes (Electores)',
      descripcion: 'Terminal táctil tipo kiosco para emisión de voto secreto con cédula barajada y opción en blanco.',
      icono: Vote,
      color: 'bg-blue-600',
      borde: 'border-blue-200 hover:border-blue-500',
      ruta: '/kiosco',
      badge: 'Voto Anónimo I1-I19',
    },
    {
      titulo: 'Docente de Aula',
      subtitulo: 'Control de Identidad y Puestos',
      descripcion: 'Interfaz mobile-first para escaneo de DNI con cámara, verificación física y asignación atómica.',
      icono: School,
      color: 'bg-emerald-600',
      borde: 'border-emerald-200 hover:border-emerald-500',
      ruta: '/docente',
      badge: '2FA TOTP + QR',
    },
    {
      titulo: 'Pantalla de Puerta',
      subtitulo: 'Proyección Pública para TV/Monitor',
      descripcion: 'Visualización informativa en la entrada de las aulas. Muestra padrón y ubicación con anonimato I1.',
      icono: Monitor,
      color: 'bg-indigo-600',
      borde: 'border-indigo-200 hover:border-indigo-500',
      ruta: '/puerta',
      badge: 'Pública • Cero Datos de Voto',
    },
    {
      titulo: 'Panel de Administración',
      subtitulo: 'Gestión Integral Electoral',
      descripcion: 'Control de ciclo de vida, configuración de reglas, padrón CSV, congelamiento SHA-256 y escrutinio.',
      icono: ShieldCheck,
      color: 'bg-slate-900',
      borde: 'border-slate-300 hover:border-slate-700',
      ruta: isAdmin ? '/admin' : '/admin/login',
      badge: isAdmin ? 'Sesión Activa' : 'Protegido con Login',
      requiereLogin: !isAdmin,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-3 sm:px-4">
      {/* Banner Principal Institucional */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-10 rounded-3xl shadow-xl text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 px-4 py-1.5 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Plataforma Cívica Escolar • Arquitectura Segura</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white max-w-2xl mx-auto">
          Elecciones de Municipio Escolar 2026
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Sistema institucional de voto electrónico presencial con anonimato radical, urna de cuatro columnas,
          reserva atómica con bloqueo de filas y verificación criptográfica inmutable.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Anonimato Radical (I1, I2)
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Transacción Atómica I4
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Huella SHA-256 (ADR-008)
          </span>
        </div>
      </div>

      {/* Selector de Experiencia / Módulos por Rol */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-lg font-black text-slate-900">Selecciona el Módulo de Operación</h2>
          <p className="text-xs text-slate-500">Cada rol cuenta con una interfaz especializada e independiente</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modulos.map((m) => {
            const Icono = m.icono;
            return (
              <Card
                key={m.titulo}
                className={`border-2 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between ${m.borde}`}
                onClick={() => navigate(m.ruta)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${m.color} text-white flex items-center justify-center shadow-md`}>
                      <Icono className="w-6 h-6" />
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                      {m.badge}
                    </span>
                  </div>
                  <div className="pt-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      {m.subtitulo}
                    </div>
                    <CardTitle className="text-lg font-extrabold text-slate-900">
                      {m.titulo}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-xs text-slate-600 leading-relaxed">
                    {m.descripcion}
                  </CardDescription>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                    <span className="flex items-center gap-1">
                      {m.requiereLogin && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                      Ingresar al Módulo
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
