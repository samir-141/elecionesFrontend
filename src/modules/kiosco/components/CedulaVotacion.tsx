import { useState, useEffect } from 'react';
import { OpcionCedula, votoApiService } from '../services/voto.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CheckCircle2, ShieldCheck, Vote, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface CedulaVotacionProps {
  tokenVoto: string;
  onVotoFinalizado: () => void;
}

export function CedulaVotacion({ tokenVoto, onVotoFinalizado }: CedulaVotacionProps) {
  const [opciones, setOpciones] = useState<OpcionCedula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [opcionSeleccionada, setOpcionSeleccionada] = useState<OpcionCedula | null>(null);
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [votoCompletado, setVotoCompletado] = useState(false);
  const [segundosRetorno, setSegundosRetorno] = useState(4);

  useEffect(() => {
    cargarCedula();
  }, [tokenVoto]);

  // Temporizador de retorno automático tras el voto
  useEffect(() => {
    if (!votoCompletado) return;

    if (segundosRetorno <= 0) {
      onVotoFinalizado();
      return;
    }

    const timer = setInterval(() => {
      setSegundosRetorno((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [votoCompletado, segundosRetorno]);

  const cargarCedula = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await votoApiService.obtenerCedula(tokenVoto);
      setOpciones(data.opciones);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la cédula de votación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarOpcion = (opcion: OpcionCedula) => {
    setOpcionSeleccionada(opcion);
  };

  const handleAbrirConfirmacion = () => {
    if (!opcionSeleccionada) return;
    setModalConfirmacionOpen(true);
  };

  const handleConfirmarDeposito = async () => {
    if (!opcionSeleccionada) return;

    setIsDepositing(true);
    try {
      const esBlanco = opcionSeleccionada.id === 'BLANCO';
      await votoApiService.emitirVoto(
        tokenVoto,
        esBlanco ? null : opcionSeleccionada.id,
        esBlanco,
      );
      setModalConfirmacionOpen(false);
      setVotoCompletado(true);
    } catch (err: any) {
      alert(err.message || 'Error al emitir el voto. Consulte al docente de aula.');
    } finally {
      setIsDepositing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <h3 className="text-base font-bold text-slate-800">Cargando Cédula Oficial...</h3>
        <p className="text-xs text-slate-500">Preparando opciones electorales seguras</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Sesión de Voto No Válida</h3>
        <p className="text-xs text-slate-600 max-w-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={onVotoFinalizado}>
          Volver a Pantalla de Espera
        </Button>
      </div>
    );
  }

  // Pantalla de Voto Completado con Éxito (Invariante I1: Totalmente anónimo)
  if (votoCompletado) {
    return (
      <div className="min-h-[480px] flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900">¡VOTO DEPOSITADO CON ÉXITO!</h2>
          <p className="text-sm text-slate-600 max-w-md">
            Tu voto ha ingresado anónimamente a la urna digital. ¡Gracias por participar en la fiesta democrática escolar!
          </p>
        </div>
        <div className="bg-slate-100 text-slate-700 font-mono text-xs px-3.5 py-1.5 rounded-full">
          Esta pantalla se reiniciará en: <span className="font-bold text-blue-700">{segundosRetorno}s</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-3 px-2 sm:px-4">
      {/* Encabezado Cívico Neutral */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-blue-300 font-bold">
              Cédula de Votación Digital
            </div>
            <h2 className="text-base sm:text-lg font-black">Elige a tus Representantes</h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Voto 100% Secreto</span>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 text-center font-medium">
        Presiona sobre la opción de tu preferencia para seleccionarla y luego confirma tu voto.
      </p>

      {/* Cuadrícula de Opciones Electorales (Invariante I18) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {opciones.map((opcion) => {
          const isSelected = opcionSeleccionada?.id === opcion.id;
          const isBlanco = opcion.id === 'BLANCO';

          return (
            <div
              key={opcion.id}
              onClick={() => handleSeleccionarOpcion(opcion)}
              className={`p-4 rounded-2xl border-3 cursor-pointer transition-all flex flex-col justify-between items-center text-center select-none shadow-xs ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-300 ring-offset-1'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Badge de Selección Superior */}
              <div className="w-full flex justify-between items-center mb-2">
                <span className="font-mono text-xs font-bold text-slate-500">
                  {isBlanco ? 'OPCIÓN NEUTRAL' : `LISTA #${opcion.numero_lista}`}
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Contenido Visual */}
              <div className="my-3 flex flex-col items-center space-y-2">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                    isBlanco
                      ? 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isBlanco ? '⚪' : opcion.numero_lista}
                </div>

                <div className="text-base font-black text-slate-900 leading-tight">
                  {opcion.nombre}
                </div>

                {opcion.lema && (
                  <p className="text-xs text-slate-500 italic max-w-xs">{opcion.lema}</p>
                )}
              </div>

              {/* Botón táctil inferior */}
              <div className="w-full pt-2">
                <span
                  className={`block w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? '✓ Seleccionado' : 'Marcar Opción'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra Fija / Botón Gigante de Depósito */}
      <div className="pt-3 sticky bottom-4">
        <Button
          size="touch"
          onClick={handleAbrirConfirmacion}
          disabled={!opcionSeleccionada}
          className={`w-full text-lg font-black shadow-lg transition-all ${
            opcionSeleccionada
              ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {opcionSeleccionada
            ? `Depositar mi Voto por: ${opcionSeleccionada.nombre}`
            : 'Selecciona una opción arriba para votar'}
        </Button>
      </div>

      {/* Modal de Confirmación Definitiva */}
      {modalConfirmacionOpen && opcionSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-2xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <CardHeader className="bg-blue-700 text-white p-5 text-center">
              <CardTitle className="text-lg font-black text-white">¿Confirmar tu Voto?</CardTitle>
              <CardDescription className="text-xs text-blue-100">
                Una vez depositado en la urna no podrás modificarlo
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-center">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  Tu Selección es:
                </span>
                <span className="text-xl font-black text-slate-900 block">
                  {opcionSeleccionada.nombre}
                </span>
                {opcionSeleccionada.id !== 'BLANCO' && (
                  <span className="text-xs font-mono font-bold text-blue-700 mt-1 inline-block">
                    Lista #{opcionSeleccionada.numero_lista}
                  </span>
                )}
              </div>

              <div className="flex flex-col space-y-2 pt-2">
                <Button
                  size="touch"
                  disabled={isDepositing}
                  onClick={handleConfirmarDeposito}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black text-base shadow-md"
                >
                  {isDepositing ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Depositando en Urna...
                    </>
                  ) : (
                    'Sí, Confirmar y Depositar mi Voto'
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDepositing}
                  onClick={() => setModalConfirmacionOpen(false)}
                  className="w-full text-xs text-slate-600"
                >
                  No, volver a elegir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

