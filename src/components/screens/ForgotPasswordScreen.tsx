import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onNavigateToLogin,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer for step 2 code resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      setCode('842915'); // Auto-suggest or demo ready
      setCountdown(45);
    }, 600);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (code.length < 6) {
      setErrorMessage('Ingresa el código de 6 dígitos que enviamos a tu correo');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('La nueva contraseña debe tener mínimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#06B6D4', '#FFFFFF'],
        });
      } catch (err) {
        // ignore in tests
      }
    }, 700);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-y-auto p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4">
        <button
          onClick={step === 2 ? () => setStep(1) : onBack}
          aria-label="Volver"
          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {step === 1 ? 'Paso 1: Solicitud' : step === 2 ? 'Paso 2: Verificación' : 'Completado'}
        </span>
        <div className="w-10" />
      </div>

      {step === 1 && (
        <form onSubmit={handleSendCode} className="flex-1 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
              <KeyRound className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-black text-white font-display tracking-tight">
              Recuperar Contraseña
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta de MoviRadar y te enviaremos un código de seguridad para restablecer tu clave.
            </p>

            <div className="mt-6">
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

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="pt-6 pb-2 space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 min-h-[52px] rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 active:scale-[0.98] transition-all text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Enviar Código de Seguridad</span>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white font-display tracking-tight">
                Verifica el Código
              </h2>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Hemos enviado un código a <strong className="text-emerald-400">{email}</strong>.
              </p>
            </div>

            {/* Code Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="842915"
                className="w-full h-13 px-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-center tracking-[0.4em] text-xl font-bold focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-slate-500">
                  {countdown > 0 ? `Reenviar en ${countdown}s` : '¿No recibiste el código?'}
                </span>
                {countdown === 0 && (
                  <button
                    type="button"
                    onClick={() => setCountdown(45)}
                    className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reenviar código</span>
                  </button>
                )}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full h-12 pl-11 pr-11 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full h-12 pl-11 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="pt-6 pb-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 min-h-[52px] rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 active:scale-[0.98] transition-all text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Actualizar Contraseña</span>
              )}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-white font-display tracking-tight">
            ¡Contraseña Restablecida!
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
            Tu clave ha sido actualizada con éxito. Ahora puedes iniciar sesión con tu nueva contraseña.
          </p>

          <div className="w-full pt-8">
            <button
              onClick={onNavigateToLogin}
              className="w-full h-13 min-h-[52px] rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all text-slate-950 font-bold text-base flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
