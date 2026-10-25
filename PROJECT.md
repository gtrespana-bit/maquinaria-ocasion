# MaquinariaOcasión — Proyecto

> Clon de CamperOcasión para la vertical de maquinaria. Documentación del
> motor en [`README.md`](./README.md); estado de la migración en
> [`docs/ESTADO-CLON.md`](./docs/ESTADO-CLON.md).

## General
- **Producto:** Maquinaria agrícola, de obra y herramientas de ocasión en España
- **Dominio canónico:** https://maquinaria.click
- **Idiomas:** `es` (canónico, indexado) y `en` (disponible, noindex)
- **Moneda:** Euro (€) — formato `X.XXX €`

## Heredado de CamperOcasión
Todo el motor de marketplace (auth, chat, panel admin, Stripe, planes,
cupones, push, moderación, SEO programático, PWA) es el mismo. Lo que cambia
es la capa de dominio: categorías, marcas, fichas técnicas y textos.

La identidad vive en un único fichero: `src/lib/marca.ts`. Si cambias el
nombre, el dominio o la paleta, hazlo ahí y en
`tools/clon-vertical/marca.json`, no a mano por el código.
