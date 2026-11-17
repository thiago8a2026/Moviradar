export type MobileScreen = 
  | 'welcome' 
  | 'login' 
  | 'register' 
  | 'forgot_password' 
  | 'home';

export type HomeTab = 
  | 'inicio' 
  | 'mapa' 
  | 'reportar' 
  | 'puntos'
  | 'notificaciones' 
  | 'perfil';

export type UserRole = 'citizen' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  reputationScore: number;
  isVerifiedCitizen: boolean;
  subscriptionTier: 'free';
  reportsCount: number;
  confirmedCount: number;
  joinedDate: string;
}

export type ReportCategory = 
  | 'checkpoint'      // Retén
  | 'accident'        // Accidente
  | 'congestion'      // Trancón
  | 'police'          // Policía
  | 'roadClosed'      // Vía Cerrada
  | 'construction'    // Obras en la vía
  | 'stalledVehicle'  // Vehículo varado
  | 'hazard'          // Peligro / Bache
  | 'other';          // Otro acontecimiento

export interface MobilityReport {
  id: string;
  title: string;
  category: ReportCategory;
  description: string;
  location: string;
  distance?: string;
  coordinates?: { x: number; y: number };
  gpsCoords: { lat: number; lng: number };
  reportedAt: string;
  createdAtIso?: string;
  authorId?: string;
  authorName: string;
  authorRole?: UserRole;
  authorReputation: number;
  isFixed?: boolean;
  isOfficial?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  confirmations: number;
  denials: number;
  votedUserIds?: Record<string, 'confirm' | 'deny'>;
  hasUserConfirmed?: boolean;
  hasUserDenied?: boolean;
  status?: 'active' | 'resolved';
  pendingSync?: boolean;
}

export type FrequentPointCategory = 'home' | 'work' | 'favorite' | 'stop' | 'station' | 'hazard';

export interface FrequentPoint {
  id: string;
  name: string;
  category: FrequentPointCategory;
  lat: number;
  lng: number;
  address?: string;
  createdAt: string;
  notes?: string;
}

export type GpsStatus = 'loading' | 'active' | 'denied' | 'disabled' | 'error';

export interface GpsPositionData {
  lat: number;
  lng: number;
  accuracy: number | null; // en metros
  speed: number | null;    // en km/h
  heading: number | null;  // grados 0-360
  altitude: number | null;
  timestamp: number;
}

export interface ToastAlert {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'offline';
