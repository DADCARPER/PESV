import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { Models } from '../../../../../interfaces/models';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";

@Component({
  selector: 'app-encuesta-vista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: './encuesta-vista.component.html',
  styleUrl: './encuesta-vista.component.css'
})
export class EncuestaVistaComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private _firestore = inject(FirestoreService);
  public _alerta = inject (AlertaService);
  
  public nitEmpresa = '';
  public nombreEmpresa: string;
  public muestraEncuesta: boolean;
  public muestra404: boolean;
  public muestra200: boolean;
  public encuestaParameters:any;
  agregarEcuestaForm: FormGroup;
  openTab = 0;

  toggleTabs(tabNumber: number ) {
    this.openTab = tabNumber;
    //this.guardar();
  }

  constructor(private fb: FormBuilder){
    this.agregarEcuestaForm = this.fb.group({
      // Módulo 1: Información Personal y Laboral
      nombre: ['', [Validators.required,Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),Validators.minLength(3), Validators.maxLength(100)]],
      fechaNacimiento: [''],
      genero: ['Masculino'],
      documento: ['', [Validators.required,Validators.pattern(/^[0-9]+$/),Validators.minLength(6), Validators.maxLength(20)]],
      telefono: ['', [Validators.required,Validators.pattern(/^3[0-9]{9}$/),Validators.minLength(10), Validators.maxLength(10)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      escolaridad: [''],
      estrato: [''],
      estadoCivil: [''],
      cargo: ['', [Validators.maxLength(100)]],
      jornada: [''],
      horasLaborales: ['', [Validators.min(0)]],
      tiempoEmpresa: ['', [Validators.min(0)]],
      tipoContrato: [''],
      areaDepartamento: [''],

      // Módulo 2: Salud y Condición Física
      estadoGeneral: [''],
      limitacionFisica: [''],
      incapacidades: [''],
      actividadFisica: [''],
      dolorMolestia: [''],
      discapacidad: [''],

      // Módulo 3: Conducción y Transporte
      conduceVehiculos: [''],
      tipoVehiculos: this.fb.array([]),
      licenciaConduccion: [''],
      categoriaLicencia: [''],
      frecuenciaConduccion: [''],
      experienciaConduccion: [''],
      usoCinturon: [''],
      accidenteTransito: [''],
      conocimientoNormas: [''],
      capacidadEmergencia: [''],

      // Módulo 4: Desplazamientos Laborales
      mediosTransporte: this.fb.array([]),
      tiempoDesplazamiento: [''],
      estadoVias: [''],
      incidentesDesplazamiento: [''],
      seguridadDesplazamiento: [''],

      // Módulo 5: Identificación de Riesgos
      exposicionRiesgos: [''],
      experienciaRiesgos: [''],
      situacionesRiesgo: this.fb.array([]),
      reporteRiesgo: [''],
      conocimientoReporte: [''],
      culturaSeguridad: [''],
      preparacionRiesgos: [''],

      // Módulo 6: Mejora y Participación
      aportarIdeas: [''],
      participacionActividades: [''],
      accionesMejora: this.fb.array([]),
      participacionAnterior: [''],
      sugerenciasMejora: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit() {
    //Recibo paramentro nit de la empresa
    this.route.paramMap.subscribe((params) => {
      this.nitEmpresa = params.get('nitEmpresa')!;
      this.llamardatosempresa(this.nitEmpresa);
      //console.log('Empresa:', this.nitEmpresa);
      // Cargar config de encuesta desde Firestore...
    });
  }

  async llamardatosempresa(nit:string) {
    const path = `Encuestas_publicas/${nit}`;
    const doc = await this._firestore.getDocument<Models.Diagnostico.encuestaParametros>(path); 
    if (doc.exists()) {
     
      const activo = doc.data().encuestaParametros.mostrarEncuesta;
      console.log("DATOS TODOS LOS MODULOS---->",doc.data().encuestaParametros);
      this.encuestaParameters = doc.data().encuestaParametros; ///<------ PASO LOS ESTADOS ACTUALES DE LOS MODULOS TRUE O FALSE
      if (activo){
        console.log('docSnap.data() => ', doc.data()); // Gracias a Models.Empresa puedo llamar solo un campo doc.data().ciudad
        this.nombreEmpresa = 'Encuesta '+ doc.data().nombreEmpresa;
        this.muestraEncuesta = true;
      }else{
        //si existe la empresa pero no esta activa la encuesta
        //console.log("NO ESTA ACTIVO");
        this.muestra404 = true;
      }
      
    }else{
      console.log('NO EXISTE ENCUESTA CREADA');
      this.muestra404 = true;
    }
  }

  // Métodos para manejar FormArrays
  get tipoVehiculosArray() {
    return this.agregarEcuestaForm.get('tipoVehiculos') as FormArray;
  }

  get mediosTransporteArray() {
    return this.agregarEcuestaForm.get('mediosTransporte') as FormArray;
  }

  get situacionesRiesgoArray() {
    return this.agregarEcuestaForm.get('situacionesRiesgo') as FormArray;
  }

  get accionesMejoraArray() {
    return this.agregarEcuestaForm.get('accionesMejora') as FormArray;
  }

  // Método para manejar cambios en checkboxes
  onCheckboxChange(event: any, formArrayName: string) {
    const formArray = this.agregarEcuestaForm.get(formArrayName) as FormArray;
    
    if (event.target.checked) {
      formArray.push(this.fb.control(event.target.value));
    } else {
      const index = formArray.controls.findIndex(x => x.value === event.target.value);
      if (index >= 0) {
        formArray.removeAt(index);
      }
    }
  }

  // Método para verificar si un checkbox está seleccionado
  isChecked(value: string, formArrayName: string): boolean {
    const formArray = this.agregarEcuestaForm.get(formArrayName) as FormArray;
    return formArray.controls.some(control => control.value === value);
  }

  

  async guardar() {
    // console.log('Entra en Guardar------->');
    this.agregarEcuestaForm.markAllAsTouched();
    if (this.agregarEcuestaForm.valid) {
      //console.log(this.agregarEcuestaForm.value);
      // Guardar formulario NUEVO
      try {
        await this._firestore.createDocument(`Encuestas_publicas/${this.nitEmpresa}/encuestas`,this.agregarEcuestaForm.value);
        this.muestraEncuesta = false;
        this.muestra200 = true;
        
      } catch (error) {
        this._alerta.showError('Tu Conexión Internet Fallo');
      }
    }else{
      this._alerta.showWarning('Debes completar los campos obligatorios.');
    }
  }

  goToNextTab() {
    for (let i = this.openTab + 1; i <= 5; i++) { // Iterar hasta el Modulo 6 (índice 5)
        const moduleParamKey = 'modulo' + (i + 1); // Construir la clave, ej: 'modulo2', 'modulo3'
        // Validar si el módulo está habilitado en encuestaParameters
        if (this.encuestaParameters && this.encuestaParameters[moduleParamKey]) {
            this.openTab = i;
            return; // Se encontró el siguiente módulo habilitado, se navega y se sale.
        }
    }
    // Si se llega aquí, significa que no hay más módulos habilitados después del actual.
    // Esto se maneja específicamente con el botón "Finalizar" en el HTML.
    // console.log("No hay más pestañas habilitadas para navegar hacia adelante.");
}

goToPreviousTab() {
    for (let i = this.openTab - 1; i >= 0; i--) { // Iterar hacia atrás hasta el Modulo 1 (índice 0)
        if (i === 0) { // El Modulo 1 (índice 0) siempre está disponible.
            this.openTab = 0;
            return;
        }
        const moduleParamKey = 'modulo' + (i + 1); // Construir la clave, ej: 'modulo2', 'modulo3'
        // Validar si el módulo está habilitado en encuestaParameters
        if (this.encuestaParameters && this.encuestaParameters[moduleParamKey]) {
            this.openTab = i;
            return; // Se encontró el módulo anterior habilitado, se navega y se sale.
        }
    }
    // console.log("No hay más pestañas habilitadas para navegar hacia atrás.");
}

public getLastEnabledTabIndex(): number {
    if (!this.encuestaParameters) {
        return 0; // Default to Module 1 (index 0) if parameters are not loaded yet
    }
    // Module 1 (index 0) is always considered active
    let lastEnabledIndex = 0;
    // Check modules from 2 (index 1) to 6 (index 5)
    for (let i = 1; i <= 5; i++) {
        const moduleParamKey = 'modulo' + (i + 1); // e.g., for i=1, it's 'modulo2'; for i=5, it's 'modulo6'
        // Ensure the property exists before checking its value
        if (this.encuestaParameters.hasOwnProperty(moduleParamKey) && this.encuestaParameters[moduleParamKey]) {
            lastEnabledIndex = i;
        }
    }
    return lastEnabledIndex;
}

}
