// Capturas por tramos de viewport (fiel a lo que ve el usuario) para revisar
// el diseño sin navegador. Uso: node scripts/shots.mjs <url> <prefijo> [ancho] [alto] [tramos]
//
// Dependencias fuera del package.json (son solo para revisión local):
//   npm i -D puppeteer-core @sparticuz/chromium
// En Linux mínimo hace falta además las libs de Chromium; en este entorno:
//   LD_LIBRARY_PATH=/tmp/al2023:/tmp/al2023/lib node scripts/shots.mjs ...
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const [, , url = 'http://localhost:3000/', prefix = '/tmp/shot', w = '1440', h = '1000', tramos = '8'] = process.argv
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: Number(w), height: Number(h), deviceScaleFactor: 1 },
  executablePath: await chromium.executablePath(),
  headless: true,
})
const page = await browser.newPage()
const errs = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e)))
await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
await new Promise((r) => setTimeout(r, 1200))
const total = await page.evaluate(() => document.documentElement.scrollHeight)
const step = Number(h) - 80
const n = Math.min(Number(tramos), Math.ceil(total / step))
for (let i = 0; i < n; i++) {
  const y = i * step
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await new Promise((r) => setTimeout(r, 900))
  await page.screenshot({ path: `${prefix}-${String(i).padStart(2, '0')}.png` })
}
console.log(`height=${total} shots=${n} w=${w}`)
if (errs.length) console.log('ERRORS:\n' + [...new Set(errs)].slice(0, 12).join('\n'))
await browser.close()
