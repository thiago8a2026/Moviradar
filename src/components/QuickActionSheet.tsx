import React, { useState } from 'react';
import { 
  Navigation, 
  Share2, 
  MapPin, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Bookmark, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { GpsPositionData } from '../types/moviradar';

interface QuickActionSheetProps {
  gpsPosition: GpsPositionData | null;
  onSaveCurrentLocation: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  gpsPosition,
  onSaveCurrentLocation,
  onShowToast,
}) => {
  const [destinationInput, setDestinationInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Coordenadas actuales o de fallback (Bucaramanga)
  const lat = gpsPosition?.lat ?? 7.1193;
  const lng = gpsPosition?.lng ?? -73.1227;

  // 1. Abrir en Google Maps
  const handleOpenGoogleMaps = (destination?: string) => {
    let url: string;
    if (destination && destination.trim()) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(destination.trim())}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    window.open(url, '_blank');
    onShowToast('Abriendo ruta en Google Maps...', 'info');
  };

  // 2. Abrir en Waze
  const handleOpenWaze = (destination?: string) => {
    let url: string;
    if (destination && destination.trim()) {
      url = `https://waze.com/ul?q=${encodeURIComponent(destination.trim())}&navigate=yes`;
    } else {
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    }
    window.open(url, '_blank');
    onShowToast('Abriendo navegación en Waze...', 'info');
  };

  // 3. Compartir Ubicación por WhatsApp
  const handleShareWhatsApp = () => {
    const timeString = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const speedText = gpsPosition?.speed ? ` • ${gpsPosition.speed} km/h` : '';
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    const message = 
      `🚨 *Ubicación en tiempo real compartida desde MoviRadar*\n\n` +
      `📍 Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}${speedText}\n` +
      `🕒 Hora: ${timeString}\n\n` +
      `🗺️ Ver en Google Maps:\n${mapsLink}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    onShowToast('Abriendo WhatsApp para compartir ubicación...', 'success');
  };

  // Copiar coordenadas
  const handleCopyCoords = () => {
    const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(coordsStr);
    setCopied(true);
    onShowToast('Coordenadas copiadas al portapapeles', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      {/* Título de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Acciones Rápidas de Navegación</h3>
            <p className="text-[11px] text-slate-400">Abre tu posición o navega en apps externas</p>
          </div>
        </div>

        {/* Botón rápido para guardar como punto frecuente */}
        <button
          onClick={onSaveCurrentLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-semibold active:scale-95 transition"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Guardar Punto</span>
        </button>
      </div>

      {/* Buscador de Destino Opcional */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={destinationInput}
          onChange={(e) => setDestinationInput(e.target.value)}
          placeholder="Escribe un destino (ej. Aeropuerto, Centro, Hospital)..."
          className="w-full pl-9 pr-24 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        {destinationInput.trim() && (
          <button
            onClick={() => setDestinationInput('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-800 rounded-md"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Botones Grandes Táctiles para Celular (Touch targets >= 48px) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Botón Google Maps */}
        <button
          onClick={() => handleOpenGoogleMaps(destinationInput)}
          className="min-h-[50px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition"
        >
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white">
            <span className="font-bold text-xs">G</span>
          </div>
          <div className="text-left leading-tight">
            <div className="text-[10px] text-blue-200 font-normal">
              {destinationInput ? 'Calcular ruta con' : 'Abrir posición en'}
            </div>
            <div className="font-bold text-xs">Google Maps</div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
        </button>

        {/* 2. Botón Waze */}
        <button
          onClick={() => handleOpenWaze(destinationInput)}
          className="min-h-[50px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-600/20 active:scale-[0.98] transition"
        >
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white">
            <span className="font-bold text-xs">W</span>
          </div>
          <div className="text-left leading-tight">
            <div className="text-[10px] text-cyan-200 font-normal">
              {destinationInput ? 'Navegar ruta con' : 'Tráfico y alertas en'}
            </div>
            <div className="font-bold text-xs">Waze</div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
        </button>

        {/* 3. Botón WhatsApp */}
        <button
          onClick={handleShareWhatsApp}
          className="min-h-[50px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition"
        >
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white">
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-[10px] text-emerald-200 font-normal">Enviar GPS a contacto</div>
            <div className="font-bold text-xs">WhatsApp</div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
        </button>
      </div>

      {/* Barra de coordenadas con botón de copiado */}
      <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-[11px]">
        <div className="flex items-center gap-2 font-mono text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
          {gpsPosition?.accuracy && (
            <span className="text-[10px] text-slate-500">±{gpsPosition.accuracy}m</span>
          )}
        </div>
        <button
          onClick={handleCopyCoords}
          className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition text-[11px] font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
