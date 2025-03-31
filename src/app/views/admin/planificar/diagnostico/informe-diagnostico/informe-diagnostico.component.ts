import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import AOS from 'aos';  
import { ColumnsStrackedIconosComponent } from "../../../../../components/apexChart/columns-stracked-iconos/columns-stracked-iconos.component";
import { CardProfidComponent } from "../../../../../components/cards/card-profid/card-profid.component";
import { SociodemografiaComponent } from "../sociodemografia/sociodemografia.component";
import { MovilidadComponent } from "../movilidad/movilidad.component";
import { FactorRiesgoComponent } from "../factor-riesgo/factor-riesgo.component";

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-informe-diagnostico',
  standalone: true,
  imports: [CommonModule, RouterLink, ColumnsStrackedIconosComponent, CardProfidComponent, SociodemografiaComponent, MovilidadComponent, FactorRiesgoComponent],
  templateUrl: './informe-diagnostico.component.html',
  styleUrl: './informe-diagnostico.component.css'
})
export class InformeDiagnosticoComponent implements OnInit {


  constructor() {
    AOS.init();
  }

  ngOnInit(): void {
    // Inicialización de pdfMake
    pdfMake.vfs = pdfFonts.pdfMake;
  }

  async generarPDF() {
    console.log('Iniciando generación de PDF');
    const content = document.querySelector('#contentSociodemografico');
    console.log('Elemento encontrado:', content);
    
    if (!content) {
        console.error('No se encontró el elemento #contentSociodemografico');
        return;
    }

    try {
        // Clonamos el contenido para no afectar el diseño visible
        const clonedContent = content.cloneNode(true);

        // Crear un contenedor temporal fuera de la vista
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';  // Ocultarlo fuera de la vista
        tempContainer.style.left = '-9999px'; // Ocultarlo fuera de la vista
        tempContainer.style.width = '1440px'; // El tamaño que deseas para la captura

        // Aseguramos que el contenedor temporal tenga la altura del contenido
        tempContainer.style.height = `${content.scrollHeight}px`; // Ajustar altura dinámica

        tempContainer.appendChild(clonedContent);

        // Lo agregamos al cuerpo del documento para poder capturarlo
        document.body.appendChild(tempContainer);

        console.log('Iniciando html2canvas');
        const canvas = await html2canvas(tempContainer, {
            scale: 2,  // Asegura la captura en alta resolución
            useCORS: true,
            logging: true,
            onclone: function(clonedDoc) {
                console.log('Documento clonado:', clonedDoc);
            }
        });

        console.log('Canvas generado:', canvas);

        // Obtener el tamaño original del canvas
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;

        // Definir el tamaño máximo para la página en función de la resolución
        const scaleFactor = 0.18; // Factor de escala para redimensionar la imagen

        const scaledWidth = originalWidth * scaleFactor;
        const scaledHeight = originalHeight * scaleFactor;

        const imageData = canvas.toDataURL('image/png');
        console.log('Image data generado');

        const documentDefinition = {
            pageMargins: [40, 50, 50, 49],  // Márgenes: Izquierda, Superior, Derecha, Inferior
            content: [{
                image: imageData,
                width: scaledWidth,
                height: scaledHeight
            }],
            defaultStyle: {
                fontSize: 12
            }
        };

        console.log('Creando PDF');
        pdfMake.createPdf(documentDefinition).open();

        // Limpiar el contenedor temporal después de la captura
        document.body.removeChild(tempContainer);

    } catch (error) {
        console.error('Error detallado:', error);
    }
  }

  async generarPDF2() {
    console.log('Iniciando generación de PDF');
    const content = document.querySelector('#contentSociodemografico2');
    console.log('Elemento encontrado:', content);
    
    if (!content) {
        console.error('No se encontró el elemento #contentSociodemografico2');
        return;
    }

    try {
        // Clonamos el contenido para no afectar el diseño visible
        const clonedContent = content.cloneNode(true);

        // Crear un contenedor temporal fuera de la vista
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';  // Ocultarlo fuera de la vista
        tempContainer.style.left = '-9999px'; // Ocultarlo fuera de la vista
        tempContainer.style.width = '1440px'; // El tamaño que deseas para la captura

        // Aseguramos que el contenedor temporal tenga la altura del contenido
        tempContainer.style.height = `${content.scrollHeight}px`; // Ajustar altura dinámica

        tempContainer.appendChild(clonedContent);

        // Lo agregamos al cuerpo del documento para poder capturarlo
        document.body.appendChild(tempContainer);

        console.log('Iniciando html2canvas');
        const canvas = await html2canvas(tempContainer, {
            scale: 2,  // Asegura la captura en alta resolución
            useCORS: true,
            logging: true,
            onclone: function(clonedDoc) {
                console.log('Documento clonado:', clonedDoc);
            }
        });

        console.log('Canvas generado:', canvas);

        // Obtener el tamaño original del canvas
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;

        // Definir el tamaño máximo para la página en función de la resolución
        const scaleFactor = 0.18; // Factor de escala para redimensionar la imagen

        const scaledWidth = originalWidth * scaleFactor;
        const scaledHeight = originalHeight * scaleFactor;

        const imageData = canvas.toDataURL('image/png');
        console.log('Image data generado');

        const documentDefinition = {
            pageMargins: [40, 50, 50, 49],  // Márgenes: Izquierda, Superior, Derecha, Inferior
            content: [{
                image: imageData,
                width: scaledWidth,
                height: scaledHeight
            }],
            defaultStyle: {
                fontSize: 12
            }
        };

        console.log('Creando PDF');
        pdfMake.createPdf(documentDefinition).open();

        // Limpiar el contenedor temporal después de la captura
        document.body.removeChild(tempContainer);

    } catch (error) {
        console.error('Error detallado:', error);
    }
  }

  async generarPDF3() {
    console.log('Iniciando generación de PDF');
    const content = document.querySelector('#contentSociodemografico3');
    console.log('Elemento encontrado:', content);
    
    if (!content) {
        console.error('No se encontró el elemento #contentSociodemografico3');
        return;
    }

    try {
        // Clonamos el contenido para no afectar el diseño visible
        const clonedContent = content.cloneNode(true);

        // Crear un contenedor temporal fuera de la vista
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';  // Ocultarlo fuera de la vista
        tempContainer.style.left = '-9999px'; // Ocultarlo fuera de la vista
        tempContainer.style.width = '1440px'; // El tamaño que deseas para la captura

        // Aseguramos que el contenedor temporal tenga la altura del contenido
        tempContainer.style.height = `${content.scrollHeight}px`; // Ajustar altura dinámica

        tempContainer.appendChild(clonedContent);

        // Lo agregamos al cuerpo del documento para poder capturarlo
        document.body.appendChild(tempContainer);

        console.log('Iniciando html2canvas');
        const canvas = await html2canvas(tempContainer, {
            scale: 2,  // Asegura la captura en alta resolución
            useCORS: true,
            logging: true,
            onclone: function(clonedDoc) {
                console.log('Documento clonado:', clonedDoc);
            }
        });

        console.log('Canvas generado:', canvas);

        // Obtener el tamaño original del canvas
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;

        // Definir el tamaño máximo para la página en función de la resolución
        const scaleFactor = 0.18; // Factor de escala para redimensionar la imagen

        const scaledWidth = originalWidth * scaleFactor;
        const scaledHeight = originalHeight * scaleFactor;

        const imageData = canvas.toDataURL('image/png');
        console.log('Image data generado');

        const documentDefinition = {
            pageMargins: [40, 50, 50, 49],  // Márgenes: Izquierda, Superior, Derecha, Inferior
            content: [{
                image: imageData,
                width: scaledWidth,
                height: scaledHeight
            }],
            defaultStyle: {
                fontSize: 12
            }
        };

        console.log('Creando PDF');
        pdfMake.createPdf(documentDefinition).open();

        // Limpiar el contenedor temporal después de la captura
        document.body.removeChild(tempContainer);

    } catch (error) {
        console.error('Error detallado:', error);
    }
  }



}
