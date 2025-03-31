import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
import AOS from 'aos'; // Importa AOS
//Servicios


import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component"; 
import { PoliticaSeguridadVialService } from '../../../../services/politica-seguridad-vial.service';
import { PasopasoComponent } from '../../../../components/tabs/pasopaso/pasopaso.component';
import { UploadArchivosComponent } from "../../../../components/otros/upload-archivos/upload-archivos.component";
import { PdfPoliticasSeguridadVialComponent } from "../../../../components/pdfs/pdf-politicas-seguridad-vial/pdf-politicas-seguridad-vial.component";
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../../../services/login.service';
import { FirestoreService } from '../../../../services/firestore.service';
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";

@Component({
  selector: 'app-politicaseguridadvial',
  standalone: true,
  imports: [CommonModule, CardsBotonComponent, FormsModule, ReactiveFormsModule, PasopasoComponent, UploadArchivosComponent, PdfPoliticasSeguridadVialComponent, LoadingComponent, RouterLink],
  templateUrl: './politicaseguridadvial.component.html',
  styleUrl: './politicaseguridadvial.component.css'
})
export class PoliticaseguridadvialComponent {

  @ViewChild(PasopasoComponent) pasoPaso!: PasopasoComponent;
  @ViewChild(PdfPoliticasSeguridadVialComponent) crearPdf!: PdfPoliticasSeguridadVialComponent;

  form!: FormGroup;
  openTab = 0;

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
    private _politicaSeguVial: PoliticaSeguridadVialService,
    private _firestore: FirestoreService,
    private UID: LoginService
    //private archivoService: ArchivoService, 
    //private liderDelPesvService: LiderDelPesvService,
  ){
    this.iniciarformulariolimpio();

    this.isLoading = false;
    // this.UID.user$.subscribe(user => {
    //   this.userId = user ? user.uid : null;

    //   this._firestore.getDocumentRealTime('politicaSeguridadVial/', this.userId)
    //   .subscribe({
    //     next: (data) => {
    //       //console.log('Datos en tiempo real:', data);
    //       this.documentData = data; // Almacenamos los datos en el componente
    //     },
    //     error: (error) => {
    //       console.error('Error al recibir datos:', error);
    //     },
    //   });
    
    //     // El usuario ha sido autenticado
    // });

  }

  ngOnInit(): void {

    this.id_formulario = sessionStorage.getItem('id_formulario_politica_s_vial') || "0";
    console.log(this.userId+" aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    if (this.id_formulario !== "0"){

      // setTimeout(() => {
      //   if (this.modalOkCancelar) {
      //     this.modalOkCancelar.abrirModal(); // este modal se apoya en ViewChild que llama 2 metodos del padre segun su respuesta
      //   }
      // }, 0);
      console.log('Se encontro un Documento perndiente Desea continuar "SI" Descartar "NO" ')
    }

    AOS.init();
    
  }

  iniciarformulariolimpio() {
    this.form = this.fb.group({
   
      fechaDocumento: ['', Validators.required]
      
    });
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      
    }, 200);

    if(this.openTab > 1 && this.openTab < 4){ //autoguardado

      if(this.openTab == 2){ //crear fomulario o carga autoguardado o carga editable

        if (this.id_formulario !== "0") { //existe session de id_formulario creada?
          //this.cargarFormulario(id_formulario);
          const dataCruda = await this._politicaSeguVial.getfomularioEdit(this.id_formulario);

          console.log("datacrudaaaaaaaaaaa",dataCruda);
          
          this.form.patchValue(dataCruda);
          
        }else{
          //creo el id_formulario por primera vez
          sessionStorage.setItem('id_formulario_politica_s_vial', Date.now().toString());
          this.id_formulario = sessionStorage.getItem('id_formulario_politica_s_vial') as string ;

        }

        
      }

      if (porce === "Avanza") {
        this.porcentaje = Math.min(this.porcentaje + 20, 100);  // aumenta el porcentaje de barra IMPORTANTE INICIA EN 0
        this.pasoPaso.nextStep();  //  ESTOS SON METODOS LLAMADOS POR @ViewChild del componenten pasopaso
      } else if(porce === "Atras") {
        this.porcentaje = Math.max(this.porcentaje - 20, 0);
        this.pasoPaso.prevStep(); //  ESTOS SON METODOS LLAMADOS POR @ViewChild del componenten pasopaso
      }

      //console.log("porcentaje" + this.form.value +"porcentaje" );

      this._politicaSeguVial.autoGuardar(this.form.value,"Asistente",this.porcentaje,this.id_formulario ?? "");
      console.log("todododododo",this.form.value);

      
      
    }


  }

  // Método para enviar el formulario (para procesar todos los datos)
  async onSubmit(){

    if (this.form.valid) {
    
      this.crearPdf.generatePdf(true);
      this.porcentaje = 100;
      this.toggleTabs(3,"no"); // "no" aplica una esepcion para no usar el metodo autoGuardar ya que generar 
      this.borroSessionIdFormulario();

      


    }else{
      this.form.markAllAsTouched();
    }
  }

  async vistaPrevia(){

    if (this.form.valid) {

      await this._politicaSeguVial.autoGuardar(this.form.value,"Asistente",100,this.id_formulario ?? "");
      this.crearPdf.generatePdf(true);

    }else{
      this.form.markAllAsTouched();
    }

    
  } 


  borroSessionIdFormulario(){
    sessionStorage.removeItem('id_formulario_politica_s_vial');//
    this.id_formulario = "0";
  }

  irdashboard(){

    this.router.navigate(['admin/dashboardplanificar']);

  }



}
