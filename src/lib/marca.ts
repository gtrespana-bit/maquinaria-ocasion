/**
 * Identidad de MaquinariaOcasión en UN SOLO sitio.
 *
 * El nombre, dominio, correos y
 * paleta viven aquí para no escribirlos a mano en 125 ficheros. Antes y
 * paleta viven juntos, y `src/lib/seo.ts` reexporta `SITE_URL` y
 * `NOMBRE_SITIO` desde este módulo para no tocar las páginas que ya los usan.
 *
 * Si algún día se extrae esto a un paquete compartido entre verticales, este
 * es el fichero que hay que mover.
 */

export const MARCA = {
  nombre: 'MaquinariaOcasión',
  nombreSinAcento: 'MaquinariaOcasion',
  /** El logo pinta el nombre en dos colores: base + acento. */
  partes: { base: 'Maquinaria', acento: 'Ocasión' },
  /** Identificador en minúsculas y sin acentos: dominios, caches, slugs. */
  token: 'maquinariaocasion',
  slug: 'maquinaria-ocasion',
  dominio: 'maquinaria.click',
  url: 'https://maquinaria.click',
  emailSoporte: 'soporte@maquinaria.click',
  emailPrivacidad: 'privacidad@maquinaria.click',
  logo: '/logo-maquinariaocasion.png',
  vertical: 'maquinaria',
  etiquetaVertical: 'Maquinaria agrícola, de obra y herramientas de ocasión',
  /** Copy de SEO básico de la portada (el resto de textos, en los diccionarios). */
  seo: {
    descripcion:
      "Marketplace especializado en maquinaria agrícola, maquinaria de obra y herramientas de segunda mano en España. Anuncios con precio, fotos y ficha técnica. Publica gratis.",
    descripcionCorta: "Marketplace especializado en maquinaria agrícola, de obra y herramientas de segunda mano en España. Publica gratis.",
    keywords: [
      "maquinaria agrícola segunda mano",
      "maquinaria de obra de ocasión",
      "tractores de segunda mano",
      "miniexcavadora usada",
      "herramientas de segunda mano",
      "maquinaria usada España",
      "aperos agrícolas ocasión",
      "maquinaria de construcción usada",
    ],
  },
  colores: {
    primary: '#0F172A',
    dark: '#1E293B',
    accent: '#F59E0B',
    accentDark: '#B45309',
    accentLight: '#FCD34D',
    orange: '#EA580C',
    orangeDark: '#C2410C',
    gray: '#F5F5F5',
    darkNav: '#0B1120',
  },
} as const

/** ¿El correo pertenece al dominio de la marca? Útil para filtrar avisos internos. */
export function esEmailDeLaMarca(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${MARCA.dominio}`)
}
