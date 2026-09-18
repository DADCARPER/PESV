import { QueryDocumentSnapshot, WhereFilterOp } from "firebase/firestore";

export namespace ModelsFirebase {
    export type whereQuery = WhereFilterOp[] | string[] | any[];

    /**
     * Un tramo de una coleccion junto con lo necesario para pedir el siguiente.
     *
     * `cursor` es el ultimo documento entregado: se lo devuelves a `getPagina`
     * para continuar justo donde iba. `hayMas` evita ofrecer "cargar mas"
     * cuando ya no queda nada.
     */
    export interface Pagina<tipo> {
      datos: tipo[];
      cursor: QueryDocumentSnapshot | null;
      hayMas: boolean;
    }

    export interface extrasQuery {
      limit?: number | null;
      orderParam?: string | null;
      directionSort?: 'asc' | 'desc';
      startAfter?: any;
      group?: boolean;
    }
  
    export const defaultExtrasQuery: extrasQuery = {
      limit: null,
      orderParam: null,
      directionSort: 'asc',
      startAfter: null,
      group: false
    };
  }