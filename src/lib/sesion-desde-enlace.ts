/**
 * Establecer la sesión al aterrizar desde un enlace de correo de Supabase.
 *
 * Por qué hace falta: el cliente del navegador usa `flowType: 'pkce'`, pero
 * los enlaces de correo (verificación de GoTrue, tanto los que envía Supabase
 * como los `action_link` que genera la app con `generateLink`) **no** traen
 * `?code=`: redirigen con los tokens en el fragmento
 * (`#access_token=…&refresh_token=…&type=recovery`). En modo PKCE,
 * supabase-js ignora ese fragmento, así que la página se queda sin sesión y
 * `updateUser({ password })` falla con «Auth session missing!».
 *
 * Esta función reproduce para cualquier página de aterrizaje el mismo
 * arranque que ya hacía `/confirm`: lee los parámetros de query y fragmento
 * y establece la sesión por la vía que corresponda (setSession, verifyOtp o
 * exchangeCodeForSession). Al terminar limpia la URL para no dejar tokens
 * en el historial del navegador.
 */

export interface ParametrosEnlaceAuth {
  type: string | null
  tokenHash: string | null
  accessToken: string | null
  refreshToken: string | null
  code: string | null
  error: string | null
  errorDescription: string | null
}

/** Formas en las que un enlace de correo puede traer la sesión o el error. */
export function leerParametrosEnlaceAuth(search: string, hash: string): ParametrosEnlaceAuth {
  const query = new URLSearchParams(search)
  const fragmento = hash && hash.length > 1 ? new URLSearchParams(hash.substring(1)) : null
  // El fragmento manda: es donde GoTrue deja los tokens del flujo implícito.
  const get = (clave: string) => fragmento?.get(clave) ?? query.get(clave)
  return {
    type: get('type'),
    tokenHash: get('token_hash') || get('token'),
    accessToken: get('access_token'),
    refreshToken: get('refresh_token'),
    code: get('code'),
    error: get('error'),
    errorDescription: get('error_description') }
}

type ErrorAuth = { message: string } | null

/** Subconjunto del cliente de Supabase que necesita esta función. */
export interface ClienteAuthEnlace {
  auth: {
    getSession(): Promise<{ data: { session: unknown } }>
    setSession(s: { access_token: string; refresh_token: string }): Promise<{ error: ErrorAuth }>
    verifyOtp(p: { token_hash: string; type: string }): Promise<{ error: ErrorAuth }>
    exchangeCodeForSession(code: string): Promise<{ error: ErrorAuth }>
  }
}

export type ResultadoSesionEnlace =
  | { ok: true; via: 'sesion_previa' | 'hash' | 'otp' | 'code' }
  | { ok: false; motivo: 'error_enlace' | 'sin_sesion'; detalle?: string }

/**
 * Intenta dejar una sesión activa a partir de la URL actual.
 *
 * Debe llamarse una sola vez al montar la página de aterrizaje. Los
 * parámetros se leen **antes** de tocar el cliente: al instanciarse,
 * supabase-js procesa la URL por su cuenta y podría alterarla.
 */
export async function establecerSesionDesdeEnlace(
  sb: ClienteAuthEnlace,
): Promise<ResultadoSesionEnlace> {
  const p = leerParametrosEnlaceAuth(window.location.search, window.location.hash)
  const hayParametros = Boolean(p.accessToken || p.tokenHash || p.code || p.error)

  try {
    // GoTrue ya rechazó el enlace (caducado o reutilizado): llega
    // `#error=…&error_description=…`. Si pese a todo hay sesión (p. ej. un
    // segundo clic con la sesión ya creada por el primero), vale.
    if (p.error) {
      const { data } = await sb.auth.getSession()
      if (data.session) return { ok: true, via: 'sesion_previa' }
      return { ok: false, motivo: 'error_enlace', detalle: p.errorDescription || p.error }
    }

    // Sesión implícita: GoTrue verificó el enlace y redirige con los tokens
    // en el fragmento. Hay que entregárselos al cliente a mano (PKCE los
    // ignora).
    if (p.accessToken && p.refreshToken) {
      const { error } = await sb.auth.setSession({
        access_token: p.accessToken,
        refresh_token: p.refreshToken })
      if (!error) return { ok: true, via: 'hash' }
      // Si falla, se sigue intentando por las demás vías.
    }

    // Enlace con token_hash (plantillas que enlazan directo a la app).
    if (p.tokenHash && p.type) {
      // El tipo 'email' que a veces trae el enlace equivale a 'signup'.
      const tipoOtp = p.type === 'email' ? 'signup' : p.type
      const { error } = await sb.auth.verifyOtp({ token_hash: p.tokenHash, type: tipoOtp })
      if (!error) return { ok: true, via: 'otp' }
      const { data } = await sb.auth.getSession()
      if (data.session) return { ok: true, via: 'sesion_previa' }
      return { ok: false, motivo: 'error_enlace', detalle: error.message }
    }

    // Callback PKCE iniciado en el navegador (`?code=…`).
    if (p.code) {
      const { error } = await sb.auth.exchangeCodeForSession(p.code)
      if (!error) return { ok: true, via: 'code' }
      return { ok: false, motivo: 'error_enlace', detalle: error.message }
    }

    // Sin parámetros consumibles: quizá supabase-js ya estableció la sesión
    // (o el usuario ya estaba identificado).
    const { data } = await sb.auth.getSession()
    if (data.session) return { ok: true, via: 'sesion_previa' }
    return { ok: false, motivo: 'sin_sesion' }
  } finally {
    if (hayParametros) {
      // Los tokens no deben quedarse en la URL ni en el historial.
      try {
        window.history.replaceState(null, '', window.location.pathname)
      } catch {
        /* historial no disponible: sin consecuencias */
      }
    }
  }
}
