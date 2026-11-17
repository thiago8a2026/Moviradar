import React, { useState, useMemo } from 'react';
import {
  Radio,
  AlertTriangle,
  ShieldCheck,
  LogOut,
  ThumbsUp,
  Plus,
  Compass,
  User,
  Home,
  Bookmark,
  Crown,
  ChevronUp,
  ChevronDown,
  Users,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import {
  UserProfile,
  MobilityReport,
  ReportCategory,
  HomeTab,
  FrequentPointCategory,
  UserRole,
} from '../../types/moviradar';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useFrequentPoints } from '../../hooks/useFrequentPoints';
import { useToast } from '../../hooks/useToast';
import { useRealtimeReports } from '../../hooks/useRealtimeReports';
import { LeafletMapView } from '../LeafletMapView';
import { QuickActionSheet } from '../QuickActionSheet';
import { SavePointModal } from '../SavePointModal';
import { FrequentPointsSheet } from '../FrequentPointsSheet';
import { ToastContainer } from '../ToastContainer';
import { PWAInstallButton } from '../PWAInstallButton';
import { ReportModal } from '../ReportModal';
import { ReportDetailModal } from '../ReportDetailModal';
import { getCategoryMeta } from '../../utils/reportMeta';
import { formatReportTime, ProcessedMedia } from '../../utils/mediaUtils';

interface HomeDashboardScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

const ROLE_STORAGE_KEY = 'moviradar_user_role';
const DEVICE_UID_KEY = 'moviradar_device_uid';

function getOrCreateDeviceUid(baseId: string): string {
  try {
    const existing = localStorage.getItem(DEVICE_UID_KEY);
    if (existing) return existing;
    const generated = `${baseId}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(DEVICE_UID_KEY, generated);
    return generated;
  } catch {
    return baseId;
  }
}

export const HomeDashboardScreen: React.FC<HomeDashboardScreenProps> = ({ user, onLogout }) => {
  // Pestaña activa (el mapa en vivo es el protagonista por defecto)
  const [activeTab, setActiveTab] = useState<HomeTab>('mapa');

  // Identificador único de dispositivo para votaciones comunitarias independientes
  const deviceUserId = useMemo(() => getOrCreateDeviceUid(user.id), [user.id]);

  // Control de Roles persistente: 'citizen' (Usuario Común) vs 'admin' (Administrador General)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved === 'admin' || saved === 'citizen') return saved;
    } catch {
      // Ignore storage access errors
    }
    return user.role || 'citizen';
  });

  // Estado UI de modales y hojas
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showSavePointModal, setShowSavePointModal] = useState(false);
  const [showQuickActionsDrawer, setShowQuickActionsDrawer] = useState(false);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; key: number } | null>(null);

  // Hooks de GPS, Persistencia LocalStorage, Toasts y Sincronización WebSocket en Tiempo Real
  const { position, status: gpsStatus, errorMessage: gpsErrorMessage, retryGps } = useGeolocation();
  const { points: frequentPoints, addPoint, removePoint } = useFrequentPoints();
  const { toasts, showToast, removeToast } = useToast();
  const {
    reports,
    connectionStatus,
    activeUsers,
    isSubmitting,
    pendingCount,
    createReport,
    voteReport,
    deleteReport,
  } = useRealtimeReports(deviceUserId, (synced) => {
    showToast(
      `${synced} ${synced === 1 ? 'reporte pendiente sincronizado' : 'reportes pendientes sincronizados'} al recuperar la señal`,
      'success',
      'Sincronización Completada'
    );
  });

  // Mantener sincronizado el reporte seleccionado si recibe actualizaciones en vivo
  const selectedReport: MobilityReport | null = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } catch {
      // Ignore
    }
    showToast(
      newRole === 'admin'
        ? 'Modo Administrador General activado: puedes fijar alertas oficiales.'
        : 'Modo Usuario Común activado: reportes sujetos a validación comunitaria.',
      newRole === 'admin' ? 'warning' : 'info',
      newRole === 'admin' ? 'Rol Administrador General' : 'Rol Usuario Común'
    );
  };

  // Publicar reporte en tiempo real (con multimedia y ubicación GPS)
  const handleSubmitReport = async (payload: {
    category: ReportCategory;
    title: string;
    description: string;
    location: string;
    isFixed: boolean;
    media: ProcessedMedia | null;
  }) => {
    const lat = position?.lat ?? 7.1193;
    const lng = position?.lng ?? -73.1227;

    const created = await createReport(
      {
        title: payload.title,
        category: payload.category,
        description: payload.description,
        location: payload.location,
        gpsCoords: { lat, lng },
        authorId: deviceUserId,
        authorName: userRole === 'admin' ? `${user.name} (Admin)` : user.name,
        authorRole: userRole,
        authorReputation: user.reputationScore,
        isFixed: payload.isFixed,
      },
      payload.media
    );

    if (created.pendingSync) {
      showToast(
        'Sin conexión: reporte guardado en caché local y se sincronizará al recuperar señal',
        'warning',
        'Guardado en Caché Local'
      );
    } else {
      showToast(
        payload.isFixed
          ? 'Ubicación fija oficial publicada en todos los mapas'
          : 'Alerta vial publicada en tiempo real',
        'success',
        payload.isFixed ? 'Alerta Oficial Activa' : 'Reporte Sincronizado'
      );
    }
  };

  // Votación comunitaria ("Sigue aquí" / "Ya pasó")
  const handleVote = async (reportId: string, vote: 'confirm' | 'deny') => {
    try {
      const updated = await voteReport(reportId, vote);
      if (updated?.status === 'resolved') {
        showToast('La comunidad confirmó que la vía ya fue despejada', 'info', 'Alerta Resuelta');
        setSelectedReportId(null);
      } else {
        showToast(
          vote === 'confirm' ? 'Confirmaste que el evento sigue activo' : 'Votaste que el evento ya pasó',
          vote === 'confirm' ? 'success' : 'warning'
        );
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo enviar el voto', 'error');
    }
  };

  // Retirar alerta (Admin o autor)
  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      showToast('Alerta retirada del mapa en todos los dispositivos', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al retirar alerta', 'error');
    }
  };

  // Guardar punto frecuente en LocalStorage
  const handleSaveFrequentPoint = (name: string, category: FrequentPointCategory, notes?: string) => {
    const lat = position?.lat ?? 7.1193;
    const lng = position?.lng ?? -73.1227;
    addPoint(name, category, lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`, notes);
    showToast(`Punto "${name}" guardado en este teléfono`, 'success', 'Punto Frecuente');
  };

  const officialCount = reports.filter((r) => r.isFixed || r.isOfficial).length;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Toasts con vibración háptica */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* ========================================================================
          BARRA SUPERIOR: ESTADO DE GPS Y SINCRONIZACIÓN EN TIEMPO REAL
          ======================================================================== */}
      <header className="shrink-0 bg-slate-900/95 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between gap-2 z-30 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-slate-950 shadow-md shrink-0 ${
              userRole === 'admin'
                ? 'bg-gradient-to-br from-amber-300 to-yellow-500 shadow-amber-500/20'
                : 'bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-emerald-500/20'
            }`}
          >
            {userRole === 'admin' ? (
              <Crown className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Radio className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white truncate">
                MoviRadar - Bucaramanga
              </span>
              {userRole === 'admin' && (
                <span className="text-[10px] font-bold text-amber-300 whitespace-nowrap">
                  · Admin
                </span>
              )}
            </div>

            {/* Estado real de GPS + Reportes en vivo */}
            <div className="flex items-center gap-2 text-[10px] truncate">
              <span className="flex items-center gap-1 font-medium">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    gpsStatus === 'active'
                      ? 'bg-emerald-400'
                      : gpsStatus === 'loading'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-red-400'
                  }`}
                />
                <span
                  className={
                    gpsStatus === 'active'
                      ? 'text-emerald-400'
                      : gpsStatus === 'loading'
                      ? 'text-amber-300'
                      : 'text-red-400'
                  }
                >
                  {gpsStatus === 'active'
                    ? 'GPS Activo'
                    : gpsStatus === 'loading'
                    ? 'Ubicando...'
                    : 'Sin GPS'}
                </span>
              </span>

              <span className="text-slate-600">·</span>

              <span
                className={`flex items-center gap-1 font-medium ${
                  connectionStatus === 'connected'
                    ? 'text-cyan-400'
                    : connectionStatus === 'offline'
                    ? 'text-red-400'
                    : 'text-amber-300'
                }`}
              >
                <Users className="w-2.5 h-2.5" />
                <span>
                  {connectionStatus === 'connected'
                    ? pendingCount > 0
                      ? `Sincronizando ${pendingCount} pendiente(s)...`
                      : `${reports.length} reportes en vivo · ${activeUsers} conectados`
                    : connectionStatus === 'offline'
                    ? pendingCount > 0
                      ? `Sin red · Caché local (${pendingCount} pend.)`
                      : 'Sin red · Caché local'
                    : 'Reconectando...'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={onLogout}
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition active:scale-95"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Banner de error de GPS */}
      {gpsErrorMessage && (
        <div className="bg-amber-950/85 border-b border-amber-800/60 px-3 py-2 flex items-center justify-between gap-2 text-xs text-amber-200 shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{gpsErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={retryGps}
            className="shrink-0 px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-[11px] hover:bg-amber-400 transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ========================================================================
          CUERPO PRINCIPAL
          ======================================================================== */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* PESTAÑA 1: INICIO (Feed colaborativo en tiempo real) */}
        {activeTab === 'inicio' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Tarjeta de estado y acceso al radar */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Hola, {user.name}</h2>
                  <p className="text-xs text-slate-400">
                    {userRole === 'admin'
                      ? 'Sesión de Administrador General · Alertas oficiales activas'
                      : 'Red vial colaborativa en tiempo real'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono tabular-nums text-emerald-400">
                    {reports.length}
                  </div>
                  <div className="text-[10px] text-slate-400">alertas activas</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('mapa')}
                  className="min-h-[44px] py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                >
                  <Compass className="w-4 h-4 stroke-[2.5]" />
                  <span>Ir al Radar GPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="min-h-[44px] py-2 px-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-500/25 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Reportar Evento</span>
                </button>
              </div>
            </div>

            {/* Listado de Alertas en Tiempo Real */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-slate-300">
                  Alertas en la ciudad ({reports.length})
                </h3>
                {officialCount > 0 && (
                  <span className="text-[11px] font-semibold text-amber-400">
                    {officialCount} fijas oficiales
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {reports.map((report) => {
                  const meta = getCategoryMeta(report.category);
                  const isOfficial = Boolean(report.isFixed || report.isOfficial);

                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelectedReportId(report.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer active:scale-[0.99] flex flex-col gap-2.5 ${
                        isOfficial
                          ? 'bg-amber-500/10 border-amber-400/50 hover:border-amber-400'
                          : 'bg-slate-900/85 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow"
                            style={{
                              backgroundColor: isOfficial ? '#f59e0b' : meta.color,
                              color: '#fff',
                            }}
                          >
                            {meta.emoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span
                                className={`font-bold ${
                                  isOfficial ? 'text-amber-300' : 'text-slate-200'
                                }`}
                              >
                                {isOfficial ? '👑 Ubicación Fija' : meta.label}
                              </span>
                              <span>·</span>
                              <span className="truncate">
                                {formatReportTime(report.createdAtIso, report.reportedAt)}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-100 leading-snug mt-0.5">
                              {report.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              📍 {report.location}
                            </p>
                          </div>
                        </div>

                        {report.mediaUrl && (
                          <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                            <Camera className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Footer de validación rápida */}
                      <div
                        className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-slate-400 truncate max-w-[130px]">
                          Por {report.authorName}
                        </span>

                        {report.pendingSync ? (
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <span>⏳ Pendiente de señal</span>
                          </span>
                        ) : isOfficial ? (
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verificada</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleVote(report.id, 'confirm')}
                              className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 ${
                                report.hasUserConfirmed
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Sigue ({report.confirmations})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVote(report.id, 'deny')}
                              className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 ${
                                report.hasUserDenied
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Ya pasó ({report.denials})</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: RADAR GPS (Mapa interactivo embebido de fondo completo) */}
        {activeTab === 'mapa' && (
          <div className="flex-1 relative flex flex-col h-full overflow-hidden">
            {/* Mapa en vivo ocupando todo el fondo */}
            <div className="flex-1 relative">
              <LeafletMapView
                gpsPosition={position}
                gpsStatus={gpsStatus}
                reports={reports}
                frequentPoints={frequentPoints}
                focusLocation={focusLocation}
                onSelectReport={(rep) => setSelectedReportId(rep.id)}
                onSelectFrequentPoint={(pt) => {
                  setFocusLocation({ lat: pt.lat, lng: pt.lng, key: Date.now() });
                  showToast(`Punto frecuente: ${pt.name}`, 'info');
                }}
              />

              {/* Botones flotantes inferiores sobre el mapa */}
              <div className="absolute bottom-5 left-3 z-[400]">
                <button
                  type="button"
                  onClick={() => setShowQuickActionsDrawer(!showQuickActionsDrawer)}
                  className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md text-slate-100 text-xs font-bold shadow-xl flex items-center gap-2 active:scale-95 transition"
                >
                  <span>Navegar / Compartir</span>
                  {showQuickActionsDrawer ? (
                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              </div>

              <div className="absolute bottom-5 right-3 z-[400]">
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="min-h-[44px] px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-extrabold shadow-xl shadow-emerald-500/25 flex items-center gap-1.5 active:scale-95 transition"
                >
                  <span>+ Reportar Novedad</span>
                </button>
              </div>
            </div>

            {/* Hoja colapsable de Acciones Rápidas */}
            {showQuickActionsDrawer && (
              <div className="shrink-0 p-3 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md z-20">
                <QuickActionSheet
                  gpsPosition={position}
                  onSaveCurrentLocation={() => setShowSavePointModal(true)}
                  onShowToast={showToast}
                />
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 4: PUNTOS FRECUENTES (Persistencia en localStorage) */}
        {activeTab === 'puntos' && (
          <FrequentPointsSheet
            points={frequentPoints}
            gpsPosition={position}
            onSelectPoint={(pt) => {
              setFocusLocation({ lat: pt.lat, lng: pt.lng, key: Date.now() });
              setActiveTab('mapa');
              showToast(`Centrando radar en "${pt.name}"`, 'info');
            }}
            onDeletePoint={(id) => removePoint(id)}
            onOpenSaveModal={() => setShowSavePointModal(true)}
            onShowToast={showToast}
          />
        )}

        {/* PESTAÑA 5: PERFIL Y CONTROL DE ROLES */}
        {activeTab === 'perfil' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 max-w-md mx-auto w-full">
            {/* Tarjeta de usuario */}
            <div
              className={`border rounded-2xl p-4 shadow-xl flex items-center gap-3.5 ${
                userRole === 'admin'
                  ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shrink-0 ${
                  userRole === 'admin'
                    ? 'bg-gradient-to-br from-amber-300 to-yellow-500'
                    : 'bg-gradient-to-br from-cyan-400 to-emerald-500'
                }`}
              >
                {userRole === 'admin' ? <Crown className="w-7 h-7" /> : user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-100 truncate">{user.name}</h3>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                <div className="text-[11px] font-bold mt-1">
                  {userRole === 'admin' ? (
                    <span className="text-amber-300">👑 Administrador General</span>
                  ) : (
                    <span className="text-emerald-400">🛡️ Ciudadano Verificado · {user.reputationScore} pts</span>
                  )}
                </div>
              </div>
            </div>

            {/* Selector de Rol de Usuario (Administrador General vs Usuario Común) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Control de Rol de Sesión</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Alterna entre permisos ciudadanos o privilegios institucionales de Administrador General.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleRoleChange('citizen')}
                  className={`min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    userRole === 'citizen'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Usuario Común</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    userRole === 'admin'
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>Admin General</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 leading-relaxed">
                {userRole === 'admin' ? (
                  <span>
                    <strong className="text-amber-300">Privilegios activos:</strong> Puedes publicar{' '}
                    <strong>Ubicaciones Fijas</strong> en color dorado que no expiran y retirar alertas del mapa en todos los dispositivos.
                  </span>
                ) : (
                  <span>
                    <strong className="text-emerald-400">Modo ciudadano:</strong> Tus reportes incluyen foto/video y pasan por validación comunitaria (<em>Sigue aquí / Ya pasó</em>).
                  </span>
                )}
              </div>
            </div>

            {/* Resumen de métricas reales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-center">
                <span className="text-[11px] text-slate-400">Alertas Activas</span>
                <div className="text-2xl font-black font-mono tabular-nums text-cyan-400 mt-1">
                  {reports.length}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-center">
                <span className="text-[11px] text-slate-400">Puntos Guardados</span>
                <div className="text-2xl font-black font-mono tabular-nums text-emerald-400 mt-1">
                  {frequentPoints.length}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[48px] w-full rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs hover:bg-red-500/20 active:scale-95 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </main>

      {/* ========================================================================
          BARRA DE NAVEGACIÓN INFERIOR INTACTA (5 DESTINOS TÁCTILES)
          Inicio · Radar GPS · Reportar · Puntos · Perfil
          ======================================================================== */}
      <nav className="shrink-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 flex items-center justify-around z-30 shadow-2xl">
        {/* 1. Inicio */}
        <button
          type="button"
          onClick={() => setActiveTab('inicio')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'inicio' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-semibold mt-1">Inicio</span>
        </button>

        {/* 2. Radar GPS */}
        <button
          type="button"
          onClick={() => setActiveTab('mapa')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'mapa' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-semibold mt-1">Radar GPS</span>
        </button>

        {/* 3. Reportar (Botón central flotante que abre el modal colaborativo) */}
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="flex flex-col items-center justify-center -mt-5 px-2"
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition ${
              userRole === 'admin'
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30'
                : 'bg-gradient-to-tr from-red-500 to-rose-600 text-white shadow-red-500/30'
            }`}
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 mt-1">Reportar</span>
        </button>

        {/* 4. Puntos */}
        <button
          type="button"
          onClick={() => setActiveTab('puntos')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'puntos' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Bookmark className="w-5 h-5 stroke-[2.2]" />
            {frequentPoints.length > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {frequentPoints.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold mt-1">Puntos</span>
        </button>

        {/* 5. Perfil */}
        <button
          type="button"
          onClick={() => setActiveTab('perfil')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'perfil' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-semibold mt-1">Perfil</span>
        </button>
      </nav>

      {/* Modal Flotante para Crear Reporte con Foto/Video */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        gpsPosition={position}
        userRole={userRole}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitReport}
        onError={(msg) => showToast(msg, 'error', 'Error al publicar')}
      />

      {/* Modal de Detalle del Marcador (Foto/Video + Sigue aquí / Ya pasó) */}
      <ReportDetailModal
        report={selectedReport}
        currentUserId={deviceUserId}
        currentUserRole={userRole}
        onClose={() => setSelectedReportId(null)}
        onVote={handleVote}
        onDelete={handleDeleteReport}
      />

      {/* Modal para Guardar Punto Frecuente en LocalStorage */}
      <SavePointModal
        isOpen={showSavePointModal}
        onClose={() => setShowSavePointModal(false)}
        lat={position?.lat ?? 7.1193}
        lng={position?.lng ?? -73.1227}
        onSave={handleSaveFrequentPoint}
      />
    </div>
  );
};
