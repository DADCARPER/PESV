import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EditorComponent } from "../../../../../components/editor/editor.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crear-documento',
  standalone: true,
  imports: [CommonModule, RouterLink, EditorComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './crear-documento.component.html',
  styleUrl: './crear-documento.component.css'
})
export class CrearDocumentoComponent {

  public contenido = {texto: '', time: ''};

  constructor(){}

  formato1(){
    this.contenido ={
      texto: `<p style="text-align:center;">&nbsp;</p><p style="text-align:center;">&nbsp;</p><p style="text-align:center;"><strong>ACTA DE DESIGNACIÓN DEL LÍDER DEL PESV</strong></p><p style="text-align:center;">&nbsp;</p><p>&nbsp;</p><p><strong>Fecha:</strong> [<span style="color:#EE0000;">XX</span> de <span style="color:#EE0000;">XXX</span> de <span style="color:#EE0000;">XXXX</span>]<br><strong>Empresa:</strong> [Nombre de la Empresa]<br><strong>NIT:</strong> [NIT de la Empresa]<br><strong>Ciudad:</strong> [Ciudad]</p><p>&nbsp;</p><p style="text-align:justify;">En ejercicio de sus facultades legales y en cumplimiento con la <strong>Resolución 40595 de 2022</strong> del Ministerio de Transporte, se designa a [<span style="color:#EE0000;">Nombre Completo del Líder</span>], quien se desempeña como [<span style="color:#EE0000;">Cargo del Líder</span>], como <strong>Líder del Diseño e Implementación del Plan Estratégico de Seguridad Vial (PESV)</strong> de la organización.</p><p>&nbsp;</p><p><strong>Funciones y Responsabilidades:</strong></p><p>&nbsp;</p><ul><li><strong>Diseñar e implementar el PESV</strong>, velando por el cumplimiento de la normatividad vigente.</li><li><strong>Supervisar y evaluar</strong> las diferentes fases del PESV, asegurando su efectividad y cumplimiento.</li><li><strong>Coordinar</strong> el Comité de Seguridad Vial y asegurar su funcionamiento.</li><li><strong>Gestionar capacitaciones</strong> sobre seguridad vial para los empleados.</li><li><strong>Elaborar y presentar informes</strong> de avance sobre el cumplimiento del PESV a la alta dirección.</li><li><strong>Asegurar la mejora continua</strong> del PESV, ajustando acciones conforme a los resultados obtenidos.</li></ul><p>&nbsp;</p><p><strong>Firma del Gerente:</strong></p><p>&nbsp;</p><p>&nbsp;</p><p style="text-align:justify;">&nbsp;</p><p>_______________________________________</p><p><span style="font-size:10pt;"><strong>[NOMBRE] [NOMBRE] [APELLIDO] [APELLIDO]</strong></span></p><p><span style="font-size:10pt;">C.C. [1.111.111.111]</span></p><p><span style="font-size:10pt;">[CARGO]</span></p>`,
      time: new Date().getTime().toString()
    }
  }

  formato2(){
    this.contenido = {
      texto: `<p style="text-align:center;">&nbsp;</p><p style="text-align:center;"><strong>ACTA DE NOMBRAMIENTO DEL LÍDER DEL DISEÑO E IMPLEMENTACIÓN DEL PESV</strong></p><p style="text-align:center;">&nbsp;</p><p>&nbsp;</p><p><strong>Fecha: </strong><span style="color:#EE0000;"><strong>XX</strong></span><strong> de </strong><span style="color:#EE0000;"><strong>XXX</strong></span><strong> de </strong><span style="color:#EE0000;"><strong>XXXX</strong></span></p><p>&nbsp;</p><p style="text-align:justify;">En la ciudad de [<span style="color:#EE0000;">Ciudad</span>], a los [<span style="color:#EE0000;">XX</span>] días del mes de [<span style="color:#EE0000;">XXX</span>] del año [<span style="color:#EE0000;">XXXX</span>], en ejercicio de sus facultades legales y reglamentarias, en especial las conferidas por la resolución 40595 de 2022, el gerente de la EMPRESA, identificada con NIT: [<span style="color:#EE0000;">XXX</span>], nombra al siguiente colaborador como Líder del diseño e implementación del Plan Estratégico de Seguridad Vial (PESV):</p><p>&nbsp;</p><p><strong>Líder del PESV:</strong></p><p>&nbsp;</p><ul style="list-style-type:circle;"><li><strong>Nombre:</strong> [Nombre Completo del Líder]</li><li><strong>Cédula:</strong> [Número de Cédula]</li><li><strong>Cargo:</strong> [Cargo del Líder]</li><li><strong>Contacto:</strong> [Teléfono o Email del Líder]</li></ul><p>&nbsp;</p><p><strong>Funciones y Responsabilidades:</strong></p><p>&nbsp;</p><ul><li>Garantizar que todo el personal cumpla con lo establecido en el PESV.</li><li>Supervisar las etapas de planificación, implementación y mejora del PESV.</li><li>Coordinar y presentar informes de avance del PESV ante la alta dirección.</li><li>Asegurar la capacitación continua de los empleados sobre seguridad vial.</li><li>Realizar seguimiento de los compromisos derivados de las reuniones del Comité de Seguridad Vial.</li></ul><p>&nbsp;</p><p><strong>Firma del Gerente:</strong></p><p>&nbsp;</p><p>&nbsp;</p><p style="text-align:justify;">&nbsp;</p><p>_______________________________________</p><p><span style="font-size:10pt;"><strong>[NOMBRE] [NOMBRE] [APELLIDO] [APELLIDO]</strong></span></p><p><span style="font-size:10pt;">C.C. [1.111.111.111]</span></p><p><span style="font-size:10pt;">[CARGO]</span></p><p>&nbsp;</p>`,
      time: new Date().getTime().toString()
    }
  }

  formato3(){
    this.contenido = {
      texto: `<p style="text-align:justify;">456 23, siendo las 10:00am en las instalaciones de la empresa <strong>TRANSPORTES ESPECIALES DE OCCIDENTE S.A.S</strong> identificada con <strong>NIT: 901005119-9</strong> en ejercicios de sus facultades legales y reglamentarias, en especial las conferidas por la resolución <strong>40595 del 12 julio 2022</strong> “Por lo cual se adopta la metodología para el diseño, implementación y verificación del Plan Estratégico de Seguridad Vial y se dictan otras disposiciones”. Se reunieron el señor <strong>Abelardo Antonio Carval Páez</strong> con cedula de ciudadanía N° <strong>71.933.971</strong> en su carácter de Gerente de la empresa, y el señor <strong>Jesús Alberto Briceño Medina</strong> con Permiso de Protección Temporal N° <strong>2883774</strong> en su carácter de Coordinador de Seguridad y Salud en el Trabajo, con el objetivo de asignar oficialmente a éste último como Líder del diseño, implementación y verificación del PESV, así como también definir y socializar sus funciones y responsabilidades en este rol.</p><p style="text-align:justify;">&nbsp;</p><p style="text-align:justify;">&nbsp;</p><p><strong>Funciones:</strong></p><ul><li>Planear, organizar, dirigir, desarrollar y aplicar el PESV. Desarrollar seguimiento como mínimo una vez. Realizar su evaluación.</li></ul><p>&nbsp;</p><ul><li>Liderar el proceso de creación e implementación del PESV.</li></ul><p>&nbsp;</p><p>&nbsp;</p><ul><li>Informar a la alta gerencia sobre el funcionamiento y resultados del PESV.</li></ul><p>&nbsp;</p><ul><li>Capacitar o gestionar capacitaciones a los empleados de la empresa, en temas referentes a la seguridad vial.</li></ul><p>&nbsp;</p><ul><li>Asistir a las capacitaciones de seguridad vial y hacer socializaciones de la misma con los empleados de la empresa.</li></ul><p>&nbsp;</p><p>&nbsp;</p><p><strong>Responsabilidades:</strong></p><ul><li>Deberá velar porque se cumplan las etapas de planificación, implementación, seguimiento y mejora del PESV.</li></ul><p>&nbsp;</p><ul><li>Deberá diligenciar el reporte de autogestión anual, y los resultados de la medición de los indicadores del PESV.</li></ul><p><strong>&nbsp;</strong></p><ul><li>Definir el protocolo y manejo de los indicadores que le permitan realizar seguimiento, medición, análisis y evaluación en la gestión de la seguridad vial, los cuales deben estar relacionados con la planificación, seguimiento y mejora del PESV.</li></ul><p>&nbsp;</p><p>&nbsp;</p><p>Una vez socializada y aprobada se procede a firmar por parte de los <span style="color:#EE0000;">intervinientes</span>.</p><p>&nbsp;</p><p>Una vez socializada y aprobada se procede a firmar por parte de los <span style="color:#EE0000;">INTERVINIENTES</span>.</p><p>Una vez socializada y aprobada se procede a firmar por parte de los intervinientes.</p>`,
      time: new Date().getTime().toString()
    }
  }

  firma1Izquierda(){
    this.contenido = {
      texto: `<p style="text-align:justify;">&nbsp;</p><p style="text-align:left;">_______________________________________</p><p style="text-align:left;"><span style="font-size:10pt;"><strong>JORGE ANDRÉS PACHÓN DAVID</strong></span></p><p style="text-align:left;"><span style="font-size:10pt;">GERENTE GENERAL</span></p><p>&nbsp;</p>`,
      time: new Date().getTime().toString()
    };
  }

  firma1Centro(){
    this.contenido = {
      texto: `<p style="text-align:justify;">&nbsp;</p><p style="text-align:center;">_______________________________________</p><p style="text-align:center;"><span style="font-size:10pt;"><strong>JORGE ANDRÉS PACHÓN DAVID</strong></span></p><p style="text-align:center;"><span style="font-size:10pt;">GERENTE GENERAL</span></p><p>&nbsp;</p>`,
      time: new Date().getTime().toString()
    };
  }

  firma1Derecha(){
    this.contenido = {
      texto: `<p style="text-align:justify;">&nbsp;</p><p style="text-align:right;">_______________________________________</p><p style="text-align:right;"><span style="font-size:10pt;"><strong>JORGE ANDRÉS PACHÓN DAVID</strong></span></p><p style="text-align:right;"><span style="font-size:10pt;">GERENTE GENERAL</span></p><p>&nbsp;</p>`,
      time: new Date().getTime().toString()
    };
  }

  firma2Centro(){
    this.contenido = {
      texto: `<p style="text-align:justify;">&nbsp;</p><p style="text-align:center;">_______________________________________ &nbsp; &nbsp; &nbsp; &nbsp; _______________________________________</p><p style="text-align:center;"><span style="font-size:10pt;"><strong>JORGE ANDRÉS PACHÓN DAVID &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; JORGE ANDRÉS PACHÓN DAVID</strong></span></p><p style="text-align:center;"><span style="font-size:10pt;">GERENTE GENERAL<strong> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</strong>GERENTE GENERAL</span></p><p>&nbsp;</p>`,
      time: new Date().getTime().toString()
    };
  }

  firma2derecha(){
    this.contenido = {
      texto: `<p style="text-align:justify;">&nbsp;</p><p style="text-align:center;">_______________________________________ &nbsp; &nbsp; &nbsp; &nbsp; _______________________________________</p><p><span style="font-size:10pt;"><strong>&nbsp; &nbsp; &nbsp; &nbsp;JORGE ANDRÉS PACHÓN DAVID &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; JORGE ANDRÉS PACHÓN DAVID</strong></span></p><p><span style="font-size:10pt;">&nbsp; &nbsp; &nbsp; &nbsp;GERENTE GENERAL<strong> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</strong>GERENTE GENERAL</span></p><p>&nbsp;</p>`,
      time: new Date().getTime().toString()
    };
  }

}
