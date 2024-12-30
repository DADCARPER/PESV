import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ArchivoService } from '../../../../../services/archivos.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import AOS from 'aos'; // Importa AOS
import { CommonModule } from '@angular/common';
import { LiderDelPesvService } from '../../../../../services/lider-del-pesv.service';
import { LoginService } from '../../../../../services/login.service';
import { Auth } from '@angular/fire/auth';
import { PdfLiderPesvComponent } from '../../../../../components/pdfs/pdf-lider-pesv/pdf-lider-pesv.component';
import { CardsBotonComponent } from "../../../../../components/cards/cards-boton/cards-boton.component";
import { PasopasoComponent } from "../../../../../components/tabs/pasopaso/pasopaso.component";
import { ProgressCircleComponent } from "../../../../../components/otros/progress-circle/progress-circle.component";
import { omit } from 'lodash';
import { ModalsGuiaComponent } from '../../../../../components/modals/modals-guia/modals-guia.component';
import { UploadArchivosComponent } from "../../../../../components/otros/upload-archivos/upload-archivos.component";


@Component({
  selector: 'app-lider-del-pesv',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PdfLiderPesvComponent, CardsBotonComponent, PasopasoComponent, ProgressCircleComponent, ModalsGuiaComponent, UploadArchivosComponent],
  templateUrl: './lider-del-pesv.component.html',
  styleUrls: ['./lider-del-pesv.component.css']
})
export class LiderDelPesvComponent implements OnInit {

  @ViewChild(PasopasoComponent) pasoPaso!: PasopasoComponent;
  @ViewChild(ModalsGuiaComponent) modalOkCancelar!: ModalsGuiaComponent;
  @ViewChild(PdfLiderPesvComponent) crearpdf!: PdfLiderPesvComponent;

  userId: any = sessionStorage.getItem('userId'); //session Storage =)
  dataEmpresa: any = sessionStorage.getItem('empresaData');
  dataEmpresa2 = JSON.parse(this.dataEmpresa);
  id_formulario: string = "0";

  form!: FormGroup;
  selectedFiles: File[] = []; // Almacena los archivos seleccionados
  resumenInformacion: string[] = []; // Array para almacenar el resumen de la información
  openTab = 0;
  porcentaje = 0;
  

  tablaDocumentos$ = this.liderDelPesvService.leerDocumentoIndex(this.userId);
  

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private archivoService: ArchivoService, 
    private liderDelPesvService: LiderDelPesvService,
  ) {}

  ngOnInit(): void {

    this.id_formulario = sessionStorage.getItem('id_formulario') || "0";
    console.log(this.id_formulario+" aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    if (this.id_formulario !== "0"){

      setTimeout(() => {
        if (this.modalOkCancelar) {
          this.modalOkCancelar.abrirModal(); // este modal se apoya en ViewChild que llama 2 metodos del padre segun su respuesta
        }
      }, 0);
      console.log('Se encontro un Documento perndiente Desea continuar "SI" Descartar "NO" ')
    }

    this.iniciarformulariolimpio();
    
    AOS.init();
    
    
  }

  iniciarformulariolimpio(){
    this.form = this.fb.group({

      // starUp
      tipo: ['Asistente'],
      // Paso 1
      representanteLegal: [''],
      cargoRepresentante: [''],
      identificacionRepresentante: [''],
      nitEmpresa: [''],

      nombreLider: [''],
      cargoLider: [''],
      departamentoLider: [''],
      fechaDesignacion: [''],
      
      // Paso 2: Designación y Autorización

      liderResponsabilidades: [false], // Check para liderar el PESV
      reportaAutogestion: [false],     // Check para reportar autogestión
      garantizaPresupuesto: [false],   // Check para presupuesto
      respondeAutoridades: [false],    // Check para responder a autoridades
      informaDireccion: [false],       // Check para informar a dirección
      defineCumplimientoActividades: [false], 

      // Paso : 3

      gradoAcademico: [''],
      certificadoSGSST: [false],
      experienciaSST: ['', [Validators.min(0)]],
      experienciaPESV: ['', [Validators.min(0)]],
      certificados: [''],

      // Confirmación de Designación
      confirmacionInformacion: [false],
      compromisoLider: [false],

      firmaRepresentante: [''],
      firmaLider: [''],

    });
  }

  async toggleTabs(tabNumber: number,porce:string ) {
    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      if (tabNumber === 5) {
        //this.onSubmit();
        this.generarResumen();
      }
    }, 200);

    if(this.openTab > 1 && this.openTab < 6){ //autoguardado

      

      if(this.openTab == 2){ //crear fomulario o carga autoguardado o carga editable

        
        if (this.id_formulario !== "0") { //existe session de id_formulario creada?
          //this.cargarFormulario(id_formulario);
          const dataCruda = await this.liderDelPesvService.getfomularioEdit(this.id_formulario,this.userId);

          if (dataCruda.exists()) {
            
            const data = dataCruda.data();
            // Excluir el campo 'certificados'
            const dataSinCertificados = omit(data, ['certificados']);
            // Rellenar el formulario con los datos obtenidos
            this.form.patchValue(dataSinCertificados);
            console.log('Datos cargados en el formulario:', data);

          } else {
            console.error('No se encontraron datos para este formulario');
          }
          
        }else{
          //creo el id_formulario por primera vez
          sessionStorage.setItem('id_formulario', Date.now().toString());
          this.id_formulario = sessionStorage.getItem('id_formulario') as string ;

        }

        
      }

      if (porce === "Avanza") {
        this.porcentaje = Math.min(this.porcentaje + 20, 100);  // aumenta el porcentaje de barra IMPORTANTE INICIA EN 0
        this.pasoPaso.nextStep();  //  ESTOS SON METODOS LLAMADOS POR @ViewChild del componenten pasopaso
      } else if(porce === "Atras") {
        this.porcentaje = Math.max(this.porcentaje - 20, 0);
        this.pasoPaso.prevStep(); //  ESTOS SON METODOS LLAMADOS POR @ViewChild del componenten pasopaso
      }
      //console.log("porcentaje" + this.porcentaje +"porcentaje" ); 
      this.liderDelPesvService.autoGuardar(this.form.value,this.userId,"Asistente",this.porcentaje,this.id_formulario ?? "");

      
    }
    
  }


  async onSubmit() {

    
    //this.crearpdf.generatePdf(true);
    //this.form.get("firmaLider")?.valid
    
    if (this.form.valid) {
      //console.log("se ejecutoooooooooooooooooooooooooooooooooooooooooooooooooooooooooox123x");
      const formData = this.form.value;
      formData.userId = this.userId; // Agrega el ID del usuario autenticado
      const fileUrls: string[] = [];
  
      try {
        // Guarda los datos del formulario en Firestore sin los archivos primero
        console.log(formData);
        // const id_formulario = Date.now().toString();
        // const documentRef = await this.liderDelPesvService.saveLiderData(formData,this.userId,id_formulario);
  
        // Subir cada archivo y obtener la URL
        for (const file of this.selectedFiles) {
          try {
            const url: any = await this.liderDelPesvService.uploadFile(file,this.userId).toPromise();
            fileUrls.push(url);
          } catch (error) {
            console.error('Error al subir archivo:', file.name, error);
          }
        }
  
        // Actualizar el documento en Firestore con el array de URLs de los archivos
        await this.liderDelPesvService.updateLiderDataWithFiles(this.userId,this.id_formulario, fileUrls);
        console.log('Datos y URLs de archivos guardados en Firestore');
        
        this.liderDelPesvService.leerdatosformulario(this.userId, this.id_formulario);

        // Guardo el PDF CREADO EN STORAGE POR Blob
        this.crearpdf.generatePdf(true);

        //Borro id_formulario
        this.borroSessionIdFormulario();
        
        //Redirigo a final Tab 6

        this.toggleTabs(6,'Avanza');
        //this.router.navigate(['/admin/dashboardplanificar']);
  
      } catch (error) {
        console.error('Error al guardar los datos en Firestore', error);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
  

  onFilesSelected(event: any) {
    const files: File[] = Array.from(event.target.files) as File[];
    
    files.forEach(file => {
      // Verifica si el archivo ya existe en selectedFiles
      if (this.selectedFiles.some(existingFile => existingFile.name === file.name)) {
        console.log(`Ya existe un archivo con el nombre: ${file.name}`);
      } else {
        this.selectedFiles.push(file); // Agrega el archivo solo si no existe
      }
    });
  
    console.log('Archivos seleccionados:', this.selectedFiles.map(file => file.name));
  }

  removeFile(index: number) {
    const removedFile = this.selectedFiles.splice(index, 1); // Elimina el archivo en el índice especificado
    console.log(`Archivo eliminado: ${removedFile[0].name}`);
  }


  generarResumen() {
    this.resumenInformacion = [
      `Nombre del representante legal: ${this.form.get('nombreRepresentante')?.value || 'No ingresado'}`,
      `Cargo del representante legal: ${this.form.get('cargoRepresentante')?.value || 'No ingresado'}`,
      `NIT de la empresa: ${this.form.get('nitEmpresa')?.value || 'No ingresado'}`,
      `Nombre del líder del PESV: ${this.form.get('nombreLider')?.value || 'No ingresado'}`,
      `Cargo del líder del PESV: ${this.form.get('cargoLider')?.value || 'No ingresado'}`,
      `Confirmación de información proporcionada: ${this.form.get('confirmacionInformacion')?.value ? 'Sí' : 'No'}`,
      `Compromiso del líder del PESV: ${this.form.get('compromisoLider')?.value ? 'Sí' : 'No'}`
    ];
  }
  

  irdashboard(){

    this.router.navigate(['admin/dashboardplanificar']);

  }

  avanzarPaso() {
    this.pasoPaso.nextStep();
  }

  retrocederPaso() {
    this.pasoPaso.prevStep();
  }

  borroSessionIdFormulario(){
    sessionStorage.removeItem('id_formulario');//
    this.id_formulario = "0";
  }

}
