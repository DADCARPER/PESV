import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EditorComponent, ContenidoEditor } from "../../../../../components/editor/editor.component";
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { AlertaService } from '../../../../../services/shared/alerta.service';

interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-crear-documento-comite',
  standalone: true,
  imports: [CommonModule, RouterLink, EditorComponent, AlertaInformativoComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './crear-documento-comite.component.html',
  styleUrl: './crear-documento-comite.component.css'
})
export class CrearDocumentoComiteComponent {

  private _auth = inject(AuthenticacionService);
  /** Publico: la plantilla pinta los avisos del editor (documento vacio, logo). */
  public _alerta = inject(AlertaService);

  /** En Firebase Auth el NIT va en displayName y el nombre de la empresa en photoURL. */
  readonly empresa = this._auth.getCurrentUser()?.photoURL || '[Nombre de la empresa]';
  readonly nit = this._auth.getCurrentUser()?.displayName || '[NIT de la empresa]';

  public contenido: ContenidoEditor | null = null;
  public plantillaActiva = '';

  readonly plantillas: Plantilla[] = [
    {
      id: 'conformacion',
      nombre: 'Acta de conformación del comité',
      descripcion: 'Acta completa: integrantes, objetivo y las 17 funciones que fija la Resolución 40595.',
    },
    {
      id: 'integrantes',
      nombre: 'Acta breve de designación',
      descripcion: 'Versión corta, centrada en quiénes integran el comité y con qué rol.',
    },
  ];

  /**
   * Funciones del Comité de Seguridad Vial según la Resolución 40595 de 2022.
   * Se conservan literalmente: son el contenido exigible del acta.
   */
  private readonly funciones: string[] = [
    'Definir la visión, los objetivos y alcances del Plan Estratégico de Seguridad Vial de la organización acorde con los mínimos establecidos por la autoridad correspondiente.',
    'Realizar las acciones tendientes a diseñar, implementar y mejorar continuamente el Plan Estratégico de Seguridad Vial, involucrando a todos los actores viales de la empresa.',
    'Analizar los resultados obtenidos en el diagnóstico inicial y formular la hoja de ruta a seguir, conducentes a reforzar los aspectos favorables encontrados, mitigar los riesgos y diseñar acciones para garantizar un cambio de actitud en los diversos actores de movilidad en la entidad.',
    'Presentar, discutir y determinar los programas académicos a desarrollar con los distintos actores.',
    'Promover la participación de colaboradores y comunidad en las acciones de la seguridad vial.',
    'Evaluar los requerimientos y la oferta disponible, frente a proveedores y talleres para los procesos de diagnóstico, mantenimiento preventivo y mantenimiento correctivo de los vehículos de la entidad.',
    'Programar fechas, tiempos y lugares para las capacitaciones con los conductores y operadores.',
    'Determinar las acciones de control o auditorías viales que se consideren pertinentes.',
    'Presentar campañas educativas y acciones de acompañamiento (actividades) para desarrollar durante todo el año.',
    'Garantizar la aplicación y recursos que permitan el cumplimiento de la política de seguridad vial.',
    'Definir la competencia en seguridad vial de los colaboradores de la empresa y establecer un Plan Anual de Formación que permita la gestión del conocimiento por cada actor vial, asegurando el cumplimiento de este.',
    'Documentar y aplicar técnicas, metodologías y/o procedimientos para la investigación interna de siniestros viales, los cuales permitan determinar los planes de acción que eliminen, sustituyan o mitiguen el o los riesgos generadores del evento.',
    'Elaborar, analizar y aprobar los informes periódicos para la gerencia, Ministerio de Transporte, Organismos de Tránsito u otros interesados, que den cuenta de las acciones programadas, adelantadas y por ejecutar, analizando el impacto, costo-beneficio y aporten en la generación de hábitos, comportamientos y conductas favorables a la seguridad vial del país.',
    'Programar y ejecutar una auditoría anual interna, la cual permita evaluar el cumplimiento y estado del PESV.',
    'Definir e implementar acciones correctivas y/o preventivas necesarias con base al análisis de indicadores, resultados de auditorías y visitas de verificación del PESV.',
    'Establecer los canales de comunicación que permitan la promoción, divulgación y comunicación de resultados y controles adoptados por la empresa con el fin de mejorar el nivel de seguridad vial.',
    'Suspender de manera inmediata todos los actos inseguros que afecten las condiciones de seguridad vial que se desarrollen dentro del proyecto, teniendo autoridad sobre vehículos propios, proveedores y contratistas.',
  ];

  /** Una plantilla sustituye el documento; las firmas se añaden al final. */
  private aplicar(texto: string, modo: 'reemplazar' | 'agregar') {
    this.contenido = { texto, time: new Date().getTime().toString(), modo };
  }

  usarPlantilla(id: string) {
    this.plantillaActiva = id;
    this.aplicar(id === 'conformacion' ? this.actaConformacion() : this.actaIntegrantes(), 'reemplazar');
  }

  agregarFirma(bloque: 'una' | 'dos', alineacion: 'left' | 'center' | 'right') {
    this.aplicar(bloque === 'una' ? this.firmaUnica(alineacion) : this.firmaDoble(alineacion), 'agregar');
  }

  // ── Fragmentos comunes ────────────────────────────────────────────────────

  /** Marca en rojo lo que solo conoce el usuario, para que se vea qué falta. */
  private rojo(t: string): string {
    return '[<span style="color:#EE0000;">' + t + '</span>]';
  }

  private encabezado(titulo: string): string {
    return `<p style="text-align:center;"><strong>${titulo}</strong></p>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Empresa:</strong> ${this.empresa}<br>`
      + `<strong>NIT:</strong> ${this.nit}<br>`
      + `<strong>Ciudad:</strong> ${this.rojo('Ciudad')} &nbsp;&nbsp;`
      + `<strong>Departamento:</strong> ${this.rojo('Departamento')}<br>`
      + `<strong>Fecha:</strong> ${this.rojo('XX')} de ${this.rojo('XXX')} de ${this.rojo('XXXX')}</p>`
      + `<p>&nbsp;</p>`;
  }

  private tablaIntegrantes(): string {
    const fila = `<li>${this.rojo('Nombre completo')} — Cargo: ${this.rojo('Cargo')} — `
      + `Rol en el comité: ${this.rojo('Rol')} — Contacto: ${this.rojo('Correo o teléfono')}</li>`;
    return `<p><strong>Integrantes del comité:</strong></p><ul>${fila}${fila}${fila}</ul><p>&nbsp;</p>`;
  }

  // ── Plantillas ────────────────────────────────────────────────────────────

  private actaConformacion(): string {
    const items = this.funciones.map(f => `<li>${f}</li>`).join('');
    return this.encabezado('ACTA DE CONFORMACIÓN DEL COMITÉ DE SEGURIDAD VIAL')
      + `<p style="text-align:justify;">En cumplimiento de la <strong>Resolución 40595 de 2022</strong> del Ministerio de Transporte, `
      + `la empresa <strong>${this.empresa}</strong>, identificada con NIT <strong>${this.nit}</strong>, conforma su `
      + `<strong>Comité de Seguridad Vial</strong>, instancia responsable de liderar el diseño, la implementación y la mejora continua `
      + `del Plan Estratégico de Seguridad Vial (PESV).</p>`
      + `<p>&nbsp;</p>`
      + this.tablaIntegrantes()
      + `<p><strong>Objetivo del comité:</strong></p>`
      + `<p style="text-align:justify;">Promover la seguridad vial en la organización, prevenir los siniestros viales y `
      + `fomentar hábitos de movilidad segura entre todos los actores viales de la empresa, garantizando el cumplimiento `
      + `de la normatividad vigente.</p>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Periodicidad de las reuniones:</strong> ${this.rojo('mensual / bimestral / trimestral')}</p>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Funciones del comité (Resolución 40595 de 2022):</strong></p>`
      + `<ol>${items}</ol>`
      + `<p>&nbsp;</p>`;
  }

  private actaIntegrantes(): string {
    return this.encabezado('ACTA DE DESIGNACIÓN DE LOS INTEGRANTES DEL COMITÉ DE SEGURIDAD VIAL')
      + `<p style="text-align:justify;">La empresa <strong>${this.empresa}</strong>, identificada con NIT `
      + `<strong>${this.nit}</strong>, designa a los siguientes colaboradores como integrantes del Comité de Seguridad Vial, `
      + `en cumplimiento de la Resolución 40595 de 2022.</p>`
      + `<p>&nbsp;</p>`
      + this.tablaIntegrantes()
      + `<p><strong>Periodicidad de las reuniones:</strong> ${this.rojo('mensual / bimestral / trimestral')}</p>`
      + `<p>&nbsp;</p>`;
  }

  // ── Bloques de firma ──────────────────────────────────────────────────────

  private firmaUnica(alineacion: string): string {
    return `<p>&nbsp;</p><p>&nbsp;</p>`
      + `<p style="text-align:${alineacion};">_______________________________________</p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;"><strong>${this.rojo('NOMBRE COMPLETO')}</strong></span></p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;">C.C. ${this.rojo('Número de documento')}</span></p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;">${this.rojo('CARGO')}</span></p>`
      + `<p>&nbsp;</p>`;
  }

  private firmaDoble(alineacion: string): string {
    return `<p>&nbsp;</p><p>&nbsp;</p>`
      + `<p style="text-align:${alineacion};">_______________________________________ &nbsp; &nbsp; &nbsp; &nbsp; _______________________________________</p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;"><strong>${this.rojo('NOMBRE COMPLETO')} &nbsp; &nbsp; &nbsp; &nbsp; ${this.rojo('NOMBRE COMPLETO')}</strong></span></p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;">${this.rojo('CARGO')} &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ${this.rojo('CARGO')}</span></p>`
      + `<p>&nbsp;</p>`;
  }
}
