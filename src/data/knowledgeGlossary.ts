export interface ConceptEntry {
  term: string;
  category: string;
  definition: string;
  exampleInSpain: string;
}

export interface IdeologyEntry {
  name: string;
  family: string;
  summary: string;
  corePrinciples: string[];
}

export const POLITICAL_CONCEPTS: ConceptEntry[] = [
  {
    term: 'Estado de derecho',
    category: 'Instituciones',
    definition:
      'Principio según el cual tanto los ciudadanos como los poderes públicos están sometidos a la ley y a la Constitución, con separación de poderes y control judicial independiente.',
    exampleInSpain: 'Título Preliminar de la Constitución Española de 1978 y control del Tribunal Constitucional.',
  },
  {
    term: 'Principio de subsidiariedad',
    category: 'Organización territorial',
    definition:
      'Criterio por el que una administración superior solo debe asumir funciones cuando las entidades locales o regionales más cercanas al ciudadano no puedan desempeñarlas eficazmente.',
    exampleInSpain: 'Reparto competencial entre ayuntamientos, comunidades autónomas, Estado y Unión Europea.',
  },
  {
    term: 'Progresividad fiscal',
    category: 'Economía',
    definition:
      'Sistema impositivo en el que el porcentaje aplicado aumenta a medida que crece la base imponible de renta o patrimonio.',
    exampleInSpain: 'Tramos escalonados del IRPF frente a impuestos proporcionales o indirectos como el IVA.',
  },
  {
    term: 'Garantismo penal',
    category: 'Justicia',
    definition:
      'Corriente jurídica que exige límites estrictos al poder punitivo del Estado mediante la presunción de inocencia, la proporcionalidad de las penas y la tutela judicial.',
    exampleInSpain: 'Control judicial de las detenciones y exigencia de motivación en la prisión provisional.',
  },
  {
    term: 'Soberanía energética',
    category: 'Energía',
    definition:
      'Capacidad de un país o bloque regional para asegurar el suministro eléctrico y térmico con fuentes propias o diversificadas sin vulnerabilidad crítica exterior.',
    exampleInSpain: 'Debate entre interconexiones europeas, renovables con almacenamiento y vida útil nuclear.',
  },
  {
    term: 'Democracia deliberativa',
    category: 'Democracia',
    definition:
      'Modelo político que complementa el voto periódico con espacios estructurados donde ciudadanos con puntos de vista distintos intercambian razones públicas.',
    exampleInSpain: 'Asambleas ciudadanas por el clima y foros de presupuesto participativo municipal.',
  },
  {
    term: 'Capitalización frente a reparto',
    category: 'Bienestar',
    definition:
      'Dos formas de financiar pensiones: en el sistema de reparto los trabajadores activos pagan las pensiones actuales; en el de capitalización cada persona acumula su propio fondo.',
    exampleInSpain: 'El sistema de la Seguridad Social es de reparto, mientras los planes de empleo privados son de capitalización.',
  },
  {
    term: 'Externalidad negativa',
    category: 'Economía y medioambiente',
    definition:
      'Coste económico o ambiental generado por una actividad privada que no recae sobre quien la produce o consume, sino sobre terceros o el entorno.',
    exampleInSpain: 'Emisiones contaminantes del tráfico urbano o vertidos agrícolas sobre acuíferos.',
  },
  {
    term: 'Autonomía estratégica',
    category: 'Geopolítica',
    definition:
      'Objetivo político de mantener capacidad industrial, tecnológica y de defensa propia para no depender de terceros países en crisis globales.',
    exampleInSpain: 'Iniciativas europeas para fabricar semiconductores, baterías y equipamiento defensivo en la UE.',
  },
  {
    term: 'Laicidad positiva',
    category: 'Derechos y cultura',
    definition:
      'Neutralidad confesional del Estado que garantiza la libertad religiosa sin adoptar religión oficial, manteniendo cooperación institucional cuando corresponde.',
    exampleInSpain: 'Artículo 16 de la Constitución Española sobre aconfesionalidad y libertad de culto.',
  },
  {
    term: 'Flexiguridad laboral',
    category: 'Economía',
    definition:
      'Modelo que combina mercados de trabajo ágiles para contratar con sólidas prestaciones por desempleo y políticas activas de recualificación.',
    exampleInSpain: 'Debate sobre contratos indefinidos, indemnizaciones y formación continua del SEPE.',
  },
  {
    term: 'Soberanía digital',
    category: 'Tecnología',
    definition:
      'Control normativo y técnico de las infraestructuras de datos, algoritmos e inteligencia artificial bajo garantías jurídicas propias.',
    exampleInSpain: 'Aplicación del Reglamento Europeo de Inteligencia Artificial y protección de datos.',
  },
];

export const IDEOLOGY_GLOSSARY: IdeologyEntry[] = [
  {
    name: 'Liberalismo clásico',
    family: 'Tradición liberal',
    summary:
      'Prioriza las libertades individuales, el Estado limitado, el imperio de la ley, la propiedad privada y la economía de libre mercado con mínima intervención estatal.',
    corePrinciples: ['Libertad negativa', 'Mercados abiertos', 'Separación estricta de poderes'],
  },
  {
    name: 'Socialdemocracia',
    family: 'Centroizquierda democrática',
    summary:
      'Defiende una economía de mercado regulada combinada con fiscalidad progresiva y un Estado del bienestar universal en sanidad, educación y pensiones.',
    corePrinciples: ['Justicia social', 'Servicios públicos universales', 'Diálogo social y sindicatos'],
  },
  {
    name: 'Conservadurismo liberal',
    family: 'Centroderecha institucional',
    summary:
      'Combina el respeto por las instituciones históricas, la familia y la seguridad jurídica con disciplina presupuestaria, rebajas fiscales y libre empresa.',
    corePrinciples: ['Continuidad institucional', 'Responsabilidad individual', 'Estabilidad fiscal'],
  },
  {
    name: 'Socioliberalismo',
    family: 'Liberalismo progresista',
    summary:
      'Sostiene la iniciativa privada y las libertades civiles plenas, pero considera necesario que el Estado asegure igualdad de oportunidades y protección ambiental.',
    corePrinciples: ['Derechos civiles amplios', 'Igualdad de oportunidades', 'Competencia regulada'],
  },
  {
    name: 'Ecologismo político',
    family: 'Política verde',
    summary:
      'Sitúa los límites biofísicos del planeta en el centro de la economía y la democracia, impulsando descarbonización acelerada, economía circular y justicia intergeneracional.',
    corePrinciples: ['Transición energética', 'Conservación de biodiversidad', 'Fiscalidad verde'],
  },
  {
    name: 'Democracia cristiana',
    family: 'Humanismo cívico europeo',
    summary:
      'Se apoya en la economía social de mercado, la subsidiariedad, la cohesión comunitaria y la dignidad de la persona por encima tanto del colectivismo como del individualismo extremo.',
    corePrinciples: ['Economía social de mercado', 'Subsidiariedad', 'Cohesión familiar y comunitaria'],
  },
  {
    name: 'Federalismo cívico',
    family: 'Organización territorial',
    summary:
      'Propone una distribución clara y simétrica de competencias entre el poder central y las entidades regionales, basada en lealtad institucional y cooperación fiscal.',
    corePrinciples: ['Autogobierno compartido', 'Cámara territorial real', 'Solidaridad interterritorial'],
  },
  {
    name: 'Socialismo democrático',
    family: 'Izquierda transformadora',
    summary:
      'Busca ampliar el control democrático y público sobre sectores estratégicos, reforzar los derechos laborales y reducir de forma intensa las desigualdades de renta y riqueza.',
    corePrinciples: ['Sector público fuerte', 'Redistribución estructural', 'Democracia económica'],
  },
  {
    name: 'Libertarismo',
    family: 'Liberalismo radical',
    summary:
      'Defiende la máxima reducción del Estado a funciones mínimas de justicia y seguridad, abogando por la plena autonomía personal, contractual y monetaria.',
    corePrinciples: ['Estado mínimo', 'Autopropiedad', 'Desregulación amplia'],
  },
  {
    name: 'Soberanismo cívico',
    family: 'Prioridad nacional',
    summary:
      'Reclama que las decisiones fiscales, fronterizas, industriales y judiciales se mantengan en el ámbito del Estado-nación democrático frente a organismos supranacionales.',
    corePrinciples: ['Control fronterizo', 'Primacía constitucional nacional', 'Reindustrialización propia'],
  },
];

export interface CurrentAffairSpotlight {
  id: string;
  tag: string;
  title: string;
  context: string;
  recommendedTopicTitle: string;
  relatedArea: string;
}

export const CURRENT_AFFAIRS_SPOTLIGHTS: CurrentAffairSpotlight[] = [
  {
    id: 'act_vivienda',
    tag: 'Actualidad · Vivienda',
    title: 'Tensión habitacional en grandes áreas metropolitanas',
    context:
      'Madrid, Barcelona, Valencia y Málaga concentran el debate entre topes al alquiler, regulación de pisos turísticos e incentivos a nueva oferta.',
    recommendedTopicTitle: '¿Deben aplicarse topes legales al precio del alquiler en zonas tensionadas?',
    relatedArea: 'Educación, sanidad y vivienda',
  },
  {
    id: 'act_energia',
    tag: 'Actualidad · Energía',
    title: 'Calendario nuclear, redes eléctricas y precios industriales',
    context:
      'El despliegue renovable abre discusiones sobre estabilidad de red, almacenamiento y prórroga o cierre escalonado de centrales nucleares.',
    recommendedTopicTitle: '¿Debe ampliarse la vida útil de las centrales nucleares en España?',
    relatedArea: 'Medioambiente, energía y cambio climático',
  },
  {
    id: 'act_defensa',
    tag: 'Actualidad · Europa y Defensa',
    title: 'Autonomía estratégica europea e inversión militar',
    context:
      'Los compromisos de gasto en defensa y la coordinación industrial europea plantean dilemas presupuestarios frente al gasto social.',
    recommendedTopicTitle: '¿Debe España superar el 2 % del PIB en presupuesto de defensa?',
    relatedArea: 'Política exterior, defensa y geopolítica',
  },
  {
    id: 'act_ia',
    tag: 'Actualidad · Tecnología',
    title: 'Reglamento Europeo de Inteligencia Artificial y empleo',
    context:
      'La adopción acelerada de modelos generativos exige equilibrar protección de derechos, competitividad empresarial y recualificación laboral.',
    recommendedTopicTitle: '¿Frena la regulación europea de inteligencia artificial la innovación en España?',
    relatedArea: 'Tecnología, privacidad y libertades civiles',
  },
];
