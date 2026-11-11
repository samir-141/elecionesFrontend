import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { eleccionApiService } from '../../modules/admin/services/eleccion.service';
import { imageUpdateService } from '../../services/images/image-update.service';
import { ConfiguracionInstitucional } from '../../types';
import {
  Vote,
  Monitor,
  School,
  Shield,
  LogOut,
  Lock,
  Users2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/button';

export function Navbar() {
  const navigate = useNavigate();
  const isAdmin = eleccionApiService.isAdminAuthenticated();
  const adminUser = eleccionApiService.getAdminUser();
  const [institucion, setInstitucion] = useState<ConfiguracionInstitucional | null>(null);

  useEffect(() => {
    imageUpdateService.obtenerInstitucionalPublica().then((res) => {
      if (res?.institucion) setInstitucion(res.institucion);
    });
  }, []);

  const handleLogoutAdmin = () => {
    eleccionApiService.logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Identidad Institucional */}
          <NavLink to="/" className="flex items-center space-x-3 group">
            {institucion?.logo_url ? (
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                <img
                  src={institucion.logo_url}
                  alt={institucion.nombre_institucion}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md group-hover:bg-blue-500 transition-colors">
                <Vote className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                {institucion?.subtitulo || 'Sistema Electoral Escolar'}
              </div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                {institucion?.nombre_institucion || 'Municipio Estudiantil'}
              </h1>
            </div>
          </NavLink>

          {/* Enlaces de Navegación Simplificados */}
          <nav className="hidden md:flex items-center space-x-1.5">
            <NavLink
              to="/kiosco"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Mesa de Votación</span>
            </NavLink>

            <NavLink
              to="/puerta"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Padrón Público</span>
            </NavLink>

            {/* Menú Encargados con Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Users2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Encargados</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 hidden group-hover:block animate-in fade-in z-50">
                <NavLink
                  to="/docente"
                  className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <School className="w-4 h-4 text-emerald-400" />
                  <span>Docente de Aula</span>
                </NavLink>
                <NavLink
                  to="/admin"
                  className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 border-t border-slate-800/60"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Administrador</span>
                </NavLink>
              </div>
            </div>
          </nav>

          {/* Estado de Sesión y Acciones */}
          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white">{adminUser?.nombre || 'Administrador'}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Sesión Activa</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutAdmin}
                  className="text-xs border-slate-700 bg-slate-800 hover:bg-red-900/60 hover:text-red-200 hover:border-red-800 text-slate-300 py-1 px-2.5 h-8"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </Button>
              </div>
            ) : (
              <NavLink
                to="/admin/login"
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Acceso Admin</span>
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

