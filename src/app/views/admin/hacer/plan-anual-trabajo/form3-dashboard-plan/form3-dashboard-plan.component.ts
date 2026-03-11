import { CommonModule } from '@angular/common';
import { Component, output, CUSTOM_ELEMENTS_SCHEMA, inject, viewChild, Input, signal } from '@angular/core';
import { CardStats2Component } from "../../../../../components/cards/card-stats2/card-stats2.component";
import { CardsMedicionBarraProgresoComponent } from "../../../../../components/cards/cards-medicion-barra-progreso/cards-medicion-barra-progreso.component";
import { Form4CrearEditarActividadComponent } from "../form4-crear-editar-actividad/form4-crear-editar-actividad.component";
import { Form5EliminarActividadComponent } from "../form5-eliminar-actividad/form5-eliminar-actividad.component";
import { Models } from '../../../../../interfaces/models';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FechaDiaMesAnoPipe } from '../../../../../pipes/fechafirestore.pipe';
import { ActividadesDefaulService } from '../actividades-defaul.service';
  
@Component({
  selector: 'app-form3-dashboard-plan',
  standalone: true,
  imports: [CommonModule, CardStats2Component, CardsMedicionBarraProgresoComponent, Form4CrearEditarActividadComponent, Form5EliminarActividadComponent,FechaDiaMesAnoPipe],
  templateUrl: './form3-dashboard-plan.component.html',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './form3-dashboard-plan.component.css'
})
export class Form3DashboardPlanComponent {

  //variables para controlar los modales
  modalAgregarActividades = viewChild.required<Form4CrearEditarActividadComponent>('modalAgregarActividades');
  modalEliminarActividades = viewChild.required<Form5EliminarActividadComponent>('modalEliminarActividades');

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);
  private _actividadesDefaul = inject(ActividadesDefaulService);

  @Input() idPlanAnualTrabajo: string = '';

  //signa de salida para cambiar de tab
  openTabSale = output<number>();
  //variable para controlar el tab interno
  openTab = 0;

  actividades: Models.PlanTrabajo.ConsultarPlanTrabajoActividades[] = [];
  actividadesCalendario: Models.PlanTrabajo.ConsultarPlanTrabajoActividades[] = [];
  total_actividades: number = 0;
  total_actividades_completadas: number = 0;
  total_actividades_pendientes: number = 0;
  total_actividades_vencidas: number = 0;
  alertas_notificaciones: number = 0;
  val_procentaje_total: number = 0;

  private suscripactividades: { unsubscribe(): void } | null = null;


  ngOnChanges(): void {
    this.consultarPlanAnualTrabajo();
  }

  async consultarPlanAnualTrabajo() {
    //console.log('id programa enviado', this.idDocumento);
    const nit = this._authcations.getCurrentUser().displayName;
    this.actividades = [];

    //console.log('Entro a consultarDocumentos');
    const path = `Empresas/${nit}/009-plan-anual-trabajo-actividades`;
    let q: Models.Firebases.whereQuery[];

    q = [['estado', '==', 'Activo', 'planAnualtrabajoId', '==', this.idPlanAnualTrabajo]];

    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      // directionSort: 'asc',
      // limit: 1,
      // group: true
    };
  
    this.suscripactividades = await this._firestore.getDocumentsQueryChanges<Models.PlanTrabajo.ConsultarPlanTrabajoActividades>(path, q, extras).subscribe(res => {
      this.actividades = res;
      this.actividadesCalendario = res;
      this.total_actividades = this.actividades.length;
      this.total_actividades_completadas = this.actividades.filter(x => x.status === 'Completada').length;
      this.total_actividades_vencidas = this.actividades.filter(x => x.status === 'Vencida').length;
      this.total_actividades_pendientes = this.actividades.filter(x => x.status === 'Pendiente' || x.status === 'Programada').length;
      //this.alertas_notificaciones = this.actividades.filter(x => x.alerta === true).length;
      this.val_procentaje_total = this.actividades.filter(x => x.status === 'Completada').length / this.actividades.length * 100;
      this.actualizarEstadoActividadesPlanactual();
      console.log('Muestra actividades---->>>', this.actividades);
    });

    // snapshot.docs.forEach((doc: any) => {
    // const data = doc.data();
    // this.actividades.push(data);
    // });

    
        
  }

  onToggleActividadStatus(actividad: Models.PlanTrabajo.ConsultarPlanTrabajoActividades, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const nuevoEstado: 'Completada' | 'Pendiente' | 'Programada' = checked ? 'Completada' : 'Programada';
    this.cambiarEstadoActividad(actividad.id, nuevoEstado);
  }

  cambiarEstadoActividad(idDocumento: string, nuevoEstado: 'Completada' | 'Pendiente' | 'Programada') {
    const nit = this._authcations.getCurrentUser().displayName;
    this._firestore.updateDocument(`Empresas/${nit}/009-plan-anual-trabajo-actividades/${idDocumento}`, {status: nuevoEstado});
  }

  envioTabSale(tabNumber: number) {
    this.openTabSale.emit(tabNumber);
  }

  toggleTabs(tabNumber: number) {
    this.openTab = tabNumber;
  }

  mostrarModalFormulario(modo: 'crear' | 'editar', datoaEditar?: Models.PlanTrabajo.ConsultarPlanTrabajoActividades){ /// paso el dato a editar debe ser opcional ya que solo es en caso de editar
    //console.log('id programa enviado', datoaEditar);
    if(modo === 'crear'){
      this.modalAgregarActividades().abrirModal(modo,this.idPlanAnualTrabajo);
    }else if(modo === 'editar'){
      this.modalAgregarActividades().abrirModal(modo,datoaEditar);
    }
  }

  manejarEliminar(actividad: Models.PlanTrabajo.ConsultarPlanTrabajoActividades){
    this.modalEliminarActividades().abrirModal(actividad);
  }

  async cargarActividadesDefaul(){
    await this._actividadesDefaul.crearActividadesDefaul(this.idPlanAnualTrabajo);
  }

  async actualizarEstadoActividadesPlanactual(){
    const nit = this._authcations.getCurrentUser().displayName;
    this._firestore.updateDocument(`Empresas/${nit}/009-plan-anual-trabajo/${this.idPlanAnualTrabajo}`, {totalActividades: this.total_actividades, totalActividadesCompletadas: this.total_actividades_completadas, totalActividadesPendientes: this.total_actividades_pendientes, totalActividadesVencidas: this.total_actividades_vencidas});
  }

  ngOnDestroy(): void {
    this.suscripactividades?.unsubscribe();
  }


  ///////////////////// calendario

  // Signal para manejar la actividad seleccionada
  actividadSeleccionada = signal<Models.PlanTrabajo.ConsultarPlanTrabajoActividades | null>(null)
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
      case "Vencida":
        return "bg-red-500"
      case "Programada":
        return "bg-yellow-500"
      case "Completada":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  getTextColorEstado(estado: string): string {
    switch (estado) {
      case "Vencida":
        return "text-red-700"
      case "Programada":
        return "text-yellow-700"
      case "Completada":
        return "text-green-700"
      default:
        return "text-gray-700"
    }
  }

  // Método para obtener actividades por mes
  getActividadesPorMes(mes: number): Models.PlanTrabajo.ConsultarPlanTrabajoActividades[] {
    const item = this.actividadesCalendario.filter(x => Number(x.startDate?.slice(5, 7)) === mes);
    console.log('item', item);
    return item;
    //return this.actividadesAnuales.filter((actividad) => actividad.mes === mes)
  }

  // Métodos para manejar el modal
  abrirModal(actividad: Models.PlanTrabajo.ConsultarPlanTrabajoActividades): void {
    this.actividadSeleccionada.set(actividad)
  }

  cerrarModal(): void {
    this.actividadSeleccionada.set(null)
  }
}
