'use client'

/**
 * Pestaña «Rendimiento»: qué funciona y qué no, con datos del periodo.
 *
 * El panel ya enseñaba las visitas acumuladas de cada anuncio. Lo que faltaba
 * es lo que de verdad usa un profesional para decidir: cuánta gente pregunta
 * (no solo mira), si el anuncio funciona este mes y cómo está su precio frente
 * al resto de la categoría.
 *
 * La escalera es visible a propósito: cada bloque bloqueado enseña lo que hay
 * dentro y cuánto cuesta llegar a él. Un panel vacío no vende un pack; un panel
 * que enseña el valor que te falta, sí.
 */
import { useCallback, useEffect, useState } from 'react'
import LocalLink from '@/components/LocalLink'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  Heart,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  TrendingDown,
  TrendingUp } from 'lucide-react'
import {PERIODOS, motivoUpsell, type Periodo } from '@/lib/rendimiento'

type Capacidades = {
  totales: boolean
  porAnuncio: boolean
  diagnostico: boolean
  serie: boolean
  mercado: boolean
  precioVsMercado: boolean
  exportar: boolean
}

type Anuncio = {
  id: string
  slug: string | null
  titulo: string
  imagen: string | null
  precio: number | null
  activo: boolean
  vendido: boolean
  pausadoPorPlan: boolean
  diasPublicado: number
  antiguedad: string
  visitas: number
  favoritos: number | null
  contactos: number | null
  tasaContacto: number | null
  sinContactos: boolean
  precioVsMercado?: number
  diagnostico: {
    clave: string
    etiqueta: string
    sugerencia: string
    tono: 'ok' | 'aviso' | 'malo' | 'neutro'
  } | null
}

type Datos = {
  ok: boolean
  parcial: boolean
  plan: string
  nivel: number
  periodo: Periodo
  periodoBloqueado: boolean
  capacidades: Capacidades
  resumen: {
    visitas: number
    favoritos: number | null
    contactos: number | null
    activos: number
    publicados: number
    vendidos: number
    tasaContacto: number | null
  }
  serie: { dia: string; visitas: number }[] | null
  anuncios: Anuncio[]
  mercado: {
    categoriaId: number
    activos: number
    vendidos: number
    precioMediana: number | null
    diasMediana: number | null
    diasMios: number | null
    diferencia: number | null
    titulo: string
    detalle: string
    tono: 'ok' | 'aviso' | 'neutro'
  } | null
  actualizadoEn: string
}

const dinero = (n: number | null | undefined) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const numero = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('es-ES').format(n)

function tonoClase(tono: string) {
  if (tono === 'ok') return 'bg-moss/10 text-moss border-moss/30'
  if (tono === 'malo') return 'bg-clay/[0.07] text-clay border-clay/30'
  if (tono === 'aviso') return 'bg-signal/10 text-ink border-line'
  return 'bg-paper-2 text-ink/60 border-line'
}

/** Barra mini para la serie: sin librerías y sin ejes, solo la forma. */
function Serie({ puntos }: { puntos: { dia: string; visitas: number }[] }) {
  const max = Math.max(1, ...puntos.map((p) => p.visitas))
  const total = puntos.reduce((s, p) => s + p.visitas, 0)
  return (
    <div>
      <div className="flex h-24 items-end gap-[2px]" role="img" aria-label="Visitas por día">
        {puntos.map((p) => (
          <div
            key={p.dia}
            className="flex-1 rounded-t bg-ink/70 transition hover:bg-ink"
            style={{ height: `${Math.max(2, (p.visitas / max) * 100)}%` }}
            title={`${p.dia}: ${p.visitas} visitas`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-ink/40">
        <span>{puntos[0]?.dia}</span>
        <span>{total} visitas en el periodo</span>
        <span>{puntos[puntos.length - 1]?.dia}</span>
      </div>
    </div>
  )
}

function Bloqueo({
  capacidad,
  plan }: {
  capacidad: 'porAnuncio' | 'serie' | 'mercado' | 'exportar' | 'periodo90'
  plan: string
}) {
  const { titulo, detalle } = motivoUpsell(capacidad)
  // El detalle por anuncio se desbloquea con Básico; el resto, con Profesional.
  const esBasico = capacidad === 'porAnuncio'
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-paper-2/60 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-[#FBFAF5] p-1.5 text-ink/40">
          <Lock size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{titulo}</p>
          <p className="mt-1 text-[13px] text-ink/55">{detalle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <LocalLink
              href="/para-profesionales"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-paper hover:bg-brand-dark"
            >
              Ver {esBasico ? 'Básico' : 'Profesional'} <ArrowRight size={14} />
            </LocalLink>
            <span className="text-[12.5px] text-ink/45">{esBasico ? '19 €/mes' : '49 €/mes'} · sin permanencia</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-ink/40">Plan actual: {plan}</p>
    </div>
  )
}

export default function TabRendimiento() {
  const [periodo, setPeriodo] = useState<Periodo>(30)
  const [datos, setDatos] = useState<Datos | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async (p: Periodo) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/rendimiento?dias=${p}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || 'No se pudieron cargar tus métricas.')
        return
      }
      setDatos(data)
      // Si el servidor recorta el periodo (90 días sin Plus), el selector debe
      // reflejarlo en vez de mentir con una pestaña activa que no aplica.
      if (data.periodo && data.periodo !== p) setPeriodo(data.periodo)
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar(periodo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cambiarPeriodo(p: Periodo) {
    setPeriodo(p)
    cargar(p)
  }

  function exportarCsv() {
    if (!datos) return
    const cabecera = [
      'Anuncio',
      'Estado',
      'Precio',
      'Visitas',
      'Favoritos',
      'Contactos',
      'Tasa contacto %',
      'Días publicado',
      'Diagnóstico',
    ]
    const filas = datos.anuncios.map((a) => [
      a.titulo,
      a.vendido ? 'Vendido' : !a.activo ? (a.pausadoPorPlan ? 'Pausado por cupo' : 'Pausado') : 'Activo',
      a.precio ?? '',
      a.visitas,
      a.favoritos ?? '',
      a.contactos ?? '',
      a.tasaContacto != null ? a.tasaContacto.toFixed(1) : '',
      a.diasPublicado,
      a.diagnostico?.etiqueta ?? '',
    ])
    const escapar = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [cabecera, ...filas].map((f) => f.map(escapar).join(';')).join('\r\n')
    // BOM para que Excel en español abra los acentos bien.
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rendimiento-maquinariaocasion-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !datos) {
    return (
      <div className="flex items-center gap-2 border border-line bg-[#FBFAF5] p-6 text-[13px] text-ink/55">
        <Loader2 size={18} className="animate-spin" /> Calculando tus métricas…
      </div>
    )
  }

  if (error && !datos) {
    return (
      <div className="rounded-2xl border border-clay/30 bg-clay/[0.07] p-4 text-sm text-clay">{error}</div>
    )
  }

  if (!datos) return null

  const { resumen, capacidades: caps, mercado, serie } = datos

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 t-display t-display-sm text-ink">
            <BarChart3 size={20} className="text-ink" /> Rendimiento
          </h2>
          <p className="mt-1 text-[13px] text-ink/55">
            Visitas, contactos y comparativa de tus anuncios. Datos de los últimos {datos.periodo} días.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-[#FBFAF5] p-1">
          {PERIODOS.map((p) => {
            const bloqueado = p === 90 && datos.nivel < 3
            return (
              <button
                key={p}
                type="button"
                onClick={() => cambiarPeriodo(p)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  periodo === p ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-paper-2'
                }`}
              >
                {p} días
                {bloqueado && <Lock size={11} />}
              </button>
            )
          })}
        </div>
      </div>

      {datos.parcial && (
        <div className="flex items-start gap-2 rounded-xl border border-line bg-signal/10 p-3 text-xs text-ink">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>
            Modo básico: las métricas por periodo aún no están activadas en este entorno, así que se
            muestran las visitas acumuladas. Aplica la migración <code>202610230001</code>.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="border border-line bg-[#FBFAF5] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
            <Eye size={13} /> Visitas
          </div>
          <p className="mt-1 t-display t-num text-[1.75rem] leading-none text-ink">{numero(resumen.visitas)}</p>
          <p className="text-[12px] text-ink/40">en {datos.periodo} días</p>
        </div>

        <div className="border border-line bg-[#FBFAF5] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
            <MessageSquare size={13} /> Contactos
          </div>
          <p className="mt-1 t-display t-num text-[1.75rem] leading-none text-ink">
            {caps.porAnuncio ? numero(resumen.contactos) : <Lock size={18} className="text-ink/40" />}
          </p>
          <p className="text-[12px] text-ink/40">compradores que escribieron</p>
        </div>

        <div className="border border-line bg-[#FBFAF5] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
            <TrendingUp size={13} /> Tasa de contacto
          </div>
          <p className="mt-1 t-display t-num text-[1.75rem] leading-none text-ink">
            {caps.porAnuncio && resumen.tasaContacto != null
              ? `${resumen.tasaContacto.toFixed(1)} %`
              : <Lock size={18} className="text-ink/40" />}
          </p>
          <p className="text-[12px] text-ink/40">visitas que acaban en consulta</p>
        </div>

        <div className="border border-line bg-[#FBFAF5] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
            <Heart size={13} /> Favoritos
          </div>
          <p className="mt-1 t-display t-num text-[1.75rem] leading-none text-ink">
            {caps.porAnuncio ? numero(resumen.favoritos) : <Lock size={18} className="text-ink/40" />}
          </p>
          <p className="text-[12px] text-ink/40">
            {resumen.activos} activos · {resumen.vendidos} vendidos
          </p>
        </div>
      </div>

      {/* Serie */}
      <section className="border border-line bg-[#FBFAF5] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-ink">Evolución de visitas</h3>
          {caps.serie && (
            <span className="text-xs text-ink/40">
              {new Date(datos.actualizadoEn).toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit' })}
            </span>
          )}
        </div>
        {serie ? <Serie puntos={serie} /> : <Bloqueo capacidad="serie" plan={datos.plan} />}
      </section>

      {/* Mercado */}
      <section className="border border-line bg-[#FBFAF5] p-5">
        <h3 className="mb-3 font-semibold text-ink">Tu mercado</h3>
        {mercado ? (
          <div className="space-y-4">
            <div className={`rounded-xl border p-3.5 ${tonoClase(mercado.tono)}`}>
              <p className="flex items-start gap-2 text-sm font-semibold">
                {mercado.tono === 'ok' ? (
                  <TrendingUp size={16} className="mt-0.5 shrink-0" />
                ) : mercado.tono === 'aviso' ? (
                  <TrendingDown size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <Info size={16} className="mt-0.5 shrink-0" />
                )}
                {mercado.titulo}
              </p>
              <p className="mt-1 text-xs opacity-90">{mercado.detalle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[12.5px] text-ink/45">Precio mediano</p>
                <p className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{dinero(mercado.precioMediana)}</p>
              </div>
              <div>
                <p className="text-[12.5px] text-ink/45">Días hasta vender</p>
                <p className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
                  {mercado.diasMediana != null ? `${mercado.diasMediana} d` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-ink/45">Tú tardas</p>
                <p className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
                  {mercado.diasMios != null ? `${mercado.diasMios} d` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-ink/45">Anuncios activos</p>
                <p className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{numero(mercado.activos)}</p>
              </div>
            </div>
            <p className="text-[12px] text-ink/40">
              Mediana de tu categoría, sin contar tus propios anuncios. {mercado.vendidos} vendidos en el
              último año.
            </p>
          </div>
        ) : (
          <Bloqueo capacidad="mercado" plan={datos.plan} />
        )}
      </section>

      {/* Anuncios */}
      <section className="border border-line bg-[#FBFAF5] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">Tus anuncios</h3>
          {caps.exportar ? (
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper-2"
            >
              <Download size={13} /> Exportar CSV
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink/40">
              <Lock size={12} /> Exportar en Profesional
            </span>
          )}
        </div>

        {!caps.porAnuncio ? (
          <Bloqueo capacidad="porAnuncio" plan={datos.plan} />
        ) : datos.anuncios.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink/55">
            Aún no tienes anuncios.{' '}
            <LocalLink href="/publicar" className="font-semibold text-ink hover:underline">
              Publica el primero
            </LocalLink>
            .
          </p>
        ) : (
          <div className="space-y-2">
            {datos.anuncios.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-line p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <LocalLink
                      href={`/producto/${a.slug || a.id}`}
                      className="truncate text-sm font-semibold text-ink hover:text-ink"
                    >
                      {a.titulo}
                    </LocalLink>
                    {a.diagnostico && (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${tonoClase(
                          a.diagnostico.tono,
                        )}`}
                      >
                        {a.diagnostico.etiqueta}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink/40">
                    {a.antiguedad}
                    {a.precio ? ` · ${dinero(a.precio)}` : ''}
                    {a.precioVsMercado != null && (
                      <>
                        {' · '}
                        <span
                          className={
                            a.precioVsMercado > 15
                              ? 'text-amber-600'
                              : a.precioVsMercado < -15
                                ? 'text-moss'
                                : 'text-ink/60'
                          }
                        >
                          {a.precioVsMercado > 0 ? '+' : ''}
                          {a.precioVsMercado} % vs mediana
                        </span>
                      </>
                    )}
                  </p>
                  {a.diagnostico && (
                    <p className="mt-1 text-[12.5px] text-ink/45">{a.diagnostico.sugerencia}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-1 text-ink/60" title="Visitas">
                    <Eye size={13} className="text-ink/40" /> {numero(a.visitas)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-ink/60" title="Favoritos">
                    <Heart size={13} className="text-ink/40" /> {numero(a.favoritos)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 ${a.sinContactos ? 'font-semibold text-amber-700' : 'text-ink/60'}`}
                    title="Contactos"
                  >
                    <MessageSquare size={13} className="text-ink/40" /> {numero(a.contactos)}
                  </span>
                  <LocalLink
                    href={`/dashboard?tab=productos`}
                    className="rounded-lg p-1.5 text-ink/40 hover:bg-paper-2 hover:text-ink/60"
                    aria-label={`Gestionar ${a.titulo}`}
                  >
                    <ArrowUpRight size={14} />
                  </LocalLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cierre: qué desbloquea el plan Profesional */}
      {datos.nivel === 0 && (
        <section className="rounded-2xl border border-brand-primary/20 bg-paper-2 p-5">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <CheckCircle2 size={17} className="text-ink" />
            Básico te enseña qué anuncio te trae compradores
          </p>
          <p className="mt-1 text-[13px] text-ink/55">
            Detalle por anuncio y contactos reales con Básico (19 €/mes). Profesional (49 €/mes)
            suma comparativa con el mercado, 90 días de histórico y exportación en CSV.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <LocalLink
              href="/para-profesionales"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-dark"
            >
              Ver planes
              <ArrowRight size={14} />
            </LocalLink>
            <LocalLink href="/dashboard?tab=plan" className="text-sm font-semibold text-ink/60 hover:underline">
              Ver mi plan
            </LocalLink>
          </div>
        </section>
      )}

      {datos.parcial && (
        <p className="flex items-center gap-1.5 text-[12px] text-ink/40">
          <AlertTriangle size={12} /> Los contactos y favoritos por anuncio necesitan la migración de
          rendimiento.
        </p>
      )}
    </div>
  )
}
