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

    // PLANEAR — Módulos opcionales: undefined = no iniciado
    "001-lider-pesv-documentos"?: Modulo001LiderPesv;
    "002-comite-seguridad-vial-documentos"?: Modulo002ComiteSeguridad;
    "003-politicas-seguridad-vial-documentos"?: Modulo003PoliticaSeguridad;
    "004-liderazgo-compromiso-documentos"?: Modulo004LiderazgoCompromiso;
    "005-ejemplo-control-riesgos"?: ProgresoModulo;
    "006-diagnostico"?: Modulo006Diagnostico;
    "007-objetivos-metas"?: ProgresoModulo;
    "008-programas-gestion-riesgos"?: ProgresoModulo;
    "009-actas-reunion-comite"?: ProgresoModulo;
    "010-matriz-legal"?: ProgresoModulo;
  }
}
