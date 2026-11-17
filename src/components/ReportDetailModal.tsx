import React, { useState } from 'react';
import {
  X,
  ThumbsUp,
  CheckCircle2,
  MapPin,
  Clock,
  Crown,
  ShieldCheck,
  User,
  Trash2,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { MobilityReport, UserRole } from '../types/moviradar';
import { getCategoryMeta } from '../utils/reportMeta';
import { formatReportTime } from '../utils/mediaUtils';

interface ReportDetailModalProps {
  report: MobilityReport | null;
  currentUserId: string;
  currentUserRole: UserRole;
  onClose: () => void;
  onVote: (reportId: string, vote: 'confirm' | 'deny') => Promise<void>;
  onDelete: (reportId: string) => Promise<void>;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  currentUserId,
  currentUserRole,
  onClose,
  onVote,
  onDelete,
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!report) return null;

  const meta = getCategoryMeta(report.category);
  const isOfficialFixed = Boolean(report.isFixed || report.isOfficial);
  const canDelete = currentUserRole === 'admin' || report.authorId === currentUserId;
  const { lat, lng } = report.gpsCoords;

  const handleVoteClick = async (vote: 'confirm' | 'deny') => {
    setIsVoting(true);
    try {
      await onVote(report.id, vote);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    try {
      await onDelete(report.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const text =
      `${meta.emoji} *Alerta MoviRadar: ${report.title}*\n` +
      `📍 ${report.location}\n` +
      `🕒 ${formatReportTime(report.createdAtIso, report.reportedAt)}\n` +
      `📝 ${report.description}\n\n` +
      `🗺️ Ver ubicación:\n${mapsLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[720] flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-md max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-slate-900 border shadow-2xl overflow-hidden ${
          isOfficialFixed ? 'border-amber-400/60' : 'border-slate-800'
        }`}
      >
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Banner dorado si es Ubicación Fija / Alerta Oficial de Administrador */}
        {isOfficialFixed && (
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-b border-amber-400/30 px-5 py-2 flex items-center gap-2 text-amber-300 text-xs font-bold">
            <Crown className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Ubicación Fija · Alerta Oficial Verificada</span>
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-md"
              style={{
                backgroundColor: isOfficialFixed ? '#f59e0b' : meta.color,
                color: '#ffffff',
              }}
            >
              {meta.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-bold text-slate-200">{meta.label}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatReportTime(report.createdAtIso, report.reportedAt)}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-100 leading-snug mt-0.5">
                {report.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center shrink-0"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Multimedia Viewer if present */}
          {report.mediaUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">
              {report.mediaType === 'video' ? (
                <video
                  src={report.mediaUrl}
                  controls
                  playsInline
                  className="w-full max-h-60 object-contain bg-black"
                />
              ) : (
                <img
                  src={report.mediaUrl}
                  alt={report.title}
                  className="w-full max-h-60 object-cover"
                />
              )}
            </div>
          )}

          {/* Description & Location */}
          <div className="space-y-2.5">
            <p className="text-sm text-slate-200 leading-relaxed">{report.description}</p>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{report.location}</span>
              <span className="font-mono text-[11px] text-slate-500 ml-auto">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              {isOfficialFixed ? (
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <User className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>
                Reportado por <strong className="text-slate-200">{report.authorName}</strong>
              </span>
              <span className="ml-auto text-[11px] text-emerald-400 font-medium">
                {report.authorReputation} pts
              </span>
            </div>
          </div>

          {/* Community Validation Voting ("Sigue aquí" / "Ya pasó") */}
          <div className="pt-3 border-t border-slate-800">
            {isOfficialFixed ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 text-center">
                Esta alerta institucional fue fijada por un Administrador General y permanece activa sin expirar.
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  Validación comunitaria ¿Esta novedad continúa en la vía?
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isVoting}
                    onClick={() => handleVoteClick('confirm')}
                    className={`min-h-[48px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition ${
                      report.hasUserConfirmed
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-700 text-slate-200 hover:border-emerald-500/60'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Sigue aquí ({report.confirmations})</span>
                  </button>

                  <button
                    type="button"
                    disabled={isVoting}
                    onClick={() => handleVoteClick('deny')}
                    className={`min-h-[48px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition ${
                      report.hasUserDenied
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-950/60 border-slate-700 text-slate-200 hover:border-amber-500/60'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya pasó ({report.denials})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* External Nav & Share */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-blue-600/30"
            >
              <span>GMaps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-cyan-600/30"
            >
              <span>Waze</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="min-h-[44px] rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-emerald-600/30"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Admin / Author Remove Action */}
          {canDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteClick}
              className="min-h-[44px] w-full rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Retirando alerta...' : 'Retirar alerta del mapa'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
