'use client'

import { useState } from 'react'
import { Mail, MessageCircle, CheckCircle, AlertCircle, Send, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import LocalLink from '@/components/LocalLink'
import { Eyebrow } from '@/components/ui/Bits'
const ASUNTOS = [
  'Pregunta general',
  'Reportar un anuncio',
  'Problema con mi cuenta',
  'Sugerencia',
  'Otro',
]

export default function ContactPage() {
  const t = useTranslations('contact')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [asunto, setAsunto] = useState(ASUNTOS[0])
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setEstado('idle')
    setErrorText('')

    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, asunto, mensaje }) })
      const data = await res.json()

      if (!res.ok) {
        setEstado('error')
        setErrorText(data.error || t('sendError'))
        return
      }

      setEstado('success')
      setNombre('')
      setEmail('')
      setAsunto(ASUNTOS[0])
      setMensaje('')
    } catch {
      setEstado('error')
      setErrorText(t('connectError'))
    } finally {
      setEnviando(false)
    }
  }

  if (estado === 'success') {
    return (
      <div className="shell py-20">
        <div className="mx-auto max-w-lg border border-line bg-[#FBFAF5] p-9 text-center">
          <CheckCircle size={34} strokeWidth={1.4} className="mx-auto mb-5 text-moss" />
          <h2 className="t-display t-display-sm text-ink">{t('sent')}</h2>
          <p className="mt-3 text-[14px] text-muted">{t('sentDesc', { email })}</p>
          <button onClick={() => setEstado('idle')} className="btn btn-ink btn-sm mt-7">
            Enviar otro mensaje
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="shell pb-12 pt-10 md:pb-14 md:pt-14">
          <Eyebrow marker="dot">Soporte</Eyebrow>
          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <h1 className="t-display t-display-lg text-ink lg:col-span-7">{t('title')}</h1>
            <p className="max-w-md text-[15px] leading-relaxed text-muted lg:col-span-5 lg:border-l lg:border-line lg:pl-6">
              {t('desc')}
            </p>
          </div>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Formulario */}
          <div className="lg:col-span-7">
            <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('sendMessage')}</h2>

            {estado === 'error' && (
              <div className="mt-6 flex items-start gap-2 border border-clay/40 bg-clay/[0.05] p-3 text-[13px] text-clay">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="t-label mb-1 block text-ink/50" htmlFor="contacto-nombre">
                    {t('name')}
                  </label>
                  <input
                    id="contacto-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    placeholder={t('namePlaceholder')}
                    className="field text-[15px]"
                  />
                </div>
                <div>
                  <label className="t-label mb-1 block text-ink/50" htmlFor="contacto-email">
                    {t('email')}
                  </label>
                  <input
                    id="contacto-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="field text-[15px]"
                  />
                </div>
              </div>
                <label className="t-label mb-1 block text-ink/50" htmlFor="contacto-asunto">
                  {t('subject')}
                </label>
                <select
                  id="contacto-asunto"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className="field pr-6 text-[15px]"
                >
                  {ASUNTOS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              <div>
                <label className="t-label mb-1 block text-ink/50" htmlFor="contacto-mensaje">
                  {t('message')}
                </label>
                <textarea
                  id="contacto-mensaje"
                  rows={5}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  required
                  placeholder={t('messagePlaceholder')}
                  className="field resize-none text-[15px]"
                />
              </div>
              <button
                type="submit"
                disabled={enviando}
                className="btn btn-ink btn-lg w-full justify-between sm:w-auto"
              >
                {enviando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Enviar mensaje
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Datos de contacto */}
          <aside className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-line">
            <h2 className="t-eyebrow border-b border-ink pb-3 text-ink">{t('otherContact')}</h2>
            <dl className="mt-6 divide-y divide-line">
              <div className="flex items-start gap-4 py-5">
                <Mail size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink/50" />
                <div>
                  <dt className="t-label text-ink/45">Email</dt>
                  <dd className="mt-1 text-[15px] text-ink">
                    <a href="mailto:soporte@maquinaria.click" className="link-rule">
                      soporte@maquinaria.click
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-4 py-5">
                <MessageCircle size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink/50" />
                <div>
                  <dt className="t-label text-ink/45">Respuesta</dt>
                  <dd className="mt-1 text-[15px] text-ink">
                    Te contestamos en menos de 24 h laborables
                  </dd>
                </div>
              </div>
              <div className="py-5">
                <dt className="t-label text-ink/45">{t('schedule')}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-ink">
                  Lunes a sábado
                  <br />
                  8:00 – 22:00 (hora peninsular)
                </dd>
              </div>
            </dl>

            <div className="mt-8 border border-ink bg-ink p-6 text-paper">
              <p className="t-label text-paper/50">Antes de escribir</p>
              <p className="mt-3 text-[14px] leading-relaxed text-paper/75">
                Muchas dudas sobre publicación, pagos y seguridad están resueltas en las preguntas
                frecuentes.
              </p>
              <LocalLink href="/faq" className="btn btn-signal btn-sm mt-5">
                Ver preguntas frecuentes
              </LocalLink>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
