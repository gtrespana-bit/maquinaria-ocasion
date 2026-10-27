import { serializeJsonLd } from '@/lib/serialize-json-ld'
import type { Metadata } from 'next'
import {
  BadgeEuro,
  Camera,
  Check,
  CreditCard,
  FileSpreadsheet,
  Minus,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'
import LocalLink from '@/components/LocalLink'
import { PLANES_PRO } from '@/lib/planes-anuncios'
import PlanesClient from './PlanesClient'

export const metadata: Metadata = {
  title: 'Planes para profesionales y talleres',
  description:
    'Publica todo tu stock sin comisión por venta. Básico, 19 €/mes con 5 anuncios, o Profesional, 49 €/mes sin límite. Escaparate, estadísticas y destacados.',
  alternates: {
    canonical: 'https://maquinaria.click/para-profesionales',
    languages: { 'es-ES': 'https://maquinaria.click/para-profesionales', 'x-default': 'https://maquinaria.click/para-profesionales' } },
  openGraph: {
    title: 'Planes para profesionales y talleres',
    description: 'Dos planes sin comisión por venta: Básico, 19 €/mes (5 anuncios), y Profesional, 49 €/mes (sin límite). Escaparate y estadísticas, sin permanencia.',
    url: 'https://maquinaria.click/para-profesionales',
    siteName: 'MaquinariaOcasión',
    type: 'website',
    locale: 'es_ES',
    images: [{ url: 'https://maquinaria.click/api/og/catalog?categoria=agricola', width: 1200, height: 630, alt: 'Planes para profesionales' }] } }

const extras = [
  {
    icon: Store,
    title: 'Escaparate propio',
    desc: 'Una URL /tienda/tu-taller para tu web, Instagram, ferias y Google. Tus anuncios, tu marca.' },
  {
    icon: Camera,
    title: 'Más fotos, mejor anuncio',
    desc: '20 fotos en Básico y 30 en Profesional, con vídeo en ambos. Una ficha completa responde antes las dudas del comprador.' },
  {
    icon: Star,
    title: 'Destacados incluidos',
    desc: '3 destacados al mes en Básico y 15 en Profesional, sin gastar créditos. Los que más rotación tienen, arriba.' },
  {
    icon: FileSpreadsheet,
    title: 'Importa todo tu stock de una vez',
    desc: 'Con Profesional, sube el CSV de tu Excel o del DMS y publica hasta 100 anuncios por archivo con vista previa, sin formulario a formulario.' },
  {
    icon: TrendingUp,
    title: 'Sabes qué anuncio funciona',
    desc: 'Básico da visitas, favoritos y contactos por anuncio. Profesional suma serie diaria, comparativa de mercado, 90 días de histórico y exportación CSV.' },
  {
    icon: BadgeEuro,
    title: 'Tarifa plana, no comisión',
    desc: 'Vendas una o diez, pagas lo mismo. No te quedas con un % de la operación.' },
  {
    icon: CreditCard,
    title: 'Factura para tu gestoría',
    desc: 'Añade tu NIF/CIF al pagar y descarga la factura cuando la necesites. Sin pedirla por email.' },
]

const filasComparativa: {
  label: string
  gratis: string
  basico: string
  profesional: string
}[] = [
  { label: 'Anuncios activos a la vez', gratis: '1', basico: '5', profesional: 'Sin límite' },
  { label: 'Fotos por anuncio', gratis: '10', basico: '20', profesional: '30' },
  { label: 'Vídeo en el anuncio', gratis: '—', basico: 'Sí', profesional: 'Sí' },
  { label: 'Destacados incluidos al mes', gratis: '—', basico: '3', profesional: '15' },
  { label: 'Escaparate /tienda/tu-taller', gratis: '—', basico: 'Sí', profesional: 'Sí' },
  { label: 'Estadísticas del vendedor', gratis: 'Totales', basico: 'Por anuncio', profesional: 'Completas + mercado' },
  { label: 'Importar stock desde CSV', gratis: '—', basico: '—', profesional: 'Hasta 100 filas' },
  { label: 'Soporte', gratis: 'Estándar', basico: 'Prioritario', profesional: 'Prioritario + alta asistida' },
  { label: 'Créditos extra', gratis: 'Se compran', basico: 'Se compran', profesional: 'Se compran' },
  { label: 'Comisión por venta', gratis: '0 %', basico: '0 %', profesional: '0 %' },
]

const faqs = [
  {
    q: '¿Contratar un pack me convierte en profesional?',
    a: 'Sí, y es gratis. Tu «tipo de vendedor» (particular, taller o profesional) define cómo apareces y qué puedes hacer. El pack solo define cuánto stock puedes tener publicado. Si contratas un pack siendo particular, pasas automáticamente a profesional para que no pagues un cupo que no puedes usar.' },
  {
    q: '¿Es una comisión por venta?',
    a: 'No. MaquinariaOcasión cobra una cuota fija por publicar, no un porcentaje de la venta. Puedes vender una máquina o diez y la cuota es la misma.' },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. Desde tu panel, en «Mi plan» → «Gestionar suscripción», puedes cambiar la tarjeta, descargar facturas o darte de baja. No hay permanencia ni penalización: mantienes el pack hasta el final del periodo que ya has pagado.' },
  {
    q: '¿Qué pasa si me paso del cupo?',
    a: 'No se borra nada. Los anuncios ya publicados siguen visibles; lo que no podrás hacer es publicar nuevos hasta ampliar tu plan, pausar o marcar alguno como vendido. Y si bajas de plan, los que sobran se pausan, no se borran.' },
  {
    q: '¿Los créditos caducan?',
    a: 'No. Los créditos se compran aparte y no tienen fecha de caducidad. Sirven para subir un anuncio al nº 1 (1 crédito) o destacarlo 12, 24 o 48 horas (4, 6 o 10 créditos). Si tienes un pack, ya incluyes destacados cada mes.' },
  {
    q: '¿Puedo pagar con Bizum?',
    a: 'Los planes se cobran con tarjeta (incluye Apple Pay y Google Pay), porque Bizum no permite cobros recurrentes. Para comprar créditos sí puedes pagar con Bizum, tarjeta o los métodos manuales.' },
  {
    q: '¿Hay factura?',
    a: 'Sí. Al pagar puedes añadir tu NIF/CIF y el domicilio fiscal. Stripe envía la factura por email y la tienes disponible en el portal de cliente.' },
  {
    q: '¿Hay prueba gratis?',
    a: 'Cuando la promoción está activa, puedes probar el plan Básico (5 anuncios, 3 destacados y escaparate) durante 30 días sin tarjeta. Al terminar hay 7 días de gracia y no se cobra nada automáticamente: si no contratas, pasas al plan gratuito y no se borra ningún anuncio.' },
]

export default async function ParaProfesionalesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const SITIO = 'https://maquinaria.click'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
          { '@type': 'ListItem', position: 2, name: 'Para profesionales', item: SITIO + '/para-profesionales' },
        ] },
      {
        '@type': 'Product',
        '@id': SITIO + '/para-profesionales#plans',
        name: 'Planes para profesionales y talleres',
        description: 'Dos planes sin comisión por venta: Básico, 19 €/mes (5 anuncios), y Profesional, 49 €/mes (sin límite). Escaparate y estadísticas, sin permanencia.',
        brand: { '@type': 'Brand', name: 'MaquinariaOcasión' },
        offers: PLANES_PRO.map(p => ({
          '@type': 'Offer',
          name: p.nombre,
          price: String(p.precioMes),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: SITIO + '/para-profesionales' })) },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ] }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <header className="on-dark relative overflow-hidden bg-ink text-paper">
        <div aria-hidden="true" className="blueprint absolute inset-0 opacity-50" />
        <div className="shell relative pb-14 pt-12 md:pb-18 md:pt-16">
          <p className="t-eyebrow text-signal">Talleres, reparadores y compraventas</p>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-paper lg:col-span-8">
              Publica todo tu stock.{' '}
              <span className="t-serif-italic text-signal">Sin comisión por venta.</span>
            </h1>
            <p className="text-[15px] leading-relaxed text-paper/60 lg:col-span-4 lg:border-l lg:border-line-dark lg:pl-6">
              Dos planes según tu stock: Básico, 19 €/mes para 5 máquinas a la vez, y Profesional,
              49 €/mes sin límite. Mensual o anual, sin permanencia.
            </p>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-8 gap-y-3 border-t border-line-dark pt-6">
            {['Sin comisión por venta', 'Cancela en 2 clics', '2 meses gratis en el anual', 'Factura con NIF/CIF'].map((chip) => (
              <li key={chip} className="t-label flex items-center gap-2 text-paper/60">
                <Check size={11} strokeWidth={2.4} className="text-signal" aria-hidden="true" /> {chip}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        {/* Modelo mental: tres cosas distintas que no hay que confundir */}
        <section aria-labelledby="modelo" className="mb-12">
          <h2 id="modelo" className="t-display t-display-sm text-ink">
            Tres cosas distintas (y ninguna es «el tipo de cuenta»)
          </h2>
          <p className="mt-2 mb-5 max-w-2xl text-[14px] text-muted">
            En MaquinariaOcasión separamos quién eres, cuánto puedes publicar y cuánta visibilidad quieres comprar.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="border border-line bg-[#FBFAF5] p-5">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Users size={18} className="text-ink/60" aria-hidden="true" /> Tipo de vendedor
              </div>
              <p className="t-label mt-1 text-moss">Gratis, siempre</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Particular, taller o profesional. Define tu sello y los filtros del catálogo.
                Se cambia en tu perfil y no cuesta nada.
              </p>
            </div>
            <div className="border border-ink bg-[#FBFAF5] p-5">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Sparkles size={18} className="text-ink/60" aria-hidden="true" /> Plan
              </div>
              <p className="t-label mt-1 text-moss">Desde 19 €/mes</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Básico: 5 anuncios, 20 fotos y 3 destacados al mes. Profesional: sin límite,
                30 fotos y 15 destacados. Escaparate y estadísticas en ambos. Sin comisión por venta.
              </p>
            </div>
            <div className="border border-line bg-[#FBFAF5] p-5">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <CreditCard size={18} className="text-ink/60" aria-hidden="true" /> Créditos
              </div>
              <p className="t-label mt-1 text-moss">Pago por uso, sin caducidad</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Visibilidad puntual: subir al nº 1 o destacar un anuncio concreto.
                Se compran aparte y no caducan.
              </p>
            </div>
          </div>
        </section>

        <h2 className="t-display t-display-md text-ink">Gratis, Básico o Profesional</h2>
        <p className="mt-2 mb-6 text-[14px] text-muted">
          Los precios son en euros. El plan anual equivale a 10 mensualidades: pagas 10 y usas 12.
        </p>

        <PlanesClient />

        {/* Comparativa */}
        <section aria-labelledby="comparativa" className="mt-14">
          <h2 id="comparativa" className="t-display t-display-sm text-ink">
            Comparativa rápida
          </h2>
          <div className="mt-5 overflow-x-auto border border-line bg-[#FBFAF5]">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Comparación de planes de MaquinariaOcasión</caption>
              <thead>
                <tr className="border-b border-line bg-paper-2/70 text-left">
                  <th scope="col" className="t-label px-4 py-3 text-ink">Qué incluye</th>
                  <th scope="col" className="t-label px-4 py-3 text-center text-ink/70">Gratis</th>
                  <th scope="col" className="t-label px-4 py-3 text-center text-ink/70">Básico<br /><span className="text-xs font-normal">19 €/mes</span></th>
                  <th scope="col" className="t-label px-4 py-3 text-center text-ink">Profesional<br /><span className="text-xs font-normal">49 €/mes</span></th>
                </tr>
              </thead>
              <tbody>
                {filasComparativa.map((fila, i) => (
                  <tr key={fila.label} className="border-t border-line">
                    <th scope="row" className="px-4 py-3 text-left text-[13px] font-medium text-ink/80">{fila.label}</th>
                    {[fila.gratis, fila.basico, fila.profesional].map((valor, j) => (
                      <td key={j} className={`px-4 py-3 text-center text-[13px] ${j === 2 ? 'bg-signal/15 font-semibold text-ink' : 'text-ink/70'}`}>
                        {valor === 'Sí' ? (
                          <Check size={14} strokeWidth={2.4} className="mx-auto text-moss" aria-label="Incluido" />
                        ) : valor === '—' ? (
                          <Minus size={14} className="mx-auto text-ink/20" aria-label="No incluido" />
                        ) : (
                          valor
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] text-muted">
            El escaparate se abre con Básico o Profesional. Si ya tenías una tienda activa antes de este cambio, se mantiene.
          </p>
        </section>

        {/* Qué resuelve */}
        <section className="mt-14">
          <h2 className="t-display t-display-sm text-ink">Qué consigues con un plan de pago</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {extras.map(e => (
              <div key={e.title} className="border border-line bg-[#FBFAF5] p-5">
                <e.icon size={20} strokeWidth={1.4} className="mb-4 text-ink" aria-hidden="true" />
                <h3 className="text-[15px] font-semibold text-ink">{e.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Confianza */}
        <section className="mt-14 grid gap-4 md:grid-cols-3">
          <div className="bg-ink p-6 text-paper">
            <ShieldCheck size={20} strokeWidth={1.4} className="mb-4 text-signal" aria-hidden="true" />
            <h3 className="text-[15px] font-semibold">Sin letra pequeña</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-paper/60">
              Sin permanencia, sin comisión por venta y sin renovación sorpresa: avisamos antes de cada cobro y puedes cancelar desde el panel.
            </p>
          </div>
          <div className="border border-line bg-[#FBFAF5] p-6">
            <CreditCard size={20} strokeWidth={1.4} className="mb-4 text-ink" aria-hidden="true" />
            <h3 className="font-bold text-slate-900">Pago con Stripe</h3>
            <p className="text-sm text-slate-600 mt-1">
              Tarjeta, Apple Pay y Google Pay. Factura automática con tu NIF/CIF. No almacenamos datos de tarjeta.
            </p>
          </div>
          <div className="border border-line bg-[#FBFAF5] p-6">
            <Users size={20} strokeWidth={1.4} className="mb-4 text-ink" aria-hidden="true" />
            <h3 className="font-bold text-slate-900">Hecho para el sector de la maquinaria</h3>
            <p className="text-sm text-slate-600 mt-1">
              Compradores que buscan maquinaria, no coches de segunda mano. Filtros técnicos de verdad: horas de uso, potencia, peso y documentación.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mt-14">
          <h2 id="faq" className="t-display t-display-sm text-ink">
            Preguntas frecuentes
          </h2>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {faqs.map(f => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium text-ink">
                  {f.q}
                  <span aria-hidden="true" className="relative h-3 w-3 shrink-0 transition-transform duration-300 group-open:rotate-45"><span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" /><span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink" /></span>
                </summary>
                <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 border border-ink bg-ink p-7 text-paper sm:p-10">
          <h2 className="t-display t-display-md max-w-2xl text-paper">
            Empieza gratis. Suma un plan cuando vendas de forma habitual.
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-paper/60">
            Publica tu primer anuncio sin pagar nada. Si eres taller o compraventa, desde 19 €/mes
            tienes capacidad, escaparate y estadísticas sin comisiones por venta.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LocalLink href="/publicar" className="btn btn-signal">
              Publicar gratis
            </LocalLink>
            <LocalLink href="/register" className="btn btn-outline-light">
              Crear cuenta
            </LocalLink>
          </div>
        </section>
      </div>
    </>
  )
}
