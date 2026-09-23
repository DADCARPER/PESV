import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { AlertaService } from '../../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { StorageService } from '../../../../../../services/shared/storage.service';
import { ANCHO_FOTO, comprimirComoTexto, comprimirImagen } from '../../../../../../data/imagenes';
import { DiagnosticoDatosService } from '../../../../../../services/shared/diagnostico-datos.service';
import { AlertaInformativoComponent } from "../../../../../../components/alertas/alerta-informativo/alerta-informativo.component";



@Component({
  selector: 'app-form1-sedes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: './form1-sedes.component.html',
  styleUrl: './form1-sedes.component.css'
})
export class Form1SedesComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject (AlertaService);

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);
  agregarsedeForm: FormGroup;

  modo : 'crear' | 'editar';
  datosEdicion: any = null;

  private _storage = inject(StorageService);
  private _datos = inject(DiagnosticoDatosService);

  /**
   * Fotografia de la sede.
   *
   * Se guarda al vuelo en cuanto se elige, no al enviar el formulario:
   * subir un archivo tarda, y hacerlo dentro del guardado dejaria al
   * usuario esperando sin saber por que.
   */
  fotoUrl = signal<string>('');
  fotoRuta = signal<string>('');
  /** Copia diminuta que se guarda con la sede y es la que imprime el informe. */
  fotoMiniatura = signal<string>('');
  subiendoFoto = signal(false);
  progresoFoto = signal(0);

  async alElegirFoto(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      this._alerta.showWarning('El archivo tiene que ser una imagen.');
      return;
    }
    // Las reglas de Storage rechazan por encima de 20 MB: mejor decirlo
    // aqui que dejar que falle la subida sin explicacion.
    if (archivo.size > 20 * 1024 * 1024) {
      this._alerta.showWarning('La imagen no puede pesar mas de 20 MB.');
      return;
    }

    this.subiendoFoto.set(true);
    this.progresoFoto.set(0);
    try {
      // Se reduce antes de subir. Una foto de telefono trae cuatro mil
      // pixeles de ancho y se muestra en un recuadro de ciento doce: subirla
      // entera es pagar almacenamiento y tiempo de subida, muchas veces desde
      // datos moviles y en una sede, por pixeles que nadie va a ver.
      const reducida = await comprimirImagen(archivo, ANCHO_FOTO);

      // El nombre lleva la hora para no pisar la anterior y para que el
      // navegador no sirva la vieja desde su cache. La extension pasa a jpg
      // porque eso es lo que sale de la compresion, diga lo que diga el
      // archivo original.
      const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg';
      const ruta = `${this._datos.ruta('sedes')}/fotos/${Date.now()}_${nombre}`;
      const url = await this._storage.uploadFileProgreso(
        ruta, reducida, (p) => this.progresoFoto.set(Math.round(p))
      );

      this.fotoUrl.set(url);
      this.fotoRuta.set(ruta);
      this.fotoMiniatura.set(await comprimirComoTexto(archivo));
    } catch (error: unknown) {
      console.error('[Form1Sedes] subir foto:', error);
      this._alerta.showError('No se pudo subir la imagen.');
    } finally {
      this.subiendoFoto.set(false);
    }
  }

  quitarFoto() {
    this.fotoUrl.set('');
    this.fotoRuta.set('');
    this.fotoMiniatura.set('');
  }


  constructor(private fb: FormBuilder){
    this.agregarsedeForm = this.fb.group({
      nombreSede: ['', [Validators.required, Validators.maxLength(80)]],
      tiposede: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.maxLength(12)]],
      email: ['', [Validators.required, Validators.email]],
      responsable: ['', [Validators.required, Validators.maxLength(80)]],
      cargoresponsable: ['', [Validators.maxLength(80)]],
      // Sin tope superior: hay sedes con miles de empleados y de vehiculos.
      // El unico limite real es que una cuenta no puede ser negativa.
      totalempleados: [0, [Validators.min(0)]],
      totalconductores: [0, [Validators.min(0)]],
      totalasignados: [0, [Validators.min(0)]],
      totaloperacion: [0, [Validators.min(0)]],
      direccion: ['', [Validators.maxLength(120)]],
      departamento: ['', [Validators.required, Validators.maxLength(50)]],
      ciudad: ['', [Validators.maxLength(50)]]
    });
  }
  

  // Método para cerrar el modal
  cerrarModal() {
    this.agregarsedeForm.reset();
    this.quitarFoto();
    this.mostrarModal.set(false);
  }

  // Método para abrir el modal
  abrirModal(modo:any, datosEditar?:{}) { // crear o editar
    this.mostrarModal.set(true);
    this.modo = modo; // cuando se abre el modal se le informa en que modo se va a ejecutar
    this.quitarFoto();
    if (modo === 'editar') {
      this.datosEdicion = datosEditar;
      this.cargarDatos();

      // La foto no va en el formulario, asi que patchValue no la recupera.
      const previa = datosEditar as {
        fotoUrl?: string; fotoRuta?: string; fotoMiniatura?: string;
      };
      this.fotoUrl.set(previa?.fotoUrl ?? '');
      this.fotoRuta.set(previa?.fotoRuta ?? '');
      this.fotoMiniatura.set(previa?.fotoMiniatura ?? '');
    }

  }

  // Método para manejar el clic en "Save Changes"
  async handleSave() {
    console.log('Todooooooo--->', this.agregarsedeForm.value)
    if (this.agregarsedeForm.valid) {
      //console.log('Formulario inválido', this.agregarsedeForm.value);   
      const path = this._datos.ruta('sedes');
      const datos = {
        ...this.agregarsedeForm.value,
        fotoUrl: this.fotoUrl(),
        fotoRuta: this.fotoRuta(),
        fotoMiniatura: this.fotoMiniatura(),
      };

      if (this.modo === 'editar') {
        try {
          await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, datos);
          this._alerta.showSuccess('Sede actualizada exitosamente.');
          this.cerrarModal();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Error al actualizar la sede';
          console.error('[Form1Sedes] editar:', error);
          this._alerta.showError(msg);
        }
      }

      if (this.modo === 'crear') {
        try {
          await this._firestore.createDocument(path, datos);
          this._alerta.showSuccess('Sede creada exitosamente.');
          this.cerrarModal();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Error al crear la sede';
          console.error('[Form1Sedes] crear:', error);
          this._alerta.showError(msg);
        }
      }

      
    }else{
      // Decir que hay algo mal sin decir donde obliga a ir campo por campo
      // adivinando. Se nombran los que fallan y se marcan en rojo.
      this.agregarsedeForm.markAllAsTouched();
      const faltan = this.camposInvalidos();
      this._alerta.showWarning(
        faltan.length
          ? `Revisa estos campos: ${faltan.join(', ')}.`
          : 'Por favor, completa el formulario correctamente.'
      );
    }

  }

  /** Nombre legible de cada campo, para poder nombrarlo en los avisos. */
  private static readonly ETIQUETAS: Record<string, string> = {
    nombreSede: 'Nombre de la sede',
    tiposede: 'Tipo de sede',
    telefono: 'Teléfono',
    email: 'Correo',
    responsable: 'Responsable',
    cargoresponsable: 'Cargo del responsable',
    totalempleados: 'Total empleados',
    totalconductores: 'Total conductores',
    totalasignados: 'Vehículos asignados',
    totaloperacion: 'Años en operación',
    direccion: 'Dirección',
    departamento: 'Departamento',
    ciudad: 'Ciudad',
  };

  /** Los campos que impiden guardar, con su nombre tal como se ve en pantalla. */
  private camposInvalidos(): string[] {
    return Object.keys(this.agregarsedeForm.controls)
      .filter((campo) => this.agregarsedeForm.get(campo)?.invalid)
      .map((campo) => Form1SedesComponent.ETIQUETAS[campo] ?? campo);
  }

  /** El campo falla y el usuario ya pasó por él: se puede marcar en rojo. */
  invalido(campo: string): boolean {
    const control = this.agregarsedeForm.get(campo);
    return !!control && control.invalid && control.touched;
  }

  // Método para manejar el clic en "Cancelar"
  handleCancel() {
    this.cerrarModal();
  }

  // Método para cargar datos cuando es edición
  cargarDatos() {
    // Cargar los datos en el formulario
    //console.log('Metodo cargar datos', this.datosEdicion.actividad)
    this.agregarsedeForm.patchValue(
      {
        nombreSede: this.datosEdicion.nombreSede,
        telefono: this.datosEdicion.telefono,
        direccion: this.datosEdicion.direccion,
        departamento: this.datosEdicion.departamento,
        ciudad: this.datosEdicion.ciudad,
        actividad: this.datosEdicion.actividad,
        email: this.datosEdicion.email,
        responsable: this.datosEdicion.responsable,
        tiposede: this.datosEdicion.tiposede,
        cargoresponsable: this.datosEdicion.cargoresponsable,
        totalempleados: this.datosEdicion.totalempleados,
        totalconductores: this.datosEdicion.totalconductores,
        totalasignados: this.datosEdicion.totalasignados,
        totaloperacion: this.datosEdicion.totaloperacion
      });
  }

  // Método para limpiar cuando es creación
  limpiarFormulario() {
    this.modo = 'crear';
    this.datosEdicion = null;
    // Limpiar el formulario
  }

  


  

}
