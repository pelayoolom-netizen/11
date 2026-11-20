import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  SwitchCamera,
  Video,
  VideoOff,
  Wifi,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { formatDuration } from '../lib/perspectives';
import { BrandLockup } from './BrandMark';
import type { AIJudgeReport, MatchFoundEvent, UserAccount } from '../types';

interface VideoDebateRoomProps {
  match: MatchFoundEvent;
  userAccount: UserAccount;
  onDebateScored?: (eloDelta: number) => Promise<void>;
  onExitToDashboard: () => void;
}

type ConnectionTransport = 'connecting' | 'livekit' | 'webrtc' | 'ended' | 'error';
type NetworkQuality = 'good' | 'reconnecting' | 'waiting';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const GUIDED_PHASES = [
  { name: 'Presentación', share: 0.08, hint: 'Saludo breve y encuadre del tema.' },
  { name: 'Exposición inicial 1', share: 0.16, hint: 'Primer participante expone su tesis principal.' },
  { name: 'Exposición inicial 2', share: 0.16, hint: 'Segundo participante expone su tesis inicial.' },
  { name: 'Argumentos', share: 0.28, hint: 'Intercambio directo de datos, ejemplos y principios.' },
  { name: 'Réplicas', share: 0.2, hint: 'Respuesta directa a las objeciones del contrario.' },
  { name: 'Conclusiones', share: 0.12, hint: 'Síntesis final y puntos de acuerdo o disenso.' },
];

export function VideoDebateRoom({
  match,
  userAccount,
  onDebateScored,
  onExitToDashboard,
}: VideoDebateRoomProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const livekitRoomRef = useRef<Room | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [transport, setTransport] = useState<ConnectionTransport>('connecting');
  const [peerConnected, setPeerConnected] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('waiting');
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeCamIdx, setActiveCamIdx] = useState(0);

  // Consentimiento, notas/transcripción y panel lateral
  const [aiConsent, setAiConsent] = useState(Boolean(userAccount.aiConsentAccepted));
  const [showNotesPanel, setShowNotesPanel] = useState(true);
  const [noteInput, setNoteInput] = useState('');
  const [notesLog, setNotesLog] = useState<Array<{ author: string; text: string }>>([]);
  const [dictating, setDictating] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Alerta cambio de fase guiada
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null);
  const prevPhaseRef = useRef<number>(0);

  // Modal post-debate + Juez IA
  const [showPostModal, setShowPostModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);
  const [evaluatingAI, setEvaluatingAI] = useState(false);
  const [aiReport, setAiReport] = useState<AIJudgeReport | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const partner = match.host.uid === userAccount.uid ? match.guest : match.host;
  const isHost = match.host.uid === userAccount.uid;
  const totalLimitSec = (match.durationLimitMinutes || 10) * 60;

  const currentGuidedPhase = useMemo(() => {
    if (match.format !== 'guiado') return null;
    let accum = 0;
    for (let i = 0; i < GUIDED_PHASES.length; i++) {
      const dur = Math.max(15, Math.round(totalLimitSec * GUIDED_PHASES[i].share));
      if (elapsedSeconds < accum + dur || i === GUIDED_PHASES.length - 1) {
        return {
          index: i,
          ...GUIDED_PHASES[i],
          remainingInPhase: Math.max(0, accum + dur - elapsedSeconds),
        };
      }
      accum += dur;
    }
    return null;
  }, [match.format, totalLimitSec, elapsedSeconds]);

  useEffect(() => {
    if (currentGuidedPhase && currentGuidedPhase.index !== prevPhaseRef.current) {
      prevPhaseRef.current = currentGuidedPhase.index;
      setPhaseBanner(`Cambio de turno: ${currentGuidedPhase.name}`);
      const id = window.setTimeout(() => setPhaseBanner(null), 5000);
      return () => window.clearTimeout(id);
    }
  }, [currentGuidedPhase]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (transport === 'ended') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [transport]);

  useEffect(() => {
    void updateDoc(doc(db, 'debates', match.debateId), {
      status: 'active',
      updatedAt: serverTimestamp(),
    }).catch(() => undefined);
  }, [match.debateId]);

  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((list) => setVideoDevices(list.filter((d) => d.kind === 'videoinput')))
      .catch(() => {});
  }, [transport]);

  useEffect(() => {
    let cancelled = false;

    const cleanupMediaAndSockets = () => {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
      if (peerConnRef.current) {
        peerConnRef.current.close();
        peerConnRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'room:leave',
              roomName: match.roomName,
              uid: userAccount.uid,
            })
          );
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    const connectSignalingSocket = (pc?: RTCPeerConnection) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomName: match.roomName,
            uid: userAccount.uid,
            displayName: userAccount.displayName,
          })
        );
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'room:joined' && pc) {
            const peers: Array<{ uid: string }> = msg.peers || [];
            if (peers.length > 0 && isHost) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(
                JSON.stringify({
                  type: 'webrtc:offer',
                  roomName: match.roomName,
                  targetUid: partner.uid,
                  payload: offer,
                })
              );
            }
          } else if (msg.type === 'room:peer-joined' && pc) {
            if (isHost) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(
                JSON.stringify({
                  type: 'webrtc:offer',
                  roomName: match.roomName,
                  targetUid: partner.uid,
                  payload: offer,
                })
              );
            }
          } else if (msg.type === 'webrtc:offer' && msg.payload && pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(
              JSON.stringify({
                type: 'webrtc:answer',
                roomName: match.roomName,
                targetUid: msg.fromUid,
                payload: answer,
              })
            );
          } else if (msg.type === 'webrtc:answer' && msg.payload && pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
          } else if (msg.type === 'webrtc:ice' && msg.payload && pc) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
          } else if (msg.type === 'room:transcript-note' && msg.payload?.text) {
            setNotesLog((prev) => [
              ...prev,
              {
                author: String(msg.payload.author || partner.displayName),
                text: String(msg.payload.text),
              },
            ]);
          } else if (msg.type === 'room:peer-left') {
            setPeerConnected(false);
            setNetworkQuality('waiting');
          } else if (msg.type === 'room:ended') {
            setPeerConnected(false);
            setShowPostModal(true);
            setTransport('ended');
          }
        } catch (err) {
          console.warn('Aviso en señalización de sala:', err);
        }
      };

      return ws;
    };

    const startLiveKit = async (url: string, token: string) => {
      const room = new Room({ adaptiveStream: true, dynacast: true });
      livekitRoomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
          track.attach(remoteVideoRef.current);
          setPeerConnected(true);
          setNetworkQuality('good');
        } else if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
          track.attach(remoteAudioRef.current);
        }
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        setPeerConnected(true);
        setNetworkQuality('good');
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        setPeerConnected(false);
        setNetworkQuality('waiting');
      });

      room.on(RoomEvent.Reconnecting, () => setNetworkQuality('reconnecting'));
      room.on(RoomEvent.Reconnected, () => setNetworkQuality('good'));

      await room.connect(url, token);
      await room.localParticipant.enableCameraAndMicrophone();

      const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (camPub?.track && localVideoRef.current) {
        camPub.track.attach(localVideoRef.current);
      }

      connectSignalingSocket();

      if (!cancelled) {
        setTransport('livekit');
        if (room.remoteParticipants.size > 0) {
          setPeerConnected(true);
          setNetworkQuality('good');
        }
      }
    };

    const startWebRTC = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          setPeerConnected(true);
          setNetworkQuality('good');
        }
      };

      const ws = connectSignalingSocket(pc);

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'webrtc:ice',
              roomName: match.roomName,
              targetUid: partner.uid,
              payload: event.candidate,
            })
          );
        }
      };

      pc.onconnectionstatechange = async () => {
        if (pc.connectionState === 'connected') {
          setPeerConnected(true);
          setNetworkQuality('good');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setNetworkQuality('reconnecting');
          try {
            if (isHost && ws.readyState === WebSocket.OPEN) {
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              ws.send(
                JSON.stringify({
                  type: 'webrtc:offer',
                  roomName: match.roomName,
                  targetUid: partner.uid,
                  payload: offer,
                })
              );
            }
          } catch {
            // Reintento silencioso
          }
        } else if (pc.connectionState === 'closed') {
          setPeerConnected(false);
        }
      };

      if (!cancelled) {
        setTransport('webrtc');
      }
    };

    const initializeCall = async () => {
      try {
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: match.roomName,
            participantId: userAccount.uid,
            participantName: userAccount.displayName,
          }),
        });
        const data = await response.json();
        if (cancelled) return;

        if (data.mode === 'livekit' && data.url && data.token) {
          await startLiveKit(data.url, data.token);
        } else {
          await startWebRTC();
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Se requieren permisos de cámara y micrófono para participar en la videollamada.';
          setMediaError(message);
          setTransport('error');
        }
      }
    };

    void initializeCall();

    return () => {
      cancelled = true;
      cleanupMediaAndSockets();
    };
  }, [match.roomName, userAccount.uid, userAccount.displayName, partner.uid, isHost]);

  const toggleMic = async () => {
    const next = !micEnabled;
    setMicEnabled(next);
    if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(next);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
    }
  };

  const toggleCam = async () => {
    const next = !camEnabled;
    setCamEnabled(next);
    if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setCameraEnabled(next);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
    }
  };

  const handleSwitchCamera = async () => {
    if (videoDevices.length < 2) return;
    const nextIdx = (activeCamIdx + 1) % videoDevices.length;
    const deviceId = videoDevices[nextIdx].deviceId;
    setActiveCamIdx(nextIdx);

    if (livekitRoomRef.current) {
      await livekitRoomRef.current.switchActiveDevice('videoinput', deviceId);
      return;
    }

    if (localStreamRef.current && peerConnRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
        const newTrack = newStream.getVideoTracks()[0];
        if (!newTrack) return;

        const sender = peerConnRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newTrack);
        }

        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(newTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      } catch {
        setMediaError('No se pudo cambiar a la cámara seleccionada.');
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      await containerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const addNoteEntry = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const entry = { author: userAccount.displayName, text: clean };
    setNotesLog((prev) => [...prev, entry]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'room:transcript-note',
          roomName: match.roomName,
          payload: entry,
        })
      );
    }
  };

  const handleDictateOnce = () => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SR || !aiConsent) return;
    const recognition = new (SR as new () => {
      lang: string;
      interimResults: boolean;
      onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
    })();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    setDictating(true);
    recognition.onresult = (ev) => {
      const txt = ev.results?.[0]?.[0]?.transcript;
      if (txt) addNoteEntry(txt);
    };
    recognition.onerror = () => setDictating(false);
    recognition.onend = () => setDictating(false);
    recognition.start();
  };

  const handleEndDebate = async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'room:end', roomName: match.roomName })
      );
    }
    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect();
      livekitRoomRef.current = null;
    }
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    setTransport('ended');
    setShowPostModal(true);

    const compiledNotes = notesLog.map((n) => `${n.author}: ${n.text}`).join('\n').slice(0, 5800);
    try {
      await updateDoc(doc(db, 'debates', match.debateId), {
        status: 'completed',
        durationSeconds: elapsedSeconds,
        ...(aiConsent && compiledNotes ? { transcriptNotes: compiledNotes } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('No se pudo actualizar estado final del debate:', err);
    }
  };

  const handleRunAIJudge = async () => {
    if (!aiConsent) return;
    setEvaluatingAI(true);
    setAiError(null);

    const compiledNotes =
      notesLog.length > 0
        ? notesLog.map((n) => `${n.author}: ${n.text}`).join('\n')
        : `Debate sobre "${match.topic}" entre ${match.host.displayName} y ${match.guest.displayName} con duración de ${formatDuration(elapsedSeconds)}.`;

    try {
      const resp = await fetch('/api/ai/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: match.topic,
          participantA: match.host.displayName,
          participantB: match.guest.displayName,
          transcriptNotes: compiledNotes,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAiError(data.error || 'No se pudo generar la evaluación del Juez de IA.');
        return;
      }

      const report = data.report as AIJudgeReport;
      setAiReport(report);

      const serialized = JSON.stringify(report).slice(0, 7900);
      await updateDoc(doc(db, 'debates', match.debateId), {
        aiReportJson: serialized,
        updatedAt: serverTimestamp(),
      });

      if (match.isRanked !== false && onDebateScored) {
        const myDelta = isHost ? report.eloDeltaA : report.eloDeltaB;
        await onDebateScored(myDelta);
      }
    } catch {
      setAiError('Error de conexión al solicitar el informe del Juez de IA.');
    } finally {
      setEvaluatingAI(false);
    }
  };

  const saveReflectionAndExit = async (skip: boolean) => {
    if (!skip && reflectionText.trim()) {
      setSavingReflection(true);
      try {
        await updateDoc(doc(db, 'debates', match.debateId), {
          [isHost ? 'reflectionHost' : 'reflectionGuest']: reflectionText.trim().slice(0, 480),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignorar
      } finally {
        setSavingReflection(false);
      }
    }
    onExitToDashboard();
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#FAF9F5] text-[#292820] flex flex-col"
    >
      {/* Cabecera blanca minimalista */}
      <header className="bg-white border-b border-[#E8E3D8] px-4 sm:px-6 h-16 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <BrandLockup size="sm" />
          <div className="hidden md:flex items-center gap-3 text-xs text-[#777367] truncate">
            <span className="text-[#E8E3D8]">|</span>
            <span className="truncate font-medium text-[#292820]">{match.topic}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border ${
              networkQuality === 'good'
                ? 'bg-[#FAF9F5] border-[#E8E3D8] text-[#292820]'
                : networkQuality === 'reconnecting'
                  ? 'bg-[#FAF9F5] border-[#C97B63] text-[#793B2B]'
                  : 'bg-[#FAF9F5] border-[#E8E3D8] text-[#777367]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-[#A18450]" />
            {networkQuality === 'good'
              ? transport === 'livekit'
                ? 'LiveKit cifrado'
                : 'Conexión estable'
              : networkQuality === 'reconnecting'
                ? 'Reconectando...'
                : 'Esperando interlocutor'}
          </span>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(match.roomName);
              setCopiedInvite(true);
              setTimeout(() => setCopiedInvite(false), 2000);
            }}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-[#777367] hover:text-[#292820] cursor-pointer"
          >
            <Copy className="w-3 h-3 text-[#A18450]" />
            {copiedInvite ? 'ID copiado' : 'Copiar sala'}
          </button>

          <span className="font-mono-tabular text-sm font-medium text-[#292820] px-3 py-1 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm">
            {formatDuration(elapsedSeconds)} / {match.durationLimitMinutes || 10}:00
          </span>
        </div>
      </header>

      {/* Barra de fase guiada si aplica */}
      {currentGuidedPhase && (
        <div className="bg-white border-b border-[#E8E3D8] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#A18450]">
              Fase {currentGuidedPhase.index + 1}/6 · {currentGuidedPhase.name}
            </span>
            <span className="text-[#777367] hidden sm:inline">
              — {currentGuidedPhase.hint}
            </span>
          </div>
          <span className="font-mono-tabular text-[#79613B]">
            Turno restante: {formatDuration(currentGuidedPhase.remainingInPhase)}
          </span>
        </div>
      )}

      {phaseBanner && (
        <div className="bg-[#292820] text-[#E6D8B9] text-xs text-center py-1.5 tracking-[0.16em] uppercase">
          {phaseBanner}
        </div>
      )}

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-5 flex flex-col justify-between gap-5">
        {mediaError && (
          <div className="p-4 bg-white border border-[#C97B63] text-xs text-[#793B2B] flex items-center gap-2 rounded-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{mediaError}</span>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[420px]">
          {/* Vídeo protagonista del interlocutor */}
          <div
            className={`${
              showNotesPanel ? 'lg:col-span-6' : 'lg:col-span-8'
            } bg-white border border-[#E8E3D8] p-3 shadow-editorial-sm flex flex-col rounded-sm`}
          >
            <div className="relative flex-1 min-h-[290px] sm:min-h-[440px] bg-[#F3F0E9] overflow-hidden rounded-sm">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <audio ref={remoteAudioRef} autoPlay />

              {!peerConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#F3F0E9] space-y-2">
                  <p className="font-editorial text-2xl sm:text-3xl font-medium text-[#292820]">
                    Esperando a {partner.displayName}
                  </p>
                  <p className="text-xs text-[#777367] max-w-sm">
                    {partner.country} · Estableciendo señal de audio y vídeo por{' '}
                    {transport === 'livekit' ? 'LiveKit' : 'WebRTC'}.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 px-1 flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-medium text-[#292820]">{partner.displayName}</span>
                <span className="text-[#777367]"> · {partner.country}</span>
              </div>
              {match.discrepancyTopics && match.discrepancyTopics.length > 0 && (
                <span className="text-[#79613B] hidden sm:inline truncate max-w-xs">
                  Discrepancia: {match.discrepancyTopics[0]}
                </span>
              )}
            </div>
          </div>

          {/* Vídeo local */}
          <div
            className={`${
              showNotesPanel ? 'lg:col-span-3' : 'lg:col-span-4'
            } bg-white border border-[#E8E3D8] p-3 shadow-editorial-sm flex flex-col justify-between rounded-sm`}
          >
            <div className="relative aspect-[4/3] lg:aspect-auto lg:flex-1 bg-[#F3F0E9] overflow-hidden rounded-sm">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover -scale-x-100 ${
                  camEnabled ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {!camEnabled && (
                <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.14em] text-[#777367]">
                  Cámara pausada
                </div>
              )}
            </div>

            <div className="pt-3 px-1 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-[#292820]">{userAccount.displayName}</span>
                <span className="text-[#777367]"> (Tú)</span>
              </div>
              <span className="text-[#A18450]">
                {micEnabled ? 'Micrófono activo' : 'Silenciado'}
              </span>
            </div>
          </div>

          {/* Panel lateral: consentimiento y registro opcional para Juez de IA */}
          {showNotesPanel && (
            <div className="lg:col-span-3 bg-white border border-[#E8E3D8] p-4 shadow-editorial-sm flex flex-col justify-between rounded-sm space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-[#A18450] font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Notas y Juez IA
                  </span>
                </div>

                <label className="flex items-start gap-2 text-[11px] text-[#777367] bg-[#FAF9F5] border border-[#E8E3D8] p-2.5 rounded-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConsent}
                    onChange={(e) => setAiConsent(e.target.checked)}
                    className="mt-0.5 accent-[#A18450]"
                  />
                  <span>
                    Consiento analizar notas/transcripción con IA al finalizar. No se grabará vídeo.
                  </span>
                </label>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {notesLog.length === 0 ? (
                    <p className="text-[11px] text-[#777367]">
                      Anota argumentos clave durante la charla para obtener un informe imparcial del Juez de IA.
                    </p>
                  ) : (
                    notesLog.map((n, i) => (
                      <div
                        key={i}
                        className="text-xs bg-[#FAF9F5] border border-[#E8E3D8] p-2 rounded-sm"
                      >
                        <span className="font-semibold text-[#79613B]">{n.author}: </span>
                        <span className="text-[#292820]">{n.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {aiConsent && (
                <div className="space-y-2 pt-2 border-t border-[#E8E3D8]">
                  <textarea
                    rows={2}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Registrar argumento o dato..."
                    className="w-full p-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-xs resize-none focus:outline-none focus:border-[#A18450]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        addNoteEntry(noteInput);
                        setNoteInput('');
                      }}
                      className="flex-1 py-1.5 bg-[#292820] text-white text-[11px] uppercase tracking-wider rounded-sm cursor-pointer"
                    >
                      Añadir nota
                    </button>
                    <button
                      type="button"
                      onClick={handleDictateOnce}
                      disabled={dictating}
                      className="px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E8E3D8] text-[11px] text-[#79613B] rounded-sm cursor-pointer"
                      title="Dictar frase por micrófono"
                    >
                      {dictating ? 'Oyendo...' : 'Dictar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barra minimalista de controles dorados */}
        <div className="flex items-center justify-center pb-2">
          <div className="bg-white border border-[#E8E3D8] px-4 sm:px-6 py-3 shadow-editorial-sm flex flex-wrap items-center justify-center gap-3 sm:gap-4 rounded-sm">
            <button
              type="button"
              onClick={toggleMic}
              aria-label={micEnabled ? 'Silenciar micrófono' : 'Activar micrófono'}
              title={micEnabled ? 'Silenciar micrófono' : 'Activar micrófono'}
              className={`w-11 h-11 flex items-center justify-center border rounded-sm transition-colors cursor-pointer ${
                micEnabled
                  ? 'border-[#E8E3D8] bg-[#FAF9F5] text-[#A18450] hover:border-[#A18450]'
                  : 'border-[#79613B] bg-[#79613B] text-white'
              }`}
            >
              {micEnabled ? <Mic size={18} strokeWidth={1.6} /> : <MicOff size={18} strokeWidth={1.6} />}
            </button>

            <button
              type="button"
              onClick={toggleCam}
              aria-label={camEnabled ? 'Apagar cámara' : 'Encender cámara'}
              title={camEnabled ? 'Apagar cámara' : 'Encender cámara'}
              className={`w-11 h-11 flex items-center justify-center border rounded-sm transition-colors cursor-pointer ${
                camEnabled
                  ? 'border-[#E8E3D8] bg-[#FAF9F5] text-[#A18450] hover:border-[#A18450]'
                  : 'border-[#79613B] bg-[#79613B] text-white'
              }`}
            >
              {camEnabled ? (
                <Video size={18} strokeWidth={1.6} />
              ) : (
                <VideoOff size={18} strokeWidth={1.6} />
              )}
            </button>

            {videoDevices.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                aria-label="Cambiar cámara"
                title="Cambiar de cámara"
                className="w-11 h-11 flex items-center justify-center border border-[#E8E3D8] bg-[#FAF9F5] text-[#A18450] hover:border-[#A18450] rounded-sm cursor-pointer"
              >
                <SwitchCamera size={18} strokeWidth={1.6} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowNotesPanel((v) => !v)}
              aria-label="Notas y Juez IA"
              title="Mostrar u ocultar panel de notas"
              className="w-11 h-11 flex items-center justify-center border border-[#E8E3D8] bg-[#FAF9F5] text-[#A18450] hover:border-[#A18450] rounded-sm cursor-pointer"
            >
              <FileText size={18} strokeWidth={1.6} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="w-11 h-11 flex items-center justify-center border border-[#E8E3D8] bg-[#FAF9F5] text-[#A18450] hover:border-[#A18450] rounded-sm cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 size={18} strokeWidth={1.6} />
              ) : (
                <Maximize2 size={18} strokeWidth={1.6} />
              )}
            </button>

            <div className="w-px h-7 bg-[#E8E3D8] mx-1" aria-hidden="true" />

            <button
              type="button"
              onClick={handleEndDebate}
              className="inline-flex items-center gap-2 h-11 px-5 bg-[#292820] hover:bg-[#79613B] text-white text-xs font-medium uppercase tracking-[0.14em] rounded-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <PhoneOff size={15} strokeWidth={1.6} className="text-[#E6D8B9]" />
              <span>Finalizar debate</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modal post-debate: Juez de IA + reflexión */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-[#292820]/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white border border-[#E8E3D8] p-6 sm:p-8 shadow-editorial space-y-6 rounded-sm">
            <div className="border-b border-[#E8E3D8] pb-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#A18450] mb-1 font-semibold">
                Diálogo finalizado
              </p>
              <h2 className="font-editorial text-3xl font-medium text-[#292820]">
                Sesión con {partner.displayName}
              </h2>
              <p className="text-xs text-[#777367] mt-1 font-mono-tabular">
                Duración: {formatDuration(elapsedSeconds)} · {match.topic}
              </p>
            </div>

            {aiConsent && !aiReport && (
              <div className="bg-[#FAF9F5] border border-[#E8E3D8] p-5 rounded-sm space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                  <Scale className="w-4 h-4" />
                  Juez de IA imparcial (evaluación lógica y ELO)
                </div>
                <p className="text-xs text-[#777367]">
                  Has dado tu consentimiento. Solicita ahora el informe objetivo basado en las notas del debate ({notesLog.length} registros) sin sesgo ideológico.
                </p>
                {aiError && (
                  <p className="text-xs text-[#793B2B] bg-white border border-[#C97B63] p-2.5 rounded-sm">
                    {aiError}
                  </p>
                )}
                <button
                  type="button"
                  disabled={evaluatingAI}
                  onClick={handleRunAIJudge}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] disabled:opacity-60 text-white text-xs uppercase tracking-[0.16em] font-medium rounded-sm cursor-pointer"
                >
                  {evaluatingAI ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Evaluando razonamiento...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generar informe del Juez de IA
                    </>
                  )}
                </button>
              </div>
            )}

            {aiReport && (
              <div className="bg-[#FAF9F5] border border-[#A18450] p-5 rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Informe objetivo completado
                  </span>
                  {match.isRanked !== false && (() => {
                    const myDelta = isHost ? aiReport.eloDeltaA : aiReport.eloDeltaB;
                    return (
                      <span className="font-mono-tabular text-xs bg-white border border-[#E8E3D8] px-2.5 py-1 rounded-sm text-[#292820]">
                        Variación ELO: {myDelta >= 0 ? `+${myDelta}` : myDelta}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm text-[#292820] leading-relaxed">
                  {aiReport.resumenGeneral}
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  {[aiReport.participanteA, aiReport.participanteB].map((p) => (
                    <div
                      key={p.name}
                      className="bg-white border border-[#E8E3D8] p-3.5 rounded-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-semibold text-[#292820]">
                        <span>{p.name}</span>
                        <span className="font-mono-tabular text-[#A18450]">
                          {p.puntuacionGlobal}/100
                        </span>
                      </div>
                      <p className="text-[#777367]">{p.explicacion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367]">
                Nota de reflexión privada (opcional)
              </span>
              <textarea
                rows={3}
                maxLength={480}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="¿Qué argumento del otro participante te hizo reconsiderar o matizar tu postura?"
                className="w-full p-3.5 bg-[#FAF9F5] border border-[#E8E3D8] focus:border-[#A18450] focus:outline-none text-sm resize-none rounded-sm"
              />
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => void saveReflectionAndExit(true)}
                className="px-5 py-2.5 border border-[#E8E3D8] text-xs uppercase tracking-[0.14em] text-[#777367] hover:text-[#292820] rounded-sm cursor-pointer"
              >
                Volver al panel
              </button>
              <button
                type="button"
                disabled={savingReflection}
                onClick={() => void saveReflectionAndExit(false)}
                className="px-6 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs font-medium uppercase tracking-[0.14em] rounded-sm cursor-pointer"
              >
                {savingReflection ? 'Guardando...' : 'Guardar reflexión y salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
