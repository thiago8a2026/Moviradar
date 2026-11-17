import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Check, X, Shield, Loader2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../../types/moviradar';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: (user: UserProfile) => void;
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onSuccess,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password strength calculations
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const strengthScore = [hasMinLength, hasLetter, hasNumber].filter(Boolean).length;
  const strengthLabels = ['Muy débil', 'Media', 'Fuerte'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 3) {
      setErrorMessage('Por favor ingresa tu nombre completo (mínimo 3 caracteres)');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Ingresa un correo electrónico válido');
      return;
    }

    if (!hasMinLength) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Debes aceptar los Términos de Servicio y el Código Cívico de MoviRadar');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        reputationScore: 100, // Initial civic confidence score
        isVerifiedCitizen: false,
        subscriptionTier: 'free',
        reportsCount: 0,
        confirmedCount: 0,
        joinedDate: 'Noviembre 2026',
      };
      onSuccess(newUser);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-y-auto p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Paso 1 de 1
        </span>
        <div className="w-10" />
      </div>

      {/* Screen Title */}
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white font-display tracking-tight">
          Crea tu cuenta
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Únete a la red ciudadana que transforma el tráfico y la movilidad urbana.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nombre Completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Sofía Morales"
                autoComplete="name"
                className="w-full h-12 pl-11 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Email Field */}
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
                className="w-full h-12 pl-11 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Contraseña
              </label>
              {password && (
                <span className="text-[11px] font-medium text-slate-400">
                  Fortaleza: <strong className="text-white">{strengthLabels[strengthScore - 1] || 'Muy débil'}</strong>
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="w-full h-12 pl-11 pr-11 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator Bar */}
            {password && (
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <div className={`h-1.5 rounded-full ${strengthScore >= 1 ? strengthColors[strengthScore - 1] : 'bg-slate-800'}`} />
                <div className={`h-1.5 rounded-full ${strengthScore >= 2 ? strengthColors[strengthScore - 1] : 'bg-slate-800'}`} />
                <div className={`h-1.5 rounded-full ${strengthScore >= 3 ? strengthColors[strengthScore - 1] : 'bg-slate-800'}`} />
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                className={`w-full h-12 pl-11 pr-11 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none transition-colors ${
                  confirmPassword
                    ? passwordsMatch
                      ? 'border-emerald-500/80 focus:border-emerald-500'
                      : 'border-red-500/80 focus:border-red-500'
                    : 'border-slate-800 focus:border-emerald-500'
                }`}
              />
              {confirmPassword && (
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  {passwordsMatch ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <X className="w-5 h-5 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Civic Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-slate-400 leading-snug">
                Acepto los <strong className="text-slate-300">Términos de Servicio</strong> y el{' '}
                <strong className="text-emerald-400">Código Cívico de Reportes</strong> para mantener la información de la ciudad confiable.
              </span>
            </label>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Submit Register Button */}
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
                <span>Registrarme en MoviRadar</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-slate-400">
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer ml-1"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
