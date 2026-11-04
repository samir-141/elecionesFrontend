import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { AdminLogin } from './modules/admin/pages/AdminLogin';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { DocentePanel } from './modules/docente/pages/DocentePanel';
import { KioscoPuestoView } from './modules/kiosco/pages/KioscoPuestoView';
import { PantallaPuertaView } from './modules/pantalla-puerta/PantallaPuertaView';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
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

            {/* Terminal Kiosco de Votación (para Estudiantes) */}
            <Route path="/kiosco" element={<KioscoPuestoView />} />

            {/* Pantalla Pública Informativa de Puerta */}
            <Route path="/puerta" element={<PantallaPuertaView />} />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
