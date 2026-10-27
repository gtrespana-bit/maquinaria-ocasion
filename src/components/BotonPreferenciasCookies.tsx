'use client'

import { reiniciarConsentimiento } from '@/lib/cookie-consent'

/**
 * Botón «Cambiar mi decisión» de la política de cookies.
 *
 * La guía de la AEPD pide que retirar el consentimiento sea tan fácil como
 * darlo. Aquí no hay nada que buscar: se olvida la elección, el aviso vuelve a
 * aparecer y, mientras tanto, la medición queda descargada.
 */
export default function BotonPreferenciasCookies({ locale = 'es' }: { locale?: string }) {
  const esIngles = locale === 'en'

  return (
    <div className="mt-10 border-t border-line pt-6">
      <button
        type="button"
        onClick={() => reiniciarConsentimiento()}
        className="btn btn-outline"
      >
        {esIngles ? 'Change my choice' : 'Cambiar mi decisión'}
      </button>
      <p className="mt-2 text-[13px] text-muted">
        {esIngles
          ? 'The cookie notice will be shown again so you can accept or reject again.'
          : 'Volverás a ver el aviso de cookies para aceptar o rechazar de nuevo.'}
      </p>
    </div>
  )
}
