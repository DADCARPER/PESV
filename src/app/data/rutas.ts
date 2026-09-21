/**
 * Cuántos viajes al mes supone cada frecuencia.
 *
 * `null` en las ocasionales: no tienen periodicidad, y estimarlas con un
 * número inventado ensuciaría el total de kilómetros con algo que nadie
 * declaró. Quedan fuera del cálculo y se dice que quedan fuera.
 *
 * Las diarias se cuentan sobre días hábiles, no sobre días naturales: son
 * rutas de trabajo.
 */
export const VIAJES_AL_MES: Record<string, number | null> = {
  'Diaria': 22,
  'Semanal': 4,
  'Quincenal': 2,
  'Mensual': 1,
  'Ocasional': null,
};

/** Días hábiles que se suponen al mes, para poder explicarlo en pantalla. */
export const DIAS_HABILES_MES = 22;

/**
 * Kilómetros al mes de una ruta, o `null` si no se puede estimar.
 *
 * Es la base de los indicadores del PESV, que se expresan por millón de
 * kilómetros recorridos. Se calcula en vez de pedirse: el operativo ya declaró
 * la distancia y la frecuencia, y pedir un tercer dato que puede contradecir a
 * los otros dos solo invita a que no cuadren.
 */
export function kilometrosAlMes(distanciaKm: unknown, frecuencia: unknown): number | null {
  const km = Number(distanciaKm);
  if (!Number.isFinite(km) || km <= 0) return null;

  const viajes = VIAJES_AL_MES[String(frecuencia)];
  if (!viajes) return null;

  return Math.round(km * viajes);
}

/**
 * Riesgos que puede presentar una ruta.
 *
 * Agrupados como los presenta la Resolución y como ya se preguntan en el
 * módulo de riesgos de la encuesta: así lo que declara el operativo sobre la
 * ruta y lo que percibe quien la recorre hablan de lo mismo y se pueden
 * contrastar. Sin esto, todo esto acababa suelto en "observaciones", donde no
 * se puede contar ni graficar.
 */
export const FACTORES_RIESGO_RUTA: { grupo: string; factores: string[] }[] = [
  {
    grupo: 'Vía',
    factores: [
      'Mal estado del pavimento',
      'Señalización vertical insuficiente',
      'Demarcación horizontal insuficiente',
      'Falta de bermas o andenes',
      'Falta de elementos de contención',
      'Carriles angostos',
      'Visibilidad reducida',
      'Iluminación deficiente',
    ],
  },
  {
    grupo: 'Entorno',
    factores: [
      'Condiciones climáticas adversas',
      'Animales en la vía',
      'Riesgo público',
      'Tráfico intenso',
      'Peatones y ciclistas',
      'Zona escolar',
      'Derrumbes o avalanchas',
      'Tramo de alta accidentalidad',
    ],
  },
];
