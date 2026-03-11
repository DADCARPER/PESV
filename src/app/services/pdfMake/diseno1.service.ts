import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Diseno1Service {

  constructor() { }


  getCabecera1(currentPage?: number,pageCount?: number,titulo: string='---',descripcion: string='---',codigo: string = '---', fecha:any = '---', version:any = '---', imagenBase64?:any  ): any {
    return {
      style: 'tableCabecera',
      table: {
        headerRows: 1,
        widths: [114, 270, 114],
        body: [
          [
            { 
              rowSpan: 4, 
              image: imagenBase64,
              fit: [126, 48],
              alignment: 'center', 
              margin: [0, 2, 0, 0] 
            },
            {
              rowSpan: 2,
              text: [
                // { text: `${nombreEmpresa}`, bold: true },
                { text: `\n ${titulo}` }
              ],
              alignment: 'center',
              verticalAlignment: 'center'
            },
            { text: `Codigo: ${codigo}`, alignment: 'center' }
          ],
          [
            "",
            "",
            { text: `Fecha: ${fecha}`, alignment: 'center' }
          ],
          [
            "",
            { 
              rowSpan: 2, 
              text: `${descripcion}`, 
              alignment: 'center', 
              margin: [0, 4, 0, 0] 
            },
            { text: `Versión No. ${version}`, alignment: 'center' }
          ],
          [
            "",
            "",
            { text: `Páginas ${currentPage} de ${pageCount}`, alignment: 'center' }
          ]
        ]
      },
      margin: [40, 30, 0, 20],
      layout: {
        hLineWidth: function () {
          return 0.2;
        },
        vLineWidth: function () {
          return 0.2;
        },
        hLineColor: function () {
          return '#989898';
        },
        vLineColor: function () {
          return '#989898';
        }
      }
    };
  }

  async getBase64FromUrl(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      
      // Verificamos si la respuesta fue exitosa
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
  
      // Convertir la respuesta a un Blob
      const blob = await response.blob();
      const reader = new FileReader();
  
      // Utilizamos una promesa para manejar la lectura de la imagen en base64
      return new Promise((resolve, reject) => {
        reader.onloadend = function () {
          resolve(reader.result as string); // Retornamos el base64
        };
  
        reader.onerror = function () {
          reject('Error reading the blob as base64');
        };
  
        reader.readAsDataURL(blob); // Convertir el Blob a base64
      });
  
    } catch (error) {
      throw new Error(`Error fetching image:`);
    }
  }
  
}
