import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-input-imagen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-imagen.component.html',
  styleUrl: './input-imagen.component.css'
})
export class InputImagenComponent implements OnInit {

  @Input() control!: FormControl;
  
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  errorMessage: string | null = null;

  ngOnInit() {
    // Simplemente añadir el validador requerido
    this.control.setValidators([Validators.required]);
    this.control.updateValueAndValidity();
  }

  // Método para resetear completamente el componente
  resetComponent() {
    this.previewUrl = null;
    this.selectedFile = null;
    this.errorMessage = null;
    this.control.setValue(null);
    this.control.markAsPristine();
    this.control.markAsUntouched();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validaciones de archivo PNG, tamaño y dimensiones
      if (!this.isValidPngFile(file)) {
        this.errorMessage = 'Solo se permiten archivos PNG.';
        return;
      }

      if (!this.isValidFileSize(file)) {
        this.errorMessage = 'El archivo no debe superar los 2MB.';
        return;
      }

      // Validar dimensiones de imagen
      this.validateImageDimensions(file)
        .then(isValidDimension => {
          if (isValidDimension) {
            this.selectedFile = file;
            this.createPreview(this.selectedFile);
            this.control.setValue(this.selectedFile);
            this.errorMessage = null;
          } else {
            this.errorMessage = 'La altura de la imagen no debe superar los 250px.';
          }
        });
    }
  }

  isValidPngFile(file: File): boolean {
    return file.type === 'image/png';
  }

  isValidFileSize(file: File): boolean {
    return file.size <= 2 * 1024 * 1024;
  }

  validateImageDimensions(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve(img.height <= 250);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  createPreview(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }


}
