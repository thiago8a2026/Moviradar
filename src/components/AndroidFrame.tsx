import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  currentTime?: string;
  isFullScreen?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  currentTime = '09:41',
  isFullScreen = false,
}) => {
  if (isFullScreen) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden relative">
        <div className="flex-1 overflow-hidden relative">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-[380px] h-[780px] max-w-full rounded-[44px] bg-slate-950 p-3 shadow-2xl shadow-emerald-950/30 ring-1 ring-slate-800 border-4 border-slate-900 flex flex-col select-none overflow-hidden transition-all">
      {/* Top Android Speaker Ear-piece */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-slate-800 z-40 pointer-events-none" />

      {/* Screen Area with Curved Corners */}
      <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-slate-950 flex flex-col border border-slate-800/80">
        {/* Android Status Bar */}
        <div className="h-8 px-5 bg-slate-950 flex items-center justify-between text-xs text-slate-400 select-none shrink-0 z-40">
          <span className="font-semibold text-white text-[11px] tracking-tight">{currentTime}</span>

          {/* Front Camera Punch-hole */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950/80" />
          </div>

          <div className="flex items-center gap-1 text-slate-300 scale-90">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Inner Mobile Screen Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </div>

        {/* Android Gesture Pill Navigation Bar */}
        <div className="h-5 bg-slate-950 flex items-center justify-center shrink-0 z-40">
          <div className="w-24 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
