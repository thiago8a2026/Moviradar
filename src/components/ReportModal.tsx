import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Video,
  MapPin,
  ShieldCheck,
  Crown,
  Trash2,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { GpsPositionData, ReportCategory, UserRole } from '../types/moviradar';
import { PRIMARY_REPORT_CATEGORIES, getCategoryMeta } from '../utils/reportMeta';
import { processMediaFile, ProcessedMedia } from '../utils/mediaUtils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpsPosition: GpsPositionData | null;
  userRole: UserRole;
  isSubmitting: boolean;
  onSubmit: (payload: {
    category: ReportCategory;
    title: string;
    description: string;
    location: string;
    isFixed: boolean;
    media: ProcessedMedia | null;
  }) => Promise<void>;
  onError: (msg: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  gpsPosition,
  userRole,
  isSubmitting,
  onSubmit,
  onError,
}) => {
  const [category, setCategory] = useState<ReportCategory>('accident');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [media, setMedia] = useState<ProcessedMedia | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const lat = gpsPosition?.lat ?? 7.1193;
  const lng = gpsPosition?.lng ?? -73.1227;
  const selectedMeta = getCategoryMeta(category);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingMedia(true);
    try {
      const processed = await processMediaFile(file);
      setMedia(processed);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo adjuntar el archivo.');
    } finally {
      setIsProcessingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || selectedMeta.defaultTitle;
    const finalLocation = location.trim() || `GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    try {
      await onSubmit({
        category,
        title: finalTitle,
        description: description.trim() || `Alerta de ${selectedMeta.label.toLowerCase()} reportada en vivo.`,
        location: finalLocation,
        isFixed: userRole === 'admin' && isFixed,
        media,
      });

      // Reset form after successful submit
      setTitle('');
      setLocation('');
      setDescription('');
      setIsFixed(false);
      setMedia(null);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al enviar el reporte.');
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Grab handle on mobile */}
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Reportar Novedad Vial</h3>
              <p className="text-[11px] text-slate-400">Sincronización en vivo · Bucaramanga</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* 1. Selector de Tipo de Evento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Tipo de evento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRIMARY_REPORT_CATEGORIES.map((item) => {
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`min-h-[58px] px-2 py-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                      active
                        ? 'bg-slate-800 border-cyan-400 text-white shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg leading-none">{item.emoji}</span>
                    <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Control Especial para Administrador General: Ubicación Fija / Oficial */}
          {userRole === 'admin' && (
            <div
              onClick={() => setIsFixed(!isFixed)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setIsFixed(!isFixed);
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                isFixed
                  ? 'bg-amber-500/15 border-amber-400/60 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isFixed ? 'bg-amber-400 text-slate-950' : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>Ubicación Fija · Alerta Oficial</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    No expira automáticamente y aparece en dorado en todos los mapas.
                  </p>
                </div>
              </div>

              <div
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                  isFixed ? 'bg-amber-400' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    isFixed ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          )}

          {/* 3. Captura Multimedia (Foto o Video desde Cámara / Galería) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Evidencia multimedia (Foto o Video corto)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id="moviradar-media-input"
            />

            {!media ? (
              <label
                htmlFor="moviradar-media-input"
                className="min-h-[68px] w-full rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/50 px-4 py-3 flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] transition"
              >
                {isProcessingMedia ? (
                  <>
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span className="text-xs font-semibold text-cyan-300">
                      Procesando archivo multimedia...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <Camera className="w-5 h-5" />
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-200">
                        Tomar Foto / Video o Adjuntar
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Se comparte al instante con los demás dispositivos
                      </div>
                    </div>
                  </>
                )}
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                {media.mediaType === 'image' ? (
                  <img
                    src={media.previewUrl}
                    alt="Vista previa del incidente"
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <video
                    src={media.previewUrl}
                    controls
                    playsInline
                    className="w-full h-44 object-cover bg-black"
                  />
                )}

                <div className="px-3 py-2 bg-slate-900/95 flex items-center justify-between text-xs border-t border-slate-800">
                  <span className="text-slate-300 truncate max-w-[200px]">
                    {media.mediaType === 'video' ? '🎬 Video' : '📷 Foto'} · {media.sizeLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMedia(null)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold py-1 px-2 rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Título / Referencia */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título o resumen breve
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedMeta.defaultTitle}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* 5. Ubicación GPS Automática + Referencia */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dirección o punto de referencia
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej. Carrera 27 con Calle 36, Cabecera, Provenza..."
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                GPS capturado: {lat.toFixed(5)}, {lng.toFixed(5)}
                {gpsPosition?.accuracy ? ` (±${gpsPosition.accuracy}m)` : ''}
              </span>
            </div>
          </div>

          {/* 6. Detalles Adicionales */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detalles para otros conductores
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Carriles bloqueados, tráfico detenido o vía alterna..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[48px] px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingMedia}
              className={`flex-1 min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition ${
                userRole === 'admin' && isFixed
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-emerald-500/25'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando en tiempo real...</span>
                </>
              ) : (
                <>
                  {userRole === 'admin' && isFixed ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {userRole === 'admin' && isFixed
                      ? 'Publicar Ubicación Fija'
                      : 'Publicar en el Mapa'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
