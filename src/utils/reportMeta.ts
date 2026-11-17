export interface CategoryMeta {
  id: ReportCategory;
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
  defaultTitle: string;
  badgeClass: string;
}

import { ReportCategory } from '../types/moviradar';

export const PRIMARY_REPORT_CATEGORIES: CategoryMeta[] = [
  {
    id: 'checkpoint',
    label: 'Retén',
    shortLabel: 'Retén',
    emoji: '🚧',
    color: '#f97316',
    defaultTitle: 'Retén de control vial',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  },
  {
    id: 'accident',
    label: 'Accidente',
    shortLabel: 'Accidente',
    emoji: '🚨',
    color: '#ef4444',
    defaultTitle: 'Accidente vehicular reportado',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/40',
  },
  {
    id: 'roadClosed',
    label: 'Vía cerrada',
    shortLabel: 'Vía cerrada',
    emoji: '⛔',
    color: '#dc2626',
    defaultTitle: 'Vía cerrada sin paso',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  },
  {
    id: 'hazard',
    label: 'Hueco',
    shortLabel: 'Hueco',
    emoji: '🕳️',
    color: '#eab308',
    defaultTitle: 'Hueco peligroso en la vía',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  },
  {
    id: 'congestion',
    label: 'Trancón',
    shortLabel: 'Trancón',
    emoji: '🚗',
    color: '#f59e0b',
    defaultTitle: 'Trancón / congestión pesada',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  },
  {
    id: 'police',
    label: 'Policía',
    shortLabel: 'Policía',
    emoji: '👮',
    color: '#3b82f6',
    defaultTitle: 'Presencia de Policía de Tránsito',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  },
];

const EXTRA_CATEGORY_META: Record<string, CategoryMeta> = {
  construction: {
    id: 'construction',
    label: 'Obras en la vía',
    shortLabel: 'Obras',
    emoji: '🛠️',
    color: '#ea580c',
    defaultTitle: 'Obras en la vía',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  },
  stalledVehicle: {
    id: 'stalledVehicle',
    label: 'Vehículo varado',
    shortLabel: 'Varado',
    emoji: '🔧',
    color: '#8b5cf6',
    defaultTitle: 'Vehículo varado',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  },
  other: {
    id: 'other',
    label: 'Otro',
    shortLabel: 'Otro',
    emoji: 'ℹ️',
    color: '#06b6d4',
    defaultTitle: 'Alerta ciudadana',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  },
};

export function getCategoryMeta(category: ReportCategory): CategoryMeta {
  const primary = PRIMARY_REPORT_CATEGORIES.find((c) => c.id === category);
  if (primary) return primary;
  return EXTRA_CATEGORY_META[category] || EXTRA_CATEGORY_META.other;
}
