/**
 * Reducción de imágenes antes de guardarlas.
 *
 * Una fotografía de teléfono pesa entre tres y ocho megas y tiene cuatro mil
 * píxeles de ancho. En pantalla se muestra en un recuadro de 112 por 80, y en
 * el informe en uno de 92 por 66: subirla entera es pagar almacenamiento y
 * tiempo de subida —en datos móviles, desde una sede— por píxeles que nadie
 * va a ver nunca.
 */

/** Ancho al que se guarda la fotografía que se ve en pantalla. */
export const ANCHO_FOTO = 1600;

/**
 * Ancho de la miniatura que viaja dentro del documento.
 *
 * El informe la pinta a 92 puntos, que en pantalla son unos 123 píxeles. El
 * doble basta para que no se vea pixelada ni impresa, y a ese tamaño la
 * imagen cabe en el propio registro en vez de tener que ir a buscarla.
 */
export const ANCHO_MINIATURA = 240;

/** Compromiso entre peso y artefactos de compresión, para fotografías. */
const CALIDAD = 0.82;
const CALIDAD_MINIATURA = 0.62;

/**
 * Reduce una imagen y la devuelve lista para subir.
 *
 * Se reescala solo hacia abajo: una imagen que ya es más estrecha que el
 * límite se deja como está, porque ampliarla no añade detalle y sí peso.
 */
export async function comprimirImagen(
  archivo: File | Blob,
  anchoMaximo = ANCHO_FOTO,
  calidad = CALIDAD,
): Promise<Blob> {
  const lienzo = await dibujarReducida(archivo, anchoMaximo);

  return await new Promise<Blob>((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) =>
        blob
          ? resolver(blob)
          : rechazar(new Error('No se pudo comprimir la imagen.')),
      // JPEG y no PNG: una fotografía en PNG pesa varias veces más y aquí no
      // hay transparencia que conservar.
      'image/jpeg',
      calidad,
    );
  });
}

/**
 * La misma reducción, pero devuelta como texto para guardar en el documento.
 *
 * Es lo que permite que el informe muestre la fotografía sin ir a buscarla a
 * ningún sitio: viaja con el registro. También es lo que hace que un informe
 * archivado siga enseñando la foto que tenía el día que se emitió, aunque
 * después se cambie o se borre.
 */
export async function comprimirComoTexto(
  archivo: File | Blob,
  anchoMaximo = ANCHO_MINIATURA,
  calidad = CALIDAD_MINIATURA,
): Promise<string> {
  const lienzo = await dibujarReducida(archivo, anchoMaximo);
  return lienzo.toDataURL('image/jpeg', calidad);
}

async function dibujarReducida(
  archivo: File | Blob,
  anchoMaximo: number,
): Promise<HTMLCanvasElement> {
  const local = URL.createObjectURL(archivo);

  try {
    const imagen = await cargar(local);

    const escala = Math.min(1, anchoMaximo / imagen.width);
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);

    const pincel = lienzo.getContext('2d');
    if (!pincel) throw new Error('El navegador no dio contexto de dibujo.');

    pincel.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    return lienzo;
  } finally {
    URL.revokeObjectURL(local);
  }
}

function cargar(src: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
    imagen.src = src;
  });
}
