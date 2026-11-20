import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Compass,
  Info,
  Lock,
  RefreshCw,
  Scale,
  Sparkles,
} from 'lucide-react';
import { PerspectiveCompass } from './PerspectiveCompass';
import type { IdeologicalProfile, UserAccount } from '../types';

interface IdeologicalProfileViewProps {
  userAccount: UserAccount;
  profile: IdeologicalProfile | null;
  onStartOrRetakeTest: () => void;
  onFindDebate: () => void;
  onGoToSettings: () => void;
}

export function IdeologicalProfileView({
  userAccount,
  profile,
  onStartOrRetakeTest,
  onFindDebate,
  onGoToSettings,
}: IdeologicalProfileViewProps) {
  if (!profile) {
    return (
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-8 sm:p-12 shadow-editorial-sm text-center max-w-2xl mx-auto space-y-5">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF9F5] border border-[#E8E3D8] flex items-center justify-center text-[#A18450]">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="font-editorial text-3xl font-semibold text-[#292820]">
          Aún no has completado tu perfil ideológico
        </h1>
        <p className="text-sm text-[#777367] leading-relaxed">
          Completa el test rápido (4 minutos), completo u avanzado para descubrir tu posición en los 9 ejes políticos, conocer tus convicciones principales y habilitar el emparejamiento inteligente pregunta a pregunta.
        </p>
        <button
          type="button"
          onClick={onStartOrRetakeTest}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer"
        >
          Realizar test ideológico
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabecera de resumen */}
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#A18450] font-semibold">
              Mapa ideológico personalizado
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] bg-[#FAF9F5] border border-[#E8E3D8] px-2.5 py-0.5 rounded-sm text-[#777367]">
              <Lock className="w-3 h-3 text-[#A18450]" />
              {userAccount.showAxesPublicly
                ? 'Resumen visible en ficha pública'
                : 'Privado por defecto'}
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
            Tus nueve ejes de perspectiva política
          </h1>
          <p className="text-sm sm:text-base text-[#777367] leading-relaxed">
            {profile.summaryText}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={onStartOrRetakeTest}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] hover:border-[#A18450] text-[#292820] text-xs uppercase tracking-[0.16em] rounded-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#A18450]" />
            Actualizar test
          </button>
          <button
            type="button"
            onClick={onFindDebate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.16em] font-medium rounded-sm cursor-pointer"
          >
            Buscar debate
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Escalas visuales de 9 ejes */}
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E3D8] pb-4">
          <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
            Desglose dimensional ({profile.answeredCount} respuestas en modo {profile.modeCompleted})
          </h2>
          <button
            type="button"
            onClick={onGoToSettings}
            className="text-xs text-[#A18450] hover:text-[#79613B] underline underline-offset-4 cursor-pointer"
          >
            Configurar privacidad pública
          </button>
        </div>

        <PerspectiveCompass axes={profile.axes} showDescriptions />
      </div>

      {/* Convicciones, tensiones y temas moderados */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
            <Sparkles className="w-4 h-4" />
            Convicciones principales
          </div>
          {profile.convictions.length > 0 ? (
            <ul className="space-y-2.5 text-sm text-[#292820]">
              {profile.convictions.map((c) => (
                <li
                  key={c}
                  className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm px-3 py-2"
                >
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#777367]">
              Tus respuestas muestran posturas matizadas sin extremos marcados.
            </p>
          )}
        </div>

        <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
            <AlertCircle className="w-4 h-4" />
            Posibles tensiones de valores
          </div>
          <ul className="space-y-2.5 text-sm text-[#777367] leading-relaxed">
            {profile.tensions.map((t) => (
              <li
                key={t}
                className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm px-3 py-2.5 text-[#292820]"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
            <Scale className="w-4 h-4" />
            Temas con postura moderada
          </div>
          {profile.moderateTopics.length > 0 ? (
            <ul className="space-y-2.5 text-sm text-[#292820]">
              {profile.moderateTopics.map((m) => (
                <li
                  key={m}
                  className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm px-3 py-2"
                >
                  {m}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#777367]">
              No se han registrado posturas intermedias destacadas.
            </p>
          )}
        </div>
      </div>

      {/* Aviso explícito */}
      <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 flex items-start gap-3 text-xs text-[#777367]">
        <Info className="w-4 h-4 text-[#A18450] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Aviso metodológico: este perfil es una herramienta descriptiva basada exclusivamente en las respuestas que has expresado en ANTIRRATHETO. No constituye un diagnóstico científico ni una clasificación definitiva de tu pensamiento político.
        </p>
      </div>
    </div>
  );
}
