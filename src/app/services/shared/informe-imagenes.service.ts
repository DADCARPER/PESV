import { Injectable } from '@angular/core';
import { recortarImagen } from '../../data/imagenes';
import {
  AIRE_RELLENO,
  CARPETA_RELLENOS,
  HUECO_MINIMO,
  PORTADA,
  RELLENOS,
  TAMANO_PORTADA,
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
 * Las imágenes decorativas del informe: la portada y los rellenos.
 *
 * Se cargan una sola vez y se quedan en memoria: son fijas, van dentro de la
 * propia aplicación y volver a pedirlas en cada descarga sería trabajo para
 * nada.
 */
@Injectable({ providedIn: 'root' })
export class InformeImagenesService {

  /** Ancho de la hoja carta. Las imágenes van de borde a borde, sin márgenes. */
  private static readonly ANCHO_HOJA = 612;

  private catalogo: Relleno[] | null = null;
  private fondoPortada: string | null | undefined;

  /**
   * La imagen que va de fondo en la portada, o null si no la hay.
   *
   * Se recorta a la proporción exacta de la hoja antes de usarla. Si la
   * original no la tiene, forzarla a ocupar la página entera la deformaría, y
   * una portada estirada se nota desde el otro lado de la sala.
   */
  async portada(): Promise<string | null> {
    if (this.fondoPortada !== undefined) return this.fondoPortada;

    try {
      const original = await this.comoTextoDesde(PORTADA);
      this.fondoPortada = await recortarImagen(
        original,
        TAMANO_PORTADA.ancho,
        TAMANO_PORTADA.alto,
        0.85,
      );
    } catch (error: unknown) {
      // Sin portada el informe sale con la de siempre, en blanco.
      console.warn('[InformeImagenes] no se pudo cargar la portada:', error);
      this.fondoPortada = null;
    }

    return this.fondoPortada;
  }

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
      // Lo que queda una vez descontado el aire que separa el texto de la
      // imagen. Quien decide es la prueba de si alguna cabe aquí debajo; el
      // mínimo es solo un suelo para no pegar una tira en un hueco ridículo.
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

  /**
   * Cuánto baja la imagen por debajo del área de texto.
   *
   * Una imagen que va de borde a borde y se corta dos centímetros antes del
   * final de la hoja no parece a sangre, parece mal medida. Con esto llega
   * hasta justo encima del filete del pie, y lo único que queda en blanco es
   * la banda de la paginación, que sí tiene que estar.
   */
  private static readonly SANGRADO = 12;

  /** Cómo se pinta una imagen de relleno, al pie de la página. */
  bloque(relleno: Relleno, hueco: number): any {
    return {
      image: relleno.datos,
      width: InformeImagenesService.ANCHO_HOJA,
      margin: [
        // Los laterales negativos la sacan del área de texto para que llegue
        // a los dos bordes de la hoja.
        -50,
        // El superior la empuja hasta abajo del todo: el hueco se nota al pie
        // de la página, y es ahí donde una imagen la cierra.
        Math.max(0, hueco - relleno.alto),
        -50,
        // El inferior la deja bajar por debajo del área de texto. Como el
        // alto que consume es menor que el hueco medido, sigue cabiendo.
        -InformeImagenesService.SANGRADO,
      ],
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
    const datos = await this.comoTextoDesde(nombre);
    const medida = await this.medir(datos);

    return {
      nombre,
      datos,
      // Lo que importa no son los píxeles sino la proporción: la imagen se
      // pinta siempre a lo ancho de la hoja, y el alto sale de ahí.
      alto: (medida.alto / medida.ancho) * InformeImagenesService.ANCHO_HOJA,
    };
  }

  /** Trae un archivo de la carpeta y lo devuelve listo para incrustar. */
  private async comoTextoDesde(nombre: string): Promise<string> {
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

    return await this.comoTexto(blob);
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
