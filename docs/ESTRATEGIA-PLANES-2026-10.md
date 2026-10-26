# Estrategia de planes — MaquinariaOcasión

> **Estado:** proyecto en construcción y **todavía sin lanzamiento oficial**.
> Esta es una propuesta re-hecha a partir del rediseño estratégico aportado
> por el propietario (€19/€49). **Todavía no está aplicada.** El comportamiento
> que hoy tiene el código sigue descrito en
> [`PLANES-ANUNCIOS.md`](./PLANES-ANUNCIOS.md): un único plan Profesional de
> 19 €/mes con 15 anuncios.
>
> **Aviso de datos:** todas las cuentas de vendedor visibles ahora son
> ficticias. Se crearon como semilla para construir, poblar y probar la web.
> Por tanto, sus anuncios por usuario, fotos, planes, pruebas o actividad
> **no se usan para dimensionar cupos ni como evidencia de mercado,
> demanda o disposición a pagar**. Los cupos de esta estrategia son una
> hipótesis de segmentación para validar con los primeros vendedores reales.
>
> **Objetivo de esta versión:** preparar antes del lanzamiento una
> monetización por escala y herramientas sin frenar la entrada de inventario
> ni cobrar por recibir contactos. Primero habrá que crear oferta y demanda
> reales; el MRR vendrá después de demostrar contactos.

## 1. Decisión resumida

Se pasa de un único plan de pago a dos:

|  | Gratis | Básico | Profesional |
|---|---:|---:|---:|
| Precio mensual (IVA incluido) | 0 € | **19 €/mes** | **49 €/mes** |
| Precio anual (10 mensualidades) | 0 € | **190 €/año** | **490 €/año** |
| Equivalente mensual del anual | 0 € | 15,83 €/mes | 40,83 €/mes |
| Para quién | Venta ocasional | Taller o compraventa pequeña | Concesionario, flota o compraventa con rotación |
| Stock orientativo | 1 máquina | 2–5 máquinas | Más de 5 o necesidad de CSV/datos |
| Anuncios activos | 1 | 5 | Ilimitados* |
| Fotos por anuncio | 10 | 20 | 30 |
| Vídeo enlazado | — | ✅ | ✅ |
| Chat, teléfono y WhatsApp | Ilimitados | Ilimitados | Ilimitados |
| Escaparate `/tienda/slug` | — | ✅ | ✅ |
| Destacados incluidos | — | 3/mes | 15/mes |
| Estadísticas | Totales | Por anuncio + diagnóstico (30 días) | Completas: serie, mercado, 90 días y CSV |
| Importar stock CSV | — | — | ✅, hasta 100 filas por archivo |
| Soporte | Estándar | Prioritario | Prioridad alta + onboarding asistido |
| Comisión por venta | 0 % | 0 % | 0 % |

\* “Ilimitados” significa sin cupo comercial para un negocio y su stock real.
Siguen aplicando moderación, prohibición de duplicados/spam y el límite
técnico actual de 100 filas por importación (se pueden subir varios archivos).

### Correspondencia interna (implementada)

No hacen falta IDs nuevos: la base ya acepta la escalera antigua.

| Nombre comercial | ID interno | Cupo SQL actual |
|---|---|---:|
| Gratis | `gratis` | 1 |
| Básico | `starter` | 5 |
| Profesional | `unlimited` | sin cupo |
| Valor técnico anterior, no comercial | `plus` | 15 |

Como la web aún no se ha lanzado y las cuentas actuales son ficticias,
`plus` no representa clientes ni derechos adquiridos. Puede retirarse como
plan vendible y las cuentas semilla pueden migrarse, reasignarse o limpiarse
libremente como datos de prueba. Si el código lo conserva transitoriamente,
será solo por compatibilidad técnica durante la implementación, nunca como
una restricción comercial.

## 2. Punto de partida: construcción pre-lanzamiento

La plataforma todavía se está creando y mejorando. No ha habido lanzamiento
oficial, clientes de pago ni una base real de vendedores sobre la que medir
comportamiento.

- **Todos los vendedores y anuncios visibles ahora son ficticios/semilla.**
  Sirven para diseño, desarrollo, contenido de prueba y QA. No se tendrá en
  cuenta cuántos anuncios tiene cada cuenta ficticia, qué plan o prueba se
  le asignó, cuántas fotos incluimos ni ninguna otra métrica derivada de
  ellas para decidir precios, cupos o conversión.
- Los cupos **1 / 5 / ilimitado** vienen de la segmentación propuesta por el
  propietario —ocasional, pequeño profesional y flota/concesionario— y se
  validarán con vendedores reales en una beta/piloto o tras el lanzamiento.
- El código actual contiene un único plan de desarrollo/comercial provisional:
  **19 €/mes, 15 anuncios, 20 fotos, 5 destacados/mes**, escaparate,
  estadísticas completas y CSV. Al no haberse lanzado, puede sustituirse sin
  migración comercial ni obligación de mantener condiciones a las cuentas
  ficticias.
- Stripe está implementado en código, pero **no activado comercialmente**:
  falta la cuenta/claves definitivas del propietario y su webhook. Hoy el
  checkout devuelve “Stripe no está configurado todavía”.
- La base ya soporta `starter` (5), `plus` (15) y `unlimited`, cupos,
  prueba de 30 días, 7 días de gracia, pausa sin borrado, cupones, regalo
  manual de planes, dunning y reactivación. Son capacidades técnicas
  disponibles, no datos de clientes.
- Ya existen escaparate, vídeo para planes de pago, importación CSV,
  rendimiento por anuncio, comparativa de mercado, destacados y créditos.
- No existen todavía una API pública de inventario, cuentas multiusuario
  comerciales ni un servicio real de account manager. Por tanto, **no se
  venden en el lanzamiento**.

## 3. Principios

1. **La identidad es gratis; el plan es capacidad.** Ser particular, taller
   o profesional define el sello. Pagar define cupo y herramientas.
2. **No se cobra por contacto.** Limitar mensajes del plan gratuito
   reduciría liquidez, confianza y probabilidad de venta.
3. **No hay comisión por venta.** La cuota es predecible y la plataforma no
   necesita intervenir en la transacción para monetizar.
4. **El primer anuncio no tiene peaje.** El vendedor debe publicar y ver
   funcionamiento antes de ver un checkout.
5. **El pago aparece en el momento de necesidad:** segundo anuncio, cupo
   lleno, abrir escaparate, importar CSV, ver datos avanzados o fin de
   prueba.
6. **No vender vaporware.** API, multiusuario y account manager entran
   cuando haya demanda demostrada y producto operativo.
7. **Pagar no compra relevancia permanente.** La visibilidad patrocinada se
   concentra en destacados/boosts etiquetados; el resto del ranking sigue
   dependiendo de relevancia, calidad y frescura.
8. **Al bajar de plan no se borra nada.** Tras la gracia se pausan los
   anuncios excedentes y se reactivan al volver a pagar.

## 4. Qué se corrige respecto a la propuesta €19/€49 original

La arquitectura de precios se mantiene, pero se ajustan cinco puntos:

### 4.1 No limitar contactos del plan gratuito

La propuesta original sugería limitar mensajes. Se elimina: en un
marketplace nuevo, cada contacto es prueba de valor para ambas partes.
El abuso se controla con registro, rate limits, moderación y denuncias,
no con un contador comercial.

### 4.2 No caducar anuncios a 30/90 días por plan (todavía)

La maquinaria pesada puede tardar meses en venderse y el catálogo aún
necesita profundidad. Además, hoy no existe un campo de caducidad de
anuncio: existe renovación manual cada 7 días y ese endpoint reescribe
`creado_en`, lo que contaminaría antigüedad y estadísticas si se usa como
base de una política de duración.

**Sustitución recomendada:** todos los anuncios permanecen mientras estén
activos y dentro del cupo. Como mejora posterior, pedir confirmación de
disponibilidad cada 30 días (sin borrar) y separar `creado_en` de
`renovado_en` antes de monetizar frescura o duración.

### 4.3 No prometer “posicionamiento mejorado” general en Básico

Básico no recibe un multiplicador permanente en buscador. Recibe
escaparate y 3 destacados mensuales. Así el comprador sigue viendo primero
lo relevante y el inventario gratuito no queda enterrado por defecto.

### 4.4 CSV sí en Profesional; API y multiusuario después

La importación CSV ya funciona y es el diferenciador operativo inmediato
de Profesional. API/feed y multiusuario se construirán solo si el piloto
muestra demanda: por ejemplo, al menos 5 negocios con más de 50 máquinas
o 10 cuentas Profesional pidiendo asientos/feed. Si llegan, se decidirá
con datos si se incluyen en Profesional para reforzar los 49 € o si nace
un nivel Flota superior.

### 4.5 “Account manager dedicado” se convierte en onboarding asistido

Con el tamaño actual, prometer un account manager nominal sería humo.
Profesional incluye ayuda de puesta en marcha (revisar escaparate y primer
CSV) y prioridad de soporte durante horario laborable. No se prometen
SLAs imposibles de sostener.

## 5. Detalle por plan

### Gratis — “Vende tu máquina”

- 1 anuncio activo.
- 10 fotos.
- Chat, teléfono y WhatsApp sin límite de contactos.
- Estimador de precio, favoritos, compartir y estadísticas totales.
- Renovación manual disponible.
- Puede comprar créditos para visibilidad puntual.
- Sin escaparate propio, vídeo, CSV ni destacados incluidos.

**Papel estratégico:** captación de particulares y primera experiencia de
cualquier vendedor. No es una cuenta “de segunda”: si vendes una máquina,
es suficiente.

### Básico — 19 €/mes

- 5 anuncios activos (3,80 € por anuncio/mes a cupo lleno).
- 20 fotos y vídeo enlazado.
- Escaparate con URL propia.
- 3 destacados incluidos al mes.
- Rendimiento por anuncio y diagnóstico en periodo de 30 días.
- Soporte prioritario por email.
- Factura automática y sin permanencia.

**Papel estratégico:** plan de entrada para talleres y compraventas
pequeñas. Su argumento no es “ser profesional”; es tener hasta cinco
máquinas visibles con escaparate y algo de visibilidad incluida.

### Profesional — 49 €/mes

- Anuncios activos sin cupo comercial.
- 30 fotos y vídeo enlazado.
- Escaparate con URL propia.
- 15 destacados incluidos al mes.
- Importación CSV de hasta 100 filas por archivo, con vista previa.
- Estadísticas completas: serie diaria, comparativa de mercado, 90 días y
  exportación CSV.
- Prioridad alta en soporte y onboarding asistido para el primer CSV.

**Papel estratégico:** software de publicación para quien rota stock. El
salto de precio no se justifica solo por “más anuncios”: lo justifican CSV,
datos de mercado, destacados y ausencia de cupo.

## 6. Créditos: se quedan fuera de los planes

Los créditos siguen siendo pago por uso para un anuncio concreto:

- Paquetes actuales: 15 créditos/5 €, 40/10 € y 100/20 €.
- Destacado suelto actual: 4/6/10 créditos por 12/24/48 horas.
- Boost actual: 1 crédito y visibilidad prioritaria durante 7 días.

Hay una incoherencia económica que debe corregirse **antes** de empujar
Stripe: el boost de 1 crédito durante 7 días puede canibalizar los
destacados incluidos y los sueltos. Recomendación para la fase de
implementación: convertir el boost en una “subida” puntual (refresca una
vez, sin fijar 7 días) o reducir su duración a 48 horas manteniendo el
crédito de bienvenida como muestra. No se deben cambiar saldos ya
comprados sin equivalencia.

Regla comercial en UI: si un vendedor destaca dos o más veces al mes, se
le muestra que Básico ya incluye 3 destacados; si necesita CSV o supera
5 anuncios, se le recomienda Profesional.

## 7. Prueba gratuita y lanzamiento

### Prueba self-serve

- **30 días de Básico**, sin tarjeta, una vez por cuenta.
- Después, **7 días de gracia** con el mismo cupo.
- Al terminar la gracia se pausan los anuncios por encima de 1; no se
  borra ninguno.
- La prueba arranca cuando el vendedor se identifica como taller o
  profesional o la activa desde precios/panel.
- Avisos existentes a 10, 3 y 1 días, más aviso de gracia y win-back.

No se recomienda regalar Profesional ilimitado automáticamente a todo
registro: facilita spam/importaciones masivas y crea una caída de cupo
demasiado brusca. Los negocios con más de 5 máquinas pueden recibir una
prueba Profesional cualificada mediante cupón o regalo manual.

### Programa Fundadores (beta/piloto con los primeros vendedores reales)

Este piloto se hará cuando el propietario decida invitar a los primeros
negocios reales, ya sea en una beta cerrada previa o justo en el lanzamiento.
No tiene ninguna relación con las cuentas ficticias actuales: la línea base
comercial empieza en cero con esos primeros vendedores reales.

- **20 negocios máximo**, seleccionados por categoría y geografía.
- Requisitos: negocio verificable, escaparate completo y al menos 5
  anuncios reales con precio, ubicación, horas/estado y 5+ fotos.
- Beneficio: **90 días de Profesional sin coste**, aplicado con el regalo
  manual/admin ya existente y auditado en `planes_regalos`.
- Compromiso: mantener stock actualizado y dar feedback a los 30 y 75 días.
- Al terminar, eligen Básico o Profesional a precio público. El piloto no
  crea un precio oculto permanente.
- Las cuentas y anuncios ficticios quedan excluidos de plazas, línea base
  y KPIs. No se mezclan con inventario o contactos reales al evaluar precios.

El objetivo de Fundadores no es “regalar por regalar”: es cambiar 3 meses
de cuota por stock de calidad, contactos y la primera evidencia real de
disposición a pagar.

## 8. Momentos de conversión

| Momento | Mensaje | Destino |
|---|---|---|
| Registro | “Publica tu primera máquina gratis” | Publicar |
| Selector de stock | 1 / 2–5 / +5 máquinas | Gratis / Básico / Profesional |
| Segundo anuncio | “Tu plan gratuito permite 1 activo” | Prueba Básico |
| 80–100 % de Básico | “Estás usando 5 de 5” | Profesional |
| Abrir escaparate | “Tu URL de tienda va en los planes” | Básico o Profesional |
| Intentar CSV | “Importa tu stock sin formulario a formulario” | Profesional |
| Ver mercado/90 días/exportar | Diagnóstico avanzado bloqueado con contexto | Profesional |
| Primer contacto o venta | Prueba social y siguiente paso | Activar plan o destacar |
| Día 20–30 de prueba | Cupo usado + contactos recibidos | Convertir |
| Fin de prueba | 7 días de gracia, nada se borra | Activar/pausar |
| Compra repetida de créditos | Comparación con destacados incluidos | Básico |
| Baja/cancelación | Bajar de plan o seguir hasta fin de periodo | Portal Stripe |

La página de precios debe recomendar por stock (“¿Cuántas máquinas tienes
en venta?”) antes que mostrar tres columnas frías. La identidad, el plan y
los créditos se siguen explicando como tres capas distintas.

## 9. Transición técnica antes del lanzamiento

No hay transición comercial que proteger: no existen todavía clientes,
suscriptores ni vendedores reales usando la web. Las cuentas actuales son
nuestras fixtures de desarrollo.

- El plan provisional `plus` puede dejar de venderse y retirarse de la UI
  sin grandfathering comercial.
- Las cuentas ficticias con `plan_anuncios='plus'` o
  `trial_plan='plus'` pueden migrarse a `starter`/`unlimited`, volver a
  `gratis` o eliminarse al resembrar datos. Su estado actual no condiciona
  nombres, cupos ni precios.
- Si se mantiene `plus` temporalmente en tipos, SQL o webhook, será solo
  para que el código no falle durante la limpieza técnica; no aparecerá
  como plan comprable.
- Las pruebas reales que se creen tras implementar esta estrategia usarán
  Básico (`starter`) por defecto.
- Las suscripciones Stripe futuras usarán `lookup_key` estables:
  `maquinariaocasion_starter_mensual`, `maquinariaocasion_starter_anual`,
  `maquinariaocasion_unlimited_mensual` y
  `maquinariaocasion_unlimited_anual`.
- Antes del lanzamiento habrá que decidir por separado si el contenido
  ficticio se elimina, se sustituye por inventario real o se conserva solo
  en entornos de prueba. Esa decisión de catálogo no debe contaminar la
  estrategia de planes.

## 10. Plan de aplicación

### Fase A — decisión y limpieza pre-lanzamiento

1. Aprobar nombres, cupos y qué plan se prueba por defecto.
2. Corregir en la futura implementación los textos antiguos de la página
   de precios que aún hablan de 30 fotos y 3/5/15 destacados para el plan
   único provisional.
3. Definir criterios Fundadores y guion de captación para los primeros
   vendedores reales.
4. Marcar/separar los datos semilla para que nunca entren en analítica
   comercial. No hace falta diseñar migraciones pensando en conservar los
   planes asignados a usuarios ficticios.

### Fase B — implementación en una sola rama/PR ✅ (2026-10-26)

> **Hecho (2026-10-26):** implementada en código y con la migración SQL
> `202610260001` aplicada a producción. Básico (`starter`, 19 €) y Profesional
> (`unlimited`, 49 €) son los planes vendibles; la prueba de 30 días es de
> Básico; el CSV queda solo en Profesional, el escaparate en cualquier plan
> de pago/prueba y las estadísticas por nivel 0/1/3. El cobro sigue pendiente
> de activar Stripe (sin claves reales el checkout responde 503): regalos,
> cupones y prueba ya funcionan sin Stripe, así que las fases C (Fundadores)
> y D pueden arrancar cuando se decida el lanzamiento.


1. `src/lib/planes-anuncios.ts`: dos planes vendibles (`starter`,
   `unlimited`), precios 19/190 y 49/490, etiquetas y recomendación por
   stock. `plus` solo se mantendrá si hace falta compatibilidad técnica
   transitoria; no será un plan comercial.
2. SQL: el cupo 5/ilimitado ya existe; nueva migración solo para que la
   prueba por defecto sea `starter`, ajustes de defaults y, si se quiere,
   normalizar las fixtures ficticias a los IDs nuevos.
3. `src/lib/rendimiento.ts`: Básico nivel 1; Profesional nivel 3.
4. Escaparate: cualquier plan de pago vigente o prueba.
5. CSV: solo Profesional. Vídeo: cualquier plan de pago.
6. Stripe: alta/cambio con prorrateo entre Básico y Profesional y precios
   por `lookup_key`.
7. Admin: regalar/cuponar Básico o Profesional y estadísticas por plan
   filtrando siempre las cuentas ficticias de los KPIs comerciales.
8. UI: `/para-profesionales`, pestaña “Mi plan”, publicar, tienda,
   importar, créditos, emails/push del cron y textos de prueba.
9. Tests: precios, cupos, prueba, rendimiento, regalos/cupones, Stripe,
   CSV, tienda y SQL de pausa/reactivación.

### Fase C — piloto Fundadores

1. Captar 10–20 negocios reales, priorizando categorías con demanda y
   provincias sin oferta.
2. Aplicar 90 días de Profesional con la herramienta de regalo.
3. Medir stock real, contactos cualificados, uso de CSV/destacados y
   disposición a pagar.
4. Probar Stripe en modo test de punta a punta (alta, cambio 19→49,
   anual, fallo de tarjeta, cancelación y portal).

### Fase D — venta self-serve

1. Activar claves/webhook de Stripe del propietario y redeploy.
2. Publicar precios €19/€49 solo cuando el checkout funcione; no anunciar
   un plan que devuelve 503.
3. Mantener Bizum/manual para créditos si sigue configurado; la
   suscripción recurrente va con tarjeta/Apple Pay/Google Pay.

### Fase E — software (solo con demanda)

- Multiusuario por negocio.
- Feed/API de inventario y sincronización de vendidos.
- Informes programados y exportaciones avanzadas.
- Servicios de inspección, tasación, transporte o financiación como
  ingresos por referido/pago único, separados de la suscripción.

## 11. KPIs y reglas de ajuste

**Hoy la línea base comercial es cero.** La web no está lanzada y las
cuentas actuales son ficticias, así que no existe una media actual de
anuncios por vendedor, conversión, uso de cupo, fotos o disposición a pagar
que deba respetarse. Las métricas empezarán a contar con los primeros
vendedores y compradores reales de la beta o del lanzamiento.

No se juzgará el precio solo por clics en “contratar”. Primero hay que
demostrar contactos.

### Indicadores principales (solo usuarios e inventario reales)

- Anuncios reales activos y vendedores reales verificados.
- Contactos cualificados por anuncio activo y por vendedor/mes.
- % de vendedores profesionales reales que publican en 7 días.
- Uso de cupo real: % de Básico en 80–100 % y mediana de anuncios por
  cuenta real.
- Prueba → pago y Fundadores → pago.
- Mezcla Básico/Profesional y upgrades en 90 días.
- Churn mensual, fallos de pago recuperados y reactivaciones.
- Uso de CSV, escaparate, estadísticas y destacados incluidos.
- Ingreso por vendedor real activo, incluyendo créditos.

Las cuentas ficticias deben excluirse por diseño de estos cálculos (por
ejemplo, con el flag de demo/semilla y listas de cuentas internas), no
restarlas a ojo después.

### Señales para ajustar sin rehacer toda la estrategia

- Si muchos negocios cualificados tienen 6–10 máquinas, reciben contactos
  pero rechazan 49 €, **subir Básico a 10 anuncios** antes que descontar
  Profesional.
- Si Profesional convierte pero casi nadie usa CSV/datos, su valor es el
  cupo: habrá que reforzar software o revisar el salto 19→49.
- Si la prueba genera publicaciones pero pocos contactos, el problema es
  demanda/calidad, no el precio: no bajar precios automáticamente.
- Si los destacados no producen más contactos que un anuncio normal,
  dejar de venderlos como beneficio central y revisar ranking/medición.
- Si aparecen varios negocios con +50 máquinas pidiendo feed o asientos,
  construir multiusuario/API y decidir si entra en Profesional o nace
  Flota.

## 12. Escenarios de ingreso (ilustrativos)

Ingresos mensuales brutos con IVA incluido, antes de comisiones de Stripe,
reembolsos e impuestos. Son escenarios aritméticos con futuras cuentas
reales; no son una previsión ni utilizan las cuentas ficticias actuales.

| Básicos | Profesionales | Bruto mensual | Base sin IVA aprox. |
|---:|---:|---:|---:|
| 10 | 2 | 288 € | 238 € |
| 25 | 10 | 965 € | 798 € |
| 50 | 25 | 2.175 € | 1.798 € |
| 100 | 50 | 4.350 € | 3.595 € |

El anual no cambia el ingreso reconocido mensual, pero cobra 10 meses por
adelantado y reduce fricción/churn: 190 € o 490 € por suscripción.

## 13. Copy comercial base

- **Gratis:** “Para vender una máquina. 1 anuncio, contactos ilimitados y
  sin comisión.”
- **Básico:** “Para talleres con hasta 5 máquinas en venta. Escaparate,
  20 fotos y 3 destacados al mes.”
- **Profesional:** “Para compraventas y flotas que rotan stock. Sin cupo,
  carga CSV, 15 destacados y datos de mercado.”

Titular propuesto: **“Publica una máquina gratis. Publica tu stock sin
comisiones.”**

## 14. Decisiones que quedan cerradas si se aprueba este documento

1. Nombres comerciales: **Gratis / Básico / Profesional**.
2. Precios: **19/190 €** y **49/490 €**, IVA incluido.
3. Cupos de lanzamiento: **1 / 5 / ilimitado**.
4. Prueba pública: **30 días de Básico**; Profesional en piloto cualificado.
5. Contactos: **ilimitados en todos los planes**.
6. CSV y datos completos: **solo Profesional**.
7. API, multiusuario y account manager: **fuera de la venta inicial**.
8. Datos semilla: **nunca** se usan para fijar/validar precios, cupos o KPIs;
   la medición empieza con usuarios reales.

Si el propietario aprueba estas ocho decisiones, el siguiente paso es la
Fase B en una rama/PR propia. Stripe se activa después, cuando el
propietario facilite/configure su cuenta y webhook.
