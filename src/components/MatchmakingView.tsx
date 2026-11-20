import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Clock,
  Globe2,
  KeyRound,
  Scale,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEBATE_TOPICS_300 } from '../data/debateTopics';
import { QUESTION_META_MAP } from '../data/ideologicalTest';
import { formatAxesSummaryText } from '../lib/perspectives';
import type {
  DebateSession,
  IdeologicalProfile,
  MatchFoundEvent,
  PublicProfile,
  TestProgress,
  UserAccount,
} from '../types';

interface MatchmakingViewProps {
  userAccount: UserAccount;
  publicProfile: PublicProfile;
  ideologicalProfile: IdeologicalProfile | null;
  testProgress: TestProgress | null;
  initialTopic?: string | null;
  onGoToTest: () => void;
  onEnterDebate: (match: MatchFoundEvent) => void;
}

export function MatchmakingView({
  userAccount,
  publicProfile,
  ideologicalProfile,
  testProgress,
  initialTopic,
  onGoToTest,
  onEnterDebate,
}: MatchmakingViewProps) {
  const popularTitles = useMemo(
    () => DEBATE_TOPICS_300.filter((t) => t.popular || t.currentAffairs).slice(0, 14).map((t) => t.title),
    []
  );

  const [topic, setTopic] = useState<string>(initialTopic || 'Diálogo abierto');
  const [format, setFormat] = useState<'guiado' | 'libre'>('guiado');
  const [durationLimitMinutes, setDurationLimitMinutes] = useState<5 | 10 | 15>(10);
  const [matchStyle, setMatchStyle] = useState<'moderado' | 'maxima_discrepancia'>(
    'maxima_discrepancia'
  );

  const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [matchedEvent, setMatchedEvent] = useState<MatchFoundEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joiningPrivate, setJoiningPrivate] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  const parsedAnswers = useMemo(() => {
    const clean: Record<string, number> = {};
    if (testProgress?.answersJson) {
      try {
        const raw = JSON.parse(testProgress.answersJson) as Record<string, number | null>;
        for (const [k, v] of Object.entries(raw)) {
          if (typeof v === 'number') clean[k] = v;
        }
      } catch {
        // ignorar
      }
    }
    return clean;
  }, [testProgress]);

  const cleanupQueue = async () => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'queue:leave', uid: userAccount.uid }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    try {
      await deleteDoc(doc(db, 'matchmaking_queue', userAccount.uid));
    } catch {
      // ignorar si ya no existe
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'queue:leave', uid: userAccount.uid }));
        }
        wsRef.current.close();
      }
    };
  }, [userAccount.uid]);

  const handleStartSearch = async () => {
    setErrorMsg(null);
    setStatus('searching');
    setMatchedEvent(null);

    try {
      await deleteDoc(doc(db, 'matchmaking_queue', userAccount.uid)).catch(() => undefined);
      await setDoc(doc(db, 'matchmaking_queue', userAccount.uid), {
        uid: userAccount.uid,
        displayName: userAccount.displayName.slice(0, 80),
        country: userAccount.country.slice(0, 64),
        topic: topic.slice(0, 160),
        matchStyle,
        status: 'waiting',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // continuar con WebSocket aunque falle metadato auxiliar
    }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
    wsRef.current = ws;

    const axes = ideologicalProfile?.axes || {
      economia: 0,
      social: 0,
      libertadEstado: 0,
      territorial: 0,
      internacional: 0,
      intervencionismo: 0,
      ecologia: 0,
      seguridad: 0,
      tradicion: 0,
    };

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'queue:join',
          uid: userAccount.uid,
          displayName: userAccount.displayName,
          country: userAccount.country,
          elo: publicProfile.elo || 1200,
          level: publicProfile.level || 'Interlocutor',
          topic,
          format,
          durationLimitMinutes,
          matchStyle,
          stanceSummary: formatAxesSummaryText(axes),
          axes,
          answers: parsedAnswers,
          priorityAreas: testProgress?.priorityAreas || [],
          blockedUids: userAccount.blockedUids || [],
          recentOpponents: userAccount.recentOpponents || [],
          questionMeta: QUESTION_META_MAP,
        })
      );
    };

    ws.onmessage = async (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data) as Record<string, unknown>;
      } catch {
        return;
      }

      if (msg.type === 'queue:metrics') {
        setWaitingCount(Number(msg.waitingCount) || 0);
      } else if (msg.type === 'match:found') {
        const matchData = msg as unknown as MatchFoundEvent;
        setMatchedEvent(matchData);
        setStatus('matched');

        try {
          if (matchData.host.uid === userAccount.uid) {
            await setDoc(doc(db, 'debates', matchData.debateId), {
              debateId: matchData.debateId,
              roomName: matchData.roomName,
              topic: matchData.topic.slice(0, 160),
              format: matchData.format,
              durationLimitMinutes: matchData.durationLimitMinutes,
              isRanked: matchData.isRanked,
              allowSpectators: matchData.allowSpectators,
              status: 'ready',
              participantIds: [matchData.host.uid, matchData.guest.uid],
              hostUid: matchData.host.uid,
              guestUid: matchData.guest.uid,
              hostName: matchData.host.displayName.slice(0, 80),
              guestName: matchData.guest.displayName.slice(0, 80),
              hostCountry: matchData.host.country.slice(0, 64),
              guestCountry: matchData.guest.country.slice(0, 64),
              discrepancyTopics: (matchData.discrepancyTopics || [])
                .slice(0, 5)
                .map((s) => String(s).slice(0, 200)),
              durationSeconds: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await deleteDoc(doc(db, 'matchmaking_queue', userAccount.uid)).catch(() => undefined);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `debates/${matchData.debateId}`);
        }
      }
    };

    ws.onerror = () => {
      setErrorMsg('No se pudo conectar con el servicio de emparejamiento en tiempo real.');
      setStatus('idle');
    };
  };

  const handleCancelSearch = async () => {
    await cleanupQueue();
    setStatus('idle');
  };

  const handleJoinByInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inviteCodeInput.trim().toUpperCase();
    if (!clean) return;
    setErrorMsg(null);
    setJoiningPrivate(true);
    try {
      let d: DebateSession | null = null;
      const directSnap = await getDoc(doc(db, 'debates', clean));
      if (directSnap.exists()) {
        d = directSnap.data() as DebateSession;
      } else {
        const q = query(collection(db, 'debates'), where('inviteCode', '==', clean));
        const snap = await getDocs(q);
        if (!snap.empty) {
          d = snap.docs[0].data() as DebateSession;
        }
      }

      if (!d) {
        setErrorMsg('No existe ninguna sala privada con ese código de invitación.');
        return;
      }
      if (
        !d.participantIds.includes(userAccount.uid) &&
        d.participantIds.length < 2
      ) {
        await updateDoc(doc(db, 'debates', d.debateId), {
          participantIds: [...d.participantIds, userAccount.uid],
          guestUid: userAccount.uid,
          guestName: userAccount.displayName.slice(0, 80),
          guestCountry: userAccount.country.slice(0, 64),
          updatedAt: serverTimestamp(),
        });
      }

      onEnterDebate({
        debateId: d.debateId,
        roomName: d.roomName,
        topic: d.topic,
        format: d.format || 'libre',
        durationLimitMinutes: d.durationLimitMinutes || 10,
        isRanked: Boolean(d.isRanked),
        allowSpectators: Boolean(d.allowSpectators),
        contrastScore: 50,
        discrepancyTopics: d.discrepancyTopics || [d.topic],
        host: {
          uid: d.hostUid,
          displayName: d.hostName,
          country: d.hostCountry,
          elo: 1200,
          level: 'Anfitrión',
          stanceSummary: 'Sala privada por invitación',
        },
        guest: {
          uid: d.guestUid || userAccount.uid,
          displayName: d.guestName || userAccount.displayName,
          country: d.guestCountry || userAccount.country,
          elo: publicProfile.elo,
          level: publicProfile.level,
          stanceSummary: 'Participante invitado',
        },
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `debates/${clean}`);
    } finally {
      setJoiningPrivate(false);
    }
  };

  if (status === 'searching') {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-8 sm:p-12 shadow-editorial text-center space-y-7">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-[#E6D8B9] animate-ping opacity-60" />
            <span className="absolute inset-2 rounded-full border border-[#A18450]/40 animate-pulse" />
            <div className="w-14 h-14 rounded-full bg-[#FAF9F5] border border-[#A18450] flex items-center justify-center text-[#A18450]">
              <Compass className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
              Emparejamiento por discrepancia real
            </p>
            <h2 className="font-editorial text-3xl font-semibold text-[#292820]">
              Buscando tu perspectiva opuesta...
            </h2>
            <p className="text-sm text-[#777367] leading-relaxed">
              Analizando respuestas al test político, áreas prioritarias, nivel dialéctico y compatibilidad de formato ({format === 'guiado' ? 'guiado' : 'libre'}, {durationLimitMinutes} min).
            </p>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 flex items-center justify-between text-xs text-[#777367]">
            <span>Tema elegido: <strong className="text-[#292820]">{topic}</strong></span>
            <span className="font-mono-tabular text-[#79613B]">
              En espera: {waitingCount}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCancelSearch}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E8E3D8] hover:border-[#292820] text-[#777367] hover:text-[#292820] text-xs uppercase tracking-[0.16em] rounded-sm cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar búsqueda
          </button>
        </div>
      </div>
    );
  }

  if (status === 'matched' && matchedEvent) {
    const partner =
      matchedEvent.host.uid === userAccount.uid ? matchedEvent.guest : matchedEvent.host;

    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white border border-[#A18450] rounded-sm p-7 sm:p-10 shadow-editorial space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#A18450] font-semibold">
                Emparejamiento completado
              </p>
              <h2 className="font-editorial text-3xl font-semibold text-[#292820]">
                Tu compañero de debate está listo.
              </h2>
            </div>
            <div className="text-right">
              <p className="font-mono-tabular text-2xl font-semibold text-[#A18450]">
                {matchedEvent.contrastScore} %
              </p>
              <p className="text-[11px] text-[#777367]">Contraste político</p>
            </div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-[#777367]">
                Interlocutor asignado
              </p>
              <h3 className="font-editorial text-2xl font-semibold text-[#292820]">
                {partner.displayName}
              </h3>
              <p className="text-xs text-[#777367] inline-flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-[#A18450]" />
                {partner.country} · Nivel {partner.level}
              </p>
            </div>
            <span className="font-mono-tabular text-xs bg-white border border-[#E8E3D8] px-3 py-1.5 rounded-sm text-[#79613B]">
              ELO {partner.elo}
            </span>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
              Tres puntos probables de discrepancia para romper el hielo
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {matchedEvent.discrepancyTopics.map((item) => (
                <div
                  key={item}
                  className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-3 text-xs font-medium text-[#292820]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 text-xs text-[#777367] flex flex-wrap items-center justify-between gap-2">
            <span>
              Tema principal: <strong className="text-[#292820]">{matchedEvent.topic}</strong>
            </span>
            <span>
              Formato {matchedEvent.format} · {matchedEvent.durationLimitMinutes} minutos
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setMatchedEvent(null);
                setStatus('idle');
              }}
              className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-[#777367] hover:text-[#292820] cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => onEnterDebate(matchedEvent)}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer"
            >
              Entrar en la sala de vídeo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
          Emparejamiento inteligente 1 contra 1
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
          Buscar un debate
        </h1>
        <p className="text-sm text-[#777367] max-w-2xl">
          Comparamos tus respuestas reales y prioridades temáticas para encontrarte una persona con opiniones distintas, evitando cuentas bloqueadas y rivales muy recientes.
        </p>
      </div>

      {!ideologicalProfile && (
        <div className="bg-[#FAF9F5] border border-[#A18450] rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
              Recomendación previa
            </p>
            <p className="text-sm text-[#292820]">
              Todavía no has completado el test ideológico. Hacer el test rápido (4 min) mejora notablemente la precisión del emparejamiento pregunta a pregunta.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToTest}
            className="px-4 py-2.5 bg-[#292820] text-white text-xs uppercase tracking-[0.16em] rounded-sm shrink-0 cursor-pointer"
          >
            Hacer test ahora
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-white border border-[#C97B63] text-[#793B2B] text-xs p-4 rounded-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.16em] text-[#777367] font-medium block">
              Tema del debate
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
            >
              <option value="Diálogo abierto">Diálogo abierto (cualquier tema de discrepancia)</option>
              {(userAccount.favoriteTopics || []).map((fav) => (
                <option key={`fav_${fav}`} value={fav}>
                  ★ Favorito: {fav}
                </option>
              ))}
              {popularTitles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#777367] font-medium block">
                Formato de conversación
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('guiado')}
                  className={`p-3 rounded-sm border text-left cursor-pointer ${
                    format === 'guiado'
                      ? 'bg-[#292820] text-white border-[#292820]'
                      : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8]'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider">Guiado</p>
                  <p className="text-[11px] opacity-80 mt-0.5">6 fases y turnos medidos</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('libre')}
                  className={`p-3 rounded-sm border text-left cursor-pointer ${
                    format === 'libre'
                      ? 'bg-[#292820] text-white border-[#292820]'
                      : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8]'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider">Libre</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Diálogo fluido continuo</p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#777367] font-medium block">
                Duración de la sesión
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([5, 10, 15] as const).map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationLimitMinutes(mins)}
                    className={`py-3 px-2 rounded-sm border text-center cursor-pointer ${
                      durationLimitMinutes === mins
                        ? 'bg-[#292820] text-white border-[#292820]'
                        : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8]'
                    }`}
                  >
                    <span className="font-mono-tabular text-sm font-medium">{mins} min</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#777367] font-medium block">
              Criterio de contraste ideológico
            </span>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMatchStyle('maxima_discrepancia')}
                className={`p-4 rounded-sm border text-left cursor-pointer ${
                  matchStyle === 'maxima_discrepancia'
                    ? 'bg-[#FAF9F5] border-[#A18450]'
                    : 'bg-white border-[#E8E3D8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#292820]">
                    Máxima discrepancia
                  </span>
                  <Scale className="w-4 h-4 text-[#A18450]" />
                </div>
                <p className="text-xs text-[#777367] mt-1">
                  Prioriza rivales con posturas claramente opuestas en tus áreas importantes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMatchStyle('moderado')}
                className={`p-4 rounded-sm border text-left cursor-pointer ${
                  matchStyle === 'moderado'
                    ? 'bg-[#FAF9F5] border-[#A18450]'
                    : 'bg-white border-[#E8E3D8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#292820]">
                    Contraste moderado
                  </span>
                  <Sparkles className="w-4 h-4 text-[#A18450]" />
                </div>
                <p className="text-xs text-[#777367] mt-1">
                  Busca diferencias constructivas intermedias con mayor base común de partida.
                </p>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartSearch}
            className="w-full py-4 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Iniciar búsqueda de contrincante
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Sala privada con código */}
        <div className="lg:col-span-4 space-y-5">
          <form
            onSubmit={handleJoinByInvite}
            className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
              <KeyRound className="w-4 h-4" />
              Entrar con código privado
            </div>
            <p className="text-xs text-[#777367] leading-relaxed">
              ¿Te han enviado un enlace o código de sala privada amistosa (no puntuada en ELO)? Introdúcelo aquí.
            </p>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              placeholder="Ej. ANT-8492"
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm font-mono-tabular text-sm focus:outline-none focus:border-[#A18450]"
            />
            <button
              type="submit"
              disabled={joiningPrivate || !inviteCodeInput.trim()}
              className="w-full py-2.5 bg-[#292820] hover:bg-[#3F3D32] disabled:opacity-50 text-white text-xs uppercase tracking-[0.16em] rounded-sm cursor-pointer"
            >
              {joiningPrivate ? 'Buscando sala...' : 'Unirse a sala privada'}
            </button>
          </form>

          <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-5 space-y-2.5 text-xs text-[#777367]">
            <p className="font-semibold text-[#292820] uppercase tracking-[0.14em] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#A18450]" />
              Garantías de emparejamiento
            </p>
            <p>• No mostramos tus respuestas privadas al rival.</p>
            <p>• Excluimos automáticamente a usuarios bloqueados.</p>
            <p>• Penalizamos repetir con el mismo contrincante reciente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
