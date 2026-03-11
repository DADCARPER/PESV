import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Models } from '../../../../../interfaces/models';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { RouterLink } from '@angular/router';
 

@Component({
  selector: 'app-encuesta-parametros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './encuesta-parametros.component.html',
  styleUrl: './encuesta-parametros.component.css'
})
export class EncuestaParametrosComponent {

  private _authcations = inject(AuthenticacionService);
  private _firebaseservice = inject(FirestoreService);
  public _alerta = inject (AlertaService);
  paramEncuestaForm: FormGroup;
  nitEmpresa = '';
  

  constructor(private fb: FormBuilder){
    this.paramEncuestaForm = this.fb.group({
      mostrarEncuesta: [false],
      modulo2: [false],
      modulo3: [false],
      modulo4: [false],
      modulo5: [false],
      modulo6: [false]
    });
  }

  ngOnInit() {
     //this.guardarEmpresa();
    // this.updateEmpresa('900444555-8');
    //this.getProducts();
    // this.getProductsRxjs();
    this.cargar();
  }

  async cargar() {
    const nit = this._authcations.getCurrentUser().displayName;
    this.nitEmpresa = nit;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Encuestas_publicas/${nit}`;

    const doc = await this._firebaseservice.getDocument<Models.Diagnostico.encuestaParametros>(path); 
    if (doc.exists()) {
      // console.log('Datos completos:', doc.data());
      // console.log('Parámetros de la encuesta:', doc.data().encuestaParametros);
      this.paramEncuestaForm.patchValue(doc.data().encuestaParametros); // importante los checkbox NO reciben setValue DEBO USAR patchValue
    }
  }

  async actualizaParametros() {
    
    const nit = this._authcations.getCurrentUser().displayName;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Encuestas_publicas/${nit}`;
    const valorActualFormulario = this.paramEncuestaForm.value;
    const updateDoc = {
      encuestaParametros: {
        mostrarEncuesta: valorActualFormulario.mostrarEncuesta,
        modulo2: valorActualFormulario.modulo2,
        modulo3: valorActualFormulario.modulo3,
        modulo4: valorActualFormulario.modulo4,
        modulo5: valorActualFormulario.modulo5,
        modulo6: valorActualFormulario.modulo6,
      }
    }
  
    try {
      await this._firebaseservice.updateDocument(path, updateDoc);
      //console.log('actualizado con éxito');
      //this._alerta.showSuccess('Sede actualizada exitosamente.');
    } catch (error) {
      this._alerta.showError('Tu Conexión Internet Fallo');
      //console.log('error al actualizar');
    }
  }

  ngOnDestroy(){
   
  }
  
}
