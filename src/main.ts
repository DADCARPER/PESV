import { bootstrapApplication } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { AppComponent } from './app/app.component';
import { environment } from './app/environment/environmentdesarrollo';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';  // Import Lottie player

// Importar los estilos globales de AOS
import 'aos/dist/aos.css';

// Importaciones nuevas para localización
import { LOCALE_ID } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';

// Registrar los datos de localización
registerLocaleData(es);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' }, // Añadir el proveedor de localización
    DatePipe,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()), // Añadir Storage como proveedor
    provideFirestore(() => getFirestore()),
    provideRouter(routes),
    provideLottieOptions({  // Añade la configuración para Lottie
      player: () => player
    })
  ]
})
.catch(err => console.error(err));
