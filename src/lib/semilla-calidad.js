// ═══════════════════════════════════════════════════════════════════════════
// CALIDAD EDITORIAL DE LA SEMILLA
// ───────────────────────────────────────────────────────────────────────────
// Reglas mecánicas para impedir que vuelvan a entrar las contradicciones
// detectadas en la auditoría de 2026-10-26:
//
//   · voz y canal de venta incompatibles con el tipo de vendedor;
//   · empresas hablando como el dueño familiar (o al revés);
//   · campos inaplicables heredados por valores por defecto;
//   · referencias a defectos "visibles en foto" sin dossier fotográfico;
//   · título y ficha con año/horas distintos;
//   · juegos de fotos no verificados como una sola unidad.
//
// Este módulo no demuestra que un texto sea verdadero: solo bloquea
// incoherencias conocidas. La verificación de modelo, procedencia y fotos
// sigue siendo una revisión de expediente, anuncio por anuncio.
// ═══════════════════════════════════════════════════════════════════════════

const CANALES_POR_TIPO = {
  particular: ['venta-particular'],
  taller: [
    'reacondicionado-taller',
    'venta-cliente-taller',
    'excedente-taller',
    'baja-flota-propia',
  ],
  profesional: [
    'stock-profesional',
    'retoma-profesional',
    'baja-flota-profesional',
  ],
}

const FRASES_PROHIBIDAS_GLOBALES = [
  [/\bITP\b/i, 'usa ITP como comodín documental'],
  [/\b(?:en|de) (?:la|las) fotos?\b/i, 'remite a las fotos para acreditar un dato'],
  [/\(foto\)/i, 'remite a una foto inexistente en el texto'],
  [/fotos reales/i, 'afirma que las fotos son reales dentro del propio anuncio'],
  [/transporte (?:especial )?incluido/i, 'promete transporte incluido sin coste cerrado'],
  [/si se cierra esta semana/i, 'usa urgencia comercial genérica'],
]

const FRASES_PROHIBIDAS_PARTICULAR = [
  [/nuestro taller/i, 'un particular no vende desde “nuestro taller”'],
  [/nuestro cat[aá]logo/i, 'un particular no tiene catálogo comercial'],
  [/garant[ií]a de taller/i, 'un particular no ofrece garantía de taller'],
  [/financiaci[oó]n/i, 'un particular no ofrece financiación'],
  [/orden de trabajo/i, 'un particular no emite la orden de trabajo del taller'],
  [/nuestras instalaciones/i, 'voz corporativa en un vendedor particular'],
  [/servicio t[eé]cnico/i, 'voz de empresa en un vendedor particular'],
]

const FRASES_PROHIBIDAS_EMPRESA = [
  [/\bmi (?:tractor|Kubota|m[aá]quina|herramienta)\b/i, 'posesivo de dueño particular en una empresa'],
  [/finca de la familia/i, 'relato familiar publicado por una empresa'],
  [/taller del pueblo/i, 'mantenimiento de “taller del pueblo” publicado por una empresa'],
  [/\bvendo\b/i, 'primera persona singular en una empresa'],
  [/\btengo\b/i, 'primera persona singular en una empresa'],
  [/escucho ofertas/i, 'cierre de particular en una empresa'],
  [/\bcompr[eé]\b/i, 'primera persona singular en una empresa'],
  [/quien la vaya a trabajar de verdad/i, 'cierre de dueño particular en una empresa'],
]

const MARCADORES_CANAL = {
  'venta-particular': /\b(?:vendo|lo he|la he|en casa|en la finca|mi |he usado|hemos usado)\b/i,
  'retoma-profesional': /retoma/i,
  'stock-profesional': /stock|campa|instalaciones|inventario/i,
  'baja-flota-profesional': /flota|nuestros equipos|nuestras cuadrillas|nuestros servicios/i,
  'baja-flota-propia': /flota|nuestros equipos|nuestras cuadrillas|nuestros servicios|equipo propio/i,
  'venta-cliente-taller': /cliente|mantenida por|historial en (?:el|nuestro) taller|entra en taller/i,
  'reacondicionado-taller': /revisad|reparad|sustituid|orden de trabajo|puesta a punto/i,
  'excedente-taller': /excedente|renovaci[oó]n del utillaje|sale por renovaci[oó]n|utillaje del taller/i,
}

const normalizar = texto => String(texto || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

function contieneFrase(texto, expresion) {
  return expresion.test(normalizar(texto))
}

function numeroEnTitulo(titulo) {
  const m = String(titulo).match(/([0-9]{1,3}(?:[.\s][0-9]{3})+|[0-9]+)\s*(?:horas|h)\b/i)
  if (!m) return null
  return Number(m[1].replace(/[.\s]/g, ''))
}

function anioEnTitulo(titulo) {
  const m = String(titulo).match(/\b(19\d\d|20\d\d)\b/)
  return m ? Number(m[1]) : null
}

function vistasRequeridas(anuncio) {
  const sub = anuncio.sub
  if (['Tractores', 'Cosechadoras'].includes(sub)) {
    return ['tres-cuartos-delantera', 'tres-cuartos-trasera', 'lateral-completo', 'cabina', 'cuentahoras', 'motor', 'neumaticos', 'enganche-pto', 'defectos']
  }
  if (sub === 'Excavadoras') {
    return ['general', 'lateral-contrario', 'cabina', 'cuentahoras', 'motor', 'tren-de-rodaje', 'articulaciones', 'cazo', 'defectos']
  }
  if (sub === 'Cargadoras') {
    return ['tres-cuartos-delantera', 'tres-cuartos-trasera', 'cabina', 'cuentahoras', 'motor', 'neumaticos', 'cazo-implemento', 'articulacion', 'defectos']
  }
  if (sub === 'Compactación') {
    return ['general', 'lateral-contrario', 'puesto-de-mando', 'cuentahoras', 'motor', 'tambores', 'defectos']
  }
  if (sub === 'Plataformas elevadoras') {
    return ['plegada-general', 'elevada', 'cesta-y-mandos', 'mandos-base', 'cuentahoras-o-cargador', 'baterias-o-motor', 'neumaticos-u-orugas', 'defectos']
  }
  if (['Maquinaria agrícola', 'Ganadería'].includes(sub)) {
    return ['general', 'lado-contrario', 'enganche', 'elementos-de-trabajo', 'desgaste', 'placa-o-serie', 'defectos']
  }
  if (sub === 'Taller manual') {
    return ['conjunto-completo', 'contenido-por-bandejas', 'marcas-y-medidas', 'desgaste', 'caja']
  }
  return ['general', 'lado-contrario', 'placa-modelo', 'desgaste', 'accesorios-incluidos']
}

function analizarFicha(anuncio, errores) {
  const f = anuncio.ficha || {}
  const ref = anuncio.ref || anuncio.titulo
  const tiene = clave => Object.prototype.hasOwnProperty.call(f, clave)
  const prohibir = (clave, motivo) => {
    if (tiene(clave)) errores.push(`${ref}: ficha con ${clave} inaplicable (${motivo})`)
  }
  const requerir = (clave, motivo) => {
    if (!tiene(clave)) errores.push(`${ref}: falta ${clave} (${motivo})`)
  }

  for (const [clave, valor] of Object.entries(f)) {
    if (['undefined', 'null', 'NaN'].includes(String(valor))) {
      errores.push(`${ref}: ${clave} contiene el literal ${valor}`)
    }
  }
  if (f['Horas de uso'] === '0') errores.push(`${ref}: Horas de uso = 0 usado como hueco`)
  if (f['¿Incluye transporte?'] === 'Sí') {
    errores.push(`${ref}: transporte incluido sin coste/logística cerrados en el expediente`)
  }

  const sub = anuncio.sub
  if (['Tractores', 'Cosechadoras', 'Excavadoras', 'Cargadoras', 'Compactación'].includes(sub)) {
    requerir('Año', 'maquinaria autopropulsada')
    requerir('Horas de uso', 'maquinaria autopropulsada')
    requerir('Combustible', 'maquinaria autopropulsada')
    if (f.Combustible && f.Combustible !== 'Diésel') {
      errores.push(`${ref}: combustible ${f.Combustible} no coincide con la unidad diésel declarada`)
    }
  }

  if (['Maquinaria agrícola', 'Ganadería'].includes(sub)) {
    prohibir('Combustible', 'equipo no autopropulsado de la semilla')
    prohibir('Potencia (CV)', 'la potencia requerida no es potencia del apero')
    prohibir('Transmisión', 'equipo no autopropulsado de la semilla')
  }

  if (sub === 'Plataformas elevadoras') {
    requerir('Combustible', 'hay que declarar la energía de la plataforma')
    if (/el[eé]ctrica|bater[ií]as/i.test(anuncio.titulo) && f.Combustible === 'Diésel') {
      errores.push(`${ref}: el título anuncia energía eléctrica y la ficha dice Diésel`)
    }
    if (tiene('Potencia (CV)') && Number(f['Potencia (CV)']) <= 5) {
      errores.push(`${ref}: Potencia (CV) testimonial en una plataforma`)
    }
  }

  if (sub === 'Herramienta eléctrica') {
    if (!['Eléctrico', 'Batería'].includes(f.Combustible)) {
      errores.push(`${ref}: Herramienta eléctrica con Combustible=${f.Combustible || 'ausente'}`)
    }
    prohibir('Potencia (CV)', 'la herramienta se especifica en W')
    prohibir('Horas de uso', 'sin cuentahoras verificable en la semilla')
  }

  if (sub === 'Motores y generadores') {
    if (!['Diésel', 'Gasolina'].includes(f.Combustible)) {
      errores.push(`${ref}: generador con Combustible=${f.Combustible || 'ausente'}`)
    }
    prohibir('Batería incluida', 'la batería de arranque no es el sistema de alimentación')
  }

  if (sub === 'Sierra y poda') {
    if (/motosierra/i.test(anuncio.titulo)) {
      if (f.Combustible !== 'Gasolina') errores.push(`${ref}: motosierra de gasolina con Combustible=${f.Combustible || 'ausente'}`)
      prohibir('Tensión', 'motosierra de combustión')
      prohibir('Batería incluida', 'motosierra de combustión')
      prohibir('Potencia (W)', 'la motosierra se especifica por cilindrada/CV')
      prohibir('Horas de uso', 'sin cuentahoras documentado en la semilla')
    }
  }

  if (sub === 'Taller manual') {
    for (const clave of ['Combustible', 'Horas de uso', 'Potencia (CV)', 'Potencia (W)', 'Tensión', 'Batería incluida']) {
      prohibir(clave, 'herramienta manual')
    }
  }
}

/**
 * @param {{ VENDEDORES?: Array<Record<string, any>>, ANUNCIOS?: Array<Record<string, any>> }} [datos]
 * @param {{ exigirFotosVerificadas?: boolean }} [opciones]
 * @returns {{ errores: string[], avisos: string[], bloqueosFotos: string[] }}
 */
function analizarSemilla(
  { VENDEDORES = [], ANUNCIOS = [] } = {},
  { exigirFotosVerificadas = false } = {},
) {
  const errores = []
  const avisos = []
  const bloqueosFotos = []
  const porSlug = new Map(VENDEDORES.map(v => [v.slug, v]))
  const ciudades = [...new Set(VENDEDORES.map(v => v.ciudad).filter(Boolean))]
  const refs = new Set()
  const descripciones = new Set()

  for (const v of VENDEDORES) {
    if (!v.perfilVoz) errores.push(`${v.slug}: vendedor sin perfilVoz`)
    if (!CANALES_POR_TIPO[v.tipo]) errores.push(`${v.slug}: tipo de vendedor no soportado (${v.tipo})`)
  }

  for (const a of ANUNCIOS) {
    const ref = a.ref || a.titulo
    const vendedor = porSlug.get(a.vendedor)
    if (!a.ref || !/^SEM-\d{3}$/.test(a.ref)) errores.push(`${ref}: ref ausente o no estable`)
    if (refs.has(a.ref)) errores.push(`${ref}: ref duplicada`)
    refs.add(a.ref)

    if (!vendedor) {
      errores.push(`${ref}: vendedor desconocido ${a.vendedor}`)
      continue
    }

    const canales = CANALES_POR_TIPO[vendedor.tipo] || []
    if (!canales.includes(a.canalVenta)) {
      errores.push(`${ref}: canalVenta=${a.canalVenta || 'ausente'} incompatible con vendedor ${vendedor.tipo}`)
    }

    const descripcion = a.descripcion || ''
    if (descripciones.has(descripcion)) errores.push(`${ref}: descripción duplicada exacta`)
    descripciones.add(descripcion)

    for (const [regex, motivo] of FRASES_PROHIBIDAS_GLOBALES) {
      if (contieneFrase(descripcion, regex)) errores.push(`${ref}: ${motivo}`)
    }
    const prohibidas = vendedor.tipo === 'particular'
      ? FRASES_PROHIBIDAS_PARTICULAR
      : FRASES_PROHIBIDAS_EMPRESA
    for (const [regex, motivo] of prohibidas) {
      if (contieneFrase(descripcion, regex)) errores.push(`${ref}: ${motivo}`)
    }

    const marcador = MARCADORES_CANAL[a.canalVenta]
    if (marcador && !contieneFrase(descripcion, marcador)) {
      errores.push(`${ref}: la descripción no expresa el canal ${a.canalVenta}`)
    }

    for (const ciudad of ciudades) {
      if (ciudad === vendedor.ciudad) continue
      const re = new RegExp(`\\b${normalizar(ciudad).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (re.test(normalizar(descripcion))) {
        errores.push(`${ref}: menciona ${ciudad}, pero el vendedor está en ${vendedor.ciudad}`)
      }
    }

    const anioTitulo = anioEnTitulo(a.titulo)
    if (anioTitulo && String(anioTitulo) !== String(a.ficha?.['Año'] || '')) {
      errores.push(`${ref}: año del título (${anioTitulo}) distinto de la ficha (${a.ficha?.['Año'] || 'ausente'})`)
    }
    const horasTitulo = numeroEnTitulo(a.titulo)
    if (horasTitulo !== null && horasTitulo !== Number(a.ficha?.['Horas de uso'])) {
      errores.push(`${ref}: horas del título (${horasTitulo}) distintas de la ficha (${a.ficha?.['Horas de uso'] || 'ausentes'})`)
    }

    analizarFicha(a, errores)

    if (!['mantener', 'corregir-modelo', 'sustituir'].includes(a.decision)) {
      errores.push(`${ref}: decision editorial ausente o inválida`)
    } else if (a.decision !== 'mantener') {
      avisos.push(`${ref}: pendiente de ${a.decision} antes de cerrar modelo/precio`)
    }

    if (a.estadoFotos !== 'verificado') {
      bloqueosFotos.push(`${ref}: fotos en estado ${a.estadoFotos || 'ausente'}; faltan ${vistasRequeridas(a).join(', ')}`)
    }
  }

  if (exigirFotosVerificadas) errores.push(...bloqueosFotos)
  return { errores, avisos, bloqueosFotos }
}

module.exports = {
  CANALES_POR_TIPO,
  analizarSemilla,
  vistasRequeridas,
}
