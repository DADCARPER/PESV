import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/shared/firestore.service';
import { Router } from "@angular/router";
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import AOS from 'aos';
import { Models } from '../../../interfaces/models';
import { AuthenticacionService } from '../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../services/shared/alerta.service';
import { AlertaInformativoComponent } from '../../alertas/alerta-informativo/alerta-informativo.component';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertaInformativoComponent],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit, OnDestroy {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _router = inject(Router);
  public _alerta = inject(AlertaService);

  private authSubscription: { unsubscribe(): void } | null = null;

  userId: string = '';
  nivelAcceso: string = 'basico';
  nombreEmpresa: string = '';
  openTab = 1;
  periodo: number = new Date().getFullYear();
  resultado: string | null = null;

  form = {
    actividad: '',
    vehiculos: 0,
    conductores: '',
    numConductores: null as number | null,
    vehiculosTerceros: '',
  };

  ngOnInit() {
    this.authSubscription = this._auth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.llamarempresa();
      }
    });
    AOS.init();
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  async llamarempresa() {
    const doc = await this._firestore.getDocument<Models.Users.Usuario>('users/' + this.userId);
    if (doc.exists()) {
      this.nombreEmpresa = doc.data().nombreEmpresa;
    }
  }

  async onSubmit() {
    const { actividad, vehiculos, numConductores } = this.form;
    const c = numConductores ?? 0;

    if (actividad === 'transporte') {
      if (vehiculos > 50 || c > 50) {
        this.resultado = 'Nivel Avanzado: Empresas dedicadas al transporte automotor con más de 50 vehículos o conductores.';
        this.nivelAcceso = 'avanzado';
      } else if (vehiculos > 20 || c > 20) {
        this.resultado = 'Nivel Estándar: Empresas dedicadas al transporte automotor con una flota de entre 20 y 50 vehículos o entre 20 y 50 conductores.';
        this.nivelAcceso = 'medio';
      } else {
        this.resultado = 'Nivel Básico: Empresas dedicadas al transporte automotor con una flota de entre 0 o 11 y 19 vehículos o entre 2 y 19 conductores.';
        this.nivelAcceso = 'basico';
      }
    } else if (actividad === 'otra') {
      if (vehiculos > 100 || c > 100) {
        this.resultado = 'Nivel Avanzado: Organizaciones no relacionadas con el transporte, con más de 100 vehículos o conductores.';
        this.nivelAcceso = 'avanzado';
      } else if (vehiculos > 50 || c > 50) {
        this.resultado = 'Nivel Estándar: Organizaciones no relacionadas con el transporte, con una flota de entre 50 y 100 vehículos o entre 50 y 100 conductores.';
        this.nivelAcceso = 'medio';
      } else {
        this.resultado = 'Nivel Básico: Organizaciones no relacionadas con el transporte, con una flota de entre 11 y 49 vehículos o entre 2 y 49 conductores.';
        this.nivelAcceso = 'basico';
      }
    }

    try {
      await this._firestore.updateDocument('users/' + this.userId, {
        nivelAcceso: this.nivelAcceso,
        periodo: [this.periodo],
        encuestas: {
          actividad: this.form.actividad,
          numVehiculos: this.form.vehiculos.toString(),
          contrataConductores: this.form.conductores,
          numConductores: this.form.numConductores?.toString() ?? null,
          vehiculosTerceros: this.form.vehiculosTerceros,
        }
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar los datos';
      console.error('[Registro] onSubmit:', error);
      this._alerta.showError(msg);
    }
  }

  async toggleTabs(tabNumber: number) {
    this.openTab = tabNumber;
    setTimeout(() => { AOS.refresh(); }, 200);
    if (tabNumber === 6) {
      await this.onSubmit();
    }
  }

  irdashboard() {
    this._router.navigate(['admin/dashboard']);
  }
}
