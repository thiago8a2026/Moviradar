import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Si ya está ejecutándose como PWA instalada, no mostrar botón
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">PWA Instalada</span>
      </div>
    );
  }

  // Flujo Android / Chrome Desktop
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition"
        title="Instalar MoviRadar en tu celular"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Instalar App</span>
      </button>
    );
  }

  // Flujo iOS Safari
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-medium active:scale-95 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Instalar en iPhone</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm">Instalar MoviRadar en iOS</h3>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 text-xs text-slate-300">
                <p>Para instalar MoviRadar en tu iPhone o iPad sin pasar por la App Store:</p>
                <div className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Share className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong>Paso 1:</strong> Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong>Paso 2:</strong> Desplázate hacia abajo y selecciona <strong>"Agregar al inicio"</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
