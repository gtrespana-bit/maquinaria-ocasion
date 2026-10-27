# IndexNow

IndexNow avisa **en el momento** a los buscadores que lo soportan (Bing,
Yandex, Seznam, Naver, DuckDuckGo — vía Bing) de que una URL es nueva o ha
cambiado. Google **no** lo usa: para Google sigue mandando el sitemap + la
inspección de URLs de Search Console.

## Piezas

| Pieza | Dónde |
|---|---|
| Clave pública | `public/76e0410c624a49c890a8f681cbeb8da8.txt` (contiene la clave, UTF-8, sin salto de línea) |
| Cliente | `src/lib/indexnow.ts` |
| Aviso al publicar | `src/app/api/publicar/route.ts` |
| Aviso al editar | `src/app/api/productos/editar/route.ts` |
| Red de seguridad + siembra | `src/app/api/cron/indexnow/route.ts` (diario, 06:37 UTC) |
| Envío manual | `scripts/indexnow.mjs` |

La URL de verificación es:

```
https://maquinaria.click/76e0410c624a49c890a8f681cbeb8da8.txt
```

## Qué se envía (y qué no)

- ✅ Ficha `/producto/<slug>` y sus landings `/<provincia>` y
  `/<provincia>/<subcategoría>`.
- ❌ Anuncios de muestra (`es_demo`) — sus fichas llevan `noindex`.
- ❌ Anuncios vendidos, pausados o en moderación.
- ❌ `/en/*` (noindex), `/buscar`, `/admin`, `/dashboard` y demás rutas privadas.
- ❌ En previews y en desarrollo no se envía nada.

IndexNow penaliza el abuso: reenviar URLs que no han cambiado puede acabar en
`429 Too Many Requests`. Por eso el cron diario solo manda lo modificado en las
últimas 26 h y los posts del blog de los últimos 7 días.

## Puesta en marcha

No hay que ejecutar nada a mano: **la primera vez que corra el cron** (06:37 UTC)
detecta que no existe `indexnow_siembra` en `plataforma_ajustes`, envía el
sitemap completo una sola vez y deja la marca. A partir de ahí, solo lo nuevo.

Si quieres adelantarlo en vez de esperar al cron, usa el `?todo=1` de abajo.

## Verificación

```bash
# 1. La clave se sirve bien (debe devolver las 32 letras, text/plain)
curl -s https://maquinaria.click/76e0410c624a49c890a8f681cbeb8da8.txt

# 2. Siembra inicial / envío manual desde tu máquina
node scripts/indexnow.mjs --sitemap --dry-run     # enseña el payload
node scripts/indexnow.mjs --sitemap --enviar      # lo envía de verdad

# 3. Red de seguridad (necesita el CRON_SECRET del proyecto)
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  https://maquinaria.click/api/cron/indexnow

# 4. Siembra completa de todas las URLs del sitemap (una vez)
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://maquinaria.click/api/cron/indexnow?todo=1"
```

Respuestas de la API: `200/202` = aceptado, `400` = formato inválido,
`403` = la clave no coincide con el fichero, `422` = URL de otro host,
`429` = demasiadas peticiones.

Para comprobar que Bing las ha recibido: **Bing Webmaster Tools → IndexNow**
(o «URL submission»). También conviene dar de alta el dominio allí y en Yandex
Webmaster para ver el tráfico real.

## Mantenimiento

- Si algún día se rota la clave: cambia el fichero de `public/`, la constante
  de `src/lib/indexnow.ts` (o define `INDEXNOW_KEY` en Vercel) y la de
  `scripts/indexnow.mjs`. Los tres a la vez o la API devolverá `403`.
- `INDEXNOW_DISABLED=1` en Vercel desactiva todos los envíos sin tocar código.
- El aviso nunca bloquea la publicación: si falla, el anuncio ya está creado y
  el cron diario lo reintenta.
