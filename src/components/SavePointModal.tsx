import React, { useState } from 'react';
import { X, Bookmark, MapPin, Home, Briefcase, Star, Train, Bus, AlertOctagon, Check } from 'lucide-react';
import { FrequentPointCategory } from '../types/moviradar';

interface SavePointModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  onSave: (name: string, category: FrequentPointCategory, notes?: string) => void;
}

const CATEGORIES: { id: FrequentPointCategory; label: string; icon: string; bg: string }[] = [
  { id: 'home', label: 'Casa', icon: '🏠', bg: 'hover:bg-emerald-500/20' },
  { id: 'work', label: 'Trabajo', icon: '💼', bg: 'hover:bg-blue-500/20' },
  { id: 'favorite', label: 'Favorito', icon: '⭐', bg: 'hover:bg-cyan-500/20' },
  { id: 'station', label: 'Estación', icon: '🚉', bg: 'hover:bg-purple-500/20' },
  { id: 'stop', label: 'Parada', icon: '🚏', bg: 'hover:bg-amber-500/20' },
  { id: 'hazard', label: 'Punto Crítico', icon: '⚠️', bg: 'hover:bg-rose-500/20' },
];

export const SavePointModal: React.FC<SavePointModalProps> = ({
  isOpen,
  onClose,
  lat,
  lng,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FrequentPointCategory>('favorite');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), category, notes.trim());
    setName('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Guardar Punto Frecuente</h3>
              <p className="text-[11px] text-slate-400">Se almacenará en la memoria local (localStorage)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          {/* Coordenadas actuales */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2 text-xs font-mono text-cyan-400">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{lat.toFixed(6)}, {lng.toFixed(6)}</span>
          </div>

          {/* Nombre del punto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del lugar *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Casa de mis padres, Estación Central, Gym..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Selector de Categoría */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas opcionales */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas u observaciones (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Entrada por calle posterior..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mt-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium text-xs hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
            >
              Guardar Punto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
