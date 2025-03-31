import { Component, ViewChild } from '@angular/core';
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
import AOS from 'aos'; // Importa AOS
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { LiderazgoCompromisoService } from '../../../../services/liderazgo-compromiso.service';
import { PasopasoComponent } from '../../../../components/tabs/pasopaso/pasopaso.component';
import { FirestoreService } from '../../../../services/firestore.service';
import { LoginService } from '../../../../services/login.service';
import { PdfLiderazgoCompromisoComponent } from '../../../../components/pdfs/pdf-liderazgo-compromiso/pdf-liderazgo-compromiso.component';
import { UploadArchivosComponent } from "../../../../components/otros/upload-archivos/upload-archivos.component";

@Component({
  selector: 'app-liderazgo-y-compromiso',
  standalone: true,
  imports: [CommonModule, LoadingComponent, FormsModule, ReactiveFormsModule, CardsBotonComponent, PasopasoComponent, PdfLiderazgoCompromisoComponent, UploadArchivosComponent, RouterLink],
  templateUrl: './liderazgo-y-compromiso.component.html',
  styleUrl: './liderazgo-y-compromiso.component.css'
})
export class LiderazgoYCompromisoComponent {

  @ViewChild(PasopasoComponent) pasoPaso!: PasopasoComponent;
  @ViewChild(PdfLiderazgoCompromisoComponent) crearPdf!: PdfLiderazgoCompromisoComponent;


  form!: FormGroup;
  openTab = 0;

  id_formulario: string = "0";
  dataEmpresa: any = sessionStorage.getItem('empresaData');
  dataEmpresa2 = JSON.parse(this.dataEmpresa);
  porcentaje = 0;

  documentData: any;

  userId: string | null = null;
  isLoading = false; //Al terminar el modulo de ir en true

  constructor(
      private fb: FormBuilder, 
      private router: Router,
      private _liderazgoCompromiso: LiderazgoCompromisoService,
      private _firestore: FirestoreService,
      private UID: LoginService
      //private archivoService: ArchivoService, 
      //private liderDelPesvService: LiderDelPesvService,
    ){
      this.iniciarformulariolimpio();
  
      // this.UID.user$.subscribe(user => {
      //   this.userId = user ? user.uid : null;
  
      //   this._firestore.getDocumentRealTime('liderazgoCompromiso/', this.userId)
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

    AOS.init();
    
  }

  iniciarformulariolimpio() {
    this.form = this.fb.group({
   
      //fechaDocumento: ['', Validators.required],
      objetivo1: [false],
      objetivo2: [false],
      objetivo3: [false],
      objetivo4: [false],
      objetivo5: [false],
      objetivo6: [false],
      objetivo7: [false],
      objetivo8: [''],
      
    });
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      
    }, 200);

    if(this.openTab > 1 && this.openTab < 3){ //autoguardado

      if(this.openTab == 2){ //crear fomulario o carga autoguardado o carga editable

        if (this.id_formulario !== "0") { //existe session de id_formulario creada?
          //this.cargarFormulario(id_formulario);
          const dataCruda = await this._liderazgoCompromiso.getfomularioEdit(this.id_formulario);

          console.log("datacrudaaaaaaaaaaa",dataCruda);
          
          this.form.patchValue(dataCruda);
          
        }else{
          //creo el id_formulario por primera vez
          sessionStorage.setItem('id_formulario_liderazgo_compromiso', Date.now().toString());
          this.id_formulario = sessionStorage.getItem('id_formulario_liderazgo_compromiso') as string ;

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

      this._liderazgoCompromiso.autoGuardar(this.form.value,"Asistente",this.porcentaje,this.id_formulario ?? "");
      console.log("todododododo",this.form.value);

      
      
    }


  }

  async onSubmit(){

    if (this.form.valid) {

      console.log('Submittttt')
    
      this.crearPdf.generatePdf(true);
      this.porcentaje = 100;
      this.toggleTabs(3,"");
      // this.borroSessionIdFormulario();

      


    }else{
      this.form.markAllAsTouched();
    }
  }

  async vistaPrevia(){
    if (this.form.valid) {

      await this._liderazgoCompromiso.autoGuardar(this.form.value,"Asistente",100,this.id_formulario ?? "");
      this.crearPdf.generatePdf(true);

    }else{
      this.form.markAllAsTouched();
    }
  }

  irdashboard(){

    this.router.navigate(['admin/dashboardplanificar']);

  }

}
