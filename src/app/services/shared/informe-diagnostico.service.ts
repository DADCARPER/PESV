import { Injectable, inject } from '@angular/core';
import { DiagnosticoDatosService } from './diagnostico-datos.service';
import { EncuestaEmpresaService } from './encuesta-empresa.service';
import { EmpresaService } from './empresa.service';
import { AuthenticacionService } from './authenticacion.service';
import { PerfilService } from './perfil.service';
import { Models } from '../../interfaces/models';
import { ModelsInforme } from '../../interfaces/informe.interface';
import { kilometrosAlMes } from '../../data/rutas';
import { TIPOS_EMERGENCIA } from '../../data/emergencias';
import { estadoVigencia } from '../../data/vigencias';

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
        this.contratistas(contratistas),
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

  private flota(vehiculos: Models.Diagnostico.Vehiculo[]): ModelsInforme.Seccion {
    const propios = vehiculos.filter(v => v.tipoRelacion === 'Propio').length;

    const sinSoat = vehiculos.filter(
      v => estadoVigencia(v.vigenciaSoat).estado !== 'vigente'
    ).length;
    const sinRevision = vehiculos.filter(
      v => estadoVigencia(v.vigenciaRevisionTecnica).estado !== 'vigente'
    ).length;

    return {
      id: 'flota',
      titulo: 'La flota',
      texto: '',
      sinDatos: !vehiculos.length,
      cifras: [
        { etiqueta: 'Vehículos', valor: vehiculos.length },
        { etiqueta: 'Propios', valor: propios },
        { etiqueta: 'De terceros', valor: vehiculos.length - propios },
        {
          etiqueta: 'Sin SOAT vigente', valor: sinSoat, alerta: sinSoat > 0,
          nota: 'No pueden circular legalmente',
        },
        {
          etiqueta: 'Sin revisión técnica vigente', valor: sinRevision, alerta: sinRevision > 0,
        },
      ],
      repartos: [
        this.contar('Vehículos por tipo', vehiculos, v => v.tipoVehiculo),
        this.contar('Vehículos por relación', vehiculos, v => v.tipoRelacion),
      ],
    };
  }

  private contratistas(contratistas: Models.Diagnostico.Contratistas[]): ModelsInforme.Seccion {
    const conDesplazamientos = contratistas.filter(c => c.realizaDesplazamientos === 'SI');
    const conductores = conDesplazamientos.reduce((n, c) => n + (Number(c.conductores) || 0), 0);

    return {
      id: 'contratistas',
      titulo: 'Contratistas',
      texto: '',
      sinDatos: !contratistas.length,
      cifras: [
        { etiqueta: 'Contratistas', valor: contratistas.length },
        {
          etiqueta: 'Con desplazamientos', valor: conDesplazamientos.length,
          nota: 'Los que entran en las obligaciones del PESV',
        },
        { etiqueta: 'Conductores que aportan', valor: conductores },
      ],
      repartos: [
        this.contar('Por tipo de contratista', contratistas, c => c.tipoContratista),
        this.contar('Por tipo de vinculación', contratistas, c => c.tipoVinculacion),
      ],
    };
  }

  private rutas(rutas: Models.Diagnostico.Ruta[]): ModelsInforme.Seccion {
    const kmMes = rutas.reduce(
      (total, r) => total + (kilometrosAlMes(r.distanciaKm, r.frecuencia) ?? 0), 0
    );
    const sinEstimar = rutas.filter(
      r => kilometrosAlMes(r.distanciaKm, r.frecuencia) === null
    ).length;

    return {
      id: 'rutas',
      titulo: 'Rutas frecuentes',
      texto: '',
      sinDatos: !rutas.length,
      cifras: [
        { etiqueta: 'Rutas registradas', valor: rutas.length },
        {
          etiqueta: 'Kilómetros al mes', valor: kmMes,
          nota: sinEstimar
            ? `${sinEstimar} rutas sin estimar, por ser ocasionales o no tener distancia`
            : 'Base de los indicadores por millón de kilómetros',
        },
      ],
      repartos: [
        this.contar('Rutas por tipo de vía', rutas, r => r.tipoVia),
        this.contar('Rutas por frecuencia', rutas, r => r.frecuencia),
        this.contarLista('Riesgos señalados en las rutas', rutas, r => r.factoresRiesgo ?? []),
      ],
    };
  }

  private emergencias(planes: Models.Diagnostico.PlanEmergencia[]): ModelsInforme.Seccion {
    const cubiertos = new Set(planes.map(p => p.tipoEmergencia));
    const pendientes = TIPOS_EMERGENCIA.filter(t => !cubiertos.has(t));

    const sinRevisar = planes.filter(
      p => estadoVigencia(p.fechaRevision).estado === 'vencido'
    ).length;

    return {
      id: 'emergencias',
      titulo: 'Preparación ante emergencias',
      texto: '',
      sinDatos: !planes.length,
      cifras: [
        { etiqueta: 'Planes registrados', valor: planes.length },
        {
          etiqueta: 'Escenarios cubiertos',
          valor: `${TIPOS_EMERGENCIA.length - pendientes.length} de ${TIPOS_EMERGENCIA.length}`,
          alerta: pendientes.length > 0,
          nota: pendientes.length ? `Faltan: ${pendientes.join(', ')}` : '',
        },
        {
          etiqueta: 'Planes con revisión vencida', valor: sinRevisar, alerta: sinRevisar > 0,
        },
      ],
      repartos: [this.contar('Planes por escenario', planes, p => p.tipoEmergencia)],
    };
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
