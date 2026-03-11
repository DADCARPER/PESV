import { Component, viewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar2Component } from "../../../components/sidebar2/sidebar2.component";
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-emrpesa',
  standalone: true,
  imports: [CommonModule, Sidebar2Component, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './emrpesa.component.html',
  styleUrl: './emrpesa.component.css'
})
export class EmrpesaComponent {

  slidebar = viewChild.required<Sidebar2Component>('abrirSliderbar');
  
  // Propiedades para el navbar
  isMobileMenuOpen = false;
  currentUser = {
    name: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  };

  // Estadísticas del dashboard
  dashboardStats = {
    totalEmpleados: 1234,
    indicadores: 85,
    alertas: 3,
    documentos: 156
  };

  // Método para alternar el menú móvil
  toggleMobileMenu() {
    this.slidebar().toggleSidebar();
    // this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Método para cerrar el menú móvil
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  // Método para manejar la búsqueda
  onSearch(event: any) {
    const searchTerm = event.target.value;
    console.log('Buscando:', searchTerm);
    // Aquí puedes implementar la lógica de búsqueda
  }

  // Método para manejar las notificaciones
  onNotificationsClick() {
    console.log('Notificaciones clickeado');
    // Aquí puedes implementar la lógica de notificaciones
  }

  // Método para manejar los mensajes
  onMessagesClick() {
    console.log('Mensajes clickeado');
    // Aquí puedes implementar la lógica de mensajes
  }

  // Método para manejar el perfil de usuario
  onProfileClick() {
    console.log('Perfil clickeado');
    // Aquí puedes implementar la lógica del perfil
  }
}
