import { inject, Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { StorageService } from './storage.service';
import { AlertaService } from './alerta.service';
import { Models } from '../../interfaces/models';

export interface UploadDocumentoConfig {
  nit: string | null;
  empresa: string | null;
  uid: string;
  nombreModulo: string;
  event: any;
  seccion: string;
  currentDocs: any[];
  periodo: number;  // requerido — año activo del ciclo PHVA
}

@Injectable({ providedIn: 'root' })
export class GestionDocumentosService {

  private _firestore = inject(FirestoreService);
  private _storage = inject(StorageService);
  private _alerta = inject(AlertaService);

  // ---------------------------------------------------------------------------
  // UPLOAD
  // ---------------------------------------------------------------------------

  async uploadFile(config: UploadDocumentoConfig): Promise<void> {
    const { nit, empresa, uid, nombreModulo, event, seccion, currentDocs, periodo } = config;
    const file: File | undefined = event?.target?.files?.[0];

    if (!file) {
      this._alerta.showError('No se seleccionó ningún archivo.');
      return;
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    const hora = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, '-');
    const uniqueFileName = `${fecha}_${hora}_${cleanFileName}`;

    try {
      // Garantizar que el documento del periodo exista antes de subir archivos
      await this.upsertPeriodo(nit, periodo);

      const resultadoFile = await this._storage.uploadFile(
        `Empresas/${nit}/periodos/${periodo}/${nombreModulo}`, uniqueFileName, file
      );

      const archivo: Models.Documentos.Documento = {
        nombre: uniqueFileName,
        ruta: resultadoFile.ref.fullPath,
        modulo: nombreModulo,
        nitempresa: nit as string,
        nombreEmpresa: empresa as string,
        pesobytes: file.size as any,
        tipo: file.type,
        extension: file.name.split('.').pop() || '',
        uid,
        estadoVersion: 'Vigente',
        seccion,
        periodo,
      };

      const existeVigente = currentDocs.find((doc: any) => doc.estadoVersion === 'Vigente');
      if (currentDocs.length > 0 && existeVigente?.id) {
        await this.marcarHistorico(nit, nombreModulo, periodo, existeVigente.id);
      }

      await this._firestore.createDocument(
        `Empresas/${nit}/periodos/${periodo}/${nombreModulo}-documentos`, archivo
      );
      this._alerta.showSuccess('Documento creado exitosamente.');

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al subir el documento';
      console.error(`[GestionDocumentos] uploadFile (${nombreModulo}/${seccion}):`, error);
      this._alerta.showError(msg);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // PERIODO
  // ---------------------------------------------------------------------------

  /** Crea el documento del periodo si no existe. Nunca sobreescribe datos existentes. */
  async upsertPeriodo(nit: string | null, periodo: number): Promise<void> {
    const path = `Empresas/${nit}/periodos/${periodo}`;
    try {
      const snap = await this._firestore.getDocument<Models.Procesos.Periodo>(path);
      if (!snap.exists()) {
        const fechaCreacion = new Date().toISOString().split('T')[0];
        const periodoDoc: Models.Procesos.Periodo = {
          anio: periodo,
          fechaInicio: `${periodo}-01-01`,
          fechaFin: `${periodo}-12-31`,
          estado: 'activo',
          fechaCreacion,
          diagnosticoOficial: '',
          porcentajeCumplimientoActual: 0,
          responsablePESV: '',
          cerrado: false,
        };
        await this._firestore.upsertDocument(path, periodoDoc);
      }
    } catch (error: unknown) {
      console.error(`[GestionDocumentos] upsertPeriodo (${nit}/${periodo}):`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // HISTÓRICO
  // ---------------------------------------------------------------------------

  async marcarHistorico(
    nit: string | null,
    nombreModulo: string,
    periodo: number,
    idDocumento: string
  ): Promise<void> {
    const path = `Empresas/${nit}/periodos/${periodo}/${nombreModulo}-documentos/${idDocumento}`;
    try {
      await this._firestore.updateDocument(path, { estadoVersion: 'Historico' });
    } catch (error: unknown) {
      console.error(`[GestionDocumentos] marcarHistorico (${nombreModulo}/${idDocumento}):`, error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // CONSULTAS
  // ---------------------------------------------------------------------------

  async consultarDocumentos(
    nit: string | null,
    nombreModulo: string,
    periodo: number
  ): Promise<Record<string, Models.Documentos.Documento[]>> {
    return this._consultarPorVersion(nit, nombreModulo, periodo, 'Vigente');
  }

  async consultarHistorico(
    nit: string | null,
    nombreModulo: string,
    periodo: number
  ): Promise<Record<string, Models.Documentos.Documento[]>> {
    return this._consultarPorVersion(nit, nombreModulo, periodo, 'Historico');
  }

  private async _consultarPorVersion(
    nit: string | null,
    nombreModulo: string,
    periodo: number,
    estadoVersion: 'Vigente' | 'Historico'
  ): Promise<Record<string, Models.Documentos.Documento[]>> {
    // El periodo está codificado en la ruta; la query solo filtra estado y estadoVersion
    const path = `Empresas/${nit}/periodos/${periodo}/${nombreModulo}-documentos`;
    const q: Models.Firebases.whereQuery[] = [
      ['estado', '==', 'Activo', 'estadoVersion', '==', estadoVersion],
    ];

    try {
      const snapshot = await this._firestore.getDocumentsQuery<Models.Documentos.Documento>(path, q);
      const result: Record<string, Models.Documentos.Documento[]> = {};

      snapshot.docs.forEach((doc: any) => {
        const data = doc.data() as Models.Documentos.Documento;
        if (data.seccion) {
          if (!result[data.seccion]) result[data.seccion] = [];
          result[data.seccion].push(data);
        }
      });

      return result;
    } catch (error: unknown) {
      console.error(`[GestionDocumentos] consultar${estadoVersion} (${nombreModulo}):`, error);
      return {};
    }
  }
}
