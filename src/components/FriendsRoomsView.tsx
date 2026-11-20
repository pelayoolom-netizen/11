import React, { useEffect, useState } from 'react';
import {
  Ban,
  Check,
  Copy,
  Flag,
  KeyRound,
  Search,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import {
  collection,
  doc,
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
import type {
  FriendRequestItem,
  MatchFoundEvent,
  PublicProfile,
  UserAccount,
} from '../types';

interface FriendsRoomsViewProps {
  userAccount: UserAccount;
  publicProfile: PublicProfile;
  onEnterPrivateDebate: (match: MatchFoundEvent) => void;
}

export function FriendsRoomsView({
  userAccount,
  publicProfile,
  onEnterPrivateDebate,
}: FriendsRoomsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<PublicProfile[]>([]);

  const [privateTopic, setPrivateTopic] = useState(DEBATE_TOPICS_300[0].title);
  const [privateDuration, setPrivateDuration] = useState<5 | 10 | 15>(10);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Modal de reporte
  const [reportTarget, setReportTarget] = useState<PublicProfile | null>(null);
  const [reportReason, setReportReason] = useState('Acoso o falta de respeto grave');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    const qIn = query(
      collection(db, 'friend_requests'),
      where('toUid', '==', userAccount.uid)
    );
    const qOut = query(
      collection(db, 'friend_requests'),
      where('fromUid', '==', userAccount.uid)
    );

    const u1 = onSnapshot(
      qIn,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as FriendRequestItem)
          .filter((r) => r.status === 'pending');
        setIncomingRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'friend_requests')
    );

    const u2 = onSnapshot(
      qOut,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as FriendRequestItem);
        setOutgoingRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'friend_requests')
    );

    return () => {
      u1();
      u2();
    };
  }, [userAccount.uid]);

  useEffect(() => {
    const uids = userAccount.friendUids || [];
    if (uids.length === 0) {
      setFriendProfiles([]);
      return;
    }
    const q = query(
      collection(db, 'public_profiles'),
      where('isPublicProfile', '==', true)
    );
    getDocs(q)
      .then((snap) => {
        const all = snap.docs.map((d) => d.data() as PublicProfile);
        setFriendProfiles(all.filter((p) => uids.includes(p.uid)));
      })
      .catch((err) => handleFirestoreError(err, OperationType.LIST, 'public_profiles'));
  }, [userAccount.friendUids]);

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return;
    setSearching(true);
    setStatusMsg(null);
    try {
      const q = query(
        collection(db, 'public_profiles'),
        where('isPublicProfile', '==', true)
      );
      const snap = await getDocs(q);
      const matches = snap.docs
        .map((d) => d.data() as PublicProfile)
        .filter(
          (p) =>
            p.uid !== userAccount.uid &&
            !(userAccount.blockedUids || []).includes(p.uid) &&
            (p.username.toLowerCase().includes(clean) ||
              p.displayName.toLowerCase().includes(clean))
        );
      setSearchResults(matches.slice(0, 12));
      if (matches.length === 0) {
        setStatusMsg('No se han encontrado usuarios públicos con ese alias o nombre.');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'public_profiles');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (target: PublicProfile) => {
    const requestId = `fr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'friend_requests', requestId), {
        requestId,
        fromUid: userAccount.uid,
        fromName: userAccount.displayName.slice(0, 80),
        fromUsername: userAccount.username.slice(0, 32),
        toUid: target.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const notifId = `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'notifications', notifId), {
        notifId,
        recipientUid: target.uid,
        title: 'Nueva solicitud de amistad',
        body: `${userAccount.displayName} (@${userAccount.username}) te ha enviado una solicitud para debatir juntos.`.slice(0, 320),
        kind: 'friend',
        read: false,
        createdAt: serverTimestamp(),
      });
      setStatusMsg(`Solicitud enviada a @${target.username}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `friend_requests/${requestId}`);
    }
  };

  const handleRespondRequest = async (reqItem: FriendRequestItem, accept: boolean) => {
    try {
      await updateDoc(doc(db, 'friend_requests', reqItem.requestId), {
        status: accept ? 'accepted' : 'declined',
        updatedAt: serverTimestamp(),
      });
      if (accept) {
        const currentFriends = userAccount.friendUids || [];
        if (!currentFriends.includes(reqItem.fromUid)) {
          await updateDoc(doc(db, 'users', userAccount.uid), {
            friendUids: [...currentFriends, reqItem.fromUid].slice(0, 100),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `friend_requests/${reqItem.requestId}`);
    }
  };

  const handleBlockUser = async (target: PublicProfile) => {
    const blocked = userAccount.blockedUids || [];
    try {
      if (!blocked.includes(target.uid)) {
        await updateDoc(doc(db, 'users', userAccount.uid), {
          blockedUids: [...blocked, target.uid].slice(0, 100),
          friendUids: (userAccount.friendUids || []).filter((id) => id !== target.uid),
          updatedAt: serverTimestamp(),
        });
      }
      setSearchResults((prev) => prev.filter((p) => p.uid !== target.uid));
      setStatusMsg(`Has bloqueado a ${target.displayName}. No volveréis a coincidir en matchmaking.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userAccount.uid}`);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    const reportId = `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'reports', reportId), {
        reportId,
        reporterUid: userAccount.uid,
        targetUid: reportTarget.uid,
        reason: reportReason.slice(0, 120),
        details: reportDetails.trim().slice(0, 500),
        createdAt: serverTimestamp(),
      });
      setReportTarget(null);
      setReportDetails('');
      setStatusMsg('Reporte enviado al equipo de moderación.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
    }
  };

  const handleCreatePrivateRoom = async (inviteFriendUid?: string) => {
    const inviteCode = `ANT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const debateId = inviteCode;
    const roomName = `room_${debateId}`;
    const safeTopic = privateTopic.slice(0, 160);

    try {
      await setDoc(doc(db, 'debates', debateId), {
        debateId,
        roomName,
        inviteCode,
        topic: safeTopic,
        format: 'libre',
        durationLimitMinutes: privateDuration,
        isRanked: false,
        allowSpectators: false,
        status: 'ready',
        participantIds: [userAccount.uid],
        hostUid: userAccount.uid,
        hostName: userAccount.displayName.slice(0, 80),
        hostCountry: userAccount.country.slice(0, 64),
        discrepancyTopics: [privateTopic.slice(0, 200)],
        durationSeconds: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (inviteFriendUid) {
        const notifId = `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        await setDoc(doc(db, 'notifications', notifId), {
          notifId,
          recipientUid: inviteFriendUid,
          title: 'Invitación a debate privado amistoso',
          body: `${userAccount.displayName} te invita a debatir sobre «${safeTopic}». Código de sala: ${inviteCode}`.slice(0, 320),
          kind: 'invite',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setCreatedRoomCode(inviteCode);

      onEnterPrivateDebate({
        debateId,
        roomName,
        topic: safeTopic,
        format: 'libre',
        durationLimitMinutes: privateDuration,
        isRanked: false,
        allowSpectators: false,
        contrastScore: 50,
        discrepancyTopics: [privateTopic.slice(0, 200)],
        host: {
          uid: userAccount.uid,
          displayName: userAccount.displayName,
          country: userAccount.country,
          elo: publicProfile.elo,
          level: publicProfile.level,
          stanceSummary: 'Sala privada amistosa',
        },
        guest: {
          uid: inviteFriendUid || '',
          displayName: 'Invitado por código',
          country: 'Por confirmar',
          elo: 1200,
          level: 'Invitado',
          stanceSummary: 'Pendiente de conexión',
        },
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `debates/${debateId}`);
    }
  };

  return (
    <div className="space-y-7">
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
          Red de contactos y salas privadas amistosas
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
          Amigos y salas privadas
        </h1>
        <p className="text-sm text-[#777367] max-w-2xl">
          Busca usuarios por su <span className="font-medium">@alias</span> público, gestiona solicitudes de amistad, bloqueos o reportes y crea salas privadas con código de invitación (no puntuadas en ELO).
        </p>
      </div>

      {statusMsg && (
        <div className="bg-white border border-[#A18450] text-xs text-[#292820] px-4 py-3 rounded-sm">
          {statusMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Buscar usuarios y amigos */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
            <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
              Buscar participantes por usuario
            </h2>
            <form onSubmit={handleSearchUsers} className="flex gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#777367] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej. @carlos_madrid o nombre"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-5 py-2.5 bg-[#292820] text-white text-xs uppercase tracking-[0.16em] rounded-sm cursor-pointer"
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="divide-y divide-[#E8E3D8] pt-2">
                {searchResults.map((p) => {
                  const alreadySent = outgoingRequests.some(
                    (r) => r.toUid === p.uid && r.status === 'pending'
                  );
                  const isFriend = (userAccount.friendUids || []).includes(p.uid);
                  return (
                    <div
                      key={p.uid}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#292820]">
                          {p.displayName}{' '}
                          <span className="font-mono-tabular text-xs text-[#777367]">
                            @{p.username}
                          </span>
                        </p>
                        <p className="text-xs text-[#777367]">
                          {p.country} · {p.level} (ELO {p.elo})
                          {p.showAxesPublicly && p.publicAxesSummary
                            ? ` · ${p.publicAxesSummary}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isFriend ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#79613B] bg-[#FAF9F5] border border-[#E8E3D8] px-2.5 py-1 rounded-sm">
                            <UserCheck className="w-3.5 h-3.5" />
                            Amigo
                          </span>
                        ) : alreadySent ? (
                          <span className="text-xs text-[#777367]">Solicitud enviada</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendFriendRequest(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#A18450] text-white text-xs rounded-sm cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Añadir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleBlockUser(p)}
                          title="Bloquear usuario"
                          className="p-1.5 border border-[#E8E3D8] text-[#777367] hover:text-[#793B2B] rounded-sm cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportTarget(p)}
                          title="Reportar usuario"
                          className="p-1.5 border border-[#E8E3D8] text-[#777367] hover:text-[#793B2B] rounded-sm cursor-pointer"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Solicitudes entrantes */}
          {incomingRequests.length > 0 && (
            <div className="bg-white border border-[#A18450] rounded-sm p-6 space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                Solicitudes de amistad recibidas
              </h2>
              <div className="divide-y divide-[#E8E3D8]">
                {incomingRequests.map((reqItem) => (
                  <div
                    key={reqItem.requestId}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#292820]">
                        {reqItem.fromName}{' '}
                        <span className="text-xs text-[#777367]">@{reqItem.fromUsername}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespondRequest(reqItem, true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#A18450] text-white text-xs rounded-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondRequest(reqItem, false)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E3D8] text-xs text-[#777367] rounded-sm cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de amigos */}
          <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                Tus contactos ({friendProfiles.length})
              </h2>
              <Users className="w-4 h-4 text-[#A18450]" />
            </div>
            {friendProfiles.length === 0 ? (
              <p className="text-sm text-[#777367]">
                Aún no tienes amistades añadidas. Busca un usuario público por su @alias o comparte un código de sala privada.
              </p>
            ) : (
              <div className="divide-y divide-[#E8E3D8]">
                {friendProfiles.map((f) => (
                  <div
                    key={f.uid}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#292820]">
                        {f.displayName} (@{f.username})
                      </p>
                      <p className="text-xs text-[#777367]">
                        {f.country} · ELO {f.elo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCreatePrivateRoom(f.uid)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs rounded-sm cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Invitar a sala privada
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBlockUser(f)}
                        className="p-1.5 border border-[#E8E3D8] text-[#777367] hover:text-[#793B2B] rounded-sm cursor-pointer"
                        title="Bloquear"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Crear sala privada con código */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
              <KeyRound className="w-4 h-4" />
              Sala privada amistosa (sin impacto en ELO)
            </div>
            <p className="text-xs text-[#777367] leading-relaxed">
              Genera una sala privada por invitación para debatir con amigos o conocidos sobre cualquier tema sin que afecte a tu clasificación ELO.
            </p>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                Tema de la sala privada
              </span>
              <select
                value={privateTopic}
                onChange={(e) => setPrivateTopic(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
              >
                {DEBATE_TOPICS_300.slice(0, 40).map((t) => (
                  <option key={t.id} value={t.title}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium block">
                Duración sugerida
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([5, 10, 15] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPrivateDuration(m)}
                    className={`py-2 text-xs rounded-sm border cursor-pointer ${
                      privateDuration === m
                        ? 'bg-[#292820] text-white border-[#292820]'
                        : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8]'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCreatePrivateRoom()}
              className="w-full py-3.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer"
            >
              Crear sala privada y obtener código
            </button>

            {createdRoomCode && (
              <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-3 flex items-center justify-between">
                <span className="font-mono-tabular text-sm font-semibold text-[#292820]">
                  {createdRoomCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(createdRoomCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[#A18450] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCode ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de reporte */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-[#292820]/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReport}
            className="bg-white border border-[#E8E3D8] rounded-sm max-w-md w-full p-6 shadow-editorial space-y-4"
          >
            <h3 className="font-editorial text-2xl font-semibold text-[#292820]">
              Reportar a {reportTarget.displayName}
            </h3>
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367]">Motivo</span>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
              >
                <option>Acoso o falta de respeto grave</option>
                <option>Discurso de odio o amenazas</option>
                <option>Suplantación o spam</option>
                <option>Incumplimiento reiterado de normas de debate</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367]">
                Detalles adicionales (opcional)
              </span>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
              />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="px-4 py-2 text-xs uppercase text-[#777367] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#292820] text-white text-xs uppercase rounded-sm cursor-pointer"
              >
                Enviar reporte
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
