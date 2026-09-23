import { inject, Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ModelsInforme } from '../../interfaces/informe.interface';
import { InformeGraficasService } from './informe-graficas.service';

(pdfMake as any).vfs = (pdfFonts as any).vfs ?? (pdfFonts as any).pdfMake?.vfs;

/**
 * Arma el PDF del informe de diagnóstico.
 *
 * Se construye a partir de las cifras, no del DOM. La versión anterior
 * fotografiaba la pantalla con html2canvas: salía una imagen borrosa, sin
 * texto seleccionable, que se rompía si la ventana era estrecha y que no se
 * podía regenerar para un informe archivado porque su pantalla ya no existía.
 *
 * Aquí el origen es `ModelsInforme.Datos`, que es exactamente lo que se guarda
 * al emitir. Por eso un informe de hace un año se vuelve a descargar idéntico:
 * el documento se rehace desde sus números.
 */
@Injectable({ providedIn: 'root' })
export class InformePdfService {

  private _graficas = inject(InformeGraficasService);

  private static readonly NARANJA = '#f46c2d';
  private static readonly AZUL = '#202e48';
  private static readonly GRIS = '#e5e7eb';

  /** El gris muy claro de las filas pares. Marca sin llamar la atención. */
  private static readonly CEBRA = '#f4f7fa';
  /** El borde de las celdas: más claro que el texto, o compite con él. */
  private static readonly BORDE = '#d9e2ec';

  /** Ancho útil: la carta menos los dos márgenes laterales. */
  private static readonly ANCHO = 512;

  /**
   * El trazado de las tablas del informe, uno para todas.
   *
   * Un documento con dos estilos de tabla se lee como dos documentos pegados.
   * Va aquí en vez de repetido en cada método para que cambiarlo sea cambiarlo
   * en un sitio.
   *
   * Las filas alternan un gris muy claro. No es adorno: en una tabla de quince
   * filas y seis columnas, el ojo pierde el renglón al ir de la primera
   * columna a la última, y la banda lo sostiene.
   */
  private layoutTabla(conCabecera = true): any {
    return {
      fillColor: (fila: number) => {
        if (conCabecera && fila === 0) return InformePdfService.AZUL;
        const indice = conCabecera ? fila - 1 : fila;
        return indice % 2 === 1 ? InformePdfService.CEBRA : null;
      },
      hLineColor: () => InformePdfService.BORDE,
      vLineColor: () => InformePdfService.BORDE,
      // El primer y el último trazo, algo más marcados: cierran la tabla.
      hLineWidth: (i: number, nodo: any) =>
        i === 0 || i === nodo.table.body.length ? 0.8 : 0.5,
      vLineWidth: () => 0.5,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: (fila: number) => (conCabecera && fila === 0 ? 9 : 8),
      paddingBottom: (fila: number) => (conCabecera && fila === 0 ? 9 : 8),
    };
  }

  /** Una aclaración del informe, con su etiqueta destacada. */
  private nota(texto: string): any {
    return {
      text: [
        { text: 'Nota: ', bold: true, color: InformePdfService.AZUL },
        texto,
      ],
      style: 'nota',
      margin: [0, 2, 0, 4],
    };
  }

  /** El filete que separa la cabecera y el pie del cuerpo. */
  private filete(margen: number[]): any {
    return {
      canvas: [{
        type: 'line', x1: 0, y1: 0, x2: InformePdfService.ANCHO, y2: 0,
        lineWidth: 0.5, lineColor: InformePdfService.GRIS,
      }],
      margin: margen,
    };
  }

  /** Arma el documento y lo descarga. */
  async descargar(informe: ModelsInforme.Datos & { version?: number }): Promise<void> {
    const imagenes = await this._graficas.imagenes(informe.secciones);
    const documento = this.documento(informe, imagenes);

    const nombre = `Informe-diagnostico-PESV-${informe.periodo}`
      + (informe.version ? `-v${informe.version}` : '')
      + '.pdf';

    pdfMake.createPdf(documento as any).download(nombre);
  }

  private documento(
    informe: ModelsInforme.Datos & { version?: number; fechaEmision?: string; emitidoPor?: string },
    imagenes: WeakMap<ModelsInforme.Reparto, string>
  ): any {
    const introduccion = informe.secciones.find(s => s.id === 'introduccion');
    const resto = informe.secciones.filter(s => s !== introduccion);

    return {
      pageSize: 'LETTER',
      pageMargins: [50, 70, 50, 60],
      info: {
        title: `Informe de diagnóstico PESV ${informe.periodo}`,
        author: informe.nombreEmpresa,
      },

      // La portada va limpia: una cabecera sobre el título del documento
      // compite con él y no informa de nada que no esté ya debajo.
      header: (pagina: number) => pagina === 1 ? null : ({
        margin: [50, 28, 50, 0],
        stack: [
          {
            columns: [
              { text: informe.nombreEmpresa, fontSize: 8, color: '#888' },
              {
                text: `Diagnóstico PESV ${informe.periodo}`,
                fontSize: 8, color: '#888', alignment: 'right',
              },
            ],
          },
          this.filete([0, 5, 0, 0]),
        ],
      }),

      footer: (pagina: number, total: number) => ({
        margin: [50, 12, 50, 0],
        stack: [
          this.filete([0, 0, 0, 5]),
          {
            columns: [
              {
                text: 'Resolución 40595 de 2022 · Plan Estratégico de Seguridad Vial',
                fontSize: 7, color: '#aaa',
              },
              { text: `${pagina} de ${total}`, fontSize: 7, color: '#aaa', alignment: 'right' },
            ],
          },
        ],
      }),

      // La introducción abre el documento, antes incluso de la metodología:
      // sitúa al lector en el problema antes de darle la primera cifra.
      content: [
        ...this.portada(informe),
        ...introduccion ? this.seccion(introduccion, imagenes) : [],
        ...this.metodologia(informe),
        ...resto.flatMap(s => this.seccion(s, imagenes)),
      ],

      styles: {
        titulo: { fontSize: 24, bold: true, color: InformePdfService.AZUL },
        seccion: { fontSize: 15, bold: true, color: InformePdfService.AZUL },
        subtitulo: { fontSize: 10, bold: true, color: '#444' },
        parrafo: { fontSize: 10, lineHeight: 1.35, alignment: 'justify' },
        nota: { fontSize: 8.5, color: '#667085', lineHeight: 1.25 },
        celda: { fontSize: 9 },
        // El relleno de la cabecera lo pone el trazado, no el estilo: con las
        // dos cosas a la vez, la celda y la fila pintan cada una por su lado.
        cabeceraTabla: { fontSize: 9, bold: true, color: '#fff', characterSpacing: 0.4 },
        /** Un número se lee alineado a la derecha: las unidades quedan juntas. */
        valorTabla: { alignment: 'right', bold: true, color: '#1f2937' },
      },
      defaultStyle: { fontSize: 10 },
    };
  }

  private portada(informe: ModelsInforme.Datos & { fechaEmision?: string; emitidoPor?: string; version?: number }): any[] {
    const emitido = informe.fechaEmision ? new Date(informe.fechaEmision) : new Date();

    return [
      { text: '\n\n\n' },
      { text: 'INFORME DE DIAGNÓSTICO', style: 'titulo', alignment: 'center' },
      {
        text: 'Plan Estratégico de Seguridad Vial',
        fontSize: 13, color: InformePdfService.NARANJA, alignment: 'center', margin: [0, 6, 0, 0],
      },
      {
        canvas: [{
          type: 'line', x1: 140, y1: 0, x2: 372, y2: 0,
          lineWidth: 2, lineColor: InformePdfService.NARANJA,
        }],
        margin: [0, 18, 0, 18],
      },
      { text: informe.nombreEmpresa, fontSize: 16, bold: true, alignment: 'center' },
      { text: `NIT ${informe.nitEmpresa}`, fontSize: 10, color: '#666', alignment: 'center', margin: [0, 4, 0, 0] },
      {
        text: `Periodo ${informe.periodo}`,
        fontSize: 12, color: InformePdfService.AZUL, alignment: 'center', margin: [0, 24, 0, 0],
      },
      {
        text: `Emitido el ${emitido.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`
          + (informe.version ? `  ·  Versión ${informe.version}` : ''),
        style: 'nota', alignment: 'center', margin: [0, 8, 0, 0],
      },
      informe.emitidoPor
        ? { text: `Responde: ${informe.emitidoPor}`, style: 'nota', alignment: 'center', margin: [0, 2, 0, 0] }
        : {},
      { text: '', pageBreak: 'after' },
    ];
  }

  /**
   * La metodología va antes que cualquier cifra.
   *
   * Un diagnóstico por muestreo tiene que declarar su muestra: "200 de 2.000
   * empleados" es defendible, y "200 colaboradores" a secas parece un censo
   * mal hecho.
   */
  private metodologia(informe: ModelsInforme.Datos): any[] {
    const m = informe.metodologia;

    return [
      { text: 'Metodología', style: 'seccion', margin: [0, 0, 0, 10] },
      {
        style: 'celda',
        table: {
          widths: ['*', 130],
          headerRows: 1,
          body: [
            [
              { text: 'CONCEPTO', style: 'cabeceraTabla' },
              { text: 'VALOR', style: 'cabeceraTabla', alignment: 'right' },
            ],
            ['Personas vinculadas a la organización', { text: String(m.poblacion), style: 'valorTabla' }],
            ['Respuestas obtenidas en la encuesta', { text: String(m.muestra), style: 'valorTabla' }],
            ['Cobertura de la muestra', { text: `${m.cobertura}%`, style: 'valorTabla' }],
            ['Instrumento aplicado', { text: m.encuesta, style: 'valorTabla' }],
          ],
        },
        layout: this.layoutTabla(),
        margin: [0, 0, 0, 14],
      },
      this.nota(
        'Las cifras de este informe corresponden al estado del diagnóstico en la fecha '
        + 'de emisión. El diagnóstico continúa abierto: las variaciones posteriores se '
        + 'recogen en una nueva versión del informe.'
      ),
      { text: '', pageBreak: 'after' },
    ];
  }

  private seccion(
    seccion: ModelsInforme.Seccion,
    imagenes: WeakMap<ModelsInforme.Reparto, string>
  ): any[] {
    const bloques: any[] = [
      { text: seccion.titulo.toUpperCase(), style: 'seccion', margin: [0, 0, 0, 4] },
      {
        canvas: [{
          type: 'line', x1: 0, y1: 0, x2: InformePdfService.ANCHO, y2: 0,
          lineWidth: 1.5, lineColor: InformePdfService.NARANJA,
        }],
        margin: [0, 0, 0, 10],
      },
    ];

    if (seccion.sinDatos) {
      bloques.push({
        text: 'No se registraron datos para esta sección en el periodo.',
        style: 'nota', margin: [0, 0, 0, 12],
      });
      return [...bloques, { text: '', pageBreak: 'after' }];
    }

    if (seccion.identificacion?.length) {
      bloques.push(this.tablaIdentificacion(seccion.identificacion));
    }

    if (seccion.texto) {
      bloques.push({ text: seccion.texto, style: 'parrafo', margin: [0, 0, 0, 12] });
    }

    if (seccion.destacados?.length) {
      bloques.push(this.tablaDestacados(seccion.destacados));
    }

    if (seccion.cifras.length) {
      bloques.push(this.tablaCifras(seccion.cifras));
    }

    if (seccion.sedes?.length) {
      bloques.push(this.tablaSedes(seccion.sedes));
    }

    for (const reparto of seccion.repartos) {
      bloques.push(...this.reparto(reparto, imagenes));
    }

    for (const tabla of seccion.tablas ?? []) {
      bloques.push(...this.tabla(tabla));
    }

    if (seccion.recomendaciones) {
      bloques.push(this.recomendaciones(seccion.recomendaciones));
    }

    // Cada sección empieza en su página: un informe que se presenta se hojea
    // por secciones, y una que arranca a media página se pasa por alto.
    return [...bloques, { text: '', pageBreak: 'after' }];
  }

  private tablaIdentificacion(datos: NonNullable<ModelsInforme.Seccion['identificacion']>): any {
    return {
      style: 'celda',
      table: {
        widths: ['auto', '*'],
        body: datos.map(d => [
          { text: d.etiqueta, bold: true, color: '#555' },
          { text: d.valor || '—' },
        ]),
      },
      // Sin cabecera: son pares de dato y valor, no una tabla de registros.
      layout: this.layoutTabla(false),
      margin: [0, 0, 0, 12],
    };
  }

  private tablaDestacados(destacados: ModelsInforme.Destacado[]): any {
    return {
      style: 'celda',
      table: {
        widths: destacados.map(() => '*'),
        body: [
          destacados.map(d => ({
            text: [
              { text: `${d.valor}\n`, fontSize: 20, bold: true, color: InformePdfService.NARANJA },
              { text: `${d.etiqueta}\n`, fontSize: 9, color: '#555' },
              { text: `${d.porcentaje}%`, fontSize: 9, color: '#888' },
            ],
            alignment: 'center',
          })),
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 14],
    };
  }

  /** Las cifras, de tres en tres: más por fila y dejan de leerse. */
  private tablaCifras(cifras: ModelsInforme.Cifra[]): any {
    const filas: any[] = [];

    for (let i = 0; i < cifras.length; i += 3) {
      filas.push(cifras.slice(i, i + 3).map(c => ({
        stack: [
          { text: String(c.valor), fontSize: 15, bold: true, color: c.alerta ? '#b91c1c' : InformePdfService.AZUL },
          { text: c.etiqueta, fontSize: 8, color: '#555', margin: [0, 2, 0, 0] },
          c.nota ? { text: c.nota, fontSize: 7, color: '#888', margin: [0, 1, 0, 0] } : {},
        ],
        fillColor: c.alerta ? '#fef2f2' : '#f9fafb',
        margin: [6, 6, 6, 6],
      })));

      // pdfMake exige que todas las filas tengan las mismas celdas.
      while (filas[filas.length - 1].length < 3) filas[filas.length - 1].push({ text: '' });
    }

    return {
      table: { widths: ['*', '*', '*'], body: filas },
      layout: 'noBorders',
      margin: [0, 0, 0, 14],
    };
  }

  private tablaSedes(sedes: ModelsInforme.FichaSede[]): any {
    return {
      style: 'celda',
      table: {
        headerRows: 1,
        widths: ['*', 'auto', '*', 'auto', 'auto'],
        body: [
          ['SEDE', 'TIPO', 'DIRECCIÓN', 'CIUDAD', 'EMPLEADOS'].map(
            (t, i) => ({ text: t, style: 'cabeceraTabla', alignment: i === 4 ? 'right' : 'left' })
          ),
          ...sedes.map(s => [
            s.nombre || '—', s.tipo || '—', s.direccion || '—',
            s.ciudad || '—', { text: String(s.empleados ?? 0), style: 'valorTabla' },
          ]),
        ],
      },
      layout: this.layoutTabla(),
      margin: [0, 0, 0, 14],
    };
  }

  private reparto(
    reparto: ModelsInforme.Reparto,
    imagenes: WeakMap<ModelsInforme.Reparto, string>
  ): any[] {
    if (!reparto.filas.length) return [];

    const bloques: any[] = [
      { text: reparto.titulo, style: 'subtitulo', margin: [0, 6, 0, 4] },
    ];

    if (reparto.texto) {
      bloques.push({ text: reparto.texto, style: 'parrafo', margin: [0, 0, 0, 8] });
    }

    const imagen = imagenes.get(reparto);
    if (imagen) {
      bloques.push({ image: imagen, width: 460, alignment: 'center', margin: [0, 0, 0, 10] });
    } else {
      bloques.push(this.tablaReparto(reparto));
      if (reparto.emparejado) bloques.push(this.tablaReparto(reparto.emparejado));
    }

    return bloques;
  }

  private tablaReparto(reparto: ModelsInforme.Reparto): any {
    return {
      style: 'celda',
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: [
          [
            { text: reparto.titulo.toUpperCase(), style: 'cabeceraTabla' },
            {
              text: (reparto.unidad || 'Personas').toUpperCase(),
              style: 'cabeceraTabla', alignment: 'right',
            },
            { text: '%', style: 'cabeceraTabla', alignment: 'right' },
          ],
          ...reparto.filas.map(f => [
            f.etiqueta,
            { text: String(f.total), style: 'valorTabla' },
            // El porcentaje acompaña al recuento, no compite con él.
            { text: `${f.porcentaje}%`, alignment: 'right', color: '#667085' },
          ]),
        ],
      },
      layout: this.layoutTabla(),
      margin: [0, 0, 0, 12],
    };
  }

  private tabla(tabla: ModelsInforme.Tabla): any[] {
    if (!tabla.filas.length) return [];

    return [
      { text: tabla.titulo, style: 'subtitulo', margin: [0, 6, 0, 4] },
      {
        style: 'celda',
        table: {
          headerRows: 1,
          widths: tabla.columnas.map(() => '*'),
          body: [
            tabla.columnas.map(c => ({ text: c.toUpperCase(), style: 'cabeceraTabla' })),
            ...tabla.filas.map(fila => fila.celdas.map(celda => celda || '—')),
          ],
        },
        layout: this.layoutTabla(),
        margin: [0, 0, 0, 12],
      },
    ];
  }

  private recomendaciones(texto: string): any {
    return {
      table: {
        widths: ['*'],
        body: [[{
          stack: [
            { text: 'RECOMENDACIONES', fontSize: 9, bold: true, color: '#92400e', margin: [0, 0, 0, 6] },
            { text: texto, fontSize: 10, lineHeight: 1.35 },
          ],
          fillColor: '#fffbeb',
          margin: [10, 10, 10, 10],
        }]],
      },
      layout: 'noBorders',
      margin: [0, 8, 0, 0],
    };
  }
}
