/**
 * Escenarios de emergencia vial que una organización debe tener previstos.
 *
 * Viven aquí y no escritos en el formulario para que la cobertura del tablero
 * y las opciones que se ofrecen no puedan discrepar: si se añade un escenario,
 * aparece a la vez en los dos sitios.
 *
 * "Otro" no cuenta para la cobertura: es una salida para casos particulares,
 * no un escenario que se pueda dar por cubierto.
 */
export const TIPOS_EMERGENCIA = [
  'Accidente de tránsito',
  'Falla mecánica',
  'Derrumbe / Vía cerrada',
  'Incendio vehicular',
  'Derrame de sustancias',
  'Emergencia médica',
] as const;

/** Opción libre, fuera del recuento de cobertura. */
export const TIPO_EMERGENCIA_OTRO = 'Otro';
