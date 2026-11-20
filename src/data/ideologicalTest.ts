import type {
  AnswerValue,
  NineAxes,
  PoliticalArea,
  TestMode,
  TestQuestion,
} from '../types';

export const POLITICAL_AREAS: PoliticalArea[] = [
  'Economía, impuestos y mercado',
  'Estado, servicios públicos y bienestar',
  'Derechos sociales y cuestiones culturales',
  'Inmigración, fronteras e integración',
  'Medioambiente, energía y cambio climático',
  'Seguridad, justicia y política penal',
  'Democracia, instituciones y organización territorial',
  'Política exterior, defensa y geopolítica',
  'Educación, sanidad y vivienda',
  'Tecnología, privacidad y libertades civiles',
];

export const ANSWER_OPTIONS: Array<{ value: AnswerValue; label: string; short: string }> = [
  { value: 2, label: 'Totalmente de acuerdo', short: 'Muy de acuerdo' },
  { value: 1, label: 'De acuerdo', short: 'De acuerdo' },
  { value: 0, label: 'Neutral / Depende', short: 'Neutral' },
  { value: -1, label: 'En desacuerdo', short: 'En desacuerdo' },
  { value: -2, label: 'Totalmente en desacuerdo', short: 'Muy en desacuerdo' },
  { value: null, label: 'No tengo suficiente información', short: 'Sin información' },
];

type RawQ = [
  id: string,
  areaIdx: number,
  statement: string,
  weights: Partial<Record<keyof NineAxes, number>>,
  topicTag: string,
  isDilemma?: boolean,
];

const RAW_QUESTIONS: RawQ[] = [
  // 0. Economía, impuestos y mercado (15)
  ['eco_01', 0, 'El Estado debería reducir los impuestos aunque eso implique recortar algunos servicios públicos.', { economia: 2, intervencionismo: 2 }, 'Fiscalidad y gasto público'],
  ['eco_02', 0, 'Las grandes fortunas y los beneficios extraordinarios deberían soportar tipos fiscales más altos para financiar la cohesión social.', { economia: -2, intervencionismo: -1 }, 'Impuestos a grandes patrimonios'],
  ['eco_03', 0, 'Dilema: Si tuvieras que elegir para España, ¿priorizarías facilitar la contratación y el despido para dinamizar el empleo aunque aumente la temporalidad?', { economia: 2, intervencionismo: 2 }, 'Flexibilidad laboral frente a estabilidad', true],
  ['eco_04', 0, 'El salario mínimo interprofesional debería subir de forma sostenida aunque algunas pequeñas empresas adviertan de mayores costes laborales.', { economia: -2, intervencionismo: -2 }, 'Salario mínimo y pymes'],
  ['eco_05', 0, 'La competencia abierta entre empresas privadas genera mejores precios y servicios que la gestión pública directa.', { economia: 2, intervencionismo: 2 }, 'Competencia de mercado'],
  ['eco_06', 0, 'Los sectores estratégicos como la red eléctrica o las telecomunicaciones deberían contar con participación pública mayoritaria.', { economia: -2, intervencionismo: -2 }, 'Empresas públicas estratégicas'],
  ['eco_07', 0, 'El impuesto de sucesiones penaliza el ahorro familiar y debería suprimirse o reducirse al mínimo en toda España.', { economia: 2, tradicion: 1 }, 'Impuesto de sucesiones'],
  ['eco_08', 0, 'Limitar legalmente el diferencial salarial entre directivos y trabajadores reduciría la desigualdad sin dañar la productividad.', { economia: -2, intervencionismo: -1 }, 'Brecha salarial'],
  ['eco_09', 0, 'Las cuotas de autónomos deberían ser mucho más bajas durante los primeros años aunque eso reduzca temporalmente su base de cotización.', { economia: 1, intervencionismo: 1 }, 'Régimen de autónomos'],
  ['eco_10', 0, 'Dilema: Ante una recesión, es preferible aumentar el déficit público para sostener el consumo antes que priorizar el equilibrio presupuestario.', { economia: -2, intervencionismo: -2 }, 'Estímulo fiscal frente a estabilidad', true],
  ['eco_11', 0, 'La reducción de la jornada laboral por ley sin rebaja salarial mejora el bienestar sin lastrar la competitividad española.', { economia: -2, intervencionismo: -1 }, 'Jornada laboral'],
  ['eco_12', 0, 'Los convenios colectivos deberían negociarse prioritariamente dentro de cada empresa y no a nivel sectorial o nacional.', { economia: 2, intervencionismo: 1 }, 'Negociación colectiva'],
  ['eco_13', 0, 'El turismo masivo requiere tasas específicas e intervención municipal aunque reduzca el volumen de visitantes.', { intervencionismo: -2, ecologia: -1 }, 'Regulación turística'],
  ['eco_14', 0, 'La simplificación administrativa y la reducción de licencias son más eficaces que las subvenciones para impulsar la economía.', { economia: 2, intervencionismo: 2 }, 'Desregulación frente a subvenciones'],
  ['eco_15', 0, 'Una renta básica universal financiada mediante impuestos progresivos sustituiría con ventaja a la mayoría de ayudas condicionadas.', { economia: -2, libertadEstado: -1 }, 'Renta básica universal'],

  // 1. Estado, servicios públicos y bienestar (15)
  ['est_01', 1, 'La sanidad y la educación públicas deberían tener prioridad presupuestaria sobre cualquier rebaja fiscal.', { economia: -2, intervencionismo: -1 }, 'Prioridad de servicios públicos'],
  ['est_02', 1, 'El sistema público de pensiones debería combinarse gradualmente con planes privados de capitalización para garantizar su sostenibilidad.', { economia: 2, intervencionismo: 2 }, 'Reforma de pensiones'],
  ['est_03', 1, 'La colaboración público-privada en la gestión de hospitales y residencias optimiza recursos sin merma asistencial.', { economia: 2, intervencionismo: 1 }, 'Gestión público-privada'],
  ['est_04', 1, 'Las prestaciones por desempleo deberían ser más generosas en duración y cuantía durante las transiciones laborales.', { economia: -2, intervencionismo: -1 }, 'Protección por desempleo'],
  ['est_05', 1, 'Dilema: Para sostener el Estado del bienestar ante el envejecimiento, es preferible retrasar la edad de jubilación antes que subir las cotizaciones sociales.', { economia: 2, intervencionismo: 1 }, 'Sostenibilidad de las pensiones', true],
  ['est_06', 1, 'El transporte público ferroviario y urbano debería estar fuertemente subvencionado incluso en rutas poco rentables.', { economia: -1, ecologia: -2, territorial: -1 }, 'Transporte público universal'],
  ['est_07', 1, 'Muchas administraciones públicas duplican funciones y deberían auditarse para reducir el tamaño del sector público.', { economia: 2, intervencionismo: 2 }, 'Eficiencia administrativa'],
  ['est_08', 1, 'El acceso gratuito a la atención dental y óptica debería integrarse plenamente en la cartera del Sistema Nacional de Salud.', { economia: -2, intervencionismo: -1 }, 'Ampliación de la sanidad pública'],
  ['est_09', 1, 'Las ayudas sociales deberían condicionarse estrictamente a la búsqueda activa de empleo o formación acreditada.', { economia: 1, libertadEstado: 1 }, 'Condicionalidad de ayudas'],
  ['est_10', 1, 'Los servicios de dependencia y cuidados de larga duración deben ser asumidos de forma directa por el sector público.', { economia: -2, intervencionismo: -1 }, 'Sistema de dependencia'],
  ['est_11', 1, 'Un sistema de cheque escolar permite a las familias con menos recursos elegir centro en igualdad de condiciones.', { economia: 2, intervencionismo: 2 }, 'Cheque escolar'],
  ['est_12', 1, 'Dilema: Si hubiera recursos limitados, debería priorizarse mejorar la atención primaria frente a ampliar becas universitarias.', { economia: -1, intervencionismo: -1 }, 'Prioridades del gasto social', true],
  ['est_13', 1, 'El empleo público en España ofrece demasiada rigidez y debería evaluarse por desempeño con posibilidad de cese.', { economia: 2, intervencionismo: 1 }, 'Evaluación del funcionariado'],
  ['est_14', 1, 'Las infraestructuras hídricas y de regadío deben financiarse principalmente con fondos estatales solidarios entre cuencas.', { territorial: -1, intervencionismo: -1 }, 'Infraestructuras públicas'],
  ['est_15', 1, 'El bienestar ciudadano depende más de una economía dinámica que de la expansión continua de programas asistenciales.', { economia: 2, intervencionismo: 2 }, 'Crecimiento frente a asistencia'],

  // 2. Derechos sociales y cuestiones culturales (15)
  ['soc_01', 2, 'Las políticas de igualdad y cuotas de representación son necesarias para corregir brechas estructurales en puestos directivos.', { social: -2, intervencionismo: -1 }, 'Cuotas e igualdad'],
  ['soc_02', 2, 'El mérito individual debería ser el único criterio en oposiciones, empresas y becas, sin medidas de discriminación positiva.', { social: 2, libertadEstado: -1 }, 'Mérito frente a acción afirmativa'],
  ['soc_03', 2, 'La eutanasia y el derecho a una muerte digna deben estar garantizados por la sanidad pública bajo supervisión médica.', { social: -2, libertadEstado: -1 }, 'Eutanasia y autonomía personal'],
  ['soc_04', 2, 'La familia tradicional y las costumbres arraigadas constituyen un pilar esencial para la cohesión de la sociedad española.', { social: 2, tradicion: 2 }, 'Valores familiares y tradición'],
  ['soc_05', 2, 'Dilema: Cuando la libertad religiosa de una institución educativa privada choca con los contenidos curriculares de diversidad afectivo-sexual, debe prevalecer el currículo estatal.', { social: -2, libertadEstado: 1 }, 'Autonomía religiosa frente a currículo común', true],
  ['soc_06', 2, 'El Estado debe ser estrictamente laico y retirar subvenciones o exenciones fiscales a todas las confesiones religiosas.', { social: -2, tradicion: -2 }, 'Laicidad del Estado'],
  ['soc_07', 2, 'La tauromaquia forma parte del patrimonio cultural histórico español y no debería prohibirse por ley.', { social: 2, tradicion: 2, ecologia: 1 }, 'Patrimonio cultural y bienestar animal'],
  ['soc_08', 2, 'La legislación sobre identidad de género debería basarse principalmente en la autodeterminación de la persona.', { social: -2, tradicion: -2 }, 'Derechos de identidad de género'],
  ['soc_09', 2, 'Las leyes de memoria histórica abren debates del pasado que es mejor dejar a los historiadores y no a la legislación.', { social: 2, tradicion: 2 }, 'Políticas de memoria histórica'],
  ['soc_10', 2, 'La gestación subrogada altruista y regulada debería ser legal como forma de autonomía reproductiva.', { social: -1, libertadEstado: -2, economia: 1 }, 'Gestación subrogada'],
  ['soc_11', 2, 'La prostitución debería perseguirse y sancionarse sobre la demanda para proteger la dignidad de las mujeres.', { social: -1, libertadEstado: 2, seguridad: 1 }, 'Regulación o abolición de la prostitución'],
  ['soc_12', 2, 'Dilema: Es preferible preservar las fiestas locales tradicionales aunque generen controversia con nuevas sensibilidades animales o vecinales.', { social: 2, tradicion: 2 }, 'Tradición local frente a nuevos valores', true],
  ['soc_13', 2, 'Las lenguas cooficiales deberían fomentarse activamente en toda la educación pública estatal para enriquecer el patrimonio común.', { social: -1, territorial: 2, tradicion: -1 }, 'Pluralismo lingüístico'],
  ['soc_14', 2, 'El feminismo institucional actual ha ido más allá de la igualdad ante la ley y genera asimetrías jurídicas injustificadas.', { social: 2, tradicion: 1 }, 'Igualdad jurídica y políticas de género'],
  ['soc_15', 2, 'El consumo personal de cannabis en adultos debería legalizarse y regularse fiscalmente como el alcohol o el tabaco.', { social: -2, libertadEstado: -2, seguridad: -1 }, 'Regulación del cannabis'],

  // 3. Inmigración, fronteras e integración (15)
  ['inm_01', 3, 'España debería tener un mayor control sobre sus fronteras aunque eso reduzca la llegada de mano de obra extranjera.', { internacional: 2, seguridad: 2, social: 1 }, 'Control fronterizo'],
  ['inm_02', 3, 'Facilitar la regularización de personas extranjeras que ya trabajan y residen en España beneficia a la economía y a la convivencia.', { internacional: -2, social: -2, economia: -1 }, 'Regularización e integración'],
  ['inm_03', 3, 'La inmigración es imprescindible para contrarrestar el envejecimiento demográfico y sostener el mercado laboral español.', { internacional: -2, economia: 1 }, 'Demografía e inmigración'],
  ['inm_04', 3, 'El acceso a prestaciones sociales no contributivas debería requerir un periodo mínimo amplio de residencia legal y cotización.', { internacional: 2, economia: 1 }, 'Acceso a prestaciones'],
  ['inm_05', 3, 'Dilema: En la acogida migratoria, España debería priorizar acuerdos selectivos por cualificación laboral antes que cuotas humanitarias amplias.', { internacional: 2, economia: 1 }, 'Criterios laborales frente a acogida humanitaria', true],
  ['inm_06', 3, 'Los centros de internamiento de extranjeros deberían cerrarse y sustituirse por alternativas no privativas de libertad.', { seguridad: -2, internacional: -2, libertadEstado: -1 }, 'Centros de internamiento'],
  ['inm_07', 3, 'La integración exige aceptar activamente las normas constitucionales y costumbres cívicas del país de acogida.', { social: 2, tradicion: 2, internacional: 1 }, 'Modelo de integración cívica'],
  ['inm_08', 3, 'La Unión Europea debería repartir de manera obligatoria y solidaria la acogida de solicitantes de asilo entre todos los Estados miembros.', { internacional: -2, territorial: -1 }, 'Cuotas europeas de asilo'],
  ['inm_09', 3, 'La contratación en origen de trabajadores extranjeros es mejor vía que la llegada irregular por rutas marítimas o terrestres.', { internacional: 1, seguridad: 1 }, 'Vías legales y seguras'],
  ['inm_10', 3, 'Los municipios que reciben mayor flujo migratorio deberían contar con fondos estatales extraordinarios para evitar tensiones en servicios.', { intervencionismo: -1, territorial: 1 }, 'Financiación local de acogida'],
  ['inm_11', 3, 'Dilema: Cuando la identidad cultural de un barrio cambia rápidamente, el Estado debe intervenir para evitar la segregación residencial aunque limite ciertas elecciones de vivienda.', { intervencionismo: -1, social: -1, libertadEstado: 1 }, 'Cohesión urbana frente a libre elección', true],
  ['inm_12', 3, 'Los residentes extranjeros con varios años de arraigo deberían poder votar en las elecciones municipales y autonómicas.', { social: -2, internacional: -2 }, 'Participación política de residentes'],
  ['inm_13', 3, 'Las devoluciones en caliente en fronteras exteriores vulneran garantías básicas y deben prohibirse sin excepciones.', { seguridad: -2, internacional: -2 }, 'Garantías en frontera'],
  ['inm_14', 3, 'Debe exigirse un conocimiento verificable del idioma y de la Constitución antes de conceder la nacionalidad por residencia.', { tradicion: 1, internacional: 1 }, 'Requisitos de nacionalidad'],
  ['inm_15', 3, 'La cooperación económica en los países de origen es más eficaz a largo plazo que reforzar muros y vallas fronterizas.', { internacional: -2, seguridad: -1 }, 'Cooperación en origen'],

  // 4. Medioambiente, energía y cambio climático (15)
  ['med_01', 4, 'La energía nuclear debería formar parte esencial de la estrategia energética española para garantizar suministro estable sin emisiones.', { ecologia: 1, economia: 1, tradicion: 1 }, 'Energía nuclear'],
  ['med_02', 4, 'España debe acelerar el cierre de todas las centrales nucleares y apostar al cien por cien por energías renovables y almacenamiento.', { ecologia: -2, intervencionismo: -1 }, 'Cierre nuclear y renovables'],
  ['med_03', 4, 'Las zonas de bajas emisiones y restricciones al vehículo privado en ciudades son necesarias aunque encarezcan la movilidad diaria.', { ecologia: -2, intervencionismo: -2 }, 'Restricciones al tráfico urbano'],
  ['med_04', 4, 'Dilema: Si la transición ecológica rápida encarece la factura industrial y provoca pérdida de empleo, debe ralentizarse el calendario climático.', { ecologia: 2, economia: 2 }, 'Crecimiento industrial frente a transición verde', true],
  ['med_05', 4, 'Los impuestos ambientales sobre emisiones y plásticos deben endurecerse para que quien contamine pague el coste real.', { ecologia: -2, intervencionismo: -1 }, 'Fiscalidad verde'],
  ['med_06', 4, 'La agricultura y la ganadería españolas sufren exceso de normativa medioambiental europea que resta competitividad frente a importaciones.', { ecologia: 2, internacional: 2 }, 'Sector primario y normativa ambiental'],
  ['med_07', 4, 'Los grandes parques solares y eólicos en suelo rural deben limitarse cuando alteran el paisaje y la biodiversidad local.', { ecologia: -1, territorial: 1, tradicion: 1 }, 'Impacto rural de renovables'],
  ['med_08', 4, 'Prohibir los vuelos domésticos cortos cuando exista alternativa ferroviaria de menos de tres horas es una medida proporcionada.', { ecologia: -2, libertadEstado: 1 }, 'Vuelos cortos y ferrocarril'],
  ['med_09', 4, 'La innovación tecnológica del sector privado resolverá la crisis climática mejor que las prohibiciones estatales.', { ecologia: 2, intervencionismo: 2, economia: 2 }, 'Innovación de mercado frente a regulación'],
  ['med_10', 4, 'El trasvase de agua entre cuencas hidrográficas debe mantenerse como herramienta solidaria para sostener la agricultura.', { ecologia: 1, territorial: -2 }, 'Política hidráulica y trasvases'],
  ['med_11', 4, 'Dilema: Ante la sequía, debe priorizarse el consumo urbano y ecológico de los ríos aunque implique reducir regadíos intensivos.', { ecologia: -2, economia: -1 }, 'Gestión de la sequía', true],
  ['med_12', 4, 'La protección estricta de especies como el lobo ibérico debe prevalecer sobre la compensación a la ganadería extensiva.', { ecologia: -2, tradicion: -1 }, 'Conservación frente a ganadería'],
  ['med_13', 4, 'El autoconsumo energético doméstico debería estar exento de peajes y contar con trámites instantáneos.', { intervencionismo: 1, ecologia: -1 }, 'Autoconsumo energético'],
  ['med_14', 4, 'Los tratados comerciales internacionales deberían incluir aranceles climáticos frente a países con estándares ambientales más laxos.', { ecologia: -1, internacional: 1 }, 'Aranceles ambientales'],
  ['med_15', 4, 'El decrecimiento económico voluntario es incompatible con el bienestar social y no debe guiar las políticas públicas.', { ecologia: 2, economia: 2 }, 'Crecimiento sostenible frente a decrecimiento'],

  // 5. Seguridad, justicia y política penal (15)
  ['seg_01', 5, 'La prisión permanente revisable debe mantenerse y ampliarse a más delitos graves para proteger a la sociedad.', { seguridad: 2, tradicion: 1 }, 'Prisión permanente revisable'],
  ['seg_02', 5, 'El sistema penal debe orientarse prioritariamente a la reinserción y evitar el endurecimiento de condenas que no reduce la reincidencia.', { seguridad: -2, social: -1 }, 'Reinserción frente a punitivismo'],
  ['seg_03', 5, 'Los desalojos ante ocupación ilegal de viviendas habituales o segundas residencias deberían ejecutarse de forma inmediata en 24 horas.', { seguridad: 2, economia: 2 }, 'Protección frente a ocupación'],
  ['seg_04', 5, 'Dilema: Es preferible asumir el riesgo de que algún culpable quede libre antes que flexibilizar las garantías procesales de la detención.', { seguridad: -2, libertadEstado: -2 }, 'Garantismo procesal frente a eficacia policial', true],
  ['seg_05', 5, 'Las fuerzas y cuerpos de seguridad necesitan mayor respaldo jurídico y equipamiento para actuar frente a delitos violentos.', { seguridad: 2, libertadEstado: 1 }, 'Autoridad policial'],
  ['seg_06', 5, 'Las multas por desórdenes o faltas leves de la Ley de Seguridad Ciudadana restringen en exceso el derecho de protesta.', { seguridad: -2, libertadEstado: -2 }, 'Derecho de protesta y seguridad'],
  ['seg_07', 5, 'Los jueces y fiscales del Consejo General del Poder Judicial deberían ser elegidos directamente por la carrera judicial y no por el Parlamento.', { libertadEstado: -1, territorial: 1 }, 'Independencia judicial'],
  ['seg_08', 5, 'La edad de responsabilidad penal debería rebajarse en delitos violentos cometidos por menores.', { seguridad: 2, tradicion: 1 }, 'Justicia penal juvenil'],
  ['seg_09', 5, 'El uso de videovigilancia inteligente en espacios públicos mejora la seguridad sin suponer una amenaza seria si está regulado.', { seguridad: 2, libertadEstado: 2 }, 'Videovigilancia urbana'],
  ['seg_10', 5, 'Los indultos políticos del Gobierno alteran la separación de poderes y deberían restringirse severamente por ley.', { seguridad: 1, libertadEstado: -1 }, 'Límites al indulto'],
  ['seg_11', 5, 'Dilema: Ante el aumento de ciberestafas y criminalidad organizada, las fuerzas policiales deberían poder acceder a mensajes cifrados bajo orden judicial amplia.', { seguridad: 2, libertadEstado: 2 }, 'Cifrado frente a investigación penal', true],
  ['seg_12', 5, 'Las penas alternativas a la prisión (trabajos comunitarios y justicia restaurativa) son más útiles en delitos patrimoniales no violentos.', { seguridad: -2, social: -1 }, 'Justicia restaurativa'],
  ['seg_13', 5, 'Debe ampliarse la legítima defensa en el domicilio para proteger a los ciudadanos frente a intrusiones violentas.', { seguridad: 2, libertadEstado: -1 }, 'Legítima defensa'],
  ['seg_14', 5, 'La prisión provisional se utiliza con demasiada frecuencia en España y debería reservarse para casos extremos.', { seguridad: -2, libertadEstado: -1 }, 'Prisión provisional'],
  ['seg_15', 5, 'El enaltecimiento del terrorismo y los delitos de odio deben seguir tipificados penalmente aunque afecten al debate político.', { seguridad: 1, libertadEstado: 1 }, 'Límites penales al discurso'],

  // 6. Democracia, instituciones y organización territorial (15)
  ['dem_01', 6, 'Las comunidades autónomas deberían tener más competencias fiscales y legislativas dentro de un modelo federal claro.', { territorial: 2, libertadEstado: -1 }, 'Profundización autonómica'],
  ['dem_02', 6, 'Recuperar competencias clave como educación, sanidad y justicia para el Estado central garantizaría mayor igualdad entre españoles.', { territorial: -2, intervencionismo: -1 }, 'Centralización de competencias'],
  ['dem_03', 6, 'El sistema electoral debería reformarse hacia circunscripciones más proporcionales donde cada voto valga igual en todo el país.', { territorial: -1, social: -1 }, 'Reforma electoral proporcional'],
  ['dem_04', 6, 'Dilema: Para evitar el bloqueo parlamentario y gobiernos frágiles, es preferible un sistema mayoritario que prime a la lista más votada aunque reduzca el pluralismo.', { territorial: -1, libertadEstado: 1 }, 'Estabilidad frente a proporcionalidad', true],
  ['dem_05', 6, 'La forma de Estado en España debería decidirse mediante referéndum consultivo entre monarquía parlamentaria y república.', { tradicion: -2, social: -1 }, 'Jefatura del Estado'],
  ['dem_06', 6, 'La monarquía parlamentaria ha aportado estabilidad institucional y debe preservarse dentro del marco constitucional de 1978.', { tradicion: 2, social: 1 }, 'Continuidad constitucional'],
  ['dem_07', 6, 'Los referendos vinculantes a escala municipal y nacional deberían utilizarse con frecuencia para decidir grandes proyectos.', { libertadEstado: -1, territorial: 1 }, 'Democracia directa'],
  ['dem_08', 6, 'El Senado debería suprimirse o transformarse radicalmente en una cámara auténtica de representación territorial con poder real.', { territorial: 2 }, 'Reforma del Senado'],
  ['dem_09', 6, 'El cupo vasco y el concierto navarro generan desigualdades territoriales y deberían armonizarse con el régimen común.', { territorial: -2, economia: -1 }, 'Financiación autonómica'],
  ['dem_10', 6, 'La financiación pública de los partidos políticos debería reducirse drásticamente y sustituirse por cuotas transparentes de afiliados.', { intervencionismo: 2, libertadEstado: -1 }, 'Financiación de partidos'],
  ['dem_11', 6, 'Dilema: Si una comunidad autónoma aprueba una consulta de autodeterminación por amplia mayoría parlamentaria, el Estado debería negociar un referéndum pactado antes que aplicar solo vías judiciales.', { territorial: 2, seguridad: -2 }, 'Diálogo pactado frente a legalidad vigente', true],
  ['dem_12', 6, 'Las listas electorales deberían ser abiertas para que el ciudadano elija directamente a los candidatos concretos y no solo al partido.', { libertadEstado: -1, social: -1 }, 'Listas abiertas'],
  ['dem_13', 6, 'La España rural y despoblada necesita representación electoral ponderada y beneficios fiscales específicos.', { territorial: 2, intervencionismo: -1 }, 'Equilibrio territorial rural'],
  ['dem_14', 6, 'Limitar los mandatos de presidentes del Gobierno y autonómicos a ocho años mejoraría la regeneración democrática.', { libertadEstado: -1, tradicion: -1 }, 'Limitación de mandatos'],
  ['dem_15', 6, 'La estabilidad constitucional requiere mayorías muy reforzadas antes de reformar derechos o estructura territorial.', { tradicion: 2, territorial: -1 }, 'Rigidez constitucional'],

  // 7. Política exterior, defensa y geopolítica (15)
  ['ext_01', 7, 'España debería aumentar su inversión en defensa al menos hasta el 2 % del PIB dentro de sus compromisos atlánticos y europeos.', { internacional: -1, seguridad: 2 }, 'Presupuesto de defensa'],
  ['ext_02', 7, 'La Unión Europea debería avanzar hacia una política exterior y un ejército común propio con menor dependencia de Estados Unidos.', { internacional: -2, tradicion: -1 }, 'Autonomía estratégica europea'],
  ['ext_03', 7, 'Las decisiones fundamentales sobre tratados comerciales, moneda y leyes deben permanecer en el Parlamento nacional y no en Bruselas.', { internacional: 2, territorial: -1 }, 'Soberanía nacional frente a UE'],
  ['ext_04', 7, 'Dilema: Ante regímenes autoritarios con los que España mantiene vínculos energéticos o migratorios, debería priorizarse la defensa de los derechos humanos aunque perjudique acuerdos estratégicos.', { social: -2, internacional: -1 }, 'Valores frente a realpolitik', true],
  ['ext_05', 7, 'La ayuda oficial al desarrollo en América Latina y África debe incrementarse hasta alcanzar el 0,7 % del PIB.', { internacional: -2, economia: -1 }, 'Cooperación internacional'],
  ['ext_06', 7, 'España debería mantener una posición más neutral y reducir el envío de armamento a conflictos exteriores.', { internacional: 1, seguridad: -2 }, 'Neutralidad y desarme'],
  ['ext_07', 7, 'La integración política europea es la mejor garantía de paz, prosperidad y peso global para España en el siglo XXI.', { internacional: -2, tradicion: -1 }, 'Integración europea'],
  ['ext_08', 7, 'La política industrial europea debe proteger sectores estratégicos con aranceles frente a subsidios extranjeros desleales.', { internacional: 2, intervencionismo: -1 }, 'Proteccionismo estratégico'],
  ['ext_09', 7, 'España debería reforzar alianzas culturales, educativas y comerciales preferentes con los países iberoamericanos.', { internacional: -1, tradicion: 1 }, 'Comunidad iberoamericana'],
  ['ext_10', 7, 'El servicio militar o cívico voluntario bien remunerado reforzaría la capacidad de respuesta ante emergencias y defensa.', { seguridad: 2, tradicion: 2 }, 'Reserva voluntaria'],
  ['ext_11', 7, 'Dilema: En caso de crisis de suministros críticos, es preferible pagar precios más altos por producción europea que depender de cadenas globales más baratas.', { internacional: 2, economia: -1 }, 'Autonomía de suministros frente a libre comercio', true],
  ['ext_12', 7, 'Las sanciones económicas internacionales rara vez logran cambios democráticos y dañan sobre todo a la población civil.', { internacional: 1, seguridad: -1 }, 'Eficacia de sanciones'],
  ['ext_13', 7, 'España debe defender un papel más activo de Naciones Unidas aunque eso implique ceder capacidad de decisión unilateral.', { internacional: -2 }, 'Multilateralismo'],
  ['ext_14', 7, 'Las bases militares extranjeras en territorio español deben revisarse periódicamente para garantizar pleno control soberano.', { internacional: 2, seguridad: -1 }, 'Soberanía en defensa'],
  ['ext_15', 7, 'El libre comercio global con reglas claras reduce la pobreza mundial y beneficia a consumidores y exportadores españoles.', { internacional: -2, economia: 2 }, 'Libre comercio internacional'],

  // 8. Educación, sanidad y vivienda (15)
  ['edu_01', 8, 'El Gobierno debería intervenir más en el mercado de la vivienda mediante topes al alquiler en zonas tensionadas.', { economia: -2, intervencionismo: -2 }, 'Control de alquileres'],
  ['edu_02', 8, 'Limitar por ley los precios del alquiler reduce la oferta disponible; la solución real es construir más vivienda y dar seguridad jurídica.', { economia: 2, intervencionismo: 2 }, 'Oferta de vivienda y seguridad jurídica'],
  ['edu_03', 8, 'Los conciertos educativos con centros privados deberían ir eliminándose progresivamente en favor de una red exclusivamente pública.', { economia: -2, social: -1, intervencionismo: -1 }, 'Educación concertada'],
  ['edu_04', 8, 'Las familias deben tener plena libertad para elegir centros públicos o concertados financiados con fondos públicos.', { economia: 2, tradicion: 1 }, 'Libertad de elección educativa'],
  ['edu_05', 8, 'Dilema: Para reducir las listas de espera sanitarias de inmediato, debería recurrirse temporalmente a derivaciones concertadas privadas antes que esperar a ampliar plantillas públicas.', { economia: 2, intervencionismo: 1 }, 'Listas de espera y conciertos sanitarios', true],
  ['edu_06', 8, 'Un parque público de vivienda en alquiler social que alcance el 15 % del total debe ser prioridad estatal durante la próxima década.', { economia: -2, intervencionismo: -2 }, 'Parque público de vivienda'],
  ['edu_07', 8, 'Las viviendas de uso turístico en barrios residenciales deberían limitarse drásticamente o prohibirse en zonas saturadas.', { intervencionismo: -2, social: -1 }, 'Viviendas turísticas'],
  ['edu_08', 8, 'El acceso a la universidad pública debería ser gratuito en primera matrícula para todo estudiante que apruebe el curso.', { economia: -2, intervencionismo: -1 }, 'Gratuidad universitaria'],
  ['edu_09', 8, 'La formación profesional dual ligada a empresas merece más inversión y prestigio que seguir ampliando plazas universitarias generales.', { economia: 1, tradicion: 1 }, 'Formación profesional dual'],
  ['edu_10', 8, 'La salud mental pública requiere ratios obligatorias de psicólogos en atención primaria y centros escolares.', { economia: -2, social: -1 }, 'Salud mental pública'],
  ['edu_11', 8, 'Dilema: Es preferible implantar exámenes nacionales comunes de acceso a la universidad para asegurar igualdad territorial antes que respetar diferencias autonómicas de evaluación.', { territorial: -2, tradicion: 1 }, 'EBAU única frente a modelo autonómico', true],
  ['edu_12', 8, 'Los copagos farmacéuticos ajustados por renta evitan el desperdicio de medicamentos y ayudan a sostener la sanidad.', { economia: 2, intervencionismo: 1 }, 'Copago farmacéutico por renta'],
  ['edu_13', 8, 'Los grandes tenedores deberían pagar un recargo fiscal elevado por mantener viviendas vacías de forma prolongada.', { economia: -2, intervencionismo: -2 }, 'Vivienda vacía y grandes tenedores'],
  ['edu_14', 8, 'La educación pública debe reforzar las humanidades, la filosofía y el esfuerzo evaluable frente a enfoques pedagógicos demasiado laxos.', { tradicion: 2, social: 1 }, 'Exigencia académica y humanidades'],
  ['edu_15', 8, 'El suelo urbanizable debería liberalizarse con mayor agilidad para abaratar el coste de la vivienda nueva.', { economia: 2, intervencionismo: 2, ecologia: 1 }, 'Liberalización del suelo'],

  // 9. Tecnología, privacidad y libertades civiles (15)
  ['tec_01', 9, 'La libertad de expresión debe proteger incluso opiniones profundamente impopulares o ofensivas, salvo incitación directa a la violencia.', { libertadEstado: -2, social: -1 }, 'Límites de la libertad de expresión'],
  ['tec_02', 9, 'Las plataformas digitales deben estar obligadas legalmente a retirar con rapidez discursos de odio y desinformación verificada.', { libertadEstado: 2, seguridad: 1 }, 'Moderación legal en plataformas'],
  ['tec_03', 9, 'El dinero en efectivo debe protegerse por ley frente a la digitalización total para preservar el anonimato ciudadano.', { libertadEstado: -2, intervencionismo: 1 }, 'Privacidad financiera y efectivo'],
  ['tec_04', 9, 'El reconocimiento facial biométrico en lugares públicos debe prohibirse de forma general por el riesgo de vigilancia masiva.', { libertadEstado: -2, seguridad: -1 }, 'Prohibición de biometría pública'],
  ['tec_05', 9, 'Dilema: Si una aplicación de mensajería cifrada impide investigar delitos graves contra menores, debe exigirse acceso técnico a las autoridades aunque debilite la privacidad general.', { libertadEstado: 2, seguridad: 2 }, 'Privacidad digital frente a persecución penal', true],
  ['tec_06', 9, 'Europa debería evitar una regulación excesiva de la inteligencia artificial para no quedar rezagada frente a Estados Unidos y Asia.', { intervencionismo: 2, economia: 2 }, 'Regulación de inteligencia artificial'],
  ['tec_07', 9, 'Las grandes plataformas tecnológicas deberían tributar específicamente en cada país donde generan datos e ingresos publicitarios.', { intervencionismo: -1, economia: -1, internacional: 1 }, 'Fiscalidad digital'],
  ['tec_08', 9, 'El acceso de menores de dieciséis años a redes sociales debería requerir verificación estricta de edad y autorización parental.', { libertadEstado: 1, tradicion: 1, seguridad: 1 }, 'Protección digital de menores'],
  ['tec_09', 9, 'Los algoritmos de recomendación de redes sociales deberían ser auditables por organismos públicos independientes.', { intervencionismo: -2, libertadEstado: 1 }, 'Transparencia algorítmica'],
  ['tec_10', 9, 'La administración pública debería migrar progresivamente a software libre y código abierto para garantizar soberanía tecnológica.', { intervencionismo: -1, libertadEstado: -1 }, 'Software libre público'],
  ['tec_11', 9, 'Dilema: Ante la automatización por inteligencia artificial, las empresas que sustituyan empleo humano deberían cotizar por los sistemas automatizados para sostener el empleo.', { economia: -2, intervencionismo: -2 }, 'Fiscalidad sobre la automatización', true],
  ['tec_12', 9, 'El derecho al teletrabajo debería reconocerse legalmente siempre que la naturaleza del puesto lo permita.', { libertadEstado: -1, social: -1, ecologia: -1 }, 'Derecho al teletrabajo'],
  ['tec_13', 9, 'Las monedas digitales emitidas por bancos centrales suponen un riesgo de control estatal excesivo sobre los ciudadanos.', { libertadEstado: -2, intervencionismo: 2 }, 'Moneda digital y privacidad'],
  ['tec_14', 9, 'El derecho a la desconexión digital fuera del horario laboral debe sancionarse con severidad cuando las empresas lo incumplan.', { economia: -1, intervencionismo: -1 }, 'Desconexión digital'],
  ['tec_15', 9, 'Los medios de comunicación públicos deben mantenerse con financiación garantizada e independencia editorial frente al mercado.', { economia: -1, intervencionismo: -1 }, 'Medios públicos independientes'],
];

export const ALL_TEST_QUESTIONS: TestQuestion[] = RAW_QUESTIONS.map(
  ([id, areaIdx, statement, axisWeights, topicTag, isDilemma]) => ({
    id,
    area: POLITICAL_AREAS[areaIdx],
    statement,
    axisWeights,
    topicTag,
    isDilemma: Boolean(isDilemma),
  })
);

export const QUESTION_META_MAP: Record<string, { topicTag: string; area: string }> =
  Object.fromEntries(
    ALL_TEST_QUESTIONS.map((q) => [q.id, { topicTag: q.topicTag, area: q.area }])
  );

export function getQuestionsForMode(mode: TestMode): TestQuestion[] {
  if (mode === 'avanzado') return ALL_TEST_QUESTIONS; // 150

  if (mode === 'completo') {
    // 8 preguntas por cada una de las 10 áreas = 80 preguntas
    const selected: TestQuestion[] = [];
    POLITICAL_AREAS.forEach((area) => {
      const group = ALL_TEST_QUESTIONS.filter((q) => q.area === area);
      selected.push(...group.slice(0, 8));
    });
    return selected;
  }

  // Modo rápido: 24 preguntas equilibradas (2-3 por área)
  const quick: TestQuestion[] = [];
  POLITICAL_AREAS.forEach((area, idx) => {
    const group = ALL_TEST_QUESTIONS.filter((q) => q.area === area);
    const take = idx < 4 ? 3 : 2; // 4*3 + 6*2 = 24
    quick.push(...group.slice(0, take));
  });
  return quick;
}

export function computeIdeologicalResult(
  answers: Record<string, AnswerValue>,
  priorityAreas: PoliticalArea[]
) {
  const sums: Record<keyof NineAxes, number> = {
    economia: 0,
    social: 0,
    libertadEstado: 0,
    territorial: 0,
    internacional: 0,
    intervencionismo: 0,
    ecologia: 0,
    seguridad: 0,
    tradicion: 0,
  };
  const maxAbs: Record<keyof NineAxes, number> = {
    economia: 0,
    social: 0,
    libertadEstado: 0,
    territorial: 0,
    internacional: 0,
    intervencionismo: 0,
    ecologia: 0,
    seguridad: 0,
    tradicion: 0,
  };

  let answeredCount = 0;
  const convictions: string[] = [];
  const moderateTopics: string[] = [];

  for (const q of ALL_TEST_QUESTIONS) {
    const val = answers[q.id];
    if (val === undefined || val === null) continue;
    answeredCount += 1;

    const areaBoost = priorityAreas.includes(q.area) ? 1.25 : 1.0;

    (Object.keys(q.axisWeights) as Array<keyof NineAxes>).forEach((axisKey) => {
      const w = q.axisWeights[axisKey] || 0;
      sums[axisKey] += (val / 2) * w * areaBoost;
      maxAbs[axisKey] += Math.abs(w) * areaBoost;
    });

    if (Math.abs(val) === 2 && convictions.length < 6) {
      const posture = val === 2 ? 'A favor de' : 'Crítico con';
      convictions.push(`${posture}: ${q.topicTag}`);
    } else if (val === 0 && moderateTopics.length < 6) {
      moderateTopics.push(q.topicTag);
    }
  }

  const axes: NineAxes = {
    economia: 0,
    social: 0,
    libertadEstado: 0,
    territorial: 0,
    internacional: 0,
    intervencionismo: 0,
    ecologia: 0,
    seguridad: 0,
    tradicion: 0,
  };

  (Object.keys(axes) as Array<keyof NineAxes>).forEach((k) => {
    if (maxAbs[k] > 0) {
      axes[k] = Math.round(Math.max(-100, Math.min(100, (sums[k] / maxAbs[k]) * 100)));
    }
  });

  // Detección de posibles tensiones o equilibrios complejos entre valores
  const tensions: string[] = [];
  if (axes.economia >= 25 && axes.intervencionismo <= -20) {
    tensions.push(
      'Combinas preferencia por menor carga fiscal o iniciativa privada con respaldo a una intervención pública activa en sectores concretos.'
    );
  }
  if (axes.libertadEstado <= -25 && axes.seguridad >= 25) {
    tensions.push(
      'Defiendes amplias libertades individuales y privacidad digital, pero respaldas medidas penales más firmes ante delitos graves.'
    );
  }
  if (axes.ecologia <= -25 && axes.economia >= 25) {
    tensions.push(
      'Priorizas objetivos ambientales ambiciosos junto con una orientación favorable a la libre empresa y menor burocracia.'
    );
  }
  if (axes.territorial >= 25 && axes.internacional <= -25) {
    tensions.push(
      'Apuestas simultáneamente por mayor descentralización autonómica y una integración supranacional europea más estrecha.'
    );
  }
  if (axes.social <= -25 && axes.tradicion >= 25) {
    tensions.push(
      'Mantienes posturas abiertas en derechos individuales al mismo tiempo que valoras la continuidad institucional y ciertas costumbres tradicionales.'
    );
  }
  if (tensions.length === 0) {
    tensions.push(
      'Tus respuestas muestran una coherencia interna equilibrada entre tus principios económicos, institucionales y sociales, sin contradicciones acusadas.'
    );
  }

  // Añadir áreas con valores cercanos al centro como temas moderados si faltan
  if (moderateTopics.length < 3) {
    if (Math.abs(axes.economia) <= 20) moderateTopics.push('Equilibrio entre mercado y fiscalidad');
    if (Math.abs(axes.territorial) <= 20) moderateTopics.push('Modelo de distribución autonómica');
    if (Math.abs(axes.ecologia) <= 20) moderateTopics.push('Ritmo de transición energética');
    if (Math.abs(axes.seguridad) <= 20) moderateTopics.push('Balance entre garantías y seguridad');
  }

  const ecoDesc =
    axes.economia <= -25
      ? 'orientación económica redistributiva'
      : axes.economia >= 25
        ? 'orientación favorable al mercado'
        : 'enfoque económico mixto';
  const socDesc =
    axes.social <= -25
      ? 'apertura progresista en derechos sociales'
      : axes.social >= 25
        ? 'valoración de la continuidad social y cultural'
        : 'posición social moderada';
  const libDesc =
    axes.libertadEstado <= -25
      ? 'fuerte defensa de la autonomía individual'
      : axes.libertadEstado >= 25
        ? 'prioridad a la capacidad reguladora del Estado'
        : 'equilibrio entre libertades y autoridad pública';

  const summaryText = `Según tus ${answeredCount} respuestas, muestras una ${ecoDesc}, acompañada de ${socDesc} y ${libDesc}. Este perfil resume únicamente las opiniones que has expresado y puede actualizarse siempre que cambie tu criterio.`;

  return {
    answeredCount,
    axes,
    convictions: convictions.slice(0, 6),
    tensions: tensions.slice(0, 4),
    moderateTopics: Array.from(new Set(moderateTopics)).slice(0, 6),
    summaryText,
  };
}
