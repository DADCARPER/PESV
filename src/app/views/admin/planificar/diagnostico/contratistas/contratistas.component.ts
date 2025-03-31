import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contratistas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contratistas.component.html',
  styleUrl: './contratistas.component.css'
})
export class ContratistasComponent implements OnInit {

  formcontratista: FormGroup = this.fb.group({});
  listaContratistas: any[] = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
  }

  iniciarformulariolimpio() {
    this.formcontratista = this.fb.group({
    
      nombreContratista: ['', Validators.required],
      documento: [''],
      tipoDocumento: [''],
      tipoContratista: ['', Validators.required],
      categoriaContratista: [''],
      objetivoContrato: [''],
      direccion: [''],
      telefono: [''],
      correoelectronico: [''],
      vinculacion: [''],
      estado: ['Activo'],
      fechacreacion: [new Date()],
      mostrarContratista: [true]
      
    });
  }

  onSubmitContratista() {
    console.log(this.formcontratista.value);
  }

}
