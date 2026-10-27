#!/usr/bin/env node
/**
 * Verificación del sitemap en producción (sin dependencias).
 *
 *   node scripts/verificar-sitemap.mjs
 *   node scripts/verificar-sitemap.mjs --muestra 25
 *   node scripts/verificar-sitemap.mjs --base https://maquinaria.click
 *
 * Comprueba lo mismo que mira Google antes de aceptar un sitemap en Search
 * Console:
 *   1. /sitemap.xml y /sitemap-images.xml responden 200 con content-type XML.
 *   2. El XML abre y cierra bien, y hay al menos una <loc>.
 *   3. Todas las URLs usan el host canónico, https y no cuelan /en (noindex).
 *   4. No hay <loc> duplicadas (Google descarta las repetidas).
 *   5. robots.txt anuncia ambos sitemaps.
 *   6. Una muestra de URLs del sitemap devuelve 200 (no 404/301/500).
 */
const args = process.argv.slice(2)
const valor = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}

const BASE = (valor('--base') || 'https://maquinaria.click').replace(/\/$/, '')
const MUESTRA = Number(valor('--muestra') || 10)
const HOST = new URL(BASE).hostname

const SITEMAPS = ['/sitemap.xml', '/sitemap-images.xml']

let problemas = 0
const ok = (msg) => console.log(`  ✅ ${msg}`)
const mal = (msg) => {
  problemas += 1
  console.log(`  ❌ ${msg}`)
}

async function obtener(url, opciones = {}) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)', ...opciones.headers },
    ...opciones,
  })
  return res
}

function locsDe(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
}

console.log(`\nRevisando ${BASE}\n`)

const todas = []

for (const ruta of SITEMAPS) {
  const url = `${BASE}${ruta}`
  console.log(url)

  let res
  try {
    res = await obtener(url)
  } catch (error) {
    mal(`no se pudo conectar: ${error.message}`)
    continue
  }

  const tipo = res.headers.get('content-type') || ''
  const xml = await res.text()

  if (res.status === 200) ok(`HTTP 200 (${tipo || 'sin content-type'})`)
  else mal(`HTTP ${res.status} — Google lo marcará como «no se ha podido obtener»`)

  if (/xml/i.test(tipo)) ok('content-type XML')
  else mal(`content-type «${tipo}»: Google espera XML`)

  if (/^\s*<\?xml/.test(xml) || /^\s*<urlset/.test(xml)) ok('empieza como XML, no como HTML')
  else mal('no empieza por <?xml ni <urlset>: parece una página HTML')

  if (xml.includes('<urlset') && xml.trimEnd().endsWith('</urlset>')) ok('<urlset> cerrado correctamente')
  else mal('el <urlset> no está cerrado')

  const locs = locsDe(xml)
  if (locs.length > 0) ok(`${locs.length} URLs`)
  else mal('sin <loc>: un sitemap vacío no se considera válido')

  const duplicadas = locs.filter((loc, i) => locs.indexOf(loc) !== i)
  if (duplicadas.length === 0) ok('sin URLs duplicadas')
  else mal(`${duplicadas.length} URLs duplicadas (p. ej. ${duplicadas[0]})`)

  const ajenas = locs.filter((loc) => {
    try {
      const u = new URL(loc)
      return u.hostname !== HOST || u.protocol !== 'https:'
    } catch {
      return true
    }
  })
  if (ajenas.length === 0) ok(`todas las URLs son https://${HOST}`)
  else mal(`${ajenas.length} URLs de otro host o sin https (p. ej. ${ajenas[0]})`)

  const ingles = locs.filter((loc) => /\/en(\/|$)/.test(new URL(loc).pathname))
  if (ingles.length === 0) ok('sin URLs /en (llevan noindex)')
  else mal(`${ingles.length} URLs /en en el sitemap`)

  todas.push(...locs)
}

// robots.txt debe anunciar los sitemaps
console.log(`${BASE}/robots.txt`)
try {
  const resRobots = await obtener(`${BASE}/robots.txt`)
  const robots = await resRobots.text()
  if (resRobots.status !== 200) mal(`HTTP ${resRobots.status}`)
  else ok('HTTP 200')
  for (const ruta of SITEMAPS) {
    if (robots.includes(`${BASE}${ruta}`)) ok(`anuncia ${ruta}`)
    else mal(`no anuncia ${ruta}`)
  }
  if (/^Disallow: \/$/m.test(robots)) mal('robots.txt bloquea todo el sitio')
} catch (error) {
  mal(`no se pudo leer robots.txt: ${error.message}`)
}

// Muestra de URLs: que existan de verdad (un 404/500 en masa tira el sitemap)
if (todas.length > 0 && MUESTRA > 0) {
  const unicas = [...new Set(todas)]
  const muestra = []
  const paso = Math.max(1, Math.floor(unicas.length / MUESTRA))
  for (let i = 0; i < unicas.length && muestra.length < MUESTRA; i += paso) muestra.push(unicas[i])

  console.log(`\nMuestra de ${muestra.length} URLs del sitemap`)
  for (const url of muestra) {
    try {
      const res = await obtener(url, { method: 'GET' })
      const destino = res.url !== url ? ` → ${res.url}` : ''
      if (res.status === 200) ok(`${url}${destino}`)
      else mal(`${res.status} ${url}${destino}`)
    } catch (error) {
      mal(`${url}: ${error.message}`)
    }
  }
}

console.log(
  problemas === 0
    ? '\nTodo correcto: el sitemap es válido y accesible. Si Search Console sigue mostrando error, pulsa «Solicitar nueva indexación» o elimina y vuelve a enviar el sitemap.\n'
    : `\n${problemas} problema(s) detectado(s).\n`,
)

process.exit(problemas === 0 ? 0 : 1)
