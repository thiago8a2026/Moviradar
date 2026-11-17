import React from 'react';
import { Radio, ShieldCheck, MapPin, ArrowRight, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (screen: 'login' | 'register') => void;
  onQuickDemo: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate, onQuickDemo }) => {
  return (
    <div className="flex flex-col h-full justify-between p-6 bg-slate-950 text-slate-100 select-none overflow-y-auto">
      {/* Top Brand & Radar Animation */}
      <div className="flex flex-col items-center pt-8 pb-4">
        {/* Animated Radar Pulse Container */}
        <div className="relative flex items-center justify-center w-36 h-36 mb-6">
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-radar-ping-slow pointer-events-none" />
          <div className="absolute inset-4 rounded-full border border-emerald-500/30" />
          <div className="absolute inset-8 rounded-full border border-emerald-500/50" />
          
          {/* Radar Sweep Effect */}
          <div className="absolute inset-4 rounded-full overflow-hidden pointer-events-none">
            <div className="w-full h-full animate-radar-sweep origin-center bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent rounded-full" />
          </div>

          {/* Central Radar Brand Core */}
          <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 transform transition-transform active:scale-95">
            <Radio className="w-10 h-10 text-slate-950 stroke-[2.2]" />
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white font-display text-center">
          MoviRadar
        </h1>
        <p className="text-xs uppercase tracking-widest font-semibold text-emerald-400 mt-1">
          Movilidad Ciudadana en Vivo
        </p>
        <p className="text-sm text-slate-400 text-center mt-3 max-w-[280px] leading-relaxed">
          Tu radar comunitario para anticipar el tráfico, esquivar incidentes y viajar más seguro.
        </p>
      </div>

      {/* Community Value Cards */}
      <div className="space-y-2.5 my-auto py-2">
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Alertas en tiempo real</h4>
            <p className="text-xs text-slate-400">Tráfico, baches, obras y cortes viales reportados al instante.</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Validación Comunitaria</h4>
            <p className="text-xs text-slate-400">Sistema de reputación ciudadana para garantizar 0% reportes falsos.</p>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons (Android comfortable touch targets >= 52px) */}
      <div className="space-y-3 pt-4 pb-2">
        <button
          onClick={() => onNavigate('register')}
          className="w-full h-13 min-h-[52px] rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <span>Crear Cuenta Ciudadana</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onNavigate('login')}
          className="w-full h-13 min-h-[52px] rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all text-white font-semibold text-base border border-slate-700/80 flex items-center justify-center cursor-pointer"
        >
          Iniciar Sesión
        </button>

        <div className="pt-1 text-center">
          <button
            onClick={onQuickDemo}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium py-1 px-3 rounded-lg hover:bg-emerald-950/40 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Acceso rápido de demostración</span>
          </button>
        </div>
      </div>
    </div>
  );
};
