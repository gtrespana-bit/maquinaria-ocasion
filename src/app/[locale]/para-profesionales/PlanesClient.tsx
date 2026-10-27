'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import LocalLink from '@/components/LocalLink'
import { PLANES_PRO,
  descuentoAnualPct,
  precioMensualEquivalente,
  precioPlan, type Periodicidad, type PlanPago} from '@/lib/planes-anuncios'
import { formatPrecioObligatorio as formatPrecio } from '@/lib/precio'
import { routing } from '@/i18n/routing'

type EstadoPlan = {
  tipo: string
  plan: string
  planContratado: string
  planHasta: string | null
  planPagoVigente: boolean
  suscripcionStripe: boolean
  gestionable: boolean
  trial: boolean
  trialHasta: string | null
  diasTrial: number
  diasTrialTotal: number
  trialElegible?: boolean
  trialUsado?: boolean
  trialGracia?: boolean
  diasGracia?: number
  graciaHasta?: string | null
  pagoFallido?: boolean
  pausadosPorPlan?: number
  creditos: number
}

function nombrePlan(id: string | null): string {
  if (!id) return ''
  return PLANES_PRO.find(p => p.id === id)?.nombre || id
}

function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function PlanesClient() {
  const { session, user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>('mensual')
  const [cupon, setCupon] = useState('')
  const [mostrarCupon, setMostrarCupon] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [estado, setEstado] = useState<EstadoPlan | null>(null)
  const [pago, setPago] = useState<string | null>(null)
  const [planPagado, setPlanPagado] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [pruebaLoading, setPruebaLoading] = useState(false)

  const locale = useMemo(() => {
    for (const l of routing.locales) {
      if (l === routing.defaultLocale) continue
      if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) return l
    }
    return routing.defaultLocale
  }, [pathname])

  const aLogin = () => {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
    window.location.assign(`${prefix}/login?redirect=/para-profesionales`)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPago(params.get('pago'))
    setPlanPagado(params.get('plan'))
  }, [])

  const cargarEstado = useCallback(async (): Promise<EstadoPlan | null> => {
    if (!session) return null
    try {
      const res = await fetch('/api/planes/estado', { cache: 'no-store' })
      if (!res.ok) return null
      const data = await res.json()
      if (data?.ok) {
        setEstado(data)
        return data as EstadoPlan
      }
    } catch {
      /* silencio: no bloquea la página de precios */
    }
    return null
  }, [session])

  useEffect(() => {
    if (!session) {
      setEstado(null)
      return
    }
    let vivo = true
    let intentos = 0
    const cargar = async () => {
      intentos++
      const data = await cargarEstado()
      // El webhook puede tardar unos segundos tras volver de Stripe. Se
      // reintenta hasta que el plan figure como activo (no basta con que la
      // petición responda 200: el pago puede seguir en camino).
      if (!data?.planPagoVigente && vivo && pago === 'ok' && intentos < 5) {
        setTimeout(cargar, 2500)
      }
    }
    cargar()
    return () => {
      vivo = false
    }
  }, [session, pago, cargarEstado])

  async function contratar(plan: PlanPago) {
    setMsg('')
    setError('')
    if (!session) {
      aLogin()
      return
    }
    setLoading(plan)
    try {
      const res = await fetch('/api/planes/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          periodicidad,
          cupon: cupon.trim() ? cupon.trim() : undefined }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || (!data.url && !data.actualizado)) {
        setError(data.error || 'No se pudo abrir el pago.')
        return
      }
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      setMsg(data.mensaje || 'Pack actualizado. Stripe aplicará la diferencia en la próxima factura.')
      // El webhook que escribe el nuevo plan puede tardar unos segundos.
      await cargarEstado()
      setTimeout(() => { cargarEstado() }, 2500)
    } catch {
      setError('No se pudo conectar con la pasarela de pago.')
    } finally {
      setLoading(null)
    }
  }

  async function empezarPrueba() {
    setMsg('')
    setError('')
    if (!session) {
      aLogin()
      return
    }
    setPruebaLoading(true)
    try {
      const res = await fetch('/api/planes/prueba', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || 'No se pudo empezar la prueba.')
        return
      }
      setMsg(
        data.reactivados > 0
          ? `Prueba activada hasta el ${fechaCorta(data.hasta)}. Hemos vuelto a publicar ${data.reactivados} anuncio${data.reactivados === 1 ? '' : 's'}.`
          : `Prueba activada hasta el ${fechaCorta(data.hasta)}. Sin tarjeta y sin cobro automático.`,
      )
      await cargarEstado()
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.')
    } finally {
      setPruebaLoading(false)
    }
  }

  async function abrirPortal() {
    setError('')
    setPortalLoading(true)
    try {
      const res = await fetch('/api/planes/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        setError(data.error || 'No se pudo abrir la gestión de la suscripción.')
        return
      }
      window.location.assign(data.url)
    } catch {
      setError('No se pudo conectar con Stripe.')
    } finally {
      setPortalLoading(false)
    }
  }

  const planActual = estado?.planPagoVigente ? estado.planContratado : 'gratis'

  return (
    <div>
      {/* Resultado del pago */}
      {pago === 'ok' && (
        <div className="mb-6 flex items-start gap-3 border border-moss/25 bg-moss-soft p-5">
          <BadgeCheck className="mt-0.5 shrink-0 text-moss" size={20} strokeWidth={1.8} />
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-moss">¡Plan {nombrePlan(planPagado) || 'de pago'} activado! Gracias por confiar en MaquinariaOcasión.</p>
            <p className="mt-1 text-[13px] text-moss/80">
              {planPagado ? `Ya tienes el plan ${nombrePlan(planPagado)}. ` : ''}
              Puedes publicar tu siguiente anuncio ahora mismo. La factura llega por email desde Stripe.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <LocalLink href="/publicar" className="btn btn-ink btn-sm">
                Publicar un anuncio <ArrowRight size={15} />
              </LocalLink>
              <LocalLink href="/dashboard?tab=plan" className="btn btn-outline btn-sm">
                Ver mi plan
              </LocalLink>
            </div>
          </div>
        </div>
      )}
      {pago === 'cancelado' && (
        <div className="mb-6 border border-line bg-paper-2/60 p-4 text-[13px] text-ink/70">
          No se ha cobrado nada. Tu plan sigue como estaba y puedes contratarlo cuando quieras.
        </div>
      )}

      {/* Prueba activa o gracia */}
      {estado?.trialGracia && (
        <div className="mb-6 flex flex-col justify-between gap-3 border border-signal-deep/40 bg-signal-soft/50 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-semibold text-ink">
              Tu prueba terminó · te quedan {estado.diasGracia} días de gracia
            </p>
            <p className="mt-1 text-[13px] text-ink/70">
              Hasta el {fechaCorta(estado.graciaHasta)} tus anuncios siguen publicados. Después se pausarán
              los que excedan el cupo gratuito, sin borrar nada.
            </p>
          </div>
          <LocalLink
            href="/dashboard?tab=plan"
            className="btn btn-signal btn-sm shrink-0"
          >
            Activar mi plan <ArrowRight size={14} />
          </LocalLink>
        </div>
      )}
      {estado?.trial && (
        <div className="mb-6 flex flex-col justify-between gap-3 border border-signal-deep/40 bg-signal-soft/50 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-semibold text-ink">
              Estás probando el plan {nombrePlan(estado.plan) || 'Básico'}{estado.diasTrial > 0 ? ` · quedan ${estado.diasTrial} días` : ''}
            </p>
            <p className="mt-1 text-[13px] text-ink/70">
              Aprovecha para publicar todo tu stock. Al terminar hay 7 días de gracia y después se pausan
              los anuncios que sobren, sin borrarlos. Activa tu plan cuando quieras.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="t-label bg-signal px-2 py-1 text-ink">
              <Sparkles size={14} /> Prueba activa
            </span>
            <LocalLink
              href="/dashboard?tab=plan"
              className="btn btn-signal btn-sm"
            >
              Activar ahora <ArrowRight size={13} />
            </LocalLink>
          </div>
        </div>
      )}

      {/* Prueba disponible */}
      {session && estado?.trialElegible && (
        <div className="mb-6 flex flex-col justify-between gap-3 border border-moss/25 bg-moss-soft p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-semibold text-moss">Puedes probar el plan Básico 30 días, gratis</p>
            <p className="mt-1 text-[13px] text-moss/80">
              5 anuncios, 3 destacados al mes, escaparate y vídeo. Sin tarjeta y sin cobro automático.
              Al terminar, 7 días de gracia y no se borra ningún anuncio.
              {estado?.tipo === 'particular' && (
                <span className="t-label mt-1 block text-moss/70">
                  Al empezar, tu cuenta pasa a «profesional» (gratis) para recibir el cupo del plan Básico.
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={empezarPrueba}
            disabled={pruebaLoading}
            className="btn btn-ink btn-sm shrink-0 justify-center"
          >
            {pruebaLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Empezar prueba
          </button>
        </div>
      )}

      {/* Periodicidad */}
      <div className="mb-6 border border-line bg-[#FBFAF5] p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div>
            <p className="text-[14px] font-semibold text-ink">Dos planes, según tu stock</p>
            <p className="t-label mt-1 text-ink/45">
              Básico para hasta 5 máquinas a la vez. Profesional, sin límite, para compraventas con rotación.
            </p>
          </div>

          <div className="lg:text-right">
            <p className="text-[14px] font-semibold text-ink">Pago</p>
            <p className="t-label mt-1 text-ink/45">El anual sale como 10 mensualidades: 2 meses gratis.</p>
            <div className="mt-3 inline-flex border border-line bg-paper p-0.5" role="group" aria-label="Periodicidad">
              <button
                type="button"
                onClick={() => setPeriodicidad('mensual')}
                aria-pressed={periodicidad === 'mensual'}
                className={`px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                  periodicidad === 'mensual' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setPeriodicidad('anual')}
                aria-pressed={periodicidad === 'anual'}
                className={`px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                  periodicidad === 'anual' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
                }`}
              >
                Anual <span className="text-moss">−17 %</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de planes */}
      <div className="grid gap-px border border-line bg-line md:grid-cols-2">
        {PLANES_PRO.map(p => {
          const esActual = planActual === p.id
          const precio = precioPlan(p.id, periodicidad)
          const ahorro = descuentoAnualPct(p.id)
          const porAnuncio = p.cupo
            ? (periodicidad === 'anual' ? precioMensualEquivalente(p.id) : precio) / p.cupo
            : null
          return (
            <div
              key={p.id}
              className={`relative flex flex-col bg-[#FBFAF5] p-6 sm:p-8 ${
                p.destacado ? 'ring-1 ring-inset ring-ink' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 min-h-[24px]">
                <span
                  className={`t-label inline-flex items-center gap-1 px-2 py-1 ${
                    p.destacado ? 'bg-signal text-ink' : 'bg-paper-2 text-ink/60'
                  }`}
                >
                  <Sparkles size={12} /> {p.destacado ? 'Recomendado' : 'Para empezar'}
                </span>
                {esActual && (
                  <span className="t-label inline-flex items-center gap-1 bg-ink px-2 py-1 text-paper">
                    <Check size={12} /> Tu plan
                  </span>
                )}
                {!esActual && estado?.trial && estado.plan === p.id && (
                  <span className="t-label inline-flex items-center gap-1 bg-signal px-2 py-1 text-ink">
                    En prueba
                  </span>
                )}
              </div>

              <h2 className="t-display t-display-sm mt-4 text-ink">{p.nombre}</h2>
              <p className="t-label mt-1 text-ink/45">{p.paraQuien}</p>

              <div className="mt-4">
                <p className="t-display t-num text-[2.4rem] leading-none text-ink">
                  {formatPrecio(periodicidad === 'anual' ? precioMensualEquivalente(p.id) : precio)}
                  <span className="ml-1.5 align-baseline text-[13px] font-medium text-ink/45">/mes</span>
                </p>
                {periodicidad === 'anual' ? (
                  <p className="t-label mt-2 text-ink/45">
                    {formatPrecio(precio)} al año · ahorras {ahorro} %
                  </p>
                ) : (
                  <p className="t-label mt-2 text-ink/45">Facturado mes a mes · sin permanencia</p>
                )}
                {porAnuncio != null && (
                  <p className="t-label mt-1 font-semibold text-moss">
                    {formatPrecio(porAnuncio)} por anuncio al mes
                  </p>
                )}
              </div>

              <ul className="mt-6 grid flex-1 gap-x-8 gap-y-2 text-[13px] text-ink/75 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {p.incluido.map(item => (
                  <li key={item} className="flex gap-2">
                    <Check size={13} strokeWidth={2.4} className="mt-1 shrink-0 text-moss" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={loading === p.id || esActual}
                onClick={() => contratar(p.id)}
                className={`btn mt-6 w-full justify-center disabled:opacity-70 ${
                  esActual
                    ? 'btn-outline opacity-60'
                    : p.destacado
                      ? 'btn-signal'
                      : 'btn-ink'
                }`}
              >
                {loading === p.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Abriendo pago…
                  </>
                ) : esActual ? (
                  <>
                    <Check size={16} /> Plan actual
                  </>
                ) : !session ? (
                  <>
                    Empezar con {p.nombre} <ArrowRight size={16} />
                  </>
                ) : estado?.trial && estado.plan === p.id ? (
                  <>
                    Activar {p.nombre} ahora <ArrowRight size={16} />
                  </>
                ) : estado?.planPagoVigente ? (
                  <>
                    Cambiar a {p.nombre} <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Elegir {p.nombre} <ArrowRight size={16} />
                  </>
                )}
              </button>

              {p.id === 'starter' && estado?.trialElegible && (
                <button
                  type="button"
                  onClick={empezarPrueba}
                  disabled={pruebaLoading}
                  className="btn btn-outline btn-sm mt-2 w-full justify-center disabled:opacity-60"
                >
                  {pruebaLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  Probar 30 días gratis
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Garantías */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
        <div className="flex items-start gap-2 border border-line bg-[#FBFAF5] p-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-moss" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Sin permanencia</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/55">Cancela cuando quieras desde tu panel.</p>
          </div>
        </div>
        <div className="flex items-start gap-2 border border-line bg-[#FBFAF5] p-3">
          <CreditCard size={18} className="mt-0.5 shrink-0 text-moss" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Factura con IVA</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/55">Añade tu NIF/CIF en el pago. Tarjeta, Apple Pay y Google Pay.</p>
          </div>
        </div>
        <div className="flex items-start gap-2 border border-line bg-[#FBFAF5] p-3">
          <Lock size={18} className="mt-0.5 shrink-0 text-moss" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Pago seguro con Stripe</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/55">No vemos ni guardamos los datos de tu tarjeta.</p>
          </div>
        </div>
      </div>

      {estado?.suscripcionStripe && (
        <div className="mt-4 flex flex-col justify-between gap-3 border border-line bg-[#FBFAF5] p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-semibold text-ink">Gestionar mi suscripción</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/55">
              Cambia la tarjeta, descarga facturas o date de baja.
              {estado.planHasta ? ` Próxima renovación: ${fechaCorta(estado.planHasta)}.` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={abrirPortal}
            disabled={portalLoading}
            className="btn btn-outline btn-sm justify-center disabled:opacity-60"
          >
            {portalLoading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
            Abrir gestión
          </button>
        </div>
      )}

      {/* Cupón */}
      <div className="mt-6 border border-line bg-[#FBFAF5] p-5">
        <button
          type="button"
          onClick={() => setMostrarCupon(v => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={mostrarCupon}
        >
          <span>
            <span className="block text-[13.5px] font-semibold text-ink">¿Tienes un cupón?</span>
            <span className="mt-0.5 block text-[12px] text-ink/50">Descuento en la cuota o días de regalo.</span>
          </span>
          <span className="t-label text-ink/55">{mostrarCupon ? 'Ocultar' : 'Añadir'}</span>
        </button>
        {mostrarCupon && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              value={cupon}
              onChange={e => setCupon(e.target.value.toUpperCase())}
              placeholder="CÓDIGO"
              aria-label="Código de cupón"
              className="field flex-1 uppercase"
            />
            <button
              type="button"
              onClick={async () => {
                setError('')
                setMsg('')
                if (!session) return aLogin()
                setLoading('cupon')
                const res = await fetch('/api/planes/canjear', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ codigo: cupon }) })
                const data = await res.json().catch(() => ({}))
                setLoading(null)
                if (!res.ok) {
                  setError(data.error || 'No se pudo canjear el cupón.')
                  return
                }
                setMsg(`Cupón canjeado: plan ${data.plan} activo hasta ${fechaCorta(data.hasta)}.`)
                await cargarEstado()
              }}
              disabled={loading === 'cupon'}
              className="btn btn-ink btn-sm disabled:opacity-60"
            >
              {loading === 'cupon' ? 'Canjeando…' : 'Canjear regalo'}
            </button>
          </div>
        )}
        <p className="mt-3 text-[12px] text-ink/50">
          El descuento se aplica al elegir un plan. Los cupones de días se canjean aquí sin pasar por el pago.
        </p>
      </div>

      {msg && (
        <div className="mt-4 border border-moss/25 bg-moss-soft p-3 text-[13px] font-semibold text-moss">
          {msg}
        </div>
      )}
      {error && (
        <div className="mt-4 flex items-start gap-2 border border-clay/30 bg-clay/[0.05] p-3 text-[13px] text-clay">
          <X size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!authLoading && !session && (
        <p className="mt-4 text-center text-[13px] text-muted">
          ¿Todavía no tienes cuenta?{' '}
          <LocalLink href="/register" className="font-semibold underline">
            Créala gratis
          </LocalLink>{' '}
          y publica tu primer anuncio sin pagar nada.
        </p>
      )}

      {session && estado?.tipo === 'particular' && (
        <p className="mt-4 border border-line bg-paper-2/60 p-3 text-[12px] text-ink/60">
          Al contratar un plan, tu perfil pasa a <strong>profesional</strong> automáticamente (es gratis). Así
          recibes el cupo que pagas en lugar de quedarte en el límite de 1 anuncio.
        </p>
      )}

      {user?.email && !estado && !authLoading && (
        <p className="mt-4 text-center text-[11.5px] text-ink/40">
          Sesión iniciada como {user.email}
        </p>
      )}
    </div>
  )
}
