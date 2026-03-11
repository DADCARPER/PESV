import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar2.component.html',
  styleUrl: './sidebar2.component.css'
})
export class Sidebar2Component {
  
  // Estado del sidebar (abierto/cerrado)
  isOpen = false;
  
  // Método para alternar el sidebar
  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }
  
  // Método para cerrar el sidebar
  closeSidebar() {
    this.isOpen = false;
  }
  
  // Método para abrir el sidebar
  openSidebar() {
    this.isOpen = true;
  }
}
