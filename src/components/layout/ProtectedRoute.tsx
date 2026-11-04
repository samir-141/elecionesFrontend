import { Navigate, useLocation } from 'react-router-dom';
import { eleccionApiService } from '../../modules/admin/services/eleccion.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuth = eleccionApiService.isAdminAuthenticated();
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

