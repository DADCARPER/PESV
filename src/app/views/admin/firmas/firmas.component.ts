import { Component, OnInit, computed, signal, OnDestroy } from '@angular/core';
import { FormFirmasComponent } from "../../../components/formularios/form-firmas/form-firmas.component";
import { TablaSimpleComponent } from "../../../components/tablas/tabla-simple/tabla-simple.component";
import { FirestoreService } from '../../../services/firestore.service';
import { LoginService } from '../../../services/login.service';
import { Integrante, TableHeader } from '../../../interfaces/perfil.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-firmas',
  standalone: true,
  imports: [CommonModule,FormFirmasComponent, TablaSimpleComponent],
  templateUrl: './firmas.component.html',
  styleUrl: './firmas.component.css'
})
export class FirmasComponent implements OnInit, OnDestroy {

  // Signals para estado reactivo
  private integrantesSignal = signal<Integrante[]>([]);
  public integrantes = computed(() => this.integrantesSignal());
  public loading = signal(false);
  public editingIntegrante = signal<Integrante | null>(null);
  private subscription: any;

  tableHeaders: TableHeader[] = [
    
    { label: 'Nombres', key: 'nombres', type: 'text' },
    { label: 'Cargo', key: 'cargoempresa', type: 'text' },
    { label: 'Firma', key: 'firma', type: 'image' }
  ];

  constructor(
    private _firestore: FirestoreService,
    private _login: LoginService
  ) {}

  ngOnInit() {
    this.cargarDatosFirma();
  }

  async cargarDatosFirma() {
    this.loading.set(true);
    try {
      const userId = this._login.userIdSignal();
      if (!userId) throw new Error('Usuario no autenticado');

      // this.subscription = this._firestore.getDocumentRealTime(`gestor-firmas/`, userId)
      //   .subscribe({
      //     next: (data) => {
      //       this.integrantesSignal.set(data);
      //       this.loading.set(false);
      //     },
      //     error: (error) => {
      //       console.error('Error al cargar firmas:', error);
      //       // Aquí podrías emitir un evento de error o mostrar un mensaje
      //       this.loading.set(false);
      //     }
      //   });
    } catch (error) {
      console.error('Error:', error);
      this.loading.set(false);
    }
  }

  async handleDelete(id: string) {
    try {
      const userId = this._login.userIdSignal();
      if (!userId) throw new Error('Usuario no autenticado');
      
      //await this._firestore.deleteDocument(`gestor-firmas/${id}`, userId);
      // La tabla se actualizará automáticamente por el observable
    } catch (error) {
      console.error('Error al eliminar:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  }

  handleEdit(integrante: Integrante) {
    this.editingIntegrante.set(integrante);
  }

  handleCancel() {
    this.editingIntegrante.set(null);
  }

  handleSubmit(integrante: Integrante) {
    // Lógica para guardar o actualizar
    // ...
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
