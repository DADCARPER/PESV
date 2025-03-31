import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import AOS from 'aos';
import { RouterLink } from '@angular/router';
import { DiagnosticoImportComponent } from "../../../../components/importsExcel/diagnostico-import/diagnostico-import.component";
import { MapaColombiaComponent } from "../../../../components/apexChart/mapa-colombia/mapa-colombia.component";
import { SedesComponent } from "./sedes/sedes.component";
import { CardProfidComponent } from "../../../../components/cards/card-profid/card-profid.component";
import { SedesDiagnosticoService } from '../../../../services/sedes-diagnostico.service';
import { ContratistasComponent } from "./contratistas/contratistas.component";
import { CardStats2Component } from "../../../../components/cards/card-stats2/card-stats2.component";
import { DonutComponent } from "../../../../components/apexChart/donut/donut.component";
import { CrearColaboradoresComponent } from "../../../../components/modals/crear-colaboradores/crear-colaboradores.component";
import { ImportarColaboradoresComponent } from "../../../../components/modals/importar-colaboradores/importar-colaboradores.component";


@Component({
  selector: 'app-diagnostico',
  standalone: true,
  imports: [CommonModule, RouterLink, DiagnosticoImportComponent, MapaColombiaComponent, SedesComponent, CardProfidComponent, ContratistasComponent, CardStats2Component, DonutComponent, CrearColaboradoresComponent, ImportarColaboradoresComponent],
  templateUrl: './diagnostico.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './diagnostico.component.css'
})
export class DiagnosticoComponent implements OnInit {

  openTab = 2;
  modalColaborador = viewChild.required<CrearColaboradoresComponent>('modalColaborador');
  modalColaboradorImportar = viewChild.required<ImportarColaboradoresComponent>('modalColaboradorImportar');

  isLoading = false; //Al terminar el modulo de ir en true

  documentData: any;
  tituloSedes: any = [{ header: "Genero", field: "femenino" },{ header: "Frecuencia", field: "masculino" }];
  sedes: any = [];
  departamento: any = [];
  

  constructor( private _sedes: SedesDiagnosticoService ) { 
    AOS.init();
  }

  async ngOnInit() {
    this.sedes = await this._sedes.getCollectionDepartamentoFirestore();
    //console.log("datosde sedes",this.sedes);
    this.departamento = this.sedes.map((sede: any) => sede.departamento); // Extrae solo los valores de 'departamento'
    //console.log("yafinal",this.departamento);
  }

  async toggleTabs(tabNumber: number ) {
    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      
    }, 200);
  }

  creararryadepto(){
    
  }

  mostrarModalColaborador(): void {
    // Accedemos al componente hijo y llamamos a su método
    this.modalColaborador().abrirModal();
  }

  mostrarModalColaboradorImportar(): void{
    this.modalColaboradorImportar().abrirModal();
  }

}
