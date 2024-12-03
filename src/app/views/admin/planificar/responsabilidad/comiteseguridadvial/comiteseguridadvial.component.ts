import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
//Componentes
import { PdfLiderPesvComponent } from '../../../../../components/pdfs/pdf-lider-pesv/pdf-lider-pesv.component';
import { CardsBotonComponent } from "../../../../../components/cards/cards-boton/cards-boton.component";
import { PasopasoComponent } from "../../../../../components/tabs/pasopaso/pasopaso.component";
import { ProgressCircleComponent } from "../../../../../components/otros/progress-circle/progress-circle.component";
import { ModalsGuiaComponent } from '../../../../../components/modals/modals-guia/modals-guia.component';
import { UploadArchivosComponent } from "../../../../../components/otros/upload-archivos/upload-archivos.component";

//Servicios

import AOS from 'aos'; // Importa AOS
import { omit } from 'lodash';


@Component({
  selector: 'app-comiteseguridadvial',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PdfLiderPesvComponent, CardsBotonComponent, PasopasoComponent, ProgressCircleComponent, ModalsGuiaComponent, UploadArchivosComponent],
  templateUrl: './comiteseguridadvial.component.html',
  styleUrl: './comiteseguridadvial.component.css'
})
export class ComiteseguridadvialComponent implements OnInit {

  form!: FormGroup;
  firmas: FormArray;
  openTab = 2;
  integrantes: { nombreintegrante: string, cargo: string, rol: string, contacto: string }[] = [];  // Array para almacenar los integrantes


  constructor(
    private fb: FormBuilder, 
    private router: Router,
    //private archivoService: ArchivoService, 
    //private liderDelPesvService: LiderDelPesvService,
  ) {

    this.iniciarformulariolimpio();
    // Asignamos el FormArray a la propiedad firmas después de la inicialización
    this.firmas = this.form.get('firmas') as FormArray;
  }


  ngOnInit(): void {
    AOS.init();
    
  }


  iniciarformulariolimpio() {
    this.form = this.fb.group({
      departamento: ['', Validators.required],
      ciudad: ['', Validators.required],
      fechaDocumento: ['', Validators.required],
      objetivo1: [false, Validators.required] ,
      objetivo2: [''],
      objetivo3: [''],
      objetivo4: [''],
      objetivo5: [''],
      opcion1: [false],
      opcion2: [false],
      opcion3: [false],
      opcion4: [false],
      opcion5: [false],
      opcion6: [false],
      opcion7: [false],
      opcion8: [false],
      opcion9: [false],
      opcion10: [false],
      opcion11: [false],
      opcion12: [false],
      opcion13: [false],
      opcion14: [false],
      opcion15: [false],
      opcion16: [false],
      opcion17: [false],
      
      firmas: this.fb.array([]),  // Inicializamos el FormArray vacío

      // Aquí creamos un FormGroup para los campos dinámicos
      nuevoIntegrante: this.fb.group({
        nombreintegrante: [''],
        cargo: [''],
        rol: [''],
        contacto: ['']
      })
    });
  }

  

  async toggleTabs(tabNumber: number,porce:string ) {
    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      if (tabNumber === 5) {
        //this.onSubmit();
        //this.generarResumen();
      }
    }, 200);
  }

  //async onSubmit() {}

  // Método para agregar un integrante a la lista
  addIntegrante(): void {
    const nuevoIntegrante = this.form.get('nuevoIntegrante')?.value;

    // Solo agregar si los tres campos están completos
    if (nuevoIntegrante.nombreintegrante && nuevoIntegrante.rol && nuevoIntegrante.contacto) {
      this.integrantes.push({ ...nuevoIntegrante }); // Agregar el nuevo integrante a la lista
      // Limpiar el formulario para el siguiente ingreso
      this.form.get('nuevoIntegrante')?.reset();
      const firmaForm = this.fb.group({
        firma: ['']  // Cada firma es un FormControl dentro de un FormGroup
      });
      this.firmas.push(firmaForm);
    } else {
      alert('Por favor, complete todos los campos de integrante.');
    }
  }

  // Método para eliminar un integrante de la lista por índice
  removeIntegrante(index: number): void {
    this.integrantes.splice(index, 1); // Elimina el integrante en el índice especificado
    this.firmas.removeAt(index); 
  }

  

  // Método para enviar el formulario (para procesar todos los datos)
  onSubmit(): void {

    console.log(this.form.value);

    
    if (this.form.valid) {
      // Aquí puedes manejar el envío de todos los datos, incluyendo los integrantes
      console.log('Formulario enviado:', this.form.value);
      console.log('Integrantes:', this.integrantes);
    } else {
      alert('Por favor, complete todos los campos principales.');
    }
  }

  

}
