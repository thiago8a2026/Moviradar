/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Radio, 
  Smartphone, 
  Code2, 
  BookOpen, 
  Download, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  Flame, 
  MapPin, 
  Coins, 
  CheckCircle2,
  Users
} from 'lucide-react';
import JSZip from 'jszip';
import { MobileScreen, UserProfile } from './types/moviradar';
import { AndroidFrame } from './components/AndroidFrame';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterScreen } from './components/screens/RegisterScreen';
import { ForgotPasswordScreen } from './components/screens/ForgotPasswordScreen';
import { HomeDashboardScreen } from './components/screens/HomeDashboardScreen';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { FLUTTER_PROJECT_FILES } from './data/flutterProjectFiles';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'flutter_code' | 'architecture'>('simulator');
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('home');
  const [isFullScreenPhone, setIsFullScreenPhone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return isStandalone || window.innerWidth < 768;
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    id: 'usr_ciudadano',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@moviradar.app',
    role: 'citizen',
    reputationScore: 100,
    isVerifiedCitizen: true,
    subscriptionTier: 'free',
    reportsCount: 5,
    confirmedCount: 22,
    joinedDate: 'Noviembre 2026',
  });

  // Quick demo login handler
  const handleQuickDemo = () => {
    const demoUser: UserProfile = {
      id: 'usr_ciudadano',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@moviradar.app',
      role: 'citizen',
      reputationScore: 100,
      isVerifiedCitizen: true,
      subscriptionTier: 'free',
      reportsCount: 5,
      confirmedCount: 22,
      joinedDate: 'Noviembre 2026',
    };
    setCurrentUser(demoUser);
    setCurrentScreen('home');
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('welcome');
  };

  // ZIP Download action for the entire Flutter project
  const handleDownloadFlutterZip = async () => {
    try {
      const zip = new JSZip();
      FLUTTER_PROJECT_FILES.forEach((f) => zip.file(f.path, f.code));
      zip.file(
        'README.md',
        `# MoviRadar Flutter Project\n\nAplicación de movilidad ciudadana con Flutter BLoC para Android e iOS.\n\n` +
        `Para compilar y correr:\n1. flutter pub get\n2. flutter run\n`
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moviradar_flutter_project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* 
        Top Bar Contract (Section 2):
        [Brand wordmark, one line] — [3 concise nav links, single-line] — [1 primary action]
      */}
      <header className="h-16 px-4 md:px-8 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-8 shrink-0 z-50">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Radio className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white font-display">
            MoviRadar
          </span>
          <span className="hidden sm:inline-block text-[11px] text-emerald-400 font-mono font-medium pl-1">
            v1.0 (Android)
          </span>
        </div>

        {/* Zone 2: Concise Navigation Links / Segmented Mode */}
        <nav className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Simulador Android</span>
          </button>

          <button
            onClick={() => setActiveTab('flutter_code')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'flutter_code'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Código Flutter (BLoC)</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`hidden md:flex px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap items-center gap-1.5 cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Arquitectura</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />

          <button
            onClick={handleDownloadFlutterZip}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar Proyecto Flutter</span>
            <span className="sm:hidden">.zip</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* VIEW 1: INTERACTIVE MOBILE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className={`flex-1 flex flex-col overflow-y-auto ${isFullScreenPhone ? 'p-0 md:p-4' : 'p-4 md:p-6 lg:p-8'} bg-radial from-slate-900 to-slate-950`}>
            {/* Quick Screen Selector Toolbar (Hidden in compact mobile fullscreen for pure native feel, shown on md+) */}
            <div className={`${isFullScreenPhone ? 'hidden md:flex' : 'flex'} max-w-md mx-auto w-full mb-4 items-center justify-between gap-2 text-xs`}>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Pantalla:</span>
                {[
                  { id: 'welcome', label: 'Bienvenida' },
                  { id: 'login', label: 'Login' },
                  { id: 'register', label: 'Registro' },
                  { id: 'forgot_password', label: 'Recuperar' },
                  { id: 'home', label: 'Dashboard' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (s.id === 'home' && !currentUser) {
                        handleQuickDemo();
                      } else {
                        setCurrentScreen(s.id as MobileScreen);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      currentScreen === s.id
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 font-bold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Viewport size toggle */}
              <button
                onClick={() => setIsFullScreenPhone(!isFullScreenPhone)}
                title={isFullScreenPhone ? 'Ver con marco de celular' : 'Ver en pantalla completa'}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shrink-0 cursor-pointer"
              >
                {isFullScreenPhone ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Android Device Canvas */}
            <div className={`flex-1 flex items-center justify-center ${isFullScreenPhone ? 'h-full md:max-w-lg md:mx-auto w-full md:rounded-3xl md:overflow-hidden md:border md:border-slate-800' : ''}`}>
              <AndroidFrame isFullScreen={isFullScreenPhone} currentTime="09:41">
                {currentScreen === 'welcome' && (
                  <WelcomeScreen
                    onNavigate={(screen) => setCurrentScreen(screen)}
                    onQuickDemo={handleQuickDemo}
                  />
                )}

                {currentScreen === 'login' && (
                  <LoginScreen
                    onBack={() => setCurrentScreen('welcome')}
                    onSuccess={handleAuthSuccess}
                    onNavigateToRegister={() => setCurrentScreen('register')}
                    onNavigateToForgot={() => setCurrentScreen('forgot_password')}
                  />
                )}

                {currentScreen === 'register' && (
                  <RegisterScreen
                    onBack={() => setCurrentScreen('welcome')}
                    onSuccess={handleAuthSuccess}
                    onNavigateToLogin={() => setCurrentScreen('login')}
                  />
                )}

                {currentScreen === 'forgot_password' && (
                  <ForgotPasswordScreen
                    onBack={() => setCurrentScreen('login')}
                    onNavigateToLogin={() => setCurrentScreen('login')}
                  />
                )}

                {currentScreen === 'home' && (
                  <HomeDashboardScreen
                    user={
                      currentUser || {
                        id: 'usr_ciudadano',
                        name: 'Carlos Mendoza',
                        email: 'carlos.mendoza@moviradar.app',
                        role: 'citizen',
                        reputationScore: 100,
                        isVerifiedCitizen: true,
                        subscriptionTier: 'free',
                        reportsCount: 5,
                        confirmedCount: 22,
                        joinedDate: 'Noviembre 2026',
                      }
                    }
                    onLogout={handleLogout}
                  />
                )}
              </AndroidFrame>
            </div>

            {/* Mobile Architecture Assurance Note */}
            {!isFullScreenPhone && (
              <div className="max-w-md mx-auto w-full mt-4 text-center">
                <p className="text-[11px] text-slate-400">
                  Diseñado en español para Android con botones táctiles ≥ 52dp. El código fuente Flutter real con BLoC está disponible en la pestaña superior.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: FLUTTER CODE & BLOC REPOSITORY EXPLORER */}
        {activeTab === 'flutter_code' && (
          <div className="flex-1 overflow-hidden">
            <FlutterCodeViewer />
          </div>
        )}

        {/* VIEW 3: ARCHITECTURE & ROADMAP */}
        {activeTab === 'architecture' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Documentación del Proyecto
              </span>
              <h2 className="text-3xl font-black text-white font-display mt-1">
                Arquitectura de MoviRadar (Flutter & BLoC)
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                Estructura modularizada para desarrollo multiplataforma (Android prioritario, compatible con iOS) con Clean Architecture, BLoC pattern y puntos de integración para Firebase y Google Maps.
              </p>
            </div>

            {/* Phase 1 Implemented Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Fase 1: Registro, Login y Acceso de Usuarios (Completado)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-sm font-bold text-white">1. Pantalla de Bienvenida</h4>
                  <p className="text-xs text-slate-400">
                    Logotipo con radar animado, lema de movilidad ciudadana colaborativa y botones grandes para Android.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-sm font-bold text-white">2. Registro de Usuarios</h4>
                  <p className="text-xs text-slate-400">
                    Nombre completo, email, contraseña con medidor de fortaleza visual, confirmación y aceptación del Código Cívico.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-sm font-bold text-white">3. Inicio de Sesión</h4>
                  <p className="text-xs text-slate-400">
                    Validación estricta de correo, contraseña con ver/ocultar, "Recordarme" y acceso rápido de prueba.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-sm font-bold text-white">4. Recuperación de Contraseña</h4>
                  <p className="text-xs text-slate-400">
                    Flujo de 3 pasos: envío de PIN de seguridad de 6 dígitos, temporizador de reenvío y cambio de contraseña con confeti de éxito.
                  </p>
                </div>
              </div>
            </div>

            {/* Future Modules Prepared in Architecture */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-cyan-400" />
                <span>Infraestructura 100% Gratuita (0 Costo)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">OpenStreetMap (OSM)</h4>
                  <p className="text-xs text-slate-400">
                    Cartografía libre y gratuita con flutter_map y latlong2. Sin límites de facturación ni claves de Google Maps.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Radio className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">7 Tipos de Reportes</h4>
                  <p className="text-xs text-slate-400">
                    Accidentes, congestión, vías cerradas, obras, varados, baches y otros acontecimientos ciudadanos.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Firebase Spark (Gratis)</h4>
                  <p className="text-xs text-slate-400">
                    Autenticación segura con correo y persistencia de sesión sin activar plan Blaze ni facturación.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Validación Cívica</h4>
                  <p className="text-xs text-slate-400">
                    Votos comunitarios para confirmar o descartar incidentes y mantener la precisión del mapa.
                  </p>
                </div>
              </div>
            </div>

            {/* How to run instructions */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white">
                Cómo correr el código Flutter en tu computadora:
              </h4>
              <div className="p-3 bg-black/60 rounded-xl font-mono text-xs text-emerald-400 space-y-1">
                <div># 1. Haz clic en "Descargar Proyecto Flutter" en la barra superior</div>
                <div># 2. Descomprime moviradar_flutter_project.zip</div>
                <div># 3. Abre una terminal dentro de la carpeta y ejecuta:</div>
                <div className="text-white font-bold">flutter pub get</div>
                <div className="text-white font-bold">flutter run</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
