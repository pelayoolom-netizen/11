import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { AccessToken } from 'livekit-server-sdk';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NineAxes {
  economia: number;
  social: number;
  libertadEstado: number;
  territorial: number;
  internacional: number;
  intervencionismo: number;
  ecologia: number;
  seguridad: number;
  tradicion: number;
}

interface QuestionMeta {
  topicTag: string;
  area: string;
}

interface QueueCandidate {
  uid: string;
  displayName: string;
  country: string;
  elo: number;
  level: string;
  topic: string;
  format: 'libre' | 'guiado';
  durationLimitMinutes: number;
  matchStyle: 'moderado' | 'maxima_discrepancia';
  stanceSummary: string;
  axes: NineAxes;
  answers: Record<string, number>;
  priorityAreas: string[];
  blockedUids: string[];
  recentOpponents: string[];
  questionMeta: Record<string, QuestionMeta>;
  ws: WebSocket;
  joinedAt: number;
}

interface RoomPeer {
  uid: string;
  displayName: string;
  role?: 'participant' | 'spectator';
  ws: WebSocket;
}

const PORT = Number(process.env.PORT || 3000);
const LIVEKIT_URL = process.env.LIVEKIT_URL?.trim() || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY?.trim() || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET?.trim() || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || '';

const isLiveKitConfigured = Boolean(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET);
const isGeminiConfigured = Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

const aiClient = isGeminiConfigured
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function sanitizeId(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

function computeAxesDistance(a: NineAxes, b: NineAxes): number {
  const keys = Object.keys(a) as Array<keyof NineAxes>;
  let sum = 0;
  for (const k of keys) {
    const diff = (Number(a[k]) || 0) - (Number(b[k]) || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum); // 0 to ~600
}

function compareCandidates(a: QueueCandidate, b: QueueCandidate) {
  const sharedIds = Object.keys(a.answers).filter((qid) => qid in b.answers);
  const discrepancyDetails: Array<{ label: string; score: number }> = [];

  let weightedDiffSum = 0;
  let weightTotal = 0;

  for (const qid of sharedIds) {
    const diff = Math.abs(a.answers[qid] - b.answers[qid]); // 0..4
    const meta = a.questionMeta[qid] || b.questionMeta[qid];
    const area = meta?.area || '';
    const bothPriority =
      area && a.priorityAreas.includes(area) && b.priorityAreas.includes(area);
    const onePriority =
      area && (a.priorityAreas.includes(area) || b.priorityAreas.includes(area));
    const weight = bothPriority ? 2.2 : onePriority ? 1.5 : 1.0;

    weightedDiffSum += (diff / 4) * weight;
    weightTotal += weight;

    if (diff >= 2 && meta?.topicTag) {
      discrepancyDetails.push({ label: meta.topicTag, score: diff * weight });
    }
  }

  let contrastPercent = 50;
  if (weightTotal > 0) {
    contrastPercent = Math.round((weightedDiffSum / weightTotal) * 100);
  } else {
    const axesDist = computeAxesDistance(a.axes, b.axes);
    contrastPercent = Math.round(Math.min(100, (axesDist / 450) * 100));
  }

  discrepancyDetails.sort((x, y) => y.score - x.score);
  const topDiscrepancies: string[] = [];
  for (const item of discrepancyDetails) {
    if (!topDiscrepancies.includes(item.label)) {
      topDiscrepancies.push(item.label);
    }
    if (topDiscrepancies.length >= 3) break;
  }

  if (topDiscrepancies.length < 3) {
    const axisLabels: Array<{ key: keyof NineAxes; label: string }> = [
      { key: 'economia', label: 'Política fiscal y modelo económico' },
      { key: 'social', label: 'Derechos sociales y valores culturales' },
      { key: 'libertadEstado', label: 'Libertad individual frente a autoridad estatal' },
      { key: 'territorial', label: 'Organización territorial y descentralización' },
      { key: 'internacional', label: 'Apertura internacional y soberanía' },
      { key: 'ecologia', label: 'Transición ecológica frente a crecimiento' },
      { key: 'seguridad', label: 'Garantismo judicial y seguridad ciudadana' },
    ];
    const rankedAxes = axisLabels
      .map((item) => ({
        label: item.label,
        diff: Math.abs((a.axes[item.key] || 0) - (b.axes[item.key] || 0)),
      }))
      .sort((x, y) => y.diff - x.diff);
    for (const ax of rankedAxes) {
      if (!topDiscrepancies.includes(ax.label)) {
        topDiscrepancies.push(ax.label);
      }
      if (topDiscrepancies.length >= 3) break;
    }
  }

  return {
    contrastScore: Math.max(10, Math.min(99, contrastPercent)),
    discrepancyTopics: topDiscrepancies.slice(0, 3),
  };
}

async function createAppServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  const waitingQueue = new Map<string, QueueCandidate>();
  const rooms = new Map<string, Map<string, RoomPeer>>();
  const socketMeta = new WeakMap<WebSocket, { uid?: string; roomName?: string }>();

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      brand: 'ANTIRRATHETO',
      language: 'es-ES',
      livekitConfigured: isLiveKitConfigured,
      geminiConfigured: isGeminiConfigured,
      waitingCount: waitingQueue.size,
    });
  });

  app.post('/api/livekit/token', async (req, res) => {
    try {
      const roomName = sanitizeId(req.body?.roomName);
      const participantId = sanitizeId(req.body?.participantId);
      const participantName =
        typeof req.body?.participantName === 'string'
          ? req.body.participantName.trim().slice(0, 80)
          : 'Participante';
      const isSpectator = Boolean(req.body?.isSpectator);

      if (!roomName || !participantId) {
        res.status(400).json({ error: 'Se requieren roomName y participantId.' });
        return;
      }

      if (!isLiveKitConfigured) {
        res.json({
          mode: 'webrtc',
          url: null,
          token: null,
        });
        return;
      }

      const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: participantId,
        name: participantName,
        ttl: '2h',
      });
      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: !isSpectator,
        canSubscribe: true,
      });

      const jwt = await at.toJwt();
      res.json({
        mode: 'livekit',
        url: LIVEKIT_URL,
        token: jwt,
      });
    } catch (err) {
      console.error('Error al generar token LiveKit:', err);
      res.status(500).json({ error: 'No se pudo generar el token de sesión en el servidor.' });
    }
  });

  // Juez de IA (evaluación objetiva post-debate)
  app.post('/api/ai/judge', async (req, res) => {
    if (!aiClient) {
      res.status(503).json({
        error:
          'El Juez de IA requiere configurar la variable de entorno GEMINI_API_KEY en el servidor (Configuración > Secretos).',
      });
      return;
    }

    try {
      const topic = String(req.body?.topic || '').trim().slice(0, 200);
      const participantA = String(req.body?.participantA || 'Participante A').trim().slice(0, 80);
      const participantB = String(req.body?.participantB || 'Participante B').trim().slice(0, 80);
      const transcriptNotes = String(req.body?.transcriptNotes || '').trim().slice(0, 6000);

      if (!topic || transcriptNotes.length < 20) {
        res.status(400).json({
          error:
            'Se necesita un resumen o registro mínimo de las intervenciones del debate (al menos 20 caracteres) para emitir un informe objetivo.',
        });
        return;
      }

      const prompt = `Evalúa el siguiente debate en español de España sobre el tema: "${topic}".
Participante A: ${participantA}
Participante B: ${participantB}

Registro de intervenciones y notas del debate:
${transcriptNotes}

Reglas estrictas:
1. Evalúa exclusivamente la calidad del razonamiento (claridad, coherencia, calidad de pruebas, respuesta a objeciones, detección de contradicciones, respeto y capacidad de reconocer puntos válidos del contrario).
2. NO premies ni penalices ninguna postura ideológica.
3. NO inventes citas, cifras ni hechos que no aparezcan en el texto.
4. Distingue explícitamente entre afirmaciones verificadas/verificables, afirmaciones no verificadas y opiniones expresadas.
5. Calcula una puntuación global (0-100) y una variación ELO justa (-24 a +24) basada en el rigor argumentativo.`;

      const participantSchema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          claridad: { type: Type.INTEGER },
          coherencia: { type: Type.INTEGER },
          calidadPruebas: { type: Type.INTEGER },
          respuestaObjeciones: { type: Type.INTEGER },
          deteccionContradicciones: { type: Type.INTEGER },
          respeto: { type: Type.INTEGER },
          reconocimientoPuntosValidos: { type: Type.INTEGER },
          puntuacionGlobal: { type: Type.INTEGER },
          explicacion: { type: Type.STRING },
          mejoresArgumentos: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          'name',
          'claridad',
          'coherencia',
          'calidadPruebas',
          'respuestaObjeciones',
          'deteccionContradicciones',
          'respeto',
          'reconocimientoPuntosValidos',
          'puntuacionGlobal',
          'explicacion',
          'mejoresArgumentos',
        ],
      };

      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Eres un juez imparcial de debate deliberativo en español de España para la plataforma ANTIRRATHETO. Tu criterio es estrictamente formal y lógico: nunca favoreces una ideología política sobre otra y nunca inventas datos ni citas.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              resumenGeneral: { type: Type.STRING },
              participanteA: participantSchema,
              participanteB: participantSchema,
              clasificacionAfirmaciones: {
                type: Type.OBJECT,
                properties: {
                  afirmacionesVerificadas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  afirmacionesNoVerificadas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  opinionesExpresadas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'afirmacionesVerificadas',
                  'afirmacionesNoVerificadas',
                  'opinionesExpresadas',
                ],
              },
              eloDeltaA: { type: Type.INTEGER },
              eloDeltaB: { type: Type.INTEGER },
            },
            required: [
              'resumenGeneral',
              'participanteA',
              'participanteB',
              'clasificacionAfirmaciones',
              'eloDeltaA',
              'eloDeltaB',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ report: parsed });
    } catch (err) {
      console.error('Error en Juez de IA:', err);
      res.status(502).json({
        error: 'No se pudo generar el informe del Juez de IA en este momento.',
      });
    }
  });

  // Simulador / Modo Entrenamiento con IA
  app.post('/api/ai/trainer', async (req, res) => {
    if (!aiClient) {
      res.status(503).json({
        error:
          'El entrenador de debate requiere configurar la variable de entorno GEMINI_API_KEY en el servidor (Configuración > Secretos).',
      });
      return;
    }

    try {
      const topic = String(req.body?.topic || '').trim().slice(0, 200);
      const userStance = String(req.body?.userStance || 'A favor').trim().slice(0, 80);
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
      const userMessage = String(req.body?.message || '').trim().slice(0, 1500);

      if (!topic || !userMessage) {
        res.status(400).json({ error: 'Se requiere el tema y tu intervención.' });
        return;
      }

      const oppositeSide = userStance === 'A favor' ? 'En contra' : 'A favor';
      const transcriptHistory = history
        .map((m: { role?: string; text?: string }) =>
          `${m.role === 'user' ? 'Usuario' : 'Contrincante IA'}: ${String(m.text || '').slice(0, 800)}`
        )
        .join('\n');

      const prompt = `Tema de debate: "${topic}"
Postura asignada al usuario: ${userStance}
Tu postura asignada (contraria): ${oppositeSide}

Historial previo:
${transcriptHistory || '(Inicio del entrenamiento)'}

Última intervención del usuario:
${userMessage}

Responde en español de España en dos bloques JSON:
1. "reply": Tu réplica argumentada defendiendo con rigor, educación y concreción la postura ${oppositeSide} (máximo 150 palabras), atacando el mejor argumento del usuario sin falacias ni caricaturas.
2. "feedback": Una observación breve y constructiva (1-2 frases) sobre la claridad, posibles puntos débiles o evidencia del argumento que acaba de presentar el usuario.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Eres un interlocutor de entrenamiento dialéctico en ANTIRRATHETO. Defiendes la postura contraria asignada con máximo rigor intelectual y respeto, sin inventar citas ni estadísticas falsas.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              feedback: { type: Type.STRING },
            },
            required: ['reply', 'feedback'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      console.error('Error en entrenador de IA:', err);
      res.status(502).json({
        error: 'El servicio de entrenamiento con IA devolvió un error temporal.',
      });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  function sendJson(ws: WebSocket, payload: Record<string, unknown>) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function broadcastQueueMetrics() {
    const count = waitingQueue.size;
    for (const candidate of waitingQueue.values()) {
      sendJson(candidate.ws, {
        type: 'queue:metrics',
        waitingCount: count,
      });
    }
  }

  function tryMatchCandidate(seeker: QueueCandidate): boolean {
    let bestPeer: QueueCandidate | null = null;
    let bestFitness = -1;
    let bestEvaluation: { contrastScore: number; discrepancyTopics: string[] } | null = null;

    for (const candidate of waitingQueue.values()) {
      if (candidate.uid === seeker.uid) continue;
      if (candidate.ws.readyState !== WebSocket.OPEN) continue;

      // Respetar bloqueos mutuos
      if (
        seeker.blockedUids.includes(candidate.uid) ||
        candidate.blockedUids.includes(seeker.uid)
      ) {
        continue;
      }

      const topicCompatible =
        candidate.topic === seeker.topic ||
        candidate.topic === 'Diálogo abierto' ||
        seeker.topic === 'Diálogo abierto';
      if (!topicCompatible) continue;

      const evalResult = compareCandidates(seeker, candidate);
      const contrast = evalResult.contrastScore;

      // Penalización por repetición de rival reciente
      const isRecent =
        seeker.recentOpponents.includes(candidate.uid) ||
        candidate.recentOpponents.includes(seeker.uid);
      const repeatPenalty = isRecent ? 35 : 0;

      // Compatibilidad ELO para nivel de debate equilibrado
      const eloDiff = Math.abs((seeker.elo || 1200) - (candidate.elo || 1200));
      const eloBonus = Math.max(0, 25 - eloDiff / 20);

      let styleScore = contrast;
      if (seeker.matchStyle === 'moderado') {
        // Preferencia por discrepancias constructivas entre 35% y 65%
        styleScore = 100 - Math.abs(contrast - 50) * 1.4;
      }

      const topicBonus = candidate.topic === seeker.topic ? 20 : 0;
      const fitness = styleScore + eloBonus + topicBonus - repeatPenalty;

      if (fitness > bestFitness) {
        bestFitness = fitness;
        bestPeer = candidate;
        bestEvaluation = evalResult;
      }
    }

    if (!bestPeer || !bestEvaluation) return false;

    waitingQueue.delete(seeker.uid);
    waitingQueue.delete(bestPeer.uid);

    const resolvedTopic =
      seeker.topic !== 'Diálogo abierto' ? seeker.topic : bestPeer.topic;
    const debateId = `dbt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const roomName = `room_${debateId}`;

    const [host, guest] =
      seeker.joinedAt <= bestPeer.joinedAt ? [seeker, bestPeer] : [bestPeer, seeker];

    const matchPayload = {
      type: 'match:found',
      debateId,
      roomName,
      topic: resolvedTopic,
      format: host.format,
      durationLimitMinutes: host.durationLimitMinutes,
      isRanked: true,
      allowSpectators: false,
      contrastScore: bestEvaluation.contrastScore,
      discrepancyTopics: bestEvaluation.discrepancyTopics,
      host: {
        uid: host.uid,
        displayName: host.displayName,
        country: host.country,
        elo: host.elo,
        level: host.level,
        stanceSummary: host.stanceSummary,
      },
      guest: {
        uid: guest.uid,
        displayName: guest.displayName,
        country: guest.country,
        elo: guest.elo,
        level: guest.level,
        stanceSummary: guest.stanceSummary,
      },
    };

    sendJson(host.ws, matchPayload);
    sendJson(guest.ws, matchPayload);
    broadcastQueueMetrics();
    return true;
  }

  function leaveRoom(ws: WebSocket) {
    const meta = socketMeta.get(ws);
    if (!meta?.roomName || !meta.uid) return;
    const roomPeers = rooms.get(meta.roomName);
    if (!roomPeers) return;
    roomPeers.delete(meta.uid);
    for (const peer of roomPeers.values()) {
      sendJson(peer.ws, {
        type: 'room:peer-left',
        uid: meta.uid,
      });
    }
    if (roomPeers.size === 0) {
      rooms.delete(meta.roomName);
    }
    meta.roomName = undefined;
  }

  wss.on('connection', (ws) => {
    socketMeta.set(ws, {});

    ws.on('message', (rawData) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(rawData.toString());
      } catch {
        return;
      }

      const type = msg.type;
      const meta = socketMeta.get(ws) || {};

      if (type === 'queue:join') {
        const uid = sanitizeId(msg.uid);
        if (!uid) return;
        meta.uid = uid;
        socketMeta.set(ws, meta);

        const rawAxes = (msg.axes as Record<string, unknown>) || {};
        const candidate: QueueCandidate = {
          uid,
          displayName:
            typeof msg.displayName === 'string'
              ? msg.displayName.trim().slice(0, 80)
              : 'Participante',
          country:
            typeof msg.country === 'string'
              ? msg.country.trim().slice(0, 64)
              : 'España',
          elo: Number(msg.elo) || 1200,
          level: typeof msg.level === 'string' ? msg.level.slice(0, 40) : 'Interlocutor',
          topic:
            typeof msg.topic === 'string'
              ? msg.topic.trim().slice(0, 160)
              : 'Diálogo abierto',
          format: msg.format === 'libre' ? 'libre' : 'guiado',
          durationLimitMinutes: [5, 10, 15].includes(Number(msg.durationLimitMinutes))
            ? Number(msg.durationLimitMinutes)
            : 10,
          matchStyle:
            msg.matchStyle === 'moderado' ? 'moderado' : 'maxima_discrepancia',
          stanceSummary:
            typeof msg.stanceSummary === 'string'
              ? msg.stanceSummary.trim().slice(0, 200)
              : '',
          axes: {
            economia: Number(rawAxes.economia) || 0,
            social: Number(rawAxes.social) || 0,
            libertadEstado: Number(rawAxes.libertadEstado) || 0,
            territorial: Number(rawAxes.territorial) || 0,
            internacional: Number(rawAxes.internacional) || 0,
            intervencionismo: Number(rawAxes.intervencionismo) || 0,
            ecologia: Number(rawAxes.ecologia) || 0,
            seguridad: Number(rawAxes.seguridad) || 0,
            tradicion: Number(rawAxes.tradicion) || 0,
          },
          answers:
            typeof msg.answers === 'object' && msg.answers !== null
              ? (msg.answers as Record<string, number>)
              : {},
          priorityAreas: Array.isArray(msg.priorityAreas)
            ? msg.priorityAreas.map(String)
            : [],
          blockedUids: Array.isArray(msg.blockedUids) ? msg.blockedUids.map(String) : [],
          recentOpponents: Array.isArray(msg.recentOpponents)
            ? msg.recentOpponents.map(String)
            : [],
          questionMeta:
            typeof msg.questionMeta === 'object' && msg.questionMeta !== null
              ? (msg.questionMeta as Record<string, QuestionMeta>)
              : {},
          ws,
          joinedAt: Date.now(),
        };

        waitingQueue.set(uid, candidate);
        const matched = tryMatchCandidate(candidate);
        if (!matched) {
          broadcastQueueMetrics();
        }
        return;
      }

      if (type === 'queue:leave') {
        const uid = sanitizeId(msg.uid) || meta.uid;
        if (uid) {
          waitingQueue.delete(uid);
          broadcastQueueMetrics();
        }
        return;
      }

      if (type === 'room:join') {
        const roomName = sanitizeId(msg.roomName);
        const uid = sanitizeId(msg.uid);
        if (!roomName || !uid) return;

        leaveRoom(ws);
        meta.uid = uid;
        meta.roomName = roomName;
        socketMeta.set(ws, meta);

        let roomPeers = rooms.get(roomName);
        if (!roomPeers) {
          roomPeers = new Map();
          rooms.set(roomName, roomPeers);
        }

        const existingPeers = Array.from(roomPeers.values()).map((p) => ({
          uid: p.uid,
          displayName: p.displayName,
          role: p.role || 'participant',
        }));

        const displayName =
          typeof msg.displayName === 'string'
            ? msg.displayName.trim().slice(0, 80)
            : 'Participante';
        const role = msg.role === 'spectator' ? 'spectator' : 'participant';

        roomPeers.set(uid, { uid, displayName, role, ws });

        sendJson(ws, {
          type: 'room:joined',
          roomName,
          peers: existingPeers,
        });

        for (const peer of roomPeers.values()) {
          if (peer.uid !== uid) {
            sendJson(peer.ws, {
              type: 'room:peer-joined',
              uid,
              displayName,
              role,
            });
          }
        }
        return;
      }

      if (type === 'room:leave') {
        leaveRoom(ws);
        return;
      }

      if (type === 'room:end') {
        const roomName = sanitizeId(msg.roomName) || meta.roomName;
        if (!roomName) return;
        const roomPeers = rooms.get(roomName);
        if (roomPeers) {
          for (const peer of roomPeers.values()) {
            if (peer.uid !== meta.uid) {
              sendJson(peer.ws, {
                type: 'room:ended',
                byUid: meta.uid,
              });
            }
          }
        }
        leaveRoom(ws);
        return;
      }

      if (
        type === 'webrtc:offer' ||
        type === 'webrtc:answer' ||
        type === 'webrtc:ice' ||
        type === 'room:phase-sync' ||
        type === 'room:transcript-note' ||
        type === 'group:floor-update'
      ) {
        const roomName = sanitizeId(msg.roomName) || meta.roomName;
        const targetUid = sanitizeId(msg.targetUid);
        if (!roomName || !meta.uid) return;
        const roomPeers = rooms.get(roomName);
        if (!roomPeers) return;

        for (const peer of roomPeers.values()) {
          if (peer.uid === meta.uid) continue;
          if (targetUid && peer.uid !== targetUid) continue;
          sendJson(peer.ws, {
            type,
            fromUid: meta.uid,
            payload: msg.payload,
          });
        }
      }
    });

    ws.on('close', () => {
      const meta = socketMeta.get(ws);
      if (meta?.uid && waitingQueue.has(meta.uid)) {
        const entry = waitingQueue.get(meta.uid);
        if (entry?.ws === ws) {
          waitingQueue.delete(meta.uid);
          broadcastQueueMetrics();
        }
      }
      leaveRoom(ws);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ANTIRRATHETO server listening on http://0.0.0.0:${PORT}`);
  });
}

createAppServer().catch((err) => {
  console.error('Error al iniciar el servidor de ANTIRRATHETO:', err);
  process.exit(1);
});
