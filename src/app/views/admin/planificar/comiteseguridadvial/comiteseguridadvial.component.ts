import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
//Componentes
import { PdfComiteSeguridadVialComponent } from '../../../../components/pdfs/pdf-comite-seguridad-vial/pdf-comite-seguridad-vial.component';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { PasopasoComponent } from "../../../../components/tabs/pasopaso/pasopaso.component";
import { ProgressCircleComponent } from "../../../../components/otros/progress-circle/progress-circle.component";
import { ModalsGuiaComponent } from '../../../../components/modals/modals-guia/modals-guia.component';
import { UploadArchivosComponent } from "../../../../components/otros/upload-archivos/upload-archivos.component";


//Servicios

import AOS from 'aos'; // Importa AOS
import { omit } from 'lodash';
import { ComiteSeguridadVialService } from '../../../../services/comite-seguridad-vial.service';
import { FirestoreService } from '../../../../services/firestore.service';
import { LoginService } from '../../../../services/login.service';
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";



@Component({
  selector: 'app-comiteseguridadvial',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PdfComiteSeguridadVialComponent, CardsBotonComponent, PasopasoComponent, ProgressCircleComponent, ModalsGuiaComponent, UploadArchivosComponent, LoadingComponent, RouterLink],
  templateUrl: './comiteseguridadvial.component.html',
  styleUrl: './comiteseguridadvial.component.css'
})
export class ComiteseguridadvialComponent implements OnInit {

  @ViewChild(PasopasoComponent) pasoPaso!: PasopasoComponent;
  @ViewChild(ModalsGuiaComponent) modalOkCancelar!: ModalsGuiaComponent;
  @ViewChild(PdfComiteSeguridadVialComponent) crearPdf!: PdfComiteSeguridadVialComponent;

  form!: FormGroup;
  firmas: FormArray;
  openTab = 0;
  integrantes: { nombreintegrante: string, cargo: string, rol: string, contacto: string }[] = [];  // Array para almacenar los integrantes

  id_formulario: string = "0";
  dataEmpresa: any = sessionStorage.getItem('empresaData');
  dataEmpresa2 = JSON.parse(this.dataEmpresa);
  porcentaje = 0;

  documentData: any;

  userId: string | null = null;
  isLoading = true;
  


  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private _comiteSeguVial: ComiteSeguridadVialService,
    private _firestore: FirestoreService,
    private UID: LoginService
    //private archivoService: ArchivoService, 
    //private liderDelPesvService: LiderDelPesvService,
  ) {

    this.iniciarformulariolimpio();
    // Asignamos el FormArray a la propiedad firmas después de la inicialización
    this.firmas = this.form.get('firmas') as FormArray;

    // this.UID.user$.subscribe(user => {
    //   this.userId = user ? user.uid : null;

    //   this._firestore.getDocumentRealTime('comiteSeguridadVial/', this.userId)
    //   .subscribe({
    //     next: (data) => {
    //       //console.log('Datos en tiempo real:', data);
    //       this.documentData = data; // Almacenamos los datos en el componente
    //     },
    //     error: (error) => {
    //       console.error('Error al recibir datos:', error);
    //     },
    //   });
    
    //   this.isLoading = false;  // El usuario ha sido autenticado
    // });

    

    
    
  }


  ngOnInit(): void {

    this.id_formulario = sessionStorage.getItem('id_formulario_comite_s_vial') || "0";
    console.log(this.userId+" aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    if (this.id_formulario !== "0"){

      setTimeout(() => {
        if (this.modalOkCancelar) {
          this.modalOkCancelar.abrirModal(); // este modal se apoya en ViewChild que llama 2 metodos del padre segun su respuesta
        }
      }, 0);
      console.log('Se encontro un Documento perndiente Desea continuar "SI" Descartar "NO" ')
    }

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

    if(this.openTab > 1 && this.openTab < 6){ //autoguardado

      if(this.openTab == 2){ //crear fomulario o carga autoguardado o carga editable

        if (this.id_formulario !== "0") { //existe session de id_formulario creada?
          //this.cargarFormulario(id_formulario);
          const dataCruda = await this._comiteSeguVial.getfomularioEdit(this.id_formulario);

          console.log("datacrudaaaaaaaaaaa",dataCruda);
          this.integrantes = dataCruda['integrantes']
          

          //------//
          if (this.firmas.length === 0) {

             // Aquí agregamos firmas para cada integrante (igual al número de integrantes)
            for (let i = 0; i < this.integrantes.length; i++) {
              const firmaForm = this.fb.group({
                firma: ['']  // Cada firma es un FormControl dentro de un FormGroup
              });

              // Agregar el FormGroup de firma al FormArray de firmas
              this.firmas.push(firmaForm);
            }

          }
         

          console.log('Datos cargados en el formulario:', this.integrantes);
          
          
          this.form.patchValue(dataCruda);
          
        }else{
          //creo el id_formulario por primera vez
          sessionStorage.setItem('id_formulario_comite_s_vial', Date.now().toString());
          this.id_formulario = sessionStorage.getItem('id_formulario_comite_s_vial') as string ;

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

      // Desestructuramos this.form.value donde extraemos la propiedad nuevoIntegrante y asignamos lo que queda a restoFormData
      const { nuevoIntegrante, ...restoFormData } = this.form.value; // Desestructuramos y excluimos "nuevoIntegrante"
      const formData = {
        ...restoFormData,       // Incluye todos los campos del formulario
        integrantes: this.integrantes,  // Añadir la lista de integrantes
      };
      this._comiteSeguVial.autoGuardar(formData,"Asistente",this.porcentaje,this.id_formulario ?? "");
      //console.log("todododododo",this.form.value);
      
    }
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
  async onSubmit(){

    console.log(this.form.value);

    
    if (this.form.valid) {
      // Aquí puedes manejar el envío de todos los datos, incluyendo los integrantes
      // Desestructuramos this.form.value donde extraemos la propiedad nuevoIntegrante y asignamos lo que queda a restoFormData
      const { nuevoIntegrante, ...restoFormData } = this.form.value; // Desestructuramos y excluimos "nuevoIntegrante"
      const formData = {
        ...restoFormData,       // Incluye todos los campos del formulario
        integrantes: this.integrantes,  // Añadir la lista de integrantes
      };
      console.log('Formulario listo a enviar:', formData);
      this.porcentaje = 100;

      // Guardo el PDF CREADO EN STORAGE POR Blob
      this.crearPdf.generatePdf(true);

      //Borro id_formulario
      //this.borroSessionIdFormulario();
      
      //Redirigo a final Tab 6

      this.toggleTabs(6,'Avanza');
      //this.router.navigate(['/admin/dashboardplanificar']);

      
    } else {
      alert('Por favor, complete todos los campos principales.');
    }
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
    sessionStorage.removeItem('id_formulario_comite_s_vial');//
    this.id_formulario = "0";
  }

  

}
