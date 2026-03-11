export namespace ModelDocumentos {

    export interface Documento{
        id?: string;               // Opcional, porque normalmente lo genera Firebase
        nombre : string;
        nombrePDf?: string;        // Nombre en PDFs generados por el asistente (legacy)
        ruta : string;
        rutaPublica?: string;      // Ruta pública del archivo subido
        URL?: string;              // URL pública en documentos legacy del asistente
        docCreado? : string;
        estado? : string;
        estadoVersion? : string;
        modulo : string;
        nitempresa : string;
        nombreEmpresa: string;
        pesobytes: string;
        tipo: string;
        extension: string;
        uid: string;
        seccion?: string; // Seccion de una pagina ejemplo: "1.Documento de Identificación, 2.Acta de Designación del Líder del PESV"
        periodo?: number;
    }

}