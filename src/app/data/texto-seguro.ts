/**
 * Escapa un texto para poder meterlo dentro de HTML.
 *
 * Las tablas del diagnóstico usan `cellRenderer` de ag-grid, y cuando un
 * renderizador devuelve una cadena, ag-grid la inserta con `innerHTML`. Meter
 * ahí el dato tal cual hace que se interprete: un contratista llamado
 * `<img src=x onerror=...>` ejecuta ese código al abrir la tabla.
 *
 * Los datos los teclea gente de la propia empresa, así que el alcance es
 * limitado, pero el supervisor ve las mismas tablas que rellena el operativo.
 *
 * Devuelve el texto de reemplazo cuando el valor viene vacío, para no tener que
 * repetir `?? '—'` en cada interpolación.
 */
export function textoSeguro(valor: unknown, vacio = ''): string {
  if (valor === undefined || valor === null || valor === '') return vacio;

  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
