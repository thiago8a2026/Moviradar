import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  LocateFixed,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { GpsPositionData, MobilityReport, FrequentPoint } from '../types/moviradar';
import { getCategoryMeta } from '../utils/reportMeta';

interface LeafletMapViewProps {
  gpsPosition: GpsPositionData | null;
  gpsStatus: 'loading' | 'active' | 'denied' | 'disabled' | 'error';
  reports: MobilityReport[];
  frequentPoints: FrequentPoint[];
  focusLocation?: { lat: number; lng: number; key: number } | null;
  onSelectReport?: (report: MobilityReport) => void;
  onSelectFrequentPoint?: (point: FrequentPoint) => void;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  gpsPosition,
  reports,
  frequentPoints,
  focusLocation,
  onSelectReport,
  onSelectFrequentPoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const reportsLayerRef = useRef<L.LayerGroup | null>(null);
  const pointsLayerRef = useRef<L.LayerGroup | null>(null);
  const hasCenteredOnRealGpsRef = useRef<boolean>(false);

  const [isFollowingUser, setIsFollowingUser] = useState(true);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = gpsPosition?.lat ?? 7.1193;
      const initialLng = gpsPosition?.lng ?? -73.1227;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      reportsLayerRef.current = L.layerGroup().addTo(map);
      pointsLayerRef.current = L.layerGroup().addTo(map);

      map.on('dragstart', () => {
        setIsFollowingUser(false);
      });

      mapInstanceRef.current = map;

      // Ensure map resizes properly inside flex layouts
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fly to external focus location if requested
  useEffect(() => {
    if (!mapInstanceRef.current || !focusLocation) return;
    setIsFollowingUser(false);
    mapInstanceRef.current.flyTo([focusLocation.lat, focusLocation.lng], 16, { duration: 0.9 });
  }, [focusLocation]);

  // Smoothly update live moving/rotating vehicle-radar user marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = gpsPosition?.lat ?? 7.1193;
    const lng = gpsPosition?.lng ?? -73.1227;
    const accuracy = gpsPosition?.accuracy ?? 15;
    const heading = gpsPosition?.heading ?? 0;

    const userRadarHtml = `
      <div class="relative flex items-center justify-center w-14 h-14 -ml-7 -mt-7">
        <span class="absolute inline-flex w-12 h-12 rounded-full bg-cyan-400/35 animate-ping"></span>
        <span class="absolute inline-flex w-9 h-9 rounded-full bg-emerald-400/25"></span>
        <div
          class="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 shadow-xl ring-2 ring-white transition-transform duration-300"
          style="transform: rotate(${heading}deg);"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'custom-user-radar-marker',
      html: userRadarHtml,
      iconSize: [56, 56],
      iconAnchor: [28, 28],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([lat, lng]);
      userMarkerRef.current.setIcon(userIcon);
    }

    if (gpsPosition && accuracy < 500) {
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle([lat, lng], {
          radius: accuracy,
          color: '#06b6d4',
          fillColor: '#06b6d4',
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng([lat, lng]);
        userAccuracyCircleRef.current.setRadius(accuracy);
      }
    }

    if (gpsPosition) {
      const isFirstRealCenter = !hasCenteredOnRealGpsRef.current && gpsPosition.accuracy !== null;
      if (isFirstRealCenter) {
        hasCenteredOnRealGpsRef.current = true;
        setIsFollowingUser(true);
        map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true });
      } else if (isFollowingUser) {
        map.panTo([lat, lng], { animate: true, duration: 0.6 });
      }
    }
  }, [gpsPosition, isFollowingUser]);

  // Render collaborative report markers (including Golden Admin Fixed Locations)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const reportsGroup = reportsLayerRef.current;
    if (!map || !reportsGroup) return;

    reportsGroup.clearLayers();

    reports.forEach((report) => {
      const { lat, lng } = report.gpsCoords;
      const meta = getCategoryMeta(report.category);
      const isOfficialFixed = Boolean(report.isFixed || report.isOfficial);
      const isPendingSync = Boolean(report.pendingSync);
      const hasMedia = Boolean(report.mediaUrl);

      const markerHtml = isOfficialFixed
        ? `
          <div class="relative flex items-center justify-center w-12 h-12 -ml-6 -mt-6 cursor-pointer">
            <span class="absolute w-11 h-11 rounded-full bg-amber-400/35 animate-ping"></span>
            <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 text-slate-950 shadow-xl ring-2 ring-white font-bold text-base"
                 style="box-shadow: 0 0 18px rgba(245, 158, 11, 0.7);">
              <span>${meta.emoji}</span>
              <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-950 border border-amber-400 text-[10px] flex items-center justify-center shadow">${isPendingSync ? '⏳' : '👑'}</span>
            </div>
          </div>
        `
        : `
          <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5 cursor-pointer">
            <div class="relative flex items-center justify-center w-9 h-9 rounded-full shadow-lg ring-2 ${isPendingSync ? 'ring-amber-300' : 'ring-white'} text-white font-bold text-sm"
                 style="background-color: ${meta.color}; box-shadow: 0 4px 14px ${meta.color}88;">
              <span>${meta.emoji}</span>
              ${
                isPendingSync
                  ? `<span class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 border border-slate-950 text-[9px] flex items-center justify-center">⏳</span>`
                  : hasMedia
                  ? `<span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-950 border border-white text-[9px] flex items-center justify-center">${
                      report.mediaType === 'video' ? '🎬' : '📷'
                    }</span>`
                  : ''
              }
            </div>
          </div>
        `;

      const marker = L.marker([lat, lng], {
        zIndexOffset: isOfficialFixed ? 800 : 500,
        icon: L.divIcon({
          className: 'custom-report-marker',
          html: markerHtml,
          iconSize: isOfficialFixed ? [48, 48] : [40, 40],
          iconAnchor: isOfficialFixed ? [24, 24] : [20, 20],
        }),
      });

      marker.on('click', () => {
        onSelectReport?.(report);
      });

      reportsGroup.addLayer(marker);
    });
  }, [reports, onSelectReport]);

  // Render frequent points markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const pointsGroup = pointsLayerRef.current;
    if (!map || !pointsGroup) return;

    pointsGroup.clearLayers();

    frequentPoints.forEach((point) => {
      let iconSymbol = '⭐';
      let iconBg = '#06b6d4';

      if (point.category === 'home') {
        iconSymbol = '🏠';
        iconBg = '#10b981';
      } else if (point.category === 'work') {
        iconSymbol = '💼';
        iconBg = '#3b82f6';
      } else if (point.category === 'station') {
        iconSymbol = '🚉';
        iconBg = '#8b5cf6';
      } else if (point.category === 'stop') {
        iconSymbol = '🚏';
        iconBg = '#f59e0b';
      }

      const pointMarkerHtml = `
        <div class="flex items-center justify-center w-7 h-7 -ml-3.5 -mt-3.5 rounded-full shadow-md ring-2 ring-white text-white font-bold text-xs cursor-pointer"
             style="background-color: ${iconBg};">
          <span>${iconSymbol}</span>
        </div>
      `;

      const pointMarker = L.marker([point.lat, point.lng], {
        zIndexOffset: 200,
        icon: L.divIcon({
          className: 'custom-frequent-point-marker',
          html: pointMarkerHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      });

      pointMarker.on('click', () => {
        onSelectFrequentPoint?.(point);
      });

      pointsGroup.addLayer(pointMarker);
    });
  }, [frequentPoints, onSelectFrequentPoint]);

  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsFollowingUser(true);
    if (gpsPosition) {
      map.flyTo([gpsPosition.lat, gpsPosition.lng], 16, { duration: 0.9 });
    } else {
      map.flyTo([7.1193, -73.1227], 14, { duration: 0.9 });
    }
  }, [gpsPosition]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Embedded Full-Background Interactive Map */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* HUD Top-Left: Live Speed & Coordinates */}
      <div className="absolute top-3 left-3 z-[400] pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-2 shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-mono tracking-tight">Velocidad</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold font-mono tabular-nums text-cyan-400 leading-none">
                {gpsPosition?.speed !== null && gpsPosition?.speed !== undefined ? gpsPosition.speed : '0.0'}
              </span>
              <span className="text-[10px] text-slate-400">km/h</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-mono tracking-tight">GPS en vivo</span>
            <span className="text-[11px] font-mono tabular-nums text-slate-200 leading-tight">
              {gpsPosition
                ? `${gpsPosition.lat.toFixed(4)}, ${gpsPosition.lng.toFixed(4)}`
                : '7.1193, -73.1227'}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Right Controls (Touch-friendly >= 44px) */}
      <div className="absolute right-3 top-3 z-[400] flex flex-col gap-2">

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900/95 border border-slate-700/80 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition"
          title="Acercar"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900/95 border border-slate-700/80 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition"
          title="Alejar"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleRecenter}
          className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center shadow-xl active:scale-90 transition ${
            isFollowingUser && gpsPosition
              ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-cyan-500/30'
              : 'bg-slate-900/95 border-slate-700/80 text-cyan-400 hover:bg-slate-800'
          }`}
          title="Centrar mi ubicación"
        >
          <LocateFixed className="w-5 h-5 stroke-[2.4]" />
        </button>
      </div>

      {/* OpenStreetMap Attribution */}
      <div className="absolute bottom-1 right-2 z-[400] text-[9px] text-slate-400/80 bg-slate-950/75 px-2 py-0.5 rounded backdrop-blur-sm">
        ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          OpenStreetMap
        </a>
      </div>
    </div>
  );
};
