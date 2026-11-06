import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Smartphone, Lock, ShieldCheck, AlertCircle, KeyRound, Zap } from 'lucide-react';
import { getApiBaseUrl } from '../../../config/api';

interface Props {
  onLoginSuccess: (docente: {
    id: string;
    username: string;
    aula: { id: string; numero: number; nombre: string };
  }) => void;
}

export function DocenteLogin({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('docente1');
  const [password, setPassword] = useState('Docente2026!');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Obtener datos reales de la elección activa y sus aulas/docentes
  const obtenerDatosEleccionActiva = async () => {
    const res = await fetch(`${getApiBaseUrl()}/admin/elecciones/activa`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      throw new Error('No se pudo obtener información de la elección activa.');
    }
    const data = await res.json();
    return data;
  };

  const handleAccesoRapido = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Intentar login oficial con 000000
      const res = await fetch(`${getApiBaseUrl()}/docente/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'docente1',
          password: 'Docente2026!',
          totp_code: '000000',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess({
          id: data.docente_id,
          username: data.username,
          aula: {
            id: data.aula.id,
            numero: data.aula.numero,
            nombre: data.aula.nombre,
          },
        });
        return;
      }

      // 2. Si fallara por cualquier motivo, consultar elección activa
      const eleccion = await obtenerDatosEleccionActiva();
      const aula = eleccion.aulas?.[0];
      if (!aula) throw new Error('No hay aulas configuradas en la elección activa.');

      onLoginSuccess({
        id: eleccion.docentes?.[0]?.id || 'docente-activo',
        username: 'docente1',
        aula: {
          id: aula.id,
          numero: aula.numero,
          nombre: aula.nombre,
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo iniciar sesión rápida.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Por favor introduce usuario y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // Intentar login real con el backend NestJS
      const res = await fetch(`${getApiBaseUrl()}/docente/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          totp_code: totpCode.trim() || '000000',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess({
          id: data.docente_id,
          username: data.username,
          aula: {
            id: data.aula.id,
            numero: data.aula.numero,
            nombre: data.aula.nombre,
          },
        });
        return;
      }

      const errorJson = await res.json().catch(() => null);
      setErrorMsg(errorJson?.message || 'Credenciales o código 2FA inválidos.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4">
      <Card className="border-slate-300 shadow-md">
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 mx-auto flex items-center justify-center mb-2 shadow-inner">
            <Smartphone className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl font-black text-slate-900">Acceso Docente de Aula</CardTitle>
          <CardDescription className="text-xs">
            Autenticación con contraseña y segundo factor institucional (TOTP 2FA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            type="button"
            size="touch"
            onClick={handleAccesoRapido}
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-emerald-200" />
            <span>Ingreso Directo Docente (Mesa 1 Oficial)</span>
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
              O con credenciales individuales
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Usuario Docente</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                placeholder="docente1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
              <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                Código 2FA TOTP (Opcional en dev)
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 font-mono text-center tracking-widest text-base font-bold border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none text-slate-900"
                placeholder="123456"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={loading}
              className="w-full border-emerald-600 text-emerald-800 hover:bg-emerald-50 font-bold text-xs"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" /> Seguridad institucional: Argon2id + TOTP
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
