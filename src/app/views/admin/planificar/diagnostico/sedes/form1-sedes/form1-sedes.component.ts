import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { AlertaService } from '../../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { AlertaInformativoComponent } from "../../../../../../components/alertas/alerta-informativo/alerta-informativo.component";



@Component({
  selector: 'app-form1-sedes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: './form1-sedes.component.html',
  styleUrl: './form1-sedes.component.css'
})
export class Form1SedesComponent {

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
      nombreSede: ['', [Validators.required, Validators.maxLength(80)]],
      tiposede: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.maxLength(12)]],
      email: ['', [Validators.required, Validators.email]],
      responsable: ['', [Validators.required, Validators.maxLength(80)]],
      cargoresponsable: ['', [Validators.maxLength(80)]],
      // Sin tope superior: hay sedes con miles de empleados y de vehiculos.
      // El unico limite real es que una cuenta no puede ser negativa.
      totalempleados: [0, [Validators.min(0)]],
      totalconductores: [0, [Validators.min(0)]],
      totalasignados: [0, [Validators.min(0)]],
      totaloperacion: [0, [Validators.min(0)]],
      direccion: ['', [Validators.maxLength(120)]],
      departamento: ['', [Validators.required, Validators.maxLength(50)]],
      ciudad: ['', [Validators.maxLength(50)]]
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
    console.log('Todooooooo--->', this.agregarsedeForm.value)
    if (this.agregarsedeForm.valid) {
      //console.log('Formulario inválido', this.agregarsedeForm.value);   
      const uid = this._authcations.getCurrentUser().uid;
      const nit = this._authcations.getCurrentUser().displayName;

      const periodo = this._authcations.periodo();

      if (this.modo === 'editar') {
        try {
          await this._firestore.updateDocument(`Empresas/${nit}/periodos/${periodo}/006-diagnostico-sedes/${this.datosEdicion.id}`, this.agregarsedeForm.value);
          this._alerta.showSuccess('Sede actualizada exitosamente.');
          this.cerrarModal();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Error al actualizar la sede';
          console.error('[Form1Sedes] editar:', error);
          this._alerta.showError(msg);
        }
      }

      if (this.modo === 'crear') {
        try {
          await this._firestore.createDocument(`Empresas/${nit}/periodos/${periodo}/006-diagnostico-sedes`, this.agregarsedeForm.value);
          this._alerta.showSuccess('Sede creada exitosamente.');
          this.cerrarModal();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Error al crear la sede';
          console.error('[Form1Sedes] crear:', error);
          this._alerta.showError(msg);
        }
      }

      
    }else{
      // Decir que hay algo mal sin decir donde obliga a ir campo por campo
      // adivinando. Se nombran los que fallan y se marcan en rojo.
      this.agregarsedeForm.markAllAsTouched();
      const faltan = this.camposInvalidos();
      this._alerta.showWarning(
        faltan.length
          ? `Revisa estos campos: ${faltan.join(', ')}.`
          : 'Por favor, completa el formulario correctamente.'
      );
    }

  }

  /** Nombre legible de cada campo, para poder nombrarlo en los avisos. */
  private static readonly ETIQUETAS: Record<string, string> = {
    nombreSede: 'Nombre de la sede',
    tiposede: 'Tipo de sede',
    telefono: 'Teléfono',
    email: 'Correo',
    responsable: 'Responsable',
    cargoresponsable: 'Cargo del responsable',
    totalempleados: 'Total empleados',
    totalconductores: 'Total conductores',
    totalasignados: 'Vehículos asignados',
    totaloperacion: 'Años en operación',
    direccion: 'Dirección',
    departamento: 'Departamento',
    ciudad: 'Ciudad',
  };

  /** Los campos que impiden guardar, con su nombre tal como se ve en pantalla. */
  private camposInvalidos(): string[] {
    return Object.keys(this.agregarsedeForm.controls)
      .filter((campo) => this.agregarsedeForm.get(campo)?.invalid)
      .map((campo) => Form1SedesComponent.ETIQUETAS[campo] ?? campo);
  }

  /** El campo falla y el usuario ya pasó por él: se puede marcar en rojo. */
  invalido(campo: string): boolean {
    const control = this.agregarsedeForm.get(campo);
    return !!control && control.invalid && control.touched;
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
        nombreSede: this.datosEdicion.nombreSede,
        telefono: this.datosEdicion.telefono,
        direccion: this.datosEdicion.direccion,
        departamento: this.datosEdicion.departamento,
        ciudad: this.datosEdicion.ciudad,
        actividad: this.datosEdicion.actividad,
        email: this.datosEdicion.email,
        responsable: this.datosEdicion.responsable,
        tiposede: this.datosEdicion.tiposede,
        cargoresponsable: this.datosEdicion.cargoresponsable,
        totalempleados: this.datosEdicion.totalempleados,
        totalconductores: this.datosEdicion.totalconductores,
        totalasignados: this.datosEdicion.totalasignados,
        totaloperacion: this.datosEdicion.totaloperacion
      });
  }

  // Método para limpiar cuando es creación
  limpiarFormulario() {
    this.modo = 'crear';
    this.datosEdicion = null;
    // Limpiar el formulario
  }

  


  

}
