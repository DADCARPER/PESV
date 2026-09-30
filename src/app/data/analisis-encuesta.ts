/**
 * De qué preguntas cuelga el análisis del informe.
 *
 * El informe tiene dos capas. Una es genérica: monta una gráfica por cada
 * pregunta de opción, sea cual sea, y sobrevive a cualquier cambio del
 * cuestionario. La otra la escribió una persona sobre preguntas concretas —los
 * textos, la elección de cada gráfica, las recomendaciones, los cruces entre
 * módulos— y esa busca las preguntas por su identificador.
 *
 * Este archivo es el inventario de esa segunda capa. No impide nada: sirve
 * para que quien retira una pregunta vea, en el momento de decidirlo, qué
 * análisis deja de escribirse. Un candado obliga a pelearse con el sistema;
 * decir la consecuencia enseña cómo está montado, y eso sirve también cuando
 * se está decidiendo qué añadir.
 *
 * Cuando se escriba el análisis de una pregunta nueva, su entrada va aquí.
 */

/** Los módulos de la Resolución. No se borran: se les retiran preguntas. */
export const MODULOS_NUCLEO = [
  'modulo1', 'modulo2', 'modulo3', 'modulo4', 'modulo5', 'modulo6',
];

/**
 * Preguntas de las que cuelga la lectura entera de su módulo.
 *
 * Son las que reparten la muestra en dos: quien conduce y quien no, quien se
 * desplaza por trabajo y quien no. Sin ellas, el resto de cifras del módulo no
 * tienen sobre qué calcularse, y el informe deja de enriquecerlo por completo.
 */
export const PREGUNTAS_BASE: Record<string, string> = {
  conduceVehiculos:
    'Todo el análisis de conducción se calcula sobre quienes conducen. Sin esta '
    + 'pregunta no hay forma de saber quiénes son, y el módulo entero pierde sus '
    + 'textos, sus recomendaciones y el porcentaje de cada cifra.',
  desplazamientosJornada:
    'Separa los desplazamientos por encargo de la empresa —los que entran en el '
    + 'alcance del PESV— de los del trayecto a casa. Sin ella se pierde esa '
    + 'distinción, que es la que ordena la sección entera.',
};

/** Qué deja de escribir el informe si la pregunta se retira. */
export const ANALISIS_POR_PREGUNTA: Record<string, string> = {
  // ── Caracterización de la población ──────────────────────────────────
  genero: 'el reparto por género y su lectura',
  escolaridad: 'la gráfica de escolaridad y su lectura',
  estrato: 'la tabla de estratos con su gráfica y su lectura',
  estadoCivil: 'la gráfica de estado civil y su lectura',
  areaDepartamento: 'la gráfica de áreas y su lectura',
  jornada: 'el bloque de jornada y tipo de contrato',
  tipoContrato: 'el bloque de jornada y tipo de contrato',

  // ── Salud y condición física ─────────────────────────────────────────
  estadoGeneral: 'la dona de estado de salud y su lectura',
  limitacionFisica:
    'el bloque de limitaciones y discapacidad, y la recomendación de revisar '
    + 'ajustes en las tareas de conducción',
  discapacidad: 'el bloque de limitaciones y discapacidad',
  dolorMolestia:
    'la gráfica de dolor y la recomendación de valorarlo con la ARL, que es el '
    + 'indicador de fatiga más directo del diagnóstico',
  incapacidades: 'la gráfica de incapacidades y su lectura',
  actividadFisica: 'la lectura de la actividad física como factor protector',

  // ── Conducción y transporte ──────────────────────────────────────────
  tipoVehiculos: 'la gráfica de tipos de vehículo',
  licenciaConduccion:
    'la lectura de licencias y la recomendación de suspender de tareas de '
    + 'conducción a quien no la tenga vigente, que es el hallazgo más grave '
    + 'que puede dar este módulo',
  categoriaLicencia: 'la gráfica de categorías de licencia',
  experienciaConduccion:
    'la lectura de la experiencia y la recomendación de formar primero a los '
    + 'conductores noveles',
  infraccionesTransito:
    'el bloque de infracciones y la recomendación de verificar el historial de '
    + 'comparendos',
  estadoInfraccion:
    'el aviso de infracciones sin saldar, que pueden terminar en suspensión de '
    + 'la licencia',
  accidenteUltimoAno: 'el bloque de accidentes y su lectura',
  accidenteEnJornada:
    'la distinción entre los accidentes ocurridos en jornada —que caen dentro '
    + 'del alcance del PESV— y el resto',
  accidenteTransito:
    'la gráfica de gravedad y la recomendación de investigar los siniestros con '
    + 'víctimas',
  conocimientoNormas:
    'la dona de conocimiento de normas y la recomendación de formación',
  capacidadEmergencia: 'la lectura de la capacitación en emergencias viales',

  // ── Desplazamientos laborales ────────────────────────────────────────
  mediosTransporte:
    'la gráfica de medios y la lectura del peso de la moto, la bicicleta y el '
    + 'desplazamiento a pie',
  tiempoDesplazamiento: 'la lectura del trayecto largo como fatiga acumulada',
  estadoVehiculo:
    'el bloque del vehículo en que se desplaza y la recomendación de '
    + 'verificarlo',
  propiedadVehiculo:
    'la identificación de los vehículos que pone la empresa, sobre los que la '
    + 'responsabilidad de mantenimiento es directa',
  incidentesDesplazamiento:
    'la gráfica de incidentes y la recomendación de analizar los graves y los '
    + 'de riesgo público',
  tipoDesplazamientoJornada:
    'la gráfica de medios en jornada y el aviso sobre vehículos pesados',
  tiempoDuracionDesplazamiento:
    'la recomendación de tratar como conductores a quienes pasan media jornada '
    + 'o más al volante, aunque su cargo no lo diga',

  // ── Identificación de riesgos ────────────────────────────────────────
  exposicionRiesgos:
    'la dona de exposición y la lectura de quienes no saben si están expuestos',
  experienciaRiesgos:
    'el bloque de situaciones vividas y, con él, la brecha de subreporte',
  reporteRiesgo:
    'la brecha de subreporte, que es el hallazgo más accionable del módulo',
  conocimientoReporte:
    'el bloque del canal de reporte y la recomendación de divulgarlo',
  culturaSeguridad: 'la lectura de la cultura de seguridad vial',
  factorHumano:
    'la gráfica del factor humano y su peso en la comparación de los cuatro '
    + 'factores',
  factorVehiculo:
    'la gráfica del factor vehículo y su peso en la comparación de los cuatro '
    + 'factores',
  factorVia:
    'la gráfica del factor vía, su peso en la comparación y el contraste con '
    + 'los riesgos declarados en las rutas',
  factorEntorno:
    'la gráfica del factor entorno, su peso en la comparación y el contraste '
    + 'con los riesgos declarados en las rutas',

  // ── Mejora y participación ───────────────────────────────────────────
  accionesMejora:
    'la gráfica de acciones pedidas y la recomendación de llevarlas al plan '
    + 'anual de trabajo',
  participacionAnterior:
    'la línea base de formación y la recomendación de a quién formar primero',
  sugerenciasMejora:
    'el anexo con las propuestas escritas por los trabajadores, que es la '
    + 'prueba de que el diagnóstico recogió su participación',
};
