/**
 * Los colores del informe de diagnóstico.
 *
 * Viven aquí y no repartidos entre el servicio del PDF y el de las gráficas
 * para que el documento y sus figuras no puedan desafinar entre sí: dos
 * naranjas casi iguales en la misma página no se leen como un matiz, se leen
 * como un error de imprenta.
 */
export const MARCA = {
  naranja: '#f25110',
  ambar: '#eea129',
  azul: '#212e47',
};

/**
 * Los dos colores con que se pintan las barras y las cifras destacadas.
 *
 * Se alternan: una barra de cada color. Con un solo color, seis columnas
 * iguales se leen como un bloque; alternando, el ojo separa cada una sin que
 * el color llegue a significar nada, que es lo correcto —aquí la categoría ya
 * la dice la etiqueta, y un color por categoría sería ruido—.
 *
 * Son los dos de la marca, sin apagar. El naranja se probó oscurecido, que
 * aguanta algo mejor la impresión, pero al lado del azul perdía la fuerza que
 * le da sentido a estar ahí.
 */
export const PAR_CONTRASTE = [MARCA.naranja, MARCA.azul];

/**
 * La paleta de las gráficas.
 *
 * Son tres colores de marca y no dan para un anillo de ocho porciones, así
 * que se extiende con versiones más claras y más oscuras de los mismos. Todo
 * sigue siendo la marca: se gana distinción sin meter un color de fuera, que
 * es lo que suele estropear estos documentos.
 *
 * El orden no es decorativo. Los primeros puestos alternan las tres familias
 * para que un reparto de dos o tres categorías salga con el máximo contraste
 * posible; las variaciones esperan más atrás, donde ya hace falta hilar fino.
 */
export const PALETA_GRAFICAS = [
  MARCA.naranja,  // #f25110
  MARCA.azul,     // #212e47
  MARCA.ambar,    // #eea129
  '#6f7787',      // azul aclarado
  '#a9390b',      // naranja oscurecido
  '#f4c274',      // ámbar aclarado
  '#f68e64',      // naranja aclarado
  '#9ba1ac',      // azul muy claro
  '#a7711d',      // ámbar oscurecido
  '#172032',      // azul muy oscuro
];
