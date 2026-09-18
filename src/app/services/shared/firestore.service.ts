import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, onSnapshot, collection, getDocs, serverTimestamp, updateDoc, deleteDoc, DocumentSnapshot, QuerySnapshot, QueryDocumentSnapshot, collectionGroup, docData, collectionData, where, and, or, query, limit, orderBy, startAfter, getCountFromServer, getAggregateFromServer, sum } from '@angular/fire/firestore';
import { Models } from '../../interfaces/models';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  _firestore: Firestore = inject(Firestore);

  /**
   * Emite la ruta de cada escritura confirmada.
   *
   * Quien muestra una lista que ya no está suscrita en tiempo real necesita
   * enterarse de que alguien acaba de crear, editar o borrar algo. Avisar aquí
   * evita tener que propagar un evento por cada formulario y cada modal: la
   * escritura pasa toda por este servicio, así que este es el único sitio que
   * se entera siempre.
   */
  private _escrituras = new Subject<string>();
  readonly escrituras = this._escrituras.asObservable();

  constructor() {

  }

  //-- CREATE DOCUMENTO--

  async createDocument<tipo>(path: string, data: tipo, id: string | null = null) {
    let refDoc;
    if (id){
      refDoc = doc(this._firestore,`${path}/${id}`);
    }else{
      const refCollection = collection(this._firestore, path);
      refDoc = doc(refCollection); 
    }
    //console.log('---->>>',refDoc)
    const dataDoc: any = data;
    dataDoc.id = refDoc.id;
    dataDoc.docCreado = serverTimestamp();
    dataDoc.estado = "Activo";
    await setDoc(refDoc, dataDoc);
    this._escrituras.next(path);
  }

  //-- CREATE DEVOLVER ID--

  async createDocumentDevolverId<tipo>(path: string, data: tipo, id: string | null = null) {
    let refDoc;
    if (id){
      refDoc = doc(this._firestore,`${path}/${id}`);
    }else{
      const refCollection = collection(this._firestore, path);
      refDoc = doc(refCollection); 
    }
    //console.log('---->>>',refDoc)
    const dataDoc: any = data;
    dataDoc.id = refDoc.id;
    dataDoc.docCreado = serverTimestamp();
    dataDoc.estado = "Activo";
    await setDoc(refDoc, dataDoc);
    this._escrituras.next(path);
    return dataDoc ;
  }


  //-- ACTUALIZAR (requiere que el documento exista)

  async updateDocument(path: string, data: any) {
    const refDoc = doc(this._firestore, path);
    data.docActualizado = serverTimestamp();
    await updateDoc(refDoc, data);
    this._escrituras.next(path);
  }

  //-- CREAR O ACTUALIZAR (upsert — funciona aunque el documento no exista)

  async upsertDocument(path: string, data: any) {
    const refDoc = doc(this._firestore, path);
    data.docActualizado = serverTimestamp();
    await setDoc(refDoc, data, { merge: true });
    this._escrituras.next(path);
  }

  //-- DELETE

  async deleteDocument(path: string) {
    const refDoc = doc(this._firestore, path);
    await deleteDoc(refDoc);
    this._escrituras.next(path);
  }
  

  //-- LEER UN DOCUMENTO INSTANTANEO

  async getDocument<tipo>(path: string) {
    const document = doc(this._firestore, path);
    return await getDoc(document) as DocumentSnapshot<tipo>;
  }

  //-- LEER MUCHOS DOCUMENTOS INSTANTANEO
  //Si group es true, hace una consulta a un collection group (subcolecciones con el mismo nombre en distintos documentos).
  async getDocuments<tipo>(path: string, group: boolean = false) {
    if (!group) {
      const refCollection = collection(this._firestore, path);
      return await getDocs(refCollection) as QuerySnapshot<tipo>;
    } else {
      const refCollectionGroup = collectionGroup(this._firestore, path);
      return await getDocs(refCollectionGroup) as QuerySnapshot<tipo>;
    }
  }
  

  //-- LEER UN DOCUMENTO SUSCRITO - TIEMPOREAL

  getDocumentChanges<tipo>(path: string) {
    const refDocument = doc(this._firestore, path);
    return docData(refDocument) as Observable<tipo>;
  }
  
  //-- LEER MUCHOS DOCUMENTOS SUSCRITO - TIEMPOREAL
  //Si group es true, hace una consulta a un collection group (subcolecciones con el mismo nombre en distintos documentos).
  getDocumentsChanges<tipo>(path: string, group: boolean = false) {
    if (!group) {
      const refCollection = collection(this._firestore, path);
      return collectionData(refCollection) as Observable<tipo[]>;
    } else {
      const refCollectionGroup = collectionGroup(this._firestore, path);
      return collectionData(refCollectionGroup) as Observable<tipo[]>;
    }
  }

  //-- QUERY

  async getDocumentsQuery<tipo>(
    path: string, 
    querys: Models.Firebases.whereQuery[], 
    extras: Models.Firebases.extrasQuery = Models.Firebases.defaultExtrasQuery
  ) {
    //console.log('getDocumentsQueryChanges()');
    let ref: any;
    if (!extras.group) {
      ref = collection(this._firestore, path);
    } else {
      ref = collectionGroup(this._firestore, path);
    }
  
    // q = [
    //   ['enable', '==', true, 'salty', '==', true],
    //   ['name', '==', 'Water']
    // ];
    let ors: any = [];
    querys.forEach((row) => {
      let wheres: any = [];
      for (let col = 0; col < row.length; col = col + 3) {
        wheres.push(where(row[col], row[col + 1], row[col + 2]));
      }
      const AND = and(...wheres);
      ors.push(AND);
    });
    let q = query(ref, or(...ors));

    // limit
    if (extras.limit) {
      q = query(q, limit(extras.limit));
    }

    // orderBy
    if (extras.orderParam) {
      q = query(q, orderBy(extras.orderParam, extras.directionSort));
    }

    // startAfter
    if (extras.startAfter) {
      q = query(q, orderBy(extras.startAfter));
    }

    return await getDocs(q) as QuerySnapshot<tipo>;

  }

  getDocumentsQueryChanges<tipo>(
    path: string, 
    querys: Models.Firebases.whereQuery[], 
    extras: Models.Firebases.extrasQuery = Models.Firebases.defaultExtrasQuery
  ) {
    //console.log('getDocumentsQueryChanges()');
    let ref: any;
    if (!extras.group) {
      ref = collection(this._firestore, path);
    } else {
      ref = collectionGroup(this._firestore, path);
    }
  
    // q = [
    //   ['enable', '==', true, 'salty', '==', true],
    //   ['name', '==', 'Water']
    // ];
    let ors: any = [];
    querys.forEach((row) => {
      let wheres: any = [];
      for (let col = 0; col < row.length; col = col + 3) {
        wheres.push(where(row[col], row[col + 1], row[col + 2]));
      }
      const AND = and(...wheres);
      ors.push(AND);
    });
    let q = query(ref, or(...ors));

    // limit
    if (extras.limit) {
      q = query(q, limit(extras.limit));
    }

    // orderBy
    if (extras.orderParam) {
      q = query(q, orderBy(extras.orderParam, extras.directionSort));
    }

    // startAfter
    if (extras.startAfter) {
      q = query(q, orderBy(extras.startAfter));
    }

    return collectionData(q) as Observable<tipo[]>;
  }


  //-- FILTRO COMPARTIDO

  /**
   * Traduce el formato `[['campo','==',valor], ...]` que usa el proyecto al
   * filtro de Firestore. Cada fila interna se une con AND y las filas entre si
   * con OR.
   *
   * Con una sola fila devuelve el AND pelado en lugar de envolverlo en un OR
   * de un solo termino: la consulta resultante es una conjuncion normal y le
   * bastan los indices de campo simple, mientras que una disyuncion obliga a
   * crear un indice compuesto para cada combinacion.
   */
  private construirFiltro(querys: Models.Firebases.whereQuery[]) {
    const ors = querys.map((row) => {
      const wheres = [];
      for (let col = 0; col < row.length; col = col + 3) {
        wheres.push(where(row[col], row[col + 1], row[col + 2]));
      }
      return and(...wheres);
    });
    return ors.length === 1 ? ors[0] : or(...ors);
  }


  //-- CONTAR SIN DESCARGAR

  /**
   * Cuenta los documentos que cumplen la consulta sin traerlos.
   *
   * Firestore cobra una lectura por cada 1000 documentos contados, asi que el
   * total exacto sale practicamente gratis. Sustituye a sacar el numero de
   * `res.length` sobre una consulta con `limit`, que devolvia el tope en lugar
   * del total: una empresa con 300 colaboradores mostraba 20.
   */
  async contarDocumentos(
    path: string,
    querys: Models.Firebases.whereQuery[] = []
  ): Promise<number> {
    const ref = collection(this._firestore, path);
    const q = querys.length ? query(ref, this.construirFiltro(querys)) : query(ref);
    const snap = await getCountFromServer(q);
    return snap.data().count;
  }


  //-- SUMAR UN CAMPO SIN DESCARGAR

  /**
   * Suma un campo numérico de todos los documentos que cumplen la consulta,
   * sin traerlos. Cuesta lo mismo que contarlos.
   *
   * Es la alternativa a recorrer la coleccion con `reduce`, que solo da el
   * total correcto si antes se descargo entera.
   */
  async sumarCampo(
    path: string,
    campo: string,
    querys: Models.Firebases.whereQuery[] = []
  ): Promise<number> {
    const ref = collection(this._firestore, path);
    const q = querys.length ? query(ref, this.construirFiltro(querys)) : query(ref);
    const snap = await getAggregateFromServer(q, { total: sum(campo) });
    return snap.data().total ?? 0;
  }


  //-- UNA PAGINA DE RESULTADOS

  /**
   * Devuelve un tramo de la coleccion y el cursor para pedir el siguiente.
   *
   * Es la forma de recorrer colecciones que pueden tener miles de documentos
   * (colaboradores, vehiculos) sin descargarlas enteras ni recortarlas con un
   * `limit` que esconde lo que no cabe.
   *
   * Pide un documento de mas que el tamano solicitado para saber si queda algo
   * despues, y lo descarta antes de devolver la pagina.
   *
   * Ojo con `orderParam`: Firestore deja fuera del resultado, sin avisar, los
   * documentos que no tengan ese campo.
   */
  async getPagina<tipo>(
    path: string,
    querys: Models.Firebases.whereQuery[],
    extras: Models.Firebases.extrasQuery = Models.Firebases.defaultExtrasQuery,
    cursor: QueryDocumentSnapshot | null = null
  ): Promise<Models.Firebases.Pagina<tipo>> {
    const ref = collection(this._firestore, path);

    const partes: any[] = [];
    if (querys.length) partes.push(this.construirFiltro(querys));
    if (extras.orderParam) partes.push(orderBy(extras.orderParam, extras.directionSort));
    if (cursor) partes.push(startAfter(cursor));

    const tamano = extras.limit ?? 50;
    partes.push(limit(tamano + 1));

    const snap = await getDocs(query(ref, ...partes)) as QuerySnapshot<tipo>;

    const hayMas = snap.docs.length > tamano;
    const docs = hayMas ? snap.docs.slice(0, tamano) : snap.docs;

    return {
      datos: docs.map((d) => d.data()),
      cursor: docs.length ? docs[docs.length - 1] : null,
      hayMas,
    };
  }

}
