// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE LA SEMILLA — módulo compartido (sin dependencias de Node)
// ───────────────────────────────────────────────────────────────────────────
// Única fuente de verdad de los 37 anuncios de demostración de maquinaria.
// Lo consumen:
//   · scripts/generar-sql-semilla.js  → genera la migración SQL idempotente
//                                        (supabase/migrations/*_seed_*.sql)
//   · rutas admin de siembra locales  → siembra desde el navegador
// ES CommonJS a propósito (module.exports) para que el script de Node pueda
// hacer require() y Next.js lo importe sin configuración extra.
//
// Reglas de la semilla (Fase 5):
//   · Todo se marca `es_demo`: no se indexa, no expone contacto y nunca
//     muestra sello de verificado.
//   · Sin teléfonos inventados (pertenecerían a personas reales).
//   · Claves de `especificaciones` = etiquetas EXACTAS del formulario
//     (src/lib/categorias.ts → camposTransversales + campos por familia),
//     que son las que leen los filtros del catálogo y las columnas
//     generadas `espec_anio` / `espec_horas`.
//   · `marca` = valor canónico de MARCAS_MODELOS (src/lib/marcas.ts).
//   · `subcategoria` = label de la sub (así lo guarda /publicar).
// ═══════════════════════════════════════════════════════════════════════════

// ── Utilidades ──────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** ISO de "hace X horas" (fechas de publicación recientes y escalonadas). */
function haceHoras(h) {
  return new Date(Date.now() - h * 36e5).toISOString()
}
/** ISO de "dentro de X días" (destacados y reservas futuras). */
function dentroDias(d) {
  return new Date(Date.now() + d * 864e5).toISOString()
}

/**
 * Construye el bloque `especificaciones` con claves compatibles con el
 * formulario y los filtros (src/lib/categorias.ts y filtros-tecnicos.ts).
 *
 * Regla editorial de la reconstrucción 2026-10: NO hay valores comerciales
 * por defecto. Un dato desconocido o inaplicable se omite; nunca se rellena
 * con Diésel, Manual, documentación completa o `0` horas para que la ficha
 * parezca completa. `extra` permite campos específicos ya contemplados por
 * la taxonomía (Tipo, ancho de trabajo, capacidad de cesta, etc.).
 */
function specs(s) {
  const out = {}
  const set = (clave, valor) => {
    if (valor === undefined || valor === null || valor === '') return
    // `0` se reservaría para una unidad nueva documentada; en ocasión suele
    // ser un hueco disfrazado de dato y la UI lo mostraría como real.
    if ((clave === 'Horas de uso' || clave === 'Potencia (CV)') && Number(valor) === 0) return
    out[clave] = String(valor)
  }

  set('Año', s.anio)
  set('Horas de uso', s.horas)
  // Se acepta el alias histórico `comb`, pero ya no existe fallback a Diésel.
  set('Combustible', s.combustible ?? s.comb)
  set('Potencia (CV)', s.cv)
  set('Peso (kg)', s.peso)
  set('¿Incluye transporte?', s.transporte)
  set('Documentación', s.docs)

  if (s.familia === 'agricola') {
    set('Tracción', s.traccion)
    set('Enganche', s.enganche)
    set('Toma de fuerza (PTO)', s.pto)
    set('Transmisión', s.transmision)
  } else if (s.familia === 'obra') {
    set('Tracción', s.traccion)
    set('Medidas de transporte', s.medidas)
    // Las plataformas pueden necesitar estos campos aunque no sean de la
    // familia herramientas; antes el constructor los descartaba en silencio.
    set('Potencia (W)', s.potenciaW)
    set('Tensión', s.tension)
    set('Batería incluida', s.bateria)
  } else if (s.familia === 'herramientas') {
    set('Potencia (W)', s.potenciaW)
    set('Tensión', s.tension)
    set('Batería incluida', s.bateria)
  }

  for (const [clave, valor] of Object.entries(s.extra || {})) set(clave, valor)
  return out
}

// ── Vendedores (10) ────────────────────────────────────────────────────────
// Tipo: `particular` (dueño de la máquina), `taller` = etiqueta
// «Taller» en la UI (reparación/venta de maquinaria), `profesional` =
// concesionario o distribuidor. Sin teléfono: la semilla nunca expone
// contactos (migración 202609180003).
const VENDEDORES = [
  { slug: 'agrodeal-castilla', perfilVoz: 'profesional-agricola', nombre: 'AgroDeal Castilla', estado: 'Castilla y León', ciudad: 'Valladolid', telefono: null, verificado: false, tipo: 'profesional' },
  { slug: 'taller-el-palmar', perfilVoz: 'taller-agricola', nombre: 'Talleres El Palmar', estado: 'Andalucía', ciudad: 'Sevilla', telefono: null, verificado: false, tipo: 'taller' },
  { slug: 'grupo-ibermaq', perfilVoz: 'profesional-obra', nombre: 'Grupo Ibermaq', estado: 'Cataluña', ciudad: 'Barcelona', telefono: null, verificado: false, tipo: 'profesional' },
  { slug: 'campo-verde-servicios', perfilVoz: 'servicios-agricolas-con-taller', nombre: 'Campo Verde Servicios', estado: 'Murcia', ciudad: 'Murcia', telefono: null, verificado: false, tipo: 'taller' },
  { slug: 'excava-norte', perfilVoz: 'taller-obra', nombre: 'Excava Norte', estado: 'País Vasco', ciudad: 'Vizcaya', telefono: null, verificado: false, tipo: 'taller' },
  { slug: 'levante-obra', perfilVoz: 'profesional-obra', nombre: 'Levante Obra y Maquinaria', estado: 'Comunitat Valenciana', ciudad: 'Alicante', telefono: null, verificado: false, tipo: 'profesional' },
  { slug: 'taller-maquinaria-albacete', perfilVoz: 'taller-multimarca', nombre: 'Taller Maquinaria Albacete', estado: 'Castilla-La Mancha', ciudad: 'Albacete', telefono: null, verificado: false, tipo: 'taller' },
  { slug: 'eolo-generadores', perfilVoz: 'taller-motores-y-herramienta', nombre: 'Eolo Generadores y Motores', estado: 'Aragón', ciudad: 'Zaragoza', telefono: null, verificado: false, tipo: 'taller' },
  { slug: 'maria-laura-benitez', perfilVoz: 'particular-agricola', nombre: 'María Laura Benítez', estado: 'Comunitat Valenciana', ciudad: 'Valencia', telefono: null, verificado: false, tipo: 'particular' },
  { slug: 'juan-ramon-estevez', perfilVoz: 'particular-ganadero', nombre: 'Juan Ramón Estévez', estado: 'Galicia', ciudad: 'Lugo', telefono: null, verificado: false, tipo: 'particular' },
]
const emailVendedor = v => `semilla+${v.slug}@maquinaria.click`

// ── Los 37 anuncios ────────────────────────────────────────────────────────
// fotos: rutas relativas a /public (la PRIMERA es la portada).
// creado: horas hacia atrás desde ahora mismo.
// cat: clave de familia/categoría (agricola | obra | herramientas) → categoria_id.
// sub: label EXACTA de la subcategoría (columna productos.subcategoria).
// ref/canalVenta/estadoFotos/decision: trazabilidad editorial interna (no
// son columnas). Mientras estadoFotos sea «cuarentena», las rutas heredadas
// no están aprobadas como dossier de una sola unidad y el generador se niega
// a emitir SQL; ver docs/RECONSTRUCCION-SEMILLA-2026-10-26.md.

const ANUNCIOS = [
  // ──────────────────────── AGRÍCOLA · Tractores ────────────────────────
  {
    ref: 'SEM-001', canalVenta: 'retoma-profesional',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'agrodeal-castilla',
    cat: 'agricola', sub: 'Tractores',
    marca: 'John Deere 6M', modelo: '6120M',
    titulo: 'John Deere 6120M · 2019 · 4.180 h',
    precio: 52900, estado: 'Bueno', creado: 26 * 24, visitas: 512,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/jd-6m-120-1.webp','/images/anuncios/jd-6m-120-2.webp','/images/anuncios/jd-6m-120-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2019, horas: 4180, combustible: 'Diésel', cv: 120, peso: 5680, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: '4x4', enganche: 'Tres puntos', pto: '540/1000 rpm' }),
    descripcion: 'Unidad procedente de retoma de una explotación de cereal de la provincia. está en nuestra campa de Valladolid con 4.180 h marcadas y configuración 6120M de 120 CV, doble tracción y toma de fuerza 540/1000.\n\nEn la revisión de entrada se comprobó arranque, cambio, hidráulico y climatización.\n\nEl último mantenimiento consta a las 4.000 h. Presenta el desgaste normal de cabina y neumáticos para sus horas; no se entrega con pala frontal.\n\nLa documentación se revisa con el comprador antes de cerrar la operación. El transporte no está incluido, pero cargamos sobre el camión que se contrate.',
  },
  {
    ref: 'SEM-002', canalVenta: 'retoma-profesional',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'agrodeal-castilla',
    cat: 'agricola', sub: 'Tractores',
    marca: 'Kubota M7', modelo: 'M7',
    titulo: 'Kubota M7152 Premium KVT · 2021 · 3.050 h',
    precio: 74500, estado: 'Bueno', creado: 9 * 24 + 4, visitas: 641,
    boosteado: true, verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/kubota-m7-152-1.webp','/images/anuncios/kubota-m7-152-2.webp','/images/anuncios/kubota-m7-152-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2021, horas: 3050, combustible: 'Diésel', cv: 152, peso: 6800, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: '4x4', enganche: 'Tres puntos', pto: '540/1000 rpm', transmision: 'CVT / variable' }),
    descripcion: 'Kubota M7152 Premium KVT entrado por retoma al renovar el cliente su tractor principal. Es una unidad 4x4 con transmisión variable, climatización y 3.050 h.\n\nSe ha comprobado el funcionamiento de la transmisión, la elevación trasera y los distribuidores. Carrocería e interior están cuidados para ser un tractor de trabajo; el mantenimiento de motor e hidráulico se entregó hecho antes de ponerlo a la venta.\n\nSe puede revisar en Valladolid con cita. El transporte se presupuesta aparte según destino.',
  },
  {
    ref: 'SEM-003', canalVenta: 'baja-flota-propia',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'campo-verde-servicios',
    cat: 'agricola', sub: 'Tractores',
    marca: 'New Holland T6', modelo: 'T6',
    titulo: 'New Holland T6.180 Electro Command · 2017 · 6.420 h',
    precio: 43900, estado: 'Bueno', creado: 61 * 24 + 7, visitas: 387,
    fotos: ['/images/anuncios/nh-t6-180-1.webp','/images/anuncios/nh-t6-180-2.webp','/images/anuncios/nh-t6-180-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2017, horas: 6420, combustible: 'Diésel', cv: 145, peso: 7100, transporte: 'No', docs: 'Parcial', traccion: '4x4', enganche: 'Tres puntos', pto: '540/1000 rpm' }),
    descripcion: 'Tractor de baja de nuestra flota de servicios agrícolas. Ha trabajado en transporte interno y labores con aperos en la Región de Murcia; suma 6.420 h y monta cambio Electro Command.\n\nEl motor arranca bien en frío y el cambio entra sin tirones. Tiene marcas de uso en carrocería y el historial no está completo: conservamos facturas de los trabajos hechos en nuestro taller, pero no de toda la vida útil.\n\nSe entrega con manuales y dos llaves. Recogida en Murcia; podemos ayudar con la carga.',
  },
  {
    ref: 'SEM-004', canalVenta: 'venta-particular',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'maria-laura-benitez',
    cat: 'agricola', sub: 'Tractores',
    marca: 'Kubota M5', modelo: 'M5',
    titulo: 'Kubota M5-111 · 2016 · 5.870 h',
    precio: 28750, estado: 'Bueno', creado: 140, visitas: 208,
    fotos: ['/images/anuncios/kubota-m5-111-1.webp','/images/anuncios/kubota-m5-111-2.webp','/images/anuncios/kubota-m5-111-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2016, horas: 5870, combustible: 'Diésel', cv: 106, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: '4x4', enganche: 'Tres puntos', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Vendo el Kubota que hemos usado en la finca de cítricos familiar. Tiene 5.870 h y ha hecho sobre todo trabajos con remolque, arado ligero y movimientos dentro de la explotación.\n\nEl mantenimiento se lo hacía el taller del pueblo y guardo las facturas desde 2019. Aceite y filtros están cambiados hace unas 120 h. La cabina no lleva aire acondicionado, que es lo que más se echa en falta en verano.\n\nLo vendo por cambio de organización de la finca. Se puede ver cerca de Valencia y probarlo en la parcela. La recogida corre a cargo del comprador.',
  },
  {
    ref: 'SEM-005', canalVenta: 'reacondicionado-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'taller-el-palmar',
    cat: 'agricola', sub: 'Tractores',
    marca: 'Case IH Farmall', modelo: 'Farmall',
    titulo: 'Case IH Farmall 75C · 2014 · 7.240 h',
    precio: 21900, estado: 'Usado', creado: 300, visitas: 344,
    fotos: ['/images/anuncios/farmall-75c-1.webp','/images/anuncios/farmall-75c-2.webp','/images/anuncios/farmall-75c-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2014, horas: 7240, combustible: 'Diésel', cv: 75, peso: 3330, transporte: 'No', docs: 'Parcial', traccion: '4x4', enganche: 'Tres puntos', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Farmall 75C entrado en taller para puesta a punto antes de la venta. Marca 7.240 h y su estado corresponde a un tractor de trabajo, no a una unidad de exposición.\n\nEn la orden de trabajo consta embrague, bomba de agua y junta de culata sustituidos, además de la revisión de motor. La cabina es sencilla, con calefacción y sin aire acondicionado.\n\nLa documentación es parcial porque falta la factura original de compra. Se puede probar en Sevilla y revisar la factura de la reparación antes de decidir.',
  },
  {
    ref: 'SEM-006', canalVenta: 'venta-particular',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'juan-ramon-estevez',
    cat: 'agricola', sub: 'Tractores',
    marca: 'Belarus 800.1', modelo: '800.1',
    titulo: 'Belarus 800.1 · 2015 · 4.600 h',
    precio: 14800, estado: 'Bueno', creado: 480, visitas: 176,
    fotos: ['/images/anuncios/belarus-800-1-1.webp','/images/anuncios/belarus-800-1-2.webp','/images/anuncios/belarus-800-1-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2015, horas: 4600, combustible: 'Diésel', cv: 81, peso: 3400, transporte: 'No', docs: 'Declaración CE / ficha técnica', traccion: '4x2', enganche: 'Tres puntos', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Vendo el Belarus que he usado en los prados de casa para segar, henificar y mover remolques cortos. Marca 4.600 h y es un tractor mecánico sencillo, de los que se pueden mantener sin electrónica. Arranca bien en invierno y no le conozco fugas importantes. Los neumáticos traseros se pusieron el año pasado. La pintura tiene años y hay óxido superficial en estribos y zonas bajas.\n\nLo cambio por un tractor con pala para cargar pacas. Está en Lugo; si viene un transportista, ayudo a subirlo.',
  },

  // ──────────────────────── AGRÍCOLA · Cosechadoras ────────────────────────
  {
    ref: 'SEM-007', canalVenta: 'retoma-profesional',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'agrodeal-castilla',
    cat: 'agricola', sub: 'Cosechadoras',
    marca: 'Claas Lexion', modelo: 'Lexion',
    titulo: 'Claas Lexion 530 · 2008 · 1.890 h de trilla',
    precio: 74500, estado: 'Usado', creado: 40 * 24, visitas: 702,
    boosteado: true, verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/lexion-530-1.webp','/images/anuncios/lexion-530-2.webp','/images/anuncios/lexion-530-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2008, horas: 1890, combustible: 'Diésel', cv: 286, peso: 13500, transporte: 'No', docs: 'Parcial', extra: { Tipo: 'Cosechadora', 'Ancho de corte (m)': '5,4' } }),
    descripcion: 'Cosechadora procedente de retoma de una explotación cerealista. Es una Lexion 530 de 2008 con 1.890 h de trilla declaradas y cabezal de cereal; corresponde a una máquina de campaña veterana y se ofrece en ese estado.\n\nAntes de anunciarla se comprobó arranque, avance, descarga y accionamiento del cabezal. El comprador debería revisar correas, cadenas, cóncavos y elementos de desgaste propios de su edad.\n\nSe encuentra en campa en Valladolid. La carga sobre góndola la organizamos en nuestras instalaciones; el transporte es por cuenta del comprador.',
  },
  {
    ref: 'SEM-008', canalVenta: 'baja-flota-propia',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'campo-verde-servicios',
    cat: 'agricola', sub: 'Cosechadoras',
    marca: 'Case IH Axial-Flow', modelo: 'Axial-Flow',
    titulo: 'Case IH Axial-Flow 7140 · 2016 · 2.450 h',
    precio: 96500, estado: 'Bueno', creado: 210, visitas: 456,
    fotos: ['/images/anuncios/af-7150-1.webp','/images/anuncios/af-7150-2.webp','/images/anuncios/af-7150-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2016, horas: 2450, combustible: 'Diésel', cv: 375, peso: 16200, transporte: 'No', docs: 'Parcial', extra: { Tipo: 'Cosechadora' } }),
    descripcion: 'Cosechadora de baja de nuestra flota de servicios de recolección. Es una Axial-Flow 7140 de 2016 con 2.450 h de motor y cabezal de cereal incluido.\n\nHa cerrado campañas de trigo y cebada en la Región de Murcia. Motor e hidrostática trabajan con normalidad y la cabina conserva el aire acondicionado operativo. El historial disponible es parcial, con facturas de las últimas campañas.\n\nSe puede arrancar y accionar en Murcia. La revisión de campaña posterior a la compra corre a cargo del comprador; la carga sobre góndola se coordina antes de la recogida.',
  },

  // ──────────────────────── AGRÍCOLA · Maquinaria agrícola ────────────────────────
  {
    ref: 'SEM-009', canalVenta: 'stock-profesional',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'agrodeal-castilla',
    cat: 'agricola', sub: 'Maquinaria agrícola',
    marca: 'Amazone', modelo: 'Primera DMC',
    titulo: 'Sembradora Amazone Primera DMC 6000-2C · 6 m',
    precio: 38900, estado: 'Bueno', creado: 160, visitas: 231,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/amazone-d9-1.webp','/images/anuncios/amazone-d9-2.webp','/images/anuncios/amazone-d9-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2018, peso: 8559, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Sin tracción', enganche: 'Barra de tracción', pto: 'Sin PTO', extra: { Tipo: 'Sembradora', 'Ancho de trabajo (m)': '6', 'Capacidad de tolva (l)': '4200', 'Potencia mínima del tractor (CV)': '180' } }),
    descripcion: 'Sembradora neumática Amazone Primera DMC 6000-2C de 6 m en stock en Valladolid. Es una máquina arrastrada para siembra directa, mulch o convencional, con tolva de gran capacidad y rejas de cincel.\n\nSe revisó el plegado, la turbina y el estado general de tubos y dosificadores al entrar en campa. Los elementos de desgaste deben valorarse en visita, como en cualquier sembradora de campaña usada.\n\nRequiere tractor de alta potencia y conexión hidráulica adecuada. Se carga sobre camión del comprador.',
  },
  {
    ref: 'SEM-010', canalVenta: 'baja-flota-propia',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'campo-verde-servicios',
    cat: 'agricola', sub: 'Maquinaria agrícola',
    marca: 'Horsch', modelo: 'Pronto',
    titulo: 'Sembradora Horsch Pronto 6 DC · 6 m',
    precio: 31800, estado: 'Bueno', creado: 500, visitas: 268,
    fotos: ['/images/anuncios/horsch-pronto-6-1.webp','/images/anuncios/horsch-pronto-6-2.webp','/images/anuncios/horsch-pronto-6-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2017, peso: 6470, transporte: 'No', docs: 'Parcial', traccion: 'Sin tracción', enganche: 'Barra de tracción', pto: 'Sin PTO', extra: { Tipo: 'Sembradora', 'Ancho de trabajo (m)': '6', 'Capacidad de tolva (l)': '3500' } }),
    descripcion: 'Sembradora Horsch Pronto 6 DC de baja de nuestros servicios de siembra. La hemos utilizado en cereal con tractor de alta potencia y queda parada tras pasar a un equipo de mayor ancho.\n\nConserva los discos con vida útil, pero conviene revisar rodamientos, tubos y ruedas de presión antes de campaña. El bastidor no presenta reparaciones visibles y se entrega engrasada.\n\nEstá en Murcia. Podemos cargarla; el transporte y los permisos de circulación los organiza el comprador.',
  },
  {
    ref: 'SEM-011', canalVenta: 'reacondicionado-taller',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'taller-el-palmar',
    cat: 'agricola', sub: 'Maquinaria agrícola',
    marca: 'Fella', modelo: 'SM 208 InLine',
    titulo: 'Segadora de discos Fella SM 208 InLine · 2,06 m',
    precio: 3950, estado: 'Bueno', creado: 700, visitas: 143,
    fotos: ['/images/anuncios/fella-sm-145-1.webp','/images/anuncios/fella-sm-145-2.webp','/images/anuncios/fella-sm-145-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2015, peso: 407, transporte: 'No', docs: 'Sin documentación', traccion: 'Sin tracción', enganche: 'Tres puntos', pto: '540 rpm', extra: { Tipo: 'Segadora', 'Ancho de trabajo (m)': '2,06', 'Potencia mínima del tractor (CV)': '41' } }),
    descripcion: 'Segadora de discos Fella SM 208 InLine puesta a punto en taller. Tiene 2,06 m de ancho de trabajo, cinco discos y acople a tres puntos con PTO de 540 rpm.\n\nSe han revisado la barra, las protecciones y los rodamientos, y se entrega probada a la toma de fuerza. La pintura ha sido retocada en zonas de roce, sin ocultar el uso propio de una segadora de segunda mano.\n\nNo se conserva documentación de compra. Se puede recoger en Sevilla o cargar sobre remolque.',
  },

  // ──────────────────────── AGRÍCOLA · Ganadería ────────────────────────
  {
    ref: 'SEM-012', canalVenta: 'venta-particular',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'juan-ramon-estevez',
    cat: 'agricola', sub: 'Ganadería',
    marca: 'DeLaval', modelo: 'HB50',
    titulo: 'Sala de ordeño DeLaval HB50 2×6 · desmontada',
    precio: 18400, estado: 'Bueno', creado: 340, visitas: 197,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/delaval-vms-1.webp','/images/anuncios/delaval-vms-2.webp','/images/anuncios/delaval-vms-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2013, transporte: 'No', docs: 'Parcial', extra: { Tipo: 'Ordenadora', 'Número de puestos': '12' } }),
    descripcion: 'Vendo la sala de ordeño que teníamos instalada en la explotación lechera de casa. Es una DeLaval en espina 2×6 y se desmontó al cambiar el sistema de ordeño.\n\nQuedan la estructura, juegos de ordeño, pulsación, línea de leche y equipo de vacío que se retiraron de la instalación. Al estar desmontada, conviene venir a revisar el lote completo y comprobar qué consumibles habría que renovar antes de montarla.\n\nestá guardada bajo cubierta en Lugo. No incluyo transporte ni montaje.',
  },
  {
    ref: 'SEM-013', canalVenta: 'venta-particular',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'juan-ramon-estevez',
    cat: 'agricola', sub: 'Ganadería',
    marca: 'Kuhn', modelo: 'Euromix I 870',
    titulo: 'Carro mezclador Kuhn Euromix I 870 · 8 m³',
    precio: 16900, estado: 'Bueno', creado: 620, visitas: 121,
    fotos: ['/images/anuncios/kerbl-retro-2200-1.webp','/images/anuncios/kerbl-retro-2200-2.webp','/images/anuncios/kerbl-retro-2200-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2019, peso: 2970, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Sin tracción', enganche: 'Barra de tracción', pto: '540 rpm', extra: { 'Capacidad de cuba (m³)': '8', 'Potencia mínima del tractor (CV)': '52' } }),
    descripcion: 'Vendo el carro mezclador que he usado en la explotación para preparar la ración del ganado. Es un Kuhn Euromix I 870 de 8 m³ con sinfín vertical, descarga lateral y PTO de 540 rpm.\n\nLo cambio por uno de mayor capacidad. El sinfín y la cuba tienen el desgaste normal del trabajo diario; los neumáticos y la lanza están correctos para seguir trabajando. Se puede enganchar y probar en la finca.\n\nEstá en Lugo y se entrega limpio. La recogida corre a cargo del comprador.',
  },

  // ──────────────────────── OBRA · Excavadoras ────────────────────────
  {
    ref: 'SEM-014', canalVenta: 'venta-cliente-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'excava-norte',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'Caterpillar 320', modelo: '320',
    titulo: 'Caterpillar 320 Next Gen · 2019 · 9.800 h',
    precio: 89500, estado: 'Usado', creado: 20 * 24, visitas: 810,
    boosteado: true, verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/cat-320-1.webp','/images/anuncios/cat-320-2.webp','/images/anuncios/cat-320-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2019, horas: 9800, combustible: 'Diésel', cv: 174, peso: 23200, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'Excavadora de un cliente mantenida por Excava Norte durante los últimos años. Es una CAT 320 Next Gen de 2019 con 9.800 h, cámara trasera y líneas auxiliares.\n\nConsta una revisión de bomba principal en su historial de taller. Antes de la venta se comprobaron presiones, giro, avance y ausencia de fugas importantes en cilindros. El tren de rodaje está usado en consonancia con las horas.\n\nSe puede probar en nave en Vizcaya. El transporte especial se cotiza aparte.',
  },
  {
    ref: 'SEM-015', canalVenta: 'baja-flota-profesional',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'levante-obra',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'Hitachi ZX200', modelo: 'ZX200',
    titulo: 'Hitachi ZX200-6 · 2017 · 12.400 h',
    precio: 61500, estado: 'Usado', creado: 70 * 24, visitas: 597,
    fotos: ['/images/anuncios/zx200-6-1.webp','/images/anuncios/zx200-6-2.webp','/images/anuncios/zx200-6-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2017, horas: 12400, combustible: 'Diésel', cv: 151, peso: 20300, transporte: 'No', docs: 'Parcial', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'Excavadora procedente de la baja de una flota de obra civil. ZX200-6 de 2017 con 12.400 h, orientada a quien busca una 20 t ya amortizada para seguir trabajando.\n\nSe entrega con el servicio de motor reciente y funcionamiento comprobado. Presenta una rezuma en un latiguillo del balancín que se descuenta del precio si el comprador prefiere repararla por su cuenta.\n\nDocumentación parcial desde 2021. Está en Alicante y se puede probar con cita.',
  },
  {
    ref: 'SEM-016', canalVenta: 'stock-profesional',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'Doosan DX140', modelo: 'DX140',
    titulo: 'Doosan DX140LC-5 · 2020 · 7.650 h',
    precio: 54900, estado: 'Bueno', creado: 34 * 24, visitas: 486,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/dx140lc-1.webp','/images/anuncios/dx140lc-2.webp','/images/anuncios/dx140lc-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2020, horas: 7650, combustible: 'Diésel', cv: 115, peso: 14600, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'Doosan DX140LC-5 de 2020 en stock en Barcelona. Máquina de 14 t con 7.650 h, cabina climatizada y cámara trasera. A la entrada se revisaron niveles, presiones hidráulicas y holguras principales. Tiene retoques en el contrapeso y el desgaste normal de una excavadora que ha trabajado en movimiento de tierras.\n\nSe emite factura de empresa. Transporte no incluido; carga en nuestras instalaciones.',
  },
  {
    ref: 'SEM-017', canalVenta: 'venta-cliente-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'excava-norte',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'JCB JS145', modelo: 'JS145',
    titulo: 'JCB JS145 · 2015 · 10.200 h',
    precio: 42900, estado: 'Usado', creado: 420, visitas: 372,
    fotos: ['/images/anuncios/js145-1.webp','/images/anuncios/js145-2.webp','/images/anuncios/js145-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2015, horas: 10200, combustible: 'Diésel', cv: 109, peso: 15400, transporte: 'No', docs: 'Parcial', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'JCB JS145 de un cliente al que venimos manteniendo la máquina en el taller. Suma 10.200 h y se ofrece como excavadora de trabajo, con precio ajustado a su estado y documentación.\n\nEl motor funciona sin humo anómalo. Hay una reparación antigua soldada en el cilindro de balancín y el tren de rodaje necesitará inversión a medio plazo. Es importante probarla y revisar holguras antes de cerrar la compra.\n\nNo se conserva la factura original de compra. Se formaliza con la documentación disponible y se prueba en Vizcaya.',
  },
  {
    ref: 'SEM-018', canalVenta: 'baja-flota-profesional',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'Hyundai R215', modelo: 'R215',
    titulo: 'Hyundai R215-9 · 2019 · 6.900 h',
    precio: 67800, estado: 'Bueno', creado: 110, visitas: 418,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/r215-9-1.webp','/images/anuncios/r215-9-2.webp','/images/anuncios/r215-9-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2019, horas: 6900, combustible: 'Diésel', cv: 155, peso: 21400, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'Hyundai R215-9 procedente de baja de flota de alquiler. Unidad de 2019 con 6.900 h, climatización y cámara trasera.\n\nSale con el mantenimiento de 1.000 h realizado y presiones comprobadas. Por procedencia de flota puede presentar marcas en chapa y cabina, aunque el conjunto mecánico se ha revisado antes de ponerla en venta.\n\nGrupo Ibermaq ofrece seis meses de garantía comercial limitada a bomba principal y motores de traslación, con condiciones por escrito. Está en Barcelona.',
  },

  // ──────────────────────── OBRA · Cargadoras ────────────────────────
  {
    ref: 'SEM-019', canalVenta: 'baja-flota-profesional',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'levante-obra',
    cat: 'obra', sub: 'Cargadoras',
    marca: 'Caterpillar 950', modelo: '950',
    titulo: 'Caterpillar 950M · 2018 · 6.300 h',
    precio: 78900, estado: 'Bueno', creado: 55 * 24, visitas: 523,
    fotos: ['/images/anuncios/cat-950m-1.webp','/images/anuncios/cat-950m-2.webp','/images/anuncios/cat-950m-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2018, horas: 6300, combustible: 'Diésel', cv: 232, peso: 19213, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Ruedas 4x4', medidas: 'Más de 4 m' }),
    descripcion: 'Cargadora CAT 950M de baja de flota de movimiento de tierras. Es una unidad de 2018 con 6.300 h y cazo de uso general.\n\nTransmisión y ejes se comprobaron en la revisión de salida de flota. Los neumáticos conservan dibujo útil, pero no son nuevos; el comprador debe valorar su estado en la visita.\n\nEstá en Alicante y se puede probar articulación, dirección y elevación en campa. Transporte por cuenta del comprador.',
  },
  {
    ref: 'SEM-020', canalVenta: 'stock-profesional',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Cargadoras',
    marca: 'JCB 411', modelo: '411',
    titulo: 'Cargadora de ruedas JCB 411 · 2016 · 8.100 h',
    precio: 34500, estado: 'Bueno', creado: 85, visitas: 441,
    fotos: ['/images/anuncios/jcb-411-zx-1.webp', '/images/anuncios/jcb-411-zx-2.webp', '/images/anuncios/jcb-411-zx-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2016, horas: 8100, combustible: 'Diésel', cv: 109, peso: 8722, transporte: 'No', docs: 'Parcial', traccion: 'Ruedas 4x4', medidas: 'Más de 4 m' }),
    descripcion: 'Cargadora de ruedas JCB 411 de 2016 en stock. Es una pala articulada —no una mixta— con 8.100 h y cazo frontal. Se han comprobado frenos, articulación y funcionamiento hidráulico. Presenta holgura propia de sus horas en puntos de giro y se ha tenido en cuenta en el precio.\n\nLa documentación es parcial. Se encuentra en Barcelona y se emite factura de empresa.',
  },
  {
    ref: 'SEM-021', canalVenta: 'venta-cliente-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'taller-maquinaria-albacete',
    cat: 'obra', sub: 'Cargadoras',
    marca: 'Caterpillar 906', modelo: '906',
    titulo: 'Caterpillar 906M · 2021 · 4.450 h',
    precio: 41200, estado: 'Bueno', creado: 140, visitas: 358,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/cat-906-1.webp','/images/anuncios/cat-906-2.webp','/images/anuncios/cat-906-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2021, horas: 4450, combustible: 'Diésel', cv: 68, peso: 5600, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Ruedas 4x4', medidas: '2,5 – 4 m' }),
    descripcion: 'Cargadora compacta de un cliente del taller, retirada al pasar a una máquina mayor. CAT 906M de 2021 con 4.450 h, enganche rápido y tercer circuito.\n\nEn el historial del taller constan los mantenimientos periódicos. La máquina trabaja bien y conserva la pintura con pequeños roces de uso en cazo y contrapeso.\n\nSe puede ver y probar en Albacete. No incluye horquillas salvo acuerdo expreso.',
  },

  // ──────────────────────── OBRA · Compactación ────────────────────────
  {
    ref: 'SEM-022', canalVenta: 'baja-flota-profesional',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'levante-obra',
    cat: 'obra', sub: 'Compactación',
    marca: 'Bomag BW120', modelo: 'BW120',
    titulo: 'Rodillo tándem Bomag BW 120 AD-5 · 2018 · 3.100 h',
    precio: 26800, estado: 'Bueno', creado: 260, visitas: 244,
    fotos: ['/images/anuncios/bomag-bw120-1.webp','/images/anuncios/bomag-bw120-2.webp','/images/anuncios/bomag-bw120-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2018, horas: 3100, combustible: 'Diésel', cv: 33, peso: 2700, transporte: 'No', docs: 'Parcial', medidas: '2,5 – 4 m', extra: { 'Ancho de tambor (m)': '1,20' } }),
    descripcion: 'Rodillo tándem Bomag BW 120 AD-5 de baja de flota de asfaltado. Unidad de 2018 con 3.100 h y 1,20 m de ancho de trabajo.\n\nVibración, avance y sistema de riego se comprobaron antes de retirarlo. Los tambores tienen marcas de trabajo, sin fisuras apreciables en los bordes.\n\nDocumentación de mantenimiento parcial. Se entrega en Alicante y se carga sobre camión o remolque del comprador.',
  },
  {
    ref: 'SEM-023', canalVenta: 'baja-flota-profesional',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Compactación',
    marca: 'Hamm HD 14', modelo: 'HD 14',
    titulo: 'Rodillo tándem Hamm HD 14 VV · 2016 · 2.750 h',
    precio: 22400, estado: 'Bueno', creado: 480, visitas: 189,
    fotos: ['/images/anuncios/hamm-hd-14-1.webp','/images/anuncios/hamm-hd-14-2.webp','/images/anuncios/hamm-hd-14-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2016, horas: 2750, combustible: 'Diésel', cv: 47, peso: 4345, transporte: 'No', docs: 'Factura y libro de instrucciones', medidas: '2,5 – 4 m', extra: { 'Ancho de tambor (m)': '1,38' } }),
    descripcion: 'Rodillo Hamm HD 14 VV procedente de flota de obra vial. Es un tándem de 1,38 m con 2.750 h. Se revisaron rodamientos, vibración y circuito de agua. La carrocería muestra el uso normal de campa y transporte entre obras.\n\nEstá en Barcelona. El precio corresponde a la máquina recogida en campa; el traslado se presupuesta por separado.',
  },

  // ──────────────────────── OBRA · Plataformas elevadoras ────────────────────────
  {
    ref: 'SEM-024', canalVenta: 'baja-flota-profesional',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Plataformas elevadoras',
    marca: 'Genie GS-2630', modelo: 'GS-2630',
    titulo: 'Plataforma de tijera Genie GS-2630 eléctrica · 2019',
    precio: 9800, estado: 'Bueno', creado: 96, visitas: 267,
    fotos: ['/images/anuncios/genie-gs-2630-1.webp', '/images/anuncios/genie-gs-2630-2.webp', '/images/anuncios/genie-gs-2630-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2019, horas: 640, combustible: 'Batería', peso: 2350, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Ruedas 4x2', medidas: 'Hasta 2,5 m', tension: 'Batería', bateria: 'Sí', extra: { 'Capacidad de la cesta (kg)': '227', 'Altura máx. trabajo (m)': '9,9' } }),
    descripcion: 'Plataforma de tijera eléctrica procedente de baja de flota de alquiler. Genie GS-2630 de 2019 con cargador y funcionamiento de elevación y traslación comprobado.\n\nLas baterías mantienen carga para trabajar, aunque por edad no se venden como nuevas. Barandillas, parada de emergencia y bajada manual se probaron en la revisión de salida.\n\nSe entrega en Barcelona con manual y declaración CE disponibles. Transporte no incluido.',
  },
  {
    ref: 'SEM-025', canalVenta: 'baja-flota-profesional',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'levante-obra',
    cat: 'obra', sub: 'Plataformas elevadoras',
    marca: 'Genie S-65', modelo: 'S-65',
    titulo: 'Plataforma telescópica Genie S-65 · 2017 · 1.150 h',
    precio: 26900, estado: 'Bueno', creado: 300, visitas: 311,
    fotos: ['/images/anuncios/genie-s-65-1.webp','/images/anuncios/genie-s-65-2.webp','/images/anuncios/genie-s-65-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2017, horas: 1150, combustible: 'Diésel', cv: 48, peso: 10349, transporte: 'No', docs: 'Declaración CE / ficha técnica', traccion: 'Ruedas 4x4', medidas: 'Más de 4 m', extra: { 'Capacidad de la cesta (kg)': '227', 'Altura máx. trabajo (m)': '21,7' } }),
    descripcion: 'Plataforma telescópica Genie S-65 de baja de flota. Unidad diésel 4x4 de 2017 con 1.150 h y cesta de 227 kg. Se comprobaron extensión, giro, traslación y sistemas de seguridad. La batería de arranque es reciente y los neumáticos todoterreno conservan dibujo útil.\n\nSe encuentra en Alicante. Dada su longitud de transporte, el comprador debe prever camión adecuado.',
  },
  {
    ref: 'SEM-026', canalVenta: 'venta-cliente-taller',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'taller-maquinaria-albacete',
    cat: 'obra', sub: 'Plataformas elevadoras',
    marca: 'Haulotte HA20 RTJ', modelo: 'HA20 RTJ',
    titulo: 'Plataforma articulada Haulotte HA20 RTJ · 2016 · 2.380 h',
    precio: 23900, estado: 'Bueno', creado: 48, visitas: 295,
    fotos: ['/images/anuncios/ha20-lt-1.webp', '/images/anuncios/ha20-lt-2.webp', '/images/anuncios/ha20-lt-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2016, horas: 2380, combustible: 'Diésel', cv: 49, peso: 9300, transporte: 'No', docs: 'Factura y libro de instrucciones', traccion: 'Ruedas 4x4', medidas: 'Más de 4 m', extra: { 'Capacidad de la cesta (kg)': '230', 'Altura máx. trabajo (m)': '20,6' } }),
    descripcion: 'Plataforma articulada de un cliente mantenida en nuestro taller. Haulotte HA20 RTJ diésel de 2016 con 2.380 h y tracción 4x4.\n\nSe han probado mandos de cesta y base, alarmas, parada de emergencia y movimientos completos. Presenta roces en cesta y contrapeso propios de trabajos de fachada e industria.\n\nSe puede elevar y revisar en Albacete. Se entrega con manual y documentación disponible del propietario.',
  },

  // ──────────────────── HERRAMIENTAS · Herramienta eléctrica ────────────────────
  {
    ref: 'SEM-027', canalVenta: 'excedente-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'taller-el-palmar',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'Bosch', modelo: 'GBH 5-40 DCE',
    titulo: 'Rotomartillo Bosch GBH 5-40 DCE',
    precio: 315, estado: 'Bueno', creado: 72, visitas: 189,
    fotos: ['/images/anuncios/bosch-gbh-5-40-1.webp','/images/anuncios/bosch-gbh-5-40-2.webp','/images/anuncios/bosch-gbh-5-40-3.webp'],
    ficha: specs({ familia: 'herramientas', transporte: 'No', docs: 'Parcial', combustible: 'Eléctrico', potenciaW: '1.000 – 2.500 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Rotomartillo Bosch GBH 5-40 DCE procedente de excedente de nuestro taller. Es un equipo SDS-Max de red, utilizado en trabajos puntuales de instalación y reparación.\n\nSe ha probado en rotación y percusión. El cable está entero y el portaherramientas retiene correctamente. Tiene marcas de uso en la carcasa y se entrega con maletín y una punta. Se puede probar al recogerlo en Sevilla.',
  },
  {
    ref: 'SEM-028', canalVenta: 'excedente-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'DeWalt', modelo: 'DCS575',
    titulo: 'Sierra circular DeWalt DCS575 FlexVolt · 2 baterías',
    precio: 385, estado: 'Bueno', creado: 30, visitas: 224,
    fotos: ['/images/anuncios/dewalt-dcs575-1.webp','/images/anuncios/dewalt-dcs575-2.webp','/images/anuncios/dewalt-dcs575-3.webp'],
    ficha: specs({ familia: 'herramientas', transporte: 'No', docs: 'Factura y libro de instrucciones', combustible: 'Batería', tension: 'Batería', bateria: 'Sí', extra: { 'Diámetro de disco (mm)': '184' } }),
    descripcion: 'Sierra circular DeWalt DCS575 FlexVolt que sale por renovación del utillaje del taller. Se entrega con dos baterías 54 V, cargador rápido y caja TSTAK.\n\nLa hemos utilizado para cortes ocasionales de madera y tableros. La base está recta y el protector funciona correctamente; el disco montado tiene uso y conviene valorar su sustitución según el trabajo.\n\nSe prueba con batería en Zaragoza. Factura de compra disponible.',
  },
  {
    ref: 'SEM-029', canalVenta: 'excedente-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'Hilti', modelo: 'TE 60-ATC',
    titulo: 'Martillo combinado Hilti TE 60-ATC/AVR',
    precio: 980, estado: 'Bueno', creado: 200, visitas: 267,
    fotos: ['/images/anuncios/hilti-te-60-1.webp','/images/anuncios/hilti-te-60-2.webp','/images/anuncios/hilti-te-60-3.webp'],
    ficha: specs({ familia: 'herramientas', transporte: 'No', docs: 'Parcial', combustible: 'Eléctrico', potenciaW: '1.000 – 2.500 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Martillo combinado Hilti TE 60-ATC/AVR de excedente de taller. Se vende con maletín, un puntero y un cincel.\n\nEl equipo se ha probado en percusión y rotación. En nuestro registro consta una revisión con sustitución de cable y escobillas; la carcasa presenta el desgaste normal de herramienta profesional.\n\nNo conservamos la factura de compra. Ofrecemos dos meses de garantía del taller sobre el funcionamiento electromecánico.',
  },
  {
    ref: 'SEM-030', canalVenta: 'venta-particular',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'maria-laura-benitez',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'Festool', modelo: 'TS 55 F',
    titulo: 'Sierra de inmersión Festool TS 55 F + guía FS 1400',
    precio: 540, estado: 'Como nuevo', creado: 14, visitas: 178,
    fotos: ['/images/anuncios/festool-ts-55-1.webp','/images/anuncios/festool-ts-55-2.webp','/images/anuncios/festool-ts-55-3.webp'],
    ficha: specs({ familia: 'herramientas', transporte: 'No', docs: 'Factura y libro de instrucciones', combustible: 'Eléctrico', potenciaW: '1.000 – 2.500 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Vendo mi sierra de inmersión Festool TS 55 F con guía FS 1400. La compré para preparar cajas, reparar tarimas y hacer unos muebles para el almacén de la finca, y desde que terminé apenas la uso.\n\nFunciona bien y el disco ha hecho pocos cortes. Se entrega en su Systainer con la guía completa. Tiene alguna marca ligera de haber estado guardada con otras herramientas. Se puede probar cerca de Valencia. Prefiero entrega en mano para que se revise con calma.',
  },

  // ──────────────────── HERRAMIENTAS · Motores y generadores ────────────────────
  {
    ref: 'SEM-031', canalVenta: 'reacondicionado-taller',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Motores y generadores',
    marca: 'Kipor', modelo: 'KDE20SS3',
    titulo: 'Grupo electrógeno Kipor KDE20SS3 · 20 kVA',
    precio: 5450, estado: 'Bueno', creado: 60, visitas: 302,
    fotos: ['/images/anuncios/kipor-kde20-1.webp','/images/anuncios/kipor-kde20-2.webp','/images/anuncios/kipor-kde20-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2019, horas: 1240, combustible: 'Diésel', transporte: 'No', docs: 'Factura y libro de instrucciones', potenciaW: 'Más de 2.500 W', tension: '400 V', extra: { 'Potencia aparente (kVA)': '20' } }),
    descripcion: 'Grupo electrógeno Kipor KDE20SS3 revisado en nuestro taller. Es un equipo diésel trifásico carenado con 1.240 h marcadas.\n\nSe sustituyeron aceite y filtros y se probó con carga antes de ponerlo a la venta. El cuadro arranca correctamente y el alternador entrega tensión estable. El ATS no está incluido.\n\nSe entrega con batería de arranque renovada y manual. Puede verse en funcionamiento en Zaragoza.',
  },
  {
    ref: 'SEM-032', canalVenta: 'reacondicionado-taller',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Motores y generadores',
    marca: 'Himoinsa', modelo: 'HFW-60',
    titulo: 'Grupo electrógeno Himoinsa HFW-60 silencioso',
    precio: 11900, estado: 'Bueno', creado: 360, visitas: 341,
    fotos: ['/images/anuncios/himoinsa-hfw60-1.webp','/images/anuncios/himoinsa-hfw60-2.webp','/images/anuncios/himoinsa-hfw60-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2020, horas: 890, combustible: 'Diésel', transporte: 'No', docs: 'Declaración CE / ficha técnica', potenciaW: 'Más de 2.500 W', tension: '400 V' }),
    descripcion: 'Grupo Himoinsa HFW-60 sometido a puesta a punto en nuestro taller. Equipo diésel silencioso con 890 h y cuadro de control automático.\n\nSe ha realizado mantenimiento de motor y una prueba con carga. La carrocería está completa, con cerraduras y bisagras operativas y sin corrosión estructural apreciable.\n\nNo se conserva la factura original; se aporta la documentación CE disponible. Se puede probar en Zaragoza con cita.',
  },
  {
    ref: 'SEM-033', canalVenta: 'reacondicionado-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Motores y generadores',
    marca: 'Honda', modelo: 'EU70is',
    titulo: 'Generador Honda EU70is inverter',
    precio: 3290, estado: 'Como nuevo', creado: 24, visitas: 209,
    fotos: ['/images/anuncios/honda-eu70is-1.webp','/images/anuncios/honda-eu70is-2.webp','/images/anuncios/honda-eu70is-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2023, horas: 60, combustible: 'Gasolina', transporte: 'No', docs: 'Factura y libro de instrucciones', potenciaW: 'Más de 2.500 W', tension: '230 V', extra: { 'Potencia máxima (W)': '7000' } }),
    descripcion: 'Generador Honda EU70is entrado a cuenta y revisado en taller. Marca 60 h y se ha utilizado solo como respaldo.\n\nSe comprobó arranque eléctrico, salida de 230 V y funcionamiento con carga ligera. Depósito y carburador están limpios y la batería de arranque se sustituyó en la revisión.\n\nSe entrega con factura disponible y manual. Puede probarse en Zaragoza.',
  },

  // ──────────────────── HERRAMIENTAS · Sierra y poda ────────────────────
  {
    ref: 'SEM-034', canalVenta: 'baja-flota-propia',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'campo-verde-servicios',
    cat: 'herramientas', sub: 'Sierra y poda',
    marca: 'Husqvarna', modelo: '560 XP',
    titulo: 'Motosierra Husqvarna 560 XP',
    precio: 590, estado: 'Bueno', creado: 40, visitas: 254,
    fotos: ['/images/anuncios/husqvarna-560xp-1.webp','/images/anuncios/husqvarna-560xp-2.webp','/images/anuncios/husqvarna-560xp-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2021, combustible: 'Gasolina', transporte: 'No', docs: 'Parcial', extra: { 'Cilindrada (cc)': '59,8', 'Largo de espada (cm)': '45' } }),
    descripcion: 'Motosierra Husqvarna 560 XP utilizada por nuestras cuadrillas de poda y retirada al renovar el equipo. Es una máquina profesional de gasolina con espada de 18 pulgadas.\n\nArranca en frío, mantiene ralentí y el freno de cadena actúa correctamente. Tiene rayaduras y desgaste en carcasas propios del trabajo diario, pero no se vende para despiece.\n\nSe entrega con una cadena de repuesto. Se puede arrancar en Murcia antes de recogerla.',
  },
  {
    ref: 'SEM-035', canalVenta: 'baja-flota-propia',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'campo-verde-servicios',
    cat: 'herramientas', sub: 'Sierra y poda',
    marca: 'Husqvarna', modelo: '545 Mark II',
    titulo: 'Motosierra Husqvarna 545 Mark II · espada de 16\"',
    precio: 340, estado: 'Bueno', creado: 520, visitas: 167,
    fotos: ['/images/anuncios/husqvarna-545-1.webp','/images/anuncios/husqvarna-545-2.webp','/images/anuncios/husqvarna-545-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2019, combustible: 'Gasolina', transporte: 'No', docs: 'Sin documentación', extra: { 'Cilindrada (cc)': '50,1', 'Largo de espada (cm)': '40' } }),
    descripcion: 'Husqvarna 545 Mark II de nuestras cuadrillas de mantenimiento, retirada por renovación de material. Monta espada de 16 pulgadas y se ha usado para desrame y leña.\n\nEl carburador se ajustó esta temporada y la máquina acelera sin ahogarse. El carenado tiene roces y la cadena montada está a media vida.\n\nNo se conserva factura de compra. Se puede probar arrancada en Murcia.',
  },

  // ──────────────────── HERRAMIENTAS · Taller manual ────────────────────
  {
    ref: 'SEM-036', canalVenta: 'excedente-taller',
    estadoFotos: 'cuarentena', decision: 'corregir-modelo',
    vendedor: 'taller-el-palmar',
    cat: 'herramientas', sub: 'Taller manual',
    marca: 'Facom', modelo: 'Set 46',
    titulo: 'Juego de llaves y vasos Facom · 46 piezas',
    precio: 310, estado: 'Bueno', creado: 120, visitas: 141,
    fotos: ['/images/anuncios/facom-46pz-1.webp','/images/anuncios/facom-46pz-2.webp','/images/anuncios/facom-46pz-3.webp'],
    ficha: specs({ familia: 'herramientas', peso: 12.5, transporte: 'No', docs: 'Factura y libro de instrucciones' }),
    descripcion: 'Juego de herramienta manual Facom procedente de excedente de taller. Se vende como conjunto usado, con llaves y vasos de las medidas habituales de trabajo en su caja metálica.\n\nLas piezas tienen desgaste de uso diario, pero no hemos detectado llaves abiertas ni vasos fisurados al revisarlo. Antes de cerrar la venta se puede contar y comprobar el contenido en el mostrador.\n\nEntrega en mano en Sevilla. El envío se puede preparar por cuenta del comprador.',
  },
  {
    ref: 'SEM-037', canalVenta: 'excedente-taller',
    estadoFotos: 'cuarentena', decision: 'mantener',
    vendedor: 'taller-maquinaria-albacete',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'Einhell', modelo: 'TC-MX 1400-2 E',
    titulo: 'Mezclador eléctrico Einhell TC-MX 1400-2 E',
    precio: 55, estado: 'Usado', creado: 660, visitas: 98,
    fotos: ['/images/anuncios/mezclador-set-1.webp','/images/anuncios/mezclador-set-2.webp','/images/anuncios/mezclador-set-3.webp'],
    ficha: specs({ familia: 'herramientas', peso: 3.5, transporte: 'No', docs: 'Sin documentación', combustible: 'Eléctrico', potenciaW: '1.000 – 2.500 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Mezclador eléctrico Einhell TC-MX 1400-2 E de excedente de taller. Se ha usado para morteros y adhesivos en pequeñas reparaciones.\n\nFunciona en las dos velocidades y se entrega con la varilla montada. El cable se sustituyó una vez y la carcasa tiene restos de material y pintura saltada. Sin documentación. Se puede probar al recogerlo en Albacete.',
  },
]

module.exports = {
  VENDEDORES,
  ANUNCIOS,
  emailVendedor,
  specs,
  haceHoras,
  dentroDias,
}
