import React, { useMemo, useState } from 'react';
import { BookOpen, Compass, Newspaper, Search, Sparkles } from 'lucide-react';
import {
  CURRENT_AFFAIRS_SPOTLIGHTS,
  IDEOLOGY_GLOSSARY,
  POLITICAL_CONCEPTS,
} from '../data/knowledgeGlossary';
import type { IdeologicalProfile } from '../types';

interface KnowledgeHubViewProps {
  ideologicalProfile: IdeologicalProfile | null;
  onDebateTopic: (topicTitle: string) => void;
  onTrainTopic: (topicTitle: string) => void;
}

export function KnowledgeHubView({
  ideologicalProfile,
  onDebateTopic,
  onTrainTopic,
}: KnowledgeHubViewProps) {
  const [tab, setTab] = useState<'conceptos' | 'ideologias' | 'actualidad'>('conceptos');
  const [search, setSearch] = useState('');

  const filteredConcepts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return POLITICAL_CONCEPTS;
    return POLITICAL_CONCEPTS.filter(
      (c) =>
        c.term.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredIdeologies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return IDEOLOGY_GLOSSARY;
    return IDEOLOGY_GLOSSARY.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.family.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-7">
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
          Formación cívica y contexto actual
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
          Diccionario político, ideologías y actualidad
        </h1>
        <p className="text-sm text-[#777367] max-w-2xl">
          Consulta definiciones rigurosas de conceptos jurídicos y económicos, corrientes ideológicas y focos informativos de actualidad para fundamentar mejor tus debates.
        </p>
      </div>

      <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 shadow-editorial-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'conceptos', label: 'Diccionario político', icon: BookOpen },
            { id: 'ideologias', label: 'Glosario de ideologías', icon: Compass },
            { id: 'actualidad', label: 'Actualidad y recomendaciones', icon: Newspaper },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as typeof tab)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs rounded-sm border cursor-pointer ${
                  active
                    ? 'bg-[#292820] text-white border-[#292820]'
                    : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8] hover:border-[#A18450]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#A18450]" />
                {item.label}
              </button>
            );
          })}
        </div>

        {tab !== 'actualidad' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#777367] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar términos..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
            />
          </div>
        )}
      </div>

      {tab === 'conceptos' && (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredConcepts.map((c) => (
            <div
              key={c.term}
              className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-3"
            >
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                {c.category}
              </span>
              <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                {c.term}
              </h2>
              <p className="text-sm text-[#777367] leading-relaxed">{c.definition}</p>
              <p className="text-xs bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-3 text-[#292820]">
                <strong className="text-[#79613B]">En España:</strong> {c.exampleInSpain}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'ideologias' && (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredIdeologies.map((ideo) => (
            <div
              key={ideo.name}
              className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-3"
            >
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                {ideo.family}
              </span>
              <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                {ideo.name}
              </h2>
              <p className="text-sm text-[#777367] leading-relaxed">{ideo.summary}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {ideo.corePrinciples.map((p) => (
                  <span
                    key={p}
                    className="text-[11px] bg-[#FAF9F5] border border-[#E8E3D8] px-2.5 py-1 rounded-sm text-[#292820]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'actualidad' && (
        <div className="space-y-5">
          {ideologicalProfile && (
            <div className="bg-[#FAF9F5] border border-[#A18450] rounded-sm p-5 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#A18450] shrink-0 mt-0.5" />
              <div className="text-xs text-[#292820] space-y-1">
                <p className="font-semibold uppercase tracking-[0.14em] text-[#79613B]">
                  Sugerencia personalizada según tu perfil
                </p>
                <p className="text-[#777367]">
                  {ideologicalProfile.tensions[0] || ideologicalProfile.summaryText}
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {CURRENT_AFFAIRS_SPOTLIGHTS.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                    {item.tag}
                  </span>
                  <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
                    {item.title}
                  </h2>
                  <p className="text-sm text-[#777367] leading-relaxed">{item.context}</p>
                  <p className="text-xs font-medium text-[#292820] bg-[#FAF9F5] border border-[#E8E3D8] p-3 rounded-sm">
                    Debate sugerido: «{item.recommendedTopicTitle}»
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8E3D8]">
                  <button
                    type="button"
                    onClick={() => onDebateTopic(item.recommendedTopicTitle)}
                    className="px-4 py-2 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.14em] rounded-sm cursor-pointer"
                  >
                    Debatir este tema
                  </button>
                  <button
                    type="button"
                    onClick={() => onTrainTopic(item.recommendedTopicTitle)}
                    className="px-4 py-2 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-xs uppercase tracking-[0.14em] rounded-sm cursor-pointer"
                  >
                    Entrenar con IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
