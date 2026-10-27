// Herramienta de desarrollo: captura pantallas del sitio local con Chromium
// empaquetado (@sparticuz/chromium) para revisar el diseño sin navegador.
// Uso: node scripts/shot.mjs <url> <salida.png> [ancho] [alto] [fullPage]
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const [, , url = 'http://localhost:3000/', out = '/tmp/shot.png', w = '1440', h = '1000', full = '1'] = process.argv
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: Number(w), height: Number(h), deviceScaleFactor: 1 },
  executablePath: await chromium.executablePath(),
  headless: true,
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
await page.evaluate(async () => {
  await new Promise((res) => {
    let y = 0
    const step = () => {
      y += 500
      window.scrollTo(0, y)
      if (y < document.body.scrollHeight) setTimeout(step, 60)
      else { window.scrollTo(0, 0); setTimeout(res, 400) }
    }
    step()
  })
})
await new Promise((r) => setTimeout(r, 900))
await page.screenshot({ path: out, fullPage: full !== '0' })
if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.slice(0, 15).join('\n'))
await browser.close()
