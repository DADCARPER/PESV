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
 * Por debajo de este hueco no se rellena nada.
 *
 * Una tira aplastada al pie de la página no parece un diseño, parece que algo
 * salió mal al maquetar. Más vale el blanco.
 */
export const HUECO_MINIMO = 130;

/** Lo que se deja respirar entre el final del texto y la imagen. */
export const AIRE_RELLENO = 16;
