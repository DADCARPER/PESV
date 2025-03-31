import { Component, OnInit, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-colombia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-colombia.component.html',
  styleUrl: './mapa-colombia.component.css'
})
export class MapaColombiaComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() departamentos: string[] = [];
  @Input() muestraBorde: boolean = true;
  
  listacolores: string[] = ['#5796d9','#327ac8','#225ea7','#1c385e'];

  private map!: L.Map;
  private geoJsonLayer!: L.GeoJSON;

  ngOnInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['departamentos']) {
      // Si 'departamentos' cambia, actualizamos el mapa
      this.updateGeoJsonLayer();
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      dragging: false,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.1
    });
    
    this.loadGeoJSON();
  }

  private loadGeoJSON(): void {
    fetch('assets/mapColombia/colombia.geo.json')
      .then(response => response.json())
      .then(data => {
        // Filtrar para excluir San Andrés (código 88)
        this.geoJsonLayer = L.geoJSON(data, {
          filter: (feature) => {
            // Excluir San Andrés (código departamental 88)
            return feature?.properties?.['DPTO'] !== '88';
          },
          style: (feature) => {
            const deptCode = feature?.properties?.['DPTO'];
            const colorIndex = this.departamentos.indexOf(deptCode);
            
            let color = '#ccc';  // Color predeterminado si no se encuentra en el array
            let fillColor = '#f8f8f8';
               
            if (colorIndex !== -1) {
              // Si el departamento está en el array, asignar el color cíclicamente para el relleno
              fillColor = this.listacolores[colorIndex % this.listacolores.length]; // Color de relleno
            } else {
              // Si el departamento no está en el array, usar los colores predeterminados
              color = '#ccc';  // Borde por defecto para los departamentos no designados
            }
            
            return { 
              color: color, 
              fillColor: fillColor, 
              fillOpacity: 0.7, 
              weight: 0.5 
            };
          }
        }).addTo(this.map);
  
        // Ajustar la vista al contenido
        this.map.fitBounds(this.geoJsonLayer.getBounds());
      })
      .catch(error => {
        console.error('Error cargando el archivo GeoJSON:', error);
      });
  }

  private updateGeoJsonLayer(): void {
    if (this.geoJsonLayer) {
      // Elimina la capa GeoJSON anterior
      this.map.removeLayer(this.geoJsonLayer);
    }

    // Vuelve a cargar el GeoJSON con la nueva lista de departamentos
    this.loadGeoJSON();
  }

  ngAfterViewInit() {
    // Asegurar que el mapa se renderice correctamente
    setTimeout(() => {
      this.map.invalidateSize(true);
      
      if (this.geoJsonLayer) {
        this.map.fitBounds(this.geoJsonLayer.getBounds());
      }
    }, 300);
  }
  
}