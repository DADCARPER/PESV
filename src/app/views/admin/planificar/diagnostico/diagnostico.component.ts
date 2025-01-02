import { Component } from '@angular/core';
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";
import { CommonModule } from '@angular/common';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import AOS from 'aos';
import { UploadArchivosComponent } from "../../../../components/otros/upload-archivos/upload-archivos.component"; // Importa AOS
import { Router } from '@angular/router';
import { FirestoreService } from '../../../../services/firestore.service';
import { LoginService } from '../../../../services/login.service';

@Component({
  selector: 'app-diagnostico',
  standalone: true,
  imports: [CommonModule, LoadingComponent, CardsBotonComponent, UploadArchivosComponent],
  templateUrl: './diagnostico.component.html',
  styleUrl: './diagnostico.component.css'
})
export class DiagnosticoComponent {

  openTab = 0;

  userId: string | null = null;
  isLoading = false; //Al terminar el modulo de ir en true

  documentData: any;

  constructor(
    private router: Router,
    private _firestore: FirestoreService,
    private UID: LoginService
  ){
    this.UID.user$.subscribe(user => {
      this.userId = user ? user.uid : null;

      this._firestore.getDocumentRealTime('006-diagnostico/', this.userId)
      .subscribe({
        next: (data) => {
          //console.log('Datos en tiempo real:', data);
          this.documentData = data; // Almacenamos los datos en el componente
        },
        error: (error) => {
          console.error('Error al recibir datos:', error);
        },
      });
    
      this.isLoading = false;  // El usuario ha sido autenticado
    });
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      
    }, 200);
  }

  irdashboard(){

    this.router.navigate(['admin/dashboardplanificar']);

  }

}
