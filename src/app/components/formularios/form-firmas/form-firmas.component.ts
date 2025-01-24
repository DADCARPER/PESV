import { Component, OnInit, ViewChild } from '@angular/core';
import { FirestoreService } from '../../../services/firestore.service';
import { LoginService } from '../../../services/login.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ComboselectComponent } from "../../controlesFormulario/comboselect/comboselect.component";
import { tipodocumento } from '../../../data/categorias-data';
import { FirmasService } from '../../../services/firmas.service';
import { SubirImagenComponent } from "../../otros/subir-imagen/subir-imagen.component";
import { InputImagenComponent } from "../../controlesFormulario/input-imagen/input-imagen.component";


@Component({
  selector: 'app-form-firmas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ComboselectComponent, SubirImagenComponent, InputImagenComponent],
  templateUrl: './form-firmas.component.html',
  styleUrl: './form-firmas.component.css'
})
export class FormFirmasComponent implements OnInit {


  @ViewChild(InputImagenComponent) inputImagenComponent!: InputImagenComponent;

  formPerfil: FormGroup = this.fb.group({});
  options = tipodocumento // Opciones para el desplegable IMPORT

  uid: string = '';

  constructor(
      private _firestore: FirestoreService,
      private _login: LoginService,
      private _firmas: FirmasService,
      private fb: FormBuilder
    ) {
  
      // Cargar el logo inicial
      const userId = this._login.userIdSignal();
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaa"+userId);
      if (userId) {
        this.uid = userId;
        this._firestore.getDocument(`gestor-firmas/${userId}`).then(userData => {
          if (userData && userData["logoEmpresaURL"]) {
            //this._logoimagen.setLogoUrl(userData["logoEmpresaURL"]);
            console.log("ccccccccc"+userId);
          }
        });

        console.log("eeeeeeeeeeeee"+userId); 
      }else{
        console.log("bbbbbbbbbbbbb"+userId); 
      }
  
    }

  ngOnInit() {
    this.iniciarformulariolimpio();
  }

  async onSubmit() {
    //console.log(this.formPerfil.value);
    if (this.formPerfil.valid) {

      const id = Date.now().toString();
      // Obtenemos los valores actuales del formulario
      const formValues = this.formPerfil.value;
      
      // Manejar la subida de la imagen si está presente
      if (formValues.firma) {
        
        // lógica de subida de imagen
        const cleanFileName = formValues.firma.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const nombreArchivo = Date.now() + cleanFileName;
        
        // Crear la ruta para el archivo en Storage
        const path = `uploads/${this._login.userIdSignal()}/firmas/${nombreArchivo}`;
        
        // Subir archivo y obtener URL
        const url = await this._firestore.uploadFileProgreso(
          path,
          formValues.firma
        );
        console.log('Imagen subida:', url);
        const userData = {
                ...formValues,
                firma: url, // Añadir la URL de la imagen subida
                estado: 'Activo',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
        };
        console.log('Subiendo imagen...', userData);

        const datalista = {[id]: userData};
        this._firmas.updateFirma(this.uid, datalista);
        this.iniciarformulariolimpio();

        // Resetear específicamente el componente de imagen
      if (this.inputImagenComponent) {
        this.inputImagenComponent.resetComponent();
      }
        
      }

    } else {
      console.log('Formulario inválido');
    }
  }

  iniciarformulariolimpio() {
    this.formPerfil = this.fb.group({
    
      tipodocumento: ['', Validators.required],
      numerodocumento: ['', Validators.required],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]], // Campo deshabilitado
      telefono: ['', Validators.required],
      cargoempresa: [''],
      areadepartamento: [''],
      estado: [''],
      firma: new FormControl(null, Validators.required)
      
    });
  }

  // Método para obtener el control del formulario
  //importante para el insertar select en el formulario
  get tipodocumentoControl() {
    return this.formPerfil.get('tipodocumento') as FormControl;
  }

  get imagenfirma() {
    return this.formPerfil.get('firma') as FormControl;
  }
}
