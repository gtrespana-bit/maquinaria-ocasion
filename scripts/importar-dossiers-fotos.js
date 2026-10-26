#!/usr/bin/env node

// Importa dossiers fotográficos aprobados para la semilla.
//
// El script es deliberadamente conservador: no reutiliza el pool heredado,
// no acepta miniaturas de buscadores, no promueve un anuncio a
// `estadoFotos: 'verificado'` por el mero hecho de que existan archivos y no
// cambia textos ni precios. Su trabajo es únicamente:
//
//   1. validar manifiesto, vistas, procedencia y revisión visual;
//   2. leer originales locales o HTTPS autorizados;
//   3. generar derivados JPG/WebP de 1408×768;
//   4. registrar hashes y expediente en src/lib/semilla-dossiers.json.
//
// Uso:
//   npm run fotos:importar -- --manifiesto=semilla-fotos/manifiesto.json --seco
//   npm run fotos:importar -- --manifiesto=semilla-fotos/manifiesto.json --confirmar-conciliacion
//   npm run fotos:verificar

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const sharp = require('sharp')

const { ANUNCIOS } = require('../src/lib/semilla-datos')
const {
  ALTO_FOTO_SALIDA,
  ANCHO_FOTO_SALIDA,
  analizarDossierFotos,
  analizarSemilla,
  vistasRequeridas,
} = require('../src/lib/semilla-calidad')
const { VENDEDORES } = require('../src/lib/semilla-datos')

const ROOT = path.join(__dirname, '..')
const REGISTRO_PATH = path.join(ROOT, 'src/lib/semilla-dossiers.json')
const PUBLIC_ANUNCIOS = path.join(ROOT, 'public/images/anuncios')

function parseArgs(argv) {
  const args = {
    manifiesto: path.join(ROOT, 'semilla-fotos/manifiesto.json'),
    solo: null,
    seco: false,
    forzar: false,
    confirmarConciliacion: false,
    verificarRegistro: false,
    sinDescargar: false,
  }

  for (const arg of argv) {
    if (arg.startsWith('--manifiesto=')) {
      const valor = arg.slice('--manifiesto='.length)
      args.manifiesto = path.isAbsolute(valor) ? valor : path.join(ROOT, valor)
    } else if (arg.startsWith('--solo=')) {
      args.solo = arg.slice('--solo='.length)
    } else if (arg === '--seco') args.seco = true
    else if (arg === '--forzar') args.forzar = true
    else if (arg === '--confirmar-conciliacion') args.confirmarConciliacion = true
    else if (arg === '--verificar-registro') args.verificarRegistro = true
    else if (arg === '--sin-descargar') args.sinDescargar = true
    else if (arg === '--ayuda' || arg === '-h') args.ayuda = true
    else throw new Error(`Argumento no reconocido: ${arg}`)
  }

  return args
}

function mostrarAyuda() {
  console.log(`Uso:
  node scripts/importar-dossiers-fotos.js --manifiesto=<ruta> --seco
  node scripts/importar-dossiers-fotos.js --manifiesto=<ruta> --confirmar-conciliacion [--solo=SEM-000] [--forzar]
  node scripts/importar-dossiers-fotos.js --verificar-registro

Opciones:
  --seco                      Valida y procesa en memoria; no escribe archivos ni registro.
  --sin-descargar             Solo valida la estructura del manifiesto (no dimensiones).
  --confirmar-conciliacion    Confirma que título/ficha/precio ya describen la unidad fotografiada.
  --forzar                    Permite sustituir un dossier/derivado ya existente.
`)
}

function normalizarComparable(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function slug(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function baseSalida(anuncio) {
  const primera = anuncio.fotos?.[0] || `${anuncio.ref}.webp`
  const stem = path.basename(primera)
    .replace(/\.(?:webp|jpe?g|png)$/i, '')
    .replace(/[-_]v2[-_]\d+[-_].*$/i, '')
    .replace(/[-_](?:\d+|principal|portada)$/i, '')
  return slug(stem || anuncio.ref)
}

function rutasSalida(anuncio, fotosOrdenadas) {
  const base = baseSalida(anuncio)
  return fotosOrdenadas.map((foto, indice) => {
    const numero = String(indice + 1).padStart(2, '0')
    const nombre = `${base}-v2-${numero}-${slug(foto.vista)}.webp`
    return {
      rutaPublica: `/images/anuncios/${nombre}`,
      webp: path.join(PUBLIC_ANUNCIOS, nombre),
      jpg: path.join(PUBLIC_ANUNCIOS, nombre.replace(/\.webp$/i, '.jpg')),
    }
  })
}

function ordenarFotos(anuncio, fotos) {
  const requeridas = vistasRequeridas(anuncio)
  const orden = new Map(requeridas.map((vista, indice) => [vista, indice]))
  return [...fotos].sort((a, b) => {
    if (a.esPortada && !b.esPortada) return -1
    if (!a.esPortada && b.esPortada) return 1
    const oa = orden.has(a.vista) ? orden.get(a.vista) : Number.MAX_SAFE_INTEGER
    const ob = orden.has(b.vista) ? orden.get(b.vista) : Number.MAX_SAFE_INTEGER
    return oa - ob
  })
}

function existePaginaCreditos() {
  const candidatos = [
    'src/app/[locale]/creditos-fotograficos/page.tsx',
    'src/app/[locale]/creditos-fotograficos/page.ts',
    'src/app/[locale]/creditos-fotograficos/page.jsx',
    'src/app/[locale]/creditos-fotograficos/page.js',
    'src/app/creditos-fotograficos/page.tsx',
    'src/app/creditos-fotograficos/page.ts',
    'src/app/creditos-fotograficos/page.jsx',
    'src/app/creditos-fotograficos/page.js',
    'src/pages/creditos-fotograficos.tsx',
    'src/pages/creditos-fotograficos.js',
  ]
  return candidatos.some(rel => fs.existsSync(path.join(ROOT, rel)))
}

function modeloCoincideConTitulo(anuncio, marcaModelo) {
  const objetivo = normalizarComparable(marcaModelo)
  if (!objetivo) return false
  const titulo = normalizarComparable(anuncio.titulo)
  const marcaModeloFuente = normalizarComparable(`${anuncio.marca || ''} ${anuncio.modelo || ''}`)
  return titulo.includes(objetivo) || marcaModeloFuente === objetivo
}

function validarEntradaDossier(entrada, anuncio, registro, args) {
  const errores = []
  const avisos = []
  const ref = anuncio.ref

  if (registro.dossiers?.[ref] && !args.forzar) {
    errores.push(`${ref}: ya existe un dossier registrado; usa --forzar solo tras revisar la sustitución`)
  }
  if (anuncio.decision !== 'mantener') {
    const mensaje = `${ref}: decision=${anuncio.decision}; cierra primero modelo/precio en semilla-datos.js`
    if (args.seco) avisos.push(mensaje)
    else errores.push(mensaje)
  }
  if (!args.seco && !args.confirmarConciliacion) {
    errores.push(`${ref}: falta --confirmar-conciliacion tras adaptar el anuncio a la unidad fotografiada`)
  }
  if (!modeloCoincideConTitulo(anuncio, entrada.unidad?.marcaModelo)) {
    errores.push(`${ref}: unidad.marcaModelo («${entrada.unidad?.marcaModelo || 'ausente'}») no aparece de forma inequívoca en el título ni coincide con marca/modelo de la fuente`)
  }

  const fotos = Array.isArray(entrada.fotos) ? entrada.fotos : []
  const portadas = fotos.filter(f => f?.esPortada === true)
  const primeraVista = vistasRequeridas(anuncio)[0]
  if (portadas.length !== 1) {
    errores.push(`${ref}: el manifiesto debe marcar exactamente una foto con esPortada=true`)
  } else if (portadas[0].vista !== primeraVista) {
    errores.push(`${ref}: la portada debe ser la vista general requerida (${primeraVista}), no ${portadas[0].vista}`)
  }

  for (const foto of fotos) {
    const origen = String(foto?.origen || '')
    const normalizado = origen.replaceAll('\\', '/').toLowerCase()
    if (normalizado.includes('/image-search/') || normalizado.startsWith('image-search/')) {
      errores.push(`${ref}: ${foto?.vista || 'foto'} procede de image-search/ (miniaturas exploratorias, no originales aprobados)`)
    }
    if (normalizado.includes('/public/images/anuncios/') || normalizado.startsWith('public/images/anuncios/')) {
      errores.push(`${ref}: ${foto?.vista || 'foto'} reutiliza el pool heredado de public/images/anuncios`)
    }
    if (/^https?:\/\//i.test(origen) && !/^https:\/\//i.test(origen)) {
      errores.push(`${ref}: ${foto?.vista || 'foto'} usa HTTP; se exige HTTPS para originales remotos`)
    }
  }

  const fuenteUrl = String(entrada.procedencia?.url || '')
  if (/(?:^|\.)gsaauctions\.gov$/i.test(safeHostname(fuenteUrl))
    && entrada.procedencia?.tipo === 'archivo-abierto') {
    errores.push(`${ref}: GSA Auctions no se acepta como archivo abierto genérico; sus condiciones mezclan obra federal y fotos de terceros usadas con permiso`)
  }

  if (/\bcc\s+by(?:\s|-)/i.test(String(entrada.procedencia?.licencia || '')) && !existePaginaCreditos()) {
    errores.push(`${ref}: la licencia exige atribución, pero todavía no existe la ruta pública /creditos-fotograficos`)
  }

  const fotosOrdenadas = ordenarFotos(anuncio, fotos)
  const salidas = rutasSalida(anuncio, fotosOrdenadas)
  if (!args.forzar) {
    salidas.forEach((salida, indice) => {
      if (fs.existsSync(salida.webp) || fs.existsSync(salida.jpg)) {
        errores.push(`${ref}: ya existe un derivado para ${fotosOrdenadas[indice]?.vista}; usa --forzar solo si es una sustitución revisada`)
      }
    })
  }

  const dossierProvisional = {
    version: 1,
    estadoRevision: 'aprobado',
    mismaUnidad: entrada.unidad?.mismaUnidad !== false && entrada.revision?.checklist?.mismaUnidad === true,
    procedencia: entrada.procedencia || {},
    unidad: entrada.unidad || {},
    revision: entrada.revision || {},
    fotos: fotosOrdenadas.map((foto, indice) => ({
      ruta: salidas[indice].rutaPublica,
      vista: foto.vista,
      origen: foto.origen,
      esPortada: foto.esPortada === true,
      anchoOriginal: ANCHO_FOTO_SALIDA,
      altoOriginal: ALTO_FOTO_SALIDA,
      anchoSalida: ANCHO_FOTO_SALIDA,
      altoSalida: ALTO_FOTO_SALIDA,
      sha256Original: '0'.repeat(64),
      sha256Salida: '0'.repeat(64),
    })),
  }

  errores.push(...analizarDossierFotos({
    ...anuncio,
    estadoFotos: 'verificado',
    fotos: salidas.map(s => s.rutaPublica),
    dossierFotos: dossierProvisional,
  }))

  return { errores, avisos, fotosOrdenadas, salidas, dossierProvisional }
}

function safeHostname(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

async function leerOrigen(origen, manifiestoDir) {
  if (/^https:\/\//i.test(origen)) {
    const respuesta = await fetch(origen, {
      redirect: 'follow',
      headers: {
        'user-agent': 'MaquinariaOcasionFotoImport/1.0 (https://maquinaria.click)',
        accept: 'image/avif,image/webp,image/jpeg,image/png;q=0.9,*/*;q=0.1',
      },
    })
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status} al descargar ${origen}`)
    const tipo = respuesta.headers.get('content-type') || ''
    if (tipo && !/^(?:image\/|application\/octet-stream)/i.test(tipo)) {
      throw new Error(`La URL no devuelve una imagen (${tipo}): ${origen}`)
    }
    return Buffer.from(await respuesta.arrayBuffer())
  }

  const candidatos = path.isAbsolute(origen)
    ? [origen]
    : [path.join(ROOT, origen), path.join(manifiestoDir, origen), path.resolve(origen)]
  const encontrado = candidatos.find(c => fs.existsSync(c))
  if (!encontrado) throw new Error(`No existe el original local: ${origen}`)
  return fs.promises.readFile(encontrado)
}

function dimensionesTrasOrientacion(metadata) {
  const ancho = metadata.width || 0
  const alto = metadata.height || 0
  return metadata.orientation >= 5
    ? { ancho: alto, alto: ancho }
    : { ancho, alto }
}

function fraccionVisibleTrasRecorte(ancho, alto) {
  const escala = Math.max(ANCHO_FOTO_SALIDA / ancho, ALTO_FOTO_SALIDA / alto)
  const visibleAncho = ANCHO_FOTO_SALIDA / escala
  const visibleAlto = ALTO_FOTO_SALIDA / escala
  return (visibleAncho * visibleAlto) / (ancho * alto)
}

const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex')

async function procesarFoto(foto, salida, manifiestoDir, avisos) {
  const original = await leerOrigen(foto.origen, manifiestoDir)
  const metadata = await sharp(original, { failOn: 'error' }).metadata()
  const { ancho, alto } = dimensionesTrasOrientacion(metadata)

  if (ancho < ANCHO_FOTO_SALIDA || alto < ALTO_FOTO_SALIDA) {
    throw new Error(`${foto.vista}: original ${ancho}x${alto}; se exige al menos ${ANCHO_FOTO_SALIDA}x${ALTO_FOTO_SALIDA} sin escalar`)
  }

  const visible = fraccionVisibleTrasRecorte(ancho, alto)
  if (visible < 0.55) {
    avisos.push(`${foto.vista}: el recorte a 1408x768 conserva solo el ${(visible * 100).toFixed(0)}% del original; revisa que no corte la máquina`)
  }

  const pipeline = () => sharp(original, { failOn: 'error' })
    .rotate()
    .resize(ANCHO_FOTO_SALIDA, ALTO_FOTO_SALIDA, { fit: 'cover', position: 'attention' })

  const webp = await pipeline().webp({ quality: 78 }).toBuffer()
  const jpg = await pipeline().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toBuffer()

  return {
    salida,
    webp,
    jpg,
    detalle: {
      ruta: salida.rutaPublica,
      vista: foto.vista,
      origen: foto.origen,
      esPortada: foto.esPortada === true,
      anchoOriginal: ancho,
      altoOriginal: alto,
      anchoSalida: ANCHO_FOTO_SALIDA,
      altoSalida: ALTO_FOTO_SALIDA,
      sha256Original: sha256(original),
      sha256Salida: sha256(webp),
    },
  }
}

function leerJson(ruta, nombre) {
  try {
    return JSON.parse(fs.readFileSync(ruta, 'utf8'))
  } catch (error) {
    throw new Error(`No se pudo leer ${nombre} (${ruta}): ${error.message}`)
  }
}

async function importar(args) {
  const manifiesto = leerJson(args.manifiesto, 'el manifiesto')
  if (manifiesto.version !== 1 || !Array.isArray(manifiesto.dossiers)) {
    throw new Error('El manifiesto debe tener { "version": 1, "dossiers": [...] }')
  }

  const registro = leerJson(REGISTRO_PATH, 'el registro de dossiers')
  if (registro.version !== 1 || !registro.dossiers || typeof registro.dossiers !== 'object') {
    throw new Error('src/lib/semilla-dossiers.json no tiene la estructura esperada')
  }

  const entradas = manifiesto.dossiers.filter(d => !args.solo || d.ref === args.solo)
  if (entradas.length === 0) throw new Error(args.solo ? `El manifiesto no contiene ${args.solo}` : 'El manifiesto no contiene dossiers')

  const errores = []
  const avisos = []
  const preparados = []
  const manifiestoDir = path.dirname(args.manifiesto)

  for (const entrada of entradas) {
    const anuncio = ANUNCIOS.find(a => a.ref === entrada.ref)
    if (!anuncio) {
      errores.push(`${entrada.ref || 'sin-ref'}: no existe en src/lib/semilla-datos.js`)
      continue
    }

    const validacion = validarEntradaDossier(entrada, anuncio, registro, args)
    errores.push(...validacion.errores)
    avisos.push(...validacion.avisos)
    if (validacion.errores.length) continue

    let procesadas = []
    if (!args.sinDescargar) {
      try {
        for (let i = 0; i < validacion.fotosOrdenadas.length; i++) {
          procesadas.push(await procesarFoto(
            validacion.fotosOrdenadas[i],
            validacion.salidas[i],
            manifiestoDir,
            avisos,
          ))
        }
      } catch (error) {
        errores.push(`${anuncio.ref}: ${error.message}`)
        continue
      }
    }

    preparados.push({ entrada, anuncio, validacion, procesadas })
  }

  if (avisos.length) {
    console.warn('Avisos:')
    for (const aviso of avisos) console.warn(`  · ${aviso}`)
  }
  if (errores.length) {
    console.error('❌ Importación bloqueada:')
    for (const error of errores) console.error(`  · ${error}`)
    process.exitCode = 1
    return
  }

  if (args.seco || args.sinDescargar) {
    console.log(`✅ Manifiesto válido para ${preparados.length} dossier(s); no se ha escrito nada.`)
    return
  }

  fs.mkdirSync(PUBLIC_ANUNCIOS, { recursive: true })
  for (const preparado of preparados) {
    for (const foto of preparado.procesadas) {
      fs.writeFileSync(`${foto.salida.webp}.tmp`, foto.webp)
      fs.writeFileSync(`${foto.salida.jpg}.tmp`, foto.jpg)
      fs.renameSync(`${foto.salida.webp}.tmp`, foto.salida.webp)
      fs.renameSync(`${foto.salida.jpg}.tmp`, foto.salida.jpg)
    }

    registro.dossiers[preparado.anuncio.ref] = {
      ...preparado.validacion.dossierProvisional,
      fotos: preparado.procesadas.map(f => f.detalle),
    }
  }

  const temporalRegistro = `${REGISTRO_PATH}.tmp`
  fs.writeFileSync(temporalRegistro, `${JSON.stringify(registro, null, 2)}\n`)
  fs.renameSync(temporalRegistro, REGISTRO_PATH)

  console.log(`✅ ${preparados.length} dossier(s) importado(s) y registrado(s).`)
  console.log('   Ejecuta la batería y revisa visualmente los derivados antes de commitear.')
}

async function verificarRegistro() {
  const registro = leerJson(REGISTRO_PATH, 'el registro de dossiers')
  const refs = Object.keys(registro.dossiers || {})
  const calidad = analizarSemilla({ VENDEDORES, ANUNCIOS })
  const errores = [...calidad.errores]

  for (const anuncio of ANUNCIOS) {
    if (anuncio.estadoFotos !== 'verificado') continue
    for (const foto of anuncio.dossierFotos?.fotos || []) {
      const webpPath = path.join(ROOT, 'public', foto.ruta)
      const jpgPath = webpPath.replace(/\.webp$/i, '.jpg')
      if (!fs.existsSync(webpPath)) {
        errores.push(`${anuncio.ref}: falta el WebP registrado ${foto.ruta}`)
        continue
      }
      if (!fs.existsSync(jpgPath)) errores.push(`${anuncio.ref}: falta el JPG gemelo de ${foto.ruta}`)
      const buffer = fs.readFileSync(webpPath)
      if (sha256(buffer) !== foto.sha256Salida) {
        errores.push(`${anuncio.ref}: SHA-256 distinto en ${foto.ruta}`)
      }
      const metadata = await sharp(buffer).metadata()
      if (metadata.width !== ANCHO_FOTO_SALIDA || metadata.height !== ALTO_FOTO_SALIDA) {
        errores.push(`${anuncio.ref}: ${foto.ruta} es ${metadata.width}x${metadata.height}, no ${ANCHO_FOTO_SALIDA}x${ALTO_FOTO_SALIDA}`)
      }
    }
  }

  if (errores.length) {
    console.error('❌ Registro de dossiers inválido:')
    for (const error of errores) console.error(`  · ${error}`)
    process.exitCode = 1
    return
  }

  console.log(`✅ Registro válido: ${refs.length} dossier(s) aprobado(s); ${calidad.bloqueosFotos.length} anuncio(s) siguen en cuarentena.`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.ayuda) return mostrarAyuda()
  if (args.verificarRegistro) return verificarRegistro()
  return importar(args)
}

if (require.main === module) {
  main().catch(error => {
    console.error(`❌ ${error.message}`)
    process.exitCode = 1
  })
}

module.exports = {
  baseSalida,
  fraccionVisibleTrasRecorte,
  modeloCoincideConTitulo,
  ordenarFotos,
  rutasSalida,
}
