import { Component, inject, OnInit } from '@angular/core';
import { ArchivoService } from '../../../../../services/archivos.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import AOS from 'aos'; // Importa AOS
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-lider-del-pesv',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lider-del-pesv.component.html',
  styleUrls: ['./lider-del-pesv.component.css']
})
export class LiderDelPesvComponent implements OnInit {
  form!: FormGroup;
  selectedFiles: File[] = []; // Almacena los archivos seleccionados
  resumenInformacion: string[] = []; // Array para almacenar el resumen de la información
  openTab = 3;

  constructor(private fb: FormBuilder, private router: Router, private archivoService: ArchivoService) {}

  ngOnInit(): void {
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
      
      // Confirmación de Designación
      confirmacionDesignacion: [false, Validators.requiredTrue],

      // Paso 2: Designación y Autorización

      liderResponsabilidades: [false, Validators.requiredTrue], // Check para liderar el PESV
      reportaAutogestion: [false, Validators.requiredTrue],     // Check para reportar autogestión
      garantizaPresupuesto: [false, Validators.requiredTrue],   // Check para presupuesto
      respondeAutoridades: [false, Validators.requiredTrue],    // Check para responder a autoridades
      informaDireccion: [false, Validators.requiredTrue],       // Check para informar a dirección
      defineCumplimientoActividades: [false, Validators.requiredTrue], 

      gradoAcademico: ['', Validators.required],
      certificadoSGSST: [false, Validators.requiredTrue],
      experienciaSST: ['', [Validators.required, Validators.min(0)]],
      experienciaPESV: ['', [Validators.required, Validators.min(0)]],
      certificados: ['', Validators.required],

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
      if (tabNumber === 6) {
        this.onSubmit();
      }
    }, 200);
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Formulario completo', this.form.value);
      // Lógica adicional para el envío de datos, como almacenar o enviar a través de un servicio
    } else {
      console.log('no hay confirmacion');
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
  

  irdashboard(){

    this.router.navigate(['admin/dashboardplanificar']);

  }

}
