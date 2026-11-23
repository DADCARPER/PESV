import { inject, Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ModelsInforme } from '../../interfaces/informe.interface';
import { InformeGraficasService } from './informe-graficas.service';
import { recortarImagen } from '../../data/imagenes';
import { MARCA, PAR_CONTRASTE } from '../../data/colores-informe';
import { InformeImagenesService } from './informe-imagenes.service';

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
  private _imagenes = inject(InformeImagenesService);

  private static readonly NARANJA = '#f46c2d';
  // El azul pasa a ser el de la marca. Era #202e48, que a ojo es el mismo,
  // pero tener dos casi iguales solo invita a que uno se quede atrás cuando
  // el otro cambie.
  private static readonly AZUL = MARCA.azul;
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
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: InformePdfService.ANCHO,
          y2: 0,
          lineWidth: 0.5,
          lineColor: InformePdfService.GRIS,
        },
      ],
      margin: margen,
    };
  }

  /** Arma el documento y lo descarga. */
  async descargar(informe: ModelsInforme.Datos & { version?: number }): Promise<void> {
    // Lo desmarcado no se maqueta, ni se grafica, ni se le buscan fotos.
    informe = {
      ...informe,
      secciones: informe.secciones.filter((s) => s.incluir !== false),
    };

    const [imagenes, fotos, repartir, portada] = await Promise.all([
      this._graficas.imagenes(informe.secciones),
      this.fotosDeSedes(informe.secciones),
      this._imagenes.repartidor(),
      this._imagenes.portada(),
    ]);

    // Primera pasada: se maqueta para saber dónde acaba cada sección y cuánto
    // sobra en su última página. El documento que sale se descarta; lo que
    // interesaba eran las medidas.
    const huecos = await this.medirHuecos(
      this.documento(informe, imagenes, fotos, new Map(), portada),
    );

    // Segunda pasada: la de verdad, ya con las imágenes en los huecos.
    //
    // Las medidas de la primera siguen valiendo porque cada sección termina en
    // un salto de página forzado: el hueco está siempre al pie de la hoja, de
    // modo que una imagen que cabe en él no empuja nada, solo ocupa un sitio
    // que estaba vacío.
    const rellenos = new Map<string, any>();
    for (const [seccion, hueco] of huecos) {
      const imagen = repartir(hueco);
      if (imagen) rellenos.set(seccion, this._imagenes.bloque(imagen, hueco));
    }

    const documento = this.documento(informe, imagenes, fotos, rellenos, portada);

    const nombre =
      `Informe-diagnostico-PESV-${informe.periodo}` +
      (informe.version ? `-v${informe.version}` : '') +
      '.pdf';

    pdfMake.createPdf(documento as any).download(nombre);
  }

  /**
   * El bloque invisible que cierra cada sección y provoca el salto.
   *
   * Es lo que permite medir. pdfMake no dice cuánto espacio sobra en una
   * página, pero sí en qué posición coloca cada bloque: si el último de la
   * sección no ocupa nada, su posición *es* el punto donde terminó el
   * contenido, y lo que queda por debajo es el hueco.
   */
  private finDeSeccion(id: string): any {
    // Un trazo de alto cero: produce posición, que es lo que se lee, y cabe
    // siempre, incluso con la página llena hasta el último punto.
    //
    // Antes era un espacio a un punto de letra. Ese punto y pico de alto era
    // el problema: cuando el contenido acababa justo al pie, el marcador no
    // cabía y saltaba solo a una página nueva. El hueco medido era entonces la
    // página entera, el relleno pedía todo ese margen en una hoja que ya no
    // tenía sitio, y acababa en una página para él solo.
    return {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 0, lineWidth: 0 }],
      id: `fin-${id}`,
      pageBreak: 'after',
    };
  }

  /**
   * Maqueta el documento solo para anotar el hueco que deja cada sección.
   *
   * `pageBreakBefore` se ejecuta durante el reparto en páginas y recibe la
   * posición de cada bloque. Se usa aquí para leer, no para decidir: devuelve
   * siempre false y no altera ningún corte.
   *
   * El hueco sale de `verticalRatio`, que es la fracción de página ya
   * ocupada, y no de la posición absoluta: así no hay que suponer si esa
   * posición incluye el margen superior o no.
   */
  private async medirHuecos(documento: any): Promise<Map<string, number>> {
    const huecos = new Map<string, number>();

    const medido = {
      ...documento,
      pageBreakBefore: (nodo: any) => {
        const id: string = nodo?.id ?? '';
        const posicion = nodo?.startPosition;

        // Un marcador en lo alto de una hoja no cierra nada en ella: la
        // sección terminó al pie de la anterior. Rellenar ahí es pintar una
        // página entera para una imagen.
        if (id.startsWith('fin-') && posicion && posicion.verticalRatio > 0) {
          const sobra = posicion.pageInnerHeight * (1 - posicion.verticalRatio);
          huecos.set(id.slice(4), sobra);
        }

        return false;
      },
    };

    try {
      // `getBlob` devuelve una promesa; no admite callback. Pasarle uno lo
      // dejaba esperando para siempre, que es lo que colgaba la descarga sin
      // decir nada: la maquetación terminaba, pero nadie se enteraba.
      //
      // El plazo está por lo mismo. Esta pasada solo sirve para decorar, así
      // que si tarda de más se abandona: vale mil veces más un informe con
      // espacios en blanco que un botón que se queda girando.
      await this.conPlazo(
        pdfMake.createPdf(medido as any).getBlob(),
        InformePdfService.PLAZO_MEDICION,
      );
    } catch (error: unknown) {
      // Sin medidas no hay rellenos, y ya está: el informe sale como salía
      // antes, con sus espacios en blanco.
      console.error('[InformePdf] medición de huecos:', error);
      return new Map();
    }

    console.debug('[InformePdf] huecos medidos:', Object.fromEntries(huecos));
    return huecos;
  }

  private documento(
    informe: ModelsInforme.Datos & {
      version?: number;
      fechaEmision?: string;
      emitidoPor?: string;
    },
    imagenes: WeakMap<ModelsInforme.Reparto, string>,
    fotos: Map<ModelsInforme.FichaSede, string>,
    rellenos: Map<string, any> = new Map(),
    portada: string | null = null,
  ): any {
    const introduccion = informe.secciones.find((s) => s.id === 'introduccion');
    const resto = informe.secciones.filter((s) => s !== introduccion);

    return {
      // El fondo se dibuja debajo de todo y cubre la hoja entera, márgenes
      // incluidos: es lo que permite una portada a sangre con el título
      // encima. Solo en la primera, claro.
      background: (pagina: number, hoja: { width: number; height: number }) =>
        pagina === 1 && portada
          ? { image: portada, width: hoja.width, height: hoja.height }
          : null,

      pageSize: 'LETTER',
      // [izquierda, arriba, derecha, abajo]. El de arriba es mayor porque ahí
      // va la cabecera; el de abajo, lo justo para el pie y su filete.
      pageMargins: [50, 70, 50, 52],
      info: {
        title: `Informe de diagnóstico PESV ${informe.periodo}`,
        author: informe.nombreEmpresa,
      },

      // La portada va limpia: una cabecera sobre el título del documento
      // compite con él y no informa de nada que no esté ya debajo.
      header: (pagina: number) =>
        pagina === 1
          ? null
          : {
              margin: [50, 28, 50, 0],
              stack: [
                {
                  columns: [
                    { text: informe.nombreEmpresa, fontSize: 8, color: '#888' },
                    {
                      text: `Diagnóstico PESV ${informe.periodo}`,
                      fontSize: 8,
                      color: '#888',
                      alignment: 'right',
                    },
                  ],
                },
                this.filete([0, 5, 0, 0]),
              ],
            },

      // La portada va limpia también por abajo: un pie de página sobre el
      // diseño de la cubierta lo estropea, y no numera nada que haga falta
      // buscar. Por eso la cuenta empieza en la hoja siguiente, que pasa a
      // ser la uno, y el total descuenta la portada.
      footer: (pagina: number, total: number) =>
        pagina === 1
          ? null
          : {
              margin: [50, 12, 50, 0],
              stack: [
                this.filete([0, 0, 0, 5]),
                {
                  columns: [
                    {
                      text: 'Resolución 40595 de 2022 · Plan Estratégico de Seguridad Vial',
                      fontSize: 7,
                      color: '#aaa',
                    },
                    {
                      text: `${pagina - 1} de ${Math.max(1, total - 1)}`,
                      fontSize: 7,
                      color: '#aaa',
                      alignment: 'right',
                    },
                  ],
                },
              ],
            },

      // La introducción abre el documento, antes incluso de la metodología:
      // sitúa al lector en el problema antes de darle la primera cifra.
      content: [
        ...this.portada(informe),
        ...(introduccion
          ? this.seccion(introduccion, imagenes, fotos, rellenos)
          : []),
        ...this.metodologia(informe, rellenos),
        ...resto.flatMap((s) => this.seccion(s, imagenes, fotos, rellenos)),
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
        cabeceraTabla: {
          fontSize: 9,
          bold: true,
          color: '#fff',
          characterSpacing: 0.4,
        },
        /** Un número se lee alineado a la derecha: las unidades quedan juntas. */
        valorTabla: { alignment: 'right', bold: true, color: '#1f2937' },
      },
      defaultStyle: { fontSize: 10 },
    };
  }

  private portada(
    informe: ModelsInforme.Datos & {
      fechaEmision?: string;
      emitidoPor?: string;
      version?: number;
    },
  ): any[] {
    const emitido = informe.fechaEmision
      ? new Date(informe.fechaEmision)
      : new Date();

    return [
      { text: '\n\n\n' },
      { text: 'INFORME DE DIAGNÓSTICO', style: 'titulo', alignment: 'center' },
      {
        text: 'Plan Estratégico de Seguridad Vial',
        fontSize: 13,
        color: InformePdfService.NARANJA,
        alignment: 'center',
        margin: [0, 6, 0, 0],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 140,
            y1: 0,
            x2: 372,
            y2: 0,
            lineWidth: 2,
            lineColor: InformePdfService.NARANJA,
          },
        ],
        margin: [0, 18, 0, 18],
      },
      {
        text: informe.nombreEmpresa,
        fontSize: 16,
        bold: true,
        alignment: 'center',
      },
      {
        text: `NIT ${informe.nitEmpresa}`,
        fontSize: 10,
        color: '#666',
        alignment: 'center',
        margin: [0, 4, 0, 0],
      },
      {
        text: `Periodo ${informe.periodo}`,
        fontSize: 12,
        color: InformePdfService.AZUL,
        alignment: 'center',
        margin: [0, 24, 0, 0],
      },
      {
        text:
          `Emitido el ${emitido.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}` +
          (informe.version ? `  ·  Versión ${informe.version}` : ''),
        style: 'nota',
        alignment: 'center',
        margin: [0, 8, 0, 0],
      },
      informe.emitidoPor
        ? {
            text: `Responde: ${informe.emitidoPor}`,
            style: 'nota',
            alignment: 'center',
            margin: [0, 2, 0, 0],
          }
        : {},
      this.finDeSeccion('portada'),
    ];
  }

  /**
   * La metodología va antes que cualquier cifra.
   *
   * Un diagnóstico por muestreo tiene que declarar su muestra: "200 de 2.000
   * empleados" es defendible, y "200 colaboradores" a secas parece un censo
   * mal hecho.
   */
  private metodologia(
    informe: ModelsInforme.Datos,
    rellenos: Map<string, any> = new Map(),
  ): any[] {
    const m = informe.metodologia;

    return [
      { text: 'Metodología', style: 'seccion', margin: [0, 0, 0, 10] },
      {
        style: 'celda',
        table: {
          widths: ['*', 180],
          headerRows: 1,
          body: [
            [
              { text: 'CONCEPTO', style: 'cabeceraTabla' },
              { text: 'VALOR', style: 'cabeceraTabla', alignment: 'right' },
            ],
            [
              'Personas vinculadas a la organización',
              { text: String(m.poblacion), style: 'valorTabla' },
            ],
            [
              'Respuestas obtenidas en la encuesta',
              { text: String(m.muestra), style: 'valorTabla' },
            ],
            [
              'Cobertura de la muestra',
              { text: `${m.cobertura}%`, style: 'valorTabla' },
            ],
            ['Instrumento aplicado', { text: m.encuesta, style: 'valorTabla' }],
          ],
        },
        layout: this.layoutTabla(),
        margin: [0, 0, 0, 14],
      },
      this.nota(
        'Las cifras de este informe corresponden al estado del diagnóstico en la fecha ' +
          'de emisión. El diagnóstico continúa abierto: las variaciones posteriores se ' +
          'recogen en una nueva versión del informe.',
      ),
      ...this.cierre('metodologia', rellenos),
    ];
  }

  private seccion(
    seccion: ModelsInforme.Seccion,
    imagenes: WeakMap<ModelsInforme.Reparto, string>,
    fotos: Map<ModelsInforme.FichaSede, string>,
    rellenos: Map<string, any>,
  ): any[] {
    const bloques: any[] = [
      {
        text: seccion.titulo.toUpperCase(),
        style: 'seccion',
        margin: [0, 0, 0, 4],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: InformePdfService.ANCHO,
            y2: 0,
            lineWidth: 1.5,
            lineColor: InformePdfService.NARANJA,
          },
        ],
        margin: [0, 0, 0, 10],
      },
    ];

    if (seccion.sinDatos) {
      bloques.push({
        text: 'No se registraron datos para esta sección en el periodo.',
        style: 'nota',
        margin: [0, 0, 0, 12],
      });
      return [...bloques, ...this.cierre(seccion.id, rellenos)];
    }

    if (seccion.identificacion?.length) {
      bloques.push(this.tablaIdentificacion(seccion.identificacion));
    }

    if (seccion.texto) {
      bloques.push({
        text: seccion.texto,
        style: 'parrafo',
        margin: [0, 0, 0, 12],
      });
    }

    if (seccion.destacados?.length) {
      bloques.push(this.tablaDestacados(seccion.destacados));
    }

    if (seccion.cifras.length) {
      bloques.push(...this.tablaCifras(seccion.cifras));
    }

    if (seccion.sedes?.length) {
      bloques.push(...this.tarjetasSedes(seccion.sedes, fotos));
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
    return [...bloques, ...this.cierre(seccion.id, rellenos)];
  }

  /** El relleno, si lo hay, y la marca que cierra la sección. */
  private cierre(id: string, rellenos: Map<string, any>): any[] {
    const relleno = rellenos.get(id);
    return relleno ? [relleno, this.finDeSeccion(id)] : [this.finDeSeccion(id)];
  }

  private tablaIdentificacion(
    datos: NonNullable<ModelsInforme.Seccion['identificacion']>,
  ): any {
    return {
      style: 'celda',
      table: {
        widths: ['auto', '*'],
        body: datos.map((d) => [
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
          // Se alternan los dos colores, como las barras. Todas del mismo
          // naranja, las cifras de hombres y mujeres parecian dos partes de un
          // mismo dato en vez de dos mitades que se comparan.
          destacados.map((d, i) => ({
            text: [
              {
                text: `${d.valor}\n`,
                fontSize: 20,
                bold: true,
                color: PAR_CONTRASTE[i % PAR_CONTRASTE.length],
              },
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

  /**
   * Cuantas tarjetas de cifras caben en una fila.
   *
   * Dos y no tres. Con el numero al lado del texto cada tarjeta necesita
   * ancho, y a tres por fila una etiqueta como "Con revision tecnica vigente"
   * se parte en tres lineas y la cifra deja de leerse de un vistazo.
   */
  private static readonly CIFRAS_POR_FILA = 2;

  /** El aire entre tarjetas, en puntos. */
  private static readonly AIRE = 10;

  /**
   * Las tarjetas de cifras, en filas separadas por aire.
   *
   * pdfMake no tiene noción de hueco entre celdas: lo unico que hay es
   * intercalar columnas vacias y estrechas entre las que llevan contenido.
   * Por eso la fila se arma alternando tarjeta y separador en vez de mapear
   * el grupo directamente.
   *
   * Cada fila es su propia tabla, y no una tabla con filas separadoras,
   * porque asi el hueco vertical es el margen de la tabla y no una fila
   * fantasma que hay que dimensionar a ojo.
   */
  private tablaCifras(cifras: ModelsInforme.Cifra[]): any[] {
    const porFila = InformePdfService.CIFRAS_POR_FILA;
    const aire = InformePdfService.AIRE;
    const bloques: any[] = [];

    for (let i = 0; i < cifras.length; i += porFila) {
      const grupo = cifras.slice(i, i + porFila);
      const celdas: any[] = [];
      const anchos: any[] = [];

      for (let j = 0; j < porFila; j++) {
        if (j > 0) {
          celdas.push({ text: '' });
          anchos.push(aire);
        }
        // La ultima fila puede venir corta: pdfMake exige que todas las filas
        // declaren las mismas celdas, y una vacia ocupa el hueco sin pintarse.
        celdas.push(grupo[j] ? this.tarjetaCifra(grupo[j]) : { text: '' });
        anchos.push('*');
      }

      const ultima = i + porFila >= cifras.length;

      bloques.push({
        table: { widths: anchos, body: [celdas] },
        layout: 'noBorders',
        margin: [0, 0, 0, ultima ? 14 : aire],
      });
    }

    return bloques;
  }

  /**
   * Una tarjeta: el numero a la izquierda y lo que significa a la derecha.
   *
   * pdfMake alinea las columnas por arriba y no sabe centrar en vertical, asi
   * que el equilibrio se apana con un desplazamiento calculado sobre cuantas
   * lineas tiene cada lado: el numero ocupa una linea de 15 puntos y el texto
   * una o dos de ocho y siete. Con una nota larga que se parta en dos lineas
   * el centrado se desajusta un poco, y no hay forma de saberlo de antemano.
   */
  private tarjetaCifra(cifra: ModelsInforme.Cifra): any {
    const conNota = !!cifra.nota;

    return {
      columns: [
        {
          width: 'auto',
          text: String(cifra.valor),
          fontSize: 15,
          bold: true,
          color: cifra.alerta ? '#b91c1c' : InformePdfService.AZUL,
          margin: [0, conNota ? 3 : 0, 8, 0],
        },
        {
          width: '*',
          margin: [0, conNota ? 0 : 4, 0, 0],
          stack: [
            { text: cifra.etiqueta, fontSize: 8, color: '#555' },
            cifra.nota
              ? { text: cifra.nota, fontSize: 7, color: '#888', margin: [0, 1, 0, 0] }
              : {},
          ],
        },
      ],
      fillColor: cifra.alerta ? '#fef2f2' : '#f9fafb',
      margin: [8, 7, 8, 7],
    };
  }

  /**
   * Las sedes, una tarjeta cada una y con su fotografia.
   *
   * Estaban en una tabla, que desaprovecha lo mejor que tiene esta seccion:
   * si alguien se tomo el trabajo de subir la foto de cada sede, un informe
   * que las reduce a una fila de texto le esta tirando ese trabajo. Ademas,
   * una foto dice de un vistazo si la sede es una oficina o un patio de
   * maniobras, que es informacion de riesgo vial y no decoracion.
   */
  private tarjetasSedes(
    sedes: ModelsInforme.FichaSede[],
    fotos: Map<ModelsInforme.FichaSede, string>,
  ): any[] {
    const aire = InformePdfService.AIRE;
    const bloques: any[] = [];

    // De dos en dos, como las cifras: con la foto al lado del texto, una
    // tarjeta por fila desperdicia media pagina y tres no dejan sitio a nada.
    for (let i = 0; i < sedes.length; i += 2) {
      const grupo = sedes.slice(i, i + 2);
      const ultima = i + 2 >= sedes.length;

      bloques.push({
        table: {
          widths: ['*', aire, '*'],
          body: [[
            this.tarjetaSede(grupo[0], fotos),
            { text: '' },
            grupo[1] ? this.tarjetaSede(grupo[1], fotos) : { text: '' },
          ]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, ultima ? 14 : aire],
      });
    }

    return bloques;
  }

  private tarjetaSede(
    sede: ModelsInforme.FichaSede,
    fotos: Map<ModelsInforme.FichaSede, string>,
  ): any {
    const foto = fotos.get(sede);

    const contacto = [sede.responsable, sede.telefono].filter(Boolean).join(' · ');
    const lugar = [sede.ciudad, sede.departamento].filter(Boolean).join(', ');

    return {
      // El hueco entre la foto y el texto va aquí y no como margen de la
      // columna: pdfMake no aplica el margen de una columna que lleva imagen,
      // y el texto acababa pegado al borde derecho de la foto.
      columnGap: 10,
      columns: [
        foto
          ? {
              width: 96,
              // Ya viene recortada a tres por dos, así que el recuadro le
              // queda exacto y todas las tarjetas salen a la misma altura.
              image: foto,
              fit: [96, 64],
            }
          : {
              width: 96,
              text: 'Sin fotografía',
              fontSize: 7,
              color: '#98a2b3',
              alignment: 'center',
              margin: [0, 26, 0, 26],
            },
        {
          width: '*',
          stack: [
            { text: sede.nombre || 'Sin nombre', fontSize: 10, bold: true, color: InformePdfService.AZUL },
            sede.tipo ? { text: sede.tipo, fontSize: 7, color: '#98a2b3', margin: [0, 1, 0, 0] } : {},
            sede.direccion ? { text: sede.direccion, fontSize: 8, color: '#555', margin: [0, 4, 0, 0] } : {},
            lugar ? { text: lugar, fontSize: 8, color: '#555' } : {},
            contacto ? { text: contacto, fontSize: 7, color: '#888', margin: [0, 3, 0, 0] } : {},
            {
              text: `${sede.empleados ?? 0} empleados`,
              fontSize: 8, bold: true, color: '#1f2937', margin: [0, 3, 0, 0],
            },
          ],
        },
      ],
      fillColor: '#f9fafb',
      margin: [8, 8, 8, 8],
    };
  }

  /**
   * Descarga las fotografias de las sedes y las deja listas para incrustar.
   *
   * pdfMake solo acepta imagenes embebidas: una URL no le sirve, aunque el
   * navegador la pinte sin problema en un `img`. Y como el original viene de
   * una camara de telefono y puede pesar varios megas, se reescala antes: sin
   * eso, cuatro sedes convierten el informe en un archivo que no se puede
   * enviar por correo.
   *
   * Si una foto no se puede traer, la tarjeta sale sin ella. Es lo unico
   * sensato: nadie quiere que el informe entero falle por una imagen.
   */
  private async fotosDeSedes(
    secciones: ModelsInforme.Seccion[],
  ): Promise<Map<ModelsInforme.FichaSede, string>> {
    const sedes = secciones.flatMap((s) => s.sedes ?? []);
    const fotos = new Map<ModelsInforme.FichaSede, string>();

    for (const sede of sedes) {
      if (!sede.fotoMiniatura && !sede.fotoUrl) continue;

      try {
        // La miniatura viaja con el registro y no hay que ir a buscarla. Solo
        // se descarga de Storage cuando no la hay, que es el caso de las
        // sedes cargadas antes de que la miniatura existiera.
        const origen =
          sede.fotoMiniatura || (await this.comoImagenEmbebida(sede.fotoUrl!));

        // Se recorta aquí y no al subirla, para que cambiar la proporción del
        // informe no obligue a volver a cargar todas las fotografías.
        fotos.set(sede, await recortarImagen(origen));
      } catch (error: unknown) {
        // Una foto que falla deja su tarjeta sin imagen y nada más: nadie
        // quiere perder el informe entero por una fotografía.
        console.error('[InformePdf] foto de sede:', sede.nombre, error);
      }
    }

    return fotos;
  }

  /** Lo que se espera a la pasada de medición antes de darla por perdida. */
  private static readonly PLAZO_MEDICION = 25_000;

  /** Una promesa con fecha límite. */
  private conPlazo<T>(promesa: Promise<T>, milisegundos: number): Promise<T> {
    return Promise.race([
      promesa,
      new Promise<T>((_, rechazar) =>
        setTimeout(
          () => rechazar(new Error('La medición de huecos tardó demasiado.')),
          milisegundos,
        ),
      ),
    ]);
  }

  /**
   * Ancho al que se reescala una fotografía traída de Storage.
   *
   * Solo se usa con las sedes cargadas antes de que existiera la miniatura.
   * Va al mismo tamaño que ella para que esas no se vean peor que las demás.
   */
  private static readonly ANCHO_FOTO = 460;

  private async comoImagenEmbebida(url: string): Promise<string> {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const blob = await respuesta.blob();
    const local = URL.createObjectURL(blob);

    try {
      const imagen = await this.cargarImagen(local);

      const escala = Math.min(1, InformePdfService.ANCHO_FOTO / imagen.width);
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(imagen.width * escala);
      lienzo.height = Math.round(imagen.height * escala);

      const pincel = lienzo.getContext('2d');
      if (!pincel) throw new Error('El navegador no dio contexto de dibujo.');
      pincel.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

      // JPEG y no PNG: una fotografia en PNG pesa varias veces mas y aqui no
      // hay transparencia que conservar.
      return lienzo.toDataURL('image/jpeg', 0.75);
    } finally {
      URL.revokeObjectURL(local);
    }
  }

  private cargarImagen(src: string): Promise<HTMLImageElement> {
    return new Promise((resolver, rechazar) => {
      const imagen = new Image();
      imagen.onload = () => resolver(imagen);
      imagen.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
      imagen.src = src;
    });
  }

  private reparto(
    reparto: ModelsInforme.Reparto,
    imagenes: WeakMap<ModelsInforme.Reparto, string>,
  ): any[] {
    if (!reparto.filas.length) return [];

    const bloques: any[] = [
      { text: reparto.titulo, style: 'subtitulo', margin: [0, 6, 0, 4] },
    ];

    if (reparto.texto) {
      bloques.push({
        text: reparto.texto,
        style: 'parrafo',
        margin: [0, 0, 0, 8],
      });
    }

    const imagen = imagenes.get(reparto);
    if (imagen) {
      bloques.push({
        image: imagen,
        width: 460,
        alignment: 'center',
        margin: [0, 0, 0, 10],
      });
    } else {
      bloques.push(this.tablaReparto(reparto));
      if (reparto.emparejado)
        bloques.push(this.tablaReparto(reparto.emparejado));
    }

    const filas = reparto.filas.length + (reparto.emparejado?.filas.length ?? 0);
    return this.juntos(bloques, imagen ? 0 : filas);
  }

  /** Hasta cuántas filas una tabla se mantiene entera con su título. */
  private static readonly FILAS_SIN_CORTE = 12;

  /**
   * Mantiene en la misma página un título, su texto y lo que presentan.
   *
   * Sin esto, pdfMake corta donde caiga: el título y la cabecera de una tabla
   * se quedaban al pie de una hoja y las filas en la siguiente, con la
   * cabecera repetida. Una tabla larga sí se deja partir, porque entera no
   * cabría; esas al menos no dejan la cabecera sola (`keepWithHeaderRows`).
   */
  private juntos(bloques: any[], filas: number): any[] {
    return filas <= InformePdfService.FILAS_SIN_CORTE
      ? [{ stack: bloques, unbreakable: true }]
      : bloques;
  }

  private tablaReparto(reparto: ModelsInforme.Reparto): any {
    return {
      style: 'celda',
      table: {
        headerRows: 1,
        // La cabecera nunca se queda sola al pie: baja con su primera fila.
        keepWithHeaderRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: [
          [
            { text: reparto.titulo.toUpperCase(), style: 'cabeceraTabla' },
            {
              text: (reparto.unidad || 'Personas').toUpperCase(),
              style: 'cabeceraTabla',
              alignment: 'right',
            },
            { text: '%', style: 'cabeceraTabla', alignment: 'right' },
          ],
          ...reparto.filas.map((f) => [
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

    return this.juntos([
      { text: tabla.titulo, style: 'subtitulo', margin: [0, 6, 0, 4] },
      {
        style: 'celda',
        table: {
          headerRows: 1,
          keepWithHeaderRows: 1,
          widths: tabla.columnas.map(() => '*'),
          body: [
            tabla.columnas.map((c) => ({
              text: c.toUpperCase(),
              style: 'cabeceraTabla',
            })),
            ...tabla.filas.map((fila) =>
              fila.celdas.map((celda) => celda || '—'),
            ),
          ],
        },
        layout: this.layoutTabla(),
        margin: [0, 0, 0, 12],
      },
    ], tabla.filas.length);
  }

  private recomendaciones(texto: string): any {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                {
                  text: 'RECOMENDACIONES',
                  fontSize: 9,
                  bold: true,
                  color: '#92400e',
                  margin: [0, 0, 0, 6],
                },
                { text: texto, fontSize: 10, lineHeight: 1.35 },
              ],
              fillColor: '#fffbeb',
              margin: [10, 10, 10, 10],
            },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 8, 0, 0],
    };
  }
}
