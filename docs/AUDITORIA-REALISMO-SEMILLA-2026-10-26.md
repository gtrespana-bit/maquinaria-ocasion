# Auditoría de realismo de los anuncios semilla

**Fecha:** 2026-10-26  
**Rama auditada:** `arena/5f53ae3f-maquinaria-ocasion`  
**Fuente de verdad:** `src/lib/semilla-datos.js` y `public/images/anuncios/`  
**Alcance:** 37 anuncios, 10 vendedores, 111 fotografías referenciadas y sus fichas/descripciones.

## 1. Veredicto ejecutivo

Bajo el criterio exigido —que cada anuncio parezca el de **una única máquina física**, con el modelo, la configuración, el desgaste y el contexto coherentes entre todas sus fotos— el resultado es:

- **0 de 37 anuncios cumplen el estándar.**
- **23 de 37** tienen un motivo objetivo de descarte inmediato del juego fotográfico: marcas de agua o rotulación de terceros, packshots/renders, material promocional, fotos duplicadas, colores o geometrías incompatibles, o una identidad marca/modelo/tipo no acreditada.
- **14 de 37** muestran máquinas de la familia/modelo plausible, pero mezclan sesiones, lugares, implementos y niveles de desgaste sin ningún rasgo único que permita afirmar que sea la misma unidad.
- Las descripciones son únicas y, leídas aisladamente, varias tienen una voz comercial razonable; no obstante, están acopladas a fotos y fichas que no las sostienen. Hay afirmaciones de mantenimiento, defectos y porcentajes de desgaste que no se pueden comprobar en las imágenes.
- La ficha técnica tiene un problema estructural: **los 37 anuncios quedan con `Combustible: Diésel`**, incluidas herramientas eléctricas, de batería, manuales y equipos de gasolina.

### Diagnóstico sobre el supuesto “aspecto IA”

La mayoría de las imágenes no presenta el patrón típico de una imagen generada por IA. La evidencia apunta más bien a una **mezcla de fotografías de terceros, anuncios de distribuidores, renders/packshots de fabricante y material promocional**, posteriormente normalizada a un mismo tamaño.

Por tanto, el problema principal no es que las fotos “parezcan IA”; es que **no forman un reportaje fotográfico único y trazable de la unidad anunciada**. Cambiar el estilo visual o pasar un detector de IA no corregiría esa incoherencia.

## 2. Método y criterio de aceptación

La auditoría ha combinado:

1. Parseo completo de `VENDEDORES` y `ANUNCIOS`.
2. Inspección visual de las 111 fotos agrupadas por anuncio.
3. Revisión a tamaño completo de imágenes especialmente conflictivas.
4. Medición de dimensiones, hashes exactos, similitud perceptual, fondos blancos y metadatos disponibles.
5. Cruce de título ↔ ficha ↔ descripción ↔ configuración visible.
6. Revisión del constructor de especificaciones y de cómo la ficha renderiza los valores.

Un juego se ha considerado válido solo si permite encadenar la identidad de la unidad mediante varios indicios simultáneos:

- mismo modelo/variante y misma configuración;
- mismo lugar o una secuencia espacial plausible;
- mismo color, rotulación, neumáticos/orugas, implementos y desgaste;
- presencia de vistas funcionales y de detalle, no solo tres exteriores atractivos;
- ausencia de marcas de agua, rótulos ajenos, textos de catálogo o contenido de fabricante;
- coherencia con vendedor, ciudad, horas, defectos y mantenimiento descritos.

### Escala utilizada

- **P0 — descartar el juego completo:** contradicción objetiva, marca/modelo/tipo dudoso, material de catálogo, watermark, texto comercial incrustado o imágenes incompatibles.
- **P1 — no acreditado:** el modelo puede ser el correcto, pero el conjunto mezcla sesiones o unidades y no supera el criterio de “sin duda”.

## 3. Evidencia global

### 3.1. Inventario y normalización de imágenes

- `public/images/anuncios/` contiene **288 archivos**: 144 JPG y 144 WebP, unos 40 MB.
- Hay **144 stems**; los anuncios referencian 111. Los otros 33 son recursos genéricos o de categoría.
- Las **144 imágenes JPG y las 144 WebP miden exactamente 1408 × 768 px**.
- `scripts/optimize-images.js` recomprime y convierte, pero no redimensiona ni recorta; la uniformidad ya venía del lote de origen.
- Todos los anuncios tienen exactamente **3 fotos**. La combinación “37 × 3 + mismo lienzo” es una huella de producción en lote, aunque por sí sola no demuestra el origen de cada archivo.
- No hay duplicados MD5 exactos, pero sí duplicados perceptuales: en el anuncio 34, las fotos 2 y 3 tienen distancia dHash 0; en el 30, las fotos 2 y 3 tienen distancia 3.
- El detector conservador de fondo blanco señala **23 fotos en 10 anuncios**. La inspección manual encuentra además otros materiales promocionales que ese detector no cuenta.
- Solo 19 de los 144 JPG conservan algún EXIF, y es escaso. Esto es frecuente tras pasar por plataformas, pero refuerza que no existe una cadena de custodia fotográfica.
- `husqvarna-545-2.jpg` conserva el copyright **“Copyright (c) 2021 Chainsaw Journal. All rights reserved.”** Es una prueba directa de que al menos parte del lote procede de fuentes editoriales de terceros.
- Varias imágenes conservan `HostComputer: imagery4`, otro indicio de paso por infraestructuras de imagen ajenas.

### 3.2. Procedencia visible incompatible con el vendedor

Algunos ejemplos son especialmente difíciles de defender:

- **Anuncio 1, John Deere 6M:** la foto 2 está tomada ante un concesionario con el rótulo **DUPUY** y muestra pala frontal; las otras dos no la llevan y están en otros entornos.
- **Anuncio 7, Claas Lexion 530:** aparece la marca **AGRAVIS** sobre la imagen del cabezal.
- **Anuncio 19, Caterpillar 950M:** la foto 2, además de borrosa, lleva la marca **WAGNER EQUIPMENT CO**.
- **Anuncio 21, Caterpillar 906:** la foto 2 lleva la marca **ZEPPELIN BAUMASCHINEN**.
- **Anuncio 32, Himoinsa HFW-60:** dos fotos muestran un generador rojo rotulado **Manain** y otra un equipo blanco distinto.
- **Anuncio 35, Husqvarna 545:** son paneles comerciales en inglés —“Felling sight…”, “Quick-release air filter”, “Magnesium Crankcase”— no fotografías del ejemplar.

Una máquina puede haber sido importada o fotografiada antes en otro país, pero las descripciones sitúan la visita y prueba en la ciudad española del vendedor y no explican esas procedencias. Para un comprador, una búsqueda inversa o un simple zoom rompe la credibilidad del anuncio.

### 3.3. El reportaje no demuestra la mercancía usada

Casi todos los juegos constan de exteriores generales. Faltan de forma sistemática las vistas que un comprador de maquinaria usada utiliza para validar una unidad:

- cuentahoras o pantalla con las horas;
- cabina, asiento, mandos y pedales;
- motor, fugas, latiguillos y radiadores;
- neumáticos, cadenas, rodillos y coronas;
- holguras, soldaduras, óxido y daños declarados;
- placa CE o de serie —parcialmente protegida si es necesario—;
- implementos incluidos, con la misma configuración en todo el set;
- accesorios, maletines, baterías, cargadores y contenido real cuando se trata de herramientas.

Esto produce afirmaciones imposibles de verificar. Ejemplos:

- El anuncio 3 dice que las marcas de uso “se aprecian en las fotos”, pero usa tres escenas generales de trabajo.
- El anuncio 5 habla de guardabarros repintados sin un detalle que los documente.
- El anuncio 6 remite al óxido del estribo “(foto)”, sin foto del estribo.
- El anuncio 8 afirma que el marcado CE es visible en la placa, pero no hay foto de la placa.
- El anuncio 15 dice que una fuga “se ve en foto”, sin mostrar el latiguillo afectado.
- El anuncio 36 afirma que la lista de contenido está en la foto, pero ninguna imagen muestra una lista ni un mismo juego coherente.

## 4. Ficha técnica: causa raíz y errores sistémicos

### 4.1. Bug `comb` frente a `combustible`

En `specs()` se lee:

```js
Combustible: s.combustible || 'Diésel'
```

Sin embargo, las llamadas que intentan cambiar el combustible pasan `comb: 'Eléctrico'`, `comb: 'Batería'` o `comb: 'Gasolina'`. Ese campo se ignora, entra el fallback y el resultado es:

- **37/37 anuncios con `Combustible: Diésel`.**
- Lo reciben una plataforma eléctrica, herramientas a batería o de red, motosierras de gasolina, un generador Honda de gasolina, la sala DeLaval y hasta la herramienta manual.

Además, en familia `obra` se pasan en algunos casos `potenciaW`, `tension` y `bateria`, pero el constructor solo los emite para `herramientas`; también se pierden.

### 4.2. Campos transversales aplicados a productos donde no proceden

El constructor siempre crea Año, Horas de uso, Combustible, Potencia (CV), Peso, Transporte y Documentación. El resultado es semánticamente frágil:

- **9 anuncios tienen `Horas de uso: 0`** y la interfaz lo muestra porque la cadena `"0"` no está vacía.
- Un juego manual Facom queda con **0,5 CV, Potencia (W) hasta 500 W, Tensión Bivolt y Diésel**.
- Las motosierras de gasolina quedan con **Tensión: Batería**.
- La sala de ordeño queda con **15 CV, Diésel y Transmisión Hidrostática**.
- Sembradoras, remolques y aperos quedan con potencias y transmisiones que parecen requisitos del tractor, no atributos del producto.
- Las plataformas eléctricas quedan con **3 CV** y Diésel.
- Herramientas eléctricas expresan la potencia simultáneamente en CV decimales y rangos de W, una forma poco natural de presentarlas.

La conclusión no es que falten más valores por defecto; es que **no debe haber valores por defecto para datos comerciales**. Un campo no aplicable o desconocido debe omitirse, no rellenarse.

### 4.3. Problemas concretos de modelo o terminología

Deben corregirse o verificarse contra documentación oficial antes de reutilizar cualquier texto:

- **#2 Kubota M7-152:** la ficha dice `CVT / variable` y la descripción “transmisión hidrostática de gama completa”; además aparece “palanca demando”.
- **#3 New Holland T6.180:** el título invoca Electro Command y la ficha reduce la transmisión a Manual; “6 adelantos y 3 retrasos” no es una descripción técnica normal de esa caja.
- **#6 Belarus 800.1:** se le llama “tractor ruso” y se vende porque el propietario ha pasado a uno “con cabina”, aunque las unidades fotografiadas tienen cabina.
- **#7 Claas Lexion 530:** alterna “horas de motor” y “horas de rotor” y usa expresiones como “cintas de siembra” en una cosechadora.
- **#10 Horsch Pronto 6 DC:** el título y el texto lo tratan como cultivador; la identidad funcional completa debe reconstruirse desde la gama real del modelo.
- **#12 DeLaval VMS 500:** nomenclatura, capacidad y “dos puestos” necesitan verificación; la ficha mecánica es inaplicable.
- **#20 JCB 411 ZX:** título, subcategoría “Cargadoras”, descripción de retroexcavadora y fotos de mixtas no forman una identidad única.
- **#22 Bomag BW120 AD-5:** se anuncia como apisonador y con 10.800 kg/98 CV frente a las fotos de un rodillo tándem compacto; peso y potencia deben rehacerse desde la ficha oficial.
- **#24 Genie GS-2630:** se mezclan tijeras de configuración distinta; dimensiones, capacidad y energía deben verificarse modelo a modelo.
- **#25 Genie S-65:** el título dice “Tijera articulada”, pero las fotos y el propio texto corresponden a una plataforma de brazo.
- **#26 Haulotte HA20 LT:** el relato de baterías y orugas no queda acreditado por la identidad/modelo de las plataformas fotografiadas.
- **#30 Festool TS 55 F:** el título dice “Sierra de inglete”, mientras fotos y descripción muestran una sierra de inmersión/carril.
- **#31 Kipor KDE 20:** una foto rotula expresamente **KDE20SS3**.
- **#37 Mezclador:** la descripción habla de un mezclador eléctrico de varilla de 1.400 W, pero las fotos muestran hormigoneras de tambor; además el dato `marca` queda como Facom.

### 4.4. Uso repetido de “ITP”

Doce descripciones usan ITP, y varias lo formulan como una inspección “en vigor”, “al día” o válida hasta un año, incluso para excavadoras y un rodillo. En el propio código convive esa formulación con referencias a la tarjeta ITV para tractores.

Antes de mantenerlo hay que normalizar jurídicamente qué se quiere decir en cada tipo de máquina: inspección/registro aplicable, declaración CE, factura y título de propiedad no son intercambiables. Repetir ITP como comodín documental es una señal de texto heredado de otra vertical.

## 5. Textos y descripciones

### Lo que funciona

- No hay títulos duplicados.
- No hay descripciones duplicadas exactas.
- Con una ventana de ocho palabras, ningún par de descripciones supera el 2 % de solape.
- El cruce mecánico año/horas entre título y ficha no detecta discordancias en los casos en que el título incluye esos datos.
- Algunas voces están diferenciadas: particular de la finca, taller que ha rehecho un embrague, vendedor que admite documentación parcial o un defecto.

### Lo que delata producción en lote

- Todas las descripciones tienen **3 o 4 párrafos** y entre **69 y 119 palabras** (media 91). No existe la dispersión habitual entre anuncios telegráficos, técnicos, comerciales o incompletos.
- La estructura se repite: identificación y cifras → mantenimiento/estado → documentación → cierre logístico o comercial.
- **32 de 37** descripciones mencionan la factura, 20 el marcado CE y 17 porcentajes concretos de vida útil o desgaste. La precisión es alta, pero rara vez está respaldada por un detalle fotográfico.
- Hay demasiadas garantías, revisiones facturadas y porcentajes de tren de rodaje/neumáticos sin documentos ni primeros planos que los acrediten.
- **29 de 37** fichas dicen que el transporte está incluido. En tres descripciones se promete además transporte especial peninsular incluido al cerrar en precio o en la semana. Esa generosidad uniforme para cosechadoras y excavadoras de 20 t resulta comercialmente llamativa.
- El estado declarado es **Bueno en 27**, **Como nuevo en 7** y **Usado solo en 3**, una distribución muy favorable para un catálogo de ocasión con máquinas de hasta 12.400 horas.
- Los precios son todos múltiplos de 5; 35/37 múltiplos de 10 y 25/37 múltiplos de 100. Es una señal débil por separado, pero suma a la uniformidad general.

En resumen: **la prosa no es el principal problema; el problema es que promete una unidad concreta que las fotos no identifican y que la ficha a veces describe mal.**

## 6. Matriz anuncio por anuncio

| # | Anuncio | Nivel | Evidencia principal |
|---:|---|---|---|
| 1 | John Deere 6M 120 | P1 | Tres sesiones; foto con pala ante concesionario DUPUY y otras sin pala. |
| 2 | Kubota M7-152 | P1 | Tres escenas de campo con luz y encuadres promocionales; sin rasgos únicos encadenables. |
| 3 | New Holland T6.180 | P1 | Pala con paca, tractor en campo y apero amarillo en sesiones no relacionadas. |
| 4 | Kubota M5-111 | P1 | Patio, primer plano en interior y concesionario; no se acredita una sola unidad. |
| 5 | Case IH Farmall 75C | P1 | Mismo tipo probable, pero fondos, palas, neumáticos y desgaste no forman cadena. |
| 6 | Belarus 800.1 | P1 | Tres fincas y estados cosméticos diferentes. |
| 7 | Claas Lexion 530 | P0 | Watermark AGRAVIS, cabezal separado y plano “LEXION SPECIAL”; set no homologable. |
| 8 | Case IH Axial-Flow 7150 | P1 | Tres patios/configuraciones; no hay identidad única verificable. |
| 9 | Amazone Primera D9-6000 | P0 | Foto central tipo render/packshot sobre fondo claro; detalle y campo no acreditan el mismo apero. |
| 10 | Horsch Pronto 6 DC | P0 | Fotos fragmentadas y tratamiento textual como cultivador; identidad funcional por reconstruir. |
| 11 | Fella SM 145 L | P1 | Aperos, pátinas y entornos diferentes; una unidad montada y otras desmontadas. |
| 12 | DeLaval VMS 500 | P0 | Material promocional del fabricante, incluido retrato sobre fondo azul. |
| 13 | Kerbl Retro 2200 | P0 | Dos remolques envejecidos y un tercer equipo limpio de geometría distinta. |
| 14 | Caterpillar 320 Next Gen | P1 | Campas con varias excavadoras y planos parciales; imposible aislar la unidad. |
| 15 | Hitachi ZX200-6 | P1 | Tres patios y niveles de desgaste/rotulación diferentes. |
| 16 | Doosan DX140LC | P0 | Interior, trasera y campa con escala/configuración que no acreditan el mismo DX140LC. |
| 17 | JCB JS145 | P1 | Tres excavadoras/campas sin continuidad de daños, rotulación ni entorno. |
| 18 | Hyundai R215-9 | P1 | Fragmentos de cabina/oruga y una campa saturada; no hay reportaje de una unidad. |
| 19 | Caterpillar 950M | P0 | Foto borrosa con marca WAGNER EQUIPMENT CO; cazos y fondos cambiantes. |
| 20 | JCB 411 ZX | P0 | Modelo/tipo/fotos de mixta no concilian; tres campas. |
| 21 | Caterpillar 906 Compact | P0 | Marca ZEPPELIN BAUMASCHINEN e implementos/fondos diferentes. |
| 22 | Bomag BW120 AD-5 | P1 | Las dos primeras podrían estar próximas, pero la tercera parece recorte/stock sobre fondo claro; la ficha además es incompatible a simple vista. |
| 23 | Hamm HD 14 | P1 | Rodillos en tres escenarios, con rotulación y desgaste no encadenados. |
| 24 | Genie GS-2630 | P0 | Tijeras de anchura/configuración y campas diferentes. |
| 25 | Genie S-65 | P0 | Planos de brazo no encadenados y título que lo clasifica como tijera. |
| 26 | Haulotte HA20 LT | P0 | Plataformas sobre oruga de flotas/entornos distintos; modelo y energía no acreditados. |
| 27 | Bosch GBH 5-40 DCE | P0 | Tres packshots de catálogo sobre blanco, dos prácticamente la misma vista. |
| 28 | DeWalt DCS575 | P0 | Dos renders/packshots mezclados con una foto real de otra sesión. |
| 29 | Hilti TE 60-ATC/AVR | P0 | La segunda herramienta, sobre una mesa, es visualmente de otra escala/modelo. |
| 30 | Festool TS 55 F | P0 | Tres composiciones de fabricante casi idénticas; no es el ejemplar usado. |
| 31 | Kipor KDE 20 | P0 | Packshots sobre blanco, una borrosa y otra rotulada KDE20SS3. |
| 32 | Himoinsa HFW-60 | P0 | Un generador blanco y otro rojo rotulado Manain; no acreditan un Himoinsa único. |
| 33 | Honda EU70is | P0 | Material promocional EU70is mezclado con un generador Honda de bastidor abierto distinto. |
| 34 | Husqvarna 560 XP | P0 | Packshot repetido; fotos 2 y 3 perceptualmente idénticas. |
| 35 | Husqvarna 545 | P0 | Paneles y claims comerciales en inglés, no fotos de venta. |
| 36 | Facom 46 piezas | P0 | Tres conjuntos de herramientas no relacionados: premium oscuro, aisladas naranjas y maletín azul/negro. |
| 37 | Mezclador eléctrico + picadora | P0 | Hormigoneras de tambor azul/naranja frente a la descripción de un mezclador de varilla. |

## 7. Riesgos si se deja tal cual

1. **Credibilidad:** basta ampliar dos o tres galerías para detectar watermarks, packshots y cambios de máquina.
2. **Derechos y procedencia:** hay copyright en metadatos, marcas de distribuidores y material de fabricante sin registro de licencia o autorización en el repositorio.
3. **Conversión:** un comprador técnico pedirá cuentahoras, placa, cabina, tren de rodaje y defectos; las galerías actuales no responden a ninguna de esas preguntas.
4. **SEO e indexación de imágenes:** las imágenes duplicadas, genéricas o de terceros aportan poca originalidad y pueden asociar las fichas a los anuncios originales de otros portales.
5. **Datos internos contaminados:** precios, horas y especificaciones de la semilla no deben utilizarse para tasaciones, medianas de mercado ni decisiones comerciales.
6. **Mantenimiento:** la cabecera de `semilla-datos.js` sigue hablando de 36 anuncios cuando `ANUNCIOS.length` es 37, síntoma menor de que el lote ha crecido sin una revisión integral.

## 8. Plan de corrección recomendado

### Fase A — Congelar y descartar correctamente

- Marcar internamente los 37 juegos actuales como **no reutilizables como set**.
- No borrar watermarks ni recortar rótulos para “salvar” imágenes: eso no resuelve procedencia ni identidad.
- No intentar completar un set mezclando nuevas fotos de internet por similitud de modelo.
- Conservar una sola foto únicamente si se acredita modelo exacto, derecho de uso y relación con la unidad que se vaya a documentar; en caso contrario, sustituir también la portada.

### Fase B — Corregir antes el modelo de datos

1. Corregir `comb`/`combustible`, pero no limitarse al renombre.
2. Eliminar defaults comerciales en `specs()`.
3. Omitir campos no aplicables o desconocidos en vez de enviar `"0"`, “Manual”, “Diésel” o pesos inventados por arrastre.
4. Separar requisitos del tractor —potencia mínima, PTO, enganche— de los atributos de un apero.
5. Añadir una validación automática que bloquee combinaciones imposibles: herramienta manual con combustible/tensión, plataforma eléctrica con diésel, motosierra de gasolina con tensión de batería, etc.
6. Verificar variante, años de producción, potencia, peso operativo, transmisión y dimensiones contra documentación oficial o una fuente técnica identificable.

### Fase C — Reconstruir cada anuncio desde un dossier único

Cada anuncio debe nacer de un expediente indivisible:

- identificación exacta de marca, gama, variante y año;
- fuente de la ficha técnica;
- precio y comparación de mercado fechada;
- vendedor y ubicación coherentes;
- un único juego fotográfico con procedencia registrada;
- descripción derivada de ese expediente, no redactada antes que las fotos.

#### Estándar fotográfico mínimo

- 6–10 fotos para maquinaria y 4–8 para herramienta, en vez de imponer siempre 3.
- Misma sesión y lugar; secuencia exterior completa, cabina/mandos, cuentahoras, motor, tren de rodaje o neumáticos, implementos y defectos.
- Las herramientas deben mostrar cuerpo, placa/modelo, desgaste, cable o batería, maletín y accesorios incluidos.
- Nada de packshots, renders, paneles de marketing, capturas con texto, watermarks ni rótulos de otro vendedor.
- Si se cambia un implemento entre fotos, el anuncio debe explicarlo y las demás señas de identidad deben mantenerse visibles.
- Conservar internamente el original y la autorización/fuente; publicar la versión optimizada sin inventar metadatos.

#### Estándar textual mínimo

- Cada número debe coincidir con ficha, título y foto correspondiente.
- No declarar porcentajes, reparaciones ni facturas que no formen parte del dossier.
- No prometer transporte especial gratuito por sistema; especificar quién carga, quién transporta, distancia y si el precio incluye IVA.
- Romper la plantilla única de tres/cuatro párrafos y adaptar el nivel de detalle al tipo de vendedor.
- Sustituir comodines documentales por documentos concretos y aplicables al equipo.
- Corregir los errores técnicos antes que el estilo: redacción más natural no compensa un modelo equivocado.

### Fase D — Puerta de calidad antes de regenerar la semilla

Crear una revisión automática + manual que falle si:

- un anuncio no tiene dossier/fuente de fotos;
- aparecen `Horas de uso: 0` para una unidad usada sin justificación;
- el combustible contradice la energía del producto;
- título, ficha y descripción difieren en año, horas, potencia o variante;
- se detectan duplicados perceptuales dentro de la galería;
- se detectan textos incrustados, fondos de catálogo o imágenes demasiado borrosas;
- la galería carece de cuentahoras/detalles según la familia;
- cambia el color, implemento, rotulación o tipo de máquina sin explicación.

La revisión visual final debe hacerse a tamaño completo, anuncio por anuncio, no solo con miniaturas.

## 9. Conclusión

La semilla cumple una función de cobertura por categorías, pero **no supera una auditoría de unidad física**. El fallo dominante no es estilístico ni puede arreglarse con retoques, recortes o reescrituras superficiales: faltan dossiers fotográficos únicos y sobran imágenes tomadas de contextos comerciales ajenos.

La decisión técnica más limpia es tratar los 37 sets como material de partida descartado, corregir primero el constructor de especificaciones y reconstruir los anuncios uno a uno desde expedientes verificables. Mientras eso no ocurra, cualquier mejora cosmética seguirá dejando contradicciones visibles para un comprador que abra la galería.
