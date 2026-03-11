import { CommonModule } from '@angular/common';
import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { StorageService } from '../../../../../../services/shared/storage.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';
import { AlertaInformativoComponent } from "../../../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-form3-importar-excell',
  standalone: true,
  imports: [CommonModule, AlertaInformativoComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './form3-importar-excell.component.html',
  styleUrl: './form3-importar-excell.component.css'
})
export class Form3ImportarExcellComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _storage = inject(StorageService);
  public _alerta = inject(AlertaService);

  readonly nit = this._authcations.getCurrentUser().displayName;

  mostrarModal = signal<boolean>(false);

  // ── Estado del proceso ────────────────────────────────────────────────────
  archivoSeleccionado: File | null = null;
  cargando = false;
  procesados = 0;
  totalFilas = 0;
  resultado: { exitosos: number; errores: number; duplicados: number } | null = null;

  // ── Definición de columnas con etiquetas legibles ─────────────────────────
  readonly COLUMNAS: { campo: string; etiqueta: string; ejemplo: string }[] = [
    { campo: 'documento',                    etiqueta: 'Número de documento',           ejemplo: '1234567890' },
    { campo: 'nombre',                       etiqueta: 'Nombre completo',               ejemplo: 'Juan Pérez' },
    { campo: 'cargo',                        etiqueta: 'Cargo',                         ejemplo: 'Conductor' },
    { campo: 'genero',                       etiqueta: 'Género',                        ejemplo: 'Masculino / Femenino' },
    { campo: 'fechaNacimiento',              etiqueta: 'Fecha de nacimiento',           ejemplo: '1990-05-20' },
    { campo: 'jornada',                      etiqueta: 'Jornada laboral',               ejemplo: 'Diurna / Nocturna / Mixta Día - Noche' },
    { campo: 'horasLaborales',               etiqueta: 'Horas laborales',               ejemplo: '8' },
    { campo: 'escolaridad',                  etiqueta: 'Escolaridad',                   ejemplo: 'Bachiller / Técnico / Tecnólogo / Profesional' },
    { campo: 'estrato',                      etiqueta: 'Estrato',                       ejemplo: 'Estrato 1 ... Estrato 6' },
    { campo: 'estadoCivil',                  etiqueta: 'Estado civil',                  ejemplo: 'Soltero / Casado / Unión libre' },
    { campo: 'telefono',                     etiqueta: 'Teléfono',                      ejemplo: '3001112222' },
    { campo: 'email',                        etiqueta: 'Correo electrónico',            ejemplo: 'juan@correo.com' },
    { campo: 'tiempoEmpresa',               etiqueta: 'Antigüedad (años)',             ejemplo: '3' },
    { campo: 'tipoContrato',                etiqueta: 'Tipo de contrato',              ejemplo: 'Término indefinido' },
    { campo: 'areaDepartamento',            etiqueta: 'Área / Departamento',           ejemplo: 'Producción / Operaciones' },
    { campo: 'conduce',                      etiqueta: '¿Conduce?',                     ejemplo: 'SI / NO' },
    { campo: 'medioTransporteTrabajo',      etiqueta: 'Medio de transporte al trabajo',ejemplo: 'Automóvil / Transporte público' },
    { campo: 'rolConductorLaboral',         etiqueta: '¿Es conductor laboral?',       ejemplo: 'SI / NO' },
    { campo: 'tipoVehiculoConduce',         etiqueta: 'Tipo vehículo que conduce',    ejemplo: 'Automóvil / Motocicleta' },
    { campo: 'tieneLicencia',               etiqueta: '¿Tiene licencia?',             ejemplo: 'SI / NO' },
    { campo: 'numeroLicencia',              etiqueta: 'Número de licencia',            ejemplo: '12345678' },
    { campo: 'categoriaLicencia',           etiqueta: 'Categoría(s) licencia',        ejemplo: 'B1,B2 (separadas por coma)' },
    { campo: 'vigenciaLicencia',            etiqueta: 'Vigencia licencia',            ejemplo: '2026-12-31' },
    { campo: 'capacitacionSeguridadVial',   etiqueta: 'Capacitación seguridad vial',  ejemplo: 'SI / NO' },
    { campo: 'fechaUltimaCapacitacion',     etiqueta: 'Fecha última capacitación',    ejemplo: '2024-03-15' },
    { campo: 'evaluacionCompetenciaConduccion', etiqueta: 'Evaluación de competencia',ejemplo: 'Aprobado / No aprobado / No aplica' },
    { campo: 'haTenidoSiniestros',          etiqueta: '¿Ha tenido siniestros?',       ejemplo: 'SI / NO' },
    { campo: 'cantidadSiniestros',          etiqueta: 'Número de siniestros',         ejemplo: '1' },
    { campo: 'tieneInfracciones',           etiqueta: '¿Tiene infracciones?',         ejemplo: 'SI / NO' },
    { campo: 'cantidadInfracciones',        etiqueta: 'Número de infracciones',       ejemplo: '2' },
    { campo: 'estadoPagoInfracciones',      etiqueta: 'Estado de pago infracciones',  ejemplo: 'Pagadas / Pendientes' },
  ];

  // Solo los campos (campo) en orden de columnas para el mapeo de XLSX
  private get HEADERS_XLSX(): string[] {
    return this.COLUMNAS.map(c => c.campo);
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  abrirModal() {
    this.resetEstado();
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  handleCancel() {
    this.cerrarModal();
  }

  private resetEstado() {
    this.archivoSeleccionado = null;
    this.cargando = false;
    this.procesados = 0;
    this.totalFilas = 0;
    this.resultado = null;
  }

  // ── Generar y descargar plantilla ─────────────────────────────────────────

  descargarPlantilla() {
    // Fila 1: etiquetas legibles
    const encabezados = this.COLUMNAS.map(c => c.etiqueta);
    // Fila 2: ejemplos
    const ejemplos    = this.COLUMNAS.map(c => c.ejemplo);

    const ws = XLSX.utils.aoa_to_sheet([encabezados, ejemplos]);

    // Ancho de columnas automático según el texto más largo
    ws['!cols'] = this.COLUMNAS.map(c =>
      ({ wch: Math.max(c.etiqueta.length, c.ejemplo.length) + 4 })
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    XLSX.writeFile(wb, 'plantilla_colaboradores.xlsx');
  }

  // ── Selección del archivo ─────────────────────────────────────────────────

  onSeleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    const esXlsx = file.name.toLowerCase().endsWith('.xlsx') &&
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (!esXlsx) {
      this._alerta.showError('Solo se permiten archivos con extensión .xlsx');
      return;
    }

    this.archivoSeleccionado = file;
    this.resultado = null;
  }

  get tamanoArchivo(): string {
    if (!this.archivoSeleccionado) return '';
    const kb = this.archivoSeleccionado.size / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  }

  get porcentajeProgreso(): number {
    if (!this.totalFilas) return 0;
    return Math.round((this.procesados / this.totalFilas) * 100);
  }

  // ── Importar ──────────────────────────────────────────────────────────────

  async importar() {
    if (!this.archivoSeleccionado) return;
    this.cargando = true;
    this.resultado = null;

    try {
      const periodo = this._authcations.periodo();

      const now = new Date();
      const fecha = now.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      const hora  = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, '-');
      const nombreArchivo = `${fecha}_${hora}_${this.archivoSeleccionado.name.replace(/[^a-zA-Z0-9._]/g, '_')}`;
      const rutaStorage = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-colaboradores-importados`;

      await this._storage.uploadFile(rutaStorage, nombreArchivo, this.archivoSeleccionado);
      await this.procesarExcel(this.archivoSeleccionado, periodo);

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error durante la importación';
      console.error('[Form3Importar] importar:', error);
      this._alerta.showError(msg);
      this.cargando = false;
    }
  }

  private procesarExcel(file: File, periodo: number): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const arrayBuffer = e.target!.result as ArrayBuffer;
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const fullRange = XLSX.utils.decode_range(worksheet['!ref']!);
          const totalCols = this.HEADERS_XLSX.length;
          const totalRows = fullRange.e.r - fullRange.s.r + 1;
          const colLetra  = XLSX.utils.encode_col(totalCols - 1); // 0-indexed: 31 cols → 'AE'
          const rango = `A1:${colLetra}${totalRows}`;

          const filas: any[] = XLSX.utils.sheet_to_json(worksheet, {
            header: this.HEADERS_XLSX,
            range: rango,
            defval: '',
          });

          // Fila 0 = encabezados del Excel → omitir
          const datos = filas.slice(1).filter(f => f.documento && f.nombre);
          this.totalFilas = datos.length;
          this.procesados = 0;

          // Duplicados
          const snapExistentes = await this._firestore.getDocuments<any>(
            `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-colaboradores`
          );
          const existentes = snapExistentes.docs.map((d: any) => d.data());
          const documentosExistentes = new Set<string>(
            existentes.filter((c: any) => c.documento).map((c: any) => String(c.documento).trim())
          );
          const emailsExistentes = new Set<string>(
            existentes.filter((c: any) => c.email).map((c: any) => String(c.email).trim().toLowerCase())
          );

          let exitosos = 0, errores = 0, duplicados = 0;

          for (const fila of datos) {
            // Normalizar
            fila.documento = String(fila.documento ?? '').trim();
            fila.email     = String(fila.email     ?? '').trim();

            // Convertir categoriaLicencia de "A1,B1" → ['A1','B1']
            if (fila.categoriaLicencia && typeof fila.categoriaLicencia === 'string') {
              fila.categoriaLicencia = fila.categoriaLicencia
                .split(/[,;]+/)
                .map((s: string) => s.trim().toUpperCase())
                .filter((s: string) => s !== '');
            } else {
              fila.categoriaLicencia = [];
            }

            // Convertir fechas numéricas de Excel
            for (const campo of ['fechaNacimiento', 'vigenciaLicencia', 'fechaUltimaCapacitacion']) {
              if (typeof fila[campo] === 'number') {
                fila[campo] = this.excelDateToJSDate(fila[campo]);
              }
            }

            // Duplicado
            const docStr   = fila.documento;
            const emailStr = fila.email.toLowerCase();
            const esDuplicado =
              (docStr && documentosExistentes.has(docStr)) ||
              (emailStr && emailsExistentes.has(emailStr));

            if (esDuplicado) {
              duplicados++;
              this.procesados++;
              continue;
            }

            try {
              await this._firestore.createDocument(
                `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-colaboradores`,
                { ...fila, periodo }
              );
              exitosos++;
              documentosExistentes.add(docStr);
              if (emailStr) emailsExistentes.add(emailStr);
            } catch {
              errores++;
            }
            this.procesados++;
          }

          this.resultado = { exitosos, errores, duplicados };
          this.archivoSeleccionado = null;
          this.cargando = false;
          resolve();

        } catch (error: unknown) {
          console.error('[Form3Importar] procesarExcel:', error);
          this._alerta.showError('Error al leer el archivo Excel.');
          this.cargando = false;
          resolve();
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private excelDateToJSDate(serial: number): string {
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
}
