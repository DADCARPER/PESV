import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DiagnosticoImportComponent } from "../../../../../components/importsExcel/diagnostico-import/diagnostico-import.component";
import { MapaColombiaComponent } from "../../../../../components/apexChart/mapa-colombia/mapa-colombia.component";
import { SedesComponent } from "../sedes/sedes.component";
import { SedesDiagnosticoService } from '../../../../../services/shared/sedes-diagnostico.service';
import { ContratistasComponent } from "../contratistas/contratistas.component";
import { CardStats2Component } from "../../../../../components/cards/card-stats2/card-stats2.component";
import { DonutComponent } from "../../../../../components/apexChart/donut/donut.component";
import { CrearColaboradoresComponent } from "../../../../../components/modals/crear-colaboradores/crear-colaboradores.component";
import { ImportarColaboradoresComponent } from "../../../../../components/modals/importar-colaboradores/importar-colaboradores.component";
import { ColaboradoresComponent } from "../colaboradores/colaboradores.component";
import { EncuestaParametrosComponent } from "../encuesta-parametros/encuesta-parametros.component";
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';
import { ConduccionComponent } from "../conduccion/conduccion.component";
import { MovilidadMisionalComponent } from "../movilidad-misional/movilidad-misional.component";
import { FactoresComponent } from "../factores/factores.component";
import { PieMonochromeComponent } from "../../../../../components/apexChart/pie-monochrome/pie-monochrome.component";
import { DashboardComponent } from "../../../dashboard/dashboard.component";
import { CardDashboardComponent } from "../../../../../components/cards/card-dashboard/card-dashboard.component";
import { CardsMedicionBarraProgresoComponent } from "../../../../../components/cards/cards-medicion-barra-progreso/cards-medicion-barra-progreso.component";
import { ServiciosComponent } from "../servicios/servicios.component";
import { ProgresoService } from '../../../../../services/shared/progreso.service';
import { CountUp } from 'countup.js';

@Component({
  selector: 'app-dashboardiagnostico',
  standalone: true,
  imports: [CommonModule, RouterLink, DiagnosticoImportComponent, MapaColombiaComponent, SedesComponent, ContratistasComponent, CardStats2Component, DonutComponent, CrearColaboradoresComponent, ImportarColaboradoresComponent, ColaboradoresComponent, EncuestaParametrosComponent, ConduccionComponent, MovilidadMisionalComponent, FactoresComponent, PieMonochromeComponent, DashboardComponent, CardDashboardComponent, CardsMedicionBarraProgresoComponent, ServiciosComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboardiagnostico.component.html',
  styleUrl: './dashboardiagnostico.component.css'
})
export class DashboardiagnosticoComponent {

  private _authcations = inject(AuthenticacionService);
  private _firebaseservice = inject(FirestoreService);
  private _procesos = inject(ProgresoService);

  nit = this._authcations.getCurrentUser().displayName; //NIT DE LA EMPRESA ACTUAL
  empresa = this._authcations.getCurrentUser().photoURL; // NOMBRE DE LA EMREPSA
  uid = this._authcations.getCurrentUser().uid; //UID UNICO

  openTab = 0;

  isLoading = false; //Al terminar el modulo de ir en true

  sedes_total: string = "0";
  colaboradores_total: string = "0";
  contratistas_total: string = "0";
  vehiculos_total: string = "0";
  rutas_total: string = "0";

  val_procentaje_total: number = 0;

  num_sedes: number = 0;
  num_servicios: number = 0;
  porce_organizacional: number = 0;

  num_contratista: number = 0;
  num_conductores: number = 0;
  porce_contratistas: number = 0;

  num_empleados: number = 0;
  num_masculino: number = 0;
  num_femenino: number = 0;
  porce_colaboradores: number = 0;

  num_vehiculos: number = 0;
  num_docs: number = 0;
  porce_flota: number = 0;

  num_rutas: number = 0;
  num_pendientes: number = 0;
  porce_rutas: number = 0;

  num_brigadas: number = 0;
  num_equipos: number = 0;
  porce_emergencias: number = 0;

  datosSedes:any=[];
  datosColaboradores:any=[];
  datosContratistas:any=[];
  datos006diagnosticoencuestas:any=[];
  datosCodunccion:any=[];
  datosCodunccionMisional:any=[];
  datosRiesgosViales:any=[];
  datos006diagnosticoServicios:any=[];

  private suscrip: any;
  private suscripdatos006diagnosticoencuestas: any;
  private suscripdatos006diagnosticoServicios: any;
  private suscripdatos006diagnosticoContratistas: any;
  private suscripdatos006diagnosticoColaboradores: any;
  private suscriprogreso: any;

  

  constructor( private _sedes: SedesDiagnosticoService ) { 

  }

  async ngOnInit() {
    this.mostrarProgresoGeneral();
    this.cargarParametrosEncuesta();
    this.consultarSedes();
    //this.consultarDiagnosticoEncuestas();
    this.consultarServicios();
    this.consultarContratistas();
    this.consultarColaboradores();
    //this._procesos.actualizarProfresoModulo(this.nit, "006-diagnostico", "colaboradores", 60);
    // this.sedes = await this._sedes.getCollectionDepartamentoFirestore();
    //console.log("datosde sedes",this.sedes);
    // this.departamento = this.sedes.map((sede: any) => sede.departamento); // Extrae solo los valores de 'departamento'
    //console.log("yafinal",this.departamento);
  }

  async mostrarProgresoGeneral(){

    const path = `EstatusGeneral/${this.nit}`;
      this.suscriprogreso = this._firebaseservice.getDocumentChanges<Models.Procesos.ProcesosCarga>(path).subscribe( res => {
        const seccion = res['006-diagnostico'];
        this.val_procentaje_total = seccion['total_progreso'];
        this.porce_organizacional = seccion['InfoOrganizacional']['total'];

        new CountUp('porce-organizacional', this.porce_organizacional,  {duration: 2, suffix: '%', enableScrollSpy: true }).start();
        console.log('Empresa suscrito ->', res);
      })
  }

  async consultarSedes() {
    const nit = this._authcations.getCurrentUser().displayName;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Empresas/${nit}/006-diagnostico/${uid}/sedes`;
    let q: Models.Firebases.whereQuery[];

    q = [['estado', '==', 'Activo']];
  
    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      directionSort: 'desc',
      limit: 20,
      // group: true
    };

    this.suscrip = this._firebaseservice.getDocumentsQueryChanges<Models.Diagnostico.Sedes>(path, q, extras).subscribe(res => {
      //console.log('res => ', res);
      this.num_sedes = res.length;
      this.sedes_total = this.num_sedes.toString();
      this.datosSedes = res;

      // Extraer departamentos únicos de las sedes -->> solo se usa para graficar en el mapa
      //this.departamento = [...new Set(res.map(sede => sede.departamento))];
      //console.log('Departamentos:', this.departamento);
    });

  }
  async consultarServicios() {
    const nit = this._authcations.getCurrentUser().displayName;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Empresas/${nit}/006-diagnostico/${uid}/servicios`;
    let q: Models.Firebases.whereQuery[];
  
    q = [['estado', '==', 'Activo']];

    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      directionSort: 'desc',
      limit: 20,
      // group: true
    };

    this.suscripdatos006diagnosticoServicios = this._firebaseservice.getDocumentsQueryChanges<Models.Diagnostico.Servicio>(path, q, extras).subscribe(res2 => {
      this.num_servicios = res2.length;
      this.datos006diagnosticoServicios = res2;
      console.log('restLOL => ', res2);

    });

  }
  async consultarContratistas() {
    const nit = this._authcations.getCurrentUser().displayName;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Empresas/${nit}/006-diagnostico/${uid}/contratistas`;
    let q: Models.Firebases.whereQuery[];

    q = [['estado', '==', 'Activo']];
  
    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      directionSort: 'desc',
      limit: 20,
      // group: true
    };

    this.suscrip = this._firebaseservice.getDocumentsQueryChanges<Models.Diagnostico.Contratistas>(path, q, extras).subscribe(res => {
      //console.log('res => ', res);
      this.num_contratista = res.length;
      this.contratistas_total = this.num_contratista.toString();
      this.datosContratistas = res;
      this.num_conductores = res.reduce((suma, empresa) => suma + empresa.conductores, 0); // Recorre un array y suma el campo
      //console.log('Suma de conductores:', this.num_conductores);
    });

  }
  async consultarColaboradores() {
    const nit = this._authcations.getCurrentUser().displayName;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Empresas/${nit}/006-diagnostico/${uid}/colaboradores`;
    let q: Models.Firebases.whereQuery[];

    q = [['estado', '==', 'Activo']];
  
    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      directionSort: 'desc',
      limit: 20,
      // group: true
    };

    this.suscripdatos006diagnosticoColaboradores = this._firebaseservice.getDocumentsQueryChanges<Models.Diagnostico.Colaboradores>(path, q, extras).subscribe(res => {
      //console.log('res => ', res);
      this.num_empleados = res.length;
      this.colaboradores_total = this.num_empleados.toString();
      this.datosColaboradores = res;
      this.num_masculino = res.reduce((suma, empresa) => suma + (empresa.genero === 'Masculino' ? 1 : 0), 0); // Recorre un array y suma el campo
      this.num_femenino = res.reduce((suma, empresa) => suma + (empresa.genero === 'Femenino' ? 1 : 0), 0);
      console.log('Datos colaboradores:', res);
    });

  }

  // async consultarDiagnosticoEncuestas() {
  //   const nit = this._authcations.getCurrentUser().displayName;
  //   const uid = this._authcations.getCurrentUser().uid;
  //   const path = `Empresas/${nit}/006-diagnostico-encuestas`;
  //   // const path = 'pedidos';
  //   let q: Models.Firebases.whereQuery[];
  
  //   q = [['estado', '==', 'Activo']];
  
  //   // q = [['enable', '==', true, 'salty', '==', true], ['name', '==', 'Water']];
  //   // q = query(refCollection, where('name', 'in', ['Hotdog', 'Fish']));
  //   // q = [['name', 'in', ['Hotdog', 'Fish']]];
  //   // q = query(refCollection, where("price", ">=", 10), where("price", "<=", 20));
  //   // q = [["price", ">=", 0, "price", "<=", 6]];
  //   // const q = query(refCollectionGroup, where("state", "==", "new"));
  //   // q = [["state", "==", "new"]];
  //   // const q = query(refCollectionGroup, where('user.id', '==', '8njXZ7n0GuhJyilysXO9'), where('state', '==', 'new'));
  //   // q = [['user.id', '==', '8njXZ7n0GuhJyilysXO9']];

  //   // q = [['enable', '==', true]];
  //   // q = [['estado', '==', 'Activo', 'nit', '==', 900444555-8], ['name', '==', 'Water']];
  //   // (A * B) + (C)

  //   const extras: Models.Firebases.extrasQuery = {
  //     orderParam: 'docCreado',
  //     directionSort: 'desc',
  //     limit: 20,
  //     // group: true
  //   };

  //   this.suscripdatos006diagnosticoencuestas = this._firebaseservice.getDocumentsQueryChanges<Models.Diagnostico.Encuesta>(path, q, extras).subscribe(res => {
  //     //console.log('res => ', res);
  //     this.datosColaboradores = res;
  //     this.datos006diagnosticoencuestas = res;
  //     // FILTRAR SOLO REGISTROS COMPLETOS

  //     this.datosDonaEscolaridad(res);
  //     this.datosPieEstrato(res);
  //     // Primero filtramos los que tienen todos los campos llenos
  //     const registrosCompletos = res.filter(item => {
  //       return item.estadoVias || 
  //             item.incidentesDesplazamiento || 
  //             item.mediosTransporte.length > 0 || 
  //             item.seguridadDesplazamiento ||
  //             item.tiempoDesplazamiento;
  //     });

  //     // Luego extraemos solo los campos que necesitamos
  //     this.datosCodunccion = registrosCompletos.map(item => ({
  //       nombre: item.nombre,
  //       documento: item.documento,
  //       estadoVias: item.estadoVias,
  //       incidentesDesplazamiento: item.incidentesDesplazamiento,
  //       mediosTransporte: item.mediosTransporte,
  //       seguridadDesplazamiento: item.seguridadDesplazamiento,
  //       tiempoDesplazamiento: item.tiempoDesplazamiento
        
  //     }));

  //     // Primero filtramos los que tienen todos los campos llenos
  //     const registrosMisional = res.filter(item => {
  //       return item.conduceVehiculos || 
  //             item.tipoVehiculos.length > 0 || 
  //             item.licenciaConduccion || 
  //             item.categoriaLicencia ||
  //             item.frecuenciaConduccion ||
  //             item.experienciaConduccion ||
  //             item.usoCinturon ||
  //             item.accidenteTransito ||
  //             item.conocimientoNormas ||
  //             item.capacidadEmergencia;
  //     });

  //     // Luego extraemos solo los campos que necesitamos
  //     this.datosCodunccionMisional = registrosMisional.map(item => ({
  //       nombre: item.nombre,
  //       documento: item.documento,
  //       conduceVehiculos: item.conduceVehiculos,
  //       tipoVehiculos: item.tipoVehiculos,
  //       licenciaConduccion: item.licenciaConduccion,
  //       categoriaLicencia: item.categoriaLicencia,
  //       frecuenciaConduccion: item.frecuenciaConduccion,
  //       experienciaConduccion: item.experienciaConduccion,
  //       usoCinturon: item.usoCinturon,
  //       accidenteTransito: item.accidenteTransito,
  //       conocimientoNormas: item.conocimientoNormas,
  //       capacidadEmergencia: item.capacidadEmergencia
        
  //     }));

  //     // Primero filtramos los que tienen todos los campos llenos
  //     const registrosRiesgoVial = res.filter(item => {
  //       return item.exposicionRiesgos || 
  //             item.experienciaRiesgos || 
  //             item.situacionesRiesgo.length > 0 || 
  //             item.reporteRiesgo || 
  //             item.conocimientoReporte ||
  //             item.culturaSeguridad ||
  //             item.preparacionRiesgos ;
  //     });

  //     // Luego extraemos solo los campos que necesitamos
  //     this.datosRiesgosViales = registrosRiesgoVial.map(item => ({
  //       nombre: item.nombre,
  //       documento: item.documento,
  //       exposicionRiesgos: item.exposicionRiesgos,
  //       experienciaRiesgos: item.experienciaRiesgos,
  //       situacionesRiesgo: item.situacionesRiesgo,
  //       reporteRiesgo: item.reporteRiesgo,
  //       conocimientoReporte: item.conocimientoReporte,
  //       culturaSeguridad: item.culturaSeguridad,
  //       preparacionRiesgos: item.preparacionRiesgos
        
  //     }));

  //     //console.log('Conduccion => ', res);
  //   });

  // }

  ////////DATOS PARA GRAFICAR//////////
  // datosDonaEscolaridad(dato:any){
  //   const bachilleres = dato.filter((emp:any) => emp.escolaridad === "Bachiller");
  //   const tecnicos = dato.filter((emp:any) => emp.escolaridad === "Técnico");
  //   const tecnologos = dato.filter((emp:any) => emp.escolaridad === "Tecnólogo");
  //   const profesionales = dato.filter((emp:any) => emp.escolaridad === "Profesional");
  //   const especialistas = dato.filter((emp:any) => emp.escolaridad === "Especialista");
  //   let sumatotal = bachilleres.length+tecnicos.length+tecnologos.length+profesionales.length+especialistas.length
  //   let bac: number = parseFloat((bachilleres.length / sumatotal).toFixed(2));
  //   let tec: number = parseFloat((tecnologos.length / sumatotal).toFixed(2));
  //   let tecn: number = parseFloat((tecnologos.length / sumatotal).toFixed(2));
  //   let pro: number = parseFloat((profesionales.length / sumatotal).toFixed(2));
  //   let esp: number = parseFloat((especialistas.length / sumatotal).toFixed(2));
  //   // console.log("CONTEO INDIVIDUAL:");
  //   // console.log("Bachilleres:", bac);      // 3
  //   // console.log("Técnicos:", tec);            // 2
  //   // console.log("Tecnólogos:", tecn);        // 1
  //   // console.log("Profesionales:", pro);  // 2
  //   // console.log("Especialistas:", esp);  // 1
  //   this.datosDona = [bac,tec,tecn,pro,esp];
  // }
  // datosPieEstrato(dato:any){
  //   const estrato1 = dato.filter((emp:any) => emp.estrato === "Estrato 1");
  //   const estrato2 = dato.filter((emp:any) => emp.estrato === "Estrato 2");
  //   const estrato3 = dato.filter((emp:any) => emp.estrato === "Estrato 3");
  //   const estrato4 = dato.filter((emp:any) => emp.estrato === "Estrato 4");
  //   const estrato5 = dato.filter((emp:any) => emp.estrato === "Estrato 5");
  //   const estrato6 = dato.filter((emp:any) => emp.estrato === "Estrato 6");
  //   this.datosPie = [estrato1.length,estrato2.length,estrato3.length,estrato4.length,estrato5.length,estrato6.length];
  // }
  ////////////////////////////////////
  async cargarParametrosEncuesta() {
    const nit = this._authcations.getCurrentUser().displayName;
    const empresa = this._authcations.getCurrentUser().photoURL;
    const uid = this._authcations.getCurrentUser().uid;
    const path = `Encuestas_publicas/${nit}`;
    const doc = await this._firebaseservice.getDocument<Models.Diagnostico.encuestaParametros>(path); 
    //console.log(doc.data())
    if (!doc.exists()) {
      const archivo = { // Creo el documento por primera vez en caso de no existir
        nombreEmpresa:empresa,
        encuestaParametros:{
          mostrarEncuesta: false,
          modulo2: false,
          modulo3: false,
          modulo4: false,
          modulo5: false,
          modulo6: false
        }
      }
      try {
        await this._firebaseservice.createDocument(`Encuestas_publicas`,archivo,nit);
        //console.log('Archivo Documento guardado');
      } catch (error) {
        //console.log('Error de guardado?');
      }
    }
  }

  async toggleTabs(tabNumber: number ) {
    this.openTab = tabNumber;
  }



  ngOnDestroy(){
    if(this.suscrip) this.suscrip.unsubscribe();
    if(this.suscripdatos006diagnosticoencuestas) this.suscripdatos006diagnosticoencuestas.unsubscribe();
    if(this.suscripdatos006diagnosticoServicios) this.suscripdatos006diagnosticoServicios.unsubscribe();
    if(this.suscripdatos006diagnosticoContratistas) this.suscripdatos006diagnosticoContratistas.unsubscribe();
    if(this.suscripdatos006diagnosticoColaboradores) this.suscripdatos006diagnosticoColaboradores.unsubscribe();
    if(this.suscriprogreso) this.suscriprogreso.unsubscribe();
  }
}
