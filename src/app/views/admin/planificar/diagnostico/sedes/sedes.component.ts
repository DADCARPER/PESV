import { Component, OnInit } from '@angular/core';
import { options, ciudades, mapacolombia } from '../../../../../data/categorias-data';
import { diagnosticosedes } from '../../../../../interfaces/perfil.interface';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ComboselectComponent } from "../../../../../components/controlesFormulario/comboselect/comboselect.component";
import { SedesDiagnosticoService } from '../../../../../services/sedes-diagnostico.service';
import { AlertaService } from '../../../../../services/alerta.service';
import es from '@angular/common/locales/es';

@Component({
  selector: 'app-sedes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ComboselectComponent],
  templateUrl: './sedes.component.html',
  styleUrl: './sedes.component.css'
})
export class SedesComponent implements OnInit {

  perfil?: diagnosticosedes;
  formPerfil: FormGroup = this.fb.group({});

  options = options // Opciones para el desplegable IMPORT
  ciudades = ciudades // Opciones para el desplegable IMPORT 
  mapacolombia = mapacolombia // Opciones para el desplegable IMPORT
  filteredOptions = [...this.options];

  listaSedes: diagnosticosedes[] = [];
  listaDepartamentos: {} = {};

  valores: any = [];

  constructor(
    private fb: FormBuilder,
    private _sede: SedesDiagnosticoService,
    private _alertaService: AlertaService 
  ) { }

  async ngOnInit() {
    this.iniciarformulariolimpio();
    this.valores = await this._sede.getCollectionDepartamentoFirestore();
    this.listaSedes = this.valores;
    console.log("jamaica",this.valores);
  }

  iniciarformulariolimpio() {
    this.formPerfil = this.fb.group({
   
      nombreSede: ['', Validators.required],
      actividadEmpresa: [''],
      nombreDepartamento: [''],
      departamento: ['', Validators.required],
      municipio: [''],
      direccion: [''],
      telefono: [''],
      estado: ['Activo'],
      fechacreacion: [new Date()],
      mostrarsede: [true]
      
    });
  }

  agregarSede() {
    this.formPerfil.markAllAsTouched();
    if (this.formPerfil.valid){

      // Asegurarse de que el nombreDepartamento esté actualizado
      const departamentoSeleccionado = this.formPerfil.get('departamento')?.value;

      // Verificamos que el valor seleccionado no sea vacío
      if (departamentoSeleccionado !== null && departamentoSeleccionado !== undefined) {
        // Encontramos el índice del valor seleccionado en mapacolombia para obtener el nombre
        const indexDepartamento = this.mapacolombia.indexOf(departamentoSeleccionado);

        if (indexDepartamento !== -1) {
          // Actualizamos nombreDepartamento con el nombre correspondiente de la opción seleccionada
          const nombreDepartamento = this.options[indexDepartamento];
          this.formPerfil.patchValue({
            nombreDepartamento: nombreDepartamento
          });
        }
      }
      
      this.listaSedes.push(this.formPerfil.value);
      this._sede.setDepartamentoFirestore(this.formPerfil.value);
      console.log(this.listaSedes);


      this.iniciarformulariolimpio();

    }
    
  }

  // Método para eliminar un integrante de la lista por índice
  removerSede(index: number): void {
    this.listaSedes.splice(index, 1); // Elimina el integrante en el índice especificado
     
  }

  onSubmit() {
    //console.log();
    if (this.listaSedes.length != 0) {
      // console.log(this.listaSedes);
      // const guardarlista = this.listaSedes.values();
      // console.log(guardarlista);
      // for (let i = 0; i < this.listaSedes.length; i++) {
      //   this._sede.setDepartamentoFirestore(this.listaSedes[i], this.listaSedes[i].nombreSede);
      // }

      //this._sede.setDepartamentoLocal(this.listaDepartamentos);
      this._alertaService.showSuccess("Registro Actualizado con exito");
    } else {
      //console.log('Formulario inválido');
      this._alertaService.showWarning("Registro inválido. ¡Debe crear minimo una sede!");
    }
  }

  // Método para obtener el control del formulario
  //importante para el insertar select en el formulario
  get departamentoControl() {
    return this.formPerfil.get('departamento') as FormControl;
  }

  get ciudadControl() {
    return this.formPerfil.get('municipio') as FormControl;
  }


}
