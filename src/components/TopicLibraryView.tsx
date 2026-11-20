import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flame,
  Newspaper,
  Plus,
  Search,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { DEBATE_TOPICS_300 } from '../data/debateTopics';
import { POLITICAL_AREAS } from '../data/ideologicalTest';
import type { DebateTopicItem, PoliticalArea, ProposedTopicItem } from '../types';

interface TopicLibraryViewProps {
  favoriteTopics: string[];
  proposedTopics: ProposedTopicItem[];
  onToggleFavorite: (topicTitle: string) => Promise<void>;
  onDebateTopic: (topicTitle: string) => void;
  onTrainTopic: (topicTitle: string) => void;
  onSubmitProposal: (data: {
    title: string;
    description: string;
    category: PoliticalArea;
    difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  }) => Promise<void>;
}

const PAGE_SIZE = 18;

export function TopicLibraryView({
  favoriteTopics,
  proposedTopics,
  onToggleFavorite,
  onDebateTopic,
  onTrainTopic,
  onSubmitProposal,
}: TopicLibraryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [difficulty, setDifficulty] = useState<string>('Todas');
  const [tab, setTab] = useState<'todos' | 'populares' | 'actualidad' | 'favoritos' | 'propuestos'>('todos');
  const [page, setPage] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState<DebateTopicItem | null>(null);

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propCategory, setPropCategory] = useState<PoliticalArea>(POLITICAL_AREAS[0]);
  const [propDiff, setPropDiff] = useState<'Básico' | 'Intermedio' | 'Avanzado'>('Intermedio');
  const [propError, setPropError] = useState<string | null>(null);
  const [submittingProp, setSubmittingProp] = useState(false);

  const approvedProposalsAsTopics: DebateTopicItem[] = useMemo(
    () =>
      proposedTopics
        .filter((p) => p.status === 'approved')
        .map((p) => ({
          id: p.topicId,
          title: p.title,
          description: p.description,
          category: p.category,
          difficulty: p.difficulty,
          pros: ['Perspectiva favorable propuesta por la comunidad.'],
          cons: ['Objeción o enfoque alternativo planteado en el debate.'],
          followUpQuestions: ['¿Qué datos respaldan esta propuesta en el contexto español?'],
        })),
    [proposedTopics]
  );

  const allTopics = useMemo(
    () => [...DEBATE_TOPICS_300, ...approvedProposalsAsTopics],
    [approvedProposalsAsTopics]
  );

  const filteredTopics = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allTopics.filter((t) => {
      if (tab === 'populares' && !t.popular) return false;
      if (tab === 'actualidad' && !t.currentAffairs) return false;
      if (tab === 'favoritos' && !favoriteTopics.includes(t.title)) return false;
      if (selectedCategory !== 'Todas' && t.category !== selectedCategory) return false;
      if (difficulty !== 'Todas' && t.difficulty !== difficulty) return false;
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q) &&
        !t.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [allTopics, tab, favoriteTopics, selectedCategory, difficulty, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filteredTopics.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropError(null);
    if (propTitle.trim().length < 8) {
      setPropError('La pregunta o título debe tener al menos 8 caracteres.');
      return;
    }
    if (propDesc.trim().length < 15) {
      setPropError('Añade una breve descripción neutral de al menos 15 caracteres.');
      return;
    }
    setSubmittingProp(true);
    try {
      await onSubmitProposal({
        title: propTitle.trim(),
        description: propDesc.trim(),
        category: propCategory,
        difficulty: propDiff,
      });
      setPropTitle('');
      setPropDesc('');
      setShowProposalModal(false);
      setTab('propuestos');
    } catch (err) {
      setPropError(err instanceof Error ? err.message : 'No se pudo enviar la propuesta.');
    } finally {
      setSubmittingProp(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Cabecera */}
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
            Biblioteca deliberativa · {allTopics.length} temas disponibles
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
            Temas de debate
          </h1>
          <p className="text-sm text-[#777367] max-w-2xl">
            Explora cientos de preguntas políticas equilibradas con argumentos a favor, argumentos en contra y cuestiones de profundización. Guarda favoritos o propón nuevos debates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowProposalModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Proponer tema
        </button>
      </div>

      {/* Filtros y pestañas */}
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 shadow-editorial-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'todos', label: 'Todos los temas', icon: null },
            { id: 'populares', label: 'Populares', icon: Flame },
            { id: 'actualidad', label: 'Actualidad', icon: Newspaper },
            { id: 'favoritos', label: `Favoritos (${favoriteTopics.length})`, icon: Bookmark },
            { id: 'propuestos', label: `Mis propuestas (${proposedTopics.length})`, icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id as typeof tab);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-sm border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#292820] text-white border-[#292820]'
                    : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8] hover:border-[#A18450]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-[#A18450]" />}
                {item.label}
              </button>
            );
          })}
        </div>

        {tab !== 'propuestos' && (
          <div className="grid sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-[#777367] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por palabra clave, ley o dilema..."
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              >
                <option value="Todas">Todas las áreas políticas (10)</option>
                {POLITICAL_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              >
                <option value="Todas">Cualquier dificultad</option>
                <option value="Básico">Nivel Básico</option>
                <option value="Intermedio">Nivel Intermedio</option>
                <option value="Avanzado">Nivel Avanzado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de propuestas si está seleccionada esa pestaña */}
      {tab === 'propuestos' ? (
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 space-y-4">
          <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
            Propuestas enviadas a moderación
          </h2>
          {proposedTopics.length === 0 ? (
            <p className="text-sm text-[#777367]">
              Todavía no has enviado ningún tema nuevo. Pulsa «Proponer tema» para sugerir una pregunta de debate.
            </p>
          ) : (
            <div className="divide-y divide-[#E8E3D8]">
              {proposedTopics.map((p) => (
                <div key={p.topicId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                      {p.category} · {p.difficulty}
                    </p>
                    <p className="font-editorial text-xl font-medium text-[#292820] mt-1">
                      {p.title}
                    </p>
                    <p className="text-xs text-[#777367] mt-1">{p.description}</p>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.14em] px-3 py-1 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-[#79613B] shrink-0">
                    {p.status === 'approved'
                      ? 'Aprobado'
                      : p.status === 'rejected'
                        ? 'Rechazado'
                        : 'Pendiente de moderación'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-[#777367]">
            <span>
              Mostrando <strong className="text-[#292820]">{filteredTopics.length}</strong> temas
            </span>
            <span>
              Página {safePage} de {totalPages}
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((topic) => {
              const isFav = favoriteTopics.includes(topic.title);
              return (
                <div
                  key={topic.id}
                  className="bg-white border border-[#E8E3D8] hover:border-[#A18450] rounded-sm p-5 shadow-editorial-sm flex flex-col justify-between space-y-4 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-[#A18450] font-semibold line-clamp-1">
                        {topic.category}
                      </span>
                      <span className="text-[10px] font-mono-tabular px-2 py-0.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-[#777367] shrink-0">
                        {topic.difficulty}
                      </span>
                    </div>

                    <h3 className="font-editorial text-xl font-semibold text-[#292820] leading-snug">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-[#777367] leading-relaxed line-clamp-3">
                      {topic.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E8E3D8] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className="text-xs font-medium text-[#A18450] hover:text-[#79613B] underline underline-offset-4 cursor-pointer"
                    >
                      Ver guía y argumentos
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(topic.title)}
                        title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                        className={`p-1.5 border rounded-sm cursor-pointer transition-colors ${
                          isFav
                            ? 'bg-[#292820] text-[#E6D8B9] border-[#292820]'
                            : 'bg-[#FAF9F5] text-[#777367] border-[#E8E3D8] hover:border-[#A18450]'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDebateTopic(topic.title)}
                        className="px-3 py-1.5 bg-[#A18450] hover:bg-[#79613B] text-white text-[11px] uppercase tracking-[0.14em] rounded-sm cursor-pointer"
                      >
                        Debatir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-white border border-[#E8E3D8] disabled:opacity-40 rounded-sm text-xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
              <span className="font-mono-tabular text-xs text-[#777367]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-white border border-[#E8E3D8] disabled:opacity-40 rounded-sm text-xs cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de detalle del tema */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 bg-[#292820]/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E3D8] rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-editorial space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E3D8] pb-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#A18450] font-semibold">
                  {selectedTopic.category} · Dificultad {selectedTopic.difficulty}
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#292820]">
                  {selectedTopic.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="p-1.5 text-[#777367] hover:text-[#292820] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#777367] leading-relaxed">{selectedTopic.description}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-[#79613B] font-semibold">
                  Argumentos a favor
                </p>
                <ul className="space-y-2 text-xs text-[#292820] list-disc pl-4">
                  {selectedTopic.pros.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-[#79613B] font-semibold">
                  Argumentos en contra
                </p>
                <ul className="space-y-2 text-xs text-[#292820] list-disc pl-4">
                  {selectedTopic.cons.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[#A18450] font-semibold">
                Preguntas para profundizar en sala
              </p>
              <ul className="space-y-1.5 text-sm text-[#292820]">
                {selectedTopic.followUpQuestions.map((q) => (
                  <li key={q} className="bg-[#FAF9F5] border border-[#E8E3D8] px-3 py-2 rounded-sm">
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#E8E3D8]">
              <button
                type="button"
                onClick={() => {
                  const title = selectedTopic.title;
                  setSelectedTopic(null);
                  onTrainTopic(title);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-[#292820] text-xs uppercase tracking-[0.16em] rounded-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#A18450]" />
                Entrenar con IA
              </button>
              <button
                type="button"
                onClick={() => {
                  const title = selectedTopic.title;
                  setSelectedTopic(null);
                  onDebateTopic(title);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.16em] font-medium rounded-sm cursor-pointer"
              >
                <Swords className="w-3.5 h-3.5" />
                Debatir este tema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de proponer tema */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 bg-[#292820]/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleProposalSubmit}
            className="bg-white border border-[#E8E3D8] rounded-sm max-w-lg w-full p-6 sm:p-8 shadow-editorial space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-3">
              <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                Proponer un nuevo tema de debate
              </h2>
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="text-[#777367] hover:text-[#292820] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {propError && (
              <p className="text-xs text-[#793B2B] bg-[#FAF9F5] border border-[#C97B63] p-3 rounded-sm">
                {propError}
              </p>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                Pregunta o enunciado neutral *
              </span>
              <input
                type="text"
                value={propTitle}
                onChange={(e) => setPropTitle(e.target.value)}
                placeholder="Ej. ¿Debería implantarse el voto electrónico en España?"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                Contexto neutral *
              </span>
              <textarea
                rows={3}
                value={propDesc}
                onChange={(e) => setPropDesc(e.target.value)}
                placeholder="Resume brevemente por qué este tema admite posturas contrapuestas legítimas."
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                  Categoría
                </span>
                <select
                  value={propCategory}
                  onChange={(e) => setPropCategory(e.target.value as PoliticalArea)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-xs"
                >
                  {POLITICAL_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                  Dificultad
                </span>
                <select
                  value={propDiff}
                  onChange={(e) =>
                    setPropDiff(e.target.value as 'Básico' | 'Intermedio' | 'Avanzado')
                  }
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-xs"
                >
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </label>
            </div>

            <p className="text-[11px] text-[#777367]">
              Las propuestas se registran con estado pendiente de moderación para garantizar formulaciones imparciales.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="px-4 py-2 text-xs uppercase tracking-[0.14em] text-[#777367] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingProp}
                className="px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.16em] font-medium rounded-sm cursor-pointer"
              >
                {submittingProp ? 'Enviando...' : 'Enviar propuesta'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
