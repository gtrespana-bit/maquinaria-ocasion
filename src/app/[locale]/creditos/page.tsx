'use client'

import LocalLink from '@/components/LocalLink'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  Zap,
  Star,
  X,
  Upload,
  Loader2,
  Banknote,
  Landmark,
  Wallet,
  CreditCard,
  ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { PAQUETES_CREDITO } from '@/lib/creditos'
import { formatPrecioObligatorio as formatPrecio } from '@/lib/precio'

const paquetesCredito = PAQUETES_CREDITO

interface MetodoPago {
  id: string
  nombre: string
  emoji: string
  icono: 'banknote' | 'landmark' | 'wallet'
  instrucciones: Record<string, string>
}

// Los datos bancarios llegan del servidor (/api/datos-pago).
let metodosPago: MetodoPago[] = [
  {
    id: 'bizum',
    nombre: 'Bizum',
    emoji: '📱',
    icono: 'banknote',
    instrucciones: {} },
  {
    id: 'transferencia',
    nombre: 'Transferencia',
    emoji: '🏦',
    icono: 'landmark',
    instrucciones: {} },
  {
    id: 'paypal',
    nombre: 'PayPal',
    emoji: '💙',
    icono: 'wallet',
    instrucciones: {} },
]

function ModalPago({
  paquete,
  metodos,
  configurado,
  stripeDisponible,
  onClose }: {
  paquete: any
  metodos: MetodoPago[]
  configurado: Record<string, boolean> | null
  stripeDisponible: boolean
  onClose: () => void
}) {
  const t = useTranslations('creditos')
  const router = useRouter()
  const [metodo, setMetodo] = useState('')
  const [yendoAStripe, setYendoAStripe] = useState(false)
  const [errorStripe, setErrorStripe] = useState('')

  /**
   * Pago inmediato con Stripe (tarjeta o Bizum). No se sube comprobante ni hay
   * espera: el webhook acredita los créditos en cuanto Stripe confirma el
   * cobro, así que el usuario vuelve con el saldo ya sumado.
   */
  const pagarConStripe = async () => {
    setErrorStripe('')
    setYendoAStripe(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/creditos'); return }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditos: paquete.creditos }) })
      const data = await res.json()
      if (data?.ok && data.url) {
        window.location.href = data.url
        return
      }
      setErrorStripe(data?.error || 'No se pudo iniciar el pago.')
    } catch {
      setErrorStripe('No se pudo conectar con la pasarela de pago.')
    }
    setYendoAStripe(false)
  }
  const [copiado, setCopiado] = useState('')
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const selectedMetodo = metodos.find(m => m.id === metodo)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiado(label)
    setTimeout(() => setCopiado(''), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Solo se permiten imágenes'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Máximo 5MB'); return }
    setComprobanteFile(file)
    setComprobantePreview(URL.createObjectURL(file))
  }

  const procesarCompra = async () => {
    if (!metodo) { alert('Selecciona un método de pago'); return }
    if (!comprobanteFile) { alert('Sube el comprobante'); return }

    setEnviando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/login?redirect=/creditos`); return }

      const fileExt = comprobanteFile.name.split('.').pop()
      const fileName = `${user.id}/comprobante_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(fileName, comprobanteFile, { contentType: comprobanteFile.type })
      if (uploadError) { alert('Error subiendo: ' + uploadError.message); setEnviando(false); return }

      const { data: { publicUrl } } = supabase.storage.from('comprobantes').getPublicUrl(fileName)

      const res = await fetch('/api/comprar-creditos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditos: paquete.creditos,
          metodoPago: selectedMetodo?.nombre || metodo,
          comprobanteUrl: publicUrl }) })

      const data = await res.json()
      if (data.ok) {
        setEnviado(true)
      } else {
        alert('Error: ' + (data.error || 'Error procesando'))
      }
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error desconocido'))
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 md:items-center">
        <div className="bg-[#FBFAF5] w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-moss bg-moss text-paper">
            <CheckCircle size={22} strokeWidth={1.6} />
          </div>
          <h3 className="text-xl font-bold text-brand-primary mb-2">{t('receiptSent')}</h3>
          <p className="text-sm text-ink/70 mb-4">
            {t.rich('receiptDesc', {
              count: paquete.creditos,
              strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
          <button onClick={onClose} className="w-full bg-brand-primary text-paper py-3 rounded-xl font-bold hover:bg-brand-dark transition">{t('closeBtn')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 md:items-center">
      <div className="bg-[#FBFAF5] w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#FBFAF5] border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-lg font-bold text-ink">{paquete.creditos} {t('credits')} — {formatPrecio(paquete.precio)}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-paper-2 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pago inmediato con Stripe (tarjeta o Bizum) */}
          {stripeDisponible && (
            <div className="border border-ink bg-paper p-5">
              <div className="flex items-start gap-3 mb-3">
                <CreditCard size={20} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-ink/60" />
                <div>
                  <h4 className="font-bold text-ink">Pagar ahora con tarjeta o Bizum</h4>
                  <p className="text-sm text-ink/70">
                    Los créditos se añaden <strong>al instante</strong>, sin subir comprobante
                    ni esperar aprobación. Recibirás la factura por email.
                  </p>
                </div>
              </div>
              {errorStripe && (
                <p className="text-sm text-clay bg-clay/[0.07] border border-clay/30 rounded-lg p-2 mb-3">
                  {errorStripe}
                </p>
              )}
              <button
                onClick={pagarConStripe}
                disabled={yendoAStripe}
                className="w-full bg-signal text-ink py-3 rounded-xl font-bold hover:brightness-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {yendoAStripe
                  ? <><Loader2 size={18} className="animate-spin" /> Conectando con el pago seguro…</>
                  : <>Pagar {formatPrecio(paquete.precio)} ahora</>}
              </button>
              <p className="text-[12px] text-muted text-center mt-2">
                Pago seguro procesado por Stripe. No guardamos los datos de tu tarjeta.
              </p>
            </div>
          )}

          {stripeDisponible && metodos.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-px bg-line flex-1" />
              <span className="text-xs text-ink/45 font-medium">o paga manualmente</span>
              <div className="h-px bg-line flex-1" />
            </div>
          )}

          {/* Método de pago */}
          <div>
            <h4 className="font-bold text-ink mb-3">{t('choosePayment')}</h4>
            {configurado && metodos.length === 0 && (
              <div className="bg-signal/10 border border-line rounded-xl p-4 text-sm text-ink">
                Estamos terminando de configurar los pagos con Bizum, transferencia y PayPal.
                Escríbenos y te damos los datos para comprar créditos ahora mismo:{' '}
                <LocalLink href="/contacto" className="font-semibold underline">contacto</LocalLink>.
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {metodos.map(m => (
                <button key={m.id} onClick={() => setMetodo(m.id)}
                  className={`p-4 rounded-xl border-2 text-center transition ${metodo === m.id ? 'border-ink bg-signal/10' : 'border-line hover:border-line-strong'}`}>
                  <span className="text-3xl block">{m.emoji}</span>
                  <span className="text-sm font-medium text-ink/75 mt-1 block">{m.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monto a pagar */}
          <div className="bg-brand-primary/5 border-2 border-brand-primary/20 rounded-xl p-4">
            <p className="text-xs text-muted mb-1 text-center">{t('amountPay')}</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-3xl font-black text-brand-primary">{formatPrecio(paquete.precio)}</p>
              <button
                onClick={() => copyToClipboard(String(paquete.precio), 'precio')}
                className="flex items-center gap-1 bg-[#FBFAF5] border border-brand-primary/30 rounded-lg px-3 py-2 text-sm text-brand-primary hover:bg-brand-primary/5 transition"
              >
                {copiado === 'precio' ? '✓' : t('copy')}
              </button>
            </div>
          </div>

          {/* Datos de pago */}
          {selectedMetodo && Object.keys(selectedMetodo.instrucciones).length > 0 && (
            <div>
              <h4 className="font-bold text-ink mb-3">{t('paymentData')}</h4>
              <div className="bg-paper-2 rounded-xl p-4 space-y-3">
                {Object.entries(selectedMetodo.instrucciones).map(([key, value]) => {
                  const labelMap: Record<string, string> = {
                    telefono: t('phone'),
                    iban: 'IBAN',
                    banco: t('bank'),
                    receptor: t('holder'),
                    titular: t('holder'),
                    email: 'PayPal (email)' }
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted">{labelMap[key] || key}</span>
                        <p className="text-sm font-medium text-ink">{value}</p>
                      </div>
                      <button onClick={() => copyToClipboard(value, key)} className="text-xs bg-[#FBFAF5] border rounded-md px-2 py-1 hover:bg-paper-2 transition ml-2">
                        {copiado === key ? t('copied') : t('copy')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Comprobante */}
          {selectedMetodo && (
            <div>
              <h4 className="font-bold text-ink mb-3">{t('uploadReceipt')}</h4>
              <div className="border-2 border-dashed border-line-strong rounded-xl p-6 text-center hover:border-brand-primary transition cursor-pointer"
                onClick={() => document.getElementById('comprobante-input')?.click()}>
                <input type="file" accept="image/*" id="comprobante-input" onChange={handleFileChange} className="hidden" />
                {comprobantePreview ? (
                  <div>
                    <Image src={comprobantePreview} alt="Comprobante" className="max-h-48 mx-auto rounded-lg mb-3" width={400} height={300} unoptimized />
                    <button onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview('') }} className="text-sm text-clay hover:underline">{t('removeImage')}</button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto text-muted mb-2" />
                    <p className="text-sm text-muted">{t('tapUpload')}</p>
                    <p className="text-xs text-muted mt-1">{t('maxFile')}</p>
                  </>
                )}
              </div>
              <button onClick={procesarCompra} disabled={enviando || !comprobanteFile}
                className="w-full mt-4 bg-brand-primary text-paper py-3.5 rounded-xl font-bold hover:bg-brand-dark transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {enviando ? <><Loader2 size={18} className="animate-spin" /> {t('sending')}</> : <><Upload size={18} /> {t('sendReceipt')}</>}
              </button>
            </div>
          )}

          {!metodo && (
            <div className="text-center py-4 text-sm text-muted">
              {t('selectPayment')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CreditosPage() {
  const t = useTranslations('creditos')
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState<any>(null)
  // Métodos de pago con datos REALES del servidor. Si una variable de entorno
  // falta, ese método no se ofrece: antes la web mostraba un IBAN y un Bizum de
  // ejemplo (dineros a una cuenta inexistente) porque el endpoint rellenaba los
  // huecos con valores ficticios.
  const [metodos, setMetodos] = useState<MetodoPago[]>(metodosPago)
  const [configurado, setConfigurado] = useState<Record<string, boolean> | null>(null)
  // ¿Está el cobro automático activo? Lo pregunta al servidor para no tener que
  // exponer ninguna clave de Stripe en el bundle del navegador.
  const [stripeDisponible, setStripeDisponible] = useState(false)
  // Se lee de window y no con useSearchParams para no obligar a envolver toda
  // la página en un <Suspense> durante el prerender.
  const [resultadoPago, setResultadoPago] = useState<string | null>(null)

  useEffect(() => {
    setResultadoPago(new URLSearchParams(window.location.search).get('pago'))
    fetch('/api/stripe/estado')
      .then(r => r.json())
      .then(d => setStripeDisponible(Boolean(d?.disponible)))
      .catch(() => {})
  }, [])

  // Cargar datos de pago reales del servidor (IBAN, teléfono Bizum, PayPal…)
  useEffect(() => {
    fetch('/api/datos-pago')
      .then(r => r.json())
      .then(d => {
        const conDatos = metodosPago
          .map(m => (d?.[m.id] && typeof d[m.id] === 'object' ? { ...m, instrucciones: d[m.id] } : m))
          .filter(m => (d?.configurado ? d.configurado[m.id] !== false : true))
        setMetodos(conDatos)
        setConfigurado(d?.configurado ?? null)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="bg-paper">
      <header className="border-b border-line">
        <div className="shell pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="t-eyebrow text-ink/40">Visibilidad</p>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="t-display t-display-lg text-ink lg:col-span-8">
              {t('title1')} <span className="t-serif-italic">{t('title2')}</span>
            </h1>
            <p className="text-[14.5px] leading-relaxed text-muted lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
              {t.rich('subtitle', { strong: (chunks) => <strong className="font-semibold text-ink">{chunks}</strong> })}
            </p>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
      {resultadoPago === 'ok' && (
        <div className="mb-8 flex items-start gap-3 border border-moss/25 bg-moss-soft p-5">
          <CheckCircle size={18} className="mt-0.5 shrink-0 text-moss" />
          <div>
            <p className="text-[14px] font-semibold text-moss">Pago recibido. ¡Gracias!</p>
            <p className="mt-1 text-[13px] leading-relaxed text-moss/80">
              Tus créditos se abonan en cuanto el banco confirma la operación (normalmente es
              inmediato; con Bizum puede tardar unos segundos). Si no ves el saldo actualizado,
              recarga tu <LocalLink href="/dashboard" className="font-semibold underline underline-offset-2">panel</LocalLink> en un minuto.
            </p>
          </div>
        </div>
      )}
      {resultadoPago === 'cancelado' && (
        <div className="mb-8 border border-signal-deep/40 bg-signal-soft/40 p-5">
          <p className="text-[14px] font-semibold text-ink">Pago cancelado</p>
          <p className="mt-1 text-[13px] text-ink/65">No se ha cobrado nada. Puedes elegir otro paquete cuando quieras.</p>
        </div>
      )}

      {/* Qué puedes hacer con créditos */}
      <section>
        <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('whatFor')}</h2>
        <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
          <div className="bg-[#FBFAF5] p-6">
            <div className="flex items-start gap-3">
              <Zap size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink" />
              <div>
                <h3 className="text-[15px] font-semibold text-ink">{t('boostTitle')}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  {t.rich('boostDesc', { strong: (chunks) => <strong className="font-semibold text-ink">{chunks}</strong> })}
                </p>
                <p className="t-display t-num mt-3 text-[1.6rem] leading-none text-ink">{t('boostPrice')}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#FBFAF5] p-6">
            <div className="flex items-start gap-3">
              <Star size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink" />
              <div>
                <h3 className="text-[15px] font-semibold text-ink">{t('featureTitle')}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  {t.rich('featureDesc', { strong: (chunks) => <strong className="font-semibold text-ink">{chunks}</strong> })}
                </p>
                <dl className="mt-3 divide-y divide-line/70 border-t border-line/70">
                  {[['4', '12 h'], ['6', '24 h'], ['10', '48 h']].map(([creditos, horas]) => (
                    <div key={horas} className="flex items-baseline justify-between gap-4 py-1.5">
                      <dt className="t-label text-ink/45">{creditos} créditos</dt>
                      <dd className="t-num text-[13px] font-semibold text-ink">{horas}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Puente plan <-> créditos */}
      <div className="mt-6 flex flex-col justify-between gap-4 border border-line bg-paper-2/60 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-[14px] font-semibold text-ink">¿Tienes varias máquinas a la venta?</p>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink/60">
            Los planes de pago ya incluyen destacados cada mes: Básico (19 €/mes, 3 destacados y 5
            anuncios) o Profesional (49 €/mes, 15 destacados y anuncios sin límite), con escaparate
            propio. Suele salir más barato que comprar créditos sueltos.
          </p>
        </div>
        <LocalLink href="/para-profesionales" className="btn btn-ink btn-sm shrink-0">
          Ver planes <ArrowRight size={13} />
        </LocalLink>
      </div>

      {/* Paquetes */}
      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink pb-3">
          <h2 className="t-display t-display-sm text-ink">{t('choosePackage')}</h2>
          <p className="t-label text-ink/40">{t('eurNote')}</p>
        </div>

        <div className="creditos-grid mt-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {paquetesCredito.map((pkg) => {
            const porCredito = pkg.precio / pkg.creditos
            return (
              <div key={pkg.creditos} className={`relative flex flex-col ${pkg.popular ? 'bg-signal/12' : 'bg-[#FBFAF5]'}`}>
                {pkg.popular && (
                  <div className="t-label bg-signal px-3 py-1.5 text-ink">{t('mostPopular')}</div>
                )}
                <div className="border-b border-line px-6 pb-5 pt-6">
                  <p className="t-display t-num text-[2.6rem] leading-none text-ink">
                    {pkg.creditos}
                    <span className="ml-2 align-baseline text-[13px] font-medium uppercase tracking-[0.12em] text-ink/45">
                      {t('credits')}
                    </span>
                  </p>
                  <p className="t-display t-num mt-4 text-[1.25rem] leading-none text-ink/80">{formatPrecio(pkg.precio)}</p>
                  <p className="t-label mt-1.5 text-ink/40">
                    {formatPrecio(porCredito)} {t('perCredit')}
                  </p>
                </div>
                <div className="flex flex-1 flex-col px-6 py-5">
                  <ul className="flex-1 space-y-2 text-[13px] text-ink/70">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={12} strokeWidth={2.2} className="mt-1 shrink-0 text-moss" />
                      <span><strong className="font-semibold text-ink">{pkg.creditos}</strong> {t('boosts')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={12} strokeWidth={2.2} className="mt-1 shrink-0 text-moss" />
                      <span>{t('orFeatured', { count: Math.floor(pkg.creditos / 4) })}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={12} strokeWidth={2.2} className="mt-1 shrink-0 text-moss" />
                      <span>{t('noExpiration')}</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setPaqueteSeleccionado(pkg)}
                    className={`btn mt-5 w-full justify-center ${pkg.popular ? 'btn-ink' : 'btn-outline'}`}
                  >
                    {t('buy')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Métodos */}
      <section className="mt-14">
        <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('paymentMethods')}</h2>
        <ul className="mt-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
          {[
            { nombre: 'Bizum', Icono: Banknote },
            { nombre: 'Transferencia', Icono: Landmark },
            { nombre: 'PayPal', Icono: Wallet },
          ].map((m) => (
            <li key={m.nombre} className="flex items-center gap-3 bg-[#FBFAF5] px-5 py-4">
              <m.Icono size={17} strokeWidth={1.4} className="text-ink/50" aria-hidden="true" />
              <span className="text-[13.5px] font-medium text-ink">{m.nombre}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 border border-line bg-paper-2/50 p-5">
          <h3 className="t-label text-ink/45">{t('howItWorks')}</h3>
          <ol className="mt-3 space-y-2">
            {[t('step1'), t('step2'), t('step3'), t('step4')].map((paso, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-ink/70">
                <span className="t-label shrink-0 text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                {paso}
              </li>
            ))}
          </ol>
        </div>
      </section>
      {paqueteSeleccionado && (
        <ModalPago
          paquete={paqueteSeleccionado}
          metodos={metodos}
          configurado={configurado}
          stripeDisponible={stripeDisponible}
          onClose={() => setPaqueteSeleccionado(null)}
        />
      )}
      </div>
    </div>
  )
}
