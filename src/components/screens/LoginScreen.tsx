import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, LogIn, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../types/moviradar';

interface LoginScreenProps {
  onBack: () => void;
  onSuccess: (user: UserProfile) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgot: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgot,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Ingresa un correo electrónico válido (ejemplo: usuario@correo.com)');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    // Architectural auth handler prepared for Firebase
    setTimeout(() => {
      setIsLoading(false);
      const user: UserProfile = {
        id: `usr_${Date.now()}`,
        name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: cleanEmail,
        reputationScore: 100,
        isVerifiedCitizen: true,
        subscriptionTier: 'free',
        reportsCount: 4,
        confirmedCount: 18,
        joinedDate: 'Noviembre 2026',
      };
      onSuccess(user);
    }, 600);
  };

  const handleFillDemo = () => {
    setEmail('conductor.ciudadano@moviradar.app');
    setPassword('MoviRadar2026!');
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-y-auto p-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-6">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Acceso Ciudadano
        </span>
        <div className="w-10" />
      </div>

      {/* Title & Subtitle */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white font-display tracking-tight">
          ¡Hola de nuevo!
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Ingresa tus credenciales para acceder a la red de movilidad en tiempo real.
        </p>
      </div>

      {/* Demo Credentials Quick Fill Banner */}
      <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-300">¿Deseas probar rápidamente?</span>
        </div>
        <button
          type="button"
          onClick={handleFillDemo}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
        >
          Rellenar datos demo
        </button>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@ejemplo.com"
                autoComplete="email"
                className="w-full h-13 pl-11 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-13 pl-11 pr-11 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-slate-300 font-medium">Recordar sesión</span>
            </label>

            <button
              type="button"
              onClick={onNavigateToForgot}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 pb-2 space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 min-h-[52px] rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 active:scale-[0.98] transition-all text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-slate-400">
              ¿No tienes una cuenta aún?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer ml-1"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
