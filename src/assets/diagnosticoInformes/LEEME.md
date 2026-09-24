# Imágenes de relleno del informe de diagnóstico

Cubren el espacio que sobra al pie de la última página de una sección.

Cada sección del informe empieza en su propia página, que es lo que permite
hojearlo por partes. El precio es que una sección corta deja media hoja en
blanco. Estas imágenes tapan ese hueco.

## Cómo crearlas

Van **de borde a borde de la hoja**, sin respetar los márgenes del documento.
Por eso el ancho de referencia es 612 puntos (la hoja carta entera) y no 512.

Exporta a **1.800 píxeles de ancho**, que son unos 212 puntos por pulgada:
se ven bien impresas sin que el PDF engorde.

| Archivo                  | Alto en píxeles | Alto en el PDF | Cubre un hueco de |
|--------------------------|-----------------|----------------|-------------------|
| `relleno_612x102_v*.jpg` | 300             | 102 pt         | desde 130 pt      |
| `relleno_612x153_v*.jpg` | 450             | 153 pt         | desde 180 pt      |
| `relleno_612x204_v*.jpg` | 600             | 204 pt         | desde 230 pt      |
| `relleno_612x306_v*.jpg` | 900             | 306 pt         | desde 330 pt      |
| `relleno_612x408_v*.jpg` | 1200            | 408 pt         | desde 430 pt      |

El sistema elige la más alta que quepa, y entre las de ese mismo tamaño rota
entre versiones para no repetir la misma dos veces en un informe. Con dos
versiones de cada tamaño es suficiente; se pueden añadir más.

**JPG y no PNG**: para una ilustración con fondo, el PNG pesa tres o cuatro
veces más sin verse mejor.

## Cómo añadir una

1. Dejar el archivo en esta carpeta.
2. Añadir su nombre en `src/app/data/rellenos-informe.ts`.

El alto no se deduce del nombre: se mide de la imagen al cargarla. Si
reexportas una con otra proporción, el sistema se adapta solo.

## Qué poner en ellas

Diseños decorativos, abstractos o ilustrados. Nada que pueda leerse como
evidencia de una actividad concreta: una fotografía de una capacitación real
al pie de la sección de formación puede entenderse como que documenta esa
sesión, y no documenta nada.

## La portada

`portada.jpg` cubre la primera hoja entera, de borde a borde y por detrás del
título. Si el archivo no está, la portada sale en blanco como siempre.

Exporta a **1700 × 2200 píxeles** (8,5 × 11 pulgadas a 200 ppp). Si la
proporción no es exacta, el sistema la recorta centrada en vez de estirarla.

**Deja libre la franja central**, más o menos entre el 30% y el 65% de la
altura: ahí van el título, el nombre de la empresa y el periodo. El texto es
azul oscuro y naranja, así que esa zona tiene que ser clara. Si el diseño es
oscuro, dilo y se cambia el texto a blanco.
