export interface UserProfile {
  
  actividadEmpresa?: string;
  cargoEmpresa?: string;    
  departamento?: string;
  direccion?: string;
  email?: string;          
  emailEmpresa?: string;
  municipio?: string;
  nitEmpresa?: string;     
  nivelAcceso?: string;    
  nombreCompleto?: string; 
  nombreEmpresa?: string;  
  telefono?: string;       
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
}

export interface UserFirmas {
  
  tipodocumento?: string;
  numerodocumento?: string;    
  nombres?: string;    
  apellidos?: string;
  email?: string;          
  telefono?: string;       
  cargoempresa?: string;
  areadepartamento?: string;
  estado?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
}

export interface TableHeader {
  label: string;
  key: string;
  type?: 'image' | 'text';
}

export interface Integrante {
  [key: string]: any;
  id: string;
  nombres: string;
  cargo: string;
  rol: string;
  // Otros campos que puedas tener
}

export interface Archivos {
  
  id: string;
  URL: string;
  estado: string;
  fechaCreacion:Date;
  fechaFormateada: string;
  horaFormateada: string;
  nombrePDf: string;
  mostrar: boolean;
  tipo: string;
  type: string;

}


