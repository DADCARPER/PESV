/**
 * Encuestas de diagnóstico definidas como datos.
 *
 * Las preguntas las fija la Resolución 40595, pero la norma cambia y cada
 * cambio obligaba a tocar el código: la encuesta vivía como un FormGroup de 57
 * controles más una plantilla de 1.642 líneas con las opciones escritas a
 * mano. Descrita así, el superadministrador puede crear y editar encuestas sin
 * que nadie recompile nada, y el formulario público se construye leyéndolas.
 */
export namespace ModelsEncuestas {

  /** Cómo se responde una pregunta, y por tanto con qué control se pinta. */
  export type TipoPregunta =
    | 'texto'
    | 'textoLargo'
    | 'numero'
    | 'fecha'
    | 'email'
    | 'telefono'
    | 'unica'
    | 'multiple';

  export interface Opcion {
    /** Lo que se guarda en la respuesta. */
    valor: string;
    /** Lo que lee el encuestado. */
    etiqueta: string;
  }

  /**
   * Hace que una pregunta solo aparezca según lo contestado en otra.
   *
   * Sin esto habría que preguntar por la licencia de conducción a quien acaba
   * de decir que no conduce.
   */
  export interface Condicion {
    /** `id` de la pregunta de la que depende. */
    pregunta: string;
    /** Se muestra cuando la respuesta es alguno de estos valores. */
    valores: string[];
  }

  export interface Pregunta {
    /**
     * Clave con la que se guarda la respuesta. Es lo único que no debería
     * cambiarse una vez publicada: las respuestas ya recogidas la usan.
     */
    id: string;
    etiqueta: string;
    /** Aclaración opcional bajo el enunciado. */
    ayuda?: string;
    tipo: TipoPregunta;
    obligatoria: boolean;
    /** Solo para `unica` y `multiple`. */
    opciones?: Opcion[];
    /** Texto que se pide al marcar una opción del estilo "Otro". */
    campoOtro?: string;
    condicion?: Condicion | null;
    /**
     * Campo de la ficha de colaborador que alimenta esta respuesta.
     *
     * Es lo que permite que quien contesta la encuesta aparezca en la Lista de
     * Colaboradores sin volver a teclear sus datos: el módulo de información
     * personal es, campo por campo, una ficha de colaborador.
     */
    mapaColaborador?: string;
  }

  export interface Modulo {
    id: string;
    titulo: string;
    descripcion?: string;
    /**
     * Un módulo fijo no se puede desactivar. Lo es el de información personal,
     * porque sin él la respuesta no identifica a nadie.
     */
    fijo: boolean;
    preguntas: Pregunta[];
  }

  /** Borrador: se edita. Publicada: en uso. Archivada: ya no se ofrece. */
  export type EstadoEncuesta = 'borrador' | 'publicada' | 'archivada';

  export interface Encuesta {
    id: string;
    nombre: string;
    descripcion: string;
    /**
     * Sube al publicar cambios. Cada respuesta guarda con qué versión se
     * contestó, para que editar una encuesta no reescriba el pasado.
     */
    version: number;
    estado: EstadoEncuesta;
    modulos: Modulo[];
    docCreado?: unknown;
    docActualizado?: unknown;
  }

  /** Lo que una empresa elige: qué encuesta usa y qué módulos activa. */
  export interface EncuestaEmpresa {
    encuestaId: string;
    /** Abierta al público. Mientras esté en falso el enlace no responde. */
    mostrarEncuesta: boolean;
    /** `id` de los módulos activos. Los fijos van siempre. */
    modulosActivos: string[];
  }
}
