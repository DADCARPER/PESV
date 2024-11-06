import { CommonModule } from '@angular/common';
import { LoginService } from '../../../services/login.service';  // Importamos LoginService
import { Firestore, setDoc, doc } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import AOS from 'aos'; // Importa AOS
import { ArchivoService } from '../../../services/archivos.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {

  private _archivo = inject(ArchivoService);
  private _router = inject(Router);

  datosEmpresa:any;

  ngOnInit(): void {
    //Tomo datos del sessionstorage
    const objetoempresaDataString = sessionStorage.getItem('empresaData');

    if (objetoempresaDataString) {
      this.datosEmpresa = JSON.parse(objetoempresaDataString);
    
      // Ahora puedes acceder al campo email
      console.log('Email:', this.datosEmpresa.email);
    } else {
      console.log('No hay datos de empresa almacenados en sessionStorage.');
    }


    // Referente a la animacion
    AOS.init({
      duration: 1000, // Duración de las animaciones en milisegundos
      once: false,    // Las animaciones se pueden volver a ejecutar
    });
  }

  form = {
    actividad: '',
    vehiculos: 0,
    conductores: '',
    numConductores: null as number | null,
    vehiculosTerceros: '',
    pregunta1: '',
  };

  resultado: string | null = null;

  onSubmit() {

    // Lógica para categorizar la empresa
    const { actividad, vehiculos, conductores, numConductores } = this.form;

    //console.log("Hola"+" - "+actividad+" - "+vehiculos+" - "+numConductores+" - "+conductores+" - final"+" - ");

    if (actividad === 'transporte') {

      if (vehiculos > 50 || numConductores! > 50) {
        this.resultado = 'Nivel Avanzado: Empresas dedicadas al transporte automotor con más de 50 vehículos o conductores.';
        this._archivo.actualizarNivelAcceso("avanzado");
      } else if (vehiculos > 20 || numConductores! > 20) {
        this.resultado = 'Nivel Estándar: Empresas dedicadas al transporte automotor con una flota de entre 20 y 50 vehículos o entre 20 y 50 conductores.';
        this._archivo.actualizarNivelAcceso("medio");
      } else {
        this.resultado = 'Nivel Básico: Empresas dedicadas al transporte automotor con una flota de entre 0 o 11 y 19 vehículos o entre 2 y 19 conductores.';
        this._archivo.actualizarNivelAcceso("basico");
      }

    } else if (actividad === 'otra') {

      if (vehiculos > 100 || numConductores! > 100) {
        this.resultado = 'Nivel Avanzado: Organizaciones no relacionadas con el transporte, con más de 100 vehículos o conductores.';
        this._archivo.actualizarNivelAcceso("avanzado");
      }else if (vehiculos > 50 || numConductores! > 50) {
        this.resultado = 'Nivel Estándar: Organizaciones no relacionadas con el transporte, con una flota de entre 50 y 100 vehículos o entre 50 y 100 conductores.';
        this._archivo.actualizarNivelAcceso("medio");
      }else{
        this.resultado = 'Nivel Básico: Organizaciones no relacionadas con el transporte, con una flota de entre 11 y 49 vehículos o entre 2 y 49 conductores.';
        this._archivo.actualizarNivelAcceso("basico");
      }

    }
  }


  openTab = 1;
  toggleTabs(tabNumber: number) {
    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      if (tabNumber == 6){
        this.onSubmit();
      }
    }, 200); // Dale un ligero retraso para asegurarse de que el DOM se actualiza
  }

  irdashboard(){

    this._router.navigate(['admin/dashboardplanificar']);

  }

}
