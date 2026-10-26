import {
  establecerSesionDesdeEnlace,
  leerParametrosEnlaceAuth,
} from '@/lib/sesion-desde-enlace'

/**
 * Los enlaces de correo llegan con los tokens en el fragmento (#access_token)
 * y el cliente PKCE no los consume: sin este arranque, /reset-password se
 * quedaba sin sesión y `updateUser` devolvía «Auth session missing!».
 */

function clienteFalso(over: Record<string, jest.Mock> = {}): any {
  const auth: Record<string, jest.Mock> = {
    getSession: jest.fn(async () => ({ data: { session: null } })),
    setSession: jest.fn(async () => ({ error: null })),
    verifyOtp: jest.fn(async () => ({ error: null })),
    exchangeCodeForSession: jest.fn(async () => ({ error: null })),
    ...over,
  }
  return { auth }
}

function irA(url: string) {
  window.history.replaceState(null, '', url)
}

describe('leerParametrosEnlaceAuth', () => {
  test('lee los tokens del fragmento (flujo implícito de GoTrue)', () => {
    const p = leerParametrosEnlaceAuth('', '#access_token=abc&refresh_token=def&type=recovery')
    expect(p.accessToken).toBe('abc')
    expect(p.refreshToken).toBe('def')
    expect(p.type).toBe('recovery')
  })

  test('el fragmento tiene prioridad sobre la query', () => {
    const p = leerParametrosEnlaceAuth('?type=signup', '#access_token=abc&type=recovery')
    expect(p.type).toBe('recovery')
  })

  test('acepta token_hash y su alias token, code PKCE y errores', () => {
    expect(leerParametrosEnlaceAuth('?token_hash=th1&type=signup', '').tokenHash).toBe('th1')
    expect(leerParametrosEnlaceAuth('?token=th2', '').tokenHash).toBe('th2')
    expect(leerParametrosEnlaceAuth('?code=c1', '').code).toBe('c1')
    const err = leerParametrosEnlaceAuth('', '#error=access_denied&error_description=expired')
    expect(err.error).toBe('access_denied')
    expect(err.errorDescription).toBe('expired')
  })

  test('sin parámetros devuelve todo null', () => {
    const p = leerParametrosEnlaceAuth('', '')
    expect(p).toEqual({
      type: null,
      tokenHash: null,
      accessToken: null,
      refreshToken: null,
      code: null,
      error: null,
      errorDescription: null,
    })
  })
})

describe('establecerSesionDesdeEnlace', () => {
  test('hash con tokens: setSession y URL limpia', async () => {
    irA('/reset-password#access_token=abc&refresh_token=def&type=recovery')
    const sb = clienteFalso()
    const r = await establecerSesionDesdeEnlace(sb)
    expect(r).toEqual({ ok: true, via: 'hash' })
    expect(sb.auth.setSession).toHaveBeenCalledWith({ access_token: 'abc', refresh_token: 'def' })
    expect(window.location.hash).toBe('')
    expect(window.location.pathname).toBe('/reset-password')
  })

  test('error en la URL sin sesión: enlace inválido con el detalle', async () => {
    irA('/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired')
    const sb = clienteFalso()
    const r = await establecerSesionDesdeEnlace(sb)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.motivo).toBe('error_enlace')
      expect(r.detalle).toContain('invalid or has expired')
    }
    expect(sb.auth.setSession).not.toHaveBeenCalled()
  })

  test('error en la URL pero con sesión previa: se acepta (segundo clic)', async () => {
    irA('/reset-password#error=access_denied')
    const sb = clienteFalso({
      getSession: jest.fn(async () => ({ data: { session: { user: {} } } })),
    })
    const r = await establecerSesionDesdeEnlace(sb)
    expect(r).toEqual({ ok: true, via: 'sesion_previa' })
  })

  test('token_hash de recuperación: verifyOtp', async () => {
    irA('/reset-password?token_hash=th123&type=recovery')
    const sb = clienteFalso()
    const r = await establecerSesionDesdeEnlace(sb)
    expect(r).toEqual({ ok: true, via: 'otp' })
    expect(sb.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'th123', type: 'recovery' })
  })

  test("el tipo 'email' se traduce a 'signup' en verifyOtp", async () => {
    irA('/confirm?token_hash=th123&type=email')
    const sb = clienteFalso()
    await establecerSesionDesdeEnlace(sb)
    expect(sb.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'th123', type: 'signup' })
  })

  test('code PKCE: exchangeCodeForSession', async () => {
    irA('/reset-password?code=pkce-code')
    const sb = clienteFalso()
    const r = await establecerSesionDesdeEnlace(sb)
    expect(r).toEqual({ ok: true, via: 'code' })
    expect(sb.auth.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code')
  })

  test('sin parámetros y sin sesión: sin_sesion (el caso que rompía el reset)', async () => {
    irA('/reset-password')
    const sb = clienteFalso()
    const r = await establecerSesionDesdeEnlace(sb)
    expect(r).toEqual({ ok: false, motivo: 'sin_sesion' })
    expect(sb.auth.setSession).not.toHaveBeenCalled()
  })

  test('sin parámetros pero con sesión existente: ok', async () => {
    irA('/reset-password')
    const sb = clienteFalso({
      getSession: jest.fn(async () => ({ data: { session: { user: {} } } })),
    })
    const r = await establecerSesionDesdeEnlace(sb)
    expect(r).toEqual({ ok: true, via: 'sesion_previa' })
  })

  test('setSession fallido con hash y sin sesión: no se da por buena', async () => {
    irA('/reset-password#access_token=malo&refresh_token=malo&type=recovery')
    const sb = clienteFalso({
      setSession: jest.fn(async () => ({ error: { message: 'Invalid token' } })),
    })
    const r = await establecerSesionDesdeEnlace(sb)
    expect(r.ok).toBe(false)
  })
})
