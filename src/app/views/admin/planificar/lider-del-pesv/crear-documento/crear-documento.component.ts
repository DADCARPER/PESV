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
  selector: 'app-crear-documento',
  standalone: true,
  imports: [CommonModule, RouterLink, EditorComponent, AlertaInformativoComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './crear-documento.component.html',
  styleUrl: './crear-documento.component.css'
})
export class CrearDocumentoComponent {

  private _auth = inject(AuthenticacionService);
  /** Publico: la plantilla pinta los avisos del editor (documento vacio, logo). */
  public _alerta = inject(AlertaService);

  /** En Firebase Auth el NIT va en displayName y el nombre de la empresa en photoURL. */
  readonly empresa = this._auth.getCurrentUser()?.photoURL || '[Nombre de la empresa]';
  readonly nit = this._auth.getCurrentUser()?.displayName || '[NIT de la empresa]';

  public contenido: ContenidoEditor | null = null;
  /** Plantilla aplicada, para señalarla en la interfaz. */
  public plantillaActiva = '';

  readonly plantillas: Plantilla[] = [
    {
      id: 'designacion',
      nombre: 'Acta de designación',
      descripcion: 'Designa al líder y detalla sus funciones y responsabilidades.',
    },
    {
      id: 'nombramiento',
      nombre: 'Acta de nombramiento',
      descripcion: 'Variante con los datos del líder en lista: nombre, cédula, cargo y contacto.',
    },
  ];

  /** Una plantilla sustituye el documento; las firmas se añaden al final. */
  private aplicar(texto: string, modo: 'reemplazar' | 'agregar') {
    this.contenido = { texto, time: new Date().getTime().toString(), modo };
  }

  usarPlantilla(id: string) {
    this.plantillaActiva = id;
    this.aplicar(id === 'designacion' ? this.actaDesignacion() : this.actaNombramiento(), 'reemplazar');
  }

  agregarFirma(bloque: 'una' | 'dos', alineacion: 'left' | 'center' | 'right') {
    this.aplicar(bloque === 'una' ? this.firmaUnica(alineacion) : this.firmaDoble(alineacion), 'agregar');
  }

  // ── Plantillas ────────────────────────────────────────────────────────────
  // El nombre de la empresa y el NIT se rellenan solos; lo que solo conoce el
  // usuario queda entre corchetes y en rojo para que se vea qué falta.

  private actaDesignacion(): string {
    return `<p style="text-align:center;"><strong>ACTA DE DESIGNACIÓN DEL LÍDER DEL PESV</strong></p>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Fecha:</strong> [<span style="color:#EE0000;">XX</span> de <span style="color:#EE0000;">XXX</span> de <span style="color:#EE0000;">XXXX</span>]<br>`
      + `<strong>Empresa:</strong> ${this.empresa}<br>`
      + `<strong>NIT:</strong> ${this.nit}<br>`
      + `<strong>Ciudad:</strong> [<span style="color:#EE0000;">Ciudad</span>]</p>`
      + `<p>&nbsp;</p>`
      + `<p style="text-align:justify;">En ejercicio de sus facultades legales y en cumplimiento de la <strong>Resolución 40595 de 2022</strong> del Ministerio de Transporte, se designa a [<span style="color:#EE0000;">Nombre completo del líder</span>], identificado con cédula de ciudadanía N.° [<span style="color:#EE0000;">Número de documento</span>], quien se desempeña como [<span style="color:#EE0000;">Cargo del líder</span>], como <strong>Líder del diseño e implementación del Plan Estratégico de Seguridad Vial (PESV)</strong> de la organización.</p>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Funciones y responsabilidades:</strong></p>`
      + `<ul>`
      + `<li><strong>Diseñar e implementar el PESV</strong>, velando por el cumplimiento de la normatividad vigente.</li>`
      + `<li><strong>Supervisar y evaluar</strong> las diferentes fases del PESV, asegurando su efectividad y cumplimiento.</li>`
      + `<li><strong>Coordinar</strong> el Comité de Seguridad Vial y asegurar su funcionamiento.</li>`
      + `<li><strong>Gestionar capacitaciones</strong> sobre seguridad vial para los colaboradores.</li>`
      + `<li><strong>Elaborar y presentar informes</strong> de avance sobre el cumplimiento del PESV a la alta dirección.</li>`
      + `<li><strong>Asegurar la mejora continua</strong> del PESV, ajustando acciones conforme a los resultados obtenidos.</li>`
      + `</ul>`
      + `<p>&nbsp;</p>`;
  }

  private actaNombramiento(): string {
    return `<p style="text-align:center;"><strong>ACTA DE NOMBRAMIENTO DEL LÍDER DEL DISEÑO E IMPLEMENTACIÓN DEL PESV</strong></p>`
      + `<p>&nbsp;</p>`
      + `<p style="text-align:justify;">En la ciudad de [<span style="color:#EE0000;">Ciudad</span>], a los [<span style="color:#EE0000;">XX</span>] días del mes de [<span style="color:#EE0000;">XXX</span>] del año [<span style="color:#EE0000;">XXXX</span>], en ejercicio de sus facultades legales y reglamentarias, en especial las conferidas por la Resolución 40595 de 2022, el representante legal de <strong>${this.empresa}</strong>, identificada con NIT <strong>${this.nit}</strong>, nombra al siguiente colaborador como Líder del diseño e implementación del Plan Estratégico de Seguridad Vial (PESV):</p>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Líder del PESV:</strong></p>`
      + `<ul>`
      + `<li><strong>Nombre:</strong> [<span style="color:#EE0000;">Nombre completo del líder</span>]</li>`
      + `<li><strong>Documento:</strong> [<span style="color:#EE0000;">Número de documento</span>]</li>`
      + `<li><strong>Cargo:</strong> [<span style="color:#EE0000;">Cargo del líder</span>]</li>`
      + `<li><strong>Contacto:</strong> [<span style="color:#EE0000;">Teléfono o correo</span>]</li>`
      + `</ul>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Funciones y responsabilidades:</strong></p>`
      + `<ul>`
      + `<li>Garantizar que todo el personal cumpla con lo establecido en el PESV.</li>`
      + `<li>Supervisar las etapas de planificación, implementación y mejora del PESV.</li>`
      + `<li>Coordinar y presentar informes de avance del PESV ante la alta dirección.</li>`
      + `<li>Asegurar la capacitación continua de los colaboradores sobre seguridad vial.</li>`
      + `<li>Diligenciar el reporte de autogestión anual y los resultados de los indicadores del PESV.</li>`
      + `<li>Realizar seguimiento de los compromisos derivados de las reuniones del Comité de Seguridad Vial.</li>`
      + `</ul>`
      + `<p>&nbsp;</p>`;
  }

  // ── Bloques de firma ──────────────────────────────────────────────────────

  private firmaUnica(alineacion: string): string {
    return `<p>&nbsp;</p><p>&nbsp;</p>`
      + `<p style="text-align:${alineacion};">_______________________________________</p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;"><strong>[<span style="color:#EE0000;">NOMBRE COMPLETO</span>]</strong></span></p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;">C.C. [<span style="color:#EE0000;">Número de documento</span>]</span></p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;">[<span style="color:#EE0000;">CARGO</span>]</span></p>`
      + `<p>&nbsp;</p>`;
  }

  private firmaDoble(alineacion: string): string {
    return `<p>&nbsp;</p><p>&nbsp;</p>`
      + `<p style="text-align:${alineacion};">_______________________________________ &nbsp; &nbsp; &nbsp; &nbsp; _______________________________________</p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;"><strong>[<span style="color:#EE0000;">NOMBRE COMPLETO</span>] &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; [<span style="color:#EE0000;">NOMBRE COMPLETO</span>]</strong></span></p>`
      + `<p style="text-align:${alineacion};"><span style="font-size:10pt;">[<span style="color:#EE0000;">CARGO</span>] &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; [<span style="color:#EE0000;">CARGO</span>]</span></p>`
      + `<p>&nbsp;</p>`;
  }
}
