/**
 * Fuente única de verdad de los módulos del PESV.
 *
 * El `slug` de cada módulo es la clave canónica y se usa igual en los cuatro sitios:
 *   - Firestore  → Empresas/{nit}/periodos/{periodo}/{slug}
 *   - Storage    → uploads/{nit}/{slug}/...
 *   - Progreso   → EstatusGeneral/{nit}.{slug}
 *   - Dashboard  → tarjeta de la fase correspondiente
 *
 * La numeración 001–024 corresponde a los pasos de la Resolución 40595; no se
 * renumera ni se reordena. Los complementos 025–026 son módulos de apoyo que no
 * son pasos de la norma y por eso van después del último.
 */

export type FasePHVA = 'planear' | 'hacer' | 'verificar' | 'actuar' | 'complemento';

export interface ModuloPESV {
  /** Clave canónica del módulo. Nunca se deriva ni se concatena a mano. */
  slug: string;
  nombre: string;
  fase: FasePHVA;
  /** Segmento de ruta bajo /admin/{fase}/ */
  ruta: string;
}

export const MODULOS_PESV = [
  // ── PLANEAR · pasos 1 a 8 ────────────────────────────────────────────────
  { slug: '001-lider-pesv',                          fase: 'planear',   ruta: 'liderdelpesv',                            nombre: 'Líder del diseño e implementación del PESV' },
  { slug: '002-comite-seguridad-vial',               fase: 'planear',   ruta: 'comiteseguridadvial',                     nombre: 'Comité de seguridad vial' },
  { slug: '003-politicas-seguridad-vial',            fase: 'planear',   ruta: 'politicaseguridadvial',                   nombre: 'Política de seguridad vial' },
  { slug: '004-liderazgo-compromiso',                fase: 'planear',   ruta: 'liderazgo_y_compromiso',                  nombre: 'Liderazgo, compromiso y corresponsabilidad del nivel directivo' },
  { slug: '005-caracterizacion-control-riesgos',     fase: 'planear',   ruta: 'evaluacion_y_control_riesgos',            nombre: 'Caracterización, evaluación y control de riesgos' },
  { slug: '006-diagnostico',                         fase: 'planear',   ruta: 'diagnostico',                             nombre: 'Diagnóstico' },
  { slug: '007-objetivos-metas',                     fase: 'planear',   ruta: 'objetivos_y_metas',                       nombre: 'Objetivos y metas del PESV' },
  { slug: '008-programas-gestion-riesgos',           fase: 'planear',   ruta: 'programas_gestion_riesgos',               nombre: 'Programas de gestión de riesgos críticos y factores de desempeño' },

  // ── HACER · pasos 9 a 19 ─────────────────────────────────────────────────
  { slug: '009-plan-anual-trabajo',                  fase: 'hacer',     ruta: 'plan_anual_trabajo',                      nombre: 'Plan anual de trabajo' },
  { slug: '010-competencia-plan-anual-formacion',    fase: 'hacer',     ruta: 'competencias_plan_anual_formacion',       nombre: 'Competencias y plan anual de formación' },
  { slug: '011-responsabilidad-comportamiento-seguro', fase: 'hacer',   ruta: 'responsabilidad_comportamiento_seguro',   nombre: 'Responsabilidad y comportamiento seguro' },
  { slug: '012-preparacion-respuesta-emergencias-viales', fase: 'hacer', ruta: 'preparacion_respuesta_emergencias_viales', nombre: 'Plan de preparación y respuesta ante emergencias viales' },
  { slug: '013-investigacion-interna-siniestros-viales', fase: 'hacer', ruta: 'investigacion_incidentes_viales',         nombre: 'Investigación interna de siniestros viales' },
  { slug: '014-vias-seguras-administradas-organizacion', fase: 'hacer', ruta: 'vias_seguras_administradas_organizacion', nombre: 'Vías seguras administradas por la organización' },
  { slug: '015-planificacion-desplazamientos-laborales', fase: 'hacer', ruta: 'planificacion_desplazamientos_laborales', nombre: 'Planificación de desplazamientos laborales' },
  { slug: '016-inspeccion-vehiculos-equipos',        fase: 'hacer',     ruta: 'inspeccion_vehiculos_equipos',            nombre: 'Inspección de vehículos y equipos' },
  { slug: '017-mantenimiento-control-vehiculos-seguros', fase: 'hacer', ruta: 'mantenimiento_control_vehiculos_seguros', nombre: 'Mantenimiento y control de vehículos seguros y equipos' },
  { slug: '018-gestion-cambio-contratistas',         fase: 'hacer',     ruta: 'gestion_cambio_contratistas',             nombre: 'Gestión del cambio y gestión de contratistas' },
  { slug: '019-archivo-retencion-documental',        fase: 'hacer',     ruta: 'archivo_retencion_documental',            nombre: 'Archivo y retención documental' },

  // ── VERIFICAR · pasos 20 a 22 ────────────────────────────────────────────
  { slug: '020-indicadores-reporte-autogestion',     fase: 'verificar', ruta: 'indicadores_autogestion_pesv',            nombre: 'Indicadores y reporte de autogestión PESV' },
  { slug: '021-registro-analisis-siniestros-viales', fase: 'verificar', ruta: 'registro_siniestros_viales',              nombre: 'Registro y análisis estadístico de siniestros viales' },
  { slug: '022-auditoria-anual',                     fase: 'verificar', ruta: 'auditoria_anual',                         nombre: 'Auditoría anual' },

  // ── ACTUAR · pasos 23 y 24 ───────────────────────────────────────────────
  { slug: '023-mejora-continua-preventivas-correctivas', fase: 'actuar', ruta: 'mejora_acciones_preventivas_correctivas', nombre: 'Mejora continua, acciones preventivas y correctivas' },
  { slug: '024-mecanismos-comunicacion',             fase: 'actuar',    ruta: 'mecanismos_comunicacion',                 nombre: 'Mecanismos de comunicación' },

  // ── COMPLEMENTOS · fuera de la serie de la Resolución ────────────────────
  { slug: '025-actas-reunion-comite',                fase: 'complemento', ruta: 'actas_reunion_comite',                  nombre: 'Actas de reunión del comité' },
  { slug: '026-matriz-legal',                        fase: 'complemento', ruta: 'matriz_legal',                          nombre: 'Matriz legal' },
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
