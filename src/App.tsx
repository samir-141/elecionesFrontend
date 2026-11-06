import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { AdminLogin } from './modules/admin/pages/AdminLogin';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { DocentePanel } from './modules/docente/pages/DocentePanel';
import { KioscoPuestoView } from './modules/kiosco/pages/KioscoPuestoView';
import { PantallaPuertaView } from './modules/pantalla-puerta/PantallaPuertaView';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isKiosco = location.pathname.startsWith('/kiosco');

  // En modo Kiosco / Puesto de Votación: pantalla completa aislada, sin Navbar ni escapes
  if (isKiosco) {
    return (
      <div className="w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden select-none flex flex-col justify-center items-center m-0 p-0">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {children}
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Inicio Institucional */}
          <Route path="/" element={<HomePage />} />

          {/* Acceso y Login de Administrador */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Panel de Control Electoral (Protegido por RBAC) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard
                  onVerPantallaPuerta={(aulaId) => {
                    window.location.href = `/puerta?aula=${aulaId}`;
                  }}
                />
              </ProtectedRoute>
            }
          />

          {/* Panel Móvil de Docente de Aula (con 2FA TOTP y escaneo DNI) */}
          <Route path="/docente" element={<DocentePanel />} />

          {/* Terminal Kiosco de Votación (para Estudiantes: Aislado a Pantalla Completa) */}
          <Route path="/kiosco" element={<KioscoPuestoView />} />

          {/* Pantalla Pública Informativa de Puerta */}
          <Route path="/puerta" element={<PantallaPuertaView />} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

