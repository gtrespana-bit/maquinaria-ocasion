#!/usr/bin/env node
/**
 * Envío manual a IndexNow (Bing, Yandex, Seznam, Naver…).
 *
 *   node scripts/indexnow.mjs --sitemap            # todas las URLs del sitemap
 *   node scripts/indexnow.mjs --sitemap --dry-run  # solo enseña el payload
 *   node scripts/indexnow.mjs --url https://maquinaria.click/producto/mi-anuncio
 *   node scripts/indexnow.mjs --desde 2026-10-01 --sitemap
 *
 * Por defecto NO envía en dry-run: hay que pasar `--enviar` para que salga la
 * petición (así un comando copiado por error no avisa a los buscadores).
 *
 * Uso normal tras desplegar: `node scripts/indexnow.mjs --sitemap --enviar`
 * y, a partir de ahí, el aviso sale solo al publicar (ver src/lib/indexnow.ts).
 */
const HOST = 'maquinaria.click'
const BASE = `https://${HOST}`
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS = 10000

const args = process.argv.slice(2)
const tiene = (flag) => args.includes(flag)
const valor = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}

const clave = (valor('--key') || process.env.INDEXNOW_KEY || '76e0410c624a49c890a8f681cbeb8da8').trim()
const enviar = tiene('--enviar')
const desde = valor('--desde') ? new Date(valor('--desde')) : undefined

function urlsDeSitemap(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
}

function filtrar(urls) {
  const vistas = new Set()
  const salida = []
  for (const url of urls) {
    let parsed
    try {
      parsed = new URL(url)
    } catch {
      continue
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== HOST) continue
    if (/^\/(en)(\/|$)/.test(parsed.pathname)) continue
    if (vistas.has(url)) continue
    vistas.add(url)
    salida.push(url)
  }
  return salida
}

async function main() {
  let urls = args.filter((a) => a.startsWith('https://'))

  if (tiene('--sitemap')) {
    const res = await fetch(`${BASE}/sitemap.xml`)
    if (!res.ok) throw new Error(`sitemap.xml devolvió HTTP ${res.status}`)
    urls = urls.concat(urlsDeSitemap(await res.text()))
  }

  urls = filtrar(urls)
  if (desde) {
    // Solo tiene sentido si las URLs llevan fecha (las del sitemap no la llevan
    // en la ruta); se avisa para no dar una falsa sensación de filtrado.
    console.warn('⚠️  --desde no filtra URLs del sitemap: el filtro por fecha vive en el cron (/api/cron/indexnow).')
  }

  if (urls.length === 0) {
    console.error('No hay URLs que enviar. Usa --sitemap o pasa URLs https://' + HOST + '/…')
    process.exit(1)
  }

  const lotes = []
  for (let i = 0; i < urls.length; i += MAX_URLS) lotes.push(urls.slice(i, i + MAX_URLS))

  console.log(`\n${urls.length} URL(s) para ${HOST} en ${lotes.length} petición(es)`)
  console.log(`Clave: ${clave}\n`)

  for (const [i, lote] of lotes.entries()) {
    const payload = {
      host: HOST,
      key: clave,
      keyLocation: `${BASE}/${clave}.txt`,
      urlList: lote }

    if (!enviar) {
      console.log(`[dry-run] lote ${i + 1}:`, JSON.stringify(payload, null, 2))
      continue
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload) })

    const estado =
      res.status === 200 || res.status === 202 ? '✅' : res.status === 429 ? '⏳' : '❌'
    console.log(`${estado} lote ${i + 1}: HTTP ${res.status} (${lote.length} URLs)`)
    if (res.status === 403) console.log('   La clave no coincide con el fichero de la raíz.')
    if (res.status === 422) console.log('   Alguna URL no pertenece al host o la clave no encaja.')
  }

  if (!enviar) console.log('\nNada enviado (dry-run). Añade --enviar para hacerlo de verdad.\n')
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
