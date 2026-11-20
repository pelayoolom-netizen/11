export type AvailabilityStatus = 'available' | 'studying' | 'away';

export type AppView =
  | 'landing'
  | 'signin'
  | 'register'
  | 'overview'
  | 'test'
  | 'profile'
  | 'matchmaking'
  | 'topics'
  | 'groups'
  | 'ai_trainer'
  | 'friends'
  | 'knowledge'
  | 'history'
  | 'calendar'
  | 'settings'
  | 'call';

export type TestMode = 'rapido' | 'completo' | 'avanzado';

export type AnswerValue = -2 | -1 | 0 | 1 | 2 | null; // null = No tengo suficiente información

export type PoliticalArea =
  | 'Economía, impuestos y mercado'
  | 'Estado, servicios públicos y bienestar'
  | 'Derechos sociales y cuestiones culturales'
  | 'Inmigración, fronteras e integración'
  | 'Medioambiente, energía y cambio climático'
  | 'Seguridad, justicia y política penal'
  | 'Democracia, instituciones y organización territorial'
  | 'Política exterior, defensa y geopolítica'
  | 'Educación, sanidad y vivienda'
  | 'Tecnología, privacidad y libertades civiles';

export interface NineAxes {
  economia: number;         // -100 Izquierda económica ↔ +100 Derecha económica
  social: number;           // -100 Progresismo ↔ +100 Conservadurismo
  libertadEstado: number;   // -100 Libertad individual ↔ +100 Autoridad estatal
  territorial: number;      // -100 Centralización ↔ +100 Descentralización territorial
  internacional: number;    // -100 Apertura internacional ↔ +100 Soberanismo
  intervencionismo: number; // -100 Intervencionismo ↔ +100 Liberalismo económico
  ecologia: number;         // -100 Ecologismo ↔ +100 Prioridad al crecimiento económico
  seguridad: number;        // -100 Garantismo ↔ +100 Seguridad más dura
  tradicion: number;        // -100 Transformación social ↔ +100 Tradición
}

export interface TestQuestion {
  id: string;
  area: PoliticalArea;
  statement: string;
  isDilemma?: boolean;
  axisWeights: Partial<Record<keyof NineAxes, number>>;
  topicTag: string;
}

export interface UserAccount {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL?: string;
  country: string;
  city?: string;
  bio?: string;
  languages?: string[];
  favoriteTopics?: string[];
  friendUids?: string[];
  blockedUids?: string[];
  recentOpponents?: string[];
  availability: AvailabilityStatus;
  isPublicProfile?: boolean;
  showAxesPublicly?: boolean;
  aiConsentAccepted?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicProfile {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  country: string;
  city?: string;
  bio?: string;
  languages?: string[];
  availability: AvailabilityStatus;
  elo: number;
  level: string;
  debatesCount: number;
  streak?: number;
  badges?: string[];
  isPublicProfile?: boolean;
  showAxesPublicly?: boolean;
  publicAxesSummary?: string;
  updatedAt?: unknown;
}

export interface IdeologicalProfile {
  uid: string;
  modeCompleted: TestMode;
  answeredCount: number;
  axes: NineAxes;
  convictions: string[];
  tensions: string[];
  moderateTopics: string[];
  summaryText: string;
  updatedAt?: unknown;
}

export interface TestProgress {
  uid: string;
  mode: TestMode;
  currentIndex: number;
  answersJson: string;
  priorityAreas: PoliticalArea[];
  completed: boolean;
  updatedAt?: unknown;
}

export interface DebateTopicItem {
  id: string;
  title: string;
  description: string;
  category: PoliticalArea;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  pros: string[];
  cons: string[];
  followUpQuestions: string[];
  popular?: boolean;
  currentAffairs?: boolean;
}

export interface AIJudgeParticipantScore {
  name: string;
  claridad: number;
  coherencia: number;
  calidadPruebas: number;
  respuestaObjeciones: number;
  deteccionContradicciones: number;
  respeto: number;
  reconocimientoPuntosValidos: number;
  puntuacionGlobal: number;
  explicacion: string;
  mejoresArgumentos: string[];
}

export interface AIJudgeReport {
  resumenGeneral: string;
  participanteA: AIJudgeParticipantScore;
  participanteB: AIJudgeParticipantScore;
  clasificacionAfirmaciones: {
    afirmacionesVerificadas: string[];
    afirmacionesNoVerificadas: string[];
    opinionesExpresadas: string[];
  };
  eloDeltaA: number;
  eloDeltaB: number;
}

export interface DebateSession {
  debateId: string;
  roomName: string;
  inviteCode?: string;
  topic: string;
  format?: 'libre' | 'guiado';
  durationLimitMinutes?: number;
  isRanked?: boolean;
  allowSpectators?: boolean;
  status: 'ready' | 'active' | 'completed' | 'cancelled';
  participantIds: string[];
  hostUid: string;
  guestUid?: string;
  hostName: string;
  guestName?: string;
  hostCountry: string;
  guestCountry?: string;
  discrepancyTopics?: string[];
  durationSeconds: number;
  transcriptNotes?: string;
  aiReportJson?: string;
  reflectionHost?: string;
  reflectionGuest?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GroupMember {
  uid: string;
  displayName: string;
  country: string;
}

export interface GroupDebateRoom {
  roomId: string;
  inviteCode: string;
  topic: string;
  teamSize: number;
  durationMinutes: number;
  hostUid: string;
  hostName: string;
  status: 'open' | 'active' | 'completed';
  allowSpectators: boolean;
  isPrivate: boolean;
  teamA: GroupMember[];
  teamB: GroupMember[];
  speakerQueue?: GroupMember[];
  activeSpeakerUid?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FriendRequestItem {
  requestId: string;
  fromUid: string;
  fromName: string;
  fromUsername: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ScheduledDebateItem {
  eventId: string;
  ownerUid: string;
  title: string;
  topic: string;
  scheduledFor: string;
  format: '1v1' | 'grupo' | 'privada';
  durationMinutes: number;
  inviteCode?: string;
  createdAt?: unknown;
}

export interface UserNotificationItem {
  notifId: string;
  recipientUid: string;
  title: string;
  body: string;
  kind: 'friend' | 'invite' | 'report' | 'system';
  read: boolean;
  createdAt?: unknown;
}

export interface ProposedTopicItem {
  topicId: string;
  authorUid: string;
  authorName: string;
  title: string;
  description: string;
  category: PoliticalArea;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  status: 'pending_moderation' | 'approved' | 'rejected';
  createdAt?: unknown;
}

export interface MatchFoundEvent {
  debateId: string;
  roomName: string;
  topic: string;
  format: 'libre' | 'guiado';
  durationLimitMinutes: number;
  isRanked: boolean;
  allowSpectators: boolean;
  contrastScore: number;
  discrepancyTopics: string[];
  host: {
    uid: string;
    displayName: string;
    country: string;
    elo: number;
    level: string;
    stanceSummary: string;
  };
  guest: {
    uid: string;
    displayName: string;
    country: string;
    elo: number;
    level: string;
    stanceSummary: string;
  };
}
