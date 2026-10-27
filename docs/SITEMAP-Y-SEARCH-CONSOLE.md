# Sitemap y Search Console — diagnóstico 2026-10-27

> Síntoma: en Search Console, `sitemap.xml` aparece como **«No se ha podido
> obtener»** y **«No se ha podido leer el sitemap»** dos días después de
> enviarlo.

## 1. Lo que se comprobó (en vivo, 2026-10-27)

| Comprobación | Resultado |
|---|---|
| `GET https://maquinaria.click/sitemap.xml` | **200**, `application/xml`, XML válido, ~150 URLs |
| `GET https://maquinaria.click/sitemap-images.xml` | **200**, XML válido (solo la portada, ver §3) |
| `GET https://maquinaria.click/robots.txt` | **200**, anuncia ambos sitemaps y no bloquea nada público |
| `www.maquinaria.click` | **308** → `maquinaria.click` (correcto) |
| `maquinaria-ocasion.vercel.app` | **308** → `maquinaria.click` (correcto) |
| DNS `maquinaria.click` | 216.150.1.1 (Vercel) ✅ |
| DNS `maquinariaocasion.online` | **ENOTFOUND** — el dominio antiguo no resuelve |
| Estructura del XML | `<urlset>` abierto/cerrado, sin duplicados, todas `https://` y del host canónico, ninguna `/en` |
| URLs de muestra (`/categoria/…`, `/modelo/…`, `/blog/…`) | **200** |

**El sitemap es correcto y es público.** El fallo que ve Search Console no viene
del XML generado.

## 2. Por qué Search Console dice que no lo puede obtener

Por orden de probabilidad, con las fechas reales del proyecto:

1. **Se envió un sitemap de un dominio que no apunta a la web.**
   Todo el repo venía de `maquinariaocasion.online` (y `.es`). Hoy **ninguno de
   los dos resuelve en DNS** (`ENOTFOUND`). Si el sitemap se envió bajo una
   propiedad de ese dominio o con esa URL, Google nunca podrá obtenerlo, por
   muchos días que pasen.
   → En Search Console, el sitemap debe estar enviado con `sitemap.xml` bajo la
   propiedad **`maquinaria.click`** (mejor una propiedad de *Dominio*).
2. **Se envió mientras el dominio aún no estaba conectado a Vercel.**
   `maquinaria.click` se añadió al proyecto en Vercel el **2026-10-25 a las
   16:51 UTC** y el proyecto se creó el 2026-10-24 a las 22:33 UTC. Si el envío
   fue el día 25, hubo horas en las que el dominio devolvía 404 de Vercel o no
   resolvía todavía.
3. **Search Console no reintenta al momento.** Un sitemap fallido se reintenta
   en horas o días, y el estado se queda en rojo aunque ya funcione. Hay que
   forzar un nuevo intento: borrarlo de la lista y volver a enviarlo, o usar
   «Solicitar nueva indexación» en la inspección de URLs.

Rutas que **no** existen y que si se envían fallan siempre:
`/sitemap`, `/sitemap.xml/` (con barra), `/es/sitemap.xml`, `/sitemap_index.xml`.

## 3. Lo que sí falta de contenido (no es un error de Google)

La base de datos solo tiene **anuncios de muestra** (`productos.es_demo = true`).
Por eso el sitemap:

- no incluye ninguna ficha `/producto/…` (esas fichas llevan `noindex`),
- no incluye `/vendedor/…` ni `/tienda/…`,
- y `sitemap-images.xml` cae al *fallback* de la portada, porque una imagen
  necesita un anuncio real con foto.

En cuanto se publique el primer anuncio real, esas URLs entran solas: el
sitemap se regenera cada 6 h (`revalidate = 21600`).

## 4. Cambios hechos en el código

`src/app/sitemap.ts`:

- **Una sola pasada por `productos`** en lugar de tres recorridos completos de la
  tabla (productos, conteos de ciudad y stock de marcas). Menos latencia y menos
  riesgo de que la función supere el tiempo máximo de ejecución: un 504 es
  justo lo que Search Console reporta como «no se ha podido obtener».
- **Nunca devuelve 500**: todo lo que depende de Supabase va en `try/catch` y,
  si falla, el sitemap se sirve igualmente con las URLs editoriales.
- Cada consulta secundaria (tiendas, foro) está aislada: si el foro no está
  disponible, el resto del sitemap sigue saliendo completo.
- **Sin URLs duplicadas** (Google descarta las repetidas).
- Tope de filas (`MAX_FILAS`) y reintento con esquemas antiguos sin `slug`.
- El criterio de landings y marcas se mantiene idéntico al `robots` de cada
  página: los anuncios de muestra cuentan para landings, pero nunca para las
  fichas de producto.

`scripts/verificar-sitemap.mjs` — comprobación automática contra producción:

```bash
npm run verificar:sitemap              # 10 URLs de muestra
npm run verificar:sitemap -- --muestra 25
```

Valida HTTP, content-type, XML bien formado, duplicados, host canónico, `/en`,
`robots.txt` y que una muestra de URLs devuelva 200.

## 5. Qué hacer en Search Console (5 minutos)

1. **Propiedad correcta**: arriba a la izquierda debe poner `maquinaria.click`.
   Si la propiedad es de `maquinariaocasion.online` o `www.`, no sirve.
2. **Sitemaps** → escribe solo `sitemap.xml` (sin dominio) → **Enviar**.
   Repite con `sitemap-images.xml`.
3. Si hay una entrada antigua en rojo, **elimínala** y vuelve a enviarla: es la
   forma de forzar un rastreo inmediato en lugar de esperar al reintento.
4. **Inspección de URLs** → `https://maquinaria.click/` → **Probar URL real** →
   debe mostrar 200 y el HTML renderizado → **Solicitar indexación**.
5. En 24-72 h el estado debería pasar a **«Correcto»**. El recuento de URLs
   descubiertas será bajo (unas 150) hasta que haya anuncios reales.

Si tras eso sigue en rojo, mira en Search Console → **Configuración → Rastreo**
(estadísticas de rastreo) y **robots.txt**: un 403/5xx masivo para Googlebot
apuntaría a una protección de Vercel *Deployment Protection* o a un firewall, no
al sitemap.
