import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import type { MobilityReport, UserRole } from './src/types/moviradar.ts';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.moviradar_data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure storage directories exist
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const SEED_REPORTS: MobilityReport[] = [
  {
    id: 'rep_official_bga_1',
    title: 'Control Vial Permanente · Carrera 27',
    category: 'checkpoint',
    description: 'Ubicación fija oficial: Reducción de velocidad y control preventivo de tránsito frente al Parque Turbay.',
    location: 'Carrera 27 con Calle 36, Bucaramanga',
    gpsCoords: { lat: 7.1215, lng: -73.1185 },
    reportedAt: 'Fija · Oficial',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    authorId: 'usr_admin_oficial',
    authorName: 'Centro de Control MoviRadar',
    authorRole: 'admin',
    authorReputation: 100,
    isFixed: true,
    isOfficial: true,
    confirmations: 38,
    denials: 0,
    votedUserIds: {},
    status: 'active',
  },
  {
    id: 'rep_bga_1',
    title: 'Accidente leve sentido sur-norte',
    category: 'accident',
    description: 'Choque simple entre taxi y particular en carril derecho, movilidad reducida a un carril.',
    location: 'Viaducto García Cadena',
    gpsCoords: { lat: 7.1058, lng: -73.1194 },
    reportedAt: 'Hace 5 min',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    authorId: 'usr_citizen_1',
    authorName: 'Jhonatan R. (Taxista)',
    authorRole: 'citizen',
    authorReputation: 98,
    isFixed: false,
    isOfficial: false,
    confirmations: 16,
    denials: 1,
    votedUserIds: {},
    status: 'active',
  },
  {
    id: 'rep_bga_2',
    title: 'Hueco profundo en carril izquierdo',
    category: 'hazard',
    description: 'Hueco peligroso sin señalización bajando hacia La Flora; precaución motos y taxis.',
    location: 'Transversal Oriental · La Flora',
    gpsCoords: { lat: 7.1108, lng: -73.1129 },
    reportedAt: 'Hace 11 min',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    authorId: 'usr_citizen_2',
    authorName: 'Camilo G.',
    authorRole: 'citizen',
    authorReputation: 96,
    isFixed: false,
    isOfficial: false,
    confirmations: 12,
    denials: 0,
    votedUserIds: {},
    status: 'active',
  },
  {
    id: 'rep_bga_3',
    title: 'Vía cerrada por obras de acueducto',
    category: 'roadClosed',
    description: 'Cierre total entre carreras 19 y 21. Tomar desvío por la Calle 34 hacia el centro.',
    location: 'Av. Quebradaseca con Cra 20',
    gpsCoords: { lat: 7.1246, lng: -73.1249 },
    reportedAt: 'Hace 18 min',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    authorId: 'usr_citizen_3',
    authorName: 'Sandra P.',
    authorRole: 'citizen',
    authorReputation: 95,
    isFixed: false,
    isOfficial: false,
    confirmations: 19,
    denials: 0,
    votedUserIds: {},
    status: 'active',
  },
  {
    id: 'rep_bga_4',
    title: 'Trancón fuerte altura Cacique',
    category: 'congestion',
    description: 'Flujo vehicular muy lento hacia Provenza y Autopista a Floridablanca.',
    location: 'Autopista Floridablanca · Cacique',
    gpsCoords: { lat: 7.0992, lng: -73.1095 },
    reportedAt: 'Hace 24 min',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    authorId: 'usr_citizen_4',
    authorName: 'Andrés V.',
    authorRole: 'citizen',
    authorReputation: 97,
    isFixed: false,
    isOfficial: false,
    confirmations: 14,
    denials: 1,
    votedUserIds: {},
    status: 'active',
  },
];

function loadReports(): MobilityReport[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const raw = fs.readFileSync(REPORTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading persisted reports:', err);
  }
  saveReports(SEED_REPORTS);
  return [...SEED_REPORTS];
}

function saveReports(reports: MobilityReport[]): void {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving reports:', err);
  }
}

let reportsStore: MobilityReport[] = loadReports();

function getActiveReports(): MobilityReport[] {
  const now = Date.now();
  const twelveHoursMs = 1000 * 60 * 60 * 12;

  return reportsStore
    .filter((r) => {
      if (r.status === 'resolved') return false;
      if (r.isFixed) return true; // Ubicaciones fijas de Admin no expiran
      if (r.createdAtIso) {
        const age = now - new Date(r.createdAtIso).getTime();
        if (age > twelveHoursMs) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isFixed && !b.isFixed) return -1;
      if (!a.isFixed && b.isFixed) return 1;
      const tA = a.createdAtIso ? new Date(a.createdAtIso).getTime() : 0;
      const tB = b.createdAtIso ? new Date(b.createdAtIso).getTime() : 0;
      return tB - tA;
    });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const broadcast = (payload: Record<string, unknown>) => {
    const message = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  const broadcastPresence = () => {
    broadcast({
      type: 'presence:update',
      count: wss.clients.size,
    });
  };

  wss.on('connection', (ws) => {
    // Send initial authoritative state immediately
    ws.send(
      JSON.stringify({
        type: 'reports:init',
        reports: getActiveReports(),
        activeUsers: wss.clients.size,
      })
    );
    broadcastPresence();

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (msg.type === 'sync:request') {
          ws.send(
            JSON.stringify({
              type: 'reports:init',
              reports: getActiveReports(),
              activeUsers: wss.clients.size,
            })
          );
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      broadcastPresence();
    });
  });

  // ---------------------------------------------------------------------------
  // REST API Endpoints for Reports & Multimedia Persistence
  // ---------------------------------------------------------------------------

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', activeUsers: wss.clients.size, reportsCount: getActiveReports().length });
  });

  app.get('/api/reports', (_req, res) => {
    res.json({ reports: getActiveReports(), activeUsers: wss.clients.size });
  });

  app.post('/api/media', (req, res) => {
    try {
      const { fileName, mimeType, base64Data } = req.body as {
        fileName?: string;
        mimeType?: string;
        base64Data?: string;
      };

      if (!mimeType || !base64Data) {
        return res.status(400).json({ error: 'Archivo multimedia inválido.' });
      }

      const isImage = mimeType.startsWith('image/');
      const isVideo = mimeType.startsWith('video/');
      if (!isImage && !isVideo) {
        return res.status(400).json({ error: 'Solo se permiten imágenes o videos cortos.' });
      }

      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Limit size to 22MB decoded
      if (buffer.length > 22 * 1024 * 1024) {
        return res.status(413).json({ error: 'El archivo excede el límite máximo de 20 MB.' });
      }

      const extFromMime = mimeType.split('/')[1]?.split(';')[0]?.replace(/[^a-z0-9]/gi, '') || (isVideo ? 'mp4' : 'jpg');
      const ext = fileName && path.extname(fileName) ? path.extname(fileName).replace(/[^a-z0-9.]/gi, '') : `.${extFromMime}`;
      const uniqueName = `media_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
      const targetPath = path.join(UPLOADS_DIR, uniqueName);

      fs.writeFileSync(targetPath, buffer);

      return res.status(201).json({
        mediaUrl: `/api/media/${uniqueName}`,
        mediaType: isVideo ? 'video' : 'image',
      });
    } catch (err) {
      console.error('Error uploading media:', err);
      return res.status(500).json({ error: 'Error al procesar archivo multimedia.' });
    }
  });

  app.get('/api/media/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const fullPath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Archivo no encontrado.' });
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(fullPath);
  });

  app.post('/api/reports', (req, res) => {
    try {
      const body = req.body as Partial<MobilityReport>;

      if (!body.title || !body.category || !body.gpsCoords) {
        return res.status(400).json({ error: 'Faltan campos obligatorios del reporte.' });
      }

      const id = body.id || `rep_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;

      // Idempotency check
      const existing = reportsStore.find((r) => r.id === id);
      if (existing) {
        return res.status(200).json({ report: existing });
      }

      const authorRole: UserRole = body.authorRole === 'admin' ? 'admin' : 'citizen';
      const isFixed = authorRole === 'admin' && Boolean(body.isFixed);
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const newReport: MobilityReport = {
        id,
        title: body.title.trim(),
        category: body.category,
        description: (body.description || 'Alerta ciudadana en tiempo real.').trim(),
        location: (body.location || `${body.gpsCoords.lat.toFixed(5)}, ${body.gpsCoords.lng.toFixed(5)}`).trim(),
        gpsCoords: {
          lat: Number(body.gpsCoords.lat),
          lng: Number(body.gpsCoords.lng),
        },
        reportedAt: isFixed ? `Fija · ${timeFormatted}` : timeFormatted,
        createdAtIso: now.toISOString(),
        authorId: body.authorId || 'usr_anonymous',
        authorName: body.authorName || (authorRole === 'admin' ? 'Administrador General' : 'Ciudadano'),
        authorRole,
        authorReputation: body.authorReputation ?? (authorRole === 'admin' ? 100 : 95),
        isFixed,
        isOfficial: isFixed || authorRole === 'admin',
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType,
        confirmations: 1,
        denials: 0,
        votedUserIds: body.authorId ? { [body.authorId]: 'confirm' } : {},
        status: 'active',
      };

      reportsStore.unshift(newReport);
      saveReports(reportsStore);

      broadcast({
        type: 'report:created',
        report: newReport,
      });

      return res.status(201).json({ report: newReport });
    } catch (err) {
      console.error('Error creating report:', err);
      return res.status(500).json({ error: 'No se pudo publicar el reporte.' });
    }
  });

  app.post('/api/reports/:id/vote', (req, res) => {
    const { id } = req.params;
    const { userId, vote } = req.body as { userId?: string; vote?: 'confirm' | 'deny' };

    if (!userId || (vote !== 'confirm' && vote !== 'deny')) {
      return res.status(400).json({ error: 'Voto inválido.' });
    }

    const index = reportsStore.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Reporte no encontrado.' });
    }

    const current = { ...reportsStore[index] };
    const votesMap = { ...(current.votedUserIds || {}) };
    const previousVote = votesMap[userId];

    if (previousVote === vote) {
      return res.json({ report: current });
    }

    if (previousVote === 'confirm') {
      current.confirmations = Math.max(0, current.confirmations - 1);
    } else if (previousVote === 'deny') {
      current.denials = Math.max(0, current.denials - 1);
    }

    if (vote === 'confirm') {
      current.confirmations += 1;
    } else {
      current.denials += 1;
    }

    votesMap[userId] = vote;
    current.votedUserIds = votesMap;

    // Citizen reports auto-resolve if 3+ users mark "Ya pasó" and denials > confirmations
    if (!current.isFixed && current.denials >= 3 && current.denials > current.confirmations) {
      current.status = 'resolved';
    }

    reportsStore[index] = current;
    saveReports(reportsStore);

    if (current.status === 'resolved') {
      broadcast({ type: 'report:deleted', reportId: current.id });
    } else {
      broadcast({ type: 'report:updated', report: current });
    }

    return res.json({ report: current });
  });

  app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const index = reportsStore.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Reporte no encontrado.' });
    }

    reportsStore.splice(index, 1);
    saveReports(reportsStore);

    broadcast({ type: 'report:deleted', reportId: id });
    return res.json({ deleted: true, reportId: id });
  });

  // ---------------------------------------------------------------------------
  // Vite Middleware (Development) or Static Serving (Production)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MoviRadar Real-Time PWA Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
