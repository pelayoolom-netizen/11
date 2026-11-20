import type { NineAxes } from '../types';

export interface NineAxisMeta {
  key: keyof NineAxes;
  title: string;
  leftLabel: string;
  rightLabel: string;
  description: string;
}

export const NINE_AXES_META: NineAxisMeta[] = [
  {
    key: 'economia',
    title: 'Posición económica',
    leftLabel: 'Izquierda económica',
    rightLabel: 'Derecha económica',
    description:
      'Grado de preferencia por la redistribución fiscal y la propiedad pública frente a la iniciativa privada y menores impuestos.',
  },
  {
    key: 'social',
    title: 'Posición social',
    leftLabel: 'Progresismo',
    rightLabel: 'Conservadurismo',
    description:
      'Actitud ante los cambios en normas culturales, diversidad familiar, laicidad y políticas de igualdad.',
  },
  {
    key: 'libertadEstado',
    title: 'Libertad individual frente a autoridad estatal',
    leftLabel: 'Libertad individual',
    rightLabel: 'Autoridad estatal',
    description:
      'Balance entre la autonomía personal, privacidad y libertad de expresión frente a la capacidad de regulación del Estado.',
  },
  {
    key: 'territorial',
    title: 'Organización territorial',
    leftLabel: 'Centralización',
    rightLabel: 'Descentralización territorial',
    description:
      'Distribución del poder político, educativo, sanitario y fiscal entre el Estado central y las comunidades autónomas.',
  },
  {
    key: 'internacional',
    title: 'Política exterior y fronteras',
    leftLabel: 'Apertura internacional',
    rightLabel: 'Soberanismo',
    description:
      'Peso atribuido a la integración europea, multilateralismo y movilidad global frente al control nacional directo.',
  },
  {
    key: 'intervencionismo',
    title: 'Papel económico del Estado',
    leftLabel: 'Intervencionismo',
    rightLabel: 'Liberalismo económico',
    description:
      'Disposición a regular precios, jornadas y sectores estratégicos frente a la desregulación y libertad contractual.',
  },
  {
    key: 'ecologia',
    title: 'Medioambiente y economía',
    leftLabel: 'Ecologismo',
    rightLabel: 'Prioridad al crecimiento',
    description:
      'Prioridad concedida a la descarbonización y límites ambientales frente a la competitividad industrial a corto plazo.',
  },
  {
    key: 'seguridad',
    title: 'Justicia y política penal',
    leftLabel: 'Garantismo',
    rightLabel: 'Seguridad más dura',
    description:
      'Énfasis en la reinserción y las garantías procesales frente al endurecimiento penal y ampliación policial.',
  },
  {
    key: 'tradicion',
    title: 'Cambio institucional y cultural',
    leftLabel: 'Transformación social',
    rightLabel: 'Tradición',
    description:
      'Preferencia por reformar instituciones y costumbres heredadas frente a preservar la continuidad histórica.',
  },
];

export const COUNTRIES_ES: string[] = [
  'España',
  'Alemania',
  'Argentina',
  'Australia',
  'Bélgica',
  'Brasil',
  'Canadá',
  'Chile',
  'Colombia',
  'Dinamarca',
  'Estados Unidos',
  'Francia',
  'Italia',
  'Japón',
  'México',
  'Noruega',
  'Países Bajos',
  'Perú',
  'Polonia',
  'Portugal',
  'Reino Unido',
  'Suecia',
  'Suiza',
  'Uruguay',
];

export const LANGUAGES_ES: string[] = [
  'Español',
  'Catalán',
  'Euskera',
  'Gallego',
  'Inglés',
  'Francés',
  'Alemán',
  'Portugués',
  'Italiano',
];

export function getEloLevel(elo: number): string {
  if (elo >= 1650) return 'Ágora Maestro';
  if (elo >= 1450) return 'Orador Distinguido';
  if (elo >= 1300) return 'Dialéctico';
  if (elo >= 1150) return 'Interlocutor';
  return 'Aprendiz Cívico';
}

export function computeBadges(debatesCount: number, elo: number, streak: number): string[] {
  const badges: string[] = [];
  if (debatesCount >= 1) badges.push('Primer diálogo');
  if (debatesCount >= 5) badges.push('Cinco conversaciones');
  if (debatesCount >= 15) badges.push('Habitual del foro');
  if (streak >= 3) badges.push('Racha constructiva');
  if (elo >= 1300) badges.push('Rigor argumentativo');
  if (elo >= 1500) badges.push('Excelencia dialéctica');
  return badges;
}

export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatAxesSummaryText(axes: NineAxes): string {
  const parts: string[] = [];
  if (axes.economia <= -25) parts.push('Izquierda económica');
  else if (axes.economia >= 25) parts.push('Derecha económica');
  else parts.push('Economía mixta');

  if (axes.social <= -25) parts.push('Progresismo social');
  else if (axes.social >= 25) parts.push('Conservadurismo social');

  if (axes.libertadEstado <= -25) parts.push('Autonomía individual');
  else if (axes.libertadEstado >= 25) parts.push('Estado regulador');

  if (axes.territorial >= 25) parts.push('Descentralización');
  else if (axes.territorial <= -25) parts.push('Centralización');

  return parts.slice(0, 3).join(' · ') || 'Perfil equilibrado';
}
