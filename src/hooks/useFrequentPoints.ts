import { useState, useEffect, useCallback } from 'react';
import { FrequentPoint, FrequentPointCategory } from '../types/moviradar';

const STORAGE_KEY = 'moviradar_frequent_points';

const INITIAL_DEFAULT_POINTS: FrequentPoint[] = [
  {
    id: 'fp_centro',
    name: 'Parque Santander / Centro',
    category: 'favorite',
    lat: 7.1193,
    lng: -73.1227,
    address: 'Calle 36 con Carrera 19, Bucaramanga',
    createdAt: '2026-11-12',
    notes: 'Zona bancaria y comercial',
  },
  {
    id: 'fp_cabecera',
    name: 'Cabecera del Llano',
    category: 'work',
    lat: 7.1166,
    lng: -73.1099,
    address: 'Carrera 33 con Calle 48, Bucaramanga',
    createdAt: '2026-11-12',
    notes: 'Zona de alta demanda de carreras',
  },
  {
    id: 'fp_terminal',
    name: 'Terminal de Transportes',
    category: 'station',
    lat: 7.1072,
    lng: -73.1331,
    address: 'Vía Girón Km 2, Bucaramanga',
    createdAt: '2026-11-12',
    notes: 'Bahía de taxis y viajeros',
  },
];

export function useFrequentPoints() {
  const [points, setPoints] = useState<FrequentPoint[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo puntos frecuentes de localStorage:', e);
    }
    return INITIAL_DEFAULT_POINTS;
  });

  // Guardar automáticamente en localStorage cuando cambia la lista
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
    } catch (e) {
      console.error('Error guardando puntos en localStorage:', e);
    }
  }, [points]);

  const addPoint = useCallback((
    name: string,
    category: FrequentPointCategory,
    lat: number,
    lng: number,
    address?: string,
    notes?: string
  ): FrequentPoint => {
    const newPoint: FrequentPoint = {
      id: 'fp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4),
      name: name.trim() || 'Punto Guardado',
      category,
      lat,
      lng,
      address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      createdAt: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      notes: notes?.trim(),
    };

    setPoints((prev) => [newPoint, ...prev]);
    return newPoint;
  }, []);

  const removePoint = useCallback((id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearAllPoints = useCallback(() => {
    setPoints([]);
  }, []);

  return {
    points,
    addPoint,
    removePoint,
    clearAllPoints,
  };
}
