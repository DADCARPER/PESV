import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { CATEGORIAS } from '../data/categorias-data'; // Importa tu archivo de categorías
import { Timestamp } from 'firebase/firestore'; // Para manejar fechas correctamente

export interface Archivo {
  category: string;
  fileName: string;
  fileType: string;
  fileURL: string;
  uploadedAt: Date;
}

export interface CategoriaAgrupada {
  category: string;
  nombre: string;
  totalArchivos: number;
  archivos: Archivo[];
}

@Injectable({
  providedIn: 'root',
})
export class ArchivoService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  // Obtener categorías filtradas por nivel de acceso del usuario
  async getCategoriasUsuario(): Promise<any[]> {
    const user = this.auth.currentUser;

    if (user) {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const nivelAcceso = data ? data['nivelAcceso'] : 'basico'; // Obtener el nivel de acceso del usuario

        // Filtrar las categorías según el nivel de acceso
        return this.filtrarCategoriasPorNivel(nivelAcceso);
      }
    }

    return [];
  }

  // Obtener categorías filtradas por nivel y combinadas con archivos subidos (para tabla de archivos)
  async getArchivosUsuarioLogueado(): Promise<CategoriaAgrupada[]> {
    const user = this.auth.currentUser;

    if (user) {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const nivelAcceso = data ? data['nivelAcceso'] : 'basico'; // Obtener el nivel de acceso del usuario

        // Filtrar las categorías según el nivel de acceso
        const categoriasFiltradas = this.filtrarCategoriasPorNivel(nivelAcceso);

        // Obtener los archivos subidos y mapearlos a la interfaz `Archivo`
        const archivosSubidos: Archivo[] = (data ? data["uploadedFiles"] || [] : []).map((archivo: any) => ({
          category: archivo.category,
          fileName: archivo.fileName,
          fileType: archivo.fileType,
          fileURL: archivo.fileURL,
          uploadedAt: archivo.uploadedAt instanceof Timestamp ? archivo.uploadedAt.toDate() : archivo.uploadedAt
        }));

        // Combinar las categorías filtradas con los archivos correspondientes
        const categoriasConArchivos = categoriasFiltradas.map((categoria) => {
          const archivosDeCategoria = archivosSubidos.filter(archivo => archivo.category === categoria.id);
          return {
            category: categoria.id,
            nombre: categoria.nombre,
            totalArchivos: archivosDeCategoria.length,
            archivos: archivosDeCategoria
          };
        });

        return categoriasConArchivos;
      }
    }

    return []; // Si no hay usuario autenticado o no hay datos
  }

  // Función que filtra las categorías según el nivel de acceso del usuario
  private filtrarCategoriasPorNivel(nivelAcceso: string): any[] {
    if (nivelAcceso === 'basico') {
      return CATEGORIAS.filter(
        (categoria) => categoria.nivel === 'basico'
      );
    } else if (nivelAcceso === 'medio') {
      return CATEGORIAS.filter(
        (categoria) => categoria.nivel === 'basico' || categoria.nivel === 'medio'
      );
    } else {
      return CATEGORIAS; // Avanzado puede ver todas las categorías
    }
  }

  // Función para actualizar el nivel de acceso del usuario actual
  async actualizarNivelAcceso(nuevoNivel: string): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      try {
        await updateDoc(userDocRef, { nivelAcceso: nuevoNivel });
        console.log(`Nivel de acceso actualizado a: ${nuevoNivel}`);
      } catch (error) {
        console.error("Error al actualizar el nivel de acceso:", error);
      }
    } else {
      console.error("No hay usuario autenticado.");
    }
  }
}
