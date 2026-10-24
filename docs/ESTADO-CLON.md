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

## Fase 3 — Taxonomía y filtros (PENDIENTE — el núcleo)

- [ ] `src/lib/categorias.ts`: familias → categorías → subcategorías propias
      (agrícola, obra, herramientas)
- [ ] `src/lib/filtros-tecnicos.ts`: pasar de lista plana a **campos por
      categoría** (`camposPorCategoria`). Es el cambio estructural del plan:
      con la lista plana, un taladro pediría "plazas para dormir"
- [ ] `src/lib/marcas.ts`: catálogo de fabricantes de maquinaria
- [ ] `/publicar`: formulario dinámico según categoría
- [ ] Ficha de producto: bloques técnico / estado / documentación / logística
- [ ] `CatalogFilters`, `useProductLoader` y `usePrefetch` deben seguir leyendo
      del mismo registro (es lo que evita el bug de páginas que "comen" filas)

## Fase 4 — Marca, textos y SEO (PENDIENTE)

- [ ] Logo e iconos definitivos (sustituir los placeholder)
- [ ] `og-image.webp`, `pwa-tagline.webp` e imágenes de home
- [ ] Diccionarios `src/i18n/dictionaries/{es,en}.json`
- [ ] `textos-legales.ts`: revisión legal de la actividad
- [ ] `categorias-seo.ts` y `ubicaciones-seo.ts`: copy de la nueva vertical
- [ ] Search Console + sitemaps del dominio nuevo
- [ ] **No reutilizar copy de camperocasion** (contenido duplicado entre
      dominios propios penaliza a los dos)

## Fase 5 — Contenido y lanzamiento (PENDIENTE)

- [ ] 30-50 anuncios reales antes de abrir
- [ ] Fotos optimizadas con `npm run optimize-images`
- [ ] Landings por marca y provincia

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
