/**
 * Fuente única de verdad de los módulos del PESV.
 *
 * El `slug` es el identificador técnico y se usa igual en los cuatro sitios:
 *   - Firestore  → Empresas/{nit}/periodos/{periodo}/{slug}
 *   - Storage    → uploads/{nit}/{slug}/...
 *   - Progreso   → EstatusGeneral/{nit}.{slug}
 *   - Dashboard  → tarjeta de la fase correspondiente
 *
 * El `paso` es el número oficial de la Resolución 40595 de 2022, y es el que se
 * muestra al usuario. Casi siempre coincide con el prefijo del slug, con una
 * excepción conocida: Diagnóstico es el paso 5 y vive en `006-diagnostico`, y
 * Caracterización es el paso 6 y vive en `005-caracterizacion-control-riesgos`.
 * Por eso el paso nunca se deduce del slug.
 *
 * Los complementos 025–026 son módulos de apoyo que no son pasos de la norma.
 */

export type FasePHVA = 'planear' | 'hacer' | 'verificar' | 'actuar' | 'complemento';

/** Nivel del PESV tal como se guarda en `users/{uid}.nivelAcceso`. */
export type NivelPesv = 'basico' | 'medio' | 'avanzado';

/** Nombre oficial de cada nivel. Se guarda `medio`, la norma dice Estándar. */
export const NOMBRE_NIVEL: Record<NivelPesv, string> = {
  basico: 'Básico',
  medio: 'Estándar',
  avanzado: 'Avanzado',
};

const ORDEN_NIVEL: Record<NivelPesv, number> = { basico: 0, medio: 1, avanzado: 2 };

export interface ModuloPESV {
  /** Clave canónica del módulo. Nunca se deriva ni se concatena a mano. */
  slug: string;
  /** Número oficial del paso (1 a 24); null en los complementos. */
  paso: number | null;
  nombre: string;
  fase: FasePHVA;
  /** Segmento de ruta bajo /admin/{fase}/ */
  ruta: string;
  /**
   * Nivel desde el que el paso es obligatorio. Los niveles son acumulativos:
   * Básico exige 18 pasos, Estándar 22 y Avanzado los 24.
   * null en los complementos, que no son pasos de la norma.
   */
  nivelMinimo: NivelPesv | null;
}

export const MODULOS_PESV = [
  // ── PLANEAR · pasos 1 a 8 ────────────────────────────────────────────────
  { paso: 1,  nivelMinimo: 'basico',   slug: '001-lider-pesv',                               fase: 'planear',   ruta: 'liderdelpesv',                            nombre: 'Líder del diseño e implementación del PESV' },
  { paso: 2,  nivelMinimo: 'medio',    slug: '002-comite-seguridad-vial',                    fase: 'planear',   ruta: 'comiteseguridadvial',                     nombre: 'Comité de seguridad vial' },
  { paso: 3,  nivelMinimo: 'basico',   slug: '003-politicas-seguridad-vial',                 fase: 'planear',   ruta: 'politicaseguridadvial',                   nombre: 'Política de seguridad vial de la organización' },
  { paso: 4,  nivelMinimo: 'basico',   slug: '004-liderazgo-compromiso',                     fase: 'planear',   ruta: 'liderazgo_y_compromiso',                  nombre: 'Liderazgo, compromiso y corresponsabilidad del nivel directivo' },
  { paso: 5,  nivelMinimo: 'basico',   slug: '006-diagnostico',                              fase: 'planear',   ruta: 'diagnostico',                             nombre: 'Diagnóstico' },
  { paso: 6,  nivelMinimo: 'basico',   slug: '005-caracterizacion-control-riesgos',          fase: 'planear',   ruta: 'evaluacion_y_control_riesgos',            nombre: 'Caracterización, evaluación y control de riesgos' },
  { paso: 7,  nivelMinimo: 'basico',   slug: '007-objetivos-metas',                          fase: 'planear',   ruta: 'objetivos_y_metas',                       nombre: 'Objetivos y metas del PESV' },
  { paso: 8,  nivelMinimo: 'basico',   slug: '008-programas-gestion-riesgos',                fase: 'planear',   ruta: 'programas_gestion_riesgos',               nombre: 'Programas de gestión de riesgos críticos y factores de desempeño' },

  // ── HACER · pasos 9 a 19 ─────────────────────────────────────────────────
  { paso: 9,  nivelMinimo: 'basico',   slug: '009-plan-anual-trabajo',                       fase: 'hacer',     ruta: 'plan_anual_trabajo',                      nombre: 'Plan anual de trabajo' },
  { paso: 10, nivelMinimo: 'basico',   slug: '010-competencia-plan-anual-formacion',         fase: 'hacer',     ruta: 'competencias_plan_anual_formacion',       nombre: 'Competencia y plan anual de formación' },
  { paso: 11, nivelMinimo: 'avanzado', slug: '011-responsabilidad-comportamiento-seguro',    fase: 'hacer',     ruta: 'responsabilidad_comportamiento_seguro',   nombre: 'Responsabilidad y comportamiento seguro' },
  { paso: 12, nivelMinimo: 'basico',   slug: '012-preparacion-respuesta-emergencias-viales', fase: 'hacer',     ruta: 'preparacion_respuesta_emergencias_viales', nombre: 'Plan de preparación y respuesta ante emergencias viales' },
  { paso: 13, nivelMinimo: 'medio',    slug: '013-investigacion-interna-siniestros-viales',  fase: 'hacer',     ruta: 'investigacion_incidentes_viales',         nombre: 'Investigación interna de siniestros viales' },
  { paso: 14, nivelMinimo: 'basico',   slug: '014-vias-seguras-administradas-organizacion',  fase: 'hacer',     ruta: 'vias_seguras_administradas_organizacion', nombre: 'Vías seguras administradas por la organización' },
  { paso: 15, nivelMinimo: 'basico',   slug: '015-planificacion-desplazamientos-laborales',  fase: 'hacer',     ruta: 'planificacion_desplazamientos_laborales', nombre: 'Planificación de desplazamientos laborales' },
  { paso: 16, nivelMinimo: 'basico',   slug: '016-inspeccion-vehiculos-equipos',             fase: 'hacer',     ruta: 'inspeccion_vehiculos_equipos',            nombre: 'Inspección de vehículos y equipos' },
  { paso: 17, nivelMinimo: 'basico',   slug: '017-mantenimiento-control-vehiculos-seguros',  fase: 'hacer',     ruta: 'mantenimiento_control_vehiculos_seguros', nombre: 'Mantenimiento y control de vehículos seguros y equipos' },
  { paso: 18, nivelMinimo: 'medio',    slug: '018-gestion-cambio-contratistas',              fase: 'hacer',     ruta: 'gestion_cambio_contratistas',             nombre: 'Gestión del cambio y gestión de contratistas' },
  { paso: 19, nivelMinimo: 'medio',    slug: '019-archivo-retencion-documental',             fase: 'hacer',     ruta: 'archivo_retencion_documental',            nombre: 'Archivo y retención documental' },

  // ── VERIFICAR · pasos 20 a 22 ────────────────────────────────────────────
  { paso: 20, nivelMinimo: 'basico',   slug: '020-indicadores-reporte-autogestion',          fase: 'verificar', ruta: 'indicadores_autogestion_pesv',            nombre: 'Indicadores y reporte de autogestión PESV' },
  { paso: 21, nivelMinimo: 'avanzado', slug: '021-registro-analisis-siniestros-viales',      fase: 'verificar', ruta: 'registro_siniestros_viales',              nombre: 'Registro y análisis estadístico de siniestros viales' },
  { paso: 22, nivelMinimo: 'basico',   slug: '022-auditoria-anual',                          fase: 'verificar', ruta: 'auditoria_anual',                         nombre: 'Auditoría anual' },

  // ── ACTUAR · pasos 23 y 24 ───────────────────────────────────────────────
  { paso: 23, nivelMinimo: 'basico',   slug: '023-mejora-continua-preventivas-correctivas',  fase: 'actuar',    ruta: 'mejora_acciones_preventivas_correctivas', nombre: 'Mejora continua, acciones preventivas y correctivas' },
  { paso: 24, nivelMinimo: 'basico',   slug: '024-mecanismos-comunicacion',                  fase: 'actuar',    ruta: 'mecanismos_comunicacion',                 nombre: 'Mecanismos de comunicación y participación' },

  // ── COMPLEMENTOS · fuera de la serie de la Resolución ────────────────────
  { paso: null as number | null, nivelMinimo: null as NivelPesv | null, slug: '025-actas-reunion-comite',                     fase: 'complemento', ruta: 'actas_reunion_comite',                  nombre: 'Actas de reunión del comité' },
  { paso: null as number | null, nivelMinimo: null as NivelPesv | null, slug: '026-matriz-legal',                             fase: 'complemento', ruta: 'matriz_legal',                          nombre: 'Matriz legal' },
] as const satisfies readonly ModuloPESV[];

/**
 * Unión literal de los 26 slugs. Al tiparse así, pasar un slug inventado
 * a `registrarProgreso()` es un error de compilación, no un bug silencioso.
 */
export type SlugModulo = typeof MODULOS_PESV[number]['slug'];

export function moduloPorSlug(slug: string): ModuloPESV | undefined {
  return MODULOS_PESV.find(m => m.slug === slug);
}

export function modulosPorFase(fase: FasePHVA): ModuloPESV[] {
  return MODULOS_PESV.filter(m => m.fase === fase);
}

export function esNivelPesv(valor: unknown): valor is NivelPesv {
  return valor === 'basico' || valor === 'medio' || valor === 'avanzado';
}

/**
 * ¿Se le exige este módulo a una empresa de ese nivel?
 * Sin nivel conocido, o en los complementos, responde que sí: es preferible
 * mostrar un paso de más que esconder uno obligatorio.
 */
export function aplicaANivel(slug: string, nivel: NivelPesv | null): boolean {
  const modulo = moduloPorSlug(slug);
  if (!modulo || !modulo.nivelMinimo || !nivel) return true;
  return ORDEN_NIVEL[nivel] >= ORDEN_NIVEL[modulo.nivelMinimo];
}

/** Pasos de la norma obligatorios para un nivel: 18 en Básico, 22 en Estándar, 24 en Avanzado. */
export function pasosExigibles(nivel: NivelPesv): ModuloPESV[] {
  return MODULOS_PESV.filter(m => m.paso !== null && aplicaANivel(m.slug, nivel));
}
