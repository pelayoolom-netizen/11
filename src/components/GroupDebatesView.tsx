import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye,
  Hand,
  Mic,
  MicOff,
  PhoneOff,
  Plus,
  Shield,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEBATE_TOPICS_300 } from '../data/debateTopics';
import type { GroupDebateRoom, GroupMember, UserAccount } from '../types';

interface GroupDebatesViewProps {
  userAccount: UserAccount;
}

export function GroupDebatesView({ userAccount }: GroupDebatesViewProps) {
  const [rooms, setRooms] = useState<GroupDebateRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [topic, setTopic] = useState(DEBATE_TOPICS_300[0].title);
  const [teamSize, setTeamSize] = useState<number>(2);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteLookup, setInviteLookup] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sala activa audio/vídeo local + turno
  const [isSpectatorMode, setIsSpectatorMode] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'group_rooms'), where('isPrivate', '==', false));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as GroupDebateRoom)
          .filter((r) => r.status !== 'completed')
          .sort((a, b) => {
            const ta = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
            const tb = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
            return tb - ta;
          });
        setRooms(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'group_rooms')
    );
    return () => unsub();
  }, []);

  const [directRoom, setDirectRoom] = useState<GroupDebateRoom | null>(null);

  useEffect(() => {
    if (!activeRoomId) {
      setDirectRoom(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'group_rooms', activeRoomId),
      (snap) => {
        if (snap.exists()) setDirectRoom(snap.data() as GroupDebateRoom);
      },
      (err) => handleFirestoreError(err, OperationType.GET, `group_rooms/${activeRoomId}`)
    );
    return () => unsub();
  }, [activeRoomId]);

  const activeRoom = useMemo(
    () => directRoom || rooms.find((r) => r.roomId === activeRoomId) || null,
    [directRoom, rooms, activeRoomId]
  );

  useEffect(() => {
    if (!activeRoomId || isSpectatorMode) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        // Sin dispositivo o permiso denegado; el usuario ve aviso visual
      });

    return () => {
      cancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [activeRoomId, isSpectatorMode]);

  const meMember: GroupMember = {
    uid: userAccount.uid,
    displayName: userAccount.displayName,
    country: userAccount.country,
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const inviteCode = `GRP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const roomId = inviteCode;

    try {
      await setDoc(doc(db, 'group_rooms', roomId), {
        roomId,
        inviteCode,
        topic: topic.slice(0, 160),
        teamSize,
        durationMinutes,
        hostUid: userAccount.uid,
        hostName: userAccount.displayName.slice(0, 80),
        status: 'open',
        allowSpectators,
        isPrivate,
        teamA: [meMember],
        teamB: [],
        speakerQueue: [],
        activeSpeakerUid: userAccount.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowCreate(false);
      setIsSpectatorMode(false);
      setActiveRoomId(roomId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `group_rooms/${roomId}`);
    }
  };

  const handleJoinTeam = async (room: GroupDebateRoom, side: 'A' | 'B') => {
    setError(null);
    const cleanA = room.teamA.filter((m) => m.uid !== userAccount.uid);
    const cleanB = room.teamB.filter((m) => m.uid !== userAccount.uid);
    if (side === 'A' && cleanA.length >= room.teamSize) {
      setError('El Equipo A favor ya está completo.');
      return;
    }
    if (side === 'B' && cleanB.length >= room.teamSize) {
      setError('El Equipo En contra ya está completo.');
      return;
    }

    const nextA = side === 'A' ? [...cleanA, meMember] : cleanA;
    const nextB = side === 'B' ? [...cleanB, meMember] : cleanB;

    try {
      await updateDoc(doc(db, 'group_rooms', room.roomId), {
        teamA: nextA,
        teamB: nextB,
        updatedAt: serverTimestamp(),
      });
      setIsSpectatorMode(false);
      setActiveRoomId(room.roomId);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `group_rooms/${room.roomId}`);
    }
  };

  const handleRequestFloor = async (room: GroupDebateRoom) => {
    const queue = room.speakerQueue || [];
    if (queue.some((q) => q.uid === userAccount.uid)) return;
    try {
      await updateDoc(doc(db, 'group_rooms', room.roomId), {
        speakerQueue: [...queue, meMember].slice(0, 14),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `group_rooms/${room.roomId}`);
    }
  };

  const handleGrantFloor = async (room: GroupDebateRoom, uid: string) => {
    if (room.hostUid !== userAccount.uid) return;
    const nextQueue = (room.speakerQueue || []).filter((m) => m.uid !== uid);
    try {
      await updateDoc(doc(db, 'group_rooms', room.roomId), {
        activeSpeakerUid: uid,
        speakerQueue: nextQueue,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `group_rooms/${room.roomId}`);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inviteLookup.trim().toUpperCase();
    if (!clean) return;
    setError(null);
    try {
      const directSnap = await getDoc(doc(db, 'group_rooms', clean));
      if (directSnap.exists()) {
        const found = directSnap.data() as GroupDebateRoom;
        setActiveRoomId(found.roomId);
        return;
      }
      const snap = await getDocs(
        query(collection(db, 'group_rooms'), where('inviteCode', '==', clean))
      );
      if (snap.empty) {
        setError('No se ha encontrado ninguna sala grupal con ese código.');
        return;
      }
      const found = snap.docs[0].data() as GroupDebateRoom;
      setActiveRoomId(found.roomId);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `group_rooms/${clean}`);
    }
  };

  if (activeRoom) {
    const isHost = activeRoom.hostUid === userAccount.uid;
    const inTeamA = activeRoom.teamA.some((m) => m.uid === userAccount.uid);
    const inTeamB = activeRoom.teamB.some((m) => m.uid === userAccount.uid);
    const inAnyTeam = inTeamA || inTeamB;
    const isMyTurn = activeRoom.activeSpeakerUid === userAccount.uid;

    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#A18450] font-semibold">
              <span>
                Sala grupal {activeRoom.teamSize}v{activeRoom.teamSize} · {activeRoom.durationMinutes} min
              </span>
              <span className="font-mono-tabular bg-[#FAF9F5] border border-[#E8E3D8] px-2 py-0.5 rounded-sm text-[#292820]">
                Código: {activeRoom.inviteCode}
              </span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#292820]">
              {activeRoom.topic}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setActiveRoomId(null)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#292820] text-xs uppercase tracking-[0.16em] rounded-sm self-start cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5 text-[#A18450]" />
            Salir de la sala
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Equipos */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.16em] text-[#79613B] font-semibold">
                  Equipo A favor ({activeRoom.teamA.length}/{activeRoom.teamSize})
                </h2>
                {!inTeamA && activeRoom.teamA.length < activeRoom.teamSize && (
                  <button
                    type="button"
                    onClick={() => handleJoinTeam(activeRoom, 'A')}
                    className="text-[11px] text-[#A18450] hover:underline cursor-pointer"
                  >
                    Unirme aquí
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {activeRoom.teamA.map((m) => (
                  <li
                    key={m.uid}
                    className={`px-3 py-2 rounded-sm border text-xs flex items-center justify-between ${
                      activeRoom.activeSpeakerUid === m.uid
                        ? 'bg-[#FAF9F5] border-[#A18450] font-semibold text-[#292820]'
                        : 'bg-white border-[#E8E3D8] text-[#777367]'
                    }`}
                  >
                    <span>{m.displayName} ({m.country})</span>
                    {activeRoom.activeSpeakerUid === m.uid && (
                      <span className="text-[10px] uppercase text-[#A18450]">En uso de palabra</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.16em] text-[#79613B] font-semibold">
                  Equipo En contra ({activeRoom.teamB.length}/{activeRoom.teamSize})
                </h2>
                {!inTeamB && activeRoom.teamB.length < activeRoom.teamSize && (
                  <button
                    type="button"
                    onClick={() => handleJoinTeam(activeRoom, 'B')}
                    className="text-[11px] text-[#A18450] hover:underline cursor-pointer"
                  >
                    Unirme aquí
                  </button>
                )}
              </div>
              {activeRoom.teamB.length === 0 ? (
                <p className="text-xs text-[#777367]">Esperando participantes para este equipo.</p>
              ) : (
                <ul className="space-y-2">
                  {activeRoom.teamB.map((m) => (
                    <li
                      key={m.uid}
                      className={`px-3 py-2 rounded-sm border text-xs flex items-center justify-between ${
                        activeRoom.activeSpeakerUid === m.uid
                          ? 'bg-[#FAF9F5] border-[#A18450] font-semibold text-[#292820]'
                          : 'bg-white border-[#E8E3D8] text-[#777367]'
                      }`}
                    >
                      <span>{m.displayName} ({m.country})</span>
                      {activeRoom.activeSpeakerUid === m.uid && (
                        <span className="text-[10px] uppercase text-[#A18450]">En uso de palabra</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cola de turnos y moderación */}
            <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.16em] text-[#292820] font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#A18450]" />
                  Turnos de palabra
                </h2>
                {inAnyTeam && !isMyTurn && (
                  <button
                    type="button"
                    onClick={() => handleRequestFloor(activeRoom)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#A18450] text-white text-[11px] rounded-sm cursor-pointer"
                  >
                    <Hand className="w-3 h-3" />
                    Solicitar palabra
                  </button>
                )}
              </div>
              {(activeRoom.speakerQueue || []).length === 0 ? (
                <p className="text-xs text-[#777367]">No hay solicitudes pendientes en cola.</p>
              ) : (
                <ul className="space-y-2">
                  {(activeRoom.speakerQueue || []).map((req) => (
                    <li
                      key={req.uid}
                      className="flex items-center justify-between bg-[#FAF9F5] border border-[#E8E3D8] px-3 py-2 rounded-sm text-xs"
                    >
                      <span>{req.displayName}</span>
                      {isHost && (
                        <button
                          type="button"
                          onClick={() => handleGrantFloor(activeRoom, req.uid)}
                          className="text-[11px] font-medium text-[#A18450] hover:underline cursor-pointer"
                        >
                          Conceder turno
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Escenario audiovisual */}
          <div className="lg:col-span-8 bg-white border border-[#E8E3D8] rounded-sm p-5 shadow-editorial-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-3 text-xs text-[#777367]">
              <span>
                {isSpectatorMode
                  ? 'Modo espectador (solo escucha y visión)'
                  : isMyTurn
                    ? 'Tienes el turno de palabra activo'
                    : 'Tu micrófono espera tu turno asignado'}
              </span>
              <span className="font-mono-tabular">
                Anfitrión: {activeRoom.hostName}
              </span>
            </div>

            {!isSpectatorMode ? (
              <div className="aspect-video bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm overflow-hidden relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-white/95 border border-[#E8E3D8] px-3 py-1 rounded-sm text-xs text-[#292820]">
                  {userAccount.displayName} {inTeamA ? '· Equipo A favor' : inTeamB ? '· Equipo En contra' : ''}
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Eye className="w-8 h-8 text-[#A18450]" />
                <p className="font-editorial text-2xl text-[#292820]">Modo espectador activado</p>
                <p className="text-xs text-[#777367] max-w-md">
                  Esta sala permite observadores con consentimiento explícito del anfitrión. Puedes seguir el intercambio de argumentos o unirte a un equipo si hay plaza libre.
                </p>
              </div>
            )}

            {!isSpectatorMode && (
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = !micOn;
                    setMicOn(next);
                    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
                  }}
                  className="p-3 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] rounded-full text-[#A18450] cursor-pointer"
                  title={micOn ? 'Silenciar micrófono' : 'Activar micrófono'}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-[#793B2B]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !camOn;
                    setCamOn(next);
                    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
                  }}
                  className="p-3 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] rounded-full text-[#A18450] cursor-pointer"
                  title={camOn ? 'Apagar cámara' : 'Encender cámara'}
                >
                  {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-[#793B2B]" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
            Salas colectivas · 1v1, 2v2, 3v3 hasta 7v7
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
            Debates en grupo
          </h1>
          <p className="text-sm text-[#777367] max-w-2xl">
            Organiza equipos a favor y en contra con control moderado de turnos, petición de palabra y opción de espectadores consentida.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Crear sala grupal
        </button>
      </div>

      {error && (
        <div className="bg-white border border-[#C97B63] text-[#793B2B] text-xs p-3.5 rounded-sm">
          {error}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreateRoom}
          className="bg-white border border-[#A18450] rounded-sm p-6 sm:p-8 shadow-editorial space-y-5"
        >
          <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
            Configurar nueva sala por equipos
          </h2>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
              Tema del debate
            </span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
            >
              {DEBATE_TOPICS_300.slice(0, 40).map((t) => (
                <option key={t.id} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                Tamaño por equipo (hasta 7)
              </span>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} contra {n}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                Duración total
              </span>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
              >
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={25}>25 minutos</option>
                <option value={40}>40 minutos</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSpectators}
                onChange={(e) => setAllowSpectators(e.target.checked)}
                className="accent-[#A18450]"
              />
              Permitir espectadores en modo lectura
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="accent-[#A18450]"
              />
              Sala privada (solo mediante código)
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-xs uppercase tracking-[0.14em] text-[#777367] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.16em] font-medium rounded-sm cursor-pointer"
            >
              Abrir sala grupal
            </button>
          </div>
        </form>
      )}

      {/* Unirse por código */}
      <form
        onSubmit={handleJoinByCode}
        className="bg-white border border-[#E8E3D8] rounded-sm p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <input
          type="text"
          value={inviteLookup}
          onChange={(e) => setInviteLookup(e.target.value.toUpperCase())}
          placeholder="Código de sala grupal privada (ej. GRP-4A2F)"
          className="flex-1 px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm font-mono-tabular text-sm focus:outline-none focus:border-[#A18450]"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#292820] text-white text-xs uppercase tracking-[0.16em] rounded-sm cursor-pointer"
        >
          Entrar por código
        </button>
      </form>

      {/* Lista de salas públicas */}
      {rooms.length === 0 ? (
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-8 text-center text-sm text-[#777367]">
          No hay salas grupales públicas abiertas en este momento. Crea una nueva para abrir el primer equipo.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm flex flex-col justify-between space-y-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Formato {room.teamSize}v{room.teamSize} · {room.durationMinutes} min
                  </span>
                  <span className="font-mono-tabular text-[#777367]">{room.inviteCode}</span>
                </div>
                <h3 className="font-editorial text-2xl font-semibold text-[#292820]">
                  {room.topic}
                </h3>
                <p className="text-xs text-[#777367]">
                  Organiza: {room.hostName} · Equipo A ({room.teamA.length}/{room.teamSize}) vs Equipo B ({room.teamB.length}/{room.teamSize})
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8E3D8]">
                <button
                  type="button"
                  onClick={() => handleJoinTeam(room, 'A')}
                  className="px-3.5 py-2 bg-[#A18450] hover:bg-[#79613B] text-white text-xs rounded-sm cursor-pointer"
                >
                  Unirse A favor
                </button>
                <button
                  type="button"
                  onClick={() => handleJoinTeam(room, 'B')}
                  className="px-3.5 py-2 bg-[#292820] hover:bg-[#3F3D32] text-white text-xs rounded-sm cursor-pointer"
                >
                  Unirse En contra
                </button>
                {room.allowSpectators && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSpectatorMode(true);
                      setActiveRoomId(room.roomId);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] text-xs text-[#777367] rounded-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Observar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
