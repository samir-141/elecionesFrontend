export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    // Si corre en Vite (puerto 3000), usar '/api' relativo mediante el proxy de Vite
    if (window.location.port === '3000') {
      return '/api';
    }
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:4000/api`;
  }
  return 'http://localhost:4000/api';
}

