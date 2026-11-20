import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Compass,
  Play,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import {
  ANSWER_OPTIONS,
  POLITICAL_AREAS,
  computeIdeologicalResult,
  getQuestionsForMode,
} from '../data/ideologicalTest';
import type {
  AnswerValue,
  IdeologicalProfile,
  NineAxes,
  PoliticalArea,
  TestMode,
  TestProgress,
} from '../types';

interface IdeologicalTestViewProps {
  existingProgress: TestProgress | null;
  existingProfile: IdeologicalProfile | null;
  onSaveProgress: (data: {
    mode: TestMode;
    currentIndex: number;
    answers: Record<string, AnswerValue>;
    priorityAreas: PoliticalArea[];
    completed: boolean;
  }) => Promise<void>;
  onCompleteTest: (data: {
    modeCompleted: TestMode;
    answeredCount: number;
    axes: NineAxes;
    convictions: string[];
    tensions: string[];
    moderateTopics: string[];
    summaryText: string;
    answers: Record<string, AnswerValue>;
    priorityAreas: PoliticalArea[];
  }) => Promise<void>;
  onGoToProfile: () => void;
}

const MODE_CARDS: Array<{
  mode: TestMode;
  title: string;
  count: number;
  duration: string;
  desc: string;
}> = [
  {
    mode: 'rapido',
    title: 'Test rápido',
    count: 24,
    duration: 'Aprox. 4 minutos',
    desc: 'Recorrido ágil y equilibrado por las 10 áreas políticas para obtener tu primera brújula y empezar a debatir.',
  },
  {
    mode: 'completo',
    title: 'Test completo',
    count: 80,
    duration: 'Aprox. 12–15 minutos',
    desc: 'Evaluación profunda con 8 cuestiones por área y dilemas ético-económicos para un emparejamiento de alta precisión.',
  },
  {
    mode: 'avanzado',
    title: 'Test avanzado',
    count: 150,
    duration: 'Aprox. 25 minutos',
    desc: 'Cuestionario íntegro sobre la realidad española: detecta tensiones sutiles entre valores y temas específicos de debate.',
  },
];

export function IdeologicalTestView({
  existingProgress,
  existingProfile,
  onSaveProgress,
  onCompleteTest,
  onGoToProfile,
}: IdeologicalTestViewProps) {
  const [stage, setStage] = useState<'intro' | 'priorities' | 'quiz'>('intro');
  const [mode, setMode] = useState<TestMode>(existingProgress?.mode || 'rapido');
  const [priorityAreas, setPriorityAreas] = useState<PoliticalArea[]>(
    existingProgress?.priorityAreas || []
  );
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => {
    if (existingProgress?.answersJson) {
      try {
        return JSON.parse(existingProgress.answersJson) as Record<string, AnswerValue>;
      } catch {
        return {};
      }
    }
    return {};
  });
  const [currentIndex, setCurrentIndex] = useState<number>(
    existingProgress?.currentIndex || 0
  );
  const [savingMsg, setSavingMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingProgress && stage === 'intro') {
      setMode(existingProgress.mode);
      setPriorityAreas(existingProgress.priorityAreas || []);
      try {
        const parsed = JSON.parse(existingProgress.answersJson || '{}');
        setAnswers(parsed);
      } catch {
        // mantener actual
      }
      setCurrentIndex(existingProgress.currentIndex || 0);
    }
  }, [existingProgress, stage]);

  const questions = useMemo(() => getQuestionsForMode(mode), [mode]);
  const currentQuestion = questions[Math.min(currentIndex, questions.length - 1)];

  const answeredInCurrentMode = useMemo(
    () => questions.filter((q) => q.id in answers).length,
    [questions, answers]
  );

  const hasSavedProgress = Boolean(
    existingProgress && !existingProgress.completed && Object.keys(answers).length > 0
  );

  const togglePriority = (area: PoliticalArea) => {
    setPriorityAreas((prev) => {
      if (prev.includes(area)) return prev.filter((a) => a !== area);
      if (prev.length >= 4) return [...prev.slice(1), area];
      return [...prev, area];
    });
  };

  const handleStartFresh = (chosenMode: TestMode) => {
    setMode(chosenMode);
    setCurrentIndex(0);
    setStage('priorities');
  };

  const handleResume = () => {
    if (!existingProgress) return;
    setMode(existingProgress.mode);
    setStage('quiz');
  };

  const handleSaveAndPause = async () => {
    setSavingMsg('Guardando progreso...');
    try {
      await onSaveProgress({
        mode,
        currentIndex,
        answers,
        priorityAreas,
        completed: false,
      });
      setSavingMsg('Progreso guardado. Puedes continuar cualquier otro día.');
      setTimeout(() => setSavingMsg(null), 4000);
    } catch {
      setSavingMsg('No se pudo guardar el progreso en este momento.');
    }
  };

  const handleFinish = async (finalAnswers: Record<string, AnswerValue>) => {
    setSubmitting(true);
    try {
      const result = computeIdeologicalResult(finalAnswers, priorityAreas);
      await onSaveProgress({
        mode,
        currentIndex: questions.length - 1,
        answers: finalAnswers,
        priorityAreas,
        completed: true,
      });
      await onCompleteTest({
        modeCompleted: mode,
        answeredCount: Math.max(1, result.answeredCount),
        axes: result.axes,
        convictions: result.convictions,
        tensions: result.tensions,
        moderateTopics: result.moderateTopics,
        summaryText: result.summaryText,
        answers: finalAnswers,
        priorityAreas,
      });
      onGoToProfile();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAnswer = async (val: AnswerValue) => {
    if (!currentQuestion || submitting) return;
    const updated = { ...answers, [currentQuestion.id]: val };
    setAnswers(updated);

    const isLast = currentIndex >= questions.length - 1;
    if (!isLast) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if ((nextIdx + 1) % 6 === 0) {
        onSaveProgress({
          mode,
          currentIndex: nextIdx,
          answers: updated,
          priorityAreas,
          completed: false,
        }).catch(() => {});
      }
    } else {
      await handleFinish(updated);
    }
  };

  if (stage === 'intro') {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
            Cuestionario ideológico multidimensional
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
            Test ideológico avanzado
          </h1>
          <p className="text-sm sm:text-base text-[#777367] max-w-3xl leading-relaxed">
            Inspirado en análisis políticos multidimensionales, este cuestionario recoge 150 afirmaciones y dilemas adaptados a la realidad española en 10 áreas clave. Tus respuestas privadas calibran los nueve ejes de tu perfil y permiten emparejarte con personas que discrepan contigo de forma real.
          </p>
          {existingProfile && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs bg-[#FAF9F5] border border-[#E8E3D8] px-3 py-1.5 rounded-sm text-[#292820]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#A18450]" />
                Ya completaste el modo <strong className="uppercase">{existingProfile.modeCompleted}</strong> ({existingProfile.answeredCount} respuestas). Puedes actualizarlo o ampliarlo en cualquier momento.
              </span>
              <button
                type="button"
                onClick={onGoToProfile}
                className="text-xs text-[#A18450] hover:text-[#79613B] underline underline-offset-4 cursor-pointer"
              >
                Ver mi perfil actual
              </button>
            </div>
          )}
        </div>

        {hasSavedProgress && (
          <div className="bg-[#FFFFFF] border border-[#A18450] rounded-sm p-6 shadow-editorial-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#A18450] font-semibold">
                Progreso guardado disponible
              </p>
              <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                Continúa donde lo dejaste ({existingProgress?.mode.toUpperCase()})
              </h2>
              <p className="text-xs text-[#777367]">
                Llevas {Object.keys(answers).length} respuestas guardadas (pregunta {currentIndex + 1} de {questions.length}).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResume}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Continuar test
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setCurrentIndex(0);
                }}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-[#777367] text-xs uppercase tracking-[0.14em] rounded-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {MODE_CARDS.map((card) => (
            <div
              key={card.mode}
              className="bg-white border border-[#E8E3D8] hover:border-[#A18450] rounded-sm p-6 shadow-editorial-sm flex flex-col justify-between space-y-6 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tabular text-xs font-semibold text-[#A18450] uppercase tracking-wider">
                    {card.count} preguntas
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#777367]">
                    <Clock className="w-3.5 h-3.5" />
                    {card.duration}
                  </span>
                </div>
                <h3 className="font-editorial text-2xl font-semibold text-[#292820]">
                  {card.title}
                </h3>
                <p className="text-sm text-[#777367] leading-relaxed">{card.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleStartFresh(card.mode)}
                className="w-full py-3 px-4 bg-[#292820] hover:bg-[#3F3D32] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm transition-colors cursor-pointer"
              >
                Elegir {card.title}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'priorities') {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-10 shadow-editorial space-y-7">
        <div className="space-y-2 border-b border-[#E8E3D8] pb-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#A18450] font-semibold">
            Paso previo opcional · {mode === 'rapido' ? '24 preguntas' : mode === 'completo' ? '80 preguntas' : '150 preguntas'}
          </p>
          <h2 className="font-editorial text-3xl font-semibold text-[#292820]">
            ¿Qué áreas políticas te importan más?
          </h2>
          <p className="text-sm text-[#777367]">
            Selecciona hasta 4 áreas prioritarias. Las preguntas de estas áreas tendrán mayor peso en tu perfil y al buscar rivales que también den importancia a estos temas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {POLITICAL_AREAS.map((area) => {
            const active = priorityAreas.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => togglePriority(area)}
                className={`p-3.5 text-left rounded-sm border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-[#FAF9F5] border-[#A18450] text-[#292820]'
                    : 'bg-white border-[#E8E3D8] text-[#777367] hover:border-[#A18450]'
                }`}
              >
                <span className="text-sm font-medium">{area}</span>
                {active && <BookmarkCheck className="w-4 h-4 text-[#A18450] shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E8E3D8]">
          <button
            type="button"
            onClick={() => setStage('intro')}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#777367] hover:text-[#292820] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cambiar modalidad
          </button>
          <button
            type="button"
            onClick={() => setStage('quiz')}
            className="inline-flex items-center gap-2 px-7 py-3 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer"
          >
            Comenzar cuestionario
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const pct = Math.round(((currentIndex + 1) / questions.length) * 100);
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E8E3D8] rounded-sm px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Compass className="w-4 h-4 text-[#A18450]" />
          <span className="text-xs uppercase tracking-[0.16em] text-[#292820] font-semibold">
            {mode === 'rapido' ? 'Test rápido' : mode === 'completo' ? 'Test completo' : 'Test avanzado'}
          </span>
          <span className="font-mono-tabular text-xs text-[#777367]">
            Pregunta {currentIndex + 1} de {questions.length} ({pct} %)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveAndPause}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-xs text-[#292820] rounded-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#A18450]" />
            Guardar y continuar otro día
          </button>
          <button
            type="button"
            onClick={() => setStage('intro')}
            className="text-xs text-[#777367] hover:text-[#292820] cursor-pointer"
          >
            Salir
          </button>
        </div>
      </div>

      {savingMsg && (
        <div className="bg-white border border-[#A18450] text-[#292820] text-xs px-4 py-2.5 rounded-sm">
          {savingMsg}
        </div>
      )}

      {/* Barra de progreso */}
      <div className="h-1.5 bg-[#E8E3D8] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#A18450] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {currentQuestion && (
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-10 shadow-editorial space-y-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#A18450] font-semibold">
              {currentQuestion.area}
            </span>
            {currentQuestion.isDilemma && (
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] bg-[#FAF9F5] border border-[#E6D8B9] text-[#79613B] px-2.5 py-1 rounded-sm">
                <Sparkles className="w-3 h-3" />
                Dilema de valores
              </span>
            )}
          </div>

          <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#292820] leading-snug">
            {currentQuestion.statement}
          </h2>

          <div className="grid gap-2.5 pt-2">
            {ANSWER_OPTIONS.map((opt) => {
              const selected = currentAnswer === opt.value && currentQuestion.id in answers;
              return (
                <button
                  key={opt.label}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSelectAnswer(opt.value)}
                  className={`w-full text-left px-4 py-3.5 rounded-sm border transition-colors cursor-pointer flex items-center justify-between ${
                    selected
                      ? 'bg-[#292820] text-white border-[#292820]'
                      : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8] hover:border-[#A18450] hover:bg-white'
                  }`}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border ${
                      selected
                        ? 'border-[#E6D8B9] bg-[#A18450]'
                        : 'border-[#D7CEBC] bg-white'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E8E3D8]">
            <button
              type="button"
              disabled={currentIndex === 0 || submitting}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#777367] hover:text-[#292820] disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Anterior
            </button>

            <span className="text-xs text-[#777367]">
              Respondidas: {answeredInCurrentMode}/{questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#A18450] hover:text-[#79613B] cursor-pointer"
              >
                Siguiente
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinish(answers)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.16em] font-medium rounded-sm cursor-pointer"
              >
                {submitting ? 'Calculando perfil...' : 'Finalizar y ver perfil'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
