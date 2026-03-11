import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';
import { AlertaInformativoComponent } from '../../../../../../components/alertas/alerta-informativo/alerta-informativo.component';

@Component({
  selector: 'app-form1-servicios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: './form1-servicios.component.html',
  styleUrl: './form1-servicios.component.css'
})
export class Form1ServiciosComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject (AlertaService);

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);
  agregarsedeForm: FormGroup;

  modo : 'crear' | 'editar';
  datosEdicion: any = null;


  constructor(private fb: FormBuilder){
    this.agregarsedeForm = this.fb.group({
      nombreServicio: ['', [Validators.required, Validators.maxLength(80)]],
      categoriaServicio: ['', [Validators.required]],
      importanciaServicio: ['', [Validators.required]],
      frecuenciaOperacion: ['', [Validators.required]],
      coberturaOperacion: ['', [Validators.required]],
      gps: [false],
      seguro: [false],
      monitoreo: [false],
      conductores: [false],
      mantenimiento: [false],
      soporte: [false],
      descripcion: ['', [Validators.maxLength(500)]]
    });
  }
  

  // Método para cerrar el modal
  cerrarModal() {
    this.agregarsedeForm.reset();
    this.mostrarModal.set(false);
    
  }

  // Método para abrir el modal
  abrirModal(modo:any, datosEditar?:{}) { // crear o editar
    this.mostrarModal.set(true);
    this.modo = modo; // cuando se abre el modal se le informa en que modo se va a ejecutar 
    if (modo === 'editar') {
      this.datosEdicion = datosEditar;
      this.cargarDatos();
    }

  }

  // Método para manejar el clic en "Save Changes"
  async handleSave() {
    //console.log('Todooooooo--->', this.agregarsedeForm.value)
    if (this.agregarsedeForm.valid) {
      //console.log('Formulario inválido', this.agregarsedeForm.value);   
      const nit = this._authcations.getCurrentUser().displayName;
      const periodo = this._authcations.periodo();

      if (this.modo === 'editar') {
        try {
          await this._firestore.updateDocument(`Empresas/${nit}/periodos/${periodo}/006-diagnostico-servicios/${this.datosEdicion.id}`, this.agregarsedeForm.value);
          this._alerta.showSuccess('Servicio actualizado exitosamente.');
          this.cerrarModal();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Error al actualizar el servicio';
          console.error('[Form1Servicios] editar:', error);
          this._alerta.showError(msg);
        }
      }

      if (this.modo === 'crear') {
        try {
          await this._firestore.createDocument(`Empresas/${nit}/periodos/${periodo}/006-diagnostico-servicios`, this.agregarsedeForm.value);
          this._alerta.showSuccess('Servicio creado exitosamente.');
          this.cerrarModal();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Error al crear el servicio';
          console.error('[Form1Servicios] crear:', error);
          this._alerta.showError(msg);
        }
      }

      
    }else{
      //console.log('Formulario inválido', this.registroForm.value.email);
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
    }
    
  }

  // Método para manejar el clic en "Cancelar"
  handleCancel() {
    this.cerrarModal();
  }

  // Método para cargar datos cuando es edición
  cargarDatos() {
    // Cargar los datos en el formulario
    //console.log('Metodo cargar datos', this.datosEdicion.actividad)
    this.agregarsedeForm.patchValue(
      {
        nombreServicio: this.datosEdicion.nombreServicio,
        categoriaServicio: this.datosEdicion.categoriaServicio,
        importanciaServicio: this.datosEdicion.importanciaServicio,
        frecuenciaOperacion: this.datosEdicion.frecuenciaOperacion,
        coberturaOperacion: this.datosEdicion.coberturaOperacion,
        gps: this.datosEdicion.gps,
        seguro: this.datosEdicion.seguro,
        monitoreo: this.datosEdicion.monitoreo,
        conductores: this.datosEdicion.conductores,
        mantenimiento: this.datosEdicion.mantenimiento,
        soporte: this.datosEdicion.soporte,
        descripcion: this.datosEdicion.descripcion

      });
  }

  // Método para limpiar cuando es creación
  limpiarFormulario() {
    this.modo = 'crear';
    this.datosEdicion = null;
    // Limpiar el formulario
  }

}
