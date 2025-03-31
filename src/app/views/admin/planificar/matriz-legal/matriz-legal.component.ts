import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-matriz-legal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './matriz-legal.component.html',
  styleUrl: './matriz-legal.component.css'
})
export class MatrizLegalComponent {

  isOpen = true;

  openModal() {
    this.isOpen = true;
  }

  closeModal() {
    this.isOpen = false;
  }

}
