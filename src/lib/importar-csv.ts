/**
 * Importación de stock desde CSV.
 *
 * El caso real: un compraventa tiene el stock en su DMS o en un Excel y
 * publicar 14 máquinas a mano son 14 formularios de cuatro pasos. Esto es lo
 * que convierte el plan Profesional en algo que se paga solo.
 *
 * El módulo es puro a propósito: parsear un CSV y decidir si una fila es
 * válida son las dos cosas donde un error cuesta caro (un anuncio con el
 * precio mal, o peor, 40 anuncios a medias). Se prueba con texto fijo, sin base
 * de datos ni navegador.
 *
 * Decisiones:
 *  · Acepta `;` y `,` como separador (Excel en español usa `;`, los exports
 *    de Google Sheets y la mayoría de APIs usan `,`) y tabuladores al pegar
 *    desde una hoja de cálculo.
 *  · Las cabeceras se reconocen por alias, ignorando mayúsculas, acentos y
 *    espacios: `Título`, `titulo`, `title`, `Nombre` valen lo mismo.
 *  · Una fila inválida NO tumba la importación: se informa del error y se
 *    importan las buenas. Importar 13 de 14 es mejor que no importar ninguna.
 *  · Nada de borrar ni actualizar anuncios existentes: solo altas. Un CSV
 *    reimportado duplicaría, así que la UI lo avisa.
 */
import { COMUNIDADES_AUTONOMAS } from '@/lib/ubicaciones'
import { TODAS_LAS_SUBS } from '@/lib/categorias'

export const MAX_FILAS = 100

export type CampoImport =
  | 'titulo'
  | 'descripcion'
  | 'precio'
  | 'marca'
  | 'modelo'
  | 'estado'
  | 'subcategoria'
  | 'ubicacion_estado'
  | 'ubicacion_ciudad'
  | 'imagenes'
  | 'anio'
  | 'horas'

interface DefinicionCampo {
  campo: CampoImport
  etiqueta: string
  obligatorio?: boolean
  alias: string[]
}

/**
 * Cabeceras reconocidas. El orden es el de la plantilla.
 * Añadir un alias aquí es todo lo que hace falta para aceptar otro export.
 */
export const CAMPOS: DefinicionCampo[] = [
  { campo: 'titulo', etiqueta: 'Título', obligatorio: true, alias: ['titulo', 'title', 'nombre', 'anuncio'] },
  { campo: 'precio', etiqueta: 'Precio', obligatorio: true, alias: ['precio', 'price', 'precio-eur', 'precio-euros', 'importe', 'pvp'] },
  {
    campo: 'subcategoria',
    etiqueta: 'Tipo',
    obligatorio: true,
    alias: ['subcategoria', 'tipo', 'categoria', 'type', 'carroceria', 'familia'] },
  { campo: 'ubicacion_estado', etiqueta: 'Comunidad', obligatorio: true, alias: ['comunidad', 'provincia', 'region', 'ccaa', 'comunidad-autonoma', 'ubicacion-estado'] },
  { campo: 'ubicacion_ciudad', etiqueta: 'Ciudad', alias: ['ciudad', 'municipio', 'localidad', 'city'] },
  { campo: 'marca', etiqueta: 'Marca', alias: ['marca', 'brand', 'fabricante'] },
  { campo: 'modelo', etiqueta: 'Modelo', alias: ['modelo', 'model'] },
  // «Estado» es la condición del bien, no la comunidad: en un CSV de
  // compraventa es lo que significa el 95 % de las veces.
  { campo: 'estado', etiqueta: 'Estado', alias: ['estado', 'condicion', 'condition', 'estado-producto'] },
  { campo: 'anio', etiqueta: 'Año', alias: ['ano', 'año', 'anio-matriculacion', 'year', 'matriculacion'] },
  { campo: 'horas', etiqueta: 'Horas de uso', alias: ['horas', 'horas-de-uso', 'hours', 'horas-maquina'] },
  { campo: 'descripcion', etiqueta: 'Descripción', alias: ['descripcion', 'description', 'detalles', 'observaciones'] },
  { campo: 'imagenes', etiqueta: 'Fotos', alias: ['imagenes', 'fotos', 'images', 'urls', 'foto-1'] },
]

/** Estados que acepta la columna `estado` de `productos`. */
export const ESTADOS_PRODUCTO = ['Nuevo', 'Como nuevo', 'Bueno', 'Usado', 'Para repuestos'] as const

/**
 * Tipos válidos de la taxonomía de maquinaria: cada subcategoría acepta su
 * label oficial, su slug y los alias frecuentes (singular, forma corta…).
 * El valor canónico que se guarda es el LABEL (la misma convención que
 * `/publicar` y `productos.subcategoria`).
 */
const SUBCATEGORIAS: { label: string; etiquetas: string[] }[] = TODAS_LAS_SUBS.map(sub => ({
  label: sub.label,
  etiquetas: [
    sub.label.toLowerCase(),
    sub.slug,
    ...(
      {
        'tractores': ['tractor'],
        'cosechadoras': ['cosechadora'],
        'maquinaria-agricola': ['maquinaria auxiliar', 'aperos'],
        'ganaderia': ['ganaderia y ganadería', 'ganadería'],
        'excavadoras': ['excavadora', 'retroexcavadora'],
        'cargadoras': ['cargadora', 'minicargadora', 'telecargador'],
        'compactacion': ['compactación', 'rodillo', 'apisonador', 'dumper'],
        'plataformas': ['plataforma', 'plataforma elevadora', 'manlift'],
        'herramienta-electrica': ['herramienta electrica', 'taladro', 'amoladora'],
        'motores': ['generador', 'grupo electrógeno', 'compresor', 'soldadora'],
        'sierra-poda': ['motosierra', 'desbrozadora', 'sierra y poda', 'poda'],
        'taller-manual': ['taller', 'utillaje'] } as Record<string, string[]>
    )[sub.slug] ?? [],
  ] }))

// ── Utilidades de texto ────────────────────────────────────────────────────

/** Minúsculas, sin acentos, sin espacios de sobra. Para comparar cabeceras. */
export function normalizarClave(valor: string): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\s_]+/g, '-')
}

function sinAcentos(valor: string): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Parser CSV ─────────────────────────────────────────────────────────────

export interface CsvParseado {
  cabeceras: string[]
  filas: string[][]
  separador: string
}

/**
 * Parser RFC 4180 mínimo: comillas dobles, comillas escapadas (`""`), saltos
 * de línea dentro de comillas y CRLF. Sin dependencias.
 */
export function parseCsv(texto: string, maxFilas: number = MAX_FILAS): CsvParseado {
  const limpio = String(texto ?? '').replace(/^\uFEFF/, '')
  const separador = detectarSeparador(limpio)
  const filas: string[][] = []
  let campo = ''
  let fila: string[] = []
  let entreComillas = false
  let i = 0

  const cerrarCampo = () => {
    fila.push(campo)
    campo = ''
  }
  const cerrarFila = () => {
    cerrarCampo()
    // Ignorar líneas vacías (una coma suelta al final del archivo, por ejemplo).
    if (fila.some((c) => c.trim() !== '')) filas.push(fila)
    fila = []
  }

  while (i < limpio.length) {
    const c = limpio[i]

    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"'
          i += 2
          continue
        }
        entreComillas = false
        i++
        continue
      }
      campo += c
      i++
      continue
    }

    if (c === '"' && campo.trim() === '') {
      entreComillas = true
      campo = ''
      i++
      continue
    }
    if (c === separador) {
      cerrarCampo()
      i++
      continue
    }
    if (c === '\n' || c === '\r') {
      cerrarFila()
      if (c === '\r' && limpio[i + 1] === '\n') i++
      i++
      continue
    }
    campo += c
    i++
  }

  // Última fila sin salto final.
  if (campo !== '' || fila.length > 0) cerrarFila()

  const [cabecera = [], ...resto] = filas
  return {
    cabeceras: cabecera.map((h) => h.trim()),
    filas: resto.slice(0, maxFilas),
    separador }
}

/** Elige el separador contando los candidatos en la primera línea. */
function detectarSeparador(texto: string): string {
  const primera = texto.split(/\r?\n/, 1)[0] || ''
  const cuenta = (ch: string) => {
    let n = 0
    let comillas = false
    for (const c of primera) {
      if (c === '"') comillas = !comillas
      else if (!comillas && c === ch) n++
    }
    return n
  }
  const opciones: [string, number][] = [
    [';', cuenta(';')],
    [',', cuenta(',')],
    ['\t', cuenta('\t')],
  ]
  opciones.sort((a, b) => b[1] - a[1])
  return opciones[0][1] > 0 ? opciones[0][0] : ','
}

// ── Mapeo de cabeceras ─────────────────────────────────────────────────────

export interface MapaColumnas {
  /** campo → índice de columna. */
  indices: Partial<Record<CampoImport, number>>
  /** Cabeceras que no se han reconocido (se ignoran sin romper). */
  desconocidas: string[]
  /** Campos obligatorios que faltan en el CSV. */
  faltan: string[]
  /** Posición → nombre del campo, para errores legibles. */
  etiquetas: Partial<Record<CampoImport, string>>
}

export function mapearColumnas(cabeceras: string[]): MapaColumnas {
  const indices: Partial<Record<CampoImport, number>> = {}
  const etiquetas: Partial<Record<CampoImport, string>> = {}
  const desconocidas: string[] = []

  cabeceras.forEach((cabecera, i) => {
    const clave = normalizarClave(cabecera)
    const def = CAMPOS.find(
      (c) => c.alias.includes(clave) || normalizarClave(c.etiqueta) === clave,
    )
    if (def && indices[def.campo] === undefined) {
      indices[def.campo] = i
      etiquetas[def.campo] = cabecera
    } else if (cabecera.trim()) {
      desconocidas.push(cabecera.trim())
    }
  })

  const faltan = CAMPOS.filter((c) => c.obligatorio && indices[c.campo] === undefined).map(
    (c) => c.etiqueta,
  )

  return { indices, desconocidas, faltan, etiquetas }
}

// ── Normalización de valores ───────────────────────────────────────────────

/**
 * Convierte lo que escribe un humano en euros: «38.500 €», «38500», «38.500,50».
 *
 * El truco está en no confundir el punto de millar español (38.500 = 38500)
 * con el decimal inglés (38.50 = 38,5). Si hay coma, la coma es decimal y los
 * puntos son miles. Si solo hay puntos, se decide por el patrón de grupos.
 */
export function parsearPrecio(valor: string | number | null | undefined): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor > 0 ? valor : null
  let s = String(valor ?? '').trim()
  if (!s) return null
  s = s.replace(/[€$£]|\bEUR\b|\beur\b|\beuros?\b/gi, '').replace(/\s/g, '')
  if (!s) return null

  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '')
  }

  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}

/** Normaliza el estado del bien a la forma que guarda la base de datos. */
export function normalizarEstado(valor: string | null | undefined): string | null {
  const v = sinAcentos(String(valor ?? ''))
  if (!v) return null
  if (v === 'nuevo' || v === 'new' || v === 'a estrenar') return 'Nuevo'
  if (v.startsWith('como nuevo') || v === 'seminuevo' || v === 'like new') return 'Como nuevo'
  if (v === 'bueno' || v === 'good' || v === 'buen estado') return 'Bueno'
  if (v === 'usado' || v === 'used' || v === 'segunda mano') return 'Usado'
  if (v.includes('repuesto') || v.includes('siniestro')) return 'Para repuestos'
  return null
}

/** Devuelve el label oficial de subcategoría o null si no se reconoce. */
export function normalizarSubcategoria(valor: string | null | undefined): string | null {
  const v = sinAcentos(String(valor ?? '').trim())
  if (!v) return null
  const normalizado = v.replace(/\s+/g, ' ')
  const conGuiones = normalizado.replace(/\s+/g, '-')
  const encontrada = SUBCATEGORIAS.find((s) =>
    s.etiquetas.some((e) => {
      const eNorm = sinAcentos(e)
      return eNorm === normalizado || eNorm === conGuiones || eNorm.replace(/\s+/g, '-') === conGuiones
    })
  )
  return encontrada?.label ?? null
}

/** Comunidad autónoma canónica (con sus tildes) a partir de lo que venga. */
export function normalizarComunidad(valor: string | null | undefined): string | null {
  const v = sinAcentos(String(valor ?? ''))
  if (!v) return null
  const encontrada = COMUNIDADES_AUTONOMAS.find((c) => sinAcentos(c) === v)
  if (encontrada) return encontrada
  // Alias frecuentes en exports.
  if (v === 'comunidad valenciana' || v === 'valencia') return 'Comunitat Valenciana'
  if (v === 'pais vasco' || v === 'euskadi') return 'País Vasco'
  if (v === 'madrid' || v === 'comunidad de madrid') return 'Madrid'
  if (v === 'asturias' || v === 'principado de asturias') return 'Asturias'
  if (v === 'navarra' || v === 'comunidad foral de navarra') return 'Navarra'
  if (v === 'la rioja' || v === 'rioja') return 'La Rioja'
  if (v === 'castilla y leon' || v === 'castilla-leon') return 'Castilla y León'
  if (v === 'castilla la mancha' || v === 'castilla-la mancha') return 'Castilla-La Mancha'
  return null
}

/** Separa las URLs de fotos: admite `|`, saltos de línea o espacios. */
export function separarImagenes(valor: string | null | undefined): string[] {
  return String(valor ?? '')
    .split(/[|\n]+/)
    .map((u) => u.trim())
    .filter(Boolean)
}

/**
 * Solo https: una imagen http rompería el candado del navegador (contenido
 * mixto). No se exige extensión porque los CDN de los DMS (Cloudinary,
 * Shopify, AWS) sirven URLs sin `.jpg` y son perfectamente válidas.
 */
export function esImagenValida(url: string): boolean {
  if (!/^https:\/\//i.test(url)) return false
  if (url.length > 500) return false
  // Descartar lo que claramente no es una URL de imagen.
  return !/\s/.test(url)
}

// ── Validación por fila ────────────────────────────────────────────────────

export interface FilaImportada {
  /** Número de línea del CSV (la cabecera es la 1). */
  linea: number
  titulo: string
  descripcion: string | null
  precio: number | null
  marca: string | null
  modelo: string | null
  estado: string | null
  subcategoria: string | null
  ubicacion_estado: string | null
  ubicacion_ciudad: string | null
  imagenes: string[]
  especificaciones: Record<string, string>
  errores: string[]
  avisos: string[]
}

export interface ResultadoImportacion {
  filas: FilaImportada[]
  validas: number
  invalidas: number
  /** Filas descartadas por encima del tope de seguridad. */
  recortadas: number
}

export function validarImportacion(
  csv: CsvParseado,
  opts: { maxFotos?: number; maxFilas?: number } = {},
): ResultadoImportacion & { mapa: MapaColumnas } {
  const mapa = mapearColumnas(csv.cabeceras)
  const maxFotos = Math.max(1, Number(opts.maxFotos) || 10)
  const maxFilas = Math.max(1, Number(opts.maxFilas) || MAX_FILAS)

  const filas: FilaImportada[] = []
  const recortadas = Math.max(0, csv.filas.length - maxFilas)

  csv.filas.slice(0, maxFilas).forEach((celdas, i) => {
    const valor = (campo: CampoImport): string => {
      const idx = mapa.indices[campo]
      return idx === undefined ? '' : String(celdas[idx] ?? '').trim()
    }

    const errores: string[] = []
    const avisos: string[] = []

    const titulo = valor('titulo').slice(0, 100)
    if (titulo.length < 3) errores.push('El título necesita al menos 3 caracteres.')
    if (valor('titulo').length > 100) avisos.push('El título se ha recortado a 100 caracteres.')

    const precio = parsearPrecio(valor('precio'))
    if (precio == null) errores.push('El precio no es un número válido (ej.: 38.500).')
    else if (precio > 5_000_000) errores.push('El precio supera el máximo permitido.')

    const subcategoria = normalizarSubcategoria(valor('subcategoria'))
    if (!subcategoria) {
      errores.push(
        'El tipo no se reconoce. Usa Tractores, Cosechadoras, Maquinaria agrícola, Ganadería, Excavadoras, Cargadoras, Compactación, Plataformas, Herramienta eléctrica, Motores, Sierra y poda o Taller manual.',
      )
    }

    const ubicacionEstado = normalizarComunidad(valor('ubicacion_estado'))
    if (!ubicacionEstado) errores.push('La comunidad no se reconoce (ej.: Comunitat Valenciana).')

    const estadoBruto = valor('estado')
    const estado = normalizarEstado(estadoBruto)
    if (estadoBruto && !estado) {
      avisos.push(`Estado «${estadoBruto}» no reconocido: se guarda sin estado.`)
    }

    const anioBruto = valor('anio').replace(/[^\d]/g, '')
    const anio = anioBruto ? Number(anioBruto) : null
    const anioMax = new Date().getFullYear() + 1
    if (anio != null && (anio < 1950 || anio > anioMax)) {
      avisos.push(`Año ${anio} fuera de rango: no se guarda.`)
    }

    const horasBruto = valor('horas').replace(/[^\d]/g, '')
    const horas = horasBruto ? Number(horasBruto) : null
    if (horas != null && horas > 1_000_000) avisos.push('Horas de uso poco creíbles: no se guardan.')

    const imagenesTodas = separarImagenes(valor('imagenes'))
    const imagenesValidas = imagenesTodas.filter(esImagenValida)
    const descartadas = imagenesTodas.length - imagenesValidas.length
    if (descartadas > 0) {
      avisos.push(`${descartadas} foto(s) descartada(s): solo se aceptan URLs https:// de imagen.`)
    }
    const imagenes = imagenesValidas.slice(0, maxFotos)
    if (imagenesValidas.length > maxFotos) {
      avisos.push(`Tu plan permite ${maxFotos} fotos por anuncio: se usarán las primeras.`)
    }

    const especificaciones: Record<string, string> = {}
    if (anio != null && anio >= 1950 && anio <= anioMax) {
      // Clave canónica del registro de maquinaria (el filtro anioMin lee
      // 'Año' y las claves legadas vía COALESCE).
      especificaciones['Año'] = String(anio)
    }
    if (horas != null && horas <= 1_000_000) especificaciones['Horas de uso'] = String(horas)

    filas.push({
      linea: i + 2,
      titulo,
      descripcion: valor('descripcion').slice(0, 5000) || null,
      precio,
      marca: valor('marca').slice(0, 60) || null,
      modelo: valor('modelo').slice(0, 60) || null,
      estado,
      subcategoria,
      ubicacion_estado: ubicacionEstado,
      ubicacion_ciudad: valor('ubicacion_ciudad').slice(0, 50) || null,
      imagenes,
      especificaciones,
      errores,
      avisos })
  })

  const invalidas = filas.filter((f) => f.errores.length > 0).length
  return {
    filas,
    validas: filas.length - invalidas,
    invalidas,
    recortadas,
    mapa }
}

/**
 * Plantilla descargable. Incluye dos ejemplos: uno completo y otro mínimo,
 * para que se vea qué es obligatorio sin leer la documentación.
 */
export function plantillaCsv(): string {
  return [
    'Titulo;Precio;Tipo;Comunidad;Ciudad;Marca;Modelo;Estado;Año;Horas de uso;Fotos;Descripción',
    'Kubota M7 tractor agrícola;48500;Tractores;Comunitat Valenciana;Valencia;Kubota;M7;Usado;2018;4200;https://ejemplo.com/foto1.jpg|https://ejemplo.com/foto2.jpg;Tractor con 4.200 horas, enganche tres puntos y PTO 540/1000.',
    'Caterpillar 320 excavadora;95000;Excavadoras;Madrid;Madrid;Caterpillar;320;Usado;2017;9800;;Excavadora sobre oruga de 20 t con martillo hidráulico y documentación CE.',
  ].join('\r\n')
}
