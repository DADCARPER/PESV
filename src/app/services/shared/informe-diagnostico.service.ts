import { Injectable, inject } from '@angular/core';
import { DiagnosticoDatosService } from './diagnostico-datos.service';
import { EncuestaEmpresaService } from './encuesta-empresa.service';
import { EmpresaService } from './empresa.service';
import { AuthenticacionService } from './authenticacion.service';
import { PerfilService } from './perfil.service';
import { Models } from '../../interfaces/models';
import { ModelsInforme } from '../../interfaces/informe.interface';
import { FACTORES_RIESGO_RUTA, kilometrosAlMes, VIAJES_AL_MES } from '../../data/rutas';
import { TIPO_EMERGENCIA_OTRO, TIPOS_EMERGENCIA } from '../../data/emergencias';
import { DIAS_AVISO, estadoVigencia } from '../../data/vigencias';
import { textoSeguro } from '../../data/texto-seguro';

/**
 * Reúne las cifras del informe de diagnóstico.
 *
 * Trae las colecciones enteras a propósito: el informe se emite pocas veces al
 * año y necesita agrupar por campos de texto libre, que Firestore no sabe
 * agrupar. No es la pantalla que se abre a diario.
 *
 * Solo cubre el paso 5. Los módulos de liderazgo, comité, políticas y
 * compromiso directivo tienen sus propios documentos y no entran aquí.
 */
@Injectable({ providedIn: 'root' })
export class InformeDiagnosticoService {

  private _datos = inject(DiagnosticoDatosService);
  private _encuesta = inject(EncuestaEmpresaService);
  private _empresa = inject(EmpresaService);
  private _auth = inject(AuthenticacionService);
  private _perfil = inject(PerfilService);

  /**
   * Levanta todas las cifras del periodo.
   *
   * Se piden en paralelo: son colecciones independientes y en serie tardarían
   * la suma en vez de lo que tarde la más lenta.
   */
  async reunir(): Promise<ModelsInforme.Datos> {
    const periodo = this._auth.periodo();

    // La actividad economica vive en Empresas/{nit}: hay que tenerla leida.
    await this._empresa.cargar();

    // Quien emite: se propone el de la sesion, pero es editable. La empresa
    // puede tener varios operativos y quien abre la pantalla no tiene por que
    // ser quien firma el informe.
    const responsable = await this.responsablePropuesto();

    const [base, sedes, servicios, contratistas, vehiculos, rutas, planes, respuestas, encuesta] =
      await Promise.all([
        this._datos.diagnosticoBase(),
        this._datos.todos<Models.Diagnostico.Sedes>('sedes'),
        this._datos.todos<Models.Diagnostico.Servicio>('servicios'),
        this._datos.todos<Models.Diagnostico.Contratistas>('contratistas'),
        this._datos.todos<Models.Diagnostico.Vehiculo>('vehiculos'),
        this._datos.todos<Models.Diagnostico.Ruta>('rutas'),
        this._datos.todos<Models.Diagnostico.PlanEmergencia>('plan-emergencias'),
        this._encuesta.respuestas(),
        this._encuesta.activa(),
      ]);

    const poblacion = base?.totalColaboradores ?? 0;
    const muestra = respuestas.length;

    return {
      nitEmpresa: this._empresa.nit(),
      nombreEmpresa: this._empresa.nombre(),
      periodo,
      metodologia: {
        poblacion,
        muestra,
        cobertura: poblacion > 0 ? Math.round((muestra / poblacion) * 1000) / 10 : 0,
        encuesta: encuesta ? `${encuesta.nombre} (v${encuesta.version})` : 'Sin encuesta activa',
      },
      secciones: [
        this.organizacion(sedes, servicios, {
          nit: this._empresa.nit(),
          nombre: this._empresa.nombre(),
          actividad: this._empresa.datos()?.actividadEmpresa ?? '',
          responsable,
        }),
        this.personas(respuestas, encuesta, {
          nombre: this._empresa.nombre(),
          poblacion,
          cobertura: poblacion > 0 ? Math.round((muestra / poblacion) * 1000) / 10 : 0,
        }),
        ...this.modulosEncuesta(respuestas, encuesta),
        this.flota(vehiculos),
        this.contratistas(contratistas, vehiculos),
        this.rutas(rutas),
        this.emergencias(planes),
      ],
    };
  }

  // ── Secciones ─────────────────────────────────────────────────────────────

  private organizacion(
    sedes: Models.Diagnostico.Sedes[],
    servicios: Models.Diagnostico.Servicio[],
    empresa: { nit: string; nombre: string; actividad: string; responsable: string }
  ): ModelsInforme.Seccion {
    const departamentos = new Set(sedes.map(s => s.departamento).filter(Boolean));
    const empleadosEnSedes = sedes.reduce((n, s) => n + (Number(s.totalempleados) || 0), 0);

    return {
      id: 'organizacion',
      titulo: 'La organización',
      texto: '',
      sinDatos: !sedes.length && !servicios.length,

      // Quien es la empresa: lo primero que tiene que decir un informe.
      identificacion: [
        { etiqueta: 'Razón social', valor: empresa.nombre || 'Sin registrar' },
        { etiqueta: 'NIT', valor: empresa.nit },
        { etiqueta: 'Responsable del informe', valor: empresa.responsable, editable: true },
        { etiqueta: 'Actividad económica', valor: empresa.actividad || 'Sin registrar', largo: true },
      ],

      // Una ficha por sede: el informe necesita nombrarlas y situarlas, no
      // solo contarlas.
      sedes: sedes.map(s => ({
        nombre: s.nombreSede ?? '',
        tipo: s.tiposede ?? '',
        direccion: s.direccion ?? '',
        ciudad: s.ciudad ?? '',
        departamento: s.departamento ?? '',
        responsable: s.responsable ?? '',
        telefono: s.telefono ?? '',
        empleados: Number(s.totalempleados) || 0,
        fotoUrl: s.fotoUrl ?? '',
      })),
      cifras: [
        { etiqueta: 'Sedes', valor: sedes.length },
        { etiqueta: 'Departamentos', valor: departamentos.size },
        { etiqueta: 'Empleados declarados en sedes', valor: empleadosEnSedes },
        { etiqueta: 'Servicios', valor: servicios.length },
      ],
      // Los servicios se leen mejor uno a uno que repartidos en barras: son
      // pocos, y lo que interesa de cada uno es su perfil completo.
      tablas: [{
        titulo: 'Servicios que presta la organización',
        columnas: ['Servicio', 'Categoría', 'Importancia', 'Frecuencia', 'Cobertura'],
        filas: servicios.map(s => [
          s.nombreServicio ?? '',
          s.categoriaServicio ?? '',
          this.primeraParte(s.importanciaServicio),
          this.primeraParte(s.frecuenciaOperacion),
          this.primeraParte(s.coberturaOperacion),
        ]),
      }],

      repartos: [],
    };
  }

  /**
   * Las opciones vienen como "Diario - Todos los dias": en una tabla estrecha
   * basta la primera parte, y la aclaracion sobra.
   */
  private primeraParte(valor: string | undefined): string {
    return String(valor ?? '').split(' - ')[0];
  }

  /**
   * Quién respondió. Es la sección que sostiene el resto: si la muestra no es
   * representativa, ningún porcentaje posterior lo es.
   */
  private personas(
    respuestas: Record<string, any>[],
    encuesta: any,
    empresa: { nombre: string; poblacion: number; cobertura: number }
  ): ModelsInforme.Seccion {
    const personal = encuesta?.modulos?.find((m: any) => m.fijo);
    const preguntas: any[] = personal?.preguntas ?? [];

    // El genero va aparte, como cifra destacada, asi que se saca del reparto
    // para no contarlo dos veces en la misma seccion.
    const repartos = preguntas
      .filter(p => (p.tipo === 'unica' || p.tipo === 'multiple') && p.id !== 'genero')
      .map(p => {
        const reparto = this.repartoDePregunta(p, respuestas);

        // La escolaridad es una escala que se lee en orden, asi que va en
        // columnas y con su propia lectura.
        if (p.id === 'escolaridad') {
          reparto.grafica = 'columnas';
          reparto.texto = this.textoEscolaridad(reparto, respuestas.length);
        }

        // El estrato son pocas categorias y se quiere el dato exacto junto al
        // peso: tabla a la izquierda y pastel a la derecha.
        // Nueve areas con nombres largos: horizontal, que es donde caben.
        if (p.id === 'areaDepartamento') {
          reparto.grafica = 'barras';
          reparto.texto = this.textoAreas(reparto, respuestas.length);
        }

        // Categorias sueltas con nombres largos: horizontal.
        if (p.id === 'estadoCivil') {
          reparto.grafica = 'barras';
          reparto.texto = this.textoEstadoCivil(reparto, respuestas.length);
        }

        if (p.id === 'estrato') {
          reparto.grafica = 'tablaPastel';
          reparto.texto = this.textoEstrato(reparto, respuestas.length);
        }
        return reparto;
      });

    this.emparejarCondicionesLaborales(repartos, respuestas.length);

    const hombres = respuestas.filter(r => r['genero'] === 'Masculino').length;
    const mujeres = respuestas.filter(r => r['genero'] === 'Femenino').length;
    const base = respuestas.length || 1;

    return {
      id: 'personas',
      titulo: 'Caracterización de la población',
      texto: this.textoPoblacion(respuestas.length, hombres, mujeres, empresa),
      sinDatos: !respuestas.length,
      cifras: [],
      destacados: [
        {
          etiqueta: 'Hombres', valor: hombres, icono: 'man',
          porcentaje: Math.round((hombres / base) * 1000) / 10,
        },
        {
          etiqueta: 'Mujeres', valor: mujeres, icono: 'woman',
          porcentaje: Math.round((mujeres / base) * 1000) / 10,
        },
      ],
      repartos,
    };
  }

  /**
   * Redacta la presentación de la muestra.
   *
   * Dice lo que los datos dicen y nada más: cuántos respondieron, qué parte de
   * la población son y cómo se reparten por género. La lectura —si eso es
   * típico del sector, si la muestra basta— la pone quien emite el informe,
   * que es quien conoce su empresa.
   */
  private textoPoblacion(
    muestra: number,
    hombres: number,
    mujeres: number,
    empresa: { nombre: string; poblacion: number; cobertura: number }
  ): string {
    if (!muestra) return '';

    const nombre = empresa.nombre || 'la organización';
    const base = muestra || 1;
    const pctH = Math.round((hombres / base) * 1000) / 10;
    const pctM = Math.round((mujeres / base) * 1000) / 10;

    // Sin poblacion declarada no se puede dar un porcentaje de cobertura, y
    // inventarlo seria peor que omitirlo.
    const cobertura = empresa.poblacion > 0
      ? `, lo que representa el ${empresa.cobertura}% del total de la población objetivo de ${empresa.poblacion.toLocaleString('es-CO')} colaboradores`
      : '. No se ha registrado el total de colaboradores de la organización, así que no es posible calcular qué parte de la población representa';

    const mayoria = hombres === mujeres
      ? 'un reparto equilibrado entre hombres y mujeres'
      : hombres > mujeres
        ? `una predominancia masculina con ${hombres} hombres (${pctH}%) frente a ${mujeres} mujeres (${pctM}%)`
        : `una predominancia femenina con ${mujeres} mujeres (${pctM}%) frente a ${hombres} hombres (${pctH}%)`;

    return `La encuesta de percepción del riesgo vial y movilidad fue diligenciada por los `
      + `trabajadores directos de ${nombre}. La muestra obtenida fue de ${muestra} personas`
      + `${cobertura}.` + '\n\n'
      + `En la distribución por género se observa ${mayoria} de los ${muestra} encuestados.`;
  }

  /**
   * Redacta el reparto por formación académica.
   *
   * Enumera lo que hay, de mayor a menor, y agrupa aparte la formación
   * superior, que es la comparacion que suele interesar. No afirma nada que
   * los datos no digan: si el nivel superior no esta entre las opciones de la
   * encuesta, esa frase no aparece.
   */
  private textoEscolaridad(reparto: ModelsInforme.Reparto, muestra: number): string {
    if (!muestra || !reparto.filas.length) return '';

    const frase = (f: { etiqueta: string; total: number; porcentaje: number }) =>
      `${f.porcentaje}% (${f.total}) ${f.etiqueta.toLowerCase()}`;

    const principales = reparto.filas.slice(0, 4).map(frase);
    const listado = principales.length > 1
      ? `${principales.slice(0, -1).join(', ')} y ${principales[principales.length - 1]}`
      : principales[0];

    let texto = `De las ${muestra} personas encuestadas, la formación académica se `
      + `reparte así: ${listado}.`;

    // Solo si la encuesta contempla esos niveles: las opciones las edita el
    // superadministrador y una lista fija se quedaria atras en silencio.
    const superiores = reparto.filas.filter(f =>
      /profesional|posgrado|maestr|doctor|especializa/i.test(f.etiqueta)
    );
    if (superiores.length) {
      const total = superiores.reduce((n, f) => n + f.total, 0);
      const pct = Math.round((total / muestra) * 1000) / 10;
      texto += ` En conjunto, ${total} personas (${pct}%) cuentan con formación `
        + `superior o de posgrado.`;
    }

    return texto;
  }

  /**
   * Redacta el reparto por area o departamento.
   *
   * Dice donde esta la gente y cuanto se concentra, que es lo que orienta
   * donde dirigir la formacion y los controles. No clasifica las areas por
   * exposicion al riesgo vial: eso depende de como opere cada empresa y lo
   * sabe quien la conoce, no el sistema.
   */
  private textoAreas(reparto: ModelsInforme.Reparto, muestra: number): string {
    if (!muestra || !reparto.filas.length) return '';

    const principales = reparto.filas.slice(0, 3);
    const listado = principales
      .map(f => `${f.etiqueta} con ${f.total} (${f.porcentaje}%)`)
      .join(', ');

    let texto = `La población encuestada se distribuye en ${reparto.filas.length} `
      + `${reparto.filas.length === 1 ? 'área' : 'áreas'}. `;

    if (principales.length > 1) {
      const concentracion = principales.reduce((n, f) => n + f.total, 0);
      const pct = Math.round((concentracion / muestra) * 1000) / 10;
      texto += `Las de mayor representación son ${listado}, que en conjunto reúnen `
        + `${concentracion} personas (${pct}%) de las ${muestra} encuestadas.`;
    } else {
      texto += `La de mayor representación es ${listado}.`;
    }

    return texto;
  }

  /**
   * Junta el tipo de contrato y la jornada en un solo bloque.
   *
   * Son la misma familia —las condiciones de vinculación— y las dos tablas son
   * cortas. Juntas se leen de una vez; separadas ocupan el doble de alto
   * diciendo lo mismo.
   *
   * Muta la lista que recibe: saca el contrato de su sitio y lo cuelga de la
   * jornada.
   */
  private emparejarCondicionesLaborales(
    repartos: ModelsInforme.Reparto[], muestra: number
  ): void {
    const jornada = repartos.find(r => r.id === 'jornada');
    const contrato = repartos.find(r => r.id === 'tipoContrato');
    if (!jornada || !contrato) return;

    jornada.titulo = 'Condiciones de vinculación';
    jornada.grafica = 'tabla';
    jornada.emparejado = contrato;
    jornada.texto = this.textoCondicionesLaborales(jornada, contrato, muestra);

    repartos.splice(repartos.indexOf(contrato), 1);
  }

  /**
   * Redacta el tipo de contrato y la jornada juntos.
   *
   * Destaca la jornada nocturna o mixta: conducir al terminar un turno de
   * noche es uno de los factores de riesgo vial que la Resolucion pide
   * vigilar, asi que esa cifra merece salir dicha y no solo tabulada.
   */
  private textoCondicionesLaborales(
    jornada: ModelsInforme.Reparto,
    contrato: ModelsInforme.Reparto,
    muestra: number
  ): string {
    if (!muestra) return '';

    const partes: string[] = [];

    const contratoPrincipal = contrato.filas[0];
    if (contratoPrincipal) {
      partes.push(`El tipo de vinculación más frecuente es `
        + `${contratoPrincipal.etiqueta.toLowerCase()}, con ${contratoPrincipal.total} `
        + `personas (${contratoPrincipal.porcentaje}%) de las ${muestra} encuestadas.`);
    }

    const jornadaPrincipal = jornada.filas[0];
    if (jornadaPrincipal) {
      partes.push(`La jornada predominante es la `
        + `${jornadaPrincipal.etiqueta.toLowerCase()}, con ${jornadaPrincipal.total} `
        + `(${jornadaPrincipal.porcentaje}%).`);
    }

    // Por el nombre de la opcion y no por una lista fija: las edita el
    // superadministrador.
    const nocturnas = jornada.filas.filter(f => /noct|noche|mixta/i.test(f.etiqueta));
    if (nocturnas.length) {
      const total = nocturnas.reduce((n, f) => n + f.total, 0);
      const pct = Math.round((total / muestra) * 1000) / 10;
      partes.push(`${total} personas (${pct}%) trabajan en jornada nocturna o mixta, `
        + `situación que incrementa la fatiga y con ella el riesgo en los `
        + `desplazamientos al terminar el turno.`);
    }

    return partes.join(' ');
  }

  /**
   * Redacta el reparto por estado civil.
   *
   * Agrupa aparte a quienes conviven en pareja, que es la lectura que suele
   * interesar, detectandolo por el nombre de la opcion y no por una lista
   * fija: las opciones las edita el superadministrador.
   */
  private textoEstadoCivil(reparto: ModelsInforme.Reparto, muestra: number): string {
    if (!muestra || !reparto.filas.length) return '';

    const principal = reparto.filas[0];
    const resto = reparto.filas.slice(1, 4)
      .map(f => `${f.etiqueta.toLowerCase()} con ${f.total} (${f.porcentaje}%)`);

    let texto = `En la distribución por estado civil predomina la condición de `
      + `${principal.etiqueta.toLowerCase()}, con ${principal.total} personas `
      + `(${principal.porcentaje}%) de las ${muestra} encuestadas.`;

    if (resto.length) {
      const listado = resto.length > 1
        ? `${resto.slice(0, -1).join(', ')} y ${resto[resto.length - 1]}`
        : resto[0];
      texto += ` Le siguen ${listado}.`;
    }

    const enPareja = reparto.filas.filter(f => /casad|uni[oó]n libre|convivi/i.test(f.etiqueta));
    if (enPareja.length) {
      const total = enPareja.reduce((n, f) => n + f.total, 0);
      const pct = Math.round((total / muestra) * 1000) / 10;
      texto += ` En conjunto, ${total} personas (${pct}%) conviven en pareja.`;
    }

    return texto;
  }

  /**
   * Redacta el reparto por estrato socioeconómico.
   *
   * Abre recordando qué es la estratificación, porque el informe lo lee gente
   * de fuera de la empresa, y agrupa en los tres tramos con que se suele leer:
   * uno a tres, cuatro y cinco, y seis.
   *
   * El número de estrato se saca de la etiqueta, no de una lista fija: las
   * opciones las edita el superadministrador y una lista cerrada se quedaría
   * atrás en cuanto alguien las renombrara.
   */
  private textoEstrato(reparto: ModelsInforme.Reparto, muestra: number): string {
    if (!muestra || !reparto.filas.length) return '';

    const definicion = 'La estratificación socioeconómica es una clasificación en estratos '
      + 'de los inmuebles residenciales que deben recibir servicios públicos. Permite '
      + 'asignar subsidios y cobrar contribuciones en esa área.';

    const numero = (etiqueta: string) => {
      const encontrado = etiqueta.match(/\d+/);
      return encontrado ? Number(encontrado[0]) : null;
    };

    const sumar = (desde: number, hasta: number) => reparto.filas
      .filter(f => {
        const n = numero(f.etiqueta);
        return n !== null && n >= desde && n <= hasta;
      })
      .reduce((total, f) => total + f.total, 0);

    const pct = (total: number) => Math.round((total / muestra) * 1000) / 10;

    const bajos = sumar(1, 3);
    const medios = sumar(4, 5);
    const altos = sumar(6, 6);
    const sinNumero = muestra - bajos - medios - altos;

    // Sin estratos reconocibles no se fuerza la lectura de tramos.
    if (!bajos && !medios && !altos) return definicion;

    let texto = definicion + '\n\n'
      + `Se puede evidenciar que el ${pct(bajos)}% de la muestra `
      + `se ubica en los estratos uno (1), dos (2) y tres (3), el ${pct(medios)}% en los `
      + `estratos cuatro (4) y cinco (5), y el ${pct(altos)}% en el estrato seis (6).`;

    if (sinNumero > 0) {
      texto += ` Las ${sinNumero} respuestas restantes no indican un estrato reconocible.`;
    }

    return texto;
  }

  /** Una sección por cada módulo de la encuesta que la empresa activó. */
  private modulosEncuesta(
    respuestas: Record<string, any>[],
    encuesta: any
  ): ModelsInforme.Seccion[] {
    const modulos: any[] = (encuesta?.modulos ?? [])
      .filter((m: any) => !m.fijo && encuesta.modulosActivos.includes(m.id));

    return modulos.map(modulo => {
      const seccion: ModelsInforme.Seccion = {
        id: modulo.id,
        titulo: modulo.titulo,
        texto: '',
        sinDatos: !respuestas.length,
        cifras: [],
        repartos: (modulo.preguntas ?? [])
          .filter((p: any) => p.tipo === 'unica' || p.tipo === 'multiple')
          .map((p: any) => this.repartoDePregunta(p, respuestas)),
      };

      // Cada modulo tiene su lectura: que cifras importan y como se pintan.
      // Los que todavia no la tienen salen con el reparto simple de siempre.
      if (modulo.id === 'modulo2') this.enriquecerSalud(seccion, respuestas.length);
      if (modulo.id === 'modulo3') this.enriquecerConduccion(seccion, modulo, respuestas);
      if (modulo.id === 'modulo4') this.enriquecerDesplazamientos(seccion, respuestas);
      if (modulo.id === 'modulo5') this.enriquecerRiesgos(seccion, respuestas);
      if (modulo.id === 'modulo6') this.enriquecerMejora(seccion, respuestas);

      this.ordenarEscalas(seccion.repartos, modulo);

      return seccion;
    });
  }

  /**
   * Da lectura y forma al modulo de salud.
   *
   * La salud de quien conduce no es un dato de bienestar: la fatiga, el dolor
   * y las limitaciones fisicas reducen la capacidad de reaccion, y por eso la
   * Resolucion la mira dentro del diagnostico vial.
   */
  private enriquecerSalud(seccion: ModelsInforme.Seccion, muestra: number): void {
    const buscar = (id: string) => seccion.repartos.find(r => r.id === id);

    const estado = buscar('estadoGeneral');
    const limitacion = buscar('limitacionFisica');
    const discapacidad = buscar('discapacidad');
    const dolor = buscar('dolorMolestia');
    const incapacidades = buscar('incapacidades');
    const actividad = buscar('actividadFisica');

    seccion.texto = this.textoSalud(muestra, { estado, limitacion, dolor });

    // Cuatro categorias que son partes de un todo: se lee mejor en anillo.
    if (estado) {
      estado.grafica = 'dona';
      estado.texto = this.textoEstadoSalud(estado, muestra);
    }

    // Dolor: tambien escala, y es el indicador de fatiga mas directo.
    if (dolor) {
      dolor.grafica = 'columnas';
      dolor.texto = this.textoAfirmativas(
        dolor, muestra,
        'sienten dolor o molestia durante o después de la jornada',
        'La fatiga acumulada reduce la atención y el tiempo de reacción al conducir.'
      );
    }

    // Limitacion y discapacidad hablan de lo mismo: van juntas.
    if (limitacion && discapacidad) {
      limitacion.titulo = 'Limitaciones físicas y discapacidad';
      limitacion.grafica = 'tabla';
      limitacion.emparejado = discapacidad;
      limitacion.texto = this.textoAfirmativas(
        limitacion, muestra,
        'declaran alguna limitación física para realizar su trabajo',
        'Conviene revisar si esas limitaciones exigen ajustes en las tareas de conducción.'
      );
      seccion.repartos.splice(seccion.repartos.indexOf(discapacidad), 1);
    }

    if (incapacidades) {
      incapacidades.grafica = 'barras';
      incapacidades.texto = this.textoAfirmativas(
        incapacidades, muestra,
        'tuvieron incapacidades médicas en los últimos doce meses',
        ''
      );
    }

    // Factor protector, no de riesgo: interesa el peso de cada respuesta.
    if (actividad) {
      actividad.grafica = 'tablaPastel';
      actividad.texto = this.textoActividadFisica(actividad, muestra);
    }
  }

  /**
   * Da lectura y forma al modulo de conduccion.
   *
   * Aqui cambia el denominador. Salvo la primera, todas estas preguntas solo
   * se le hacen a quien conduce, asi que calcular sus porcentajes sobre la
   * muestra entera los diluye: si de 581 encuestados conducen 200 y la mitad
   * tiene infracciones, eso es el 50% de los conductores, no el 17% de la
   * plantilla. Lo segundo, en un informe, es decir algo falso.
   */
  private enriquecerConduccion(
    seccion: ModelsInforme.Seccion,
    modulo: any,
    respuestas: Record<string, any>[]
  ): void {
    const muestra = respuestas.length;
    const conductores = respuestas.filter(
      r => /^s[ií]$/i.test(String(r['conduceVehiculos'] ?? '').trim())
    );

    const buscar = (id: string) => seccion.repartos.find(r => r.id === id);

    // Sin conductores no hay nada que recalcular: las preguntas
    // condicionadas quedaron vacias y basta con decirlo.
    if (!conductores.length) {
      seccion.texto = this.textoConduccion(muestra, 0, {});
      return;
    }

    for (const pregunta of (modulo.preguntas ?? []) as any[]) {
      if (pregunta.condicion?.pregunta !== 'conduceVehiculos') continue;

      const reparto = buscar(pregunta.id);
      if (!reparto) continue;

      reparto.filas = this.repartoDePregunta(pregunta, conductores).filas;
      reparto.titulo = `${pregunta.etiqueta} (sobre ${conductores.length} conductores)`;
    }

    // El texto se redacta ya con las cifras recalculadas sobre conductores.
    seccion.texto = this.textoConduccion(muestra, conductores.length, {
      licencia: buscar('licenciaConduccion'),
      infracciones: buscar('infraccionesTransito'),
      accidentes: buscar('accidenteUltimoAno'),
    });

    this.formaConduccion(seccion, buscar, conductores.length);
  }

  /** Que forma toma cada pregunta del modulo de conduccion. */
  private formaConduccion(
    seccion: ModelsInforme.Seccion,
    buscar: (id: string) => ModelsInforme.Reparto | undefined,
    conductores: number
  ): void {
    const emparejar = (uno: string, otro: string, titulo: string) => {
      const a = buscar(uno);
      const b = buscar(otro);
      if (!a || !b) return;
      a.titulo = titulo;
      a.grafica = 'tabla';
      a.emparejado = b;
      seccion.repartos.splice(seccion.repartos.indexOf(b), 1);
    };

    // Quien conduce y quien no: partes de un todo, y sobre la muestra entera.
    const conduce = buscar('conduceVehiculos');
    if (conduce) conduce.grafica = 'dona';

    // Tipos de vehiculo: categorias sueltas con nombres largos.
    const tipos = buscar('tipoVehiculos');
    if (tipos) tipos.grafica = 'barras';

    // Ocho categorias cortas y ordenadas de A1 a C3: se leen en fila.
    const categoria = buscar('categoriaLicencia');
    if (categoria) categoria.grafica = 'columnas';

    // La experiencia es una escala: se lee en orden.
    const experiencia = buscar('experienciaConduccion');
    if (experiencia) {
      experiencia.grafica = 'columnas';
      experiencia.texto = this.textoExperiencia(experiencia, conductores);
    }

    // Tres opciones y lo que importa es el dato exacto: tabla.
    const licencia = buscar('licenciaConduccion');
    if (licencia) {
      licencia.grafica = 'tabla';
      licencia.texto = this.textoLicencia(licencia, conductores);
    }

    // La infraccion y su estado hablan de lo mismo: van juntas.
    emparejar('infraccionesTransito', 'estadoInfraccion', 'Infracciones de tránsito y su estado');
    const infracciones = buscar('infraccionesTransito');
    if (infracciones) infracciones.texto = this.textoInfracciones(infracciones, conductores);

    // Haber tenido accidente y si fue en jornada: tambien la misma familia.
    emparejar('accidenteUltimoAno', 'accidenteEnJornada', 'Accidentes de tránsito en el último año');
    const accidentes = buscar('accidenteUltimoAno');
    if (accidentes) {
      accidentes.texto = this.textoAccidentes(
        accidentes, accidentes.emparejado, conductores
      );
    }

    // La gravedad va aparte: es lo que decide si hubo que investigar.
    const gravedad = buscar('accidenteTransito');
    if (gravedad) {
      gravedad.grafica = 'barras';
      gravedad.texto = this.textoGravedad(gravedad);
    }

    // Conocimiento de las normas: partes de un todo.
    const normas = buscar('conocimientoNormas');
    if (normas) {
      normas.grafica = 'dona';
      normas.texto = this.textoNormas(normas, conductores);
    }

    const emergencias = buscar('capacidadEmergencia');
    if (emergencias) {
      emergencias.grafica = 'tabla';
      emergencias.texto = this.textoCapacitacion(emergencias, conductores);
    }
  }

  /**
   * Da lectura y forma al modulo de desplazamientos.
   *
   * El modulo son en realidad dos cosas que la Resolucion separa y que el
   * informe tiene que separar tambien: el trayecto entre la casa y el trabajo
   * (in itinere) y los desplazamientos que se hacen durante la jornada (en
   * mision). Los segundos ocurren por encargo de la empresa, asi que caen de
   * lleno dentro del alcance del PESV; los primeros importan como exposicion
   * al riesgo, pero no son lo mismo.
   */
  private enriquecerDesplazamientos(
    seccion: ModelsInforme.Seccion,
    respuestas: Record<string, any>[]
  ): void {
    const muestra = respuestas.length;
    const buscar = (id: string) => seccion.repartos.find(r => r.id === id);

    // ── El trayecto casa-trabajo: lo responde toda la muestra ──────────────
    const medios = buscar('mediosTransporte');
    if (medios) {
      medios.titulo = 'Medios de transporte para llegar al trabajo';
      medios.grafica = 'barras';
      medios.texto = this.textoMedios(medios, muestra);
    }

    const tiempo = buscar('tiempoDesplazamiento');
    if (tiempo) {
      tiempo.grafica = 'columnas';
      tiempo.texto = this.textoTiempoTrayecto(tiempo, muestra);
    }

    // Estado y propiedad hablan del mismo vehiculo: se leen juntos.
    const estado = buscar('estadoVehiculo');
    const propiedad = buscar('propiedadVehiculo');
    if (estado && propiedad) {
      estado.titulo = 'El vehículo en el que se desplaza: estado y propiedad';
      estado.grafica = 'tabla';
      estado.emparejado = propiedad;
      estado.texto = this.textoVehiculoTrayecto(estado, propiedad, muestra);
      seccion.repartos.splice(seccion.repartos.indexOf(propiedad), 1);
    }

    const incidentes = buscar('incidentesDesplazamiento');
    if (incidentes) {
      incidentes.grafica = 'barras';
      incidentes.texto = this.textoIncidentes(incidentes, muestra);
    }

    // ── Los desplazamientos en jornada: base propia ────────────────────────
    //
    // La encuesta no condiciona estas dos preguntas, asi que las ve todo el
    // mundo; pero solo significan algo para quien se desplaza por trabajo, y
    // sobre la muestra entera saldrian rebajadas.
    const enMision = respuestas.filter(
      r => /^s[ií]$/i.test(String(r['desplazamientosJornada'] ?? '').trim())
    );

    const realiza = buscar('desplazamientosJornada');
    if (realiza) {
      realiza.titulo = 'Desplazamientos u operación de vehículos durante la jornada';
      realiza.grafica = 'dona';
      realiza.texto = this.textoEnMision(enMision.length, muestra);
    }

    seccion.texto = this.textoDesplazamientos(muestra, enMision.length, {
      incidentes,
      estado,
    });

    // Sin nadie que se desplace en jornada no hay base sobre la que recalcular.
    if (!enMision.length) return;

    for (const id of ['tipoDesplazamientoJornada', 'tiempoDuracionDesplazamiento']) {
      const reparto = buscar(id);
      if (!reparto) continue;

      reparto.filas = this.repartoDe(
        reparto.titulo,
        enMision.length,
        enMision.flatMap(r => {
          const valor = r[id];
          return Array.isArray(valor) ? valor : [valor];
        })
      ).filas;
      reparto.grafica = 'columnas';
      reparto.titulo = `${reparto.titulo} (sobre ${enMision.length} personas)`;
    }

    const mediosJornada = buscar('tipoDesplazamientoJornada');
    if (mediosJornada) {
      mediosJornada.texto = this.textoMediosJornada(mediosJornada, enMision.length);
    }

    const duracion = buscar('tiempoDuracionDesplazamiento');
    if (duracion) {
      duracion.texto = this.textoDuracionJornada(duracion, enMision.length);
    }
  }

  /**
   * Devuelve las escalas al orden en que la encuesta ofrecio las opciones.
   *
   * El reparto generico ordena por frecuencia, que es lo correcto para una
   * lista de causas: interesa cual pesa mas. Pero en una escala destruye la
   * informacion. Una escolaridad ordenada de primaria a posgrado ensena la
   * forma de la plantilla; la misma escolaridad ordenada por tamano de barra
   * no ensena nada, y unas categorias de licencia en A1, C2, B1, A2 no se
   * pueden leer.
   *
   * La regla es la forma del grafico: si algo se pinta en columnas es porque
   * se lee de izquierda a derecha, y entonces manda el orden de la encuesta.
   * Las barras horizontales y las tablas siguen ordenadas por frecuencia.
   */
  private ordenarEscalas(repartos: ModelsInforme.Reparto[], modulo: any): void {
    const opcionesDe = new Map<string, string[]>(
      ((modulo.preguntas ?? []) as any[])
        .filter(p => p.opciones?.length)
        .map(p => [
          p.id as string,
          (p.opciones as any[]).map(o => String(o.etiqueta ?? o.valor)),
        ])
    );

    for (const reparto of repartos) {
      if (!reparto.id || reparto.grafica !== 'columnas') continue;

      const orden = opcionesDe.get(reparto.id);
      if (!orden) continue;

      // Una respuesta que ya no esta entre las opciones (la encuesta cambio
      // despues de recogerla) se va al final en vez de desaparecer.
      const posicion = (etiqueta: string) => {
        const i = orden.indexOf(etiqueta);
        return i < 0 ? orden.length : i;
      };

      reparto.filas.sort((a, b) => posicion(a.etiqueta) - posicion(b.etiqueta));
    }
  }

  /**
   * Lo que se escribe para decir "no tengo nada que proponer".
   *
   * En una pregunta abierta y opcional la mitad de las respuestas son una
   * negacion corta. Listarlas como propuestas llenaria el anexo de ruido, asi
   * que se descartan; cualquier cosa mas larga se conserva tal cual se
   * escribio, sin corregir ni resumir.
   */
  private static readonly SIN_PROPUESTA =
    /^(no|nada|ning[uú]n[ao]?|n\/?a|no aplica|sin comentarios?|ok)[.!]?$/i;

  /**
   * Da lectura y forma al modulo de mejora y participacion.
   *
   * Es el modulo que cierra la encuesta y el unico donde la gente habla con
   * sus propias palabras. Las propuestas escritas no son un adorno: la
   * Resolucion pide que el diagnostico recoja la participacion de los
   * trabajadores, y estas son la prueba de que se recogio.
   */
  private enriquecerMejora(
    seccion: ModelsInforme.Seccion,
    respuestas: Record<string, any>[]
  ): void {
    const muestra = respuestas.length;
    const buscar = (id: string) => seccion.repartos.find(r => r.id === id);

    const acciones = buscar('accionesMejora');
    if (acciones) {
      acciones.titulo = 'Acciones que los trabajadores piden para mejorar la seguridad vial';
      acciones.grafica = 'barras';
      acciones.texto = this.textoAcciones(acciones, muestra);
    }

    const participacion = buscar('participacionAnterior');
    if (participacion) {
      participacion.titulo = 'Participación previa en actividades de seguridad vial';
      participacion.grafica = 'dona';
      participacion.texto = this.textoParticipacion(participacion, muestra);
    }

    // Las propuestas van sin nombre. La encuesta es nominal, pero firmar una
    // critica a las condiciones de trabajo en un documento que circula es la
    // forma mas rapida de que nadie vuelva a escribir nada.
    const propuestas = respuestas
      .map(r => String(r['sugerenciasMejora'] ?? '').trim())
      .filter(texto => texto && !InformeDiagnosticoService.SIN_PROPUESTA.test(texto));

    if (propuestas.length) {
      seccion.tablas = [{
        titulo: `Propuestas recibidas de los trabajadores (${propuestas.length})`,
        columnas: ['Propuesta'],
        filas: propuestas.map(texto => [texto]),
      }];
    }

    seccion.texto = this.textoMejora(muestra, acciones, participacion, propuestas.length);
  }

  /** Resume el modulo: que piden, si ya se les formo y cuantos escribieron. */
  private textoMejora(
    muestra: number,
    acciones: ModelsInforme.Reparto | undefined,
    participacion: ModelsInforme.Reparto | undefined,
    propuestas: number
  ): string {
    if (!muestra) return '';

    const partes = [
      'Este módulo recoge lo que los propios trabajadores proponen para mejorar la '
      + 'seguridad vial de la organización. A diferencia del resto del diagnóstico, que '
      + 'describe la situación, aquí se recoge la agenda: son las medidas que pide quien '
      + 'se expone al riesgo, y por eso alimentan directamente el plan anual de trabajo.',
    ];

    const pedida = this.principales(acciones, 1)[0];
    if (pedida) {
      partes.push(`La acción más solicitada es ${pedida.etiqueta.toLowerCase()}, señalada `
        + `por ${pedida.total} personas (${pedida.porcentaje}%).`);
    }

    const conFormacion = this.sumarQue(participacion, /^s[ií]$/i);
    if (participacion) {
      partes.push(`${conFormacion} de las ${muestra} personas encuestadas `
        + `(${this.pct(conFormacion, muestra)}%) recuerdan haber participado antes en `
        + `alguna actividad de seguridad vial en la empresa.`);
    }

    if (propuestas) {
      partes.push(`Además, ${propuestas} personas escribieron una propuesta concreta. Se `
        + `transcriben al final de esta sección, sin atribuir, para que la participación `
        + `quede documentada.`);
    }

    return partes.join(' ');
  }

  /** Lo que la gente pide, que es media agenda del plan de trabajo. */
  private textoAcciones(reparto: ModelsInforme.Reparto, muestra: number): string {
    const top = this.principales(reparto, 3);
    if (!top.length) return '';

    const listado = this.enumerar(
      top.map(f => `${f.etiqueta.toLowerCase()} (${f.total}, ${f.porcentaje}%)`)
    );

    return `Las acciones más pedidas son ${listado}. Conviene contrastarlas con los `
      + `factores de riesgo identificados en el módulo anterior: cuando coinciden, la `
      + `medida tiene respaldo doble y debería encabezar el plan; cuando no, hay una `
      + `percepción que el diagnóstico no confirma y que también merece explicación. `
      + `Los porcentajes se calculan sobre las ${muestra} personas encuestadas y suman `
      + `más de cien porque cada una puede señalar varias acciones.`;
  }

  /**
   * La linea base de formacion.
   *
   * "No recuerdo" no se suma con los que si participaron: una capacitacion
   * que no dejo recuerdo no dejo tampoco conducta, y para efectos del plan
   * cuenta como cobertura no efectiva.
   */
  private textoParticipacion(reparto: ModelsInforme.Reparto, muestra: number): string {
    const si = this.sumarQue(reparto, /^s[ií]$/i);
    const no = this.sumarQue(reparto, /^no$/i);
    const noRecuerda = this.sumarQue(reparto, /no recuerdo/i);

    let texto = `${si} personas (${this.pct(si, muestra)}%) recuerdan haber participado en `
      + `alguna actividad o capacitación sobre seguridad vial en la empresa.`;

    if (no) {
      texto += ` ${no} (${this.pct(no, muestra)}%) no han participado nunca: son la `
        + `población objetivo inmediata del plan de formación.`;
    }

    if (noRecuerda) {
      texto += ` Otras ${noRecuerda} (${this.pct(noRecuerda, muestra)}%) no lo recuerdan. `
        + `Una capacitación que no deja recuerdo no deja tampoco conducta, así que para `
        + `efectos del plan conviene tratarlas como cobertura no efectiva.`;
    }

    return texto;
  }

  /**
   * Las cuatro familias de factores que la Resolucion usa para clasificar las
   * causas de un siniestro vial.
   *
   * El orden es el de la norma, no el de la encuesta: humano, vehiculo, via y
   * entorno. En el informe se reordenan por peso, pero la lista de aqui fija
   * cuales son y como se nombran.
   */
  private static readonly FACTORES = [
    { id: 'factorHumano', etiqueta: 'Factor humano' },
    { id: 'factorVehiculo', etiqueta: 'Factor vehículo' },
    { id: 'factorVia', etiqueta: 'Factor vía' },
    { id: 'factorEntorno', etiqueta: 'Factor entorno' },
  ];

  /**
   * Da lectura y forma al modulo de identificacion de riesgos.
   *
   * Es el nucleo del diagnostico. Tiene dos partes: como percibe la gente el
   * riesgo y si lo reporta, y cuales de los cuatro factores de la Resolucion
   * senalan como causa. Lo segundo es lo que alimenta el plan de accion, asi
   * que antes del detalle de cada factor se antepone un resumen que compara
   * los cuatro y permite priorizar.
   */
  private enriquecerRiesgos(
    seccion: ModelsInforme.Seccion,
    respuestas: Record<string, any>[]
  ): void {
    const muestra = respuestas.length;
    const buscar = (id: string) => seccion.repartos.find(r => r.id === id);

    // ── Percepcion del riesgo y cultura de reporte ────────────────────────
    const exposicion = buscar('exposicionRiesgos');
    if (exposicion) {
      exposicion.grafica = 'dona';
      exposicion.texto = this.textoExposicion(exposicion, muestra);
    }

    // Haber vivido una situacion de riesgo y haberla reportado son la misma
    // historia contada en dos preguntas: separadas no se ve la brecha.
    const experiencia = buscar('experienciaRiesgos');
    const reporte = buscar('reporteRiesgo');
    if (experiencia && reporte) {
      experiencia.titulo = 'Situaciones de riesgo vividas y su reporte a la empresa';
      experiencia.grafica = 'tabla';
      experiencia.emparejado = reporte;
      experiencia.texto = this.textoReporte(experiencia, reporte);
      seccion.repartos.splice(seccion.repartos.indexOf(reporte), 1);
    }

    // Saber reportar y percibir que hay cultura: las dos miran al sistema.
    const sabeReportar = buscar('conocimientoReporte');
    const cultura = buscar('culturaSeguridad');
    if (sabeReportar && cultura) {
      sabeReportar.titulo = 'Conocimiento del canal de reporte y cultura de seguridad vial';
      sabeReportar.grafica = 'tabla';
      sabeReportar.emparejado = cultura;
      sabeReportar.texto = this.textoCultura(sabeReportar, cultura, muestra);
      seccion.repartos.splice(seccion.repartos.indexOf(cultura), 1);
    }

    // ── Los cuatro factores ───────────────────────────────────────────────
    const resumen = this.resumenFactores(respuestas, muestra);

    for (const factor of InformeDiagnosticoService.FACTORES) {
      const reparto = buscar(factor.id);
      if (!reparto) continue;

      reparto.titulo = `${factor.etiqueta}: causas percibidas`;
      reparto.grafica = 'barras';
      this.acortarEtiquetas(reparto);
      reparto.texto = this.textoFactor(reparto, factor.etiqueta, muestra);
    }

    // El resumen va justo antes del primer factor, para que se lea como
    // entrada al detalle y no como una cifra suelta al final.
    const primero = seccion.repartos.findIndex(
      r => InformeDiagnosticoService.FACTORES.some(f => f.id === r.id)
    );
    if (primero >= 0) seccion.repartos.splice(primero, 0, resumen);

    seccion.texto = this.textoRiesgos(muestra, resumen, { exposicion, experiencia, reporte });
  }

  /**
   * Cuantas personas senalan al menos una causa real en cada factor.
   *
   * Se cuenta por persona y no por marca: una persona que senala cinco causas
   * del factor humano sigue siendo una persona que percibe riesgo humano, y
   * asi las cuatro familias se pueden comparar entre si.
   */
  private resumenFactores(
    respuestas: Record<string, any>[], muestra: number
  ): ModelsInforme.Reparto {
    const filas = InformeDiagnosticoService.FACTORES.map(factor => {
      const total = respuestas.filter(r => {
        const valor = r[factor.id];
        const marcas = Array.isArray(valor) ? valor : valor ? [valor] : [];
        return marcas.some((m: any) => !this.esAusenciaDeRiesgo(String(m)));
      }).length;

      return { etiqueta: factor.etiqueta, total, porcentaje: this.pct(total, muestra) };
    }).sort((a, b) => b.total - a.total);

    return {
      titulo: 'Factores de riesgo percibidos, por categoría',
      filas,
      grafica: 'columnas',
      texto: this.textoResumenFactores(filas, muestra),
    };
  }

  /** Las opciones que significan "aqui no veo riesgo". */
  private esAusenciaDeRiesgo(etiqueta: string): boolean {
    return /^no aplica$/i.test(etiqueta.trim())
      || /no percibe ning[uú]n riesgo/i.test(etiqueta);
  }

  /**
   * Recorta las etiquetas larguisimas de los factores para el eje del grafico.
   *
   * Las opciones de via y entorno traen la definicion dentro del propio texto
   * ("Mal estado de la carpeta de rodadura (Pavimento): huecos, baches..."),
   * que en una barra no cabe. Si el recorte hiciera coincidir dos etiquetas se
   * deja el texto completo, porque perder la distincion seria peor.
   */
  private acortarEtiquetas(reparto: ModelsInforme.Reparto): void {
    const cortas = reparto.filas.map(f => f.etiqueta.split(/[:(]|, por ejemplo/)[0].trim());
    if (new Set(cortas).size !== cortas.length) return;

    reparto.filas.forEach((fila, i) => (fila.etiqueta = cortas[i]));
  }

  /** Las filas mas senaladas, sin las opciones que niegan que haya algo. */
  private principales(reparto: ModelsInforme.Reparto | undefined, cuantas: number) {
    return (reparto?.filas ?? [])
      .filter(f => !this.esAusenciaDeRiesgo(f.etiqueta))
      .slice(0, cuantas);
  }

  /** Resume el modulo: percepcion, brecha de reporte y factor dominante. */
  private textoRiesgos(
    muestra: number,
    resumen: ModelsInforme.Reparto,
    r: {
      exposicion?: ModelsInforme.Reparto;
      experiencia?: ModelsInforme.Reparto;
      reporte?: ModelsInforme.Reparto;
    }
  ): string {
    if (!muestra) return '';

    const partes = [
      'La identificación de riesgos recoge lo que perciben quienes se exponen a ellos '
      + 'todos los días. Sus respuestas se clasifican en los cuatro factores que la '
      + 'Resolución usa para explicar un siniestro vial —humano, vehículo, vía y '
      + 'entorno—, y son el insumo directo del plan de acción.',
    ];

    const expuestos = this.sumarQue(r.exposicion, /^s[ií]$/i);
    if (expuestos) {
      partes.push(`${expuestos} de las ${muestra} personas encuestadas `
        + `(${this.pct(expuestos, muestra)}%) se reconocen expuestas a riesgos viales `
        + `durante su jornada o su desplazamiento.`);
    }

    const conExperiencia = this.sumarSalvoNo(r.experiencia);
    const reportaron = this.sumarQue(r.reporte, /^s[ií]$/i);
    if (conExperiencia) {
      partes.push(`${conExperiencia} (${this.pct(conExperiencia, muestra)}%) han vivido o `
        + `presenciado una situación de riesgo en trayectos laborales, y de ellas `
        + `${reportaron} la reportaron a la empresa.`);
    }

    const dominante = resumen.filas[0];
    if (dominante?.total) {
      partes.push(`El ${dominante.etiqueta.toLowerCase()} es el que más personas señalan `
        + `como generador de accidentes: ${dominante.total} (${dominante.porcentaje}%).`);
    }

    return partes.join(' ');
  }

  /** La exposicion percibida, con los que no saben si lo estan. */
  private textoExposicion(reparto: ModelsInforme.Reparto, muestra: number): string {
    const si = this.sumarQue(reparto, /^s[ií]$/i);
    const inseguros = this.sumarQue(reparto, /no estoy segur|desconozco/i);

    let texto = `${si} personas (${this.pct(si, muestra)}%) reconocen estar expuestas a `
      + `riesgos viales durante su jornada laboral o su desplazamiento.`;

    if (inseguros) {
      texto += ` Otras ${inseguros} (${this.pct(inseguros, muestra)}%) no saben si lo `
        + `están. No identificar la propia exposición es en sí mismo un riesgo: quien no `
        + `se sabe expuesto no toma precauciones.`;
    }

    return texto;
  }

  /**
   * La brecha entre vivir una situacion de riesgo y reportarla.
   *
   * Es el hallazgo mas accionable del modulo: un subreporte alto significa que
   * la empresa no se esta enterando de lo que pasa en sus trayectos, y que las
   * cifras de siniestralidad que maneja estan por debajo de la realidad.
   */
  private textoReporte(
    experiencia: ModelsInforme.Reparto, reporte: ModelsInforme.Reparto
  ): string {
    const conExperiencia = this.sumarSalvoNo(experiencia);
    if (!conExperiencia) {
      return 'Ninguna de las personas encuestadas declara haber vivido o presenciado '
        + 'situaciones de riesgo vial en trayectos laborales.';
    }

    const involucrados = this.sumarQue(experiencia, /involucrado|ambas/i);
    const reportaron = this.sumarQue(reporte, /^s[ií]$/i);
    const callaron = conExperiencia - reportaron;

    let texto = `${conExperiencia} personas han vivido o presenciado situaciones de riesgo `
      + `vial en trayectos laborales`;

    if (involucrados) {
      texto += `, ${involucrados} de ellas como involucradas directas`;
    }

    texto += `. De ese total, ${reportaron} `
      + `(${this.pct(reportaron, conExperiencia)}%) lo reportaron a la empresa.`;

    if (callaron > 0) {
      texto += ` Las ${callaron} restantes (${this.pct(callaron, conExperiencia)}%) no lo `
        + `hicieron: es un subreporte que deja a la organización sin noticia de lo que `
        + `ocurre en sus trayectos y hace que sus cifras de siniestralidad queden por `
        + `debajo de la realidad.`;
    }

    return texto;
  }

  /** Si la gente sabe reportar y si percibe que hay cultura de seguridad. */
  private textoCultura(
    sabeReportar: ModelsInforme.Reparto, cultura: ModelsInforme.Reparto, muestra: number
  ): string {
    const noSabe = this.sumarQue(sabeReportar, /^no$/i);
    const clara = this.sumarQue(cultura, /clara y activa/i);
    const debil = this.sumarQue(cultura, /parcialmente|^no$|desconozco/i);

    const partes: string[] = [];

    if (noSabe) {
      partes.push(`${noSabe} personas (${this.pct(noSabe, muestra)}%) no saben cómo `
        + `reportar una condición insegura. Un canal que no se conoce no existe, y `
        + `explica buena parte del subreporte.`);
    } else {
      partes.push(`Las ${muestra} personas encuestadas saben cómo reportar una condición `
        + `insegura.`);
    }

    if (debil) {
      partes.push(`${clara} (${this.pct(clara, muestra)}%) perciben que la empresa promueve `
        + `la seguridad vial de forma clara y activa, frente a ${debil} `
        + `(${this.pct(debil, muestra)}%) que la ven parcial, ausente o que directamente la `
        + `desconocen.`);
    }

    return partes.join(' ');
  }

  /** Las causas mas senaladas dentro de un factor. */
  private textoFactor(
    reparto: ModelsInforme.Reparto, nombre: string, muestra: number
  ): string {
    const top = this.principales(reparto, 3);
    if (!top.length) {
      return `Las personas encuestadas no señalan causas asociadas al `
        + `${nombre.toLowerCase()}.`;
    }

    const listado = this.enumerar(
      top.map(f => `${f.etiqueta.toLowerCase()} (${f.total}, ${f.porcentaje}%)`)
    );

    return `Dentro del ${nombre.toLowerCase()}, las causas más señaladas son ${listado}. `
      + `Los porcentajes se calculan sobre las ${muestra} personas encuestadas y suman más `
      + `de cien porque cada una puede señalar varias causas.`;
  }

  /** Cual de los cuatro factores pesa mas, y que hacer con eso. */
  private textoResumenFactores(
    filas: { etiqueta: string; total: number; porcentaje: number }[], muestra: number
  ): string {
    const conPeso = filas.filter(f => f.total > 0);
    if (!conPeso.length) return '';

    const dominante = conPeso[0];

    let texto = `Cada barra cuenta cuántas de las ${muestra} personas encuestadas señalan `
      + `al menos una causa dentro de ese factor, de modo que las cuatro familias se `
      + `pueden comparar entre sí. El ${dominante.etiqueta.toLowerCase()} encabeza la `
      + `percepción con ${dominante.total} menciones (${dominante.porcentaje}%).`;

    // Cada familia se corrige con medidas distintas: decirlo aqui es lo que
    // convierte el grafico en una prioridad de plan y no en un dato mas.
    if (/humano/i.test(dominante.etiqueta)) {
      texto += ' Es el factor que se corrige con formación, políticas de regulación y '
        + 'control de las conductas al volante.';
    } else if (/veh[ií]culo/i.test(dominante.etiqueta)) {
      texto += ' Es el factor que se corrige con el plan de mantenimiento preventivo y '
        + 'las inspecciones preoperacionales.';
    } else if (/v[ií]a/i.test(dominante.etiqueta)) {
      texto += ' Es un factor que en buena parte no depende de la empresa, pero sí la '
        + 'obliga a estudiar las rutas y a gestionar con las autoridades viales.';
    } else {
      texto += ' Es un factor no controlable, que se gestiona planificando los '
        + 'desplazamientos y definiendo cuándo no se sale a la vía.';
    }

    return texto;
  }

  /** Resume el modulo separando el trayecto de la jornada. */
  private textoDesplazamientos(
    muestra: number,
    enMision: number,
    r: { incidentes?: ModelsInforme.Reparto; estado?: ModelsInforme.Reparto }
  ): string {
    if (!muestra) return '';

    const partes = [
      'Los desplazamientos se analizan por separado según su naturaleza: el trayecto '
      + 'entre la vivienda y el lugar de trabajo, y los recorridos que se realizan '
      + 'durante la jornada por encargo de la empresa. Estos últimos son los que caen '
      + 'de lleno dentro del alcance del PESV.',
    ];

    partes.push(`De las ${muestra} personas encuestadas, ${enMision} `
      + `(${this.pct(enMision, muestra)}%) se desplazan u operan algún vehículo durante `
      + `la jornada laboral.`);

    const hallazgos: string[] = [];

    const conIncidentes = this.sumarSalvoNo(r.incidentes);
    if (conIncidentes) {
      hallazgos.push(`${conIncidentes} (${this.pct(conIncidentes, muestra)}%) tuvieron `
        + `incidentes o dificultades en su desplazamiento durante el último año`);
    }

    const vehiculoDeficiente = this.sumarQue(r.estado, /regular|malo/i);
    if (vehiculoDeficiente) {
      hallazgos.push(`${vehiculoDeficiente} (${this.pct(vehiculoDeficiente, muestra)}%) se `
        + `desplazan en un vehículo cuyo estado califican como regular o peor`);
    }

    if (hallazgos.length) {
      partes.push(`Sobre el conjunto de la muestra, ${this.enumerar(hallazgos)}.`);
    }

    return partes.join(' ');
  }

  /** Los medios del trayecto, con el peso de los actores viales vulnerables. */
  private textoMedios(reparto: ModelsInforme.Reparto, muestra: number): string {
    const moto = this.sumarQue(reparto, /moto/i);
    const vulnerables = moto
      + this.sumarQue(reparto, /bicicleta/i)
      + this.sumarQue(reparto, /^a pie$/i);

    if (!vulnerables) return '';

    let texto = `${vulnerables} respuestas (${this.pct(vulnerables, muestra)}% de la `
      + `muestra) corresponden a medios que exponen directamente a la persona: moto, `
      + `bicicleta o desplazamiento a pie.`;

    if (moto) {
      texto += ` La moto, con ${moto} (${this.pct(moto, muestra)}%), es el medio con mayor `
        + `tasa de siniestralidad en el país y merece atención específica en el plan.`;
    }

    texto += ' Los porcentajes suman más de cien porque cada persona puede señalar '
      + 'varios medios.';

    return texto;
  }

  /** El tiempo del trayecto, leído como exposición al riesgo. */
  private textoTiempoTrayecto(reparto: ModelsInforme.Reparto, muestra: number): string {
    const largos = this.sumarQue(reparto, /m[aá]s de \d+ hora/i);
    const cortos = this.sumarQue(reparto, /menos de 15/i);

    if (!largos) {
      return `Ninguna persona encuestada emplea más de una hora en llegar al trabajo; `
        + `${cortos} (${this.pct(cortos, muestra)}%) tardan menos de quince minutos.`;
    }

    return `${largos} personas (${this.pct(largos, muestra)}%) emplean más de una hora en `
      + `llegar al trabajo, solo en el trayecto de ida. Un trayecto largo suma fatiga `
      + `antes de empezar la jornada y la suma otra vez al terminarla.`;
  }

  /** El vehículo del trayecto: en qué estado va y de quién es. */
  private textoVehiculoTrayecto(
    estado: ModelsInforme.Reparto,
    propiedad: ModelsInforme.Reparto,
    muestra: number
  ): string {
    const deficiente = this.sumarQue(estado, /regular|malo/i);
    const muyMalo = this.sumarQue(estado, /muy malo/i);
    const deLaEmpresa = this.sumarQue(propiedad, /empresa/i);

    const partes: string[] = [];

    if (deficiente) {
      let frase = `${deficiente} personas (${this.pct(deficiente, muestra)}%) califican el `
        + `estado del vehículo en el que se desplazan como regular o peor`;
      if (muyMalo) frase += `, y ${muyMalo} de ellas como muy malo`;
      partes.push(`${frase}.`);
    } else {
      partes.push(`Las personas encuestadas califican como bueno el estado del vehículo `
        + `en el que se desplazan.`);
    }

    if (deLaEmpresa) {
      partes.push(`${deLaEmpresa} (${this.pct(deLaEmpresa, muestra)}%) se desplazan en un `
        + `vehículo proporcionado por la empresa: sobre esos la organización tiene `
        + `responsabilidad directa de mantenimiento y son los primeros que debe cubrir `
        + `el plan de inspección.`);
    }

    return partes.join(' ');
  }

  /** Los incidentes del trayecto, ordenados por gravedad. */
  private textoIncidentes(reparto: ModelsInforme.Reparto, muestra: number): string {
    const total = this.sumarSalvoNo(reparto);
    if (!total) {
      return `Ninguna de las ${muestra} personas encuestadas reporta incidentes durante `
        + `su desplazamiento en el último año.`;
    }

    let texto = `${total} personas (${this.pct(total, muestra)}%) reportan incidentes o `
      + `dificultades durante su desplazamiento en el último año.`;

    const graves: string[] = [];
    const accidentes = this.sumarQue(reparto, /graves|accidente/i);
    const riesgoPublico = this.sumarQue(reparto, /riesgo p[uú]blico/i);

    if (accidentes) graves.push(`${accidentes} sufrieron accidentes`);
    if (riesgoPublico) graves.push(`${riesgoPublico} estuvieron expuestas a riesgo público`);

    if (graves.length) {
      texto += ` De ellas, ${this.enumerar(graves)}. Son los casos que el plan debe atender `
        + `primero, porque no se resuelven con señalización ni con formación.`;
    }

    return texto;
  }

  /** Cuántos se desplazan por trabajo: el dato que delimita el alcance. */
  private textoEnMision(enMision: number, muestra: number): string {
    if (!enMision) {
      return `Ninguna de las ${muestra} personas encuestadas realiza desplazamientos ni `
        + `opera vehículos durante la jornada laboral.`;
    }

    return `${enMision} personas (${this.pct(enMision, muestra)}%) realizan desplazamientos `
      + `u operan algún vehículo durante la jornada laboral. Es la población sobre la que `
      + `recaen de forma directa las medidas del PESV, y la base de las dos cifras `
      + `siguientes.`;
  }

  /** Con qué se mueven quienes se desplazan en jornada. */
  private textoMediosJornada(reparto: ModelsInforme.Reparto, base: number): string {
    if (!base) return '';

    const moto = this.sumarQue(reparto, /moto/i);
    const pesados = this.sumarQue(reparto, /cami[oó]n|bus|maquinaria/i);

    const partes: string[] = [];

    if (moto) {
      partes.push(`${moto} de las ${base} personas que se desplazan en jornada `
        + `(${this.pct(moto, base)}%) lo hacen en moto.`);
    }

    if (pesados) {
      partes.push(`${pesados} (${this.pct(pesados, base)}%) operan vehículos pesados o `
        + `maquinaria, que exigen licencia de categoría superior y formación específica.`);
    }

    if (!partes.length) return '';

    partes.push('Los porcentajes suman más de cien porque cada persona puede señalar '
      + 'varios medios.');

    return partes.join(' ');
  }

  /** Cuánto tiempo pasan al volante: media jornada o más es otro perfil. */
  private textoDuracionJornada(reparto: ModelsInforme.Reparto, base: number): string {
    if (!base) return '';

    const prolongados = this.sumarQue(reparto, /media jornada|toda la jornada/i);
    const largos = this.sumarQue(reparto, /m[aá]s de 2 horas/i);

    if (!prolongados && !largos) {
      return `Los desplazamientos en jornada son de corta duración: ninguno supera las `
        + `dos horas.`;
    }

    const partes: string[] = [];

    if (prolongados) {
      partes.push(`${prolongados} personas (${this.pct(prolongados, base)}%) pasan media `
        + `jornada o la jornada completa desplazándose. Para efectos del riesgo vial son `
        + `conductores, aunque su cargo no lo diga, y deberían recibir el mismo `
        + `tratamiento que el personal de conducción.`);
    }

    if (largos) {
      partes.push(`Otras ${largos} (${this.pct(largos, base)}%) superan las dos horas de `
        + `desplazamiento.`);
    }

    return partes.join(' ');
  }

  /** Resume el modulo de conduccion con lo que mas pesa. */
  private textoConduccion(
    muestra: number,
    conductores: number,
    r: {
      licencia?: ModelsInforme.Reparto;
      infracciones?: ModelsInforme.Reparto;
      accidentes?: ModelsInforme.Reparto;
    }
  ): string {
    if (!muestra) return '';

    if (!conductores) {
      return `Ninguna de las ${muestra} personas encuestadas declara conducir vehículo `
        + `automotor, por lo que las preguntas de este módulo no aplican a la muestra `
        + `obtenida.`;
    }

    const partes = [
      `De las ${muestra} personas encuestadas, ${conductores} `
      + `(${this.pct(conductores, muestra)}%) declaran conducir vehículo automotor. Las `
      + `cifras que siguen se calculan sobre ese grupo y no sobre la muestra total, `
      + `porque son preguntas que solo responde quien conduce.`,
    ];

    const hallazgos: string[] = [];

    const sinLicencia = this.sumarQue(r.licencia, /^no$/i);
    if (sinLicencia) {
      hallazgos.push(`${sinLicencia} (${this.pct(sinLicencia, conductores)}%) conducen sin `
        + `licencia vigente`);
    }

    const conInfracciones = this.sumarQue(r.infracciones, /^s[ií]$/i);
    if (conInfracciones) {
      hallazgos.push(`${conInfracciones} (${this.pct(conInfracciones, conductores)}%) `
        + `registran infracciones en el último año`);
    }

    const conAccidentes = this.sumarQue(r.accidentes, /^s[ií]$/i);
    if (conAccidentes) {
      hallazgos.push(`${conAccidentes} (${this.pct(conAccidentes, conductores)}%) estuvieron `
        + `involucrados en un accidente de tránsito`);
    }

    if (hallazgos.length) partes.push(`De ellos, ${this.enumerar(hallazgos)}.`);

    return partes.join(' ');
  }

  private textoLicencia(reparto: ModelsInforme.Reparto, conductores: number): string {
    const con = this.sumarQue(reparto, /^s[ií]$/i);
    const sin = this.sumarQue(reparto, /^no$/i);

    let texto = `${con} conductores (${this.pct(con, conductores)}%) cuentan con licencia `
      + `de conducción vigente.`;

    if (sin) {
      texto += ` ${sin} (${this.pct(sin, conductores)}%) declaran no tenerla: es un `
        + `hallazgo que exige atención inmediata, porque conducir sin licencia vigente `
        + `expone a la persona y compromete a la empresa.`;
    }

    return texto;
  }

  private textoExperiencia(reparto: ModelsInforme.Reparto, conductores: number): string {
    const noveles = this.sumarQue(reparto, /menos de|^1 a 3|1 a 3 a/i);
    if (!noveles) return '';

    return `${noveles} conductores (${this.pct(noveles, conductores)}%) tienen tres años o `
      + `menos de experiencia al volante. Es el grupo al que conviene dirigir primero la `
      + `formación en conducción segura.`;
  }

  private textoInfracciones(reparto: ModelsInforme.Reparto, conductores: number): string {
    const con = this.sumarQue(reparto, /^s[ií]$/i);
    if (!con) {
      return `Ninguno de los ${conductores} conductores registra infracciones de tránsito `
        + `en el último año.`;
    }

    let texto = `${con} conductores (${this.pct(con, conductores)}%) registran infracciones `
      + `de tránsito en el último año.`;

    const pendientes = this.sumarQue(reparto.emparejado, /no gestionad|acuerdo de pago/i);
    if (pendientes) {
      texto += ` De esas infracciones, ${pendientes} siguen sin saldar. Una sanción `
        + `pendiente puede llegar a suspender la licencia, así que conviene hacerles `
        + `seguimiento.`;
    }

    return texto;
  }

  private textoAccidentes(
    reparto: ModelsInforme.Reparto,
    enJornada: ModelsInforme.Reparto | undefined,
    conductores: number
  ): string {
    const con = this.sumarQue(reparto, /^s[ií]$/i);
    if (!con) {
      return `Ninguno de los ${conductores} conductores reporta accidentes de tránsito `
        + `en el último año.`;
    }

    let texto = `${con} conductores (${this.pct(con, conductores)}%) reportan haber tenido `
      + `un accidente de tránsito en el último año.`;

    const laborales = this.sumarQue(enJornada, /^s[ií]$/i);
    if (laborales) {
      texto += ` ${laborales} de esos accidentes ocurrieron durante la jornada laboral, `
        + `lo que los sitúa dentro del alcance del PESV y obliga a investigarlos.`;
    }

    return texto;
  }

  private textoGravedad(reparto: ModelsInforme.Reparto): string {
    const lesionados = this.sumarQue(reparto, /lesionad/i);
    const fallecidos = this.sumarQue(reparto, /fallecid|muert/i);
    const materiales = this.sumarQue(reparto, /daño|dano|material/i);

    if (!lesionados && !fallecidos && !materiales) return '';

    const partes: string[] = [];
    if (fallecidos) partes.push(`${fallecidos} con personas fallecidas`);
    if (lesionados) partes.push(`${lesionados} con personas lesionadas`);
    if (materiales) partes.push(`${materiales} con daños materiales`);

    let texto = `Entre los accidentes reportados hay ${this.enumerar(partes)}.`;

    if (fallecidos || lesionados) {
      texto += ` Los que dejaron víctimas son los que exigen investigación interna y `
        + `medidas correctivas documentadas.`;
    }

    return texto;
  }

  private textoNormas(reparto: ModelsInforme.Reparto, conductores: number): string {
    const completo = this.sumarQue(reparto, /completamente|totalmente/i);
    const brecha = conductores - completo;

    if (brecha <= 0) {
      return `Los ${conductores} conductores declaran conocer y aplicar las normas de `
        + `tránsito vigentes.`;
    }

    return `${completo} conductores (${this.pct(completo, conductores)}%) declaran conocer `
      + `y aplicar completamente las normas de tránsito. Los ${brecha} restantes `
      + `(${this.pct(brecha, conductores)}%) las conocen solo en parte o no las conocen, `
      + `y son quienes marcan la necesidad de formación.`;
  }

  private textoCapacitacion(reparto: ModelsInforme.Reparto, conductores: number): string {
    const si = this.sumarQue(reparto, /^s[ií]$/i);
    const no = conductores - si;

    if (si >= conductores) {
      return `Los ${conductores} conductores han participado en capacitación sobre `
        + `atención de emergencias viales.`;
    }

    return `${si} conductores (${this.pct(si, conductores)}%) han participado en alguna `
      + `capacitación sobre atención de emergencias viales; ${no} `
      + `(${this.pct(no, conductores)}%) no lo han hecho. La capacitación de quienes `
      + `conducen es una de las medidas que exige la Resolución.`;
  }

  /** Une una lista en prosa: "a, b y c". */
  private enumerar(partes: string[]): string {
    if (partes.length <= 1) return partes[0] ?? '';
    return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
  }

  /** Resume el modulo entero, con las tres cifras que mas pesan. */
  private textoSalud(
    muestra: number,
    r: { estado?: ModelsInforme.Reparto; limitacion?: ModelsInforme.Reparto; dolor?: ModelsInforme.Reparto }
  ): string {
    if (!muestra) return '';

    const hallazgos: string[] = [];

    const regular = this.sumarQue(r.estado, /regular|mala|deficiente/i);
    if (regular) hallazgos.push(`${regular} (${this.pct(regular, muestra)}%) califican su salud como regular o mala`);

    const conLimitacion = this.sumarSalvoNo(r.limitacion);
    if (conLimitacion) hallazgos.push(`${conLimitacion} (${this.pct(conLimitacion, muestra)}%) declaran alguna limitación física`);

    const conDolor = this.sumarSalvoNo(r.dolor);
    if (conDolor) hallazgos.push(`${conDolor} (${this.pct(conDolor, muestra)}%) sienten dolor o molestia asociado a la jornada`);

    const base = 'El estado de salud de quienes conducen o se desplazan incide '
      + 'directamente en el riesgo vial: la fatiga, el dolor y las limitaciones físicas '
      + 'reducen la capacidad de reacción.';

    if (!hallazgos.length) {
      return `${base} De las ${muestra} personas encuestadas no se reportan condiciones `
        + `de salud que comprometan la conducción.`;
    }

    const listado = hallazgos.length > 1
      ? `${hallazgos.slice(0, -1).join(', ')} y ${hallazgos[hallazgos.length - 1]}`
      : hallazgos[0];

    return `${base} De las ${muestra} personas encuestadas, ${listado}.`;
  }

  /** El estado general, de mejor a peor. */
  private textoEstadoSalud(reparto: ModelsInforme.Reparto, muestra: number): string {
    const bueno = this.sumarQue(reparto, /excelente|buena|bueno/i);
    const regular = this.sumarQue(reparto, /regular|mala|deficiente/i);
    if (!bueno && !regular) return '';

    return `${bueno} personas (${this.pct(bueno, muestra)}%) califican su estado general `
      + `de salud como bueno o excelente, frente a ${regular} (${this.pct(regular, muestra)}%) `
      + `que lo califican como regular o malo.`;
  }

  /**
   * Redacta cuantos respondieron algo distinto de "No".
   *
   * Sirve para las preguntas donde la primera opcion es la negativa y el resto
   * son grados de lo mismo: limitacion leve, moderada o severa.
   */
  private textoAfirmativas(
    reparto: ModelsInforme.Reparto, muestra: number, que: string, consecuencia: string
  ): string {
    const total = this.sumarSalvoNo(reparto);
    if (!total) return `Ninguna de las ${muestra} personas encuestadas ${que}.`;

    let texto = `${total} personas (${this.pct(total, muestra)}%) de las ${muestra} `
      + `encuestadas ${que}.`;

    // El grado mas severo, si la pregunta los distingue.
    const severas = reparto.filas.filter(f => /severa|intensa|m[aá]s de 15/i.test(f.etiqueta));
    if (severas.length) {
      const graves = severas.reduce((n, f) => n + f.total, 0);
      if (graves) {
        texto += ` De ellas, ${graves} (${this.pct(graves, muestra)}%) en el grado mas alto.`;
      }
    }

    return consecuencia ? `${texto} ${consecuencia}` : texto;
  }

  /** La actividad fisica como factor protector. */
  private textoActividadFisica(reparto: ModelsInforme.Reparto, muestra: number): string {
    const activos = this.sumarSalvoNo(reparto);
    const sedentarios = muestra - activos;

    return `${activos} personas (${this.pct(activos, muestra)}%) realizan actividad física `
      + `con alguna regularidad, frente a ${sedentarios} (${this.pct(sedentarios, muestra)}%) `
      + `que no la practican. La condición física ayuda a sostener la atención en `
      + `trayectos largos.`;
  }

  // ── Cuentas de apoyo para los textos ──────────────────────────────────────

  private pct(parte: number, total: number): number {
    return total > 0 ? Math.round((parte / total) * 1000) / 10 : 0;
  }

  /** Cuantos respondieron algo que encaja con el patron. */
  private sumarQue(reparto: ModelsInforme.Reparto | undefined, patron: RegExp): number {
    return (reparto?.filas ?? [])
      .filter(f => patron.test(f.etiqueta))
      .reduce((n, f) => n + f.total, 0);
  }

  /**
   * Cuantos respondieron algo distinto de "No".
   *
   * Se mira el texto y no la posicion: las opciones las edita el
   * superadministrador y el orden puede cambiar.
   */
  private sumarSalvoNo(reparto: ModelsInforme.Reparto | undefined): number {
    return (reparto?.filas ?? [])
      .filter(f => !/^no( aplica)?$/i.test(f.etiqueta.trim()))
      .reduce((n, f) => n + f.total, 0);
  }

  /**
   * Los tramos de antiguedad con que se lee una flota.
   *
   * No es una escala arbitraria: a partir de los diez anos un vehiculo pierde
   * los sistemas de seguridad que trae uno nuevo, y a partir de los quince la
   * renovacion deja de ser una mejora y pasa a ser una medida de control del
   * riesgo que el plan tiene que presupuestar.
   */
  private static readonly TRAMOS_ANTIGUEDAD = [
    { etiqueta: 'Menos de 5 años', hasta: 5 },
    { etiqueta: 'De 5 a 10 años', hasta: 10 },
    { etiqueta: 'De 11 a 15 años', hasta: 15 },
    { etiqueta: 'Más de 15 años', hasta: Infinity },
  ];

  /**
   * Da lectura y forma a la flota.
   *
   * La flota es la parte del diagnostico donde los hallazgos son duros: un
   * SOAT vencido no es una percepcion ni un porcentaje, es un vehiculo que no
   * puede circular. Por eso la seccion antepone el estado documental y baja
   * hasta la placa concreta, en vez de quedarse en repartos.
   */
  private flota(vehiculos: Models.Diagnostico.Vehiculo[]): ModelsInforme.Seccion {
    const total = vehiculos.length;
    const propios = vehiculos.filter(v => /propio/i.test(v.tipoRelacion ?? '')).length;

    // La exposicion: sin kilometros no hay forma de decir si tres siniestros
    // son muchos o pocos.
    const kmMes = vehiculos.reduce((n, v) => n + (Number(v.promedioKmMes) || 0), 0);

    const enEstado = (estado: string) => vehiculos.filter(
      v => estadoVigencia(v.vigenciaSoat).estado === estado
        || estadoVigencia(v.vigenciaRevisionTecnica).estado === estado
    ).length;

    const soatVencido = vehiculos.filter(
      v => estadoVigencia(v.vigenciaSoat).estado === 'vencido'
    ).length;
    const revisionVencida = vehiculos.filter(
      v => estadoVigencia(v.vigenciaRevisionTecnica).estado === 'vencido'
    ).length;
    const porVencer = enEstado('porVencer');
    const sinRegistrar = enEstado('sinRegistrar');

    const soatVigente = vehiculos.filter(
      v => estadoVigencia(v.vigenciaSoat).estado === 'vigente'
    ).length;
    const revisionVigente = vehiculos.filter(
      v => estadoVigencia(v.vigenciaRevisionTecnica).estado === 'vigente'
    ).length;

    const sinPlan = vehiculos.filter(
      v => !/^s[ií]$/i.test(v.tienePlanMantenimiento ?? '')
    ).length;
    const siniestros = vehiculos.reduce(
      (n, v) => n + (Number(v.numeroSiniestros) || 0), 0
    );

    const documental = this.hallazgosDocumentales(vehiculos);

    return {
      id: 'flota',
      titulo: 'La flota',
      texto: this.textoFlota(total, propios, kmMes, {
        soatVencido, revisionVencida, porVencer, sinRegistrar, sinPlan, siniestros,
      }),
      sinDatos: !total,
      cifras: [
        { etiqueta: 'Vehículos', valor: total },
        { etiqueta: 'Propios', valor: propios, nota: 'Responsabilidad directa de la empresa' },
        { etiqueta: 'De terceros', valor: total - propios, nota: 'Se gestionan por contrato' },
        {
          etiqueta: 'Kilómetros al mes', valor: kmMes.toLocaleString('es-CO'),
          nota: 'Exposición declarada de la flota',
        },
        this.cifraCumple('Con SOAT vigente', soatVigente, total, {
          bien: 'Toda la flota puede circular legalmente',
          mal: this.pendientes([
            soatVencido ? `${soatVencido} vencido` : null,
            total - soatVigente - soatVencido
              ? `${total - soatVigente - soatVencido} por vencer o sin registrar`
              : null,
          ]),
        }),
        this.cifraCumple('Con revisión técnica vigente', revisionVigente, total, {
          bien: 'Toda la flota tiene la revisión al día',
          mal: this.pendientes([
            revisionVencida ? `${revisionVencida} vencida` : null,
            total - revisionVigente - revisionVencida
              ? `${total - revisionVigente - revisionVencida} por vencer o sin registrar`
              : null,
          ]),
        }),
        this.cifraCumple('Con plan de mantenimiento', total - sinPlan, total, {
          bien: 'Toda la flota tiene mantenimiento preventivo',
          mal: `${sinPlan} sin plan: el PESV lo exige para toda la flota`,
        }),
        {
          etiqueta: 'Siniestros registrados', valor: siniestros, alerta: siniestros > 0,
          nota: siniestros ? 'Exigen investigación interna' : 'Ninguno reportado',
        },
      ],
      repartos: [
        this.repartoTipoVehiculo(vehiculos),
        this.repartoRelacion(vehiculos, propios, total),
        this.repartoAntiguedad(vehiculos),
        this.repartoMantenimiento(vehiculos, sinPlan, total),
      ],
      tablas: documental ? [documental] : [],
    };
  }

  private repartoTipoVehiculo(
    vehiculos: Models.Diagnostico.Vehiculo[]
  ): ModelsInforme.Reparto {
    const reparto = this.contar('Vehículos por tipo', vehiculos, v => v.tipoVehiculo);
    reparto.grafica = 'barras';

    const mayor = reparto.filas[0];
    if (mayor) {
      reparto.texto = `La flota se compone principalmente de `
        + `${mayor.etiqueta.toLowerCase()}: ${mayor.total} de ${vehiculos.length} `
        + `vehículos (${mayor.porcentaje}%). El tipo de vehículo determina qué categoría `
        + `de licencia necesitan sus conductores y qué revisiones exige.`;
    }

    return reparto;
  }

  private repartoRelacion(
    vehiculos: Models.Diagnostico.Vehiculo[], propios: number, total: number
  ): ModelsInforme.Reparto {
    const reparto = this.contar('Relación de los vehículos con la empresa', vehiculos,
      v => v.tipoRelacion);
    reparto.grafica = 'dona';

    const terceros = total - propios;
    let texto = `${propios} vehículos (${this.pct(propios, total)}%) son propiedad de la `
      + `organización: sobre ellos recae de forma directa el mantenimiento, la `
      + `documentación y la inspección preoperacional.`;

    if (terceros) {
      const empresas = new Set(
        vehiculos
          .filter(v => !/propio/i.test(v.tipoRelacion ?? '') && v.contratistaNombre)
          .map(v => v.contratistaNombre)
      );

      texto += ` Los ${terceros} restantes (${this.pct(terceros, total)}%) pertenecen a `
        + `terceros`;
      texto += empresas.size
        ? `, repartidos entre ${empresas.size} contratistas.`
        : `.`;
      texto += ` Sobre estos la exigencia no desaparece: se traslada al contrato, y el `
        + `PESV obliga a verificar que cumplen las mismas condiciones.`;
    }

    reparto.texto = texto;
    return reparto;
  }

  /**
   * La antiguedad de la flota, por tramos y en orden.
   *
   * Se construye a mano porque el reparto generico ordena por frecuencia, y
   * una escala de antiguedad solo se lee de menor a mayor.
   */
  private repartoAntiguedad(
    vehiculos: Models.Diagnostico.Vehiculo[]
  ): ModelsInforme.Reparto {
    const edades = vehiculos.map(v => this.antiguedad(v.fechaFabricacion));
    const conEdad = edades.filter((e): e is number => e !== null);
    const base = vehiculos.length || 1;

    const filas = InformeDiagnosticoService.TRAMOS_ANTIGUEDAD.map((tramo, i, tramos) => {
      const desde = i === 0 ? 0 : tramos[i - 1].hasta;
      const total = conEdad.filter(e => e >= desde && e < tramo.hasta).length;
      return { etiqueta: tramo.etiqueta, total, porcentaje: this.pct(total, base) };
    });

    const sinFecha = vehiculos.length - conEdad.length;
    if (sinFecha) {
      filas.push({
        etiqueta: 'Sin fecha registrada', total: sinFecha,
        porcentaje: this.pct(sinFecha, base),
      });
    }

    return {
      titulo: 'Antigüedad de la flota',
      filas,
      grafica: 'columnas',
      texto: this.textoAntiguedad(conEdad, sinFecha, vehiculos.length),
    };
  }

  private repartoMantenimiento(
    vehiculos: Models.Diagnostico.Vehiculo[], sinPlan: number, total: number
  ): ModelsInforme.Reparto {
    const reparto = this.contar('Plan de mantenimiento preventivo', vehiculos,
      v => this.textoSiNo(v.tienePlanMantenimiento));
    reparto.grafica = 'tabla';
    reparto.unidad = 'Vehículos';
    reparto.emparejado = this.contar('Frecuencia del mantenimiento', vehiculos,
      v => v.frecuenciaMantenimiento || 'Sin definir');
    reparto.emparejado.unidad = 'Vehículos';

    reparto.titulo = 'Mantenimiento preventivo de la flota';
    reparto.texto = sinPlan
      ? `${sinPlan} de los ${total} vehículos (${this.pct(sinPlan, total)}%) no tienen `
        + `plan de mantenimiento preventivo registrado. El mantenimiento preventivo es `
        + `uno de los pasos obligatorios del PESV y su ausencia es un hallazgo de `
        + `auditoría, no una recomendación.`
      : `Los ${total} vehículos de la flota cuentan con plan de mantenimiento `
        + `preventivo registrado.`;

    return reparto;
  }

  /**
   * Los vehiculos cuya documentacion no esta en regla, con placa.
   *
   * Un porcentaje no se puede llevar al taller. Esta tabla es la que convierte
   * la seccion en una lista de trabajo.
   */
  private hallazgosDocumentales(
    vehiculos: Models.Diagnostico.Vehiculo[]
  ): ModelsInforme.Tabla | null {
    const enRegla = (fecha?: string) => estadoVigencia(fecha).estado === 'vigente';

    const filas = vehiculos
      .filter(v => !enRegla(v.vigenciaSoat) || !enRegla(v.vigenciaRevisionTecnica))
      .map(v => [
        textoSeguro(v.placa, 'Sin placa'),
        textoSeguro(v.tipoVehiculo, '—'),
        textoSeguro(v.tipoRelacion, '—'),
        this.resumenVigencia(v.vigenciaSoat),
        this.resumenVigencia(v.vigenciaRevisionTecnica),
      ]);

    if (!filas.length) return null;

    return {
      titulo: `Vehículos con documentación pendiente (${filas.length})`,
      columnas: ['Placa', 'Tipo', 'Relación', 'SOAT', 'Revisión técnica'],
      filas,
    };
  }

  /** Una fecha límite en texto plano: cuándo y en qué situación está. */
  private resumenVigencia(fecha?: string): string {
    const { estado, dias } = estadoVigencia(fecha);
    if (estado === 'sinRegistrar') return 'Sin registrar';

    const cuando = this.fechaLegible(fecha ?? '');

    if (estado === 'vencido') return `${cuando} · vencido hace ${Math.abs(dias)} días`;
    if (estado === 'porVencer') return `${cuando} · vence en ${dias} días`;
    return `${cuando} · vigente`;
  }

  /**
   * Una fecha guardada como AAAA-MM-DD, escrita como se lee en Colombia.
   *
   * Es lo que entrega un `input type="date"` y lo que se guarda, pero no lo
   * que nadie espera ver en un documento oficial: el formulario muestra
   * 10/01/2027 y el informe enseñaba 2027-01-10 para la misma fecha.
   *
   * Se parte el texto en vez de construir un `Date`: `new Date('2027-01-10')`
   * se interpreta como UTC y en la zona horaria de Colombia devuelve el día
   * anterior, que en una fecha de vencimiento no es un detalle.
   */
  private fechaLegible(fecha: string): string {
    const [ano, mes, dia] = fecha.split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : fecha;
  }

  /** Anos cumplidos desde la fabricacion, o null si no consta. */
  private antiguedad(fecha?: string): number | null {
    if (!fecha) return null;

    // El campo admite tanto un ano suelto como una fecha completa.
    const ano = /^\d{4}$/.test(fecha.trim())
      ? Number(fecha.trim())
      : new Date(fecha).getFullYear();

    if (!ano || isNaN(ano)) return null;

    const edad = new Date().getFullYear() - ano;
    return edad >= 0 && edad < 100 ? edad : null;
  }

  /** Normaliza un campo de si/no para que el reparto no invente categorias. */
  private textoSiNo(valor?: string): string {
    if (/^s[ií]$/i.test(valor ?? '')) return 'Sí';
    if (/^no$/i.test(valor ?? '')) return 'No';
    return 'Sin registrar';
  }

  /** Resume la flota: tamano, exposicion y lo que no esta en regla. */
  private textoFlota(
    total: number,
    propios: number,
    kmMes: number,
    h: {
      soatVencido: number; revisionVencida: number; porVencer: number;
      sinRegistrar: number; sinPlan: number; siniestros: number;
    }
  ): string {
    if (!total) return '';

    const partes = [`La organización reporta ${total} vehículos, de los cuales ${propios} `
      + `son propios y ${total - propios} pertenecen a terceros.`];

    if (kmMes > 0) {
      partes.push(`En conjunto recorren unos ${kmMes.toLocaleString('es-CO')} kilómetros `
        + `al mes, que es la exposición sobre la que se mide cualquier indicador de `
        + `siniestralidad.`);
    }

    // Lo documental primero: es lo unico de esta seccion que impide circular.
    const irregulares: string[] = [];
    if (h.soatVencido) irregulares.push(`${h.soatVencido} con el SOAT vencido`);
    if (h.revisionVencida) {
      irregulares.push(`${h.revisionVencida} con la revisión técnico-mecánica vencida`);
    }

    if (irregulares.length) {
      partes.push(`Hay ${this.enumerar(irregulares)}. Ninguno de ellos puede circular `
        + `legalmente, de modo que su regularización no es una acción del plan sino una `
        + `medida inmediata.`);
    } else {
      partes.push('Toda la flota tiene la documentación obligatoria vigente.');
    }

    if (h.porVencer) {
      partes.push(`Otros ${h.porVencer} tienen alguna vigencia que caduca en los próximos `
        + `${DIAS_AVISO} días.`);
    }

    if (h.sinRegistrar) {
      partes.push(`En ${h.sinRegistrar} vehículos falta registrar alguna de las dos `
        + `fechas, así que el diagnóstico no puede confirmar su situación: conviene `
        + `completarlo antes de emitir el informe.`);
    }

    if (h.siniestros) {
      let frase = `La flota acumula ${h.siniestros} siniestros registrados`;
      if (kmMes > 0) {
        const tasa = (h.siniestros / (kmMes * 12)) * 1000000;
        frase += `, equivalentes a ${Math.round(tasa * 10) / 10} por millón de kilómetros `
          + `recorridos`;
      }
      partes.push(`${frase}.`);
    }

    return partes.join(' ');
  }

  /** La edad de la flota y lo que implica presupuestar. */
  private textoAntiguedad(
    edades: number[], sinFecha: number, total: number
  ): string {
    if (!edades.length) {
      return `No consta la fecha de fabricación de ninguno de los ${total} vehículos, de `
        + `modo que no puede valorarse la antigüedad de la flota.`;
    }

    const promedio = Math.round(edades.reduce((n, e) => n + e, 0) / edades.length);
    const viejos = edades.filter(e => e > 10).length;

    let texto = `La flota tiene una antigüedad promedio de ${promedio} años.`;

    if (viejos) {
      texto += ` ${viejos} vehículos (${this.pct(viejos, total)}%) superan los diez años: `
        + `a esa edad han quedado atrás los sistemas de seguridad que trae un vehículo `
        + `nuevo, y su renovación deja de ser una mejora para convertirse en una medida `
        + `de control del riesgo que el plan debe presupuestar.`;
    }

    if (sinFecha) {
      texto += ` En ${sinFecha} vehículos no consta la fecha de fabricación y quedan `
        + `fuera de este cálculo.`;
    }

    return texto;
  }

  /**
   * Da lectura y forma a la seccion de contratistas.
   *
   * Es el punto ciego del diagnostico. La encuesta llega a los colaboradores
   * de la empresa, pero los conductores que pone un contratista no la
   * responden: no son empleados y nadie les pasa el enlace. Circulan por
   * cuenta de la organizacion y no aparecen en ninguna de las cifras
   * anteriores, asi que esta seccion es el unico sitio donde esa exposicion
   * existe.
   *
   * Recibe tambien la flota para cruzar los dos registros: un contratista que
   * declara desplazamientos pero no tiene ningun vehiculo anotado es un hueco
   * del diagnostico, no un contratista sin vehiculos.
   */
  private contratistas(
    contratistas: Models.Diagnostico.Contratistas[],
    vehiculos: Models.Diagnostico.Vehiculo[]
  ): ModelsInforme.Seccion {
    const total = contratistas.length;
    const enAlcance = contratistas.filter(c => /^si$/i.test(c.realizaDesplazamientos ?? ''));
    const conductores = enAlcance.reduce((n, c) => n + (Number(c.conductores) || 0), 0);

    // Cuantos vehiculos tiene anotado cada contratista en el registro de flota.
    const vehiculosPorContratista = new Map<string, number>();
    for (const vehiculo of vehiculos) {
      if (!vehiculo.contratistaId) continue;
      vehiculosPorContratista.set(
        vehiculo.contratistaId,
        (vehiculosPorContratista.get(vehiculo.contratistaId) ?? 0) + 1
      );
    }

    const aportados = [...vehiculosPorContratista.values()].reduce((n, v) => n + v, 0);
    const sinVehiculos = enAlcance.filter(
      c => !vehiculosPorContratista.get(c.id)
    ).length;

    const vencido = contratistas.filter(c => this.contratoVencido(c)).length;
    const porVencer = contratistas.filter(
      c => !c.contratoIndefinido
        && estadoVigencia(c.fechaFinContrato).estado === 'porVencer'
    ).length;
    const indefinidos = contratistas.filter(c => c.contratoIndefinido).length;

    // Un contrato indefinido esta en regla: no vence, simplemente sigue.
    const contratoEnRegla = contratistas.filter(
      c => c.contratoIndefinido
        || estadoVigencia(c.fechaFinContrato).estado === 'vigente'
    ).length;

    return {
      id: 'contratistas',
      titulo: 'Contratistas',
      texto: this.textoContratistas(total, enAlcance.length, conductores, {
        aportados, sinVehiculos, vencido, porVencer,
      }),
      sinDatos: !total,
      cifras: [
        { etiqueta: 'Contratistas', valor: total },
        {
          etiqueta: 'Con desplazamientos', valor: enAlcance.length,
          nota: 'Los que entran en las obligaciones del PESV',
        },
        {
          etiqueta: 'Conductores que aportan', valor: conductores,
          nota: 'No responden la encuesta',
        },
        { etiqueta: 'Vehículos que aportan', valor: aportados },
        this.cifraCumple('Con contrato vigente', contratoEnRegla, total, {
          bien: 'Todas las vinculaciones están al día',
          mal: this.pendientes([
            vencido ? `${vencido} vencido` : null,
            porVencer ? `${porVencer} vence este mes` : null,
            total - contratoEnRegla - vencido - porVencer
              ? `${total - contratoEnRegla - vencido - porVencer} sin fecha`
              : null,
          ]),
        }),
        this.cifraCumple('Con vehículos registrados',
          enAlcance.length - sinVehiculos, enAlcance.length, {
            bien: 'Se sabe con qué circula cada uno',
            mal: `${sinVehiculos} se desplazan, pero no consta con qué`,
          }),
        {
          etiqueta: 'Contratos indefinidos', valor: indefinidos,
          nota: 'Ninguna fecha obliga a revisar sus cláusulas',
        },
      ],
      repartos: [
        this.repartoTipoContratista(contratistas),
        this.repartoVinculacion(contratistas, enAlcance),
      ],
      tablas: this.tablaContratistas(enAlcance, vehiculosPorContratista),
    };
  }

  private repartoTipoContratista(
    contratistas: Models.Diagnostico.Contratistas[]
  ): ModelsInforme.Reparto {
    const reparto = this.contar('Contratistas por tipo', contratistas,
      c => c.tipoContratista);
    reparto.grafica = 'barras';

    const mayor = reparto.filas[0];
    if (mayor) {
      reparto.texto = `El tipo más frecuente es ${mayor.etiqueta.toLowerCase()}, con `
        + `${mayor.total} de ${contratistas.length} contratistas (${mayor.porcentaje}%). `
        + `El tipo importa porque determina qué se le puede exigir: a un transportador `
        + `se le exige su propio PESV, a un proveedor ocasional basta con que cumpla las `
        + `condiciones del contrato.`;
    }

    return reparto;
  }

  /** Como se vincula el contratista y con que continuidad opera. */
  private repartoVinculacion(
    contratistas: Models.Diagnostico.Contratistas[],
    enAlcance: Models.Diagnostico.Contratistas[]
  ): ModelsInforme.Reparto {
    const reparto = this.contar('Tipo de vinculación', contratistas,
      c => c.tipoVinculacion);
    reparto.titulo = 'Vinculación y continuidad de la operación';
    reparto.grafica = 'tabla';
    reparto.unidad = 'Contratistas';
    reparto.emparejado = this.contar('Tipo de flota', enAlcance,
      c => c.tipoFlota || 'Sin definir');
    reparto.emparejado.unidad = 'Contratistas';

    const ocasionales = this.sumarQue(reparto.emparejado, /ocasional/i);
    if (ocasionales) {
      reparto.texto = `${ocasionales} de los ${enAlcance.length} contratistas que se `
        + `desplazan operan con flota ocasional. Una flota que cambia de vehículos y de `
        + `conductores es la más difícil de controlar: la verificación no puede hacerse `
        + `una vez al firmar, tiene que repetirse en cada servicio.`;
    } else if (enAlcance.length) {
      reparto.texto = `Los contratistas que se desplazan operan con flota fidelizada, lo `
        + `que permite verificar documentación y conductores una vez y mantener el `
        + `control en el tiempo.`;
    }

    return reparto;
  }

  /**
   * Los contratistas que entran en el alcance, uno por uno.
   *
   * Con pocos registros y datos que no se pueden agrupar —una razon social, un
   * servicio, una fecha de contrato— el listado dice mas que cualquier
   * reparto.
   */
  private tablaContratistas(
    enAlcance: Models.Diagnostico.Contratistas[],
    vehiculosPorContratista: Map<string, number>
  ): ModelsInforme.Tabla[] {
    if (!enAlcance.length) return [];

    return [{
      titulo: `Contratistas que realizan desplazamientos (${enAlcance.length})`,
      columnas: ['Razón social', 'Tipo', 'Servicio', 'Conductores', 'Vehículos', 'Contrato'],
      filas: enAlcance.map(c => [
        textoSeguro(c.nombreRazonSocial, 'Sin nombre'),
        textoSeguro(c.tipoContratista, '—'),
        textoSeguro(c.servicioPrestado, '—'),
        String(Number(c.conductores) || 0),
        String(vehiculosPorContratista.get(c.id) ?? 0),
        this.vigenciaContrato(c),
      ]),
    }];
  }

  /** En que situacion esta el contrato, incluido el caso indefinido. */
  private vigenciaContrato(contratista: Models.Diagnostico.Contratistas): string {
    if (contratista.contratoIndefinido) return 'Indefinido';
    return this.resumenVigencia(contratista.fechaFinContrato);
  }

  private contratoVencido(contratista: Models.Diagnostico.Contratistas): boolean {
    return !contratista.contratoIndefinido
      && estadoVigencia(contratista.fechaFinContrato).estado === 'vencido';
  }

  /** Resume la seccion, empezando por lo que la encuesta no ve. */
  private textoContratistas(
    total: number,
    enAlcance: number,
    conductores: number,
    h: { aportados: number; sinVehiculos: number; vencido: number; porVencer: number }
  ): string {
    if (!total) return '';

    const partes = [`La organización registra ${total} contratistas, de los cuales `
      + `${enAlcance} realizan desplazamientos por su cuenta y entran por tanto en las `
      + `obligaciones del PESV.`];

    if (conductores) {
      partes.push(`Entre todos aportan ${conductores} conductores y ${h.aportados} `
        + `vehículos. Conviene subrayar que esos conductores no responden la encuesta: no `
        + `son colaboradores de la empresa y no aparecen en ninguna de las cifras de `
        + `caracterización, aunque circulen por cuenta de la organización. Esta sección `
        + `es el único lugar del diagnóstico donde esa exposición queda registrada.`);
    }

    if (h.vencido) {
      partes.push(`${h.vencido} contratistas tienen el contrato vencido. Es un hallazgo `
        + `con consecuencia práctica: las obligaciones de seguridad vial se exigen por `
        + `contrato, y sin contrato vigente no hay cláusula que hacer cumplir.`);
    }

    if (h.porVencer) {
      partes.push(`Otros ${h.porVencer} lo tienen venciendo en los próximos `
        + `${DIAS_AVISO} días: es el momento de incorporar las cláusulas de seguridad `
        + `vial a la renovación.`);
    }

    if (h.sinVehiculos) {
      partes.push(`En ${h.sinVehiculos} de los contratistas que se desplazan no consta `
        + `ningún vehículo en el registro de flota. No significa que no los tengan, sino `
        + `que el diagnóstico no sabe con qué circulan: conviene completarlo antes de `
        + `emitir el informe.`);
    }

    return partes.join(' ');
  }

  /**
   * Da lectura y forma a las rutas frecuentes.
   *
   * Una ruta no es un dato administrativo: es el sitio concreto donde ocurre
   * el riesgo. La Resolucion pide estudiarlas, y estudiarlas empieza por saber
   * cuales se recorren mas y que tienen. Por eso la seccion ordena por
   * kilometros al mes y no por nombre.
   */
  private rutas(rutas: Models.Diagnostico.Ruta[]): ModelsInforme.Seccion {
    const kmDe = (r: Models.Diagnostico.Ruta) =>
      kilometrosAlMes(r.distanciaKm, r.frecuencia);

    const kmMes = rutas.reduce((total, r) => total + (kmDe(r) ?? 0), 0);
    const sinEstimar = rutas.filter(r => kmDe(r) === null).length;
    const sinRiesgos = rutas.filter(r => !(r.factoresRiesgo ?? []).length).length;

    return {
      id: 'rutas',
      titulo: 'Rutas frecuentes',
      texto: this.textoRutas(rutas.length, kmMes, sinEstimar, sinRiesgos),
      sinDatos: !rutas.length,
      cifras: [
        { etiqueta: 'Rutas registradas', valor: rutas.length },
        {
          etiqueta: 'Kilómetros al mes', valor: kmMes.toLocaleString('es-CO'),
          nota: 'Base de los indicadores por millón de kilómetros',
        },
        this.cifraCumple('Con exposición estimada',
          rutas.length - sinEstimar, rutas.length, {
            bien: 'Todas tienen distancia y frecuencia',
            mal: `${sinEstimar} ocasionales o sin distancia registrada`,
          }),
        this.cifraCumple('Con riesgos identificados',
          rutas.length - sinRiesgos, rutas.length, {
            bien: 'Todas las rutas tienen riesgos señalados',
            mal: `${sinRiesgos} sin señalar: ninguna vía está libre de riesgo`,
          }),
      ],
      repartos: [
        this.repartoTipoVia(rutas),
        this.repartoFrecuencia(rutas),
        this.repartoRiesgosRuta(rutas),
        this.repartoFamiliasRiesgo(rutas),
      ],
      tablas: this.tablaRutas(rutas, kmDe),
    };
  }

  private repartoTipoVia(rutas: Models.Diagnostico.Ruta[]): ModelsInforme.Reparto {
    const reparto = this.contar('Rutas por tipo de vía', rutas, r => r.tipoVia);
    reparto.grafica = 'barras';

    const mayor = reparto.filas[0];
    if (mayor) {
      reparto.texto = `La mayoría de las rutas discurren por vía `
        + `${mayor.etiqueta.toLowerCase()}: ${mayor.total} de ${rutas.length} `
        + `(${mayor.porcentaje}%). El tipo de vía condiciona el límite de velocidad, la `
        + `presencia de otros actores viales y qué autoridad hay que involucrar cuando `
        + `el riesgo está en la infraestructura.`;
    }

    return reparto;
  }

  /** La frecuencia, en orden de intensidad y no por tamano. */
  private repartoFrecuencia(rutas: Models.Diagnostico.Ruta[]): ModelsInforme.Reparto {
    const reparto = this.contar('Rutas por frecuencia', rutas, r => r.frecuencia);
    reparto.grafica = 'columnas';

    // De la mas intensa a la mas esporadica. Las ocasionales, que no tienen
    // periodicidad, cierran la escala.
    const viajes = (etiqueta: string) => VIAJES_AL_MES[etiqueta] ?? -1;
    reparto.filas.sort((a, b) => viajes(b.etiqueta) - viajes(a.etiqueta));

    const diarias = this.sumarQue(reparto, /diaria/i);
    if (diarias) {
      reparto.texto = `${diarias} rutas se recorren a diario. Son las que concentran la `
        + `exposición y por las que conviene empezar cualquier estudio de rutas: una vía `
        + `mala recorrida una vez al mes es un problema; la misma vía recorrida cada día `
        + `es veintidós.`;
    }

    return reparto;
  }

  /**
   * Los riesgos de las rutas, agrupados como en la encuesta.
   *
   * Los factores estan agrupados en via y entorno a proposito: son las mismas
   * dos familias que se preguntan a los trabajadores, asi que lo que declara
   * el operativo y lo que percibe quien la recorre se pueden contrastar.
   */
  private repartoRiesgosRuta(rutas: Models.Diagnostico.Ruta[]): ModelsInforme.Reparto {
    const reparto = this.contarLista('Riesgos señalados en las rutas', rutas,
      r => r.factoresRiesgo ?? []);
    reparto.grafica = 'barras';

    const top = reparto.filas.slice(0, 3);
    if (top.length) {
      reparto.texto = `Los riesgos más señalados son `
        + `${this.enumerar(top.map(f => `${f.etiqueta.toLowerCase()} (${f.total} rutas)`))}. `
        + `Son los que deben orientar el estudio de rutas y, cuando dependen de la `
        + `infraestructura, la gestión ante la autoridad vial.`;
    }

    return reparto;
  }

  /** Cuantas rutas toca cada familia de riesgo, que son las de la encuesta. */
  private repartoFamiliasRiesgo(
    rutas: Models.Diagnostico.Ruta[]
  ): ModelsInforme.Reparto {
    const filas = FACTORES_RIESGO_RUTA.map(grupo => {
      const total = rutas.filter(
        r => (r.factoresRiesgo ?? []).some(f => grupo.factores.includes(f))
      ).length;
      return { etiqueta: grupo.grupo, total, porcentaje: this.pct(total, rutas.length) };
    });

    return {
      titulo: 'Rutas afectadas, por familia de riesgo',
      filas,
      grafica: 'tabla',
      unidad: 'Rutas',
      texto: 'Las dos familias son las mismas que se preguntan a los trabajadores en el '
        + 'módulo de identificación de riesgos. Aquí las declara quien planifica la ruta; '
        + 'allí las percibe quien la recorre. Donde las dos lecturas no coincidan hay algo '
        + 'que revisar.',
    };
  }

  /**
   * Las rutas ordenadas por exposicion.
   *
   * Es el orden en que hay que atenderlas: la que mas kilometros acumula al
   * mes es donde una mejora rinde mas, aunque no sea la peor de la lista.
   */
  private tablaRutas(
    rutas: Models.Diagnostico.Ruta[],
    kmDe: (r: Models.Diagnostico.Ruta) => number | null
  ): ModelsInforme.Tabla[] {
    if (!rutas.length) return [];

    const ordenadas = [...rutas].sort((a, b) => (kmDe(b) ?? -1) - (kmDe(a) ?? -1));

    return [{
      titulo: `Rutas por exposición mensual (${rutas.length})`,
      columnas: ['Ruta', 'Trayecto', 'Tipo de vía', 'Frecuencia', 'Km/mes', 'Riesgos'],
      filas: ordenadas.map(r => {
        const km = kmDe(r);
        return [
          textoSeguro(r.nombreRuta, 'Sin nombre'),
          `${textoSeguro(r.origen, '—')} → ${textoSeguro(r.destino, '—')}`,
          textoSeguro(r.tipoVia, '—'),
          textoSeguro(r.frecuencia, '—'),
          km === null ? 'Sin estimar' : km.toLocaleString('es-CO'),
          String((r.factoresRiesgo ?? []).length || '—'),
        ];
      }),
    }];
  }

  private textoRutas(
    total: number, kmMes: number, sinEstimar: number, sinRiesgos: number
  ): string {
    if (!total) return '';

    const partes = [`La organización tiene ${total} rutas frecuentes registradas, que `
      + `suman unos ${kmMes.toLocaleString('es-CO')} kilómetros al mes. Este recorrido se `
      + `calcula a partir de la distancia y la frecuencia de cada ruta, y mide la `
      + `exposición de la operación; no debe confundirse con el kilometraje declarado por `
      + `los vehículos de la flota, que mide otra cosa.`];

    if (sinEstimar) {
      partes.push(`${sinEstimar} rutas quedan fuera de ese cálculo, por ser ocasionales o `
        + `por no tener distancia registrada.`);
    }

    if (sinRiesgos) {
      partes.push(`En ${sinRiesgos} rutas no se ha señalado ningún factor de riesgo. `
        + `Ninguna vía está libre de riesgo, así que lo más probable es que falte `
        + `completar el registro y no que la ruta sea segura.`);
    }

    return partes.join(' ');
  }

  /**
   * Da lectura y forma a la preparacion ante emergencias.
   *
   * Lo que se mide aqui no es cuantos planes hay sino cuantos escenarios
   * quedan sin cubrir, y si los que hay sirven para algo. Un plan sin pasos,
   * sin responsable o sin telefono es un titulo: en el momento en que hace
   * falta, no se puede activar.
   */
  private emergencias(
    planes: Models.Diagnostico.PlanEmergencia[]
  ): ModelsInforme.Seccion {
    const cubiertos = new Set(planes.map(p => p.tipoEmergencia));
    const pendientes = TIPOS_EMERGENCIA.filter(t => !cubiertos.has(t));

    const sinProtocolo = planes.filter(p => !(p.protocoloAccion ?? '').trim()).length;
    const conSoporte = planes.filter(p => (p.soporteUrl ?? '').trim()).length;
    const sinResponsable = planes.filter(p => !(p.responsable ?? '').trim()).length;
    const sinTelefono = planes.filter(p => !(p.telefonoEmergencia ?? '').trim()).length;

    const enRevision = (estado: string) => planes.filter(
      p => estadoVigencia(p.fechaRevision).estado === estado
    ).length;

    const vencida = enRevision('vencido');
    const porVencer = enRevision('porVencer');
    const sinFecha = enRevision('sinRegistrar');
    const alDia = enRevision('vigente');

    return {
      id: 'emergencias',
      titulo: 'Preparación ante emergencias',
      texto: this.textoEmergencias(planes.length, [...pendientes], {
        sinProtocolo, sinResponsable, sinTelefono, vencida, sinFecha, conSoporte,
      }),
      sinDatos: !planes.length,
      cifras: [
        { etiqueta: 'Planes registrados', valor: planes.length },
        {
          etiqueta: 'Escenarios cubiertos',
          valor: TIPOS_EMERGENCIA.length - pendientes.length,
          alerta: pendientes.length > 0,
          // Aqui el total si hace falta para entender la cifra, asi que va en
          // la nota: "faltan 4" y el numero grande dice 2, que son los seis.
          nota: pendientes.length
            ? `Faltan ${pendientes.length}: ${pendientes.join(', ')}`
            : `Los ${TIPOS_EMERGENCIA.length} escenarios tienen plan`,
        },
        this.cifraCumple('Con protocolo de acción',
          planes.length - sinProtocolo, planes.length, {
            bien: 'Todos describen los pasos a seguir',
            mal: `${sinProtocolo} sin pasos: no se pueden seguir`,
          }),
        this.cifraCumple('Con responsable', planes.length - sinResponsable, planes.length, {
          bien: 'Todos tienen a quién avisar',
          mal: `${sinResponsable} sin responsable asignado`,
        }),
        this.cifraCumple('Con teléfono de emergencia',
          planes.length - sinTelefono, planes.length, {
            bien: 'Todos se pueden activar por teléfono',
            mal: `${sinTelefono} sin teléfono de contacto`,
          }),
        this.cifraCumple('Con revisión al día', alDia, planes.length, {
          bien: `Ninguna vence en los próximos ${DIAS_AVISO} días`,
          mal: this.pendientes([
            vencida ? `${vencida} vencida` : null,
            porVencer ? `${porVencer} vence este mes` : null,
            sinFecha ? `${sinFecha} sin fecha` : null,
          ]),
        }),
        this.cifraCumple('Con documento de soporte', conSoporte, planes.length, {
          bien: 'Todos tienen el procedimiento firmado',
          mal: `${planes.length - conSoporte} sin adjuntar (opcional)`,
        }),
      ],
      repartos: [],
      tablas: [this.tablaCobertura(planes), ...this.tablaPlanes(planes)],
    };
  }

  /**
   * La cobertura escenario por escenario, incluidos los que estan a cero.
   *
   * En barras no se leia. Con seis escenarios y uno o ningun plan en cada
   * uno, todas las barras miden lo mismo o nada, y comparar alturas que no
   * varian no dice nada. Lo que hay que ver de un vistazo es cuales faltan,
   * y eso es una columna de estado, no un grafico.
   */
  private tablaCobertura(
    planes: Models.Diagnostico.PlanEmergencia[]
  ): ModelsInforme.Tabla {
    const filas: string[][] = TIPOS_EMERGENCIA.map(escenario => {
      const total = planes.filter(p => p.tipoEmergencia === escenario).length;
      return [escenario, String(total), total ? 'Cubierto' : 'Sin plan'];
    });

    // "Otro" no cuenta para la cobertura, pero si hay planes ahi se ensenan:
    // son trabajo hecho y esconderlo seria injusto con quien lo hizo.
    const otros = planes.filter(p => p.tipoEmergencia === TIPO_EMERGENCIA_OTRO).length;
    if (otros) {
      filas.push([TIPO_EMERGENCIA_OTRO, String(otros), 'Fuera del recuento de cobertura']);
    }

    return {
      titulo: 'Cobertura por escenario de emergencia',
      columnas: ['Escenario', 'Planes', 'Estado'],
      filas,
    };
  }

  /** Los planes uno por uno, con lo que les falta para poder activarse. */
  private tablaPlanes(
    planes: Models.Diagnostico.PlanEmergencia[]
  ): ModelsInforme.Tabla[] {
    if (!planes.length) return [];

    return [{
      titulo: `Planes de emergencia registrados (${planes.length})`,
      columnas: [
        'Plan', 'Escenario', 'Responsable', 'Teléfono', 'Protocolo', 'Soporte', 'Revisión',
      ],
      filas: planes.map(p => [
        textoSeguro(p.nombrePlan, 'Sin nombre'),
        textoSeguro(p.tipoEmergencia, '—'),
        textoSeguro(p.responsable, 'Sin asignar'),
        textoSeguro(p.telefonoEmergencia, 'Sin registrar'),
        (p.protocoloAccion ?? '').trim() ? 'Documentado' : 'Sin documentar',
        (p.soporteUrl ?? '').trim() ? 'Adjunto' : 'Sin adjuntar',
        this.resumenVigencia(p.fechaRevision),
      ]),
    }];
  }

  private textoEmergencias(
    total: number,
    pendientes: string[],
    h: {
      sinProtocolo: number; sinResponsable: number; sinTelefono: number;
      vencida: number; sinFecha: number; conSoporte: number;
    }
  ): string {
    if (!total) {
      return 'La organización no tiene registrado ningún plan de preparación y respuesta '
        + 'ante emergencias viales. Es uno de los pasos obligatorios del PESV y, más allá '
        + 'del requisito, es lo que determina qué ocurre en los minutos siguientes a un '
        + 'siniestro.';
    }

    const partes = [`La organización tiene ${total} planes de respuesta registrados.`];

    if (pendientes.length) {
      partes.push(`Quedan sin cubrir ${pendientes.length} de los `
        + `${TIPOS_EMERGENCIA.length} escenarios previstos: ${pendientes.join(', ')}.`);
    } else {
      partes.push('Los escenarios previstos están todos cubiertos.');
    }

    // Lo que impide activar un plan pesa mas que cuantos planes hay.
    const inservibles: string[] = [];
    if (h.sinProtocolo) inservibles.push(`${h.sinProtocolo} no describen los pasos a seguir`);
    if (h.sinResponsable) inservibles.push(`${h.sinResponsable} no tienen responsable asignado`);
    if (h.sinTelefono) inservibles.push(`${h.sinTelefono} no tienen teléfono de emergencia`);

    if (inservibles.length) {
      partes.push(`De los registrados, ${this.enumerar(inservibles)}. Un plan al que le `
        + `falta cualquiera de esas tres cosas no se puede activar en el momento en que `
        + `hace falta, que es el único momento en que sirve.`);
    }

    if (h.vencida) {
      partes.push(`${h.vencida} planes tienen la fecha de revisión vencida y dejan de `
        + `valer en una auditoría.`);
    }

    if (h.sinFecha) {
      partes.push(`En ${h.sinFecha} no consta fecha de revisión, de modo que nada obliga `
        + `a volver a mirarlos.`);
    }

    if (h.conSoporte) {
      partes.push(`${h.conSoporte} de los planes tienen adjunto el procedimiento firmado `
        + `como documento de soporte.`);
    }

    return partes.join(' ');
  }

  /** El nombre de quien tiene la sesión, para proponerlo como responsable. */
  private async responsablePropuesto(): Promise<string> {
    try {
      const perfil = await this._perfil.getPerfilEdit();
      return (perfil as { nombreCompleto?: string })?.nombreCompleto
        || this._auth.getCurrentUser()?.email
        || '';
    } catch (error: unknown) {
      console.error('[Informe] responsablePropuesto:', error);
      return '';
    }
  }

  /**
   * Una cifra de cumplimiento: cuantos estan en regla, de cuantos hay.
   *
   * Antes estas tarjetas contaban carencias y no habia forma de leerlas.
   * "Sin protocolo de accion: 0", al lado de "Planes registrados: 2", se
   * entiende como "no hay ningun protocolo" cuando dice exactamente lo
   * contrario. Ponerle el total al lado y explicarlo en la nota no basto:
   * en una tarjeta manda el numero grande, y el numero grande decia cero
   * justo cuando todo estaba bien.
   *
   * Ahora todas cuentan en la misma direccion: cuantos cumplen de cuantos
   * hay. Mas es mejor en todas, el rojo aparece siempre que falte alguno, y
   * el detalle de que falta va en la nota.
   *
   * El total no se imprime junto al numero. En una rejilla de ocho tarjetas,
   * ocho veces "de 2" es ruido que tapa lo unico que cambia, y cuando algo
   * falla la nota ya dice cuantos son: el total se recompone sumando. Cuando
   * no falla nada, el total sobra.
   */
  private cifraCumple(
    etiqueta: string, cumplen: number, total: number,
    nota: { bien: string; mal: string }
  ): ModelsInforme.Cifra {
    const faltan = total - cumplen;
    return {
      etiqueta,
      valor: cumplen,
      alerta: faltan > 0,
      nota: faltan > 0 ? nota.mal : nota.bien,
    };
  }

  /** Une los pendientes de una tarjeta: "1 vencido - 2 sin registrar". */
  private pendientes(partes: (string | null)[]): string {
    return partes.filter(Boolean).join(' · ');
  }

  // ── Ayudantes de recuento ─────────────────────────────────────────────────

  /** Cuántos hay de cada valor, ordenados de más a menos. */
  private contar<T>(
    titulo: string, items: T[], leer: (item: T) => string | undefined
  ): ModelsInforme.Reparto {
    return this.repartoDe(titulo, items.length, items.map(i => [leer(i)]).flat());
  }

  /** Igual, pero cuando cada registro puede señalar varios valores. */
  private contarLista<T>(
    titulo: string, items: T[], leer: (item: T) => string[]
  ): ModelsInforme.Reparto {
    return this.repartoDe(titulo, items.length, items.flatMap(leer));
  }

  /** El reparto de una pregunta de la encuesta sobre las respuestas dadas. */
  private repartoDePregunta(
    pregunta: any, respuestas: Record<string, any>[]
  ): ModelsInforme.Reparto {
    const valores = respuestas.flatMap(r => {
      const valor = r[pregunta.id];
      return Array.isArray(valor) ? valor : [valor];
    });
    const reparto = this.repartoDe(pregunta.etiqueta, respuestas.length, valores);
    reparto.id = pregunta.id;
    return reparto;
  }

  /**
   * El porcentaje se calcula sobre el total de registros, no sobre los valores
   * contados: en una pregunta de varias opciones los porcentajes suman más de
   * cien, y así se lee como "de cada cien personas, tantas señalaron esto".
   */
  private repartoDe(
    titulo: string, totalRegistros: number, valores: (string | undefined)[]
  ): ModelsInforme.Reparto {
    const cuenta = new Map<string, number>();
    for (const valor of valores) {
      if (valor === undefined || valor === null || valor === '') continue;
      const clave = String(valor);
      cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
    }

    const base = totalRegistros || 1;
    return {
      titulo,
      filas: [...cuenta.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([etiqueta, total]) => ({
          etiqueta,
          total,
          porcentaje: Math.round((total / base) * 1000) / 10,
        })),
    };
  }
}
