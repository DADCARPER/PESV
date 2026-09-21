export namespace ModelDiagnosticos {

    // Documento principal del diagnóstico: Empresas/{nit}/periodos/{año}/006-diagnostico/{id}
    export interface DiagnosticoBase {
        id?: string;
        totalColaboradores: number;
        descripcionEmpresa: string;
        fechaCreacion: string;      // 'YYYY-MM-DD HH:mm:ss'
        version: string;            // 'v1', 'v2', ...
        estado: string;             // 'En proceso' | 'Completado' | 'Archivado'
        porcentajeTotal: number;    // 0-100
        nitEmpresa: string;
        periodo: number;
    }


    export interface Sedes{
        id?: string;               // Opcional, porque normalmente lo genera Firebase
        ciudad : string;
        departamento : string;
        docCreado : string;
        estado : string;
        nombreSede : string;
        telefono : string;
        docActualizado: string;
        cargoresponsable: string;
        email: string;
        responsable: string;
        tiposede: string;
        totalasignados: number;
        totalconductores: number;
        totalempleados: number;
        totaloperacion: number;
    }

    export interface Servicio {
        categoriaServicio: string;
        coberturaOperacion: string;
        conductores: boolean;
        descripcion: string;
        docCreado: string; // o Date si lo parseas
        estado: string;
        frecuenciaOperacion: string;
        gps: boolean;
        id: string;
        importanciaServicio: string;
        mantenimiento: boolean;
        monitoreo: boolean;
        nombreServicio: string;
        seguro: boolean;
        soporte: boolean;
    }

    export interface Colaboradores {
        docCreado: string;
        estado: string;
        id: string;
        nombre: string;
        fechaNacimiento: string;
        genero: string;
        documento: string;
        email: string;
        escolaridad: string;
        estrato: string;
        cargo: string;
        jornada: string;
        horasLaborales: number;
        tiempoEmpresa: number;
        tipoContrato: string;
        areaDepartamento: string;
        telefono: string;
    }

    /**
     * Contratista del diagnostico, tal como lo guarda su formulario.
     *
     * La version anterior de esta interfaz describia una forma que el
     * formulario dejo de escribir hace tiempo: hablaba de `nombreEmpresa`,
     * `clasificacion`, `tipoServicio`, `direccion`, `email` y `telefono`,
     * campos que ya no existen. Solo coincidian tres. Por eso el componente
     * que la pinta acababa usando `any`: tipar con ella daba error en todas
     * las columnas.
     */
    export interface Contratistas {
        id: string;
        estado: string;
        docCreado?: unknown;
        periodo?: number;

        // Identificacion
        tipoContratista: string;
        tipoPersona: string;
        nombreRazonSocial: string;
        nitCedula: string;

        // Vinculacion
        tipoVinculacion: string;
        /** Texto libre cuando la vinculacion es "Otro". */
        vinculacionOtro?: string;
        servicioPrestado: string;
        fechaInicioContrato: string;
        contratoIndefinido: boolean;
        /** Vacia mientras el contrato sea indefinido. */
        fechaFinContrato?: string;

        /**
         * Si el contratista se desplaza por la empresa. Es lo que decide si
         * entra en las obligaciones del PESV, por eso va aparte del resto.
         */
        realizaDesplazamientos: string;

        // Flota, solo cuando hay desplazamientos
        tipoFlota?: string;
        conductores: number;
        vehiculos: number;
        observaciones?: string;
    }
      

    /**
     * Vehiculo de la flota.
     *
     * Se llena en tres pasos y los tres escriben en el mismo documento:
     * identificacion, documentacion legal y datos de operacion. Por eso casi
     * todo es opcional salvo lo que pide el primero: un vehiculo puede estar
     * registrado sin que nadie haya cargado todavia su SOAT.
     *
     * Las fechas se guardan como texto `AAAA-MM-DD`, que es lo que entrega un
     * `input type="date"`. Asi se comparan y se ordenan igual de bien.
     */
    export interface Vehiculo {
        id: string;
        estado: string;
        docCreado?: unknown;

        // Identificacion
        tipoVehiculo: string;
        placa: string;
        vin?: string;
        numeroMotor?: string;
        fechaFabricacion?: string;
        kilometrajeActual?: number;
        marca?: string;
        modelo?: string;
        /** Propio, en arriendo, de un tercero. */
        tipoRelacion?: string;

        // Documentacion legal
        vigenciaSoat?: string;
        vigenciaRevisionTecnica?: string;
        entidadAseguradora?: string;

        // Operacion
        promedioKmMes?: number;
        tienePlanMantenimiento?: string;
        frecuenciaMantenimiento?: string;
        fechaUltimoMantenimiento?: string;
        tieneSiniestros?: string;
        numeroSiniestros?: number;
        observaciones?: string;
    }

    export interface encuestaParametros{

        docCreado: Date;
        encuestaParametros:{
            modulo2:boolean;
            modulo3:boolean;
            modulo4:boolean;
            modulo5:boolean;
            modulo6:boolean;
            mostrarEncuesta :boolean;
        },
        nombreEmpresa: string;
        estado:string;
        id:string;
    }

    export interface Encuesta {
        nombre: string;
        fechaNacimiento: Date;
        genero: 'Masculino' | 'Femenino';
        documento: string;
        telefono: string;
        email: string;
        escolaridad: string;
        estrato: string;
        estadoCivil: string;
        cargo: string;
        jornada: string;
        horasLaborales: number;
        tiempoEmpresa: string;
        tipoContrato: string;
        areaDepartamento: string;
        //modulo2
        estadoGeneral: string;
        limitacionFisica: string;
        incapacidades: string;
        actividadFisica: string;
        dolorMolestia: string;
        discapacidad: string;
        //modulo3
        conduceVehiculos: string;
        tipoVehiculos: string;
        licenciaConduccion: string;
        categoriaLicencia: string;
        accidenteEnJornada: string;
        experienciaConduccion: string;
        accidenteUltimoAno: string;
        accidenteTransito: string;
        conocimientoNormas: string;
        capacidadEmergencia: string;
        //modulo4
        mediosTransporte: string[]; // array de strings (puedes ajustarlo si son objetos)
        tiempoDesplazamiento: string;
        estadoVehiculo: string;
        incidentesDesplazamiento: string;
        propiedadVehiculo: string;
        //modulo5
        exposicionRiesgos: string;
        experienciaRiesgos: string;
        situacionesRiesgo: string[]; // es un array, así que lo dejamos como string[]
        reporteRiesgo: string;
        conocimientoReporte: string;
        culturaSeguridad: string;
        preparacionRiesgos: string;
        //modulo6
        aportarIdeas: string;
        participacionActividades: string;
        accionesMejora: string[]; // array, ya que se usa con FormArray
        participacionAnterior: string;
        sugerenciasMejora: string; 


    }



}