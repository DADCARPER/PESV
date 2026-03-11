import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, Input, viewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { Form1CrearEditarPlanAnualComponent } from "./form1-crear-editar-plan-anual/form1-crear-editar-plan-anual.component";
import { Form2EliminarPlanAnualComponent } from "./form2-eliminar-plan-anual/form2-eliminar-plan-anual.component";
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { ProgresoService } from '../../../../services/shared/progreso.service';
import { Models } from '../../../../interfaces/models';
import { Form3DashboardPlanComponent } from "./form3-dashboard-plan/form3-dashboard-plan.component";

@Component({
  selector: 'app-plan-anual-trabajo',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent, Form1CrearEditarPlanAnualComponent, Form2EliminarPlanAnualComponent, Form3DashboardPlanComponent],
  templateUrl: './plan-anual-trabajo.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './plan-anual-trabajo.component.css'
})
export class PlanAnualTrabajoComponent implements OnInit {
  
  modalAgregarEditarFormulario = viewChild.required<Form1CrearEditarPlanAnualComponent>('modalAgregarEditarFormulario');
  modalEliminarFormulario = viewChild.required<Form2EliminarPlanAnualComponent>('modalEliminarFormulario');

  private _authcations = inject(AuthenticacionService);
  private _firebaseservice = inject(FirestoreService);
  private _procesos = inject(ProgresoService);

  @Input() datos: unknown[] = [];

  openTab = 0;
  idPlanAnualTrabajo: string = '';

  num_plantrabajo: number = 0;
  datos009plantrabajo: Models.PlanTrabajo.ConsultarPlanTrabajo[] = [];
  datos009actividades: Models.PlanTrabajo.ConsultarPlanTrabajoActividades[] = [];
  private suscripdatos009plantrabajo: { unsubscribe(): void } | null = null;

  constructor() { 
    console.log('constructor---', this.idPlanAnualTrabajo);
  }

  ngOnInit() {
    this.consultarPlanestrabajo();
  }

  async toggleTabs(tabNumber: number, idPlanAnualTrabajo?: string) {
    this.openTab = tabNumber;
    this.idPlanAnualTrabajo = idPlanAnualTrabajo;
    console.log('idPlanAnualTrabajo------>', idPlanAnualTrabajo);
  }

  async consultarPlanestrabajo(){
    const nit = this._authcations.getCurrentUser().displayName;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Empresas/${nit}/009-plan-anual-trabajo`;
    let q: Models.Firebases.whereQuery[];
  
    q = [['estado', '==', 'Activo']];

    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      directionSort: 'desc',
      //limit: 20,
      // group: true
    };

    this.suscripdatos009plantrabajo = this._firebaseservice.getDocumentsQueryChanges<Models.PlanTrabajo.ConsultarPlanTrabajo>(path, q, extras).subscribe(res2 => {
      this.num_plantrabajo = res2.length;
      this.datos009plantrabajo = res2;
      console.log('restLOL => ', res2);

    });
  }

  async consultarActividades(){
    const nit = this._authcations.getCurrentUser().displayName;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Empresas/${nit}/009-plan-anual-trabajo-actividades`;
    let q: Models.Firebases.whereQuery[];
  
    q = [['estado', '==', 'Activo']];

    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      directionSort: 'desc',
      //limit: 20,
      // group: true
    };

    const snapshot = await this._firebaseservice.getDocumentsQuery<Models.PlanTrabajo.NuevoPlanTrabajo>(path, q);
    snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    this.datos009actividades.push(data);
    });
  }

  mostrarModalFormulario(modo: 'crear' | 'editar', datoaEditar?: Models.PlanTrabajo.ConsultarPlanTrabajo): void {

    this.modalAgregarEditarFormulario().abrirModal(modo,datoaEditar);
  }

  manejarEdicion(dato: Models.PlanTrabajo.ConsultarPlanTrabajo) {
    // Aquí implementas la lógica para editar
    // Por ejemplo, abrir un modal, navegar a otra página, etc.
    //console.log('Donde diocli editar -->>>>', dato);
    this.mostrarModalFormulario("editar",dato);
  }

  manejarEliminar(plan: Models.PlanTrabajo.ConsultarPlanTrabajo){
    this.modalEliminarFormulario().abrirModal(plan);
  }

  ngOnDestroy(){
    if(this.suscripdatos009plantrabajo){
      this.suscripdatos009plantrabajo.unsubscribe();
    }
  }

}
