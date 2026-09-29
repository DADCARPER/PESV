/**
 * Las imágenes que rellenan el espacio sobrante al pie de cada sección.
 *
 * El informe arranca cada sección en su propia página, que es lo que permite
 * hojearlo por partes. El precio es que la última página de una sección corta
 * queda medio vacía. Estas imágenes cubren ese hueco.
 *
 * Son decorativas. No documentan nada y no se citan en ningún sitio: si
 * desaparecieran, el informe diría exactamente lo mismo.
 */

/** De dónde salen. Van en `assets` y no en Storage, así que se sirven desde
 *  el mismo dominio y no hay permiso de lectura que negociar. */
export const CARPETA_RELLENOS = 'assets/diagnosticoInformes/';

/**
 * Qué imágenes hay disponibles.
 *
 * Solo el nombre: el alto se mide de la imagen misma cuando se carga, no se
 * deduce del nombre. Un nombre puede mentir —se reexporta la imagen con otra
 * altura y nadie renombra el archivo— y entonces el hueco se calcula con un
 * número que no existe. Los píxeles reales no mienten.
 *
 * Para añadir una imagen: dejarla en la carpeta y añadir aquí su nombre.
 */
export const RELLENOS: string[] = [
  // Banda fina
  'relleno_612x102_v1.jpg',
  'relleno_612x102_v2.jpg',
  // Hueco pequeño
  'relleno_612x153_v1.jpg',
  'relleno_612x153_v2.jpg',
  // Hueco medio
  'relleno_612x204_v1.jpg',
  'relleno_612x204_v2.jpg',
  // Un tercio de página
  'relleno_612x306_v1.jpg',
  'relleno_612x306_v2.jpg',
  // Media página
  'relleno_612x408_v1.jpg',
  'relleno_612x408_v2.jpg',
];

/**
 * La imagen que va de fondo en la portada.
 *
 * Cubre la hoja entera, márgenes incluidos, y el título va encima. Si no
 * existe, la portada sale en blanco como hasta ahora.
 */
export const PORTADA = 'portada.jpg';

/**
 * A qué tamaño se recorta la portada, en píxeles.
 *
 * Es la proporción exacta de la hoja carta, 8,5 por 11 pulgadas, a unos 200
 * puntos por pulgada. Se recorta en vez de estirarse: una portada deformada
 * se nota desde el otro lado de la sala.
 */
export const TAMANO_PORTADA = { ancho: 1700, alto: 2200 };

/**
 * Por debajo de este hueco no se rellena nada.
 *
 * Es solo un suelo de seguridad, por si algún día se añade una imagen muy
 * baja: una tira aplastada al pie no parece un diseño, parece que algo salió
 * mal al maquetar.
 *
 * **Tiene que quedar por debajo de la imagen más baja del catálogo.** Estuvo
 * en 130 con la más baja en 102, y el resultado es que ninguna página con un
 * hueco de entre 118 y 146 puntos se rellenaba: cabía de sobra, pero el
 * umbral la descartaba antes de mirar. Quien decide de verdad es la prueba de
 * si la imagen cabe, no este número.
 */
export const HUECO_MINIMO = 100;

/** Lo que se deja respirar entre el final del texto y la imagen. */
export const AIRE_RELLENO = 16;
