# Reconstrucción profesional de la semilla — 2026-10-26

> Estado: **fase editorial y de coherencia implementada en la fuente**. No se ha
> regenerado SQL ni se ha tocado producción. Las 37 galerías heredadas quedan
> en **cuarentena**: un anuncio no se considera reconstruido al 100 % hasta que
> su texto, ficha y precio se concilien con un dossier fotográfico completo de
> **una sola unidad**.

## Qué se ha corregido

### 1. Vendedor, canal y voz ya no se mezclan

Cada vendedor declara un `perfilVoz` y cada anuncio un `canalVenta`:

| Tipo de vendedor | Canales admitidos | Voz obligatoria |
|---|---|---|
| Particular | `venta-particular` | Dueño que vende su máquina; uso propio, motivo concreto, defectos y prueba donde está la máquina. |
| Taller | `reacondicionado-taller`, `venta-cliente-taller`, `excedente-taller`, `baja-flota-propia` | Reparación/puesta a punto, cliente mantenido por el taller, utillaje excedente o maquinaria de su propio parque. |
| Profesional | `retoma-profesional`, `stock-profesional`, `baja-flota-profesional` | Procedencia, revisión de entrada/salida, documentación, campa e instalaciones; nunca relato familiar en primera persona singular. |

Ejemplos de la corrección:

- El Kubota de la finca familiar queda en **María Laura Benítez,
  particular**, con `venta-particular`.
- La Festool usada para trabajos domésticos pasa también a María Laura; ya no
  la narra un taller especializado en generadores.
- La CAT 320 y la JCB JS145 se explican como máquinas de clientes mantenidas
  por Excava Norte, no como si el taller hubiera sido su dueño de campo.
- Las motosierras pasan a Campo Verde como baja de sus cuadrillas.
- Herramientas de Palmar/Eolo/Albacete se venden como excedentes o
  reacondicionados de taller, con ese motivo explícito.

`src/lib/semilla-calidad.js` bloquea automáticamente:

- «finca de la familia», «mi tractor», «vendo» o «taller del pueblo» bajo una
  empresa;
- «nuestro taller», financiación, catálogo u orden de trabajo bajo un
  particular;
- descripciones que no expresan el canal declarado;
- ciudades de otro vendedor semilla en el texto;
- año u horas distintos entre título y ficha;
- ITP como comodín, urgencias comerciales y afirmaciones «visibles en foto».

### 2. Fichas sin relleno

Se eliminaron los defaults de `specs()`:

- ya no existe `Combustible: Diésel` por defecto;
- se respeta el alias histórico `comb`;
- un dato desconocido o inaplicable se omite;
- `0` horas no se usa como hueco;
- aperos y equipos ganaderos dejan de tener combustible, transmisión o CV
  inventados;
- herramienta manual deja de heredar tensión, batería y motor;
- las plataformas conservan sus campos eléctricos aunque pertenezcan a obra;
- se admiten campos específicos contrastables —ancho de trabajo, capacidad,
  cesta, cilindrada o largo de espada— mediante `extra`.

Distribución resultante de combustible: 22 Diésel, 4 Eléctrico, 3 Gasolina,
2 Batería y 6 correctamente omitidos. Antes: 37/37 Diésel.

### 3. Identidades corregidas

Entre otras:

- Claas Lexion 530: de un imposible 2019 a unidad veterana de 2008.
- Case IH 7150 de 2017: sustituido conceptualmente por una 7140 de 2016.
- Amazone Primera DMC: sembradora arrastrada de 6 m, sin horas de motor.
- Horsch Pronto 6 DC: sembradora, no «cultivador».
- Fella: segadora de discos SM 208 InLine, no trituradora de martillos.
- JCB 411: cargadora de ruedas, no retroexcavadora.
- Bomag BW 120 AD-5: 33 CV/2.700 kg, no 150 CV/12 t.
- Hamm HD 14 VV: 47 CV/4.345 kg, no 190 CV/17 t.
- Genie S-65: telescópica diésel, no tijera.
- Haulotte: taxonomía y anuncio pasan a HA20 RTJ.
- Equipo ganadero: se retira el «Kerbl Retro 2200» y se redefine como carro
  mezclador Kuhn Euromix I 870.
- El supuesto mezclador Facom pasa a un Einhell TC-MX 1400-2 E en
  Herramienta eléctrica.

Catálogo relacionado:

- Kuhn puede aparecer también en Ganadería (alimentación animal).
- La nota de Genie GS-2630 deja de llamarla «articulada».
- `Haulotte HA20 LT` se sustituye como valor canónico por `HA20 RTJ`.

## Decisiones aún abiertas antes de cerrar anuncios

Doce referencias llevan `decision: 'corregir-modelo'`. El generador las trata
como bloqueo porque el dossier concreto puede obligar a cambiar variante,
año, horas relevantes o precio:

| Ref | Qué falta cerrar |
|---|---|
| SEM-007 | Horas motor/trilla, cabezal exacto y comparables de precio para la Lexion 530. |
| SEM-008 | Variante 7140, horas de separador, cabezal y precio de mercado. |
| SEM-009 | Configuración exacta de Primera DMC 6000-2C, tolva y tractor requerido. |
| SEM-011 | Año/generación y estado de barras de la Fella SM 208. |
| SEM-012 | Inventario medible de componentes y dimensiones de la sala DeLaval. |
| SEM-015 | Denominación regional exacta de la Hitachi ZX200/ZX210. |
| SEM-018 | Año y generación exactos de la Hyundai R215-9. |
| SEM-024 | GS-2630 frente a GS-2632 y capacidad/altura de la unidad. |
| SEM-026 | Año, motor y peso exactos de la Haulotte HA20 RTJ. |
| SEM-031 | Potencia prime/standby y configuración del Kipor KDE20SS3. |
| SEM-032 | Motor, salida y equipamiento exactos del Himoinsa HFW-60. |
| SEM-036 | Referencia Facom, conteo real y contenido pieza a pieza. |

## Fotos: estándar para salir de cuarentena

El manifiesto `docs/SEMILLA-FOTOS-CUARENTENA-2026-10-26.csv` enumera las 37
referencias y las vistas mínimas por tipo. Una galería solo puede pasar a
`estadoFotos: 'verificado'` si:

1. todas las imágenes pertenecen a la misma unidad y sesión compatible;
2. coinciden modelo, configuración, implementos, ruedas/orugas, desgaste,
   daños y accesorios con título, ficha y descripción;
3. incluye las vistas de identidad y desgaste del CSV —no solo 3 exteriores—;
4. procede de originales autorizados y con procedencia registrada;
5. no es IA, render, packshot, foto promocional, collage ni material con
   marcas/logos de otro vendedor;
6. cuentahoras y defectos mencionados están realmente respaldados.

El número de serie completo debe conservarse en el expediente interno, no
necesariamente publicarse íntegro. Si el dossier no coincide con el texto de
objetivo, se adapta el anuncio a la unidad fotografiada; no se fuerza la
unidad a encajar en el texto.

### Resultado de la búsqueda en fuentes abiertas

La búsqueda posterior en Wikimedia Commons, Openverse/Flickr, Geograph,
Internet Archive, GSA Auctions y el pool heredado no produjo ningún dossier
aprobable: predominan unidades nuevas o de feria, máquinas trabajando para
terceros, contextos extranjeros, fotos sueltas y series sin cabina,
cuentahoras ni desgaste. La única serie de una unidad con licencia abierta
que queda condicionada es la Festool TS 55 EBQ de SEM-030, pero exigiría
reescribir el anuncio, recuperar el original 2 y crear la atribución pública;
no se ha integrado.

El detalle está en `docs/SEMILLA-FOTOS-CANDIDATAS-2026-10-26.csv` y el brief
para licenciar o encargar los dossiers en
`docs/SEMILLA-FOTOS-BRIEF-ENCARGO-2026-10-26.md`. Para el piloto ya hay tres
leads comerciales concretos —SEM-001, SEM-017 y SEM-030— con mensajes listos
en `docs/SEMILLA-FOTOS-CONTACTOS-PILOTO-2026-10-26.md`, pero ninguno tiene
todavía licencia ni originales. La importación queda
mecanizada en `scripts/importar-dossiers-fotos.js`: registra procedencia,
licencia, revisión visual, vistas y SHA-256 en
`src/lib/semilla-dossiers.json`, y `analizarDossierFotos()` impide declarar
«verificado» un set sin expediente completo.

## Protección contra regresiones

- `tests/unit/semilla-datos-calidad.test.ts` valida las 37 referencias, voces,
  canales, ausencia de defaults, cuarentena fotográfica y el expediente
  mínimo que exige un dossier verificado.
- `scripts/generar-sql-semilla.js` valida ya `taller`, no el legado
  `camperizador`.
- El generador exige fotos verificadas y cero decisiones pendientes.
- Se niega a sobrescribir por defecto la migración aplicada
  `202610240002_seed_anuncios_maquinaria.sql`.
- Los nuevos UUID se derivan de la `ref` estable, no del título. Por eso el
  despliegue futuro debe mapear/retirar la v1; ejecutar una inserción sin ese
  plan duplicaría anuncios semilla.

## Siguiente puerta de despliegue

1. Obtener y aprobar un dossier por referencia conforme al CSV.
2. Conciliar contra ese dossier modelo, año, horas, defectos, accesorios,
   precio y ciudad.
3. Cambiar una a una `decision` a `mantener` y `estadoFotos` a `verificado`.
4. Crear una migración nueva de sustitución de la semilla v1 y verificar en
   staging conteos, sitemap, landings ≥3 y ausencia de duplicados.
5. Solo entonces aplicar a producción.

**No** se ha aplicado ninguna parte de esta fase a Supabase ni a Vercel.
