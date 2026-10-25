// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE LA SEMILLA — módulo compartido (sin dependencias de Node)
// ───────────────────────────────────────────────────────────────────────────
// Única fuente de verdad de los 36 anuncios de demostración de maquinaria.
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
 * Construye el bloque `especificaciones` EXACTAMENTE con las claves que usan
 * el formulario de publicación y los filtros del catálogo
 * (src/lib/categorias.ts y src/lib/filtros-tecnicos.ts).
 *
 * Transversales (siempre): Año, Horas de uso, Combustible, Potencia (CV),
 * Peso (kg), ¿Incluye transporte?, Documentación.
 * Específicos según `familia`: agricola / obra / herramientas.
 */
function specs(s) {
  const out = {
    'Año': String(s.anio),
    'Horas de uso': String(s.horas),
    Combustible: s.combustible || 'Diésel',
    'Potencia (CV)': String(s.cv),
    'Peso (kg)': String(s.peso),
    '¿Incluye transporte?': s.transporte || 'No',
    Documentación: s.docs || 'Factura y libro de instrucciones',
  }
  if (s.familia === 'agricola') {
    out['Tracción'] = s.traccion || '4x2'
    out['Enganche'] = s.enganche || 'Tres puntos'
    out['Toma de fuerza (PTO)'] = s.pto || '540 rpm'
    out['Transmisión'] = s.transmision || 'Manual'
  } else if (s.familia === 'obra') {
    out['Tracción'] = s.traccion || 'Ruedas 4x4'
    out['Medidas de transporte'] = s.medidas || 'Más de 4 m'
  } else if (s.familia === 'herramientas') {
    out['Potencia (W)'] = s.potenciaW || '1.000 – 2.500 W'
    out['Tensión'] = s.tension || '230 V'
    out['Batería incluida'] = s.bateria || 'No'
  }
  return out
}

// ── Vendedores (10) ────────────────────────────────────────────────────────
// Tipo: `particular` (dueño de la máquina), `camperizador` = etiqueta
// «Taller» en la UI (reparación/venta de maquinaria), `profesional` =
// concesionario o distribuidor. Sin teléfono: la semilla nunca expone
// contactos (migración 202609180003).
const VENDEDORES = [
  { slug: 'agrodeal-castilla', nombre: 'AgroDeal Castilla', estado: 'Castilla y León', ciudad: 'Valladolid', telefono: null, verificado: false, tipo: 'profesional' },
  { slug: 'taller-el-palmar', nombre: 'Talleres El Palmar', estado: 'Andalucía', ciudad: 'Sevilla', telefono: null, verificado: false, tipo: 'camperizador' },
  { slug: 'grupo-ibermaq', nombre: 'Grupo Ibermaq', estado: 'Cataluña', ciudad: 'Barcelona', telefono: null, verificado: false, tipo: 'profesional' },
  { slug: 'campo-verde-servicios', nombre: 'Campo Verde Servicios', estado: 'Murcia', ciudad: 'Murcia', telefono: null, verificado: false, tipo: 'camperizador' },
  { slug: 'excava-norte', nombre: 'Excava Norte', estado: 'País Vasco', ciudad: 'Vizcaya', telefono: null, verificado: false, tipo: 'camperizador' },
  { slug: 'levante-obra', nombre: 'Levante Obra y Maquinaria', estado: 'Comunitat Valenciana', ciudad: 'Alicante', telefono: null, verificado: false, tipo: 'profesional' },
  { slug: 'taller-maquinaria-albacete', nombre: 'Taller Maquinaria Albacete', estado: 'Castilla-La Mancha', ciudad: 'Albacete', telefono: null, verificado: false, tipo: 'camperizador' },
  { slug: 'eolo-generadores', nombre: 'Eolo Generadores y Motores', estado: 'Aragón', ciudad: 'Zaragoza', telefono: null, verificado: false, tipo: 'camperizador' },
  { slug: 'maria-laura-benitez', nombre: 'María Laura Benítez', estado: 'Comunitat Valenciana', ciudad: 'Valencia', telefono: null, verificado: false, tipo: 'particular' },
  { slug: 'juan-ramon-estevez', nombre: 'Juan Ramón Estévez', estado: 'Galicia', ciudad: 'Lugo', telefono: null, verificado: false, tipo: 'particular' },
]
const emailVendedor = v => `semilla+${v.slug}@maquinaria.click`

// ── Los 36 anuncios ────────────────────────────────────────────────────────
// fotos: rutas relativas a /public (la PRIMERA es la portada).
// creado: horas hacia atrás desde ahora mismo.
// cat: clave de familia/categoría (agricola | obra | herramientas) → categoria_id.
// sub: label EXACTA de la subcategoría (columna productos.subcategoria).

const ANUNCIOS = [
  // ──────────────────────── AGRÍCOLA · Tractores ────────────────────────
  {
    vendedor: 'agrodeal-castilla',
    cat: 'agricola', sub: 'Tractores',
    marca: 'John Deere 6M', modelo: '6M',
    titulo: 'John Deere 6M 120 CV · 4.180 horas · 2019',
    precio: 52900, estado: 'Bueno', creado: 26 * 24, visitas: 512,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/jd-6m-120-1.webp','/images/anuncios/jd-6m-120-2.webp','/images/anuncios/jd-6m-120-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2019, horas: 4180, cv: 120, peso: 4900, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: '4x4', enganche: 'Tres puntos', pto: '540/1000 rpm', transmision: 'CVT / variable' }),
    descripcion: 'Tractor John Deere 6M de 120 CV con 4.180 horas de uso en explotación de cereal. Único dueño, mantenimiento por libro en concesionario oficial con todas las facturas: último cambio de aceite y filtros a las 4.000 h.\n\nCabina climatizada con aire y calefacción, suspensión delantera, doble salida hidráulica, enganche de tres puntos y PTO 540/1000. Neumáticos traseros al 75% y delanteros recién estrenados. ITP en vigor hasta 2027 y documentación completa (factura original, libro sellado y marcado CE).\n\nSe puede ver y probar en Valladolid con cita previa. Transferencia y transporte a península incluidos en el precio si se cierra esta semana.',
  },
  {
    vendedor: 'agrodeal-castilla',
    cat: 'agricola', sub: 'Tractores',
    marca: 'Kubota M7', modelo: 'M7',
    titulo: 'Kubota M7-152 · 3.050 horas · como nuevo',
    precio: 74500, estado: 'Como nuevo', creado: 9 * 24 + 4, visitas: 641,
    boosteado: true, verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/kubota-m7-152-1.webp','/images/anuncios/kubota-m7-152-2.webp','/images/anuncios/kubota-m7-152-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2021, horas: 3050, cv: 152, peso: 6800, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: '4x4', enganche: 'Tres puntos', pto: '540/1000 rpm', transmision: 'CVT / variable' }),
    descripcion: 'Kubota M7-152 del 2021 con solo 3.050 horas: la gama alta de Kubota con transmisión hidrostática de gama completa, palanca demando en el reposabrazos y cabina de serie con climatización.\n\nRevisión general de 300 h hecha hace 80 horas: aceite, filtros de aceite, combustible y hidráulico, más pastillas de freno delanteras nuevas. Carrocería sin golpes, pintura original en bastidor y caja de enganche sin desgaste.\n\nProcede de demonstración de concesionario, de ahí las pocas horas. Factura, libro y CE a disposición del comprador. Precio negociable en entrega inmediata.',
  },
  {
    vendedor: 'campo-verde-servicios',
    cat: 'agricola', sub: 'Tractores',
    marca: 'New Holland T6', modelo: 'T6',
    titulo: 'New Holland T6.180 Electro Command · 6.420 horas',
    precio: 43900, estado: 'Bueno', creado: 61 * 24 + 7, visitas: 387,
    fotos: ['/images/anuncios/nh-t6-180-1.webp','/images/anuncios/nh-t6-180-2.webp','/images/anuncios/nh-t6-180-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2017, horas: 6420, cv: 175, peso: 7100, transporte: 'Sí', docs: 'Parcial', traccion: '4x4', enganche: 'Barra de tracción', pto: '540/1000 rpm', transmision: 'Manual' }),
    descripcion: 'New Holland T6.180 con 6.420 horas, multipropósito de 175 CV para labores de transporte y campo. Cambio Electro Command de 6 adelantos y 3 retrasos funcionando con total normalidad.\n\nMotor Tier 4 sin averías de FAP ni EGR, arranca en frío sin humo y no pierde potencia en cuesta. Exterior con marcas de uso lógicas (se aprecian en las fotos), sin oxidación estructural. Enganche de barra de tracción con toma hidráulica doble.\n\nLibro de mantenimiento a medias: faltan las facturas de los dos últimos servicios, por eso se vende sin documentación completa. ITP en vigor. Se entrega con manuales y dos juegos de llaves.',
  },
  {
    vendedor: 'maria-laura-benitez',
    cat: 'agricola', sub: 'Tractores',
    marca: 'Kubota M5', modelo: 'M5',
    titulo: 'Kubota M5-111 · 5.870 horas · parcelera mediana',
    precio: 28750, estado: 'Bueno', creado: 140, visitas: 208,
    fotos: ['/images/anuncios/kubota-m5-111-1.webp','/images/anuncios/kubota-m5-111-2.webp','/images/anuncios/kubota-m5-111-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2016, horas: 5870, cv: 110, peso: 4300, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: '4x4', enganche: 'Tres puntos', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Mi Kubota M5-111 de 2016, el tractor de la finca de cítricos de la familia. 5.870 horas trabajando entre Valencia y Castellón: cargador frontal, arado de discos y remolque de riego.\n\nSiempre en garaje y con mantenimiento hecho en el taller del pueblo (tengo todas las facturas desde 2019). Aceite y filtros cambiados hace 120 horas. Neumáticos con más del 60% de vida.\n\nVendo por cambio de explotación. No tiene aire acondicionado en cabina — es la única cosa que le falta. ITP al día, libro sellado y factura original de compra. Escucho ofertas razonables de quien la vaya a trabajar de verdad.',
  },
  {
    vendedor: 'taller-el-palmar',
    cat: 'agricola', sub: 'Tractores',
    marca: 'Case IH Farmall', modelo: 'Farmall',
    titulo: 'Case IH Farmall 75C · 7.240 horas · listo para trabajar',
    precio: 21900, estado: 'Usado', creado: 300, visitas: 344,
    fotos: ['/images/anuncios/farmall-75c-1.webp','/images/anuncios/farmall-75c-2.webp','/images/anuncios/farmall-75c-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2014, horas: 7240, cv: 75, peso: 3600, transporte: 'Sí', docs: 'Parcial', traccion: '4x4', enganche: 'Tres puntos', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Case IH Farmall 75C, tractor compacto de 75 CV ideal para ganadería, huerta y trabajos de comunidad. 7.240 horas con uso honesto: se le nota la jornada pero el motor está fuerte.\n\nRevisión de motor y embrague hecha en nuestro taller hace 400 horas (facturas incluidas): junta de culata, embrague nuevo y bomba de agua. La cabina es sencilla con calefacción, sin aire acondicionado.\n\nCarrocería con pintura retocada en guardabarros (fotos reales, sin sorpresas). Ideal como segunda máquina o primera para quien empieza. ITP en vigor; documentación parcial (falta factura original de compra).',
  },
  {
    vendedor: 'juan-ramon-estevez',
    cat: 'agricola', sub: 'Tractores',
    marca: 'Belarus 800.1', modelo: '800.1',
    titulo: 'Belarus 800.1 · 4.600 horas · simple y fiable',
    precio: 14800, estado: 'Bueno', creado: 480, visitas: 176,
    fotos: ['/images/anuncios/belarus-800-1-1.webp','/images/anuncios/belarus-800-1-2.webp','/images/anuncios/belarus-800-1-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2015, horas: 4600, cv: 81, peso: 3400, transporte: 'Sí', docs: 'Declaración CE / ficha técnica', traccion: '4x2', enganche: 'Tres puntos', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Belarus 800.1 de 2015, tractor ruso de los que no piden electricista: 81 CV, caja de 5 velocidades reductora y toma de fuerza trasera. 4.600 horas trabajando en prados de Lugo.\n\nMecánicamente impecable: sin fugas de aceite ni de refrigerante, arranca a la primera en invierno. Neumáticos traseros nuevos del año pasado. Exterior sencillo, pintura original en el capó y algo de óxido en el estribo (foto).\n\nSe vende porque hemos pasado a un tractor con cabina. Ideal para henificar, segar y transporte corto. CE y ficha técnica en regla, sin factura original. Entrega en Lugo; si estás lejos, lo subimos a tu transportista.',
  },

  // ──────────────────────── AGRÍCOLA · Cosechadoras ────────────────────────
  {
    vendedor: 'agrodeal-castilla',
    cat: 'agricola', sub: 'Cosechadoras',
    marca: 'Claas Lexion', modelo: 'Lexion',
    titulo: 'Claas Lexion 530 · 1.890 horas de motor · 2019',
    precio: 132000, estado: 'Bueno', creado: 40 * 24, visitas: 702,
    boosteado: true, verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/lexion-530-1.webp','/images/anuncios/lexion-530-2.webp','/images/anuncios/lexion-530-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2019, horas: 1890, cv: 330, peso: 12800, transporte: 'Sí', docs: 'Factura y libro de instrucciones', comb: 'Diésel', traccion: '4x2', enganche: 'Sin enganche', pto: 'Sin PTO', transmision: 'Hidrostática' }),
    descripcion: 'Claas Lexion 530 con 1.890 horas de rotor, cabina Premium con pantalla CEBIS, cabezal de cereal de 6,10 m y mesa de corte hidráulica.\n\nTrabajó cuatro campañas en Castilla y León: siempre en garaje, revisión de campaña hecha antes de cada cebada (aceite de rotor, filtros y engrase general). Humógrafo, dosificación automática y ensacado en marcha sin incidencias.\n\nCepillo de limpieza y elevador de grano funcionando. Cintas de siembra en buen estado y trilladora alineada (última revisión en factura). Marcado CE y factura original disponibles; ITP en vigor.\n\nTransporte especial incluido en la península. Se enseña con demostración en campo si hay siembra pendiente en la zona.',
  },
  {
    vendedor: 'campo-verde-servicios',
    cat: 'agricola', sub: 'Cosechadoras',
    marca: 'Case IH Axial-Flow', modelo: 'Axial-Flow',
    titulo: 'Case IH Axial-Flow 7150 · 2.450 horas · cabezal incluido',
    precio: 96500, estado: 'Bueno', creado: 210, visitas: 456,
    fotos: ['/images/anuncios/af-7150-1.webp','/images/anuncios/af-7150-2.webp','/images/anuncios/af-7150-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2016, horas: 2450, cv: 310, peso: 11900, transporte: 'Sí', docs: 'Parcial', comb: 'Diésel', traccion: '4x2', enganche: 'Sin enganche', pto: 'Sin PTO', transmision: 'Hidrostática' }),
    descripcion: 'Case IH Axial-Flow 7150, cosechadora de rotor de 310 CV con 2.450 horas. Cabezal de cereal de 5,40 m incluido en el precio y corte de maíz disponible por diferencia.\n\nRotor y sinfín sin holguras, motor sin humos y transmisión hidráulica silenciosa. Cabina con A/C funcionando, luz de trabajo completa. Neumáticos de tracción con el 60% restante.\n\nÚltima campaña en Murcia (trigo y cebada). Libro parcial: tenemos facturas desde 2020, no así las primeras. Marcado CE visible en la placa. Se entrega tras revisión de campaña a cargo del comprador (la hacemos en nuestro taller antes de la entrega si se prefiere).',
  },

  // ──────────────────────── AGRÍCOLA · Maquinaria agrícola ────────────────────────
  {
    vendedor: 'agrodeal-castilla',
    cat: 'agricola', sub: 'Maquinaria agrícola',
    marca: 'Amazone', modelo: 'Primera',
    titulo: 'Sembradora Amazone Primera D9-6000 · 4 m · con dosificador',
    precio: 24900, estado: 'Bueno', creado: 160, visitas: 231,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/amazone-d9-1.webp','/images/anuncios/amazone-d9-2.webp','/images/anuncios/amazone-d9-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2018, horas: 0, cv: 90, peso: 2100, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: 'Sin tracción', enganche: 'Tres puntos', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Sembradora Amazone Primera D9-6000 de 4 m con dosificadores mecánicos, barra de rastrelo neumática y tolvas de 600 l.\n\nPara cereal en línea; rodillos del semillero y discos de siembra recién cambiados (factura de 2025). Estructura recta, sin reparaciones ni soldaduras. Enganche de tres puntos y toma de fuerza estándar.\n\nMáquina parada en Valladolid desde la última campaña: engrasada y protegida. Factura original, manuales y CE completos. Ideal para quien siembra directa o quiere renovar una vieja de 3 m.',
  },
  {
    vendedor: 'campo-verde-servicios',
    cat: 'agricola', sub: 'Maquinaria agrícola',
    marca: 'Horsch', modelo: 'Pronto',
    titulo: 'Cultivador Horsch Pronto 6 DC · 6 m · discos',
    precio: 31800, estado: 'Bueno', creado: 500, visitas: 268,
    fotos: ['/images/anuncios/horsch-pronto-6-1.webp','/images/anuncios/horsch-pronto-6-2.webp','/images/anuncios/horsch-pronto-6-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2017, horas: 0, cv: 180, peso: 4300, transporte: 'Sí', docs: 'Parcial', traccion: 'Sin tracción', enganche: 'Barra de tracción', pto: 'Sin PTO', transmision: 'Manual' }),
    descripcion: 'Cultivador Horsch Pronto 6 DC de 6 metros, para trabajo de incorporación superficial a 5-8 cm. Dos filos de discos cortantes, tres hileras de cuchillas y rodillo de trasero empaquetador.\n\nDiscos al 70% de vida (se cambian por pares, no completos), rodamientos y ejes revisados este año. Estructura en muy buen estado, sin grietas en el bastidor principal.\n\nSe vende por ampliar a 8 m. Funciona igual que el primer día; los discos cortantes llevan tres campañas. Factura de compra disponible, sin manuales. Entrega y carga en Murcia.',
  },
  {
    vendedor: 'taller-maquinaria-albacete',
    cat: 'agricola', sub: 'Maquinaria agrícola',
    marca: 'Fella', modelo: 'SM',
    titulo: 'Trituradora de setos Fella SM 145 L · 1,45 m',
    precio: 6450, estado: 'Bueno', creado: 700, visitas: 143,
    fotos: ['/images/anuncios/fella-sm-145-1.webp','/images/anuncios/fella-sm-145-2.webp','/images/anuncios/fella-sm-145-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2015, horas: 620, cv: 45, peso: 780, transporte: 'Sí', docs: 'Sin documentación', traccion: 'Sin tracción', enganche: 'Tres puntos', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Trituradora de setos y restos de poda Fella SM 145 L, de 1,45 m de ancho de trabajo, acoplable al tractor por tres puntos con PTO a 540 rpm.\n\nCuerpo hidráulico abatible, martillos en estado medio (unos 120 pares) y corte de material hasta 5 cm. Chasis sin fisuras y protecciones completas.\n\nMáquina de taller reacondicionada: rodamientos nuevos y repintado completo. No conservamos papeles de la primera vida, se vende como está probada. Buen complemento para comunidades de regantes y gestores de poda.',
  },

  // ──────────────────────── AGRÍCOLA · Ganadería ────────────────────────
  {
    vendedor: 'campo-verde-servicios',
    cat: 'agricola', sub: 'Ganadería',
    marca: 'DeLaval', modelo: 'VMS',
    titulo: 'Sala de ordeño DeLaval VMS 500 · 2 puestos',
    precio: 18400, estado: 'Bueno', creado: 340, visitas: 197,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/delaval-vms-1.webp','/images/anuncios/delaval-vms-2.webp','/images/anuncios/delaval-vms-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2013, horas: 3100, cv: 15, peso: 1900, transporte: 'Sí', docs: 'Declaración CE / ficha técnica', comb: 'Eléctrico', traccion: 'Sin tracción', enganche: 'Sin enganche', pto: 'Sin PTO', transmision: 'Hidrostática' }),
    descripcion: 'Sala de ordeño DeLaval VMS de 500 litros con dos puestos en paralelo, cinta de recogida de 220 l y pulsador automático de desenganche.\n\nDesmontada de una explotación lechera de Murcia con 80 vacas. Bomba de vacío, regulador y sensor de flujo revisados; los vasos y pezoneras están al 80%. Cuerpo de lechería sin corrosión estructural.\n\nSe entrega desmontada con esquema eléctrico y manual de instalación. CE de fabricación a la vista. Buena opción para quien monta o renueva sala pequeña; el transporte lo organizamos a península.',
  },
  {
    vendedor: 'juan-ramon-estevez',
    cat: 'agricola', sub: 'Ganadería',
    marca: 'Kerbl', modelo: 'Retro',
    titulo: 'Remolque de pienso Kerbl Retro 2200 · 2,2 m³',
    precio: 6400, estado: 'Bueno', creado: 620, visitas: 121,
    fotos: ['/images/anuncios/kerbl-retro-2200-1.webp','/images/anuncios/kerbl-retro-2200-2.webp','/images/anuncios/kerbl-retro-2200-3.webp'],
    ficha: specs({ familia: 'agricola', anio: 2019, horas: 0, cv: 55, peso: 1650, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: 'Sin tracción', enganche: 'Barra de tracción', pto: '540 rpm', transmision: 'Manual' }),
    descripcion: 'Remolque de reparto de piensos Kerbl Retro 2200, tolva de 2,2 m³ con cinta de descarga lateral y pala dosificadora.\n\nUso en explotación vacuna de Lugo, principalmente avena y paja picada. Sin fugas en el hidráulico, cinta con goma en buen estado y frenos recién ajustados.\n\nPintura original con marcas de uso, chasis recto. Factura y CE incluidas. Remolque ligero que mueve un tractor de 50 CV sin problemas; queda en la finca, se puede ver cualquier día.',
  },

  // ──────────────────────── OBRA · Excavadoras ────────────────────────
  {
    vendedor: 'excava-norte',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'Caterpillar 320', modelo: '320',
    titulo: 'Caterpillar 320 Next Gen · 9.800 horas · oruga',
    precio: 89500, estado: 'Bueno', creado: 20 * 24, visitas: 810,
    boosteado: true, verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/cat-320-1.webp','/images/anuncios/cat-320-2.webp','/images/anuncios/cat-320-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2019, horas: 9800, cv: 174, peso: 23200, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'CAT 320 Next Gen con 9.800 horas: la excavadora de 20 toneladas más vendida del mercado, con pantalla de conectividad y cámara trasera de serie.\n\nMotor sin pérdidas de potencia, bomba principal revisada hace 1.200 h (factura) y caudal hidráulico correcto en las dos vías. Juego en articulaciones dentro de tolerancia; varillas de cilindros sin goteo.\n\nTren de rodaje al 70%: ruedas guía y excentricas recién cambiadas, cadenas con uso equilibrado. Arco ROPS, calefacción y A/C funcionando, silla giratoria con apoyabrazos.\n\nDocumentación completa (factura original, libro de mantenimiento sellado, CE y ITP). Se prueba en nuestra nave de Vizcaya; transporte especial a península incluido si se cierra en el precio publicado.',
  },
  {
    vendedor: 'levante-obra',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'Hitachi ZX200', modelo: 'ZX200',
    titulo: 'Hitachi ZX200-6 · 12.400 horas · mantenimiento al día',
    precio: 61500, estado: 'Bueno', creado: 70 * 24, visitas: 597,
    fotos: ['/images/anuncios/zx200-6-1.webp','/images/anuncios/zx200-6-2.webp','/images/anuncios/zx200-6-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2017, horas: 12400, cv: 151, peso: 20300, transporte: 'Sí', docs: 'Parcial', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'Hitachi ZX200-6 de 2017 con 12.400 horas, excavadora sobre oruga de 20 t para obra civil y saneamientos. Conocida por su fiabilidad hidráulica y consumo contenido.\n\nÚltimo servicio de 1.000 h hace 300 horas: aceite de motor y transmisión, filtros y pruebas de presión sin incidencias. Fuga menor en la manguera de balancín (se ve en foto, reparación de 150 € aproximadamente).\n\nOrugas con excentricas nuevas, ruedas guía con la primera rectificada hecha. Cabina íntegra, A/C y calefacción operativos. Pintura original en la torreta con retoques en el brazo (uso normal).\n\nITP y CE en regla, facturas de mantenimiento desde 2021. Se entrega tras revisión de renta horaria y pruebas de función en nuestra nave de Alicante.',
  },
  {
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'Doosan DX140', modelo: 'DX140',
    titulo: 'Doosan DX140LC · 7.650 horas · recién revisada',
    precio: 54900, estado: 'Como nuevo', creado: 34 * 24, visitas: 486,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/dx140lc-1.webp','/images/anuncios/dx140lc-2.webp','/images/anuncios/dx140lc-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2020, horas: 7650, cv: 115, peso: 14600, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'Doosan DX140LC del 2020, 14 toneladas de uso en demoliciones ligeras y movimientos de tierra. 7.650 horas con revisión general de bombas y motores hidráulicos facturada en enero.\n\nCuerpo sin golpes estructurales, pintura original de fábrica salvo retoques en contrapeso. Tren de rodaje al 80%, cadenas y ruedas de rodadura recién rectificadas por par.\n\nCabina con pantalla de cámaras, A/C y radio. Sistema de detección de parada automática (pig) operativo. Marcado CE, factura y libro completo; ITP hasta 2028.\n\nDemostración posible en Barcelona con cita. Precio con IVA no incluido para empresas (se factura conforme); para particular, todo incluido.',
  },
  {
    vendedor: 'excava-norte',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'JCB JS145', modelo: 'JS145',
    titulo: 'JCB JS145 · 10.200 horas · zona media',
    precio: 42900, estado: 'Usado', creado: 420, visitas: 372,
    fotos: ['/images/anuncios/js145-1.webp','/images/anuncios/js145-2.webp','/images/anuncios/js145-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2015, horas: 10200, cv: 145, peso: 15400, transporte: 'Sí', docs: 'Sin documentación', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'JCB JS145 de 14,5 t con 10.200 horas, excavadora de tamaño medio muy polivalente para empresas de urbanización y zanjas medianas.\n\nMotor 4,4 l en régimen, sin humos ni pérdidas de compresión. Hidráulica con caudal correcto pero con reparación antigua en el cilindro de balancín (soldadura hecha en 2022, factura en taller local).\n\nTren de rodaje al 55%: prever rectificación o cambio de ruedas de rodadura en los próximos 2.000 h. Exterior con marcas de trabajo, sin accidentes graves.\n\nSe vende SIN papeles (factura original extraviada): por eso el precio. Comprador responsable debe aportar documentación de compra ante notario si lo necesita; nosotros dejamos contrato y copia de la ficha técnica de la máquina. Prueba de función en Vizcaya.',
  },
  {
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Excavadoras',
    marca: 'Hyundai R215', modelo: 'R215',
    titulo: 'Hyundai R215-9 · 6.900 horas · garantía de taller 6 meses',
    precio: 67800, estado: 'Bueno', creado: 110, visitas: 418,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/r215-9-1.webp','/images/anuncios/r215-9-2.webp','/images/anuncios/r215-9-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2019, horas: 6900, cv: 174, peso: 21400, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: 'Oruga', medidas: 'Más de 4 m' }),
    descripcion: 'Hyundai R215-9 de 2019 con 6.900 horas, una de las 20 t con mejor relación prestaciones-precio del mercado europeo. Vehiculo de flota propia, con historial completo.\n\nRevisión de 1.000 h realizada en nuestro taller: filtros, aceites, pruebas de presión y rectificación de ruedas de rodadura incluidas. Se entrega con GARANTÍA de taller de 6 meses en bombas y motores hidráulicos.\n\nCámara trasera, A/C, bloque de calentador y silla con suspensión. Tren al 75% y pintura original en cuerpo principal.\n\nFactura, libro sellado, CE y ITP en vigor. Financiación disponible a través de nuestra entidad (sujeta a aprobación). Uno de los anuncios más completos de nuestro catálogo.',
  },

  // ──────────────────────── OBRA · Cargadoras ────────────────────────
  {
    vendedor: 'levante-obra',
    cat: 'obra', sub: 'Cargadoras',
    marca: 'Caterpillar 950', modelo: '950',
    titulo: 'Caterpillar 950M · 6.300 horas · ruedas',
    precio: 78900, estado: 'Bueno', creado: 55 * 24, visitas: 523,
    fotos: ['/images/anuncios/cat-950m-1.webp','/images/anuncios/cat-950m-2.webp','/images/anuncios/cat-950m-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2018, horas: 6300, cv: 220, peso: 17800, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: 'Ruedas 4x4', medidas: 'Más de 4 m' }),
    descripcion: 'Cargadora frontal CAT 950M con 6.300 horas, pala de 3,2 m³ con cantos de acero nuevos y sistema de descarga alta.\n\nTransmisión Powershift revisada, embragues dentro de tolerancia y ejes con aceites analizados (informe incluido). Neumáticos al 65% — 20.5 R25 con banda original.\n\nCabina con A/C, cámara trasera y visibilidad 360°. Estructura sin reparaciones, contrapeso original.\n\nFactura, libro mantenimiento y CE completos. Se prueba en Alicante; entrega en obra de la península posible con camión de plataforma.',
  },
  {
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Cargadoras',
    marca: 'JCB 411', modelo: '411',
    titulo: 'JCB 411 ZX · retroexcavadora · 8.100 horas',
    precio: 34500, estado: 'Bueno', creado: 85, visitas: 441,
    fotos: ['/images/anuncios/jcb-411-zx-1.webp', '/images/anuncios/jcb-411-zx-2.webp', '/images/anuncios/jcb-411-zx-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2016, horas: 8100, cv: 109, peso: 8400, transporte: 'Sí', docs: 'Parcial', traccion: 'Ruedas 4x4', medidas: 'Más de 4 m' }),
    descripcion: 'JCB 411 ZX, retroexcavadora de 4 ruedas con pala delantera y brazo trasero: la máquina polivalente de obra pequeña, instalaciones y mantenimiento municipal.\n\n8.100 horas; motor 4,4 l sin fugas ni humos, frenos nuevos hace 600 h. Juego en la articulación central dentro de límites (se mide en prueba). Brazo trasero sin soldaduras de reparación.\n\nPala frontal con filos nuevos, martillo hidráulico opcional disponible por diferencia. Neumáticos traseros al 70%.\n\nDocumentación parcial (falta factura de compra original, sí libro y ITP). Máquina de nuestro taller con garantía de 3 meses en lo mecánico. Precio negociable a pago inmediato.',
  },
  {
    vendedor: 'taller-maquinaria-albacete',
    cat: 'obra', sub: 'Cargadoras',
    marca: 'Caterpillar 906', modelo: '906',
    titulo: 'Caterpillar 906 Compact · 4.450 horas · compacta',
    precio: 41200, estado: 'Como nuevo', creado: 140, visitas: 358,
    verificacion: 'sin_verificar',
    fotos: ['/images/anuncios/cat-906-1.webp','/images/anuncios/cat-906-2.webp','/images/anuncios/cat-906-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2021, horas: 4450, cv: 55, peso:5900, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: 'Ruedas 4x4', medidas: '2,5 – 4 m' }),
    descripcion: 'CAT 906 Compact de 2021, cargadora de neumático de tamaño compacto para constructora, urbanismo y trabajos en interior de nave. 4.450 horas.\n\nEstrecha (1,89 m) y maniobrable, con pala de 1,0 m³, acoplamiento rápido hidráulico y salida de tercer circuito. Motor Stage V con filtro de partículas sin historial de averías.\n\nCabinada con A/C y radio, cámara de reverso, alarmas acústicas y luces LED de trabajo. Pintura original salvo microarañazos de uso normal.\n\nFactura, manual, CE y ITP al día. Una de las unidades mejor conservadas que hemos tenido: se ve y se prueba en Albacete.',
  },

  // ──────────────────────── OBRA · Compactación ────────────────────────
  {
    vendedor: 'levante-obra',
    cat: 'obra', sub: 'Compactación',
    marca: 'Bomag BW120', modelo: 'BW120',
    titulo: 'Apisonador Bomag BW120 AD-5 · 3.100 horas',
    precio: 26800, estado: 'Bueno', creado: 260, visitas: 244,
    fotos: ['/images/anuncios/bomag-bw120-1.webp','/images/anuncios/bomag-bw120-2.webp','/images/anuncios/bomag-bw120-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2018, horas: 3100, cv: 98, peso: 10800, transporte: 'Sí', docs: 'Parcial', traccion: 'Ruedas 4x4', medidas: '2,5 – 4 m' }),
    descripcion: 'Apisonador de doble tambor Bomag BW120 AD-5 con 3.100 horas, de 120 kN de fuerza centrípeta, ideal para compactación de firmes, rellenos y zanjas.\n\nMotores de vibración sin fugas, amplitudes verificadas con analizador (informe del taller). Tambor con bordes sin fisuras y rodillos de rasillón en buen estado.\n\nMotor diesel sin humos, arranque eléctrico y deslizadores frontales recién puestos. Cabina abierta con parabrisas y toldo.\n\nLibro y mantenimiento parcial, sin factura de compra original. ITP en vigor. Se entrega con repuestos de filtros del próximo servicio.',
  },
  {
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Compactación',
    marca: 'Hamm HD 14', modelo: 'HD 14',
    titulo: 'Rodillo Hamm HD 14 · tandem · 2.750 horas',
    precio: 22400, estado: 'Bueno', creado: 480, visitas: 189,
    fotos: ['/images/anuncios/hamm-hd-14-1.webp','/images/anuncios/hamm-hd-14-2.webp','/images/anuncios/hamm-hd-14-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2016, horas: 2750, cv: 100, peso: 7500, transporte: 'Sí', docs: 'Factura y libro de instrucciones', traccion: 'Ruedas 4x4', medidas: '2,5 – 4 m' }),
    descripcion: 'Rodillo tandem Hamm HD 14 de 1,4 m, con vibración de doble amplitud y sistema de raspado de tambor.\n\n2.750 horas en obra vial catalana. Sistema de agua con bomba y boquillas funcionando (imprescindible para asfalto), depósito de 700 l.\n\nRodamientos de tambor revisados, sin fugas de aceite hidráulico. Carrocería con uso de obra, sin golpes en voladizos.\n\nFactura y CE disponibles, libro parcial. Apta para empresas de asfaltado que busquen máquina de apoyo sin invertir en nueva.',
  },

  // ──────────────────────── OBRA · Plataformas elevadoras ────────────────────────
  {
    vendedor: 'grupo-ibermaq',
    cat: 'obra', sub: 'Plataformas elevadoras',
    marca: 'Genie GS-2630', modelo: 'GS-2630',
    titulo: 'Plataforma de tijera Genie GS-2630 · eléctrica',
    precio: 9800, estado: 'Bueno', creado: 96, visitas: 267,
    fotos: ['/images/anuncios/genie-gs-2630-1.webp', '/images/anuncios/genie-gs-2630-2.webp', '/images/anuncios/genie-gs-2630-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2019, horas: 640, cv: 3, peso: 2350, transporte: 'Sí', docs: 'Factura y libro de instrucciones', comb: 'Batería', traccion: 'Ruedas 4x2', medidas: 'Hasta 2,5 m', potenciaW: '1.000 – 2.500 W', tension: 'Batería', bateria: 'Sí' }),
    descripcion: 'Plataforma elevadora de tijera Genie GS-2630: 7,80 m de altura de trabajo, 2,30 m de ancho de plataforma y capacidad de 320 kg. Eléctrica, apta para interior.\n\nBaterías de tracción agotadas al 80% de su vida (informe de carga incluido), cargador externo de 24 V operativo. Sistema hidráulico sin fugas, válvulas de emergencia probadas.\n\nBarandillas extensibles, cuña antivuelco y alarmas de inclinación verificadas en última revisión anual.\n\nFactura, manual y certificado de conformidad CE. La ideal para fontanería, electricidad y mantenimiento de naves; se puede alquilar antes de comprarla (consultar condiciones).',
  },
  {
    vendedor: 'taller-el-palmar',
    cat: 'obra', sub: 'Plataformas elevadoras',
    marca: 'Genie S-65', modelo: 'S-65',
    titulo: 'Tijera articulada Genie S-65 · 19,8 m · diésel',
    precio: 26900, estado: 'Bueno', creado: 300, visitas: 311,
    fotos: ['/images/anuncios/genie-s-65-1.webp','/images/anuncios/genie-s-65-2.webp','/images/anuncios/genie-s-65-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2017, horas: 1150, cv: 45, peso: 7900, transporte: 'Sí', docs: 'Declaración CE / ficha técnica', comb: 'Diésel', traccion: 'Ruedas 4x4', medidas: 'Más de 4 m', potenciaW: 'Más de 2.500 W', tension: '400 V', bateria: 'No' }),
    descripcion: 'Plataforma articulada Genie S-65 de 19,80 m de altura de trabajo con brazo extensible y giro de plataforma de 360°.\n\nMotor diésel Stage IIIA con 1.150 horas, batería de arranque nueva y neumáticos de campo al 70%. Sistema de seguridad redundante (interruptor de cuerpo, antivuelco y alarmas) certificado en última revisión.\n\nPlataforma con mando de girador y extensión hidráulica. Estructura sin reparaciones; pintura de fábrica con marcas de uso.\n\nConformidad CE con declaración del fabricante y manual. Revisión anual al día (certificado). Máquina para trabajos en altura serios: fachadas, industria y electricidad aérea.',
  },
  {
    vendedor: 'taller-maquinaria-albacete',
    cat: 'obra', sub: 'Plataformas elevadoras',
    marca: 'Haulotte HA20 LT', modelo: 'HA20 LT',
    titulo: 'Haulotte HA20 LT · 20 m · baterías nuevas',
    precio: 14500, estado: 'Como nuevo', creado: 48, visitas: 295,
    fotos: ['/images/anuncios/ha20-lt-1.webp', '/images/anuncios/ha20-lt-2.webp', '/images/anuncios/ha20-lt-3.webp'],
    ficha: specs({ familia: 'obra', anio: 2020, horas: 410, cv: 3, peso: 6600, transporte: 'Sí', docs: 'Factura y libro de instrucciones', comb: 'Batería', traccion: 'Ruedas 4x4', medidas: 'Más de 4 m', potenciaW: 'Más de 2.500 W', tension: 'Batería', bateria: 'Sí' }),
    descripcion: 'Haulotte HA20 LT, plataforma articulada de 20 m montada sobre oruga de goma — trabaja en interior y en terreno irregular sin dañar el firmed.\n\nBaterías de tracción REEMPLAZADAS hace 3 meses (factura de las celdas incluida), autonomía completa de jornada. Control en plataforma y en base funcionando, alarmas y paradas de emergencia probadas.\n\n410 horas reales: casi toda en mantenimiento de fachadas. Orugas de goma al 85%.\n\nFactura, manual y CE en regla. Se entrega tras revisión completa en nuestro taller, con 3 meses de garantía mecánica. Un gustazo de máquina para comunidades y empresas de limpieza.',
  },

  // ──────────────────── HERRAMIENTAS · Herramienta eléctrica ────────────────────
  {
    vendedor: 'taller-el-palmar',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'Bosch', modelo: 'GBH 5-40 DCE',
    titulo: 'Rotomartillo Bosch GBH 5-40 DCE · profesional',
    precio: 315, estado: 'Bueno', creado: 72, visitas: 189,
    fotos: ['/images/anuncios/bosch-gbh-5-40-1.webp','/images/anuncios/bosch-gbh-5-40-2.webp','/images/anuncios/bosch-gbh-5-40-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2021, horas: 0, cv: 1.7, peso: 5.4, transporte: 'No', docs: 'Factura y libro de instrucciones', comb: 'Eléctrico', potenciaW: '1.000 – 2.500 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Rotomartillo Bosch GBH 5-40 DCE de 1.200 W con mandril SDS-Max, para taladrado y demolición de hasta 40 mm en hormigón.\n\nUso de taller, dos años de servicio. Carbones al 70%, rodamiento suave y cable de alimentación sin reparaciones. Disponible con caja de transporte y punta escalopada original.\n\nFactura y garantía del distribuidor (si queda) transferibles. Se prueba antes de llevar. Ideal para instaladores y reformistas que necesitan herramienta de fábrica sin precio de nueva.',
  },
  {
    vendedor: 'taller-el-palmar',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'DeWalt', modelo: 'DCS575',
    titulo: 'Sierra circular DeWalt DCS575 · batería 54V',
    precio: 285, estado: 'Como nuevo', creado: 30, visitas: 224,
    fotos: ['/images/anuncios/dewalt-dcs575-1.webp','/images/anuncios/dewalt-dcs575-2.webp','/images/anuncios/dewalt-dcs575-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2023, horas: 0, cv: 1.9, peso: 3.1, transporte: 'No', docs: 'Factura y libro de instrucciones', comb: 'Batería', potenciaW: '500 – 1.000 W', tension: 'Batería', bateria: 'Sí' }),
    descripcion: 'Siura circular inalámbrica DeWalt FlexVolt DCS575 de 54 V, disco de 184 mm, con dos baterías de 6,0 Ah y cargador rápido.\n\nPoco uso: comprada para una obra concreta de tres meses. Sin golpes, disco original con pocos cortes, seguro de disco y base de corte rectas.\n\nFactura, caja del sistema TSTAK y todos los accesorios de fábrica. Las baterías cargan al 100% y aguantan jornada completa de carpintería.',
  },
  {
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'Hilti', modelo: 'TE 60-ATC',
    titulo: 'Demolidor Hilti TE 60-ATC/AVR · con maletín',
    precio: 980, estado: 'Bueno', creado: 200, visitas: 267,
    fotos: ['/images/anuncios/hilti-te-60-1.webp','/images/anuncios/hilti-te-60-2.webp','/images/anuncios/hilti-te-60-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2020, horas: 0, cv: 2.1, peso: 7.3, transporte: 'No', docs: 'Parcial', comb: 'Eléctrico', potenciaW: '1.000 – 2.500 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Demolidor Hilti TE 60-ATC con activación de control de retroceso (ATC) y reducción activa de vibración: la herramienta de referencia para trabajos pesados de instalación.\n\nRevisado en servicio oficial hace 500 horas: carbones, rodamientos y cable nuevo. Maletín Hilti con dos picos pico rompedor y una cincel punta.\n\nSin factura (parcial): tenemos el libro de servicio y los registros de taller de Hilti. Garantía de nuestro taller de 2 meses en electromecánica.',
  },
  {
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Herramienta eléctrica',
    marca: 'Festool', modelo: 'TS 55 F',
    titulo: 'Sierra de inglete Festool TS 55 F + guía FS 1400',
    precio: 540, estado: 'Como nuevo', creado: 14, visitas: 178,
    fotos: ['/images/anuncios/festool-ts-55-1.webp','/images/anuncios/festool-ts-55-2.webp','/images/anuncios/festool-ts-55-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2024, horas: 0, cv: 1.6, peso: 4.5, transporte: 'No', docs: 'Factura y libro de instrucciones', comb: 'Eléctrico', potenciaW: '500 – 1.000 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Sierra de canto Festool TS 55 F con riel guía FS 1400, freno de motor y aspiración de polvo: el estándar de carpintería e instalación de cocina.\n\nAdquirida hace un año para un único proyecto; prácticamente nueva, sin golpes y con disco de dientes de carburo original con menos del 10% de uso.\n\nFactura con garantía de fabricante restante (registrable), maletín Systainer 3 y guía completa. Se puede probar en nuestra sede de Zaragoza.',
  },

  // ──────────────────── HERRAMIENTAS · Motores y generadores ────────────────────
  {
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Motores y generadores',
    marca: 'Kipor', modelo: 'KDE 20',
    titulo: 'Grupo electrógeno Kipor KDE 20 · 20 kVA · trifásico',
    precio: 5450, estado: 'Bueno', creado: 60, visitas: 302,
    fotos: ['/images/anuncios/kipor-kde20-1.webp','/images/anuncios/kipor-kde20-2.webp','/images/anuncios/kipor-kde20-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2019, horas: 1240, cv: 40, peso: 620, transporte: 'Sí', docs: 'Factura y libro de instrucciones', comb: 'Diésel', potenciaW: 'Más de 2.500 W', tension: '400 V', bateria: 'No' }),
    descripcion: 'Grupo electrógeno Kipor KDE 20 de 20 kVA trifásico, con motor diésel de 1.240 horas en apagones y eventos.\n\nTablero con protección magneto-térmica y arranque eléctrico, ATS opcional disponible por diferencia. Sonorización de 68 dB(A) a 7 m, apto para obra urbana con horario.\n\nMantenimiento al día (aceite, filtros y válvulas facturados a las 1.000 h). Alternador sin historial de averías.\n\nFactura, manual y CE de fábrica. Se entrega con batería nueva y probado bajo carga de 15 kW antes de la entrega.',
  },
  {
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Motores y generadores',
    marca: 'Himoinsa', modelo: 'HFW-60',
    titulo: 'Himoinsa HFW-60 · 50 kVA · silencioso',
    precio: 11900, estado: 'Bueno', creado: 360, visitas: 341,
    fotos: ['/images/anuncios/himoinsa-hfw60-1.webp','/images/anuncios/himoinsa-hfw60-2.webp','/images/anuncios/himoinsa-hfw60-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2020, horas: 890, cv: 65, peso: 1150, transporte: 'Sí', docs: 'Declaración CE / ficha técnica', comb: 'Diésel', potenciaW: 'Más de 2.500 W', tension: '400 V', bateria: 'No' }),
    descripcion: 'Grupo silencioso Himoinsa HFW-60 de 50 kVA, de los que van en obras y eventos donde el ruido importa (72 dB(A) a 7 m).\n\n890 horas, motor Mitsubishi con mantenimiento por libro y panel de control automático con arranque remoto. Chasis con enganche de mano para moverlo en patio.\n\nCarrocería sin óxido estructural, cerraduras y bisagras completas. Aceite y filtros recién cambiados.\n\nCE y declaración de conformidad; factura original no conservada (parcial). Prueba bajo carga certificada antes de la entrega. Precio a contraentrega en Zaragoza.',
  },
  {
    vendedor: 'taller-maquinaria-albacete',
    cat: 'herramientas', sub: 'Motores y generadores',
    marca: 'Honda', modelo: 'EU70is',
    titulo: 'Honda EU70is · 7 kVA inverter · prácticamente nuevo',
    precio: 1690, estado: 'Como nuevo', creado: 24, visitas: 209,
    fotos: ['/images/anuncios/honda-eu70is-1.webp','/images/anuncios/honda-eu70is-2.webp','/images/anuncios/honda-eu70is-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2023, horas: 60, cv: 12, peso: 86, transporte: 'Sí', docs: 'Factura y libro de instrucciones', comb: 'Gasolina', potenciaW: '1.000 – 2.500 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Honda EU70is, generador inverter de 7.000 W de onda pura: suficiente para obra pequeña, furgón de servicios y domicilios en obras de reforma.\n\nSolo 60 horas de uso de emergencia. Onda sinusoidal limpia apta para equipos electrónicos y soldadura ligera por inversor.\n\nDepósito sin corrosión, carburador limpio y batería de arranque nueva. Ruedas y asa plegables, panel con dos tomas de 230 V y una de 12 V.\n\nFactura, manual y garantía de distribuidor transferible. La mejor opción de portátil en ocasión que se puede encontrar ahora mismo.',
  },

  // ──────────────────── HERRAMIENTAS · Sierra y poda ────────────────────
  {
    vendedor: 'campo-verde-servicios',
    cat: 'herramientas', sub: 'Sierra y poda',
    marca: 'Husqvarna', modelo: '560 XP',
    titulo: 'Motosierra Husqvarna 560 XP · profesional',
    precio: 590, estado: 'Bueno', creado: 40, visitas: 254,
    fotos: ['/images/anuncios/husqvarna-560xp-1.webp','/images/anuncios/husqvarna-560xp-2.webp','/images/anuncios/husqvarna-560xp-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2021, horas: 480, cv: 3.8, peso: 5.9, transporte: 'No', docs: 'Parcial', comb: 'Gasolina', potenciaW: '1.000 – 2.500 W', tension: 'Batería', bateria: 'No' }),
    descripcion: 'Motosierra Husqvarna 560 XP de 50,4 cc, gama profesional de 3,8 CV con arranque reversible y freno de cadena de inercia.\n\n480 horas de trabajo en poda urbana. Cilindro sin grietas, compresión fuerte (se prueba en frío), embrague centrifugo sin patinar. Barra de 18" con cadena nueva montada.\n\nAmortiguadores de mango en buen estado, gatillo y seguro de banda operativos. Filtro y carburador limpios esta temporada.\n\nFactura parcial (taller de reparaciones del 2023 incluida, no la compra). Cadena de repuesto y aceite de corte incluidos. Se puede probar arrancada en frío en Murcia.',
  },
  {
    vendedor: 'campo-verde-servicios',
    cat: 'herramientas', sub: 'Sierra y poda',
    marca: 'Husqvarna', modelo: '545',
    titulo: 'Motosierra Husqvarna 545 · 45 cc · con barra de 16"',
    precio: 340, estado: 'Bueno', creado: 520, visitas: 167,
    fotos: ['/images/anuncios/husqvarna-545-1.webp','/images/anuncios/husqvarna-545-2.webp','/images/anuncios/husqvarna-545-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2019, horas: 610, cv: 2.7, peso: 4.9, transporte: 'No', docs: 'Sin documentación', comb: 'Gasolina', potenciaW: '500 – 1.000 W', tension: 'Batería', bateria: 'No' }),
    descripcion: 'Motosierra Husqvarna 545 de 45 cc, tamaño medio perfecto para leña de casa, desramado y jardinería ligera.\n\n610 horas registradas en el odómetro de horas. Arranca con un tirón corto, acelera limpio y frena bien (probada). Carburador ajustado hace dos meses.\n\nGuardas completas, freno de cadena operativo y puntal correcto. Estética de uso: rayones normales en el carenado.\n\nSin papeles: se vende como herramienta de segunda mano con prueba de funcionamiento. Trae barra de 16" con cadena de diente cuadrado puesta.',
  },

  // ──────────────────── HERRAMIENTAS · Taller manual ────────────────────
  {
    vendedor: 'taller-el-palmar',
    cat: 'herramientas', sub: 'Taller manual',
    marca: 'Facom', modelo: 'Set 46',
    titulo: 'Juego de llaves y útiles Facom · 46 piezas',
    precio: 310, estado: 'Bueno', creado: 120, visitas: 141,
    fotos: ['/images/anuncios/facom-46pz-1.webp','/images/anuncios/facom-46pz-2.webp','/images/anuncios/facom-46pz-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2018, horas: 0, cv: 0.5, peso: 12.5, transporte: 'No', docs: 'Factura y libro de instrucciones', comb: 'Batería', potenciaW: 'Hasta 500 W', tension: 'Bivolt', bateria: 'No' }),
    descripcion: 'Juego de herramienta manual Facom de 46 piezas: llaves combinadas, varetas con articulación, casquillos 1/2" y tapones de impacto.\n\nProcede de nuestro taller; todas las piezas presentes (lista de contenido en foto) y con el desgaste propio del uso diario, sin piezas dobladas ni craked.\n\nCaja metálica con cerradura y bandeja interior. Factura del distribuidor del 2018.\n\nOportunidad para montar un taller desde cero con herramienta de gama alta a precio de ocasión. Entrega en mano en Sevilla o envío peninsular.',
  },
  {
    vendedor: 'eolo-generadores',
    cat: 'herramientas', sub: 'Taller manual',
    marca: 'Facom', modelo: 'Mezclador',
    titulo: 'Mezclador de obra eléctrico + picadora · set',
    precio: 240, estado: 'Usado', creado: 660, visitas: 98,
    fotos: ['/images/anuncios/mezclador-set-1.webp','/images/anuncios/mezclador-set-2.webp','/images/anuncios/mezclador-set-3.webp'],
    ficha: specs({ familia: 'herramientas', anio: 2017, horas: 0, cv: 1.4, peso: 8.2, transporte: 'No', docs: 'Sin documentación', comb: 'Eléctrico', potenciaW: '500 – 1.000 W', tension: '230 V', bateria: 'No' }),
    descripcion: 'Set de obra: mezclador eléctrico de 1.400 W con varilla de 120 mm y picadora manual para sacos de mortero.\n\nHerramienta de albañilería con uso real: pintura saltada y cable cambiado una vez (empalme en regla). Mezcla sin problemas en cubo de 100 l.\n\nSin papeles; se vende probado en tienda. Barata, lista para seguir dándole a la obra. Aceptamos recambio por herramienta mayor si viene al taller de Zaragoza.',
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
