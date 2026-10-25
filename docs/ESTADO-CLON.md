# Estado del clon — MaquinariaOcasión

> Generado por `tools/clon-vertical/preparar-clon.mjs` el 2026-10-24.
> Este documento es el checklist de migración: tacha lo que vayas cerrando.

## Fase 1 — Esqueleto (hecho por el generador)

- [x] Copia del árbol versionado sin `.git`, `node_modules` ni `.env`
- [x] Marca renombrada en código, ficheros y carpetas (MaquinariaOcasión / maquinariaocasion.online)
- [x] `src/lib/marca.ts` como fuente única de identidad
- [x] `next.config.js`: fuera los 301 de camperocasion, dentro los de maquinariaocasion.online
- [x] `.env.example` reescrito (sin la URL ni la clave del Supabase de camper)
- [x] `package.json`, manifest PWA, metadata raíz, README y PROJECT.md
- [x] Paleta de la nueva marca en `tailwind.config.js`
- [x] Logo e iconos placeholder (sustituir en Fase 4)
- [x] Fuera: fotos semilla de campers, hero camper, assetlinks de la TWA

## Fase 2 — Limpieza del dominio camper (HECHA ✔)

Borrar código que solo tiene sentido en camper. **Hacerlo en un solo PR y
compilando al final**, porque header, footer, home y sitemap enlazan a estas
rutas:

- [x] Páginas: `calcular-itp`, `compra-segura-camper`, `cuanto-vale-mi-camper`,
      `gestoria-cambio-nombre`, `contrato-compraventa`, `comprar-a-camperizadores`
- [x] Librerías: `itp.ts`, `contrato.ts`, `gestoria.ts`, `inspecciones.ts`,
      `verificacion-homologacion.ts`, `valoracion.ts`
      — **excepción**: `precios-mercado.ts` **se conserva** (estadísticas de
      precio por modelo; la usan `modelo/[slug]` y su test; no es vocabulario
      camper)
- [x] API: `documentos-vehiculo` (pública + admin + firmar), `gestoria` (2),
      `inspecciones` (2 + cancelar), `valorar`, `admin/semilla` = 10 rutas
- [x] Panel admin: pestañas *Homologación*, *Gestoría*, *Inspecciones* (y
      contadores `homologacion`/`inspecciones`/`gestoria` de `counts` y
      `dashboard`, badge de homologación, expediente y botón de inspección en
      la ficha, filtro "solo homologación verificada" del catálogo)
- [x] Seeder de anuncios (`scripts/semilla-*`, `api/admin/semilla`,
      `package.json: semilla/semilla:reset`) — se conservan
      `semilla-chat.ts` (lo usa `crear-conversacion`), `semilla-admin.js`
      (`buscarUsuarioPorEmail`) y `semilla-datos.js`; quedan huérfanos los
      exports `asegurarVendedores` y `CAMPOS_ANUNCIO_SEMILLA` de
      `semilla-admin.js` (podar sin prisa)
- [x] Buscar y eliminar los restos de vocabulario camper:
      `grep -rniE "camper|autocaravana|homologaci|dgt"` (adecuar, no borrar a
      ciegas) — **solo en ficheros tocados por la limpieza**; el resto
      (copy, taxonomía, ciudades, dictionaries, `textos-legales`,
      `categorias-seo`, `filtros-tecnicos`) es Fase 3–5.
      `SlugTipo` perdió la entrada `camperizadores`; `?tab=homologacion` y
      `?tab=inspecciones` caen al fallback del panel automáticamente.
      Validación: `tsc --noEmit` + `eslint` + 657/657 tests + `next build`
      sin ninguna de las rutas borradas.

## Fase 3 — Taxonomía y filtros (HECHA ✔ — el núcleo)

Taxonomía aprobada: `agricola` (tractores, cosechadoras, maquinaria-agricola,
ganaderia), `obra` (excavadoras, cargadoras, compactacion, plataformas),
`herramientas` (herramienta-electrica, motores, sierra-poda, taller-manual);
marcas asignadas por subcategoría vía `MarcaModelo.aptoPara`.

- [x] `src/lib/categorias.ts`: familias === categorías (`FAMILIAS[k].key` es
      `categoriasData[k]`) con transversales en todos los subs (Año, Horas de
      uso, Combustible, Potencia (CV), Peso (kg), ¿Incluye transporte?,
      Documentación) + campos propios por familia; `Estado` sigue siendo la
      columna `productos.estado` (check de 5 valores) y se fusiona en la ficha
- [x] `src/lib/filtros-tecnicos.ts`: `camposPorCategoria` (transversales +
      específicos por familia) con `filtrosDeCategoria`/`gruposDeFiltros`
      (sin grupos vacíos) y `FILTROS_TECNICOS` como unión deduplicada por
      `param` — la consulta JSONB `@>` + GIN **no cambia**; rangos nuevos
      `horasMax`/`anioMin` sobre `espec_horas`/`espec_anio`
- [x] `src/lib/marcas.ts`: catálogo de fabricantes de maquinaria (12 slugs,
      valores únicos validados al importar)
- [x] `/publicar`: la familia del paso 1 es la categoría (`categoria:` = key)
      y los tipos salen de su familia; el API auto-crea la fila si falta
- [x] Ficha de producto: 4 bloques (técnica / estado / documentación /
      logística); claves camper legacy absorbidas al bloque técnico
- [x] `CatalogFilters`, `useProductLoader` y `usePrefetch` siguen leyendo del
      mismo registro; panel `FiltrosTecnicosPanel` con prop `categoria`
      (contexto = `?categoria=` o la familia de la subelegida; sin contexto,
      solo filtros transversales)
- [x] Consumidores adaptados: `categorias-seo` (claves = categoriasData),
      `productos-editar` (sub en todas las familias, legados se conservan),
      `importar-csv` (tipos nuevos, devuelve label, columna `Horas de uso`),
      Header/Footer/home/marcas/opengraph vía `TODAS_LAS_SUBS`
- [x] i18n: SOLO claves nuevas (`familias.<3>.label/desc`,
      `catalog.filters.*` nuevos, `catalog.filters.groups.{technique,docs,logistics}`);
      dictionaries completos = Fase 4
- [x] Migración nueva idempotente `202610240001_taxonomia_maquinaria.sql`
      (`insert into categorias` agricola/obra/herramientas + columna
      generada `espec_horas` + índice); `setup-maquinariaocasion.sql` y
      migraciones previas NO se tocan
- [x] Tests reescritos: familias, marcas-modelos, categorias-campos,
      filtros-tecnicos, catalog-consulta, productos-editar, importar-csv,
      seo-landings, categorias-seo

## Fase 4 — Marca, textos y SEO (HECHA — PR #3)

- [x] Logo e iconos definitivos (kit de marca en `tools/clon-vertical/plantillas/`
      sincronizado con `public/`: logo, favicon, icon-192/512, apple-touch)
- [x] `og-image.webp`, `pwa-tagline.webp` (nuevo) e imágenes de home
      (`hero.jpg`, `placeholder-product.webp`)
- [x] Diccionarios `src/i18n/dictionaries/{es,en}.json` completos y sincronizados
- [x] `textos-legales.ts`: revisión legal de la actividad (reserva con señal y
      verificación documental; fuera inspecciones/gestoría de la fase 2)
- [x] `categorias-seo.ts` y `ubicaciones-seo.ts`: copy de la nueva vertical
- [x] Copy visible de portada y de todas las páginas (camper → maquinaria, es/en),
      con la regla «adecuar, no borrar»: valores de DB (`camperizador`) intactos
- [x] **No reutilizar copy de camperocasion** (copy original de maquinaria)
- [ ] Search Console + sitemaps del dominio nuevo → **lado del usuario**

## Fase 5 — Contenido y lanzamiento (EN CURSO — PR #4)

- [x] **Blog:** 11 posts originales de maquinaria (8 Guías, 3 Legal), sin copy
      camper; classifier de `blog/[slug]` a las rutas de la taxonomía nueva
- [x] **30-50 anuncios reales antes de abrir:** 37 anuncios demo `es_demo`
      (10 vendedores, sin teléfono, sin sello de verificado — obliga la
      migración `202609180003`): fuente `src/lib/semilla-datos.js` →
      migración `supabase/migrations/202610240002_seed_anuncios_maquinaria.sql`
      (regenerar con `node scripts/generar-sql-semilla.js`); aplicada a
      Supabase: 37/37 `es_demo`, 10 perfiles, 0 verificados
- [x] Fotos optimizadas con `npm run optimize-images` (reescrito con `sharp`:
      recomprime JPG in-place + genera `.webp` al lado)
- [x] Landings por marca (`/marca/[slug]`, índice `/marcas`, en sitemap) y
      por provincia (`/[ciudad]`, hecha en Fase 3)
- [ ] 2 fotos de arquetipo pendientes de generar (`herramientas`, `taller` —
      límite de 10 imágenes/turno); hasta entonces 3 alias transicionales

## Servicios externos que hay que crear (nada compartido con camper)

| Servicio | Variable | Nota |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` | Proyecto nuevo + `setup-maquinariaocasion.sql` |
| Cloudflare R2 | `R2_*` | Bucket nuevo para fotos |
| Stripe | `STRIPE_*` | Cuenta o precios propios |
| Resend / SMTP | `RESEND_API_KEY` | Dominio verificado |
| Web Push | `VAPID_*` | `npm run generate-vapid-keys` |
| Telegram | `TELEGRAM_*` | Avisos internos |
| Google Analytics | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Propiedad nueva |
