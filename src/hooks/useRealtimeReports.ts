import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MobilityReport,
  RealtimeConnectionStatus,
  ReportCategory,
  UserRole,
} from '../types/moviradar';
import { ProcessedMedia } from '../utils/mediaUtils';

export interface CreateReportInput {
  title: string;
  category: ReportCategory;
  description: string;
  location: string;
  gpsCoords: { lat: number; lng: number };
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorReputation: number;
  isFixed?: boolean;
}

interface PendingQueuedReport {
  localId: string;
  input: CreateReportInput;
  media?: {
    fileName: string;
    mimeType: string;
    base64Data: string;
    mediaType: 'image' | 'video';
  } | null;
  createdAtIso: string;
}

const CACHED_REPORTS_KEY = 'moviradar_cached_reports_v1';
const PENDING_QUEUE_KEY = 'moviradar_pending_reports_v1';

function readCachedReports(): MobilityReport[] {
  try {
    const raw = localStorage.getItem(CACHED_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedReports(items: MobilityReport[]): void {
  try {
    const syncedOnly = items.filter((r) => !r.pendingSync).slice(0, 120);
    localStorage.setItem(CACHED_REPORTS_KEY, JSON.stringify(syncedOnly));
  } catch {
    // Ignore quota errors
  }
}

function readPendingQueue(): PendingQueuedReport[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingQueue(queue: PendingQueuedReport[]): void {
  try {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Si la cuota de localStorage excede por un archivo multimedia pesado, guardar sin media base64
    try {
      const stripped = queue.map((q) => ({ ...q, media: null }));
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(stripped));
    } catch {
      // Ignore unrecoverable quota error
    }
  }
}

function toPendingMobilityReport(item: PendingQueuedReport): MobilityReport {
  return {
    id: item.localId,
    title: item.input.title,
    category: item.input.category,
    description: item.input.description,
    location: item.input.location,
    gpsCoords: item.input.gpsCoords,
    reportedAt: 'Pendiente de sincronizar',
    createdAtIso: item.createdAtIso,
    authorId: item.input.authorId,
    authorName: item.input.authorName,
    authorRole: item.input.authorRole,
    authorReputation: item.input.authorReputation,
    isFixed: item.input.isFixed,
    isOfficial: item.input.authorRole === 'admin' && item.input.isFixed,
    mediaUrl: item.media?.base64Data,
    mediaType: item.media?.mediaType,
    confirmations: 1,
    denials: 0,
    hasUserConfirmed: true,
    pendingSync: true,
  };
}

function mergeServerAndPending(
  serverReports: MobilityReport[],
  pendingQueue: PendingQueuedReport[]
): MobilityReport[] {
  const pendingReports = pendingQueue
    .filter((p) => !serverReports.some((s) => s.id === p.localId))
    .map(toPendingMobilityReport);

  const fixed = serverReports.filter((r) => r.isFixed);
  const regular = serverReports.filter((r) => !r.isFixed);
  return [...pendingReports, ...fixed, ...regular];
}

export function useRealtimeReports(
  currentUserId: string,
  onSyncedPending?: (syncedCount: number) => void
) {
  const [reports, setReports] = useState<MobilityReport[]>(() => {
    const cached = readCachedReports();
    const pending = readPendingQueue();
    return mergeServerAndPending(cached, pending);
  });
  const [pendingCount, setPendingCount] = useState<number>(() => readPendingQueue().length);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'connecting'
  );
  const [activeUsers, setActiveUsers] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);
  const onSyncedPendingRef = useRef(onSyncedPending);
  onSyncedPendingRef.current = onSyncedPending;

  const hydrateUserVotes = useCallback(
    (items: MobilityReport[]): MobilityReport[] =>
      items.map((rep) => {
        const myVote = rep.votedUserIds?.[currentUserId];
        return {
          ...rep,
          hasUserConfirmed: myVote === 'confirm',
          hasUserDenied: myVote === 'deny',
        };
      }),
    [currentUserId]
  );

  const sendReportPayloadToServer = useCallback(
    async (
      reportId: string,
      input: CreateReportInput,
      media?: {
        fileName: string;
        mimeType: string;
        base64Data: string;
        mediaType: 'image' | 'video';
      } | null
    ): Promise<MobilityReport> => {
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | undefined;

      if (media) {
        const uploadRes = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: media.fileName,
            mimeType: media.mimeType,
            base64Data: media.base64Data,
          }),
        });

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json().catch(() => ({}));
          throw new Error(errJson.error || 'Error al subir archivo multimedia.');
        }

        const uploaded = await uploadRes.json();
        mediaUrl = uploaded.mediaUrl;
        mediaType = uploaded.mediaType;
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          ...input,
          mediaUrl,
          mediaType,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'No se pudo publicar el reporte.');
      }

      const data = await res.json();
      return hydrateUserVotes([data.report])[0];
    },
    [hydrateUserVotes]
  );

  const syncPendingReports = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const initialQueue = readPendingQueue();
    if (initialQueue.length === 0) return;

    isSyncingRef.current = true;
    let syncedCount = 0;

    try {
      for (const item of initialQueue) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) break;
        try {
          const created = await sendReportPayloadToServer(item.localId, item.input, item.media);
          syncedCount += 1;

          // Remover inmediatamente del queue en localStorage tras sincronizar
          const updatedQueue = readPendingQueue().filter((q) => q.localId !== item.localId);
          writePendingQueue(updatedQueue);
          setPendingCount(updatedQueue.length);

          // Actualizar reporte en estado y caché local
          setReports((prev) => {
            const withoutPending = prev.filter((r) => r.id !== item.localId);
            const next = created.isFixed
              ? [created, ...withoutPending]
              : [
                  ...withoutPending.filter((r) => r.isFixed || r.pendingSync),
                  created,
                  ...withoutPending.filter((r) => !r.isFixed && !r.pendingSync),
                ];
            writeCachedReports(next);
            return next;
          });
        } catch {
          // Detener reintentos hasta el próximo evento online o intervalo
          break;
        }
      }

      if (syncedCount > 0) {
        onSyncedPendingRef.current?.(syncedCount);
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [sendReportPayloadToServer]);

  // Fetch initial reports via HTTP as fast fallback
  const fetchReportsHttp = useCallback(async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.reports)) {
          const hydrated = hydrateUserVotes(data.reports);
          writeCachedReports(hydrated);
          const pending = readPendingQueue();
          setReports(mergeServerAndPending(hydrated, pending));
        }
        if (typeof data.activeUsers === 'number') {
          setActiveUsers(data.activeUsers);
        }
      }
    } catch {
      // Offline: mantener marcadores previos desde caché local
    }
  }, [hydrateUserVotes]);

  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) {
      setConnectionStatus('offline');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnectionStatus('connected');
        syncPendingReports();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'reports:init' && Array.isArray(payload.reports)) {
            const hydrated = hydrateUserVotes(payload.reports);
            writeCachedReports(hydrated);
            const pending = readPendingQueue();
            setReports(mergeServerAndPending(hydrated, pending));
            if (typeof payload.activeUsers === 'number') {
              setActiveUsers(payload.activeUsers);
            }
          } else if (payload.type === 'report:created' && payload.report) {
            const incoming = hydrateUserVotes([payload.report])[0];
            setReports((prev) => {
              let next: MobilityReport[];
              if (prev.some((r) => r.id === incoming.id)) {
                next = prev.map((r) => (r.id === incoming.id ? incoming : r));
              } else if (incoming.isFixed) {
                next = [incoming, ...prev];
              } else {
                const pinned = prev.filter((r) => r.isFixed || r.pendingSync);
                const regular = prev.filter((r) => !r.isFixed && !r.pendingSync);
                next = [...pinned, incoming, ...regular];
              }
              writeCachedReports(next);
              return next;
            });
          } else if (payload.type === 'report:updated' && payload.report) {
            const updated = hydrateUserVotes([payload.report])[0];
            setReports((prev) => {
              const next = prev.map((r) => (r.id === updated.id ? updated : r));
              writeCachedReports(next);
              return next;
            });
          } else if (payload.type === 'report:deleted' && payload.reportId) {
            setReports((prev) => {
              const next = prev.filter((r) => r.id !== payload.reportId);
              writeCachedReports(next);
              return next;
            });
          } else if (payload.type === 'presence:update' && typeof payload.count === 'number') {
            setActiveUsers(payload.count);
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!navigator.onLine) {
          setConnectionStatus('offline');
          return;
        }
        setConnectionStatus('reconnecting');
        const delay = Math.min(1000 * Math.pow(1.6, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setConnectionStatus('offline');
    }
  }, [hydrateUserVotes, syncPendingReports]);

  useEffect(() => {
    fetchReportsHttp();
    connectWebSocket();
    syncPendingReports();

    const handleOnline = () => {
      setConnectionStatus('connecting');
      fetchReportsHttp();
      connectWebSocket();
      syncPendingReports();
    };
    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const pingInterval = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
      if (navigator.onLine && readPendingQueue().length > 0) {
        syncPendingReports();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearInterval(pingInterval);
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [fetchReportsHttp, connectWebSocket, syncPendingReports]);

  // Re-hydrate vote flags when currentUserId changes
  useEffect(() => {
    setReports((prev) => hydrateUserVotes(prev));
  }, [hydrateUserVotes]);

  const queueOfflineReport = useCallback(
    (
      reportId: string,
      input: CreateReportInput,
      media?: ProcessedMedia | null
    ): MobilityReport => {
      const queuedItem: PendingQueuedReport = {
        localId: reportId,
        input,
        media: media
          ? {
              fileName: media.fileName,
              mimeType: media.mimeType,
              base64Data: media.base64Data,
              mediaType: media.mediaType,
            }
          : null,
        createdAtIso: new Date().toISOString(),
      };

      const nextQueue = [...readPendingQueue(), queuedItem];
      writePendingQueue(nextQueue);
      setPendingCount(nextQueue.length);

      const localReport = toPendingMobilityReport(queuedItem);
      setReports((prev) => [localReport, ...prev]);
      return localReport;
    },
    []
  );

  const createReport = useCallback(
    async (input: CreateReportInput, media?: ProcessedMedia | null): Promise<MobilityReport> => {
      setIsSubmitting(true);
      const reportId = `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return queueOfflineReport(reportId, input, media);
        }

        const created = await sendReportPayloadToServer(
          reportId,
          input,
          media
            ? {
                fileName: media.fileName,
                mimeType: media.mimeType,
                base64Data: media.base64Data,
                mediaType: media.mediaType,
              }
            : null
        );

        // Optimistic / idempotent update
        setReports((prev) => {
          let next: MobilityReport[];
          if (prev.some((r) => r.id === created.id)) {
            next = prev.map((r) => (r.id === created.id ? created : r));
          } else if (created.isFixed) {
            next = [created, ...prev];
          } else {
            const pinned = prev.filter((r) => r.isFixed || r.pendingSync);
            const regular = prev.filter((r) => !r.isFixed && !r.pendingSync);
            next = [...pinned, created, ...regular];
          }
          writeCachedReports(next);
          return next;
        });

        return created;
      } catch (err) {
        // Si falló por pérdida de conexión / red, guardar temporalmente en caché local
        const isNetworkError =
          (typeof navigator !== 'undefined' && !navigator.onLine) ||
          err instanceof TypeError ||
          (err instanceof Error && /network|fetch|offline|failed to fetch/i.test(err.message));

        if (isNetworkError) {
          return queueOfflineReport(reportId, input, media);
        }
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [queueOfflineReport, sendReportPayloadToServer]
  );

  const voteReport = useCallback(
    async (reportId: string, vote: 'confirm' | 'deny'): Promise<MobilityReport | null> => {
      const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, vote }),
      });

      if (!res.ok) {
        throw new Error('Error al registrar tu voto.');
      }

      const data = await res.json();
      const updated = hydrateUserVotes([data.report])[0];

      setReports((prev) => {
        const next =
          updated.status === 'resolved'
            ? prev.filter((r) => r.id !== updated.id)
            : prev.map((r) => (r.id === updated.id ? updated : r));
        writeCachedReports(next);
        return next;
      });
      return updated;
    },
    [currentUserId, hydrateUserVotes]
  );

  const deleteReport = useCallback(async (reportId: string): Promise<void> => {
    const pendingQueue = readPendingQueue();
    if (pendingQueue.some((p) => p.localId === reportId)) {
      const nextQueue = pendingQueue.filter((p) => p.localId !== reportId);
      writePendingQueue(nextQueue);
      setPendingCount(nextQueue.length);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      return;
    }

    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('No se pudo retirar la alerta.');
    }
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== reportId);
      writeCachedReports(next);
      return next;
    });
  }, []);

  return {
    reports,
    connectionStatus,
    activeUsers,
    isSubmitting,
    pendingCount,
    createReport,
    voteReport,
    deleteReport,
    refreshReports: fetchReportsHttp,
    syncPendingReports,
  };
}
