import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
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
export class EncuestaVistaComponent implements OnInit, OnDestroy {

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
  public pendingByModule: { modulo: number; label: string; fields: string[] }[] = [];

  private readonly fieldLabels: Record<string, string> = {
    nombre: 'Nombre Completo', fechaNacimiento: 'Fecha de Nacimiento',
    documento: 'Número de Documento', telefono: 'Teléfono', email: 'Correo Electrónico',
    escolaridad: 'Nivel de Escolaridad', estrato: 'Estrato Socioeconómico',
    estadoCivil: 'Estado Civil', cargo: 'Cargo', jornada: 'Jornada Laboral',
    horasLaborales: 'Horas Laborales al Día', tiempoEmpresa: 'Fecha de Ingreso a la Empresa',
    tipoContrato: 'Tipo de Contrato', areaDepartamento: 'Área o Departamento',
    estadoGeneral: 'Estado de Salud General', limitacionFisica: 'Limitación Física',
    incapacidades: 'Incapacidades Médicas', actividadFisica: 'Actividad Física',
    dolorMolestia: 'Dolor o Molestia', discapacidad: 'Discapacidad',
    conduceVehiculos: '¿Conduce vehículos en sus funciones?',
    licenciaConduccion: '¿Tiene licencia de conducción?',
    vigenciaLicencia: 'Vigencia de la Licencia',
    infraccionesTransito: '¿Ha tenido infracciones de tránsito?',
    estadoInfraccion: 'Estado de la Infracción',
    frecuenciaConduccion: 'Frecuencia de Conducción',
    experienciaConduccion: 'Experiencia de Conducción',
    usoCinturon: '¿Ha tenido accidentes de tránsito en el último año?',
    accidenteTransito: '¿El accidente ocurrió en jornada laboral?',
    conocimientoNormas: 'Conocimiento de Normas de Tránsito',
    capacidadEmergencia: 'Capacitación en Emergencias Viales',
    tiempoDesplazamiento: 'Tiempo de Desplazamiento al Trabajo',
    estadoVias: 'Estado de las Vías', incidentesDesplazamiento: 'Incidentes en el Desplazamiento',
    seguridadDesplazamiento: 'Vehículo en el que se Desplaza',
    seguridadDesplazamientoOtro: 'Otro Vehículo (especificar)',
    mediosTransporteOtro: 'Otro Medio de Transporte (especificar)',
    desplazamientosJornada: 'Desplazamientos Durante la Jornada',
    tiempoDuracionDesplazamiento: 'Duración del Desplazamiento en Jornada',
    exposicionRiesgos: 'Exposición a Riesgos Viales',
    experienciaRiesgos: 'Experiencia con Riesgos Viales',
    reporteRiesgo: '¿Sabe reportar una condición insegura?',
    conocimientoReporte: 'Conocimiento del Canal de Reporte',
    culturaSeguridad: 'Cultura de Seguridad Vial en la Empresa',
    participacionAnterior: 'Participación Anterior en Capacitaciones',
  };

  private readonly fieldModules: Record<string, number> = {
    nombre: 1, fechaNacimiento: 1, genero: 1, documento: 1, telefono: 1,
    email: 1, escolaridad: 1, estrato: 1, estadoCivil: 1, cargo: 1,
    jornada: 1, horasLaborales: 1, tiempoEmpresa: 1, tipoContrato: 1, areaDepartamento: 1,
    estadoGeneral: 2, limitacionFisica: 2, incapacidades: 2, actividadFisica: 2, dolorMolestia: 2, discapacidad: 2,
    conduceVehiculos: 3, tipoVehiculos: 3, licenciaConduccion: 3, vigenciaLicencia: 3,
    infraccionesTransito: 3, estadoInfraccion: 3, categoriaLicencia: 3,
    frecuenciaConduccion: 3, experienciaConduccion: 3, usoCinturon: 3,
    accidenteTransito: 3, conocimientoNormas: 3, capacidadEmergencia: 3,
    mediosTransporte: 4, mediosTransporteOtro: 4, tiempoDesplazamiento: 4, estadoVias: 4,
    incidentesDesplazamiento: 4, seguridadDesplazamiento: 4, seguridadDesplazamientoOtro: 4,
    desplazamientosJornada: 4, tipoDesplazamientoJornada: 4, tiempoDuracionDesplazamiento: 4,
    exposicionRiesgos: 5, experienciaRiesgos: 5, reporteRiesgo: 5, conocimientoReporte: 5,
    culturaSeguridad: 5, factorHumano: 5, factorVehiculo: 5, factorVia: 5, factorEntorno: 5,
    accionesMejora: 6, participacionAnterior: 6, sugerenciasMejora: 6,
  };

  private computePendingFields(): void {
    const controls = this.agregarEcuestaForm.controls;
    const byModule = new Map<number, string[]>();
    Object.keys(controls).forEach(key => {
      const ctrl = controls[key];
      if (ctrl.invalid && !ctrl.disabled) {
        const mod = this.fieldModules[key] ?? 1;
        const label = this.fieldLabels[key] ?? key;
        if (!byModule.has(mod)) byModule.set(mod, []);
        byModule.get(mod)!.push(label);
      }
    });
    this.pendingByModule = Array.from(byModule.entries())
      .sort(([a], [b]) => a - b)
      .map(([modulo, fields]) => ({ modulo, label: `Módulo ${modulo}`, fields }));
  }

  toggleTabs(tabNumber: number ) {
    this.openTab = tabNumber;
    this.pendingByModule = [];
    this.saveProgress();
  }

  constructor(private fb: FormBuilder){
    this.agregarEcuestaForm = this.fb.group({
      // Módulo 1: Información Personal y Laboral
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/), Validators.minLength(3), Validators.maxLength(100)]],
      fechaNacimiento: ['', Validators.required],
      genero: ['Masculino'],
      documento: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.minLength(6), Validators.maxLength(20)]],
      telefono: ['', [Validators.required, Validators.pattern(/^3[0-9]{9}$/), Validators.minLength(10), Validators.maxLength(10)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      escolaridad: ['', Validators.required],
      estrato: ['', Validators.required],
      estadoCivil: ['', Validators.required],
      cargo: ['', [Validators.required, Validators.maxLength(100)]],
      jornada: ['', Validators.required],
      horasLaborales: ['', [Validators.required, Validators.min(0)]],
      tiempoEmpresa: ['', Validators.required],
      tipoContrato: ['', Validators.required],
      areaDepartamento: ['', Validators.required],

      // Módulo 2: Salud y Condición Física
      estadoGeneral: ['', Validators.required],
      limitacionFisica: ['', Validators.required],
      incapacidades: ['', Validators.required],
      actividadFisica: ['', Validators.required],
      dolorMolestia: ['', Validators.required],
      discapacidad: ['', Validators.required],

      // Módulo 3: Conducción y Transporte
      conduceVehiculos: ['', Validators.required],
      tipoVehiculos: this.fb.array([]),
      licenciaConduccion: [''],
      vigenciaLicencia: [''],
      infraccionesTransito: [''],
      estadoInfraccion: [''],
      categoriaLicencia: this.fb.array([]),
      frecuenciaConduccion: [''],
      experienciaConduccion: [''],
      usoCinturon: [''],
      accidenteTransito: [''],
      conocimientoNormas: [''],
      capacidadEmergencia: [''],

      // Módulo 4: Desplazamientos Laborales
      mediosTransporte: this.fb.array([]),
      mediosTransporteOtro: [''],
      tiempoDesplazamiento: ['', Validators.required],
      estadoVias: ['', Validators.required],
      incidentesDesplazamiento: ['', Validators.required],
      seguridadDesplazamiento: ['', Validators.required],
      seguridadDesplazamientoOtro: [''],
      desplazamientosJornada: ['', Validators.required],
      tipoDesplazamientoJornada: this.fb.array([]),
      tiempoDuracionDesplazamiento: [''],

      // Módulo 5: Identificación de Riesgos
      exposicionRiesgos: ['', Validators.required],
      experienciaRiesgos: ['', Validators.required],
      reporteRiesgo: ['', Validators.required],
      conocimientoReporte: ['', Validators.required],
      culturaSeguridad: ['', Validators.required],
      factorHumano: this.fb.array([]),
      factorVehiculo: this.fb.array([]),
      factorVia: this.fb.array([]),
      factorEntorno: this.fb.array([]),

      // Módulo 6: Mejora y Participación
      accionesMejora: this.fb.array([]),
      participacionAnterior: ['', Validators.required],
      sugerenciasMejora: ['', [Validators.maxLength(1000)]]
    });
  }

  public showExitModal = false;
  public showRestoreModal = false;
  private savedProgress: { v: any; t: number } | null = null;
  private readonly ARRAYS = ['tipoVehiculos','categoriaLicencia','mediosTransporte',
    'tipoDesplazamientoJornada','factorHumano','factorVehiculo','factorVia','factorEntorno','accionesMejora'];

  private storageKey(): string { return `pesv_encuesta_${this.nitEmpresa}`; }

  private saveProgress(): void {
    if (!this.muestraEncuesta || !this.nitEmpresa) return;
    localStorage.setItem(this.storageKey(), JSON.stringify({
      v: this.agregarEcuestaForm.value, t: this.openTab, ts: Date.now()
    }));
  }

  private checkSavedProgress(): void {
    const raw = localStorage.getItem(this.storageKey());
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > 86_400_000) { localStorage.removeItem(this.storageKey()); return; }
      this.savedProgress = parsed;
      this.showRestoreModal = true;
    } catch { localStorage.removeItem(this.storageKey()); }
  }

  restoreProgress(): void {
    if (!this.savedProgress) return;
    const { v, t } = this.savedProgress;
    const scalar = { ...v };
    this.ARRAYS.forEach(n => delete scalar[n]);
    this.agregarEcuestaForm.patchValue(scalar);
    this.ARRAYS.forEach(name => {
      const arr = this.agregarEcuestaForm.get(name) as FormArray;
      arr.clear();
      ((v[name] ?? []) as string[]).forEach((val: string) => arr.push(this.fb.control(val)));
    });
    this.openTab = t;
    this.savedProgress = null;
    this.showRestoreModal = false;
  }

  discardProgress(): void {
    localStorage.removeItem(this.storageKey());
    this.savedProgress = null;
    this.showRestoreModal = false;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.muestraEncuesta || this.showExitModal) return;
    if (event.key === 'F5' || (event.ctrlKey && (event.key === 'r' || event.key === 'R'))) {
      event.preventDefault();
      this.showExitModal = true;
    }
  }

  confirmExit(): void {
    localStorage.removeItem(this.storageKey());
    this.muestraEncuesta = false;
    window.location.reload();
  }

  ngOnInit() {
    document.body.style.overscrollBehavior = 'none';
    this.route.paramMap.subscribe((params) => {
      this.nitEmpresa = params.get('nitEmpresa')!;
      this.llamardatosempresa(this.nitEmpresa);
    });
    this.setupConditionalValidators();
  }

  ngOnDestroy() {
    document.body.style.overscrollBehavior = '';
  }

  private setRequired(controlName: string, required: boolean): void {
    const control = this.agregarEcuestaForm.get(controlName);
    if (!control) return;
    if (required) {
      control.addValidators(Validators.required);
    } else {
      control.removeValidators(Validators.required);
    }
    control.updateValueAndValidity();
  }

  private setupConditionalValidators(): void {
    const conductionFields = [
      'licenciaConduccion', 'vigenciaLicencia', 'infraccionesTransito',
      'frecuenciaConduccion', 'experienciaConduccion', 'usoCinturon',
      'accidenteTransito', 'conocimientoNormas', 'capacidadEmergencia'
    ];

    this.agregarEcuestaForm.get('conduceVehiculos')!.valueChanges.subscribe(val => {
      const required = val === 'Sí';
      conductionFields.forEach(f => this.setRequired(f, required));
      if (!required) this.setRequired('estadoInfraccion', false);
    });

    this.agregarEcuestaForm.get('infraccionesTransito')!.valueChanges.subscribe(val => {
      this.setRequired('estadoInfraccion', val?.startsWith('Sí') ?? false);
    });

    this.agregarEcuestaForm.get('seguridadDesplazamiento')!.valueChanges.subscribe(val => {
      this.setRequired('seguridadDesplazamientoOtro', val === 'Otro');
    });

    this.agregarEcuestaForm.get('mediosTransporte')!.valueChanges.subscribe((val: string[]) => {
      this.setRequired('mediosTransporteOtro', val.includes('Otro'));
    });

    this.agregarEcuestaForm.get('desplazamientosJornada')!.valueChanges.subscribe(val => {
      this.setRequired('tiempoDuracionDesplazamiento', val === 'Sí');
    });

    this.agregarEcuestaForm.get('categoriaLicencia')!.valueChanges.subscribe((val: string[]) => {
      const vigencia = this.agregarEcuestaForm.get('vigenciaLicencia')!;
      if (val.includes('No tiene licencia')) {
        vigencia.disable();
        vigencia.reset('');
      } else {
        vigencia.enable();
      }
    });
  }

  private applyModuleValidators(): void {
    const moduleFields: Record<string, string[]> = {
      modulo2: ['estadoGeneral', 'limitacionFisica', 'incapacidades', 'actividadFisica', 'dolorMolestia', 'discapacidad'],
      modulo3: ['conduceVehiculos', 'licenciaConduccion', 'vigenciaLicencia', 'infraccionesTransito', 'estadoInfraccion',
                'frecuenciaConduccion', 'experienciaConduccion', 'usoCinturon', 'accidenteTransito', 'conocimientoNormas', 'capacidadEmergencia'],
      modulo4: ['tiempoDesplazamiento', 'estadoVias', 'incidentesDesplazamiento', 'seguridadDesplazamiento',
                'seguridadDesplazamientoOtro', 'mediosTransporteOtro', 'desplazamientosJornada', 'tiempoDuracionDesplazamiento'],
      modulo5: ['exposicionRiesgos', 'experienciaRiesgos', 'reporteRiesgo', 'conocimientoReporte', 'culturaSeguridad'],
      modulo6: ['participacionAnterior'],
    };
    Object.entries(moduleFields).forEach(([modKey, fields]) => {
      if (!this.encuestaParameters?.[modKey]) {
        fields.forEach(f => this.setRequired(f, false));
      }
    });
  }

  async llamardatosempresa(nit:string) {
    const path = `Encuestas_publicas/${nit}`;
    const doc = await this._firestore.getDocument<Models.Diagnostico.encuestaParametros>(path); 
    if (doc.exists()) {
     
      const activo = doc.data().encuestaParametros.mostrarEncuesta;
      console.log("DATOS TODOS LOS MODULOS---->",doc.data().encuestaParametros);
      this.encuestaParameters = doc.data().encuestaParametros;
      this.applyModuleValidators();
      if (activo){
        this.nombreEmpresa = 'Encuesta '+ doc.data().nombreEmpresa;
        this.muestraEncuesta = true;
        this.checkSavedProgress();
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
      this.pendingByModule = [];
      try {
        const formData = { ...this.agregarEcuestaForm.value };
        if (formData.seguridadDesplazamiento === 'Otro' && formData.seguridadDesplazamientoOtro) {
          formData.seguridadDesplazamiento = `Otro: ${formData.seguridadDesplazamientoOtro}`;
        }
        delete formData.seguridadDesplazamientoOtro;
        const otroIndex = (formData.mediosTransporte as string[]).indexOf('Otro');
        if (otroIndex !== -1 && formData.mediosTransporteOtro) {
          formData.mediosTransporte[otroIndex] = `Otro: ${formData.mediosTransporteOtro}`;
        }
        delete formData.mediosTransporteOtro;
        await this._firestore.createDocument(`Encuestas_publicas/${this.nitEmpresa}/encuestas`, formData);
        localStorage.removeItem(this.storageKey());
        this.muestraEncuesta = false;
        this.muestra200 = true;
        
      } catch (error) {
        this._alerta.showError('Tu Conexión Internet Fallo');
      }
    } else {
      this.computePendingFields();
      this._alerta.showWarning('Debes completar los campos obligatorios.');
    }
  }

  goToNextTab() {
    for (let i = this.openTab + 1; i <= 5; i++) { // Iterar hasta el Modulo 6 (índice 5)
        const moduleParamKey = 'modulo' + (i + 1); // Construir la clave, ej: 'modulo2', 'modulo3'
        // Validar si el módulo está habilitado en encuestaParameters
        if (this.encuestaParameters && this.encuestaParameters[moduleParamKey]) {
            this.openTab = i;
            this.saveProgress();
            return;
        }
    }
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
            this.saveProgress();
            return;
        }
    }
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
