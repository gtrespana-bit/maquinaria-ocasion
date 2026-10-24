/**
 * Categorías y campos técnicos de MaquinariaOcasión.
 *
 * Vertical de maquinaria de ocasión: TRES familias/categorías
 * (agrícola, obra y herramientas) con 12 subcategorías y campos técnicos
 * específicos por tipo. La familia y la categoría son la MISMA cosa: la clave
 * de `FAMILIAS` es la clave de `categoriasData` (y la que `productos.subcategoria`
 * resuelve para `productos.categoria_id`; ver `resolverCategoriaId` en
 * `src/app/api/publicar/route.ts`).
 *
 * Campos transversales en todas las subcategorías (la ficha y los filtros
 * comparten estos keys con el JSONB `productos.especificaciones`):
 * Año, Horas de uso, Combustible, Potencia (CV), Peso (kg),
 * ¿Incluye transporte?, Documentación. El Estado NO va aquí: es la columna
 * `productos.estado` con su constraint de cinco valores (Nuevo, Como nuevo,
 * Bueno, Usado, Para repuestos), coleccionada en el paso de estado de
 * `/publicar` y filtrada por `filters.condicion`.
 *
 * Las marcas y modelos de cada subcategoría NO viven aquí: se derivan del
 * catálogo maestro `@/lib/marcas` (fabricante → modelo → para qué es apto),
 * que es la fuente única de verdad de filtros, /publicar y la página /marcas.
 */

import {
  modelosDeSubcategoria,
  valoresUnicos,
  type MarcaModelo,
  type SubSlug,
} from './marcas'

export interface CatField {
  label: string
  type: 'text' | 'number' | 'select'
  placeholder: string
  options?: string[]
}

export interface CatSub {
  label: string
  icon: string
  /** Slug para URLs de SEO programático (/[provincia]/tractores). */
  slug: SubSlug
  /**
   * Marcas y modelos aptos para esta subcategoría, ya estructuradas por
   * fabricante (ver `@/lib/marcas`). El valor canónico de cada una
   * (`m.valor`) es lo que se guarda en `productos.marca`.
   */
  marcas: MarcaModelo[]
  campos: CatField[]
}

export interface CatConfig {
  label: string
  icon: string
  slug: string
  subs: CatSub[]
}

// ── Familias: el primer nivel de la taxonomía ────────────────────────────
//
// Familia === categoría: `FAMILIAS[k].key` es `categoriasData[k]` y es la
// clave que viaja en `publicar.categoria` (el API la resuelve a
// `productos.categoria_id`, auto-creando la fila si falta). La navegación de
// la UI es familias → tipos (subcategorías) → marca/modelo.

export interface Familia {
  /** Clave estable para i18n y keys de React (y clave de `categoriasData`). */
  key: string
  /** Etiqueta por defecto (es-ES); la UI puede traducirla vía `familias.<key>.label`. */
  label: string
  icon: string
  /** Slugs de los tipos (subcategorías) que agrupa. */
  subs: SubSlug[]
}

export const FAMILIAS: Familia[] = [
  {
    key: 'agricola',
    label: 'Maquinaria agrícola',
    icon: '🚜',
    subs: ['tractores', 'cosechadoras', 'maquinaria-agricola', 'ganaderia'],
  },
  {
    key: 'obra',
    label: 'Maquinaria de obra',
    icon: '🏗️',
    subs: ['excavadoras', 'cargadoras', 'compactacion', 'plataformas'],
  },
  {
    key: 'herramientas',
    label: 'Herramientas y motores',
    icon: '🔧',
    subs: ['herramienta-electrica', 'motores', 'sierra-poda', 'taller-manual'],
  },
]

/** Familia a la que pertenece un tipo (slug de subcategoría). */
export function familiaDeSub(slug: string): Familia | undefined {
  return FAMILIAS.find(f => f.subs.includes(slug as SubSlug))
}

let _anos: string[] | undefined
function aniosSelect(): string[] {
  if (!_anos) {
    const c = new Date().getFullYear()
    _anos = Array.from({ length: 30 }, (_, i) => String(c - i))
  }
  return _anos
}

// ── Catálogo de opciones de los campos de formulario ──────────────────────

/** Estado del anuncio: columna `productos.estado` (constraint de 5 valores). */
export const OPCIONES_ESTADO = [
  'Nuevo', 'Como nuevo', 'Bueno', 'Usado', 'Para repuestos',
] as const

export const OPCIONES_COMBUSTIBLE = [
  'Diésel', 'Gasolina', 'Eléctrico', 'Batería', 'Propano (LPG)', 'Híbrido',
] as const

export const OPCIONES_SI_NO = ['Sí', 'No'] as const

/** Documentación: sustituye al antiguo sello de homologación. */
export const OPCIONES_DOCUMENTACION = [
  'Factura y libro de instrucciones',
  'Declaración CE / ficha técnica',
  'Parcial',
  'Sin documentación',
] as const

// Agrícola
export const OPCIONES_TRACCION_AGRICOLA = ['4x4', '4x2', 'Sin tracción'] as const
export const OPCIONES_ENGANCHE = [
  'Tres puntos', 'Barra de tracción', 'Enganche frontal', 'Sin enganche',
] as const
export const OPCIONES_PTO = ['540 rpm', '540/1000 rpm', 'Sin PTO'] as const
export const OPCIONES_TRANSMISION_AGRICOLA = [
  'Manual', 'Hidrostática', 'CVT / variable',
] as const

// Obra
export const OPCIONES_TRACCION_OBRA = ['Oruga', 'Ruedas 4x2', 'Ruedas 4x4'] as const
export const OPCIONES_CAPACIDAD_CARGA = ['Hasta 1 t', '1 – 3 t', 'Más de 3 t'] as const
export const OPCIONES_MEDIDAS_TRANSPORTE = [
  'Hasta 2,5 m', '2,5 – 4 m', 'Más de 4 m',
] as const

// Herramientas
export const OPCIONES_POTENCIA_W = [
  'Hasta 500 W', '500 – 1.000 W', '1.000 – 2.500 W', 'Más de 2.500 W',
] as const
export const OPCIONES_TENSION = ['230 V', '400 V', 'Bivolt', 'Batería'] as const

// ── Bloques de campos reutilizables ──────────────────────────────────────

const selectDe = (opciones: readonly string[]): string[] => [...opciones]

/**
 * Transversales: presentes en TODAS las subcategorías (coinciden con las
 * claves que leen los filtros del catálogo y la ficha técnica).
 */
const camposTransversales = (): CatField[] => [
  { label: 'Año', type: 'select', placeholder: 'Selecciona...' },
  { label: 'Horas de uso', type: 'number', placeholder: 'Ej: 4500' },
  { label: 'Combustible', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_COMBUSTIBLE) },
  { label: 'Potencia (CV)', type: 'number', placeholder: 'Ej: 110' },
  { label: 'Peso (kg)', type: 'number', placeholder: 'Ej: 4200' },
  { label: '¿Incluye transporte?', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_SI_NO) },
  { label: 'Documentación', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_DOCUMENTACION) },
]

/** Específicos de la familia agrícola: tracción, enganche y toma de fuerza. */
const camposAgricola = (): CatField[] => [
  { label: 'Tracción', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_TRACCION_AGRICOLA) },
  { label: 'Enganche', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_ENGANCHE) },
  { label: 'Toma de fuerza (PTO)', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_PTO) },
  { label: 'Transmisión', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_TRANSMISION_AGRICOLA) },
]

/** Específicos de la familia de obra: tracción y logística de transporte. */
const camposObra = (): CatField[] => [
  { label: 'Tracción', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_TRACCION_OBRA) },
  { label: 'Medidas de transporte', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_MEDIDAS_TRANSPORTE) },
]

/** Específicos de herramientas: potencia eléctrica y alimentación. */
const camposHerramientas = (): CatField[] => [
  { label: 'Potencia (W)', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_POTENCIA_W) },
  { label: 'Tensión', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_TENSION) },
  { label: 'Batería incluida', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_SI_NO) },
]

const campoTipo = (tipos: string[]): CatField => ({
  label: 'Tipo', type: 'select', placeholder: 'Selecciona...', options: tipos,
})

// ── Categorías (familias) y subcategorías ────────────────────────────────

export const categoriasData: Record<string, CatConfig> = {
  agricola: {
    label: 'Maquinaria agrícola',
    icon: '🚜',
    slug: 'agricola',
    subs: [
      {
        label: 'Tractores',
        icon: '🚜',
        slug: 'tractores',
        marcas: modelosDeSubcategoria('tractores'),
        campos: [...camposTransversales(), ...camposAgricola()],
      },
      {
        label: 'Cosechadoras',
        icon: '🌾',
        slug: 'cosechadoras',
        marcas: modelosDeSubcategoria('cosechadoras'),
        campos: [
          ...camposTransversales(),
          ...camposAgricola(),
          campoTipo(['Cosechadora', 'Empacadora', 'Ensiladora']),
          { label: 'Ancho de corte (m)', type: 'number', placeholder: 'Ej: 6' },
        ],
      },
      {
        label: 'Maquinaria agrícola',
        icon: '🛠️',
        slug: 'maquinaria-agricola',
        marcas: modelosDeSubcategoria('maquinaria-agricola'),
        campos: [
          ...camposTransversales(),
          ...camposAgricola(),
          campoTipo(['Arado', 'Sembradora', 'Cultivador', 'Pulverizadora', 'Rastrillo', 'Segadora']),
          { label: 'Ancho de trabajo (m)', type: 'number', placeholder: 'Ej: 3' },
        ],
      },
      {
        label: 'Ganadería',
        icon: '🐄',
        slug: 'ganaderia',
        marcas: modelosDeSubcategoria('ganaderia'),
        campos: [
          ...camposTransversales(),
          ...camposAgricola(),
          campoTipo(['Ordenadora', 'Provocadora de celo', 'Comedero', 'Bebedero', 'Vallado']),
          { label: 'Número de puestos', type: 'number', placeholder: 'Ej: 50' },
        ],
      },
    ],
  },
  obra: {
    label: 'Maquinaria de obra',
    icon: '🏗️',
    slug: 'obra',
    subs: [
      {
        label: 'Excavadoras',
        icon: '⛏️',
        slug: 'excavadoras',
        marcas: modelosDeSubcategoria('excavadoras'),
        campos: [
          ...camposTransversales(),
          ...camposObra(),
          campoTipo(['Excavadora sobre oruga', 'Retroexcavadora', 'Miniestacadora']),
          { label: 'Profundidad máx. (m)', type: 'number', placeholder: 'Ej: 6' },
        ],
      },
      {
        label: 'Cargadoras',
        icon: '🚚',
        slug: 'cargadoras',
        marcas: modelosDeSubcategoria('cargadoras'),
        campos: [
          ...camposTransversales(),
          ...camposObra(),
          campoTipo(['Minicargadora (skid-steer)', 'Cargadora frontal', 'Telecargador']),
          { label: 'Capacidad de carga', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_CAPACIDAD_CARGA) },
        ],
      },
      {
        label: 'Compactación',
        icon: '🛞',
        slug: 'compactacion',
        marcas: modelosDeSubcategoria('compactacion'),
        campos: [
          ...camposTransversales(),
          ...camposObra(),
          campoTipo(['Rodillo', 'Apisonador', 'Miniapisonador', 'Dumper articulado']),
          { label: 'Capacidad de carga', type: 'select', placeholder: 'Selecciona...', options: selectDe(OPCIONES_CAPACIDAD_CARGA) },
        ],
      },
      {
        label: 'Plataformas elevadoras',
        icon: '🪜',
        slug: 'plataformas',
        marcas: modelosDeSubcategoria('plataformas'),
        campos: [
          ...camposTransversales(),
          ...camposObra(),
          campoTipo(['Telescópica', 'Articulada (tijera)', 'Vertical móvil', 'Rotativa']),
          { label: 'Altura máx. trabajo (m)', type: 'number', placeholder: 'Ej: 14' },
          { label: 'Capacidad de la cesta (kg)', type: 'number', placeholder: 'Ej: 250' },
        ],
      },
    ],
  },
  herramientas: {
    label: 'Herramientas y motores',
    icon: '🔧',
    slug: 'herramientas',
    subs: [
      {
        label: 'Herramienta eléctrica',
        icon: '🔌',
        slug: 'herramienta-electrica',
        marcas: modelosDeSubcategoria('herramienta-electrica'),
        campos: [
          ...camposTransversales(),
          ...camposHerramientas(),
          campoTipo(['Taladro', 'Amoladora', 'Sierra circular', 'Husillo', 'Rotomartillo', 'Multifunción']),
        ],
      },
      {
        label: 'Motores y generadores',
        icon: '⚙️',
        slug: 'motores',
        marcas: modelosDeSubcategoria('motores'),
        campos: [
          ...camposTransversales(),
          ...camposHerramientas(),
          campoTipo(['Generador', 'Grupo electrógeno', 'Compresor', 'Soldadora']),
        ],
      },
      {
        label: 'Sierra y poda',
        icon: '🌲',
        slug: 'sierra-poda',
        marcas: modelosDeSubcategoria('sierra-poda'),
        campos: [
          ...camposTransversales(),
          ...camposHerramientas(),
          campoTipo(['Motosierra', 'Desbrozadora', 'Podadora', 'Cortacésped', 'Multiherramienta']),
          { label: 'Largo de espada (cm)', type: 'number', placeholder: 'Ej: 45' },
        ],
      },
      {
        label: 'Taller manual',
        icon: '🔧',
        slug: 'taller-manual',
        marcas: modelosDeSubcategoria('taller-manual'),
        campos: [
          ...camposTransversales(),
          ...camposHerramientas(),
          campoTipo(['Juego de llaves', 'Destornilladores', 'Alicates', 'Gatas y elevación', 'Otros']),
        ],
      },
    ],
  },
}

// ── Helpers de navegación y formulario ───────────────────────────────────

/** Slugs de subcategoría de TODAS las familias, en orden de taxonomía. */
export const TODAS_LAS_SUBS: CatSub[] = Object.values(categoriasData).flatMap(c => c.subs)

/** Clave de la primera categoría: valor por defecto para entradas legadas. */
export const CATEGORIA_DEFAULT = 'agricola'

/**
 * Familia/categoría a la que pertenece una subcategoría dada por label o slug
 * (los productos guardan el label en `productos.subcategoria`).
 */
export function categoriaDeSubcategoria(subLabelOslug: string): string | undefined {
  const v = subLabelOslug.trim().toLowerCase()
  if (!v) return undefined
  for (const [key, cat] of Object.entries(categoriasData)) {
    if (cat.subs.some(s => s.label === subLabelOslug || s.slug === v)) return key
  }
  return undefined
}

/** Lista de `{label, icon, slug}` para selects de tipos de UNA familia. */
export function getSubByCategory(catKey: string): { label: string; icon: string; slug: string }[] {
  const data = categoriasData[catKey]
  if (!data) return []
  return data.subs.map(s => ({ label: s.label, icon: s.icon, slug: s.slug }))
}

/** Devuelve la subcategoría por su label dentro de una familia. */
export function getSubConfig(catKey: string, subLabel: string): CatSub | undefined {
  const data = categoriasData[catKey]
  if (!data) return undefined
  return data.subs.find(s => s.label === subLabel)
}

/** Devuelve la subcategoría por su slug dentro de una familia. */
export function getSubBySlug(catKey: string, subSlug: string): CatSub | undefined {
  const data = categoriasData[catKey]
  if (!data) return undefined
  return data.subs.find(s => s.slug === subSlug)
}

/** Lista de valores de marca únicos de una subcategoría. */
export function getMarcaOptions(catKey: string, subLabel: string): string[] {
  const sub = getSubConfig(catKey, subLabel)
  if (!sub) return []
  return valoresUnicos(sub.marcas)
}

/** true si el campo representa la marca (usa el vocabulario de marcas). */
export function esCampoMarca(campo: { label: string; type: string }): boolean {
  return campo.type === 'select' && campo.label.toLowerCase().includes('marca')
}

/** ¿Es este campo el de año de matriculación? */
export function esCampoAnio(campo: { label: string }): boolean {
  const label = campo.label.toLowerCase()
  return label === 'año' || label === 'ano' || label.includes('matriculación') || label.includes('matriculacion')
}

/**
 * Resuelve los campos de una subcategoría dejándolos listos para renderizar.
 *
 * Dos campos resuelven sus opciones dinámicamente para no repetirlas en cada
 * subcategoría:
 *  - `Año` / `Año de matriculación`: últimos 30 años.
 *  - `Marca`: hereda la lista `marcas` de la propia subcategoría.
 */
export function resolverCampos(sub: CatSub | undefined): CatField[] {
  if (!sub) return []
  return sub.campos.map(campo => {
    if (esCampoAnio(campo)) {
      return { ...campo, options: aniosSelect() }
    }
    if (esCampoMarca(campo) && !campo.options?.length) {
      return { ...campo, options: valoresUnicos(sub.marcas) }
    }
    return { ...campo, options: campo.options || [] }
  })
}

// ── Ficha técnica agrupada ───────────────────────────────────────────────

/**
 * Bloques de la ficha técnica de la página de producto. Cuatro bloques:
 * técnica, estado, documentación y logística. Las claves legadas
 * siguen listadas para que los anuncios demo antiguos mantengan su ficha
 * agrupada (la demo se elimina en la Fase 4).
 */
export const GRUPOS_FICHA_TECNICA: { titulo: string; icon: string; campos: string[] }[] = [
  {
    titulo: 'Ficha técnica',
    icon: '🔧',
    campos: [
      // Transversales de la taxonomía de maquinaria
      'Año',
      'Horas de uso',
      'Combustible',
      'Potencia (CV)',
      'Potencia (W)',
      'Tensión',
      'Peso (kg)',
      'Tracción',
      'Enganche',
      'Toma de fuerza (PTO)',
      'Transmisión',
      'Capacidad de carga',
      'Capacidad de la cesta (kg)',
      'Medidas de transporte',
      'Batería incluida',
      'Tipo',
      'Ancho de corte (m)',
      'Ancho de trabajo (m)',
      'Profundidad máx. (m)',
      'Altura máx. trabajo (m)',
      'Largo de espada (cm)',
      'Número de puestos',
      // Claves legadas de anuncios antiguos (demo)
      'Kilómetros',
      'Kilometraje (km)',
      'Año de matriculación',
      'MMA / Peso máximo autorizado',
      'Longitud exterior',
      'Altura exterior',
      'Tamaño chasis',
      'Plazas homologadas para viajar',
      'Plazas para dormir',
      'Calefacción estacionaria',
      'Agua caliente',
      'Baño / Ducha',
      'Depósito agua limpia (litros)',
      'Batería auxiliar',
      'Placa solar',
      'Placa solar (watios)',
      'Inversor 220V',
      'Inversor 220V (watios)',
      'Nevera',
      'Distintivo Ambiental DGT',
      'Homologación',
    ],
  },
  {
    titulo: 'Estado',
    icon: '✅',
    campos: ['Estado'],
  },
  {
    titulo: 'Documentación',
    icon: '📄',
    campos: ['Documentación'],
  },
  {
    titulo: 'Logística',
    icon: '🚚',
    campos: ['¿Incluye transporte?'],
  },
]

/**
 * Devuelve los bloques con solo campos presentes, y su valor.
 * @param specs objeto de especificaciones del producto (JSONB). Incluye
 * `Estado` cuando el llamante fusiona la columna `productos.estado`.
 */
export function agruparFichaTecnica(
  specs: Record<string, string | number | undefined> | null | undefined
): { titulo: string; icon: string; campos: string[]; filas: [string, string | number][] }[] {
  if (!specs) return []
  const grupos: { titulo: string; icon: string; campos: string[]; filas: [string, string | number][] }[] = []
  for (const g of GRUPOS_FICHA_TECNICA) {
    const filas: [string, string | number][] = []
    for (const c of g.campos) {
      const v = specs[c]
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        filas.push([c, v])
      }
    }
    if (filas.length > 0) {
      grupos.push({ titulo: g.titulo, icon: g.icon, campos: g.campos, filas })
    }
  }
  return grupos
}

/**
 * Campos extra (no listados en `GRUPOS_FICHA_TECNICA`), ordenados de forma
 * estable por clave. Se muestran en un bloque aparte bajo "Especificaciones".
 */
export function camposFichaExtras(
  specs: Record<string, string | number | undefined> | null | undefined
): [string, string | number][] {
  if (!specs) return []
  const conocidos = new Set(GRUPOS_FICHA_TECNICA.flatMap(g => g.campos))
  return Object.entries(specs)
    .filter((entry): entry is [string, string | number] =>
      !conocidos.has(entry[0]) && entry[1] !== undefined && entry[1] !== null && String(entry[1]).trim() !== ''
    )
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
}
