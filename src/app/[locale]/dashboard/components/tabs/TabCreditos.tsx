'use client'

import LocalLink from '@/components/LocalLink'

import { useState, useEffect } from 'react'
import { CreditCard, Zap, Star, X, CheckCircle, Upload, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { PAQUETES_CREDITO } from '@/lib/creditos'
import { formatPrecioObligatorio as formatPrecio } from '@/lib/precio'

interface MetodoPago {
  id: string
  nombre: string
  instrucciones: Record<string, string>
}

const METODOS_PAGO: MetodoPago[] = [
  { id: 'bizum', nombre: 'Bizum', instrucciones: {} },
  { id: 'transferencia', nombre: 'Transferencia', instrucciones: {} },
  { id: 'paypal', nombre: 'PayPal', instrucciones: {} },
]

export default function TabCreditos({ creditos, refreshCreditos }: { creditos: number; refreshCreditos: () => void }) {
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState<any>(null)
  const [configurado, setConfigurado] = useState<Record<string, boolean> | null>(null)
  // Solo los métodos con datos REALES configurados en el servidor. Los que no
  // lo están se ocultan: nunca se muestran IBAN/Bizum de ejemplo, porque el
  // comprador pagaría a una cuenta que no existe.
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>(METODOS_PAGO)

  useEffect(() => {
    fetch('/api/datos-pago')
      .then(r => r.json())
      .then(d => {
        setMetodosPago(
          METODOS_PAGO
            .map(m => (d?.[m.id] && typeof d[m.id] === 'object' ? { ...m, instrucciones: d[m.id] } : m))
            .filter(m => (d?.configurado ? d.configurado[m.id] !== false : true)),
        )
        setConfigurado(d?.configurado ?? null)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-8">
      <section className="on-dark flex items-center justify-between gap-6 bg-ink px-6 py-6 text-paper">
        <div>
          <p className="t-label text-paper/45">Tu balance actual</p>
          <p className="t-display t-num mt-3 text-[clamp(2.2rem,5vw,3.2rem)] leading-none">
            {creditos}
            <span className="ml-2 font-sans text-[13px] font-medium tracking-normal text-paper/50">créditos</span>
          </p>
        </div>
        <CreditCard size={34} strokeWidth={1.2} className="shrink-0 text-paper/20" aria-hidden="true" />
      </section>

      <section>
        <h3 className="t-eyebrow border-b border-ink pb-3 text-ink">¿Para qué sirven?</h3>
        <div className="mt-5 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
          <div className="bg-[#FBFAF5] p-5">
            <Zap size={16} strokeWidth={1.6} className="text-ink" aria-hidden="true" />
            <p className="mt-3 text-[13.5px] font-semibold text-ink">Subida al nº 1 · 1 crédito</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/55">Sube tu publicación al primer puesto del listado.</p>
          </div>
          <div className="bg-[#FBFAF5] p-5">
            <Star size={16} strokeWidth={1.6} className="text-ink" aria-hidden="true" />
            <p className="mt-3 text-[13.5px] font-semibold text-ink">Destacado</p>
            <p className="t-num mt-1 text-[12.5px] leading-relaxed text-ink/55">4 cr/12 h · 6 cr/24 h · 10 cr/48 h</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border border-line bg-[#FBFAF5] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13.5px] font-semibold text-ink">¿Publicas varias máquinas?</p>
          <p className="mt-1 max-w-lg text-[12.5px] leading-relaxed text-ink/55">
            Con Básico (19 €/mes) o Profesional (49 €/mes) tienes más anuncios y destacados incluidos cada mes.
          </p>
        </div>
        <LocalLink href="/para-profesionales" className="btn btn-outline btn-sm shrink-0 justify-center">
          Ver planes <ArrowRight size={12} />
        </LocalLink>
      </section>

      <section>
        <h3 className="t-eyebrow border-b border-ink pb-3 text-ink">Elige tu paquete</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAQUETES_CREDITO.map(pkg => {
            const porCredito = pkg.precio / pkg.creditos
            return (
              <div
                key={pkg.creditos}
                className={`flex flex-col border bg-[#FBFAF5] ${pkg.popular ? 'border-ink' : 'border-line'}`}
              >
                <div className={`flex items-center justify-between border-b px-4 py-2 ${pkg.popular ? 'border-ink bg-signal' : 'border-line'}`}>
                  <span className="t-label text-ink/60">{pkg.creditos} créditos</span>
                  {pkg.popular && <span className="t-label text-ink">Más popular</span>}
                </div>
                <div className="flex-1 px-5 py-5">
                  <p className="t-display t-num text-[2rem] leading-none text-ink">{formatPrecio(pkg.precio)}</p>
                  <p className="t-label mt-2 text-ink/40">{formatPrecio(porCredito)} por crédito</p>
                  <ul className="mt-5 space-y-2 border-t border-line pt-4 text-[12.5px] text-ink/65">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={12} strokeWidth={2} className="mt-0.5 shrink-0 text-moss" aria-hidden="true" />
                      <span><strong className="font-semibold text-ink">{pkg.creditos}</strong> subidas al nº 1</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={12} strokeWidth={2} className="mt-0.5 shrink-0 text-moss" aria-hidden="true" />
                      <span>o {Math.floor(pkg.creditos / 4)}× destacado 12 h</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={12} strokeWidth={2} className="mt-0.5 shrink-0 text-moss" aria-hidden="true" />
                      <span>Sin expiración</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 pt-0">
                  <button
                    onClick={() => setPaqueteSeleccionado(pkg)}
                    aria-haspopup="dialog"
                    className={`btn w-full justify-center ${pkg.popular ? 'btn-ink' : 'btn-outline'}`}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="t-eyebrow border-b border-ink pb-3 text-ink">Métodos de pago aceptados</h3>
        <div className="mt-5 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
          {metodosPago.map(m => (
            <div key={m.id} className="bg-[#FBFAF5] px-4 py-5">
              <span className="t-label text-ink/30">{m.nombre.slice(0, 2).toUpperCase()}</span>
              <p className="mt-2 text-[13.5px] font-medium text-ink">{m.nombre}</p>
            </div>
          ))}
        </div>
      </section>

      {paqueteSeleccionado && (
        <ModalCompraCreditos
          paquete={paqueteSeleccionado}
          metodosPago={metodosPago}
          configurado={configurado}
          onClose={() => setPaqueteSeleccionado(null)}
          onCompraExitosa={refreshCreditos}
        />
      )}
    </div>
  )
}

function ModalCompraCreditos({
  paquete,
  metodosPago,
  configurado,
  onClose,
  onCompraExitosa }: {
  paquete: any
  metodosPago: MetodoPago[]
  configurado: Record<string, boolean> | null
  onClose: () => void
  onCompraExitosa: () => void
}) {
  const [metodo, setMetodo] = useState('')
  const [copiado, setCopiado] = useState('')
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const selectedMetodo = metodosPago.find(m => m.id === metodo)

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
      if (!user) { alert('Debes iniciar sesión'); setEnviando(false); return }

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
          userId: user.id,
          creditos: paquete.creditos,
          precioUsd: paquete.precio,
          metodoPago: selectedMetodo?.nombre || metodo,
          comprobanteUrl: publicUrl }) })

      const data = await res.json()
      if (data.ok) {
        setEnviado(true)
        onCompraExitosa()
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
      <div
        className="fixed inset-0 z-50 bg-ink/60 flex items-end md:items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-compra-titulo"
        tabIndex={-1}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      >
        <div className="w-full border-t border-line-strong bg-[#FBFAF5] p-6 text-center md:max-w-lg md:rounded-2xl md:border">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-moss/30 bg-moss-soft">
            <CheckCircle size={22} strokeWidth={1.6} className="text-moss" />
          </div>
          <h3 id="modal-compra-exito" className="text-[17px] font-semibold tracking-[-0.02em] text-ink">¡Comprobante enviado!</h3>
          <p className="mb-5 mt-2 text-[13px] leading-relaxed text-ink/60">
            Tu pago será revisado en breve. Recibirás <strong>{paquete.creditos} créditos</strong> cuando se confirme.
          </p>
          <button onClick={onClose} className="btn btn-ink w-full justify-center">Cerrar</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-compra-titulo"
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="max-h-[90vh] w-full overflow-y-auto border-t border-line-strong bg-[#FBFAF5] md:max-w-lg md:rounded-2xl md:border">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[#FBFAF5] px-6 py-4">
          <div>
            <h3 id="modal-compra-titulo" className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{paquete.creditos} créditos — {formatPrecio(paquete.precio)}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal de compra" className="text-ink/40 transition-colors hover:text-ink"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Método de pago */}
          <div>
            <h4 className="t-label mb-3 text-ink/50">01 · Elige cómo vas a pagar</h4>
            {configurado && metodosPago.length === 0 && (
              <div className="border border-signal-deep/40 bg-signal/15 p-4 text-[12.5px] leading-relaxed text-ink/70">
                Estamos terminando de configurar los pagos con Bizum, transferencia y PayPal.
                Escríbenos desde{' '}
                <LocalLink href="/contacto" className="font-semibold underline">contacto</LocalLink> y te
                damos los datos para comprar créditos ahora mismo.
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {metodosPago.map(m => (
                <button key={m.id} onClick={() => setMetodo(m.id)}
                  className={`border p-3 text-center transition-colors ${metodo === m.id ? 'border-ink bg-signal' : 'border-line bg-paper hover:border-ink'}`}>
                  <span className="t-label block text-ink/45">{m.nombre.slice(0, 2).toUpperCase()}</span>
                  <span className="mt-1 block text-[12.5px] font-medium text-ink">{m.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monto a pagar */}
          <div className="border border-line bg-paper-2 p-4">
            <p className="t-label mb-1 text-center text-ink/45">Monto a pagar</p>
            <div className="flex items-center justify-center gap-3">
              <p className="t-display t-num text-[1.6rem] leading-none text-ink">{formatPrecio(paquete.precio)}</p>
              <button onClick={() => copyToClipboard(String(paquete.precio), 'precio')} className="t-label flex items-center gap-1 border border-line bg-paper px-2.5 py-1.5 text-ink/60 transition-colors hover:border-ink hover:text-ink">
                {copiado === 'precio' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Datos de pago */}
          {selectedMetodo && Object.keys(selectedMetodo.instrucciones).length > 0 && (
            <div>
              <h4 className="t-label mb-3 text-ink/50">02 · Datos de pago</h4>
              <div className="space-y-3 border border-line bg-paper-2 p-4">
                {Object.entries(selectedMetodo.instrucciones).map(([key, value]) => {
                  const labelMap: Record<string, string> = { telefono: 'Teléfono (Bizum)', iban: 'IBAN', banco: 'Banco', receptor: 'Titular', email: 'PayPal (email)' }
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="t-label text-ink/45">{labelMap[key] || key}</span>
                        <p className="t-num break-all text-[13px] font-medium text-ink">{value}</p>
                      </div>
                      <button onClick={() => copyToClipboard(value, key)} className="t-label ml-2 shrink-0 border border-line bg-paper px-2 py-1 text-ink/50 transition-colors hover:border-ink hover:text-ink">
                        {copiado === key ? 'Copiado' : 'Copiar'}
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
              <h4 className="t-label mb-3 text-ink/50">03 · Sube tu comprobante de pago</h4>
              <div className="cursor-pointer border border-dashed border-line-strong p-6 text-center transition-colors hover:border-ink"
                onClick={() => document.getElementById('comprobante-input-dash')?.click()}>
                <input type="file" accept="image/*" id="comprobante-input-dash" onChange={handleFileChange} className="hidden" />
                {comprobantePreview ? (
                  <div>
                    <Image src={comprobantePreview} alt="Comprobante" className="mx-auto mb-3 max-h-48 w-auto border border-line" width={400} height={300} unoptimized />
                    <button onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview('') }} className="t-label text-clay hover:underline">Quitar imagen</button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} strokeWidth={1.4} className="mx-auto mb-2 text-ink/30" />
                    <p className="text-[13px] text-ink/60">Toca para subir la captura del pago</p>
                    <p className="t-label mt-1 text-ink/30">JPG, PNG — máx 5 MB</p>
                  </>
                )}
              </div>
              <button onClick={procesarCompra} disabled={enviando || !comprobanteFile}
                className="btn btn-ink mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {enviando ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : <><Upload size={18} /> Enviar comprobante</>}
              </button>
            </div>
          )}

          {!metodo && (
            <p className="t-label py-3 text-center text-ink/35">Selecciona un método de pago para continuar</p>
          )}
        </div>
      </div>
    </div>
  )
}
