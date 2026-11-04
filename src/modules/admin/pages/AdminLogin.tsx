import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eleccionApiService } from '../services/eleccion.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ShieldCheck, Lock, User, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

export function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError(null);
    try {
      await eleccionApiService.loginAdmin(username.trim(), password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión de administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <CardHeader className="bg-slate-900 text-white p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner text-white font-bold">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl font-black text-white tracking-tight">
            Acceso Administrativo
          </CardTitle>
          <CardDescription className="text-xs text-slate-300 mt-1">
            Gestión y Control del Proceso Electoral Institucional
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Usuario de Administrador
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña Institucional
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Credencial institucional predeterminada: <code className="text-slate-600 font-mono">admin123</code>
              </p>
            </div>

            <Button
              type="submit"
              size="touch"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verificando...
                </>
              ) : (
                'Iniciar Sesión de Administrador'
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <button
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio
            </button>
            <span className="text-slate-400 font-mono text-[10px]">Protegido por RBAC</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

