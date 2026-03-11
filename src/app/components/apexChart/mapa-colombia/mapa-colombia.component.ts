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

  // Mapeo de nombres a códigos DANE
  private readonly departamentosMap: { [key: string]: string } = {
    'amazonas': '91',
    'antioquia': '05',
    'arauca': '81',
    'atlántico': '08',
    'atlantico': '08', // Sin tilde
    'bogotá': '11',
    'bogota': '11', // Sin tilde
    'bolívar': '13',
    'bolivar': '13', // Sin tilde
    'boyacá': '15',
    'boyaca': '15', // Sin tilde
    'caldas': '17',
    'caquetá': '18',
    'caqueta': '18', // Sin tilde
    'casanare': '85',
    'cauca': '19',
    'cesar': '20',
    'chocó': '27',
    'choco': '27', // Sin tilde
    'córdoba': '23',
    'cordoba': '23', // Sin tilde
    'cundinamarca': '25',
    'guainía': '94',
    'guainia': '94', // Sin tilde
    'guaviare': '95',
    'huila': '41',
    'la guajira': '44',
    'guajira': '44', // Alternativa
    'magdalena': '47',
    'meta': '50',
    'nariño': '52',
    'narino': '52', // Sin tilde
    'norte de santander': '54',
    'putumayo': '86',
    'quindío': '63',
    'quindio': '63', // Sin tilde
    'risaralda': '66',
    'san andrés': '88',
    'san andres': '88', // Sin tilde
    'santander': '68',
    'sucre': '70',
    'tolima': '73',
    'valle del cauca': '76',
    'valle': '76', // Alternativa
    'vaupés': '97',
    'vaupes': '97', // Sin tilde
    'vichada': '99'
  };

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

  // Método para convertir nombres a códigos
  private convertirNombresACodigos(departamentos: string[]): string[] {
    return departamentos
      .map(nombre => {
        const nombreNormalizado = nombre.toLowerCase().trim();
        const codigo = this.departamentosMap[nombreNormalizado];
        
        if (!codigo) {
          console.warn(`Departamento no encontrado: ${nombre}`);
          return null;
        }
        
        return codigo;
      })
      .filter(codigo => codigo !== null) as string[];
  }

  private loadGeoJSON(): void {
    fetch('assets/mapColombia/colombia.geo.json')
      .then(response => response.json())
      .then(data => {
        // Convertir nombres a códigos
        const codigosDepartamentos = this.convertirNombresACodigos(this.departamentos);
        // Filtrar para excluir San Andrés (código 88)
        this.geoJsonLayer = L.geoJSON(data, {
          filter: (feature) => {
            // Excluir San Andrés (código departamental 88)
            return feature?.properties?.['DPTO'] !== '88';
          },
          style: (feature) => {
            const deptCode = feature?.properties?.['DPTO'];
            const colorIndex = codigosDepartamentos.indexOf(deptCode);
            
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