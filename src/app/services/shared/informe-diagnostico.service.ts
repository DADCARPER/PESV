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

    return modulos.map(modulo => ({
      id: modulo.id,
      titulo: modulo.titulo,
      texto: '',
      sinDatos: !respuestas.length,
      cifras: [],
      repartos: (modulo.preguntas ?? [])
        .filter((p: any) => p.tipo === 'unica' || p.tipo === 'multiple')
        .map((p: any) => this.repartoDePregunta(p, respuestas)),
    }));
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
    return this.repartoDe(pregunta.etiqueta, respuestas.length, valores);
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
