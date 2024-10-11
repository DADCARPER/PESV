import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

// Declarar google como any para que TypeScript lo reconozca.
declare const google: any;

@Component({
  selector: 'app-map-example',
  standalone: true,
  imports: [CommonModule], // Asegúrate de importar los módulos necesarios
  templateUrl: './map-example.component.html',
})
export class MapExampleComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    let mapElement = document.getElementById('map-canvas');
    let lat = mapElement?.getAttribute('data-lat');
    let lng = mapElement?.getAttribute('data-lng');

    const myLatlng = new google.maps.LatLng(lat, lng);
    const mapOptions = {
      zoom: 12,
      scrollwheel: false,
      center: myLatlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        // Aquí se definen los estilos personalizados para el mapa
      ],
    };

    const map = new google.maps.Map(mapElement, mapOptions);

    const marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      animation: google.maps.Animation.DROP,
      title: 'Hello World!',
    });

    const contentString =
      '<div class="info-window-content"><h2>Notus Angular</h2>' +
      '<p>A beautiful UI Kit and Admin for Tailwind CSS. It is Free and Open Source.</p></div>';

    const infowindow = new google.maps.InfoWindow({
      content: contentString,
    });

    marker.addListener('click', () => {
      infowindow.open(map, marker);
    });
  }
}
