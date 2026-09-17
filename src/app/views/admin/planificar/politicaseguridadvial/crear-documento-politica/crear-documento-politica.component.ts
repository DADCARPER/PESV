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
  selector: 'app-crear-documento-politica',
  standalone: true,
  imports: [CommonModule, RouterLink, EditorComponent, AlertaInformativoComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './crear-documento-politica.component.html',
  styleUrl: './crear-documento-politica.component.css'
})
export class CrearDocumentoPoliticaComponent {

  private _auth = inject(AuthenticacionService);
  /** Público: la plantilla pinta los avisos del editor (documento vacío, logo). */
  public _alerta = inject(AlertaService);

  /** En Firebase Auth el NIT va en displayName y el nombre de la empresa en photoURL. */
  readonly empresa = this._auth.getCurrentUser()?.photoURL || '[Nombre de la empresa]';
  readonly nit = this._auth.getCurrentUser()?.displayName || '[NIT de la empresa]';

  public contenido: ContenidoEditor | null = null;
  public plantillaActiva = '';

  readonly plantillas: Plantilla[] = [
    {
      id: 'politica',
      nombre: 'Política de Seguridad Vial',
      descripcion: 'Declaración de compromiso de la alta dirección, con la base legal y los recursos asignados.',
    },
    {
      id: 'politica-alcohol',
      nombre: 'Política con control de alcohol y drogas',
      descripcion: 'La anterior más el apartado de cero tolerancia al alcohol y sustancias psicoactivas.',
    },
  ];

  /** Una plantilla sustituye el documento; las firmas se añaden al final. */
  private aplicar(texto: string, modo: 'reemplazar' | 'agregar') {
    this.contenido = { texto, time: new Date().getTime().toString(), modo };
  }

  usarPlantilla(id: string) {
    this.plantillaActiva = id;
    this.aplicar(id === 'politica' ? this.politica() : this.politicaConAlcohol(), 'reemplazar');
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
   * Cuerpo de la política. El texto procede del generador anterior, salvo la
   * referencia a "las vías externas del complejo minero", que venía de otra
   * empresa y no aplica al resto.
   */
  private cuerpo(): string {
    const EMPRESA = this.empresa.toUpperCase();
    return `<p style="text-align:center;"><strong>POLÍTICA DE SEGURIDAD VIAL</strong></p>`
      + `<p>&nbsp;</p>`
      + `<p><strong>Empresa:</strong> ${this.empresa} &nbsp;&nbsp; <strong>NIT:</strong> ${this.nit}</p>`
      + `<p>&nbsp;</p>`
      + `<p style="text-align:justify;">La seguridad vial ha cobrado una gran importancia dado el problema de salud pública `
      + `que representa la siniestralidad vial a nivel mundial y específicamente para el caso colombiano. Partiendo de la `
      + `premisa de que <em>la pérdida de una vida en un siniestro de tránsito es inaceptable</em>, <strong>${EMPRESA}</strong>, `
      + `en el marco del desarrollo de sus actividades, se compromete a fomentar una cultura de seguridad vial en todos los `
      + `niveles de la organización, involucrando a todos los colaboradores y visitantes, promoviendo el cumplimiento de la `
      + `normatividad vigente y de los procedimientos internos establecidos en el Plan Estratégico de Seguridad Vial, con el `
      + `fin de propender por una movilidad segura y prevenir siniestros e incidentes viales, tanto en las vías internas como `
      + `en las vías externas por las que se desplaza su personal.</p>`
      + `<p>&nbsp;</p>`
      + `<p style="text-align:justify;"><strong>${EMPRESA}</strong>, en cumplimiento de lo establecido en la Ley 1503 de 2011 `
      + `y en la Resolución 40595 de 2022 del Ministerio de Transporte, se compromete con la planificación e implementación `
      + `del Plan Estratégico de Seguridad Vial, garantizando una mejora continua en el nivel de seguridad vial de la empresa, `
      + `mitigando los riesgos identificados, definiendo las competencias de cada actor vial, controlando y verificando `
      + `periódicamente el estado de los vehículos al servicio de la organización y garantizando el cumplimiento de los `
      + `cronogramas de mantenimiento. Asimismo, promoverá la concientización sobre la responsabilidad y el cumplimiento del `
      + `marco normativo establecido en el Código Nacional de Tránsito Terrestre.</p>`
      + `<p>&nbsp;</p>`
      + `<p style="text-align:justify;">La organización destinará los recursos financieros, humanos y técnicos necesarios `
      + `para dar cumplimiento a esta política y a la mejora continua de la gestión en seguridad vial, e igualmente aplicará `
      + `las medidas disciplinarias que correspondan ante el incumplimiento o la omisión de la presente política.</p>`
      + `<p>&nbsp;</p>`;
  }

  private politica(): string {
    return this.cuerpo() + this.cierre();
  }

  private politicaConAlcohol(): string {
    return this.cuerpo()
      + `<p style="text-align:justify;"><strong>Cero tolerancia al alcohol y a las sustancias psicoactivas.</strong> `
      + `Queda prohibido conducir vehículos al servicio de <strong>${this.empresa.toUpperCase()}</strong> bajo los efectos `
      + `del alcohol o de sustancias psicoactivas, así como su consumo, posesión o distribución durante la jornada laboral. `
      + `La organización podrá realizar pruebas aleatorias, con el consentimiento y las garantías que exige la ley, y aplicará `
      + `las medidas disciplinarias correspondientes ante cualquier incumplimiento.</p>`
      + `<p>&nbsp;</p>`
      + this.cierre();
  }

  private cierre(): string {
    return `<p style="text-align:justify;">La presente política se publica y divulga a todos los colaboradores, `
      + `contratistas y visitantes, y se revisa como mínimo una vez al año.</p>`
      + `<p>&nbsp;</p>`
      + `<p>Firmada en ${this.rojo('Ciudad')} el ${this.rojo('XX')} de ${this.rojo('XXX')} de ${this.rojo('XXXX')}.</p>`
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
