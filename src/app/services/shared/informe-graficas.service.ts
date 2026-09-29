import { Injectable } from '@angular/core';
import ApexCharts from 'apexcharts';
import { ModelsInforme } from '../../interfaces/informe.interface';
import { PALETA_GRAFICAS, PAR_CONTRASTE } from '../../data/colores-informe';

/**
 * Convierte los repartos del informe en imágenes para el PDF.
 *
 * pdfMake no sabe dibujar gráficas, y el informe las necesita: un reparto en
 * tabla se lee, pero un diagnóstico que se presenta a una autoridad entra por
 * los ojos antes que por los números.
 *
 * Se renderiza fuera de la pantalla en vez de fotografiar las que ya se ven en
 * la vista previa. Es más trabajo, pero es la única forma de que un informe
 * archivado se pueda volver a descargar: ese informe guarda cifras, no
 * gráficas, y no hay ninguna vista previa suya en pantalla de la que copiar.
 *
 * Las animaciones van apagadas. Con ellas, la imagen se captura a mitad del
 * crecimiento de las barras y salen a media altura.
 */
@Injectable({ providedIn: 'root' })
export class InformeGraficasService {

  /** Ancho de captura. Al doble del que ocupa en el PDF, para que no pixele. */
  private static readonly ANCHO = 900;

  private static readonly COLORES = PALETA_GRAFICAS;

  /**
   * Dibuja cada reparto que lleve gráfica y devuelve su imagen en base64.
   *
   * Se indexa por el objeto y no por el título: dos secciones pueden repetir
   * el título de una pregunta, y el PDF se armaría con la gráfica de la otra.
   */
  async imagenes(
    secciones: ModelsInforme.Seccion[]
  ): Promise<WeakMap<ModelsInforme.Reparto, string>> {
    const imagenes = new WeakMap<ModelsInforme.Reparto, string>();

    const conGrafica = secciones.flatMap(s => s.repartos).filter(
      r => r.grafica && r.grafica !== 'tabla' && r.filas.length
    );

    // En serie y no en paralelo: cada gráfica monta un nodo en el documento y
    // lanzarlas todas a la vez deja veinte contenedores vivos compitiendo por
    // el hilo de dibujo, que es justo lo que las hace salir a medias.
    for (const reparto of conGrafica) {
      try {
        imagenes.set(reparto, await this.imagenDe(reparto));
      } catch (error: unknown) {
        // Una gráfica que falla no puede impedir la descarga del informe: en
        // el PDF queda su tabla, que dice lo mismo con menos gracia.
        console.error('[InformeGraficas] reparto:', reparto.titulo, error);
      }
    }

    return imagenes;
  }

  private async imagenDe(reparto: ModelsInforme.Reparto): Promise<string> {
    const contenedor = document.createElement('div');
    contenedor.style.position = 'fixed';
    contenedor.style.left = '-10000px';
    contenedor.style.top = '0';
    contenedor.style.width = `${InformeGraficasService.ANCHO}px`;
    document.body.appendChild(contenedor);

    const grafica = new ApexCharts(contenedor, this.opciones(reparto));

    try {
      await grafica.render();
      const { imgURI } = await grafica.dataURI() as { imgURI: string };
      return imgURI;
    } finally {
      grafica.destroy();
      contenedor.remove();
    }
  }

  private opciones(reparto: ModelsInforme.Reparto): any {
    const etiquetas = reparto.filas.map(f => f.etiqueta);
    const valores = reparto.filas.map(f => f.total);

    const comun = {
      chart: {
        width: InformeGraficasService.ANCHO,
        animations: { enabled: false },
        toolbar: { show: false },
        fontFamily: 'Helvetica, Arial, sans-serif',
      },
      colors: InformeGraficasService.COLORES,
      dataLabels: { enabled: true },
      legend: { position: 'bottom', fontSize: '13px' },
    };

    if (reparto.grafica === 'dona' || reparto.grafica === 'tablaPastel') {
      return {
        ...comun,
        chart: { ...comun.chart, type: reparto.grafica === 'dona' ? 'donut' : 'pie', height: 420 },
        series: valores,
        labels: etiquetas,
      };
    }

    const horizontal = reparto.grafica === 'barras';

    return {
      ...comun,
      chart: {
        ...comun.chart,
        type: 'bar',
        // Las horizontales crecen con el número de categorías; las verticales
        // crecen a lo ancho y no lo necesitan.
        height: horizontal ? 160 + reparto.filas.length * 46 : 420,
      },
      // Los dos colores se alternan barra a barra. `distributed` es lo que
      // hace que el color se aplique por dato y no por serie: sin él, las seis
      // columnas saldrían del mismo color y se leerían como un bloque.
      colors: PAR_CONTRASTE,
      series: [{ name: reparto.unidad || 'Personas', data: valores }],
      xaxis: {
        categories: etiquetas,
        labels: { style: { fontSize: '12px' }, trim: false },
      },
      plotOptions: {
        bar: {
          horizontal,
          distributed: true,
          borderRadius: 3,
          dataLabels: { position: 'top' },
        },
      },
      legend: { show: false },
    };
  }
}
