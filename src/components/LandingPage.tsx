import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Compass,
  Globe2,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import { BrandLockup } from './BrandMark';
import { PerspectiveCompass } from './PerspectiveCompass';
import heroWestImg from '../assets/images/hero_participant_west_1795128597322.jpg';
import heroEastImg from '../assets/images/hero_participant_east_1795128596530.jpg';
import forumArchitectureImg from '../assets/images/editorial_forum_architecture_1795128597539.jpg';
import perspectiveCompassImg from '../assets/images/editorial_perspective_compass_1795128597377.jpg';
import type { NineAxes } from '../types';

interface LandingPageProps {
  isAuthenticated: boolean;
  onStartDebating: () => void;
  onSignIn: () => void;
  onRegister: () => void;
  onOpenDashboard: () => void;
}

const SAMPLE_PROFILES: Record<'equilibrado' | 'liberal' | 'social', { label: string; axes: NineAxes }> = {
  equilibrado: {
    label: 'Perfil institucional mixto',
    axes: {
      economia: -15,
      social: -22,
      libertadEstado: -18,
      territorial: 24,
      internacional: -35,
      intervencionismo: -12,
      ecologia: -30,
      seguridad: 14,
      tradicion: 8,
    },
  },
  liberal: {
    label: 'Perfil liberal reformista',
    axes: {
      economia: 64,
      social: -28,
      libertadEstado: -62,
      territorial: 18,
      internacional: -48,
      intervencionismo: 68,
      ecologia: 15,
      seguridad: 22,
      tradicion: -10,
    },
  },
  social: {
    label: 'Perfil socialdemócrata y ecológico',
    axes: {
      economia: -66,
      social: -60,
      libertadEstado: 20,
      territorial: 38,
      internacional: -42,
      intervencionismo: -64,
      ecologia: -74,
      seguridad: -36,
      tradicion: -48,
    },
  },
};

const FAQ_ITEMS = [
  {
    q: '¿En qué se diferencia ANTIRRATHETO de una red social convencional?',
    a: 'Aquí no hay algoritmos diseñados para amplificar la indignación ni hilos anónimos. Te emparejamos cara a cara por vídeo real con una persona cuyas respuestas políticas contrastan con las tuyas, en turnos ordenados y con evaluación objetiva de la calidad argumentativa.',
  },
  {
    q: '¿Mi perfil ideológico o mis respuestas del test son públicos?',
    a: 'No. Por defecto tanto tu perfil como tus resultados detallados son estrictamente privados. Solo tú decides en Ajustes si deseas mostrar un resumen general en tu ficha pública. Durante el emparejamiento únicamente compartimos tres áreas probables de discrepancia para orientar el debate.',
  },
  {
    q: '¿Cómo funciona el Juez de Inteligencia Artificial y el sistema ELO?',
    a: 'Si ambos participantes dais vuestro consentimiento expreso al iniciar la sala, el sistema analiza las notas o transcripción del debate según claridad, coherencia, uso de pruebas, respuesta a objeciones, respeto y reconocimiento de puntos válidos del contrario, sin premiar ni castigar ninguna ideología.',
  },
  {
    q: '¿Se graban o almacenan los vídeos de mis conversaciones?',
    a: 'No almacenamos grabaciones de vídeo. La comunicación audiovisual se realiza en directo mediante WebRTC y LiveKit cifrado, y puedes cambiar de cámara, silenciarte o abandonar la sala en cualquier momento.',
  },
];

export function LandingPage({
  isAuthenticated,
  onStartDebating,
  onSignIn,
  onRegister,
  onOpenDashboard,
}: LandingPageProps) {
  const [sampleKey, setSampleKey] = useState<'equilibrado' | 'liberal' | 'social'>('equilibrado');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#292820]">
      {/* Barra de navegación */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-sm border-b border-[#E8E3D8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-18 flex items-center justify-between gap-4">
          <BrandLockup onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.16em] text-[#777367]">
            <a href="#como-funciona" className="hover:text-[#292820] transition-colors">
              Cómo funciona
            </a>
            <a href="#perfil-ideologico" className="hover:text-[#292820] transition-colors">
              Test y 9 ejes
            </a>
            <a href="#conversaciones" className="hover:text-[#292820] transition-colors">
              Diálogo real
            </a>
            <a href="#faq" className="hover:text-[#292820] transition-colors">
              Preguntas frecuentes
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm transition-colors cursor-pointer"
              >
                Ir al panel
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="px-3.5 py-2 text-xs uppercase tracking-[0.16em] text-[#292820] hover:text-[#A18450] transition-colors cursor-pointer"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={onRegister}
                  className="px-4 sm:px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm transition-colors cursor-pointer"
                >
                  Crear cuenta
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero principal */}
      <section className="pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-[#E8E3D8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-7">
            <p className="text-[11px] uppercase tracking-[0.26em] text-[#A18450] font-semibold">
              Foro internacional de diálogo cívico y debate político
            </p>
            <h1 className="font-editorial text-5xl sm:text-6xl lg:text-[64px] font-semibold tracking-tight leading-[1.03] text-[#292820]">
              ANTIRRATHETO
            </h1>
            <p className="font-editorial italic text-2xl sm:text-3xl text-[#79613B]">
              «Distintas opiniones. Un solo mundo.»
            </p>
            <p className="text-base sm:text-lg text-[#777367] leading-relaxed max-w-xl">
              Conecta cara a cara mediante videollamadas reales con personas que piensan diferente a ti. Descubre tu mapa ideológico en nueve ejes, contrasta argumentos con respeto y entrena tu criterio sin cámaras de eco.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onStartDebating}
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm transition-colors shadow-editorial-sm cursor-pointer"
              >
                EMPEZAR A DEBATIR
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-[#E8E3D8] hover:border-[#A18450] text-[#292820] text-xs uppercase tracking-[0.2em] font-medium rounded-sm transition-colors"
              >
                CÓMO FUNCIONA
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#E8E3D8] max-w-lg">
              <div>
                <p className="font-mono-tabular text-2xl font-medium text-[#292820]">150</p>
                <p className="text-xs text-[#777367] mt-1">Afirmaciones y dilemas</p>
              </div>
              <div>
                <p className="font-mono-tabular text-2xl font-medium text-[#292820]">300+</p>
                <p className="text-xs text-[#777367] mt-1">Temas con pros y contras</p>
              </div>
              <div>
                <p className="font-mono-tabular text-2xl font-medium text-[#292820]">9 ejes</p>
                <p className="text-xs text-[#777367] mt-1">Brújula multidimensional</p>
              </div>
            </div>
          </div>

          {/* Composición visual de dos participantes conectados */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-[#E8E3D8] rounded-sm p-5 sm:p-7 shadow-editorial space-y-5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[#777367] border-b border-[#E8E3D8] pb-3.5">
                <span className="inline-flex items-center gap-2 text-[#292820] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#A18450]" />
                  Sala en directo · Formato guiado 10 min
                </span>
                <span className="font-mono-tabular text-[#79613B]">Contraste 78 %</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch relative">
                <div className="border border-[#E8E3D8] rounded-sm overflow-hidden bg-[#FAF9F5]">
                  <img
                    src={heroWestImg}
                    alt="Participante desde Madrid en videollamada de debate"
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                  <div className="p-3.5 bg-white border-t border-[#E8E3D8] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#292820]">Lucía Serrano</p>
                      <p className="text-[11px] text-[#777367]">Madrid, España</p>
                    </div>
                    <span className="text-[11px] font-mono-tabular text-[#79613B] bg-[#FAF9F5] border border-[#E8E3D8] px-2 py-0.5 rounded-sm">
                      ELO 1340
                    </span>
                  </div>
                </div>

                <div className="border border-[#E8E3D8] rounded-sm overflow-hidden bg-[#FAF9F5]">
                  <img
                    src={heroEastImg}
                    alt="Participante desde Buenos Aires conectado en debate"
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                  <div className="p-3.5 bg-white border-t border-[#E8E3D8] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#292820]">Mateo Alarcón</p>
                      <p className="text-[11px] text-[#777367]">Buenos Aires, Argentina</p>
                    </div>
                    <span className="text-[11px] font-mono-tabular text-[#79613B] bg-[#FAF9F5] border border-[#E8E3D8] px-2 py-0.5 rounded-sm">
                      ELO 1318
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#A18450] font-semibold">
                  Tema de conversación propuesto
                </p>
                <p className="font-editorial text-xl text-[#292820]">
                  «¿Debe ampliarse la vida útil de las centrales nucleares o acelerar su cierre en favor de renovables con almacenamiento?»
                </p>
                <p className="text-xs text-[#777367]">
                  Discrepancias detectadas: Soberanía energética · Fiscalidad verde · Intervencionismo estatal
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-20 sm:py-24 border-b border-[#E8E3D8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
              Metodología en cuatro pasos
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
              Cómo funciona ANTIRRATHETO
            </h2>
            <p className="text-[#777367] text-base leading-relaxed">
              Un recorrido estructurado para superar etiquetas simplistas, encontrar interlocutores genuinamente distintos y mejorar tu capacidad argumentativa.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '01',
                icon: Compass,
                title: 'Realiza el test ideológico',
                desc: 'Elige entre 24, 80 o 150 preguntas con afirmaciones y dilemas políticos reales de España. Guarda tu progreso cuando quieras.',
              },
              {
                num: '02',
                icon: Sparkles,
                title: 'Emparejamiento inteligente',
                desc: 'Comparamos pregunta a pregunta tus prioridades con las de otros usuarios para hallar contraste moderado o máxima discrepancia.',
              },
              {
                num: '03',
                icon: Video,
                title: 'Videollamada estructurada',
                desc: 'Debate en directo en sesiones de 5, 10 o 15 minutos, en formato guiado por fases o conversación libre, individual o por equipos.',
              },
              {
                num: '04',
                icon: Scale,
                title: 'Informe imparcial y ELO',
                desc: 'Con consentimiento mutuo, el Juez de IA evalúa rigor, pruebas y respeto sin sesgo ideológico y actualiza tu nivel dialéctico.',
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm flex flex-col justify-between space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular text-xs text-[#A18450] font-semibold tracking-widest">
                      PASO {step.num}
                    </span>
                    <Icon className="w-5 h-5 text-[#A18450]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-editorial text-2xl font-semibold text-[#292820]">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#777367] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Descubre perspectivas / 9 ejes */}
      <section id="perfil-ideologico" className="py-20 sm:py-24 bg-white border-b border-[#E8E3D8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
              Más allá de izquierda y derecha
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
              Descubre tu perfil en nueve dimensiones políticas
            </h2>
            <p className="text-[#777367] leading-relaxed">
              Las etiquetas partidistas reducen matices esenciales. Nuestro cuestionario calcula nueve escalas independientes, identifica tus convicciones centrales, señala posibles tensiones entre tus principios y destaca los temas donde mantienes una postura moderada.
            </p>

            <div className="space-y-2 pt-2">
              <p className="text-xs uppercase tracking-[0.16em] text-[#777367]">
                Explora ejemplos de perfil:
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SAMPLE_PROFILES) as Array<keyof typeof SAMPLE_PROFILES>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSampleKey(key)}
                    className={`px-3.5 py-2 text-xs rounded-sm border transition-colors cursor-pointer ${
                      sampleKey === key
                        ? 'bg-[#292820] text-white border-[#292820]'
                        : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8] hover:border-[#A18450]'
                    }`}
                  >
                    {SAMPLE_PROFILES[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[#E8E3D8] rounded-sm overflow-hidden">
              <img
                src={perspectiveCompassImg}
                alt="Representación editorial de la brújula de perspectivas"
                className="w-full h-44 object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm">
            <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-4 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#A18450] font-semibold">
                  Vista previa interactiva
                </p>
                <h3 className="font-editorial text-2xl font-semibold text-[#292820]">
                  {SAMPLE_PROFILES[sampleKey].label}
                </h3>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#A18450]" />
            </div>

            <PerspectiveCompass axes={SAMPLE_PROFILES[sampleKey].axes} />

            <p className="text-[11px] text-[#777367] mt-6 pt-4 border-t border-[#E8E3D8]">
              Nota metodológica: el perfil resume tus respuestas de manera descriptiva, no constituye ningún diagnóstico científico y es privado por defecto.
            </p>
          </div>
        </div>
      </section>

      {/* Conversaciones internacionales y biblioteca */}
      <section id="conversaciones" className="py-20 sm:py-24 border-b border-[#E8E3D8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-white border border-[#E8E3D8] rounded-sm overflow-hidden shadow-editorial">
              <img
                src={forumArchitectureImg}
                alt="Arquitectura luminosa de diálogo cívico internacional"
                className="w-full h-72 sm:h-80 object-cover"
              />
              <div className="p-6 grid grid-cols-2 gap-6 border-t border-[#E8E3D8]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#A18450]">
                    <Users className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-[0.16em] font-semibold">
                      1v1 y por equipos
                    </span>
                  </div>
                  <p className="text-sm text-[#777367]">
                    Salas individuales o debates grupales de 2v2, 3v3 y hasta 7 participantes por bando con turno de palabra.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#A18450]">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-[0.16em] font-semibold">
                      Entrenamiento IA
                    </span>
                  </div>
                  <p className="text-sm text-[#777367]">
                    Practica antes tus argumentos frente a un interlocutor artificial que defiende la postura contraria con rigor.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
              Conversaciones internacionales y plurales
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
              Por qué importa debatir con quien disiente
            </h2>
            <p className="text-[#777367] leading-relaxed">
              Escuchar a alguien que parte de premisas distintas obliga a pulir las propias razones, abandonar eslóganes y distinguir entre hechos verificables, interpretaciones y juicios de valor.
            </p>

            <div className="space-y-4 pt-2">
              {[
                {
                  icon: Globe2,
                  title: 'Perspectivas entre territorios y países',
                  desc: 'Contrasta debates sobre vivienda, fiscalidad, energía o modelo territorial con ciudadanos de distintas comunidades y países.',
                },
                {
                  icon: Scale,
                  title: 'Biblioteca de 300 temas equilibrados',
                  desc: 'Cada pregunta incluye contexto neutral, dos argumentos principales a favor, dos en contra y preguntas de profundización.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Espacio seguro, privado y moderado',
                  desc: 'Sistema de bloqueo, reporte, salas privadas por código de invitación con amigos y sin grabaciones de vídeo almacenadas.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-4 bg-white border border-[#E8E3D8] rounded-sm p-4">
                    <div className="p-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-[#A18450] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-editorial text-xl font-semibold text-[#292820]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#777367] mt-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-24 bg-white border-b border-[#E8E3D8]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-10">
          <div className="text-center space-y-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
              Transparencia y funcionamiento
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="divide-y divide-[#E8E3D8] border-y border-[#E8E3D8]">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="font-editorial text-xl sm:text-2xl font-medium text-[#292820]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#A18450] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-sm text-[#777367] leading-relaxed mt-3 pr-8">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final y pie */}
      <footer className="py-16 bg-[#FAF9F5]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <BrandLockup />
            <p className="text-sm text-[#777367]">
              ANTIRRATHETO — Plataforma de debate político deliberativo en directo. Distintas opiniones, un solo mundo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onStartDebating}
              className="px-6 py-3 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm transition-colors cursor-pointer"
            >
              EMPEZAR A DEBATIR
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
