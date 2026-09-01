import { Component,CUSTOM_ELEMENTS_SCHEMA, inject, Input, OnChanges,  output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { Models } from '../../../../../interfaces/models';
import { FechaDiaMesAnoPipe } from '../../../../../pipes/fechafirestore.pipe';
import { Form1AddActividadesComponent } from '../form1-add-actividades/form1-add-actividades.component';
import { Form2DeleteActividadesComponent } from '../form2-delete-actividades/form2-delete-actividades.component';
import { ProgramasService } from '../programas.service';
import { Form3InsertValorActividadesComponent } from '../form3-insert-valor-actividades/form3-insert-valor-actividades.component';


@Component({
  selector: 'app-detalles-actividad',
  standalone: true,
  imports: [RouterLink, AlertaInformativoComponent, FechaDiaMesAnoPipe,Form1AddActividadesComponent,Form2DeleteActividadesComponent,CommonModule,Form3InsertValorActividadesComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA], 
  templateUrl: './detalles-actividad.component.html',
  styleUrl: './detalles-actividad.component.css'
})
export class DetallesActividadComponent implements OnChanges {

  modalFormulario = viewChild.required<Form1AddActividadesComponent>('modalFormulario');
  modalEliminar = viewChild.required<Form2DeleteActividadesComponent>('modalEliminar');
  modalInsertarValor = viewChild.required<Form3InsertValorActividadesComponent>('modalInsertarValor');

  @Input() tituloPrograma: string = '';
  @Input() objetivoPrograma: string = '';
  @Input() idDocumento: string = '';

  //signa de salida para cambiar de tab
  openTabSale = output<number>();

  //variable para controlar el tab interno
  openTab = 0;

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);
  private _route = inject(ActivatedRoute);

  public _programas = inject(ProgramasService);

  nit = this._authcations.getCurrentUser().displayName;
  private snapshot: any;
  
  // Actividades del programa
  actividades: any[] = [];
  actividadesCalendario: any[] = [];

  constructor() {
    console.log(this._programas.calcularAvance(20, 100, 3, 'Ascendente', 'Incremento'));
  }

  ngOnChanges(): void {
    this.consultarActividades();
  }

  toggleTabs(tabNumber: number) {
    this.openTab = tabNumber;
  }

  async consultarActividades() {
    //console.log('id programa enviado', this.idDocumento);
    this.actividades = [];

    //console.log('Entro a consultarDocumentos');
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/008-actividades-gestion-riesgos`;
    let q: Models.Firebases.whereQuery[];

    q = [['estado', '==', 'Activo', 'programId', '==', this.idDocumento]];

    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      // directionSort: 'asc',
      // limit: 1,
      // group: true
    };
  
    const snapshot = await this._firestore.getDocumentsQueryChanges<Models.Programas.ConsultarActividad>(path, q, extras).subscribe(res => {
      this.actividades = res;
      this.actividadesCalendario = res;
    });

    // snapshot.docs.forEach((doc: any) => {
    // const data = doc.data();
    // this.actividades.push(data);
    // });

    //console.log('Muestra actividades---->>>', this.actividadesCalendario);
    

  }

  envioTabSale(tabNumber: number) {
    this.openTabSale.emit(tabNumber);
  }

  mostrarModalFormulario(modo: any, datoaEditar: {} | string): void { /// paso el dato a editar debe ser opcional ya que solo es en caso de editar
    //console.log('id programa enviado', datoaEditar);
    this.modalFormulario().abrirModal(modo,datoaEditar);
  }

  manejarEdicion(dato: any) {
    // Aquí implementas la lógica para editar
    // Por ejemplo, abrir un modal, navegar a otra página, etc.
    //console.log('Donde diocli editar -->>>>', dato);
    this.mostrarModalFormulario("editar",dato);
  }

  manejarEliminar(idDocumento: string){
    //console.log('Donde diocli eliminar -->>>>', idDocumento);
    this.modalEliminar().abrirModal(idDocumento);
  }

  manejarInsertarValor(dato: any){
    //console.log('Donde diocli insertar valor -->>>>', dato);
    this.modalInsertarValor().abrirModal(dato);
  }

  //variables para el calendario
  // Signal para manejar la actividad seleccionada
  actividadSeleccionada = signal<Models.Programas.ConsultarActividad | null>(null)

  // Array de nombres de meses
  meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  // Métodos para manejar colores de estado
  getColorEstado(estado: string): string {
    switch (estado) {
      case "Pendiente":
        return "bg-red-500"
      case "En ejecución":
        return "bg-yellow-500"
      case "Completada":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  getTextColorEstado(estado: string): string {
    switch (estado) {
      case "Pendiente":
        return "text-red-700"
      case "En ejecución":
        return "text-yellow-700"
      case "Completada":
        return "text-green-700"
      default:
        return "text-gray-700"
    }
  }

  // Método para obtener actividades por mes
  getActividadesPorMes(mes: number): Models.Programas.ConsultarActividad[] {
    const item = this.actividadesCalendario.filter(x => Number(x.startDate?.slice(5, 7)) === mes);
    //console.log('item', item);
    return item;
    //return this.actividadesAnuales.filter((actividad) => actividad.mes === mes)
  }

  // Métodos para manejar el modal
  abrirModal(actividad: Models.Programas.ConsultarActividad): void {
    this.actividadSeleccionada.set(actividad)
  }

  cerrarModal(): void {
    this.actividadSeleccionada.set(null)
  }


  ngOnDestroy(){
    if(this.snapshot){
      this.snapshot.unsubscribe();
    }
  }

}
