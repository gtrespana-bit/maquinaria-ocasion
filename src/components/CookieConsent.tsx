'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import LocalLink from '@/components/LocalLink'
import {
  CONSENT_REOPEN_EVENT,
  guardarConsentimiento,
  leerConsentimiento } from '@/lib/cookie-consent'

/**
 * Aviso de cookies.
 *
 * Requisitos que se mantienen (ver comentario histórico en el layout raíz):
 * «Aceptar» y «Rechazar» con el mismo peso visual, sin premarcar nada y
 * guardando la decisión en la misma clave que lee `RootClientEffects`.
 * Aquí solo cambia la forma: tarjeta editorial en la esquina inferior.
 */
const TEXTOS = {
  es: {
    titulo: 'Cookies',
    cuerpo:
      'Usamos almacenamiento necesario para que la web funcione (sesión, preferencias, seguridad). Solo mediremos el tráfico si nos das permiso.',
    mas: 'Más información en la',
    enlace: 'política de privacidad',
    aceptar: 'Aceptar',
    rechazar: 'Rechazar' },
  en: {
    titulo: 'Cookies',
    cuerpo:
      'We use storage that is necessary for the site to work (session, preferences, security). We will only measure traffic if you give us permission.',
    mas: 'More information in our',
    enlace: 'privacy policy',
    aceptar: 'Accept',
    rechazar: 'Reject' } } as const

export default function CookieConsent() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (leerConsentimiento() === null) setVisible(true)
    const reabrir = () => setVisible(true)
    window.addEventListener(CONSENT_REOPEN_EVENT, reabrir)
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reabrir)
  }, [])

  if (!visible) return null

  const idioma = pathname?.startsWith('/en') ? 'en' : 'es'
  const t = TEXTOS[idioma]

  const decidir = (valor: 'accepted' | 'rejected') => {
    guardarConsentimiento(valor)
    setVisible(false)
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 md:inset-x-auto md:right-6 md:bottom-6 md:w-[420px] md:p-0"
      style={{ marginBottom: 'calc(58px + env(safe-area-inset-bottom, 0px))' }}
      role="dialog"
      aria-label={t.titulo}
    >
      <div className="border border-ink bg-paper p-4 shadow-panel md:mb-0 md:p-5">
        <div className="mb-2 flex items-center gap-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-signal" />
          <p className="t-label text-ink">{t.titulo}</p>
        </div>
        <p className="text-[13px] leading-relaxed text-ink/70 md:text-[13px]">
          {t.cuerpo} {t.mas}{' '}
          <LocalLink
            href="/politica-de-privacidad"
            className="text-ink underline decoration-signal decoration-2 underline-offset-2"
          >
            {t.enlace}
          </LocalLink>
          .
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => decidir('rejected')}
            className="btn btn-outline btn-sm flex-1"
          >
            {t.rechazar}
          </button>
          <button
            type="button"
            onClick={() => decidir('accepted')}
            className="btn btn-ink btn-sm flex-1"
          >
            {t.aceptar}
          </button>
        </div>
      </div>
    </div>
  )
}
