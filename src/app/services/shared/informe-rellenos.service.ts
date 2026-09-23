import { Injectable } from '@angular/core';
import {
  AIRE_RELLENO,
  CARPETA_RELLENOS,
  HUECO_MINIMO,
  RELLENOS,
} from '../../data/rellenos-informe';

/** Una imagen de relleno, ya cargada y con su medida real. */
interface Relleno {
  nombre: string;
  /** La imagen embebida, lista para pdfMake. */
  datos: string;
  /** Alto en puntos cuando se pinta a lo ancho de la hoja. */
  alto: number;
}

/**
 * Elige la imagen que mejor llena el hueco al pie de cada sección.
 *
 * Las imágenes se cargan una sola vez y se quedan en memoria: son fijas,
 * pesan poco y se sirven desde la propia aplicación, así que volver a pedirlas
 * en cada descarga sería trabajo para nada.
 */
@Injectable({ providedIn: 'root' })
export class InformeRellenosService {

  /** Ancho de la hoja carta. Las imágenes van de borde a borde, sin márgenes. */
  private static readonly ANCHO_HOJA = 612;

  private catalogo: Relleno[] | null = null;

  /**
   * Devuelve un repartidor de imágenes para un documento concreto.
   *
   * Lleva cuenta de lo que ya ha usado, porque la misma imagen dos veces en
   * el mismo informe canta más que el hueco que venía a tapar. Cuando se
   * agotan las de un tamaño, vuelve a empezar: repetir es peor que el blanco,
   * pero solo hasta cierto punto.
   */
  async repartidor(): Promise<(hueco: number) => Relleno | null> {
    const catalogo = await this.cargar();
    const usadas = new Set<string>();

    return (hueco: number) => {
      const disponible = hueco - AIRE_RELLENO;
      if (disponible < HUECO_MINIMO) return null;

      // De las que caben, la más alta: llena mejor y deja menos blanco.
      const caben = catalogo
        .filter(r => r.alto <= disponible)
        .sort((a, b) => b.alto - a.alto);

      if (!caben.length) return null;

      const mayor = caben[0].alto;
      // Entre las de ese mismo tamaño se rota, que es lo que evita ver la
      // misma ilustración al pie de tres secciones seguidas.
      const delTamano = caben.filter(r => r.alto === mayor);

      const elegida = delTamano.find(r => !usadas.has(r.nombre)) ?? delTamano[0];
      usadas.add(elegida.nombre);

      return elegida;
    };
  }

  /** Cómo se pinta una imagen de relleno, pegada al pie del área de texto. */
  bloque(relleno: Relleno, hueco: number): any {
    return {
      image: relleno.datos,
      width: InformeRellenosService.ANCHO_HOJA,
      // El margen negativo saca la imagen del área de texto para que llegue a
      // los dos bordes de la hoja; el superior la empuja hasta abajo, que es
      // donde el hueco se nota y donde una imagen cierra la página.
      margin: [-50, Math.max(0, hueco - relleno.alto - AIRE_RELLENO), -50, 0],
    };
  }

  private async cargar(): Promise<Relleno[]> {
    if (this.catalogo) return this.catalogo;

    const cargadas: Relleno[] = [];

    for (const nombre of RELLENOS) {
      try {
        cargadas.push(await this.cargarUna(nombre));
      } catch (error: unknown) {
        // Una imagen que falta no puede impedir la descarga del informe: lo
        // único que pasa es que ese hueco se queda en blanco, que es
        // exactamente como estaba antes.
        console.warn('[InformeRellenos] no se pudo cargar:', nombre, error);
      }
    }

    if (!cargadas.length && RELLENOS.length) {
      console.warn(
        '[InformeRellenos] no se pudo cargar ninguna imagen de relleno. El informe '
        + `saldrá con sus espacios en blanco. Revisa que existan en ${CARPETA_RELLENOS}.`,
      );
    }

    this.catalogo = cargadas;
    return cargadas;
  }

  private async cargarUna(nombre: string): Promise<Relleno> {
    // Se resuelve contra la raíz de la aplicación y no contra la ruta en la
    // que esté el navegador. Una dirección relativa desde
    // /admin/planificar/diagnostico busca la imagen ahí dentro, y el servidor
    // de una aplicación de una sola página responde a eso con el index.html
    // en lugar de con un 404: la petición sale bien, el archivo no es una
    // imagen, y no hay forma de entender por qué falla.
    const direccion = new URL(`${CARPETA_RELLENOS}${nombre}`, document.baseURI).href;

    const respuesta = await fetch(direccion);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const blob = await respuesta.blob();
    if (!blob.type.startsWith('image/')) {
      throw new Error(`No es una imagen, sino ${blob.type || 'algo sin tipo'}.`);
    }
    const datos = await this.comoTexto(blob);
    const medida = await this.medir(datos);

    return {
      nombre,
      datos,
      // Lo que importa no son los píxeles sino la proporción: la imagen se
      // pinta siempre a lo ancho de la hoja, y el alto sale de ahí.
      alto: (medida.alto / medida.ancho) * InformeRellenosService.ANCHO_HOJA,
    };
  }

  private comoTexto(blob: Blob): Promise<string> {
    return new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onload = () => resolver(String(lector.result));
      lector.onerror = () => rechazar(lector.error);
      lector.readAsDataURL(blob);
    });
  }

  private medir(datos: string): Promise<{ ancho: number; alto: number }> {
    return new Promise((resolver, rechazar) => {
      const imagen = new Image();
      imagen.onload = () => resolver({ ancho: imagen.width, alto: imagen.height });
      imagen.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
      imagen.src = datos;
    });
  }
}
