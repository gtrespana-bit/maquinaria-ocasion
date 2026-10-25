#!/usr/bin/env node

// Optimiza las imágenes de `public/` y genera las versiones WebP.
//
// Fase 5 («Fotos optimizadas con `npm run optimize-images`»): reescrito con
// `sharp` porque el guion original dependía de imagemin + binarios de
// mozjpeg/pngquant que ya no se distribuían en el proyecto. Misma semántica:
//
//   · public/**/*.jpg|jpeg  → recomprimido in-place (calidad 78, progresivo)
//   · public/**/*.png       → recomprimido in-place (calidad 80)
//   · para cada jpg/png     → se crea la copia .webp al lado (calidad 75),
//     que es la que sirve la web (ProductCard y fichas apuntan a .webp en
//     la semilla y las subidas nuevas se convierten en el pipeline).
//
// Uso: npm run optimize-images [-- <subcarpeta>]
//   Ej: npm run optimize-images -- images/anuncios
//
// Idempotente: re-ejecutar solo reduce un poco más (el WebP existente se
// sobrescribe). Nunca toca .webp ni .svg originales.

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

async function walk(dir) {
  const out = []
  for (const e of await fs.promises.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

const fmt = n => `${(n / 1024).toFixed(0)} KB`

async function main() {
  // Subcarpeta opcional relativa a public/ (evita recorrer todo el repo).
  const sub = process.argv[2]
  const base = sub ? path.join(PUBLIC, sub) : PUBLIC
  if (!fs.existsSync(base)) {
    console.error(`❌ No existe ${path.relative(ROOT, base)}`)
    process.exit(1)
  }

  const files = (await walk(base)).filter(f => /\.(jpe?g|png)$/i.test(f))
  if (files.length === 0) {
    console.log('No hay jpg/png que optimizar.')
    return
  }

  console.log(`Optimizando imágenes de ${path.relative(ROOT, base)}…`)
  let jpgCount = 0
  let pngCount = 0
  let webpCount = 0
  let antesTotal = 0
  let despuesTotal = 0

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const esPng = ext === '.png'
    const antes = fs.statSync(file).size
    antesTotal += antes

    // 1) Recomprimir in-place (mismo formato).
    const tmp = `${file}.tmp`
    await sharp(file)
      .rotate() // respeta EXIF de orientación
      .toFormat(esPng ? 'png' : 'jpeg', esPng ? { quality: 80, compressionLevel: 9 } : { quality: 78, progressive: true, mozjpeg: true })
      .toFile(tmp)
    fs.renameSync(tmp, file)
    const despues = fs.statSync(file).size
    despuesTotal += despues
    if (esPng) pngCount++
    else jpgCount++

    // 2) Copia .webp al lado (la que sirve la web).
    const webpPath = file.replace(/\.(jpe?g|png)$/i, '.webp')
    await sharp(file).webp({ quality: 75 }).toFile(tmp)
    fs.renameSync(tmp, webpPath)
    webpCount++
    if (webpPath !== file) {
      // el webp también cuenta en el ahorro total
      despuesTotal += fs.statSync(webpPath).size
      antesTotal += antes // aprox.: el webp nace del jpg ya recomprimido
    }
  }

  console.log(`✅ ${jpgCount} JPG + ${pngCount} PNG recomprimidos · ${webpCount} WebP generados`)
  console.log(`   ${fmt(antesTotal)} → ${fmt(despuesTotal)}`)
}

main().catch(err => {
  console.error('❌ Error optimizando imágenes:', err.message)
  process.exit(1)
})
