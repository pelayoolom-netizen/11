import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react';
import { DEBATE_TOPICS_300 } from '../data/debateTopics';
import { COUNTRIES_ES, LANGUAGES_ES, formatDuration } from '../lib/perspectives';
import { PerspectiveCompass } from './PerspectiveCompass';
import type {
  AIJudgeReport,
  AvailabilityStatus,
  DebateSession,
  IdeologicalProfile,
  PublicProfile,
  UserAccount,
} from '../types';

/* ============================================================================
 * 1. RESUMEN / OVERVIEW
 * ============================================================================ */

interface OverviewViewProps {
  userAccount: UserAccount;
  publicProfile: PublicProfile;
  ideologicalProfile: IdeologicalProfile | null;
  debates: DebateSession[];
  loadingDebates: boolean;
  onFindDebate: () => void;
  onOpenTest: () => void;
  onOpenProfile: () => void;
  onOpenHistory: () => void;
  onDebateTopic: (topicTitle: string) => void;
  onUpdateAvailability: (status: AvailabilityStatus) => Promise<void>;
}

export function OverviewView({
  userAccount,
  publicProfile,
  ideologicalProfile,
  debates,
  loadingDebates,
  onFindDebate,
  onOpenTest,
  onOpenProfile,
  onOpenHistory,
  onDebateTopic,
  onUpdateAvailability,
}: OverviewViewProps) {
  const completedCount = debates.filter((d) => d.status === 'completed').length;
  const totalMinutes = Math.round(
    debates.reduce((acc, d) => acc + (d.durationSeconds || 0), 0) / 60
  );

  const recommendedTopics = useMemo(
    () => DEBATE_TOPICS_300.filter((t) => t.currentAffairs || t.popular).slice(0, 3),
    []
  );

  const badges = publicProfile.badges || [];

  return (
    <div className="space-y-8">
      {/* Cabecera de bienvenida */}
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
            Panel de participante · {userAccount.country}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
            Bienvenido, {userAccount.displayName}
          </h1>
          <p className="text-sm text-[#777367] max-w-xl">
            Nivel dialéctico <strong className="text-[#292820]">{publicProfile.level}</strong> · ELO{' '}
            <span className="font-mono-tabular text-[#79613B] font-semibold">{publicProfile.elo}</span>. Prepárate para contrastar argumentos con interlocutores de opiniones distintas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <select
            value={userAccount.availability}
            onChange={(e) => onUpdateAvailability(e.target.value as AvailabilityStatus)}
            aria-label="Estado de disponibilidad"
            className="px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-xs text-[#292820] focus:outline-none focus:border-[#A18450]"
          >
            <option value="available">Estado: Disponible para debatir</option>
            <option value="studying">Estado: Preparando argumentos</option>
            <option value="away">Estado: Ausente</option>
          </select>

          <button
            type="button"
            onClick={onFindDebate}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm transition-colors cursor-pointer"
          >
            Buscar un debate
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aviso si falta test */}
      {!ideologicalProfile && (
        <div className="bg-[#FAF9F5] border border-[#A18450] rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
              Siguiente paso recomendado
            </p>
            <p className="text-sm text-[#292820]">
              Completa el test ideológico (modalidad rápida de 4 minutos o completa) para desbloquear tu perfil en 9 ejes y el emparejamiento pregunta a pregunta.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenTest}
            className="px-5 py-2.5 bg-[#292820] text-white text-xs uppercase tracking-[0.16em] rounded-sm shrink-0 cursor-pointer"
          >
            Hacer test ideológico
          </button>
        </div>
      )}

      {/* Métricas reales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 shadow-editorial-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#777367]">Puntuación ELO</p>
          <p className="font-mono-tabular text-3xl font-semibold text-[#292820] mt-2">
            {publicProfile.elo}
          </p>
          <p className="text-xs text-[#A18450] mt-1">{publicProfile.level}</p>
        </div>

        <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 shadow-editorial-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#777367]">Debates completados</p>
          <p className="font-mono-tabular text-3xl font-semibold text-[#292820] mt-2">
            {Math.max(completedCount, publicProfile.debatesCount || 0)}
          </p>
          <p className="text-xs text-[#777367] mt-1">{totalMinutes} minutos dialogados</p>
        </div>

        <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 shadow-editorial-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#777367]">Racha constructiva</p>
          <p className="font-mono-tabular text-3xl font-semibold text-[#292820] mt-2 flex items-center gap-2">
            {publicProfile.streak || 0}
            <Flame className="w-5 h-5 text-[#A18450]" />
          </p>
          <p className="text-xs text-[#777367] mt-1">Sesiones valoradas</p>
        </div>

        <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 shadow-editorial-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#777367]">Insignias obtenidas</p>
          <p className="font-mono-tabular text-3xl font-semibold text-[#292820] mt-2 flex items-center gap-2">
            {badges.length}
            <Award className="w-5 h-5 text-[#A18450]" />
          </p>
          <p className="text-xs text-[#777367] mt-1 truncate">
            {badges[0] || 'Completa tu primer debate'}
          </p>
        </div>
      </div>

      {/* Dos columnas: resumen de brújula y debates recientes / sugeridos */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#A18450]" />
              <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                Resumen de perfil ideológico
              </h2>
            </div>
            <button
              type="button"
              onClick={ideologicalProfile ? onOpenProfile : onOpenTest}
              className="text-xs text-[#A18450] hover:underline cursor-pointer"
            >
              {ideologicalProfile ? 'Ver los 9 ejes' : 'Empezar test'}
            </button>
          </div>

          {ideologicalProfile ? (
            <div className="space-y-4">
              <p className="text-xs text-[#777367] leading-relaxed">
                {ideologicalProfile.summaryText}
              </p>
              <PerspectiveCompass axes={ideologicalProfile.axes} compact />
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-[#777367]">
                Aún no has generado tu mapa de 9 dimensiones.
              </p>
              <button
                type="button"
                onClick={onOpenTest}
                className="px-4 py-2 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-xs uppercase tracking-[0.14em] rounded-sm cursor-pointer"
              >
                Completar test
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-6">
          {/* Últimos debates */}
          <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-3">
              <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                Últimos debates
              </h2>
              <button
                type="button"
                onClick={onOpenHistory}
                className="text-xs text-[#A18450] hover:underline cursor-pointer"
              >
                Ver historial
              </button>
            </div>

            {loadingDebates ? (
              <p className="text-xs text-[#777367]">Cargando sesiones...</p>
            ) : debates.length === 0 ? (
              <p className="text-sm text-[#777367]">
                Todavía no has realizado ningún debate. Pulsa «Buscar un debate» para estrenar tu historial.
              </p>
            ) : (
              <div className="divide-y divide-[#E8E3D8]">
                {debates.slice(0, 3).map((d) => {
                  const rival = d.hostUid === userAccount.uid ? d.guestName : d.hostName;
                  return (
                    <div key={d.debateId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#292820] truncate">{d.topic}</p>
                        <p className="text-xs text-[#777367]">
                          Con {rival || 'Participante'} · {formatDuration(d.durationSeconds || 0)}
                        </p>
                      </div>
                      <span className="text-[11px] uppercase tracking-wider px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-[#79613B] shrink-0">
                        {d.status === 'completed' ? 'Completado' : 'Activo'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Temas recomendados */}
          <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
            <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
              Temas de actualidad sugeridos
            </h2>
            <div className="space-y-2.5">
              {recommendedTopics.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-3.5 flex items-center justify-between gap-3"
                >
                  <p className="text-xs font-medium text-[#292820] line-clamp-2">{t.title}</p>
                  <button
                    type="button"
                    onClick={() => onDebateTopic(t.title)}
                    className="px-3 py-1.5 bg-[#A18450] hover:bg-[#79613B] text-white text-[11px] uppercase tracking-wider rounded-sm shrink-0 cursor-pointer"
                  >
                    Debatir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. HISTORIAL DE DEBATES E INFORMES DEL JUEZ DE IA
 * ============================================================================ */

interface DebateHistoryViewProps {
  userAccount: UserAccount;
  debates: DebateSession[];
  loading: boolean;
  onFindDebate: () => void;
}

export function DebateHistoryView({
  userAccount,
  debates,
  loading,
  onFindDebate,
}: DebateHistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-7">
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
            Registro personal de conversaciones
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
            Historial de debates e informes
          </h1>
        </div>
        <button
          type="button"
          onClick={onFindDebate}
          className="px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.16em] font-medium rounded-sm cursor-pointer self-start"
        >
          Nuevo debate
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-8 text-sm text-[#777367]">
          Cargando historial de debates...
        </div>
      ) : debates.length === 0 ? (
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-10 text-center space-y-4">
          <p className="font-editorial text-2xl text-[#292820]">
            Todavía no tienes debates registrados
          </p>
          <p className="text-sm text-[#777367]">
            Cada conversación finalizada aparecerá aquí junto con tu reflexión y el informe imparcial del Juez de IA si otorgaste consentimiento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {debates.map((d) => {
            const isHost = d.hostUid === userAccount.uid;
            const rivalName = isHost ? d.guestName : d.hostName;
            const rivalCountry = isHost ? d.guestCountry : d.hostCountry;
            const myReflection = isHost ? d.reflectionHost : d.reflectionGuest;

            let report: AIJudgeReport | null = null;
            if (d.aiReportJson) {
              try {
                report = JSON.parse(d.aiReportJson) as AIJudgeReport;
              } catch {
                report = null;
              }
            }

            const expanded = expandedId === d.debateId;

            return (
              <div
                key={d.debateId}
                className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                      {d.format === 'guiado' ? 'Formato guiado' : 'Diálogo libre'} ·{' '}
                      {d.isRanked === false ? 'Sala amistosa (sin ELO)' : 'Puntuado en ELO'}
                    </p>
                    <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                      {d.topic}
                    </h2>
                    <p className="text-xs text-[#777367]">
                      Interlocutor: <strong className="text-[#292820]">{rivalName || 'Participante'}</strong>{' '}
                      ({rivalCountry || 'Internacional'}) · Duración: {formatDuration(d.durationSeconds || 0)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : d.debateId)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-xs text-[#292820] rounded-sm shrink-0 cursor-pointer self-start"
                  >
                    {expanded ? 'Ocultar detalles' : 'Ver informe y detalles'}
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {expanded && (
                  <div className="pt-4 border-t border-[#E8E3D8] space-y-5">
                    {myReflection && (
                      <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-[#A18450] font-semibold">
                          Tu reflexión privada
                        </p>
                        <p className="text-sm text-[#292820]">{myReflection}</p>
                      </div>
                    )}

                    {report ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                          <Scale className="w-4 h-4" />
                          Informe del Juez de IA (evaluación sin sesgo ideológico)
                        </div>
                        <p className="text-sm text-[#292820] leading-relaxed">
                          {report.resumenGeneral}
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                          {[report.participanteA, report.participanteB].map((p) => (
                            <div
                              key={p.name}
                              className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-2">
                                <span className="font-semibold text-sm text-[#292820]">
                                  {p.name}
                                </span>
                                <span className="font-mono-tabular text-sm font-semibold text-[#A18450]">
                                  {p.puntuacionGlobal}/100
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#777367]">
                                <span>Claridad: {p.claridad}</span>
                                <span>Coherencia: {p.coherencia}</span>
                                <span>Calidad pruebas: {p.calidadPruebas}</span>
                                <span>Resp. objeciones: {p.respuestaObjeciones}</span>
                                <span>Detec. contradic.: {p.deteccionContradicciones}</span>
                                <span>Respeto: {p.respeto}</span>
                                <span className="col-span-2">
                                  Reconocimiento de puntos válidos: {p.reconocimientoPuntosValidos}
                                </span>
                              </div>
                              <p className="text-xs text-[#292820] leading-relaxed">
                                {p.explicacion}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-white border border-[#E8E3D8] p-3 rounded-sm space-y-1">
                            <p className="font-semibold text-[#79613B]">Afirmaciones verificables</p>
                            <ul className="list-disc pl-4 text-[#777367] space-y-1">
                              {report.clasificacionAfirmaciones.afirmacionesVerificadas.map((a) => (
                                <li key={a}>{a}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white border border-[#E8E3D8] p-3 rounded-sm space-y-1">
                            <p className="font-semibold text-[#79613B]">No verificadas</p>
                            <ul className="list-disc pl-4 text-[#777367] space-y-1">
                              {report.clasificacionAfirmaciones.afirmacionesNoVerificadas.map((a) => (
                                <li key={a}>{a}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white border border-[#E8E3D8] p-3 rounded-sm space-y-1">
                            <p className="font-semibold text-[#79613B]">Opiniones expresadas</p>
                            <ul className="list-disc pl-4 text-[#777367] space-y-1">
                              {report.clasificacionAfirmaciones.opinionesExpresadas.map((a) => (
                                <li key={a}>{a}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#777367]">
                        Esta sesión no cuenta con informe del Juez de IA (no se otorgó consentimiento o no se registraron suficientes notas).
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 3. AJUSTES, PRIVACIDAD, TEST DE CÁMARA/MICRÓFONO Y ELIMINAR CUENTA
 * ============================================================================ */

interface SettingsViewProps {
  userAccount: UserAccount;
  onSaveAccount: (patch: {
    displayName: string;
    photoURL: string;
    country: string;
    city: string;
    bio: string;
    languages: string[];
    isPublicProfile: boolean;
    showAxesPublicly: boolean;
  }) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onSignOut: () => void;
}

export function SettingsView({
  userAccount,
  onSaveAccount,
  onDeleteAccount,
  onSignOut,
}: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(userAccount.displayName);
  const [photoURL, setPhotoURL] = useState(userAccount.photoURL || '');
  const [country, setCountry] = useState(userAccount.country);
  const [city, setCity] = useState(userAccount.city || '');
  const [bio, setBio] = useState(userAccount.bio || '');
  const [languages, setLanguages] = useState<string[]>(userAccount.languages || ['Español']);
  const [isPublicProfile, setIsPublicProfile] = useState(Boolean(userAccount.isPublicProfile));
  const [showAxesPublicly, setShowAxesPublicly] = useState(Boolean(userAccount.showAxesPublicly));

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Prueba de audio y vídeo
  const testVideoRef = useRef<HTMLVideoElement | null>(null);
  const testStreamRef = useRef<MediaStream | null>(null);
  const [testingAV, setTestingAV] = useState(false);
  const [avStatus, setAvStatus] = useState<string | null>(null);

  // Confirmación borrado de cuenta
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleLang = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang)
        ? prev.length > 1
          ? prev.filter((l) => l !== lang)
          : prev
        : prev.length < 5
          ? [...prev, lang]
          : prev
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      await onSaveAccount({
        displayName: displayName.trim() || userAccount.displayName,
        photoURL: photoURL.trim(),
        country,
        city: city.trim(),
        bio: bio.trim(),
        languages,
        isPublicProfile,
        showAxesPublicly,
      });
      setSavedMsg('Cambios guardados correctamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAVTest = async () => {
    if (testingAV) {
      testStreamRef.current?.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
      setTestingAV(false);
      setAvStatus('Prueba de cámara y micrófono detenida.');
      return;
    }

    setAvStatus(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      testStreamRef.current = stream;
      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
      }
      setTestingAV(true);
      setAvStatus('Cámara y micrófono detectados y operativos.');
    } catch {
      setAvStatus('No se pudo acceder a la cámara o micrófono. Revisa los permisos del navegador.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
          Cuenta, privacidad y equipo audiovisual
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
          Ajustes
        </h1>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E3D8] pb-3">
          <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
            Identidad y descripción personal
          </h2>
          <span className="font-mono-tabular text-xs text-[#777367]">
            @{userAccount.username}
          </span>
        </div>

        {savedMsg && (
          <div className="bg-[#FAF9F5] border border-[#A18450] text-xs text-[#292820] px-4 py-2.5 rounded-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#A18450]" />
            {savedMsg}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[#777367]">
              Nombre visible
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[#777367]">
              URL de fotografía de perfil (opcional)
            </span>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[#777367]">País</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
            >
              {COUNTRIES_ES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[#777367]">Ciudad</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-[0.14em] text-[#777367]">
            Breve presentación (máx. 320 caracteres)
          </span>
          <textarea
            rows={2}
            maxLength={320}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Temas de interés o enfoque con el que te gusta dialogar..."
            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
          />
        </label>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.14em] text-[#777367] block">
            Idiomas de debate
          </span>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES_ES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleLang(l)}
                className={`px-3 py-1.5 text-xs rounded-sm border cursor-pointer ${
                  languages.includes(l)
                    ? 'bg-[#292820] text-white border-[#292820]'
                    : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Privacidad granular */}
        <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Control de privacidad
          </div>
          <label className="flex items-start gap-3 text-sm text-[#292820] cursor-pointer">
            <input
              type="checkbox"
              checked={isPublicProfile}
              onChange={(e) => setIsPublicProfile(e.target.checked)}
              className="mt-1 accent-[#A18450]"
            />
            <span>
              <strong>Ficha pública buscable:</strong> permitir que otros usuarios me encuentren buscando @{userAccount.username} para enviarme solicitudes de amistad.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-[#292820] cursor-pointer">
            <input
              type="checkbox"
              checked={showAxesPublicly}
              onChange={(e) => setShowAxesPublicly(e.target.checked)}
              className="mt-1 accent-[#A18450]"
            />
            <span>
              <strong>Mostrar orientación general en perfil público:</strong> compartir una síntesis breve de mis ejes (tus respuestas individuales siguen siendo siempre privadas).
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer"
        >
          {saving ? 'Guardando...' : 'Guardar preferencias'}
        </button>
      </form>

      {/* Comprobación previa de cámara y micrófono */}
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#A18450]" />
            <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
              Comprobación de cámara y micrófono
            </h2>
          </div>
          <button
            type="button"
            onClick={handleToggleAVTest}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-xs uppercase tracking-[0.14em] rounded-sm cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#A18450]" />
            {testingAV ? 'Detener prueba' : 'Probar cámara y audio'}
          </button>
        </div>

        {avStatus && <p className="text-xs text-[#79613B]">{avStatus}</p>}

        {testingAV && (
          <div className="max-w-sm border border-[#E8E3D8] rounded-sm overflow-hidden bg-[#F3F0E9]">
            <video
              ref={testVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video object-cover -scale-x-100"
            />
          </div>
        )}
      </div>

      {/* Normas y eliminación de cuenta */}
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-5">
        <div className="space-y-2">
          <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
            Normas de convivencia y eliminación de datos
          </h2>
          <p className="text-xs text-[#777367] leading-relaxed">
            En ANTIRRATHETO rechazamos los insultos personales, amenazas o suplantaciones. Puedes bloquear o reportar a cualquier participante y eliminar íntegramente tu cuenta y todos tus registros en cualquier momento.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E8E3D8]">
          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] text-xs uppercase tracking-[0.16em] text-[#292820] rounded-sm cursor-pointer"
          >
            Cerrar sesión
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#C97B63] text-[#793B2B] text-xs uppercase tracking-[0.14em] rounded-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar cuenta y todos mis datos
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 bg-[#FAF9F5] border border-[#C97B63] p-3 rounded-sm">
              <AlertTriangle className="w-4 h-4 text-[#793B2B]" />
              <span className="text-xs text-[#793B2B]">
                ¿Confirmas borrar tu perfil, test y acceso?
              </span>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  await onDeleteAccount();
                }}
                className="px-3 py-1.5 bg-[#793B2B] text-white text-xs rounded-sm cursor-pointer"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar todo'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs text-[#777367] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
