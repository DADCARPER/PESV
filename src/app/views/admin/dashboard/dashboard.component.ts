import { Component, OnInit, inject } from "@angular/core";
import { CardSettingsComponent } from "../../../components/cards/card-settings/card-settings.component";
import { CardTableComponent } from "../../../components/cards/card-table/card-table.component";
import { CardTarjetaComponent } from "../../../components/cards/card-tarjeta/card-tarjeta.component";
import { FirestoreService } from "../../../services/shared/firestore.service";
import { Models } from "../../../interfaces/models";
import { arrayUnion, increment } from "@angular/fire/firestore";
import { StorageService } from "../../../services/shared/storage.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CardSettingsComponent, CardTableComponent, CardTarjetaComponent],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {

  private _firebaseservice = inject(FirestoreService);
  private _fireStorage = inject(StorageService);

  constructor() {}

  ngOnInit() {
     //this.guardarEmpresa();
    // this.updateEmpresa('900444555-8');
    //this.getProducts();
    // this.getProductsRxjs();
    //this.consultar();
  }

  async guardarEmpresa() {
    const archivo: Models.Empresa.NuevaEmpresa = {
      nombre: 'VitrinaWeb',
      nit: '900788665-8',
      direccion: 'Cra 56 W # 43',
      ciudad: 'Bucaramanga',
      departamento: 'Santander',
      telefono: '3185323605',
      email: 'vitrina@gmail.com',
      representanteLegal: 'david carvajal pernett',
      estado: 'Activo'
    }
    try {
      await this._firebaseservice.createDocument<Models.Empresa.NuevaEmpresa>('Empresas',archivo,'900444555-5');
      console.log('Archivo Documento guardado');
    } catch (error) {
      console.log('Error de guardado');
    }
  }


  async updateEmpresa(id:string) {
    console.log('Actualizar empresa');
    const path = 'Empresas/' + id;
    const updateDoc = {
      stock: arrayUnion("nuevo3"),
    }
  
    try {
      await this._firebaseservice.updateDocument(path, updateDoc);
      console.log('actualizado con éxito');
    } catch (error) {
      console.log('error al actualizar');
    }
  }

  async getProduct() {
    const path = 'Empresas/' + '900444555-8';
    const doc = await this._firebaseservice.getDocument<Models.Empresa.NuevaEmpresa>(path); 
    if (doc.exists()) {
      console.log('docSnap.data() => ', doc.data()); // Gracias a Models.Empresa puedo llamar solo un campo doc.data().ciudad
    }
  }

  async getProducts() {
    console.log('getProducts()');
    const path = 'Empresas/';
    // const path = "/Users/8njXZ7n0GuhJyily5xX09/pedidos"
    // const path = "pedidos"
    const docs = await this._firebaseservice.getDocuments<Models.Empresa.NuevaEmpresa>(path); // ,true
    docs.forEach((doc) => {
      console.log(doc.id, ' => ', doc.data());
    });
  }
  
  async getProductRxjs() {
    const path = 'Empresas/' + '900444555-8';
    this._firebaseservice.getDocumentChanges<Models.Empresa.NuevaEmpresa>(path).subscribe( res => {
      console.log('Empresa suscrito ->', res)
    })
  }
  

  async getProductsRxjs() {
     const path = 'Empresas';
     this._firebaseservice.getDocumentsChanges<Models.Empresa.NuevaEmpresa>(path).subscribe( res => { // ,true
      console.log('Empresa suscrito ->', res)
    })
  }

  async consultar() {
    console.log('consultar()');
    const path = 'Empresas';
    // const path = 'pedidos';
    let q: Models.Firebases.whereQuery[];
  
    q = [['estado', '==', 'Activo']];
  
    // q = [['enable', '==', true, 'salty', '==', true], ['name', '==', 'Water']];
    // q = query(refCollection, where('name', 'in', ['Hotdog', 'Fish']));
    // q = [['name', 'in', ['Hotdog', 'Fish']]];
    // q = query(refCollection, where("price", ">=", 10), where("price", "<=", 20));
    // q = [["price", ">=", 0, "price", "<=", 6]];
    // const q = query(refCollectionGroup, where("state", "==", "new"));
    // q = [["state", "==", "new"]];
    // const q = query(refCollectionGroup, where('user.id', '==', '8njXZ7n0GuhJyilysXO9'), where('state', '==', 'new'));
    // q = [['user.id', '==', '8njXZ7n0GuhJyilysXO9']];

    // q = [['enable', '==', true]];
        ////// la primer [ ] es el AND luego de la , ['name', '==', 'Water'] es el OR
    q = [['estado', '==', 'Activo', 'nit', '==', 900444555-8], ['name', '==', 'Water']];
    // (A * B) + (C)

    const extras: Models.Firebases.extrasQuery = {
      orderParam: 'docCreado',
      // directionSort: 'asc',
      limit: 1,
      // group: true
    };

    this._firebaseservice.getDocumentsQueryChanges<Models.Empresa.NuevaEmpresa>(path, q, extras).subscribe(res => {
      console.log('res => ', res);
    });

  }
  
}
