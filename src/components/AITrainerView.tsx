import React, { useEffect, useState } from 'react';
import { Bot, RotateCcw, Send, Sparkles } from 'lucide-react';
import { DEBATE_TOPICS_300 } from '../data/debateTopics';

interface AITrainerViewProps {
  initialTopic?: string | null;
}

interface TrainerTurn {
  role: 'user' | 'ai';
  text: string;
  feedback?: string;
}

export function AITrainerView({ initialTopic }: AITrainerViewProps) {
  const [topic, setTopic] = useState(initialTopic || DEBATE_TOPICS_300[0].title);
  const [userStance, setUserStance] = useState<'A favor' | 'En contra'>('A favor');
  const [turns, setTurns] = useState<TrainerTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      setTurns([]);
      setErrorMsg(null);
    }
  }, [initialTopic]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;

    setErrorMsg(null);
    const nextTurns: TrainerTurn[] = [...turns, { role: 'user', text: message }];
    setTurns(nextTurns);
    setDraft('');
    setLoading(true);

    try {
      const resp = await fetch('/api/ai/trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          userStance,
          history: turns.map((t) => ({ role: t.role, text: t.text })),
          message,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.error || 'No se pudo obtener respuesta del entrenador de debate.');
        return;
      }

      setTurns((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.reply,
          feedback: data.feedback,
        },
      ]);
    } catch {
      setErrorMsg('Error de red al conectar con el servidor de entrenamiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
          Simulador de preparación dialéctica
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
          Entrenamiento previo con IA
        </h1>
        <p className="text-sm text-[#777367] max-w-2xl">
          Ensaya tus argumentos antes de entrar a una videollamada real. La IA defenderá con rigor la postura contraria a la tuya y te dará retroalimentación constructiva en cada turno.
        </p>
      </div>

      <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 shadow-editorial-sm grid md:grid-cols-12 gap-4 items-end">
        <label className="md:col-span-7 block space-y-1.5">
          <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
            Tema de entrenamiento
          </span>
          <select
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setTurns([]);
              setErrorMsg(null);
            }}
            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
          >
            {DEBATE_TOPICS_300.slice(0, 60).map((t) => (
              <option key={t.id} value={t.title}>
                {t.title}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-3 space-y-1.5">
          <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium block">
            Tu postura asignada
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(['A favor', 'En contra'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setUserStance(s);
                  setTurns([]);
                }}
                className={`py-2.5 px-2 text-xs rounded-sm border cursor-pointer ${
                  userStance === s
                    ? 'bg-[#292820] text-white border-[#292820]'
                    : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => {
              setTurns([]);
              setErrorMsg(null);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-xs text-[#292820] rounded-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#A18450]" />
            Reiniciar
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-white border border-[#C97B63] text-[#793B2B] text-xs p-4 rounded-sm">
          {errorMsg}
        </div>
      )}

      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-3 text-xs text-[#777367]">
          <span>
            Defiendes: <strong className="text-[#292820]">{userStance}</strong> · El contrincante IA defiende:{' '}
            <strong className="text-[#79613B]">
              {userStance === 'A favor' ? 'En contra' : 'A favor'}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#A18450]">
            <Bot className="w-4 h-4" />
            Entrenador dialéctico
          </span>
        </div>

        <div className="space-y-4 min-h-[260px] max-h-[460px] overflow-y-auto pr-1">
          {turns.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-[#777367]">
              <p className="font-editorial text-2xl text-[#292820]">
                Presenta tu primer argumento inicial
              </p>
              <p className="text-xs max-w-md mx-auto">
                Expón en un párrafo por qué defiendes la postura «{userStance}» sobre este tema. Recibirás una réplica argumentada y consejos prácticos para reforzar tu exposición.
              </p>
            </div>
          ) : (
            turns.map((turn, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-sm border space-y-2 ${
                  turn.role === 'user'
                    ? 'bg-[#FAF9F5] border-[#E8E3D8] ml-6'
                    : 'bg-white border-[#A18450] mr-6'
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#A18450]">
                  {turn.role === 'user' ? 'Tu intervención' : 'Réplica del contrincante IA'}
                </p>
                <p className="text-sm text-[#292820] leading-relaxed whitespace-pre-line">
                  {turn.text}
                </p>
                {turn.feedback && (
                  <div className="mt-2 pt-2 border-t border-[#E8E3D8] text-xs text-[#79613B] flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#A18450]" />
                    <span>
                      <strong>Nota formativa:</strong> {turn.feedback}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#E8E3D8]">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribe tu argumento o contrarréplica..."
            className="flex-1 px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#A18450] hover:bg-[#79613B] disabled:opacity-50 text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Analizando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
