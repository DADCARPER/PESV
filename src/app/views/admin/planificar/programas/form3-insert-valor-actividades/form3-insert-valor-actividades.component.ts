import { CommonModule } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertaInformativoComponent } from '../../../../../components/alertas/alerta-informativo/alerta-informativo.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ProgramasService } from '../programas.service';


@Component({
  selector: 'app-form3-insert-valor-actividades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: './form3-insert-valor-actividades.component.html',
  styleUrl: './form3-insert-valor-actividades.component.css'
})
export class Form3InsertValorActividadesComponent {

  modalFormulario = viewChild.required<Form3InsertValorActividadesComponent>('modalFormulario');
  agregarValorActividadForm: FormGroup;

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);
  private _programas = inject(ProgramasService);

  mostrarModal = signal<boolean>(false);

  datosEdicion: any = null;

  constructor(private fb: FormBuilder) {
    this.agregarValorActividadForm = this.fb.group({
      valorReal: ['', [Validators.required, Validators.min(0), Validators.maxLength(120)]],
    });
  }

  async handleSave(){
    const uid = this._authcations.getCurrentUser().uid;
    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/008-actividades-gestion-riesgos`;
    console.log('Datos para guardar', this.agregarValorActividadForm.value);
    if(this.agregarValorActividadForm.valid){
      const valoractual = this._programas.calcularAvance(this.datosEdicion.valorInicial, this.datosEdicion.meta, Number(this.agregarValorActividadForm.value.valorReal), this.datosEdicion.comportamiento, this.datosEdicion.ingreso);
      console.log('Valor actualizado', valoractual);
      try {
        const payload = {
          ...this.datosEdicion,
          valorReal: Number(this.agregarValorActividadForm.value.valorReal),
          avance: valoractual
        };
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, payload);
        this._alerta.showSuccess('Valor actualizado exitosamente.');
        
        this.cerrarModal();
      } catch (error) {
        this._alerta.showError('Tu Conexión Internet Falló');
      }
    }else{
      this.agregarValorActividadForm.markAllAsTouched();
    }
    
  }

  hasError(fieldName: string): boolean {
    const field = this.agregarValorActividadForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.agregarValorActividadForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'El valor debe ser mayor a 0';
      if (field.errors['min']) return 'El valor debe ser mayor a 0';
      if (field.errors['maxlength']) return 'Longitud máxima superada';
    }
    return '';
  }

  abrirModal(dato: any){
    this.mostrarModal.set(true);
    console.log('Donde diocli insertar valor -->>>>', dato);
    this.datosEdicion = dato;
    this.cargarDatos();
  }

  cargarDatos(){
    console.log('Datos para cargar', this.datosEdicion);
    if(this.datosEdicion){
      this.agregarValorActividadForm.patchValue({
        valorReal: this.datosEdicion.valorReal
      });
    }
  }

  cerrarModal(){
    this.mostrarModal.set(false);
  }
}
