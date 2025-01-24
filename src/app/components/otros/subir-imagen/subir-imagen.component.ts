import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FirestoreService } from '../../../services/firestore.service';
import { LoginService } from '../../../services/login.service';
import { SignalsService } from '../../../services/signals.service';

@Component({
  selector: 'app-subir-imagen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subir-imagen.component.html',
  styleUrl: './subir-imagen.component.css'
})
export class SubirImagenComponent {

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploading = false;
  uploadProgress = 0;
  errorMessage = '';

  constructor(
    private firestoreService: FirestoreService,
    private loginService: LoginService,
    private signalsimagen: SignalsService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar el tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor, selecciona una imagen válida';
        return;
      }

      // Validar el tamaño del archivo (por ejemplo, máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'La imagen no debe superar los 2MB';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadImage() {
    if (!this.selectedFile) return;

    const userId = this.loginService.getUserId();
    if (!userId) {
      this.errorMessage = 'No hay usuario autenticado';
      return;
    }

    try {
      this.uploading = true;
      
      // Crear la ruta para el archivo en Storage
      const path = `uploads/${userId}/perfil/${this.selectedFile.name}`;
      
      // Subir archivo y obtener URL
      const url = await this.firestoreService.uploadFileProgreso(
        path,
        this.selectedFile,
        (progress) => {
          this.uploadProgress = Math.round(progress);
        }
      );

      // Actualizar URL en Firestore
      await this.firestoreService.setDocument(
        `users/${userId}`,
        { logoEmpresaURL: url }
      );

      // Actualizar el Signal
      this.signalsimagen.setLogoUrl(url);

      // Resetear el estado
      this.selectedFile = null;
      this.uploadProgress = 0;
      this.errorMessage = '';
      
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      this.errorMessage = 'Error al subir la imagen. Por favor, intenta nuevamente.';
    } finally {
      this.uploading = false;
    }
  }

}
