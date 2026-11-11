import { Eleccion, ReglasEleccion } from '../../../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Datos de demostración iniciales para cuando el backend no esté en ejecución
export const ELECCION_INICIAL_DEFAULT: Eleccion = {
  id: 'e1000000-0000-0000-0000-000000000001',
  nombre: 'Elección Municipio Escolar 2026',
  descripcion: 'Proceso electoral para la directiva estudiantil institucional',
  estado: 'BORRADOR',
  reglas: {
    blanco_en_porcentaje: false,
    porcentaje_minimo_ganar: 50.0,
    segunda_vuelta: true,
    cuantos_pasan_segunda_vuelta: 2,
    quorum_porcentaje: 50.0,
    accion_sin_quorum: 'DECLARAR_DESIERTA',
    regla_empate: 'SORTEO',
    duracion_reserva_segundos: 180,
    ip_restringida: null,
  },
  huella_sha256: null,
  created_at: new Date().toISOString(),
  abierta_at: null,
  cerrada_at: null,
};

export const eleccionApiService = {
  async obtenerEleccion(id = 'activa'): Promise<Eleccion> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}`);
      if (!res.ok) throw new Error('API no disponible');
      const data = await res.json();
      localStorage.setItem('eleccion_activa', JSON.stringify(data));
      return data;
    } catch {
      // Fallback a almacenamiento local para experiencia fluida
      const saved = localStorage.getItem('eleccion_activa');
      return saved ? JSON.parse(saved) : ELECCION_INICIAL_DEFAULT;
    }
  },

  async loginAdmin(username: string, password: string): Promise<{ token: string; user: any }> {
    try {
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Credenciales inválidas' }));
        throw new Error(error.message || 'Usuario o contraseña incorrectos');
      }

      const data = await res.json();
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_user', JSON.stringify(data.user));
      return data;
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      // Demo fallback local si el backend estuviera desconectado
      if (username.toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin')) {
        const demoData = {
          token: 'admin_sec_demo_local_' + Date.now(),
          user: { username: 'admin', nombre: 'Administrador Electoral', rol: 'ADMIN' },
        };
        sessionStorage.setItem('admin_token', demoData.token);
        sessionStorage.setItem('admin_user', JSON.stringify(demoData.user));
        return demoData;
      }
      throw new Error('Usuario o contraseña de administrador incorrectos.');
    }
  },

  logoutAdmin() {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
  },

  isAdminAuthenticated(): boolean {
    return Boolean(sessionStorage.getItem('admin_token'));
  },

  getAdminUser(): { username: string; nombre: string; rol: string } | null {
    const raw = sessionStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  },

  async actualizarReglas(id: string, reglas: Partial<ReglasEleccion>): Promise<Eleccion> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}/reglas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
        body: JSON.stringify(reglas),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al actualizar reglas');
      }
      return await res.json();
    } catch (err: any) {
      const actual = await this.obtenerEleccion(id);
      if (actual.estado !== 'BORRADOR') {
        throw new Error(`Las reglas están congeladas porque la elección está en estado ${actual.estado}.`);
      }
      const actualizada: Eleccion = {
        ...actual,
        reglas: { ...actual.reglas, ...reglas },
      };
      localStorage.setItem('eleccion_activa', JSON.stringify(actualizada));
      return actualizada;
    }
  },

  async obtenerPrecondiciones(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}/precondiciones`);
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      return {
        listo_para_abrir: true,
        requisitos: {
          aulas: { total: 2, ok: true, titulo: 'Mesas / Aulas', mensaje: '2 mesas configuradas' },
          puestos: { total: 4, ok: true, titulo: 'Puestos de Votación', mensaje: '4 puestos listos' },
          docentes: { total: 2, ok: true, titulo: 'Docentes de Mesa', mensaje: '2 docentes asignados' },
          partidos: { total: 2, ok: true, titulo: 'Listas Electorales', mensaje: '2 listas inscritas' },
          padron: { total: 10, ok: true, titulo: 'Padrón Electoral', mensaje: '10 electores listos' },
        },
      };
    }
  },

  async inicializarMesasDemo(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}/inicializar-mesas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al auto-configurar mesas');
      }
      return await res.json();
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      return { listo_para_abrir: true };
    }
  },

  async abrirEleccion(id: string): Promise<Eleccion> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al abrir la elección');
      }
      return await res.json();
    } catch {
      const actual = await this.obtenerEleccion(id);
      if (actual.estado !== 'BORRADOR') {
        throw new Error('Solo una elección en Borrador puede ser abierta.');
      }
      // Generar huella SHA-256 simulada
      const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const abierta: Eleccion = {
        ...actual,
        estado: 'ABIERTA',
        huella_sha256: hash,
        abierta_at: new Date().toISOString(),
      };
      localStorage.setItem('eleccion_activa', JSON.stringify(abierta));
      return abierta;
    }
  },

  async cerrarEleccion(id: string): Promise<Eleccion> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}/cerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al cerrar la elección');
      }
      return await res.json();
    } catch {
      const actual = await this.obtenerEleccion(id);
      const cerrada: Eleccion = {
        ...actual,
        estado: 'CERRADA',
        cerrada_at: new Date().toISOString(),
      };
      localStorage.setItem('eleccion_activa', JSON.stringify(cerrada));
      return cerrada;
    }
  },

  async reaperturarEleccion(id: string): Promise<Eleccion> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}/reaperturar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al reaperturar la elección');
      }
      const data = await res.json();
      localStorage.setItem('eleccion_activa', JSON.stringify(data));
      return data;
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      const actual = await this.obtenerEleccion(id);
      const reaperturada: Eleccion = {
        ...actual,
        estado: 'ABIERTA',
        cerrada_at: null,
      };
      localStorage.setItem('eleccion_activa', JSON.stringify(reaperturada));
      return reaperturada;
    }
  },

  async crearNuevaEleccion(params: {
    nombre: string;
    descripcion?: string;
    clonarConfiguracion?: boolean;
    clonarPadron?: boolean;
    eleccionOrigenId?: string;
  }): Promise<Eleccion> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/nueva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al crear la nueva elección');
      }
      const data = await res.json();
      localStorage.setItem('eleccion_activa', JSON.stringify(data));
      return data;
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      // Fallback local
      const nueva: Eleccion = {
        id: `elec-local-${Date.now()}`,
        nombre: params.nombre,
        descripcion: params.descripcion || 'Nuevo proceso electoral institucional',
        estado: 'BORRADOR',
        reglas: ELECCION_INICIAL_DEFAULT.reglas,
        huella_sha256: null,
        created_at: new Date().toISOString(),
        abierta_at: null,
        cerrada_at: null,
      };
      localStorage.setItem('eleccion_activa', JSON.stringify(nueva));
      return nueva;
    }
  },

  async listarElecciones(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones`);
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      const actual = await this.obtenerEleccion();
      return [actual];
    }
  },

  async actualizarEleccion(id: string, data: { nombre?: string; descripcion?: string }): Promise<Eleccion> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Error al actualizar elección' }));
        throw new Error(error.message || 'No se pudo actualizar la información de la elección');
      }

      const actualizada = await res.json();
      localStorage.setItem('eleccion_activa', JSON.stringify(actualizada));
      return actualizada;
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      // Fallback local
      const saved = localStorage.getItem('eleccion_activa');
      const base = saved ? JSON.parse(saved) : ELECCION_INICIAL_DEFAULT;
      const updated = {
        ...base,
        ...(data.nombre ? { nombre: data.nombre } : {}),
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      };
      localStorage.setItem('eleccion_activa', JSON.stringify(updated));
      return updated;
    }
  },

  async eliminarEleccion(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const res = await fetch(`${API_BASE}/admin/elecciones/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al eliminar la elección' }));
      throw new Error(error.message || 'No se pudo eliminar la elección seleccionada');
    }

    return await res.json();
  },

  async obtenerAuditoria(id: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${id}/auditoria`);
      if (!res.ok) throw new Error('API');
      return await res.json();
    } catch {
      return [
        {
          id: 1,
          actor_tipo: 'ADMIN',
          actor_id: 'admin_principal',
          accion: 'INICIALIZAR_SISTEMA',
          entidad: 'eleccion',
          created_at: new Date().toISOString(),
          ip: '127.0.0.1',
        },
      ];
    }
  },

  async obtenerPadron(
    eleccionId: string,
    page = 1,
    limit = 20,
    busqueda?: string,
  ): Promise<{
    total: number;
    pagina: number;
    total_paginas: number;
    electores: any[];
  }> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (busqueda && busqueda.trim()) {
        params.append('busqueda', busqueda.trim());
      }
      const res = await fetch(`${API_BASE}/admin/elecciones/${eleccionId}/padron?${params.toString()}`);
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      const saved = JSON.parse(localStorage.getItem('padron_electores') || '[]');
      let filtrados = saved;
      if (busqueda && busqueda.trim()) {
        const b = busqueda.toLowerCase().trim();
        filtrados = saved.filter(
          (e: any) =>
            e.dni?.toLowerCase().includes(b) ||
            e.nombres?.toLowerCase().includes(b) ||
            e.apellidos?.toLowerCase().includes(b) ||
            e.grado_seccion?.toLowerCase().includes(b),
        );
      }
      return {
        total: filtrados.length,
        pagina: page,
        total_paginas: Math.ceil(filtrados.length / limit) || 1,
        electores: filtrados.slice((page - 1) * limit, page * limit),
      };
    }
  },

  async obtenerTodosElectores(eleccionId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${eleccionId}/padron?page=1&limit=5000`);
      if (!res.ok) throw new Error('API no disponible');
      const data = await res.json();
      return data.electores || [];
    } catch {
      return JSON.parse(localStorage.getItem('padron_electores') || '[]');
    }
  },

  async confirmarPadron(
    eleccionId: string,
    electores: Array<{
      dni: string;
      nombres: string;
      apellidos: string;
      grado_seccion: string;
      aula_numero: number;
    }>,
  ): Promise<{ total_registrados: number }> {
    try {
      const res = await fetch(`${API_BASE}/admin/elecciones/${eleccionId}/padron/confirmar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-id': 'admin',
        },
        body: JSON.stringify({ electores }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error al importar padrón' }));
        throw new Error(err.message || 'Error al guardar electores en el servidor');
      }
      return await res.json();
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      const saved = JSON.parse(localStorage.getItem('padron_electores') || '[]');
      const nuevos = electores.map((e, idx) => ({
        id: `elector-loc-${Date.now()}-${idx}`,
        ...e,
        estado: 'PENDIENTE',
        aula: { numero: e.aula_numero, nombre: `Aula #${e.aula_numero}` },
      }));
      localStorage.setItem('padron_electores', JSON.stringify([...saved, ...nuevos]));
      return { total_registrados: nuevos.length };
    }
  },

  async crearAula(
    eleccionId: string,
    aulaData: { numero: number; nombre: string; capacidad: number },
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/elecciones/${eleccionId}/aulas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-id': 'admin',
      },
      body: JSON.stringify(aulaData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al crear aula' }));
      throw new Error(err.message || 'Error al registrar aula en el servidor');
    }
    return await res.json();
  },

  async obtenerAulas(eleccionId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/elecciones/${eleccionId}/aulas`);
    if (!res.ok) throw new Error('API no disponible');
    return await res.json();
  },

  async actualizarAula(
    aulaId: string,
    data: { nombre?: string; capacidad?: number; numero?: number },
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/aulas/${aulaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al actualizar aula' }));
      throw new Error(err.message || 'Error al actualizar aula');
    }
    return await res.json();
  },

  async eliminarAula(aulaId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/aulas/${aulaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al eliminar aula' }));
      throw new Error(err.message || 'Error al eliminar aula');
    }
  },

  async crearPartido(
    eleccionId: string,
    partidoData: {
      numero_lista: number;
      nombre: string;
      lema?: string;
      logo_url?: string | null;
      logo_media_id?: string | null;
    },
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/elecciones/${eleccionId}/partidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-id': 'admin',
      },
      body: JSON.stringify(partidoData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al inscribir partido' }));
      throw new Error(err.message || 'Error al inscribir lista partidaria en el servidor');
    }
    return await res.json();
  },

  async agregarCandidato(
    partidoId: string,
    data: {
      nombres: string;
      apellidos: string;
      cargo: string;
      orden?: number;
      foto_url?: string | null;
      foto_media_id?: string | null;
    },
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/partidos/${partidoId}/candidatos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-id': 'admin',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al registrar candidato' }));
      throw new Error(err.message || 'No se pudo registrar al candidato');
    }
    return await res.json();
  },

  async actualizarCandidato(
    candidatoId: string,
    data: {
      nombres?: string;
      apellidos?: string;
      cargo?: string;
      orden?: number;
      foto_url?: string | null;
      foto_media_id?: string | null;
    },
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/candidatos/${candidatoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-id': 'admin',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al actualizar candidato' }));
      throw new Error(err.message || 'No se pudo actualizar al candidato');
    }
    return await res.json();
  },

  async eliminarCandidato(candidatoId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/candidatos/${candidatoId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-id': 'admin',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al eliminar candidato' }));
      throw new Error(err.message || 'No se pudo eliminar al candidato');
    }
  },

  async obtenerPartidos(eleccionId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/elecciones/${eleccionId}/partidos`);
    if (!res.ok) throw new Error('API no disponible');
    return await res.json();
  },

  async actualizarPartido(
    partidoId: string,
    data: { numero_lista?: number; nombre?: string; lema?: string },
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/partidos/${partidoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al actualizar lista' }));
      throw new Error(err.message || 'Error al actualizar lista');
    }
    return await res.json();
  },

  async eliminarPartido(partidoId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/partidos/${partidoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al eliminar lista' }));
      throw new Error(err.message || 'Error al eliminar lista');
    }
  },

  async asignarDocente(
    eleccionId: string,
    data: { aula_id: string; username: string; password?: string },
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/elecciones/${eleccionId}/docentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      body: JSON.stringify({
        aula_id: data.aula_id,
        username: data.username.trim(),
        password: data.password?.trim() || 'docente123',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al asignar docente' }));
      throw new Error(err.message || 'Error al registrar docente en el servidor');
    }
    return await res.json();
  },

  async quitarDocente(docenteId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/docentes/${docenteId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al quitar docente' }));
      throw new Error(err.message || 'Error al quitar docente');
    }
  },

  async desvincularDocenteAula(aulaId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/aulas/${aulaId}/docentes/desvincular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al desvincular docente del aula' }));
      throw new Error(err.message || 'Error al desvincular docente');
    }
  },
};

