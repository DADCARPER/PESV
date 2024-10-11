import { Component, inject, Input } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { CommonModule } from '@angular/common';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, setDoc, doc, arrayUnion } from '@angular/fire/firestore';
import { CardProfileComponent } from "../../components/cards/card-profile/card-profile.component";
import { CardBarChartComponent } from '../../components/cards/card-bar-chart/card-bar-chart.component';
import { CardLineChartComponent } from "../../components/cards/card-line-chart/card-line-chart.component";
import { CardPageVisitsComponent } from "../../components/cards/card-page-visits/card-page-visits.component";
import { CardSocialTrafficComponent } from "../../components/cards/card-social-traffic/card-social-traffic.component";
import { MapExampleComponent } from "../../components/maps/map-example/map-example.component";
import { CardSettingsComponent } from "../../components/cards/card-settings/card-settings.component";
import { CardStatsComponent } from '../../components/cards/card-stats/card-stats.component';
import { CardTableComponent } from "../../components/cards/card-table/card-table.component";
import { IndexDropdownComponent } from "../../components/dropdowns/index-dropdown/index-dropdown.component";
import { NotificationDropdownComponent } from "../../components/dropdowns/notification-dropdown/notification-dropdown.component";
import { UserDropdownComponent } from '../../components/dropdowns/user-dropdown/user-dropdown.component';
import { FooterComponent } from "../../components/footers/footer/footer.component";
import { FooterAdminComponent } from "../../components/footers/footer-admin/footer-admin.component";
import { FooterSmallComponent } from "../../components/footers/footer-small/footer-small.component";
import { HeaderStatsComponent } from "../../components/headers/header-stats/header-stats.component";
import { AdminNavbarComponent } from "../../components/navbars/admin-navbar/admin-navbar.component";
import { AuthNavbarComponent } from "../../components/navbars/auth-navbar/auth-navbar.component";
import { IndexNavbarComponent } from "../../components/navbars/index-navbar/index-navbar.component";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardProfileComponent, CardBarChartComponent, CardLineChartComponent, CardPageVisitsComponent, CardSocialTrafficComponent, MapExampleComponent, CardSettingsComponent, CardStatsComponent, CardTableComponent, IndexDropdownComponent, NotificationDropdownComponent, UserDropdownComponent, FooterComponent, FooterAdminComponent, FooterSmallComponent, HeaderStatsComponent, AdminNavbarComponent, AuthNavbarComponent, IndexNavbarComponent, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  @Input()
  get color(): string {
    return this._color;
  }
  set color(color: string) {
    this._color = color !== 'light' && color !== 'dark' ? 'light' : color;
  }
  private _color = 'dark';

  private _auth = inject(LoginService);
  private _storage = inject(Storage);
  private _firestore = inject(Firestore);


  uploadProgress: number = 0;
  downloadURL: string | null = null;

 

  uploadFile(event: any) {
    const file = event.target.files[0];
    const allowedTypes = [
      'application/msword', // Word
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word .docx
      'application/vnd.ms-excel', // Excel
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel .xlsx
      'text/plain', // TXT
      'application/pdf', // PDF
      'image/png', // PNG
      'application/vnd.ms-powerpoint', // PowerPoint
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint .pptx
      'application/zip', // ZIP
      'application/x-zip-compressed' // ZIP comprimido
    ];
  
    if (!allowedTypes.includes(file.type)) {
      console.error('Tipo de archivo no permitido');
      return;
    }
  
    const userId = sessionStorage.getItem('userId');
    const category = 'documents'; // Cambia esta categoría según corresponda
    const filePath = `uploads/${userId}/${category}/${file.name}`;
    const storageRef = ref(this._storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
  
    uploadTask.on('state_changed', (snapshot) => {
      this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    }, (error) => {
      console.error('Error al subir archivo:', error);
    }, () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        this.downloadURL = downloadURL;
  
        if (userId) {
          const userDocRef = doc(this._firestore, `users/${userId}`);
          setDoc(userDocRef, {
            uploadedFiles: arrayUnion({
              fileName: file.name,
              fileURL: downloadURL,
              category: category,
              fileType: file.type,
              uploadedAt: new Date()
            })
          }, { merge: true }).then(() => {
            console.log('Archivo guardado en Firestore');
          }).catch((error) => {
            console.error('Error al guardar en Firestore:', error);
          });
        } else {
          console.error('Usuario no autenticado');
        }
      });
    });
  }
  
  



  logout(){
    this._auth.logout();
    console.log("sesion cerrada");
  }

}
