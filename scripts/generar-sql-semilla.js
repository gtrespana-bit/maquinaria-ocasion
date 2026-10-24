#!/usr/bin/env node
// Genera la migración SQL idempotente de la semilla de anuncios de
// demostración a partir de `src/lib/semilla-datos.js` (única fuente de verdad).
//
// Uso:   node scripts/generar-sql-semilla.js
// Salida: supabase/migrations/<fecha>_seed_anuncios_maquinaria.sql
//
// La migración:
//   1) crea (o actualiza) los usuarios de auth de los vendedores de semilla
//      con `app_metadata.semilla = true` (requisito de destinatarioSemilla),
//   2) upsert de sus perfiles (sin teléfono, nunca verificados, es_demo),
//   3) upsert de los anuncios (es_demo, estado_moderacion 'aprobado',
//      sin contacto).
//
// Validaciones previas (el script falla sin escribir nada si algo no cuadra):
//   · `marca` ∈ MARCAS_MODELOS y su `aptoPara` contiene la subcategoría.
//   · `sub` es un label real de categorias.ts y `cat` su familia.
//   · `estado` ∈ check de productos; estados/vendedores ∈ listas canónicas.
//   · valores de specs ∈ OPCIONES_* de categorias.ts.
//
// Idempotente: los UUID son deterministas (v5), así que re-ejecutar la
// migración actualiza en vez de duplicar.

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { VENDEDORES, ANUNCIOS, emailVendedor } = require('../src/lib/semilla-datos.js')

const ROOT = path.join(__dirname, '..')
const SALIDA = path.join(ROOT, 'supabase/migrations/202610240002_seed_anuncios_maquinaria.sql')

// ── UUIDs deterministas (v5, namespace URL) ────────────────────────────────
const NS_URL = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
function uuidv5(nombre) {
  const ns = Buffer.from(NS_URL.replace(/-/g, ''), 'hex')
  const hash = crypto.createHash('sha1').update(Buffer.concat([ns, Buffer.from(nombre, 'utf8')])).digest()
  const b = Buffer.from(hash.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50
  b[8] = (b[8] & 0x3f) | 0x80
  const h = b.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// ── Lectura de registradores (marcas.ts / categorias.ts / ubicaciones.ts) ──
const marcasTs = fs.readFileSync(path.join(ROOT, 'src/lib/marcas.ts'), 'utf-8')
const MARCAS = []
for (const m of marcasTs.matchAll(/\{\s*fabricante:\s*'([^']*)',\s*modelo:\s*'([^']*)',\s*valor:\s*'([^']*)',\s*aptoPara:\s*\[([^\]]*)\]/g)) {
  const aptoPara = [...m[4].matchAll(/'([^']+)'/g)].map(x => x[1])
  MARCAS.push({ fabricante: m[1], modelo: m[2], valor: m[3], aptoPara })
}
if (MARCAS.length < 50) {
  console.error(`❌ Solo ${MARCAS.length} entradas parseadas de marcas.ts — revisa el regex`)
  process.exit(1)
}

const catsTs = fs.readFileSync(path.join(ROOT, 'src/lib/categorias.ts'), 'utf-8')
// Pares label→slug de subcategorías: `label: 'X'` seguido de `slug: 'y'`
// dentro del bloque de subs (icon entre medias).
const SUBS = [] // { label, slug, familiaKey }
let familiaActual = null
for (const linea of catsTs.split('\n')) {
  const fam = linea.match(/^\s{4}slug: '([a-z-]+)',\s*$/)
  if (fam && ['agricola', 'obra', 'herramientas'].includes(fam[1])) { familiaActual = fam[1]; continue }
  const sub = linea.match(/^\s{8}slug: '([a-z-]+)',\s*$/)
  if (sub) { SUBS.push({ slug: sub[1], familia: familiaActual }); continue }
}
// Los labels de sub van 2 líneas antes del slug (`label` → `icon` → `slug`)
const lineasCat = catsTs.split('\n')
for (let i = 0; i < lineasCat.length; i++) {
  const l = lineasCat[i].match(/^\s{8}slug: '([a-z-]+)',\s*$/)
  if (!l) continue
  const sub = SUBS.find(s => s.slug === l[1] && !s.label)
  if (!sub) continue
  for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
    const lab = lineasCat[j].match(/^\s{8}label: '([^']+)',\s*$/)
    if (lab) { sub.label = lab[1]; break }
  }
}
const FAMS = {}
for (const s of SUBS) { if (s.label && s.familia) FAMS[s.label] = s.familia }

function opciones(nombre) {
  const m = catsTs.match(new RegExp(`export const ${nombre} = \\[([\\s\\S]*?)\\] as const`))
  if (!m) return []
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1])
}
const OPS = {
  Combustible: opciones('OPCIONES_COMBUSTIBLE'),
  '¿Incluye transporte?': opciones('OPCIONES_SI_NO'),
  Documentación: opciones('OPCIONES_DOCUMENTACION'),
  'Tracción-agricola': opciones('OPCIONES_TRACCION_AGRICOLA'),
  'Tracción-obra': opciones('OPCIONES_TRACCION_OBRA'),
  Enganche: opciones('OPCIONES_ENGANCHE'),
  'Toma de fuerza (PTO)': opciones('OPCIONES_PTO'),
  'Transmisión': opciones('OPCIONES_TRANSMISION_AGRICOLA'),
  'Medidas de transporte': opciones('OPCIONES_MEDIDAS_TRANSPORTE'),
  'Potencia (W)': opciones('OPCIONES_POTENCIA_W'),
  'Tensión': opciones('OPCIONES_TENSION'),
  'Batería incluida': opciones('OPCIONES_SI_NO'),
}

const ubiTs = fs.readFileSync(path.join(ROOT, 'src/lib/ubicaciones.ts'), 'utf-8')
const bloqueEstados = ubiTs.match(/export const COMUNIDADES_AUTONOMAS = \[([\s\S]*?)\]/)
const ESTADOS = bloqueEstados
  ? [...bloqueEstados[1].matchAll(/'([^']+)'/g)].map(x => x[1])
  : ['Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña', 'Comunitat Valenciana', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra', 'País Vasco']
if (ESTADOS.length < 17) { console.error(`❌ Solo ${ESTADOS.length} comunidades parseadas`); process.exit(1) }

const ESTADOS_PRODUCTO = ['Nuevo', 'Como nuevo', 'Bueno', 'Usado', 'Para repuestos']

// ── Validaciones ───────────────────────────────────────────────────────────
const errores = []
const slugsVend = new Set()
for (const v of VENDEDORES) {
  if (slugsVend.has(v.slug)) errores.push(`vendedor slug duplicado: ${v.slug}`)
  slugsVend.add(v.slug)
  if (!['particular', 'camperizador', 'profesional'].includes(v.tipo)) errores.push(`${v.slug}: tipo inválido ${v.tipo}`)
  if (!ESTADOS.includes(v.estado)) errores.push(`${v.slug}: estado no canónico "${v.estado}"`)
  if (v.telefono !== null) errores.push(`${v.slug}: la semilla no lleva teléfono`)
}
const vistos = new Set()
for (const a of ANUNCIOS) {
  const etiqueta = a.titulo.slice(0, 40)
  if (!slugsVend.has(a.vendedor)) errores.push(`${etiqueta}: vendedor desconocido ${a.vendedor}`)
  if (!['agricola', 'obra', 'herramientas'].includes(a.cat)) errores.push(`${etiqueta}: familia inválida ${a.cat}`)
  if (FAMS[a.sub] !== a.cat) errores.push(`${etiqueta}: sub "${a.sub}" no pertenece a ${a.cat}`)
  if (!ESTADOS_PRODUCTO.includes(a.estado)) errores.push(`${etiqueta}: estado inválido ${a.estado}`)
  if (!MARCAS.find(m => m.valor === a.marca)) errores.push(`${etiqueta}: marca "${a.marca}" no está en MARCAS_MODELOS`)
  const entrada = MARCAS.find(m => m.valor === a.marca)
  const sub = SUBS.find(s => s.label === a.sub)
  if (entrada && sub && !entrada.aptoPara.includes(sub.slug)) {
    errores.push(`${etiqueta}: "${a.marca}" no es apto para ${sub.slug} (aptoPara=[${entrada.aptoPara}])`)
  }
  if (vistos.has(a.titulo)) errores.push(`título duplicado: ${a.titulo}`)
  vistos.add(a.titulo)
  if (!Array.isArray(a.fotos) || a.fotos.length === 0) errores.push(`${etiqueta}: sin fotos`)
  const f = a.ficha
  const check = (campo, valor, lista) => { if (valor != null && !lista.includes(valor)) errores.push(`${etiqueta}: ${campo}="${valor}" fuera de opciones`) }
  check('Combustible', f.Combustible, OPS.Combustible)
  check('Documentación', f.Documentación, OPS.Documentación)
  check('¿Incluye transporte?', f['¿Incluye transporte?'], OPS['¿Incluye transporte?'])
  if (f['Tracción'] != null) {
    const lista = a.cat === 'agricola' ? OPS['Tracción-agricola'] : OPS['Tracción-obra']
    check('Tracción', f['Tracción'], lista)
  }
  check('Enganche', f.Enganche, OPS.Enganche)
  check('Toma de fuerza (PTO)', f['Toma de fuerza (PTO)'], OPS['Toma de fuerza (PTO)'])
  check('Transmisión', f['Transmisión'], OPS['Transmisión'])
  check('Medidas de transporte', f['Medidas de transporte'], OPS['Medidas de transporte'])
  check('Potencia (W)', f['Potencia (W)'], OPS['Potencia (W)'])
  check('Tensión', f['Tensión'], OPS['Tensión'])
  check('Batería incluida', f['Batería incluida'], OPS['Batería incluida'])
}
if (ANUNCIOS.length < 30 || ANUNCIOS.length > 50) errores.push(`ANUNCIOS=${ANUNCIOS.length} fuera del rango 30-50`)
if (errores.length) {
  console.error('❌ Validación fallida:')
  for (const e of errores) console.error('  ·', e)
  process.exit(1)
}

// ── Emisión SQL ────────────────────────────────────────────────────────────
const q = s => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`)
const intervalo = (campo, horas) => `${campo} = now() - interval '${Math.round(horas)} hours'`
const uuidVend = v => uuidv5(`semilla:vendedor:${v.slug}`)
const uuidProd = (a, i) => uuidv5(`semilla:producto:${a.titulo}`)

const out = []
out.push(`-- ============================================================================
-- 202610240002 — Semilla de anuncios de maquinaria (37 anuncios, es_demo)
--
-- GENERADA por scripts/generar-sql-semilla.js desde src/lib/semilla-datos.js
-- (única fuente de verdad). NO editar a mano: regenerar con el script.
--
-- PROBLEMA QUE RESUELVE
-- =====================
-- Fase 5: «30-50 anuncios reales antes de abrir». La base estaba vacía:
-- marketplace sin stock no convierte y Google no confía en él. La semilla
-- publica anuncios de demostración de la vertical (tractores, excavadoras,
-- herramienta…) marcados \`es_demo\`:
--   · no se indexan en el sitemap ni exponen contacto (202609180003),
--   · nunca muestran sello de verificado ni teléfono (sin teléfonos
--     inventados: pertenecerían a personas reales),
--   · se sustituyen por anuncio real del vendedor cuando llegue el stock.
--
-- Idempotente: UUIDs deterministas (v5) + upsert por clave.
-- ============================================================================

begin;

-- ── 1) Usuarios de auth de los vendedores de semilla ──────────────────────
-- app_metadata.semilla = true es lo que exige destinatarioSemilla (chat).
`)
for (const v of VENDEDORES) {
  out.push(`insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '${uuidVend(v)}',
  'authenticated',
  'authenticated',
  ${q(emailVendedor(v))},
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  ${q(JSON.stringify({ semilla: 'true', nombre: v.nombre }))}::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;`)
}
out.push(`
-- ── 2) Perfiles (sin teléfono, nunca verificados, es_demo) ─────────────────
`)
for (const v of VENDEDORES) {
  out.push(`insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  '${uuidVend(v)}',
  ${q(v.nombre)},
  ${q(v.estado)},
  ${q(v.ciudad)},
  ${q(v.tipo)},
  true,
  ${q(v.slug)},
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;`)
}
out.push(`
-- ── 3) Anuncios ───────────────────────────────────────────────────────────
-- Claves de especificaciones = etiquetas exactas del formulario (leen los
-- filtros del catálogo y las columnas generadas espec_anio / espec_horas).
-- Categoria por familia: agricola=13, obra=14, herramientas=15 (insertadas
-- por 202610240001; se resuelven por nombre por si cambian los ids).
`)
const vPorSlug = Object.fromEntries(VENDEDORES.map(v => [v.slug, v]))
ANUNCIOS.forEach((a, i) => {
  const v = vPorSlug[a.vendedor]
  const pid = uuidProd(a, i)
  const specsJson = JSON.stringify(a.ficha).replace(/'/g, "''")
  const fotos = a.fotos.map(f => q(f)).join(', ')
  const verificada = a.verificacion === 'verificada'
  out.push(`insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '${pid}',
  '${uuidVend(v)}',
  ${q(a.titulo)},
  ${q(a.descripcion)},
  (select id from public.categorias where nombre = ${q(a.cat)}),
  ${q(a.sub)},
  ${q(a.marca)},
  ${q(a.modelo)},
  ${q(a.estado)},
  ${a.precio}::numeric, ${a.precio}::numeric, ${a.precio}::numeric,
  ${q(v.estado)}, ${q(v.ciudad)},
  ${q(a.fotos[0])},
  array[${fotos}]::text[],
  true,
  ${a.destacado ? 'true' : 'false'},
  ${a.destacado ? `now() + interval '7 days'` : 'null'},
  ${a.visitas},
  now() - interval '${Math.round(a.creado)} hours',
  '{}'::jsonb,
  ${a.boosteado ? `now() - interval '6 hours'` : 'null'},
  'aprobado',
  false,
  ${q(v.tipo)},
  ${q(specsJson)}::jsonb,
  ${q(verificada ? 'verificada' : 'sin_verificar')},
  ${verificada ? 'now()' : 'null'},
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();`)
})
out.push(`
commit;

-- Verificación rápida (debe devolver 37):
-- select count(*) from productos where es_demo;`)

fs.mkdirSync(path.dirname(SALIDA), { recursive: true })
fs.writeFileSync(SALIDA, out.join('\n') + '\n', 'utf-8')
console.log(`✅ ${SALIDA}`)
console.log(`   ${VENDEDORES.length} vendedores · ${ANUNCIOS.length} anuncios · ${MARCAS.length} marcas válidas · ${SUBS.length} subs`)
