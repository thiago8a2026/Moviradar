import React, { useState } from 'react';
import { 
  Bookmark, 
  Trash2, 
  ExternalLink, 
  Share2, 
  Navigation, 
  MapPin, 
  Plus, 
  Search,
  Check,
  Compass
} from 'lucide-react';
import { FrequentPoint, GpsPositionData } from '../types/moviradar';

interface FrequentPointsSheetProps {
  points: FrequentPoint[];
  gpsPosition: GpsPositionData | null;
  onSelectPoint: (point: FrequentPoint) => void;
  onDeletePoint: (id: string) => void;
  onOpenSaveModal: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

// Cálculo de distancia euclidiana esférica (fórmula de Haversine)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const FrequentPointsSheet: React.FC<FrequentPointsSheetProps> = ({
  points,
  gpsPosition,
  onSelectPoint,
  onDeletePoint,
  onOpenSaveModal,
  onShowToast,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredPoints = points.filter((p) =>
    p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(filterQuery.toLowerCase())) ||
    (p.notes && p.notes.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const handleSharePointWhatsApp = (point: FrequentPoint) => {
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
    const message = 
      `📍 *Punto Guardado en MoviRadar: ${point.name}*\n\n` +
      `${point.address ? `Dirección: ${point.address}\n` : ''}` +
      `Coordenadas: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}\n\n` +
      `🗺️ Abrir en Google Maps:\n${mapsLink}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    onShowToast(`Compartiendo "${point.name}" por WhatsApp...`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 overflow-y-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            <span>Puntos Frecuentes</span>
          </h2>
          <p className="text-xs text-slate-400">
            Guardados en el almacenamiento local de este teléfono
          </p>
        </div>

        <button
          onClick={onOpenSaveModal}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 rounded-xl text-xs font-bold active:scale-95 transition shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Guardar Actual</span>
        </button>
      </div>

      {/* Buscador de Puntos */}
      {points.length > 2 && (
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Buscar entre mis lugares guardados..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Lista de Puntos */}
      {filteredPoints.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 my-auto">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
            <Bookmark className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-200 mb-1">No hay puntos guardados</h4>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            Presiona el botón "Guardar Actual" para registrar tu ubicación actual (casa, oficina, paradas) con nombre personalizado.
          </p>
          <button
            onClick={onOpenSaveModal}
            className="px-4 py-2 bg-cyan-500 text-slate-950 rounded-xl font-bold text-xs"
          >
            Guardar Ubicación Actual
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPoints.map((point) => {
            // Calcular distancia si tenemos coordenadas GPS
            let distanceStr = '';
            if (gpsPosition) {
              const km = calculateDistanceKm(gpsPosition.lat, gpsPosition.lng, point.lat, point.lng);
              distanceStr = km < 1 ? `${Math.round(km * 1000)} m de ti` : `${km.toFixed(1)} km de ti`;
            }

            const isConfirming = confirmDeleteId === point.id;

            return (
              <div
                key={point.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-md hover:border-slate-700 transition flex flex-col gap-2.5"
              >
                {/* Cabecera del punto */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-base shrink-0">
                      {point.category === 'home' && '🏠'}
                      {point.category === 'work' && '💼'}
                      {point.category === 'station' && '🚉'}
                      {point.category === 'stop' && '🚏'}
                      {point.category === 'hazard' && '⚠️'}
                      {point.category === 'favorite' && '⭐'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 leading-tight">{point.name}</h4>
                      {point.address && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{point.address}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {distanceStr && (
                          <span className="font-semibold text-cyan-400">📍 {distanceStr}</span>
                        )}
                        <span>• Guardado {point.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Eliminar con confirmación */}
                  {isConfirming ? (
                    <div className="flex items-center gap-1 bg-red-950/80 border border-red-800/60 p-1 rounded-xl">
                      <button
                        onClick={() => {
                          onDeletePoint(point.id);
                          setConfirmDeleteId(null);
                          onShowToast(`Punto "${point.name}" eliminado de la memoria local`, 'info');
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg"
                      >
                        Sí, borrar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-slate-400 hover:text-white text-[11px] font-medium"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(point.id)}
                      className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition"
                      title="Eliminar punto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {point.notes && (
                  <p className="text-xs italic text-slate-400 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                    "{point.notes}"
                  </p>
                )}

                {/* Acciones de Navegación por Punto */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80">
                  {/* Ver en Mapa interno */}
                  <button
                    onClick={() => onSelectPoint(point)}
                    className="py-1.5 px-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                    title="Centrar en el radar interno"
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ver</span>
                  </button>

                  {/* Google Maps */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 text-center"
                  >
                    <span>GMaps</span>
                  </a>

                  {/* Waze */}
                  <a
                    href={`https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 text-center"
                  >
                    <span>Waze</span>
                  </a>

                  {/* Compartir por WhatsApp */}
                  <button
                    onClick={() => handleSharePointWhatsApp(point)}
                    className="py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                    title="Compartir por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
