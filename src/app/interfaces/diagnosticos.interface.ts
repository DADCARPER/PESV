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


    /**
     * Sede de la organizacion.
     *
     * La version anterior de esta interfaz no incluia `direccion`, que el
     * formulario si guardaba desde hace tiempo: otro desfase silencioso entre
     * lo que se escribe y lo que se declara.
     */
    export interface Sedes{
        id?: string;               // Opcional, porque normalmente lo genera Firebase
        estado : string;
        docCreado : string;
        docActualizado?: string;

        nombreSede : string;
        tiposede: string;
        direccion?: string;
        ciudad : string;
        departamento : string;

        telefono : string;
        email: string;
        responsable: string;
        cargoresponsable: string;

        totalempleados: number;
        totalconductores: number;
        totalasignados: number;
        totaloperacion: number;

        /**
         * Fotografia de la sede, para el informe.
         *
         * Se guarda la URL de descarga y la ruta en Storage: la URL sirve para
         * pintarla, y la ruta para poder reemplazarla o borrarla despues.
         */
        fotoUrl?: string;
        fotoRuta?: string;
        /**
         * La misma fotografia, diminuta y guardada dentro del registro.
         *
         * Existe para el informe. pdfMake solo admite imagenes embebidas, y
         * traerlas de Storage con `fetch` exige que el bucket tenga CORS
         * configurado: el navegador las pinta en un `img` pero no deja
         * leerlas. Guardar una miniatura aqui quita esa dependencia entera.
         *
         * Ademas congela lo que se vio: un informe archivado sigue enseniando
         * la foto que tenia el dia que se emitio, aunque despues se cambie.
         */
        fotoMiniatura?: string;
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

        // Operacion, solo cuando hay desplazamientos
        /** Fidelizada u ocasional: con que continuidad opera. */
        tipoFlota?: string;
        /**
         * Conductores que pone el contratista.
         *
         * Es el unico sitio donde vive este dato: no son colaboradores de la
         * empresa y no responden la encuesta, asi que sin este campo esa
         * exposicion desapareceria del diagnostico.
         */
        conductores: number;
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
        /** Propio, afiliado, asociado o puesto al servicio. */
        tipoRelacion?: string;
        /**
         * Contratista al que pertenece, cuando no es propio.
         *
         * Sustituye al conteo de vehiculos que guardaba el contratista: dos
         * numeros sobre lo mismo podian discrepar, y un numero no tiene placa,
         * ni SOAT, ni mantenimiento. Se guarda tambien el nombre para que el
         * registro siga entendiendose si el contratista se da de baja.
         */
        contratistaId?: string;
        contratistaNombre?: string;

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

    /**
     * Ruta que la organizacion recorre con regularidad.
     *
     * Los kilometros al mes no se guardan: salen de la distancia y la
     * frecuencia. Pedirlos aparte permitiria que los tres datos se
     * contradijeran entre si.
     */
    export interface Ruta {
        id: string;
        estado: string;
        docCreado?: unknown;
        periodo?: number;

        nombreRuta: string;
        origen: string;
        destino: string;
        distanciaKm?: number;
        /** Rango de texto: "Entre 1 a 2 horas". No es un numero de minutos. */
        tiempoEstimado?: string;
        tipoVia: string;
        frecuencia: string;

        /**
         * Riesgos que presenta la ruta, de la lista compartida con el modulo
         * de riesgos de la encuesta. Antes esto acababa en observaciones,
         * donde no se podia contar ni graficar.
         */
        factoresRiesgo?: string[];
        observaciones?: string;
    }

    /**
     * Plan de respuesta ante un escenario de emergencia vial.
     *
     * Uno por escenario: accidente, falla mecanica, derrame... La cobertura
     * del diagnostico se mide por cuantos escenarios tienen plan, no por
     * cuantos planes hay.
     */
    export interface PlanEmergencia {
        id: string;
        estado: string;
        docCreado?: unknown;
        periodo?: number;

        nombrePlan: string;
        tipoEmergencia: string;
        descripcion: string;
        /** Los pasos a seguir: el corazon del plan. */
        protocoloAccion?: string;
        responsable?: string;
        telefonoEmergencia?: string;

        fechaElaboracion?: string;
        /**
         * Fecha limite para volver a revisarlo, no la ultima revision hecha.
         * Un plan con la revision vencida deja de valer en una auditoria.
         */
        fechaRevision?: string;

        /**
         * Documento de respaldo: el procedimiento firmado, en PDF o imagen.
         *
         * Va aparte de `protocoloAccion` y no lo sustituye. Los pasos escritos
         * son los que el informe puede imprimir, y un auditor no acepta "existe
         * un archivo" como evidencia de contenido. El soporte prueba que el
         * procedimiento esta formalizado; el texto prueba que dice algo.
         */
        soporteUrl?: string;
        soporteRuta?: string;
        soporteNombre?: string;
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