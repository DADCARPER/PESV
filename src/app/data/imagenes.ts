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
 * Tiene que dar de comer al recorte del informe sin que este tenga que
 * ampliar nada: ampliar una imagen no añade detalle, solo lo inventa. De ahí
 * que sea algo mayor que el recuadro final.
 *
 * Estuvo en 240 y se veía mal. A ese tamaño, una foto que se imprime a 96
 * puntos sale a 144 puntos por pulgada, que es la mitad de lo que necesita el
 * papel.
 */
export const ANCHO_MINIATURA = 460;

/**
 * El recuadro en que el informe enseña cada sede, en píxeles.
 *
 * Tres por dos. El informe lo imprime a 96 por 64 puntos, así que 384 de
 * ancho dan unos 288 puntos por pulgada: suficiente para papel, donde por
 * debajo de 200 la fotografía se ve blanda.
 *
 * Todas las fotografías pasan por aquí, venga la original apaisada, vertical
 * o cuadrada: lo que importa es que las tarjetas queden a la misma altura.
 */
export const RECUADRO_INFORME = { ancho: 384, alto: 256 };

/**
 * Compromiso entre peso y artefactos de compresión, para fotografías.
 *
 * La miniatura y el recorte se aplican uno detrás de otro, y cada paso vuelve
 * a comprimir lo que ya venía comprimido. Con los dos al 62% el resultado era
 * un cuadriculado visible: en una cadena de dos pasos, la calidad de cada uno
 * no se suma, se multiplica.
 */
const CALIDAD = 0.82;
const CALIDAD_MINIATURA = 0.78;
const CALIDAD_RECORTE = 0.85;

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

/**
 * Recorta una imagen para que llene un recuadro fijo.
 *
 * Encajarla entera dentro del recuadro —lo que hace `fit` en pdfMake— deja
 * cada tarjeta con un alto distinto según la foto sea apaisada o vertical, y
 * la fila entera se descuadra. Aquí se escala hasta cubrir el recuadro y se
 * recorta lo que sobra, centrado: se pierde algo de los bordes, pero todas
 * las sedes se ven igual y ninguna sale deformada.
 */
export async function recortarImagen(
  origen: string,
  ancho = RECUADRO_INFORME.ancho,
  alto = RECUADRO_INFORME.alto,
  calidad = CALIDAD_RECORTE,
): Promise<string> {
  const imagen = await cargar(origen);

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;

  const pincel = lienzo.getContext('2d');
  if (!pincel) throw new Error('El navegador no dio contexto de dibujo.');

  // El mayor de los dos factores es el que garantiza que no quede hueco.
  const escala = Math.max(ancho / imagen.width, alto / imagen.height);
  const anchoFinal = imagen.width * escala;
  const altoFinal = imagen.height * escala;

  pincel.drawImage(
    imagen,
    (ancho - anchoFinal) / 2,
    (alto - altoFinal) / 2,
    anchoFinal,
    altoFinal,
  );

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
