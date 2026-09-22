import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';
import { DiagnosticoDatosService } from '../../../../../../services/shared/diagnostico-datos.service';
import { StorageService } from '../../../../../../services/shared/storage.service';
import { TIPOS_EMERGENCIA, TIPO_EMERGENCIA_OTRO } from '../../../../../../data/emergencias';

@Component({
  selector: 'app-form1-plan-emergencias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form1-plan-emergencias.component.html',
  styleUrl: './form1-plan-emergencias.component.css'
})
export class Form1PlanEmergenciasComponent {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  planForm: FormGroup;

  private _datos = inject(DiagnosticoDatosService);

  /** Vienen del archivo compartido para que la cobertura del tablero y
   *  las opciones del formulario no puedan discrepar. */
  readonly tipos = TIPOS_EMERGENCIA;
  readonly tipoOtro = TIPO_EMERGENCIA_OTRO;

  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: any = null;

  private _storage = inject(StorageService);

  /**
   * Documento de respaldo del protocolo.
   *
   * Se sube en cuanto se elige y no al guardar: subir tarda, y hacerlo
   * dentro del guardado dejaria al usuario esperando sin saber por que.
   */
  soporteUrl = signal<string>('');
  soporteRuta = signal<string>('');
  soporteNombre = signal<string>('');
  subiendoSoporte = signal(false);
  progresoSoporte = signal(0);

  async alElegirSoporte(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    // Las reglas de Storage rechazan por encima de 20 MB: mejor decirlo
    // aqui que dejar que la subida falle sin explicacion.
    if (archivo.size > 20 * 1024 * 1024) {
      this._alerta.showWarning('El documento no puede pesar más de 20 MB.');
      return;
    }

    this.subiendoSoporte.set(true);
    this.progresoSoporte.set(0);
    try {
      // El nombre lleva la hora para no pisar el anterior y para que el
      // navegador no sirva el viejo desde su cache.
      const ruta = `${this._datos.ruta('plan-emergencias')}/soportes/`
        + `${Date.now()}_${archivo.name}`;
      const url = await this._storage.uploadFileProgreso(
        ruta, archivo, (p) => this.progresoSoporte.set(Math.round(p))
      );
      this.soporteUrl.set(url);
      this.soporteRuta.set(ruta);
      this.soporteNombre.set(archivo.name);
    } catch (error: unknown) {
      console.error('[Form1PlanEmergencias] subir soporte:', error);
      this._alerta.showError('No se pudo subir el documento.');
    } finally {
      this.subiendoSoporte.set(false);
    }
  }

  quitarSoporte() {
    this.soporteUrl.set('');
    this.soporteRuta.set('');
    this.soporteNombre.set('');
  }

  constructor(private fb: FormBuilder) {
    this.planForm = this.fb.group({
      nombrePlan:         ['', [Validators.required, Validators.maxLength(120)]],
      tipoEmergencia:     ['', Validators.required],
      descripcion:        ['', Validators.required],
      protocoloAccion:    [''],
      responsable:        [''],
      telefonoEmergencia: [''],
      fechaElaboracion:   [''],
      fechaRevision:      [''],
    });
  }

  cerrarModal() {
    this.planForm.reset({
      nombrePlan: '', tipoEmergencia: '', descripcion: '',
      protocoloAccion: '', responsable: '', telefonoEmergencia: '',
      fechaElaboracion: '', fechaRevision: '',
    });
    this.quitarSoporte();
    this.mostrarModal.set(false);
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: any) {
    this.modo = modo;
    this.datosEdicion = datosEditar ?? null;
    this.quitarSoporte();

    if (modo === 'editar' && datosEditar) {
      this.planForm.patchValue(datosEditar);

      const previo = datosEditar as {
        soporteUrl?: string; soporteRuta?: string; soporteNombre?: string;
      };
      this.soporteUrl.set(previo?.soporteUrl ?? '');
      this.soporteRuta.set(previo?.soporteRuta ?? '');
      this.soporteNombre.set(previo?.soporteNombre ?? '');
    }

    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.planForm.valid) {
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }
    if (this.subiendoSoporte()) {
      this._alerta.showWarning('Espera a que termine de subir el documento.');
      return;
    }

    const periodo = this._auth.periodo();
    const path = this._datos.ruta('plan-emergencias');
    const datos = {
      ...this.planForm.value,
      soporteUrl: this.soporteUrl(),
      soporteRuta: this.soporteRuta(),
      soporteNombre: this.soporteNombre(),
    };
    try {
      if (this.modo === 'editar') {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, datos);
        this._alerta.showSuccess('Plan actualizado exitosamente.');
      } else {
        await this._firestore.createDocument(path, { ...datos, periodo });
        this._alerta.showSuccess('Plan registrado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el plan';
      console.error('[Form1PlanEmergencias] handleSave:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() { this.cerrarModal(); }
}
