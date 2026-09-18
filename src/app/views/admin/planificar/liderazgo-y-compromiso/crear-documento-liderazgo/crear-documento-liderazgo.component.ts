import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EditorComponent, ContenidoEditor } from "../../../../../components/editor/editor.component";
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { EmpresaService } from '../../../../../services/shared/empresa.service';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { AlertaService } from '../../../../../services/shared/alerta.service';

interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-crear-documento-liderazgo',
  standalone: true,
  imports: [CommonModule, RouterLink, EditorComponent, AlertaInformativoComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './crear-documento-liderazgo.component.html',
  styleUrl: './crear-documento-liderazgo.component.css'
})
export class CrearDocumentoLiderazgoComponent {

  private _auth = inject(AuthenticacionService);
  private _empresaSrv = inject(EmpresaService);
  /** Público: la plantilla pinta los avisos del editor (documento vacío, logo). */
  public _alerta = inject(AlertaService);

  /**
   * La razon social sale de Empresas/{nit}, no de photoURL de Auth: ese campo
   * es para una URL de foto y el Admin SDK lo rechaza si no lo es.
   * El NIT si vive en displayName, que admite cualquier texto.
   */
  get empresa(): string {
    return this._empresaSrv.nombre() || '[Nombre de la empresa]';
  }

  readonly nit = this._auth.getCurrentUser()?.displayName || '[NIT de la empresa]';

  public contenido: ContenidoEditor | null = null;
  public plantillaActiva = '';

  readonly plantillas: Plantilla[] = [
    {
      id: 'completa',
      nombre: 'Carta de liderazgo y compromiso',
      descripcion: 'Documento completo: compromiso de la dirección y las 17 acciones con que lo demuestra.',
    },
    {
      id: 'breve',
      nombre: 'Declaración breve de compromiso',
      descripcion: 'Versión corta para firmar, sin el detalle de las acciones.',
    },
  ];

  /**
   * Acciones con que el nivel directivo demuestra su liderazgo y
   * corresponsabilidad. Texto conservado del generador anterior.
   */
  private readonly acciones: string[] = [
    'De la mano del líder del Plan Estratégico de Seguridad Vial (PESV) y del Comité de Seguridad Vial (CSV), definir la política y los objetivos del PESV, compatibles con la dirección estratégica de la organización, buscando prevenir siniestros viales y mejorar los estándares de seguridad vial en cada uno de los desplazamientos generados con fin misional.',
    'El suministro de los recursos financieros, técnicos y humanos requeridos para el diseño, implementación, verificación y mejora del PESV.',
    'El cumplimiento de las acciones y estrategias definidas en el plan de trabajo anual del PESV.',
    'La atención oportuna de las solicitudes de información por parte de las entidades verificadoras, la participación en las reuniones de apertura y de cierre, y la gestión de los hallazgos resultantes de las visitas de verificación, de conformidad con lo establecido en el artículo 1.° de la Ley 2050 de 2020 y las disposiciones que lo reglamenten.',
    'La participación en al menos una reunión del Comité de Seguridad Vial una vez al año, para revisar los resultados de la planificación, implementación, seguimiento y mejora del PESV.',
    'Garantizar la consulta y participación de los empleados en la identificación de los peligros y el control de los riesgos viales, así como la participación de los grupos de apoyo.',
    'Implementar los correctivos necesarios para el cumplimiento de las metas y objetivos del PESV.',
    'Garantizar la disponibilidad de personal competente para liderar y controlar el desarrollo del PESV.',
    'Garantizar un programa de formación y entrenamiento para los empleados con funciones de movilidad, tránsito y transporte terrestre que ingresen a la empresa, independientemente de su forma de contratación y vinculación.',
    'Garantizar un programa de capacitación acorde con las necesidades específicas detectadas en la identificación de peligros y en la evaluación y valoración de riesgos, según el medio de movilización.',
    'Garantizar información oportuna sobre la gestión de la seguridad vial y canales de comunicación que permitan recoger la información manifestada por los empleados.',
    'Nombrar un líder del Plan Estratégico de Seguridad Vial (PESV).',
    'Conformar el Comité de Seguridad Vial e informarlo del proceso del PESV.',
    'Definir la estructura organizativa para elaborar el PESV.',
    'Coordinar y promover la gestión de alianzas y relaciones externas cuando sea necesario.',
    'Promover en la organización la formación y aplicación de hábitos, comportamientos y conductas seguras en la vía.',
    'La adquisición o contratación de vehículos, equipos, repuestos y servicios que cumplan las especificaciones de seguridad, de acuerdo con la normatividad vigente en la materia.',
  ];

  /** Una plantilla sustituye el documento; las firmas se añaden al final. */
  private aplicar(texto: string, modo: 'reemplazar' | 'agregar') {
    this.contenido = { texto, time: new Date().getTime().toString(), modo };
  }

  usarPlantilla(id: string) {
    this.plantillaActiva = id;
    this.aplicar(id === 'completa' ? this.cartaCompleta() : this.cartaBreve(), 'reemplazar');
  }

  agregarFirma(bloque: 'una' | 'dos', alineacion: 'left' | 'center' | 'right') {
    this.aplicar(bloque === 'una' ? this.firmaUnica(alineacion) : this.firmaDoble(alineacion), 'agregar');
  }

  // ── Fragmentos ────────────────────────────────────────────────────────────

  /** Marca en rojo lo que solo conoce el usuario, para que se vea qué falta. */
  private rojo(t: string): string {
    return '[<span style="color:#EE0000;">' + t + '</span>]';
  }

  /**
   * Encabezado y compromiso. El texto viene del generador anterior, que traía
   * incrustado el nombre de otra empresa; ahora se rellena con la del usuario.
   */
  private compromiso(): string {
    const EMPRESA = this.empresa.toUpperCase();
    return `<p style="text-align:center;"><strong>LIDERAZGO, COMPROMISO Y CORRESPONSABILIDAD DEL NIVEL DIRECTIVO</strong></p>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Empresa:</strong> ${this.empresa} &nbsp;&nbsp; <strong>NIT:</strong> ${this.nit}</p>`
      + `<p>&nbsp;</p>`
      + `<p style="text-align:justify;">Comprometidos con el bienestar de cada colaborador de <strong>${EMPRESA}</strong> `
      + `y con el cumplimiento de la normatividad vigente aplicable, la organización establece lineamientos tendientes a la `
      + `promoción de una cultura de seguridad vial, con el objetivo de prevenir siniestros de tránsito durante los `
      + `desplazamientos en misión de sus colaboradores, en vías públicas o privadas abiertas al público.</p>`
      + `<p>&nbsp;</p>`
      + `<p style="text-align:justify;">Es responsabilidad del nivel directivo de <strong>${EMPRESA}</strong> el diseño, `
      + `la implementación y el seguimiento continuo del Plan Estratégico de Seguridad Vial (PESV), para lo cual se requiere `
      + `la coordinación y el apoyo de:</p>`
      + `<ul>`
      + `<li>Líder del Plan Estratégico de Seguridad Vial (PESV).</li>`
      + `<li>Comité de Seguridad Vial (CSV).</li>`
      + `<li>COPASST o Vigía de Seguridad y Salud en el Trabajo.</li>`
      + `</ul>`
      + `<p>&nbsp;</p>`
      + `<p style="text-align:justify;">Por lo anterior, todo el personal, con independencia de su cargo o labor, así como `
      + `los contratistas y subcontratistas —y en especial el personal provisto con vehículos de la organización o de `
      + `terceros para el ejercicio de su labor diaria— es responsable de cumplir lo establecido en el PESV y en el Sistema `
      + `de Gestión de la Seguridad y Salud en el Trabajo (SG-SST).</p>`
      + `<p>&nbsp;</p>`;
  }

  private cartaCompleta(): string {
    const items = this.acciones.map(a => `<li>${a}</li>`).join('');
    return this.compromiso()
      + `<p><strong>El nivel directivo demostrará su liderazgo, compromiso y corresponsabilidad mediante las siguientes acciones:</strong></p>`
      + `<ol>${items}</ol>`
      + `<p>&nbsp;</p>`
      + this.cierre();
  }

  private cartaBreve(): string {
    return this.compromiso()
      + `<p style="text-align:justify;">El nivel directivo asume el compromiso de asignar los recursos financieros, `
      + `técnicos y humanos necesarios, participar en el Comité de Seguridad Vial y hacer seguimiento a los resultados `
      + `del PESV, promoviendo la mejora continua de la seguridad vial en la organización.</p>`
      + `<p>&nbsp;</p>`
      + this.cierre();
  }

  private cierre(): string {
    return `<p>Firmado en ${this.rojo('Ciudad')} el ${this.rojo('XX')} de ${this.rojo('XXX')} de ${this.rojo('XXXX')}.</p>`
      + `<p>&nbsp;</p>`;
  }

  // ── Bloques de firma ──────────────────────────────────────────────────────

  private firmaUnica(alineacion: string): string {
    return `<p>&nbsp;</p><p>&nbsp;</p>`
      + `<p style="text-align:${alineacion};">_______________________________________</p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;"><strong>${this.rojo('NOMBRE COMPLETO')}</strong></span></p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;">C.C. ${this.rojo('Número de documento')}</span></p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;">${this.rojo('CARGO')} — ${this.empresa}</span></p>`
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
