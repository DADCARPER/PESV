import { Component, inject, OnInit } from '@angular/core';
import { ArchivoService } from '../../../../../services/archivos.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import AOS from 'aos'; // Importa AOS
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LiderDelPesvService } from '../../../../../services/lider-del-pesv.service';
import { LoginService } from '../../../../../services/login.service';
import { Auth } from '@angular/fire/auth';
import { PdfLiderPesvComponent } from "../../../../../components/pdfs/pdf-lider-pesv/pdf-lider-pesv.component";

@Component({
  selector: 'app-lider-del-pesv',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PdfLiderPesvComponent],
  templateUrl: './lider-del-pesv.component.html',
  styleUrls: ['./lider-del-pesv.component.css']
})
export class LiderDelPesvComponent implements OnInit {

  userId: any = sessionStorage.getItem('userId'); //session Storage =)

  form!: FormGroup;
  selectedFiles: File[] = []; // Almacena los archivos seleccionados
  resumenInformacion: string[] = []; // Array para almacenar el resumen de la información
  openTab = 1;
  

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private archivoService: ArchivoService, 
    private liderDelPesvService: LiderDelPesvService, 
    private loginService: LoginService,
    private auth: Auth
  
  ) {}

  ngOnInit(): void {

    //Codigo temporal se debe borrar
      if (!this.userId) {
        console.error('OJO nO ESTA LOGUEADO ');
        //this.router.navigate(['/login']);
      }else{
        console.error('SI ESTOY LOGUEADO :',this.userId);
      }
    AOS.init();
    this.form = this.fb.group({
      // Paso 1
      representanteLegal: ['', Validators.required],
      cargoRepresentante: ['', Validators.required],
      identificacionRepresentante: ['', Validators.required],
      nitEmpresa: ['', Validators.required],

      nombreLider: ['', Validators.required],
      cargoLider: ['', Validators.required],
      departamentoLider: ['', Validators.required],
      fechaDesignacion: ['', Validators.required],
      
      

      // Paso 2: Designación y Autorización

      liderResponsabilidades: [false, Validators.requiredTrue], // Check para liderar el PESV
      reportaAutogestion: [false, Validators.requiredTrue],     // Check para reportar autogestión
      garantizaPresupuesto: [false, Validators.requiredTrue],   // Check para presupuesto
      respondeAutoridades: [false, Validators.requiredTrue],    // Check para responder a autoridades
      informaDireccion: [false, Validators.requiredTrue],       // Check para informar a dirección
      defineCumplimientoActividades: [false, Validators.requiredTrue], 

      // Paso : 3

      gradoAcademico: ['', Validators.required],
      certificadoSGSST: [false, Validators.requiredTrue],
      experienciaSST: ['', [Validators.required, Validators.min(0)]],
      experienciaPESV: ['', [Validators.required, Validators.min(0)]],
      certificados: [''],

      // Confirmación de Designación
      confirmacionInformacion: [false, Validators.requiredTrue],
      compromisoLider: [false, Validators.requiredTrue],

      firmaRepresentante: ['', Validators.required],
      firmaLider: ['', Validators.required],

    });
  }

  toggleTabs(tabNumber: number) {
    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      if (tabNumber === 5) {
        //this.onSubmit();
        this.generarResumen();
      }
    }, 200);
  }


  async onSubmit() {
    
    if (this.form.valid) {
      const formData = this.form.value;
      formData.userId = this.userId; // Agrega el ID del usuario autenticado
      const fileUrls: string[] = [];
  
      try {
        // Guarda los datos del formulario en Firestore sin los archivos primero
        console.log(formData);
        const id_formulario = Date.now().toString();
        const documentRef = await this.liderDelPesvService.saveLiderData(formData,this.userId,id_formulario);
  
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
        await this.liderDelPesvService.updateLiderDataWithFiles(this.userId,id_formulario, fileUrls);
        console.log('Datos y URLs de archivos guardados en Firestore');
        this.router.navigate(['/admin/dashboardplanificar']);
  
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

}
