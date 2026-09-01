export namespace ModelProcesos {

  // Documento de periodo anual: Empresas/{nit}/periodos/{año}
  export interface Periodo {
    anio: number;
    fechaInicio: string;                  // 'YYYY-MM-DD'
    fechaFin: string;                     // 'YYYY-MM-DD'
    estado: 'activo' | 'cerrado' | 'historial';
    fechaCreacion: string;                // 'YYYY-MM-DD'
    diagnosticoOficial?: string;
    porcentajeCumplimientoActual: number; // 0-100
    responsablePESV?: string;
    cerrado: boolean;
  }


  // Base reutilizable para todos los módulos
  export interface ProgresoModulo {
    total_progreso: number;
  }

  // Módulo 001 — Líder del diseño e implementación del PESV
  export interface Modulo001LiderPesv extends ProgresoModulo {
    docIdentidad: { total: number };
    actaLiderpesv: { total: number };
    certificadoCompetencia: { total: number };
    docExperienciaProfesional: { total: number };
  }

  // Módulo 002 — Comité de seguridad vial
  export interface Modulo002ComiteSeguridad extends ProgresoModulo {
    actacomite: { total: number };
  }

  // Módulo 003 — Política de seguridad vial
  export interface Modulo003PoliticaSeguridad extends ProgresoModulo {
    actaPolitica: { total: number };
  }

  // Módulo 004 — Liderazgo, compromiso y corresponsabilidad
  export interface Modulo004LiderazgoCompromiso extends ProgresoModulo {
    actaLiderazgo: { total: number };
  }

  // Módulo 007 — Objetivos y metas
  export interface Modulo007ObjetivosMetas extends ProgresoModulo {
    objetivosDefinidos: { total: number };  // objetivos activos del periodo
    objetivosCompletos: { total: number };  // con responsable, plazos y meta medible
    metasDefinidas: { total: number };      // suma de metas de todos los objetivos
  }

  // Módulo 006 — Diagnóstico
  export interface Modulo006Diagnostico extends ProgresoModulo {
    InfoOrganizacional: { total: number };
    colaboradores: { total: number };
    flota: { total: number };
    contratistas: { total: number };
    rutas: { total: number };
    emergencias: { total: number };
  }

  /**
   * Documento principal de EstatusGeneral/{nitEmpresa}
   *
   * - `periodo`: año al que pertenece este registro (ej: 2025)
   * - `Total_General`: porcentaje global de avance (0-100)
   * - Módulos opcionales: si el campo no existe, el módulo no ha sido iniciado.
   *   Permite distinguir "Sin iniciar" (undefined) de "0% real" ({ total_progreso: 0 }).
   */
  export interface ProcesosCarga {
    id: string;
    periodo: number;          // Año del ciclo PHVA al que pertenece este estatus
    Total_General: number;    // Porcentaje global de todos los módulos (0-100)
    docCreado: string;
    docActualizado?: string;
    estado?: string;

    // Las claves son los slugs canónicos de data/modulos-pesv.ts.
    // Módulos opcionales: undefined = no iniciado.

    // PLANEAR — pasos 1 a 8
    "001-lider-pesv"?: Modulo001LiderPesv;
    "002-comite-seguridad-vial"?: Modulo002ComiteSeguridad;
    "003-politicas-seguridad-vial"?: Modulo003PoliticaSeguridad;
    "004-liderazgo-compromiso"?: Modulo004LiderazgoCompromiso;
    "005-caracterizacion-control-riesgos"?: ProgresoModulo;
    "006-diagnostico"?: Modulo006Diagnostico;
    "007-objetivos-metas"?: Modulo007ObjetivosMetas;
    "008-programas-gestion-riesgos"?: ProgresoModulo;

    // HACER — pasos 9 a 19
    "009-plan-anual-trabajo"?: ProgresoModulo;
    "010-competencia-plan-anual-formacion"?: ProgresoModulo;
    "011-responsabilidad-comportamiento-seguro"?: ProgresoModulo;
    "012-preparacion-respuesta-emergencias-viales"?: ProgresoModulo;
    "013-investigacion-interna-siniestros-viales"?: ProgresoModulo;
    "014-vias-seguras-administradas-organizacion"?: ProgresoModulo;
    "015-planificacion-desplazamientos-laborales"?: ProgresoModulo;
    "016-inspeccion-vehiculos-equipos"?: ProgresoModulo;
    "017-mantenimiento-control-vehiculos-seguros"?: ProgresoModulo;
    "018-gestion-cambio-contratistas"?: ProgresoModulo;
    "019-archivo-retencion-documental"?: ProgresoModulo;

    // VERIFICAR — pasos 20 a 22
    "020-indicadores-reporte-autogestion"?: ProgresoModulo;
    "021-registro-analisis-siniestros-viales"?: ProgresoModulo;
    "022-auditoria-anual"?: ProgresoModulo;

    // ACTUAR — pasos 23 y 24
    "023-mejora-continua-preventivas-correctivas"?: ProgresoModulo;
    "024-mecanismos-comunicacion"?: ProgresoModulo;

    // COMPLEMENTOS — fuera de la serie de la Resolución
    "025-actas-reunion-comite"?: ProgresoModulo;
    "026-matriz-legal"?: ProgresoModulo;
  }
}
