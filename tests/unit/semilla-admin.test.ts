/** @jest-environment node */
import { buscarUsuarioPorEmail } from '@/lib/semilla-admin.js'
import { destinatarioSemilla } from '@/lib/semilla-chat'
import { puedeReservar } from '@/lib/reservas'

function client(users: any[] = []) {
  const query: any = {}
  for (const method of ['select', 'eq']) query[method] = jest.fn(() => query)
  query.maybeSingle = jest.fn(async () => ({ data: { id: 'admin', es_demo: false }, error: null }))
  query.upsert = jest.fn(async () => ({ error: null }))
  const admin = {
    listUsers: jest.fn(async () => ({ data: { users }, error: null })),
    createUser: jest.fn(async (input: any) => ({ data: { user: { id: input.email, ...input } }, error: null })),
    updateUserById: jest.fn(async () => ({ error: null })),
    getUserById: jest.fn(async () => ({ data: { user: { app_metadata: { semilla: true } } }, error: null })),
  }
  return { auth: { admin }, from: jest.fn(() => query), query }
}

beforeEach(() => { delete process.env.SEMILLA_CHAT_EMAIL })

test('buscar por email pagina y normaliza mayúsculas', async () => {
  const sb = client()
  sb.auth.admin.listUsers
    .mockResolvedValueOnce({ data: { users: Array(200).fill({ email: 'other@site.com' }) }, error: null })
    .mockResolvedValueOnce({ data: { users: [{ id: 'a', email: 'GTRESPANA@GMAIL.COM' }] }, error: null })
  expect(await buscarUsuarioPorEmail(sb, 'gtrespana@gmail.com')).toMatchObject({ id: 'a' })
  expect(sb.auth.admin.listUsers).toHaveBeenLastCalledWith({ page: 2, perPage: 200 })
})

test('destino por defecto: cuenta real y confirmada gtrespana@gmail.com', async () => {
  const sb = client([{ id: 'admin', email: 'gtrespana@gmail.com', email_confirmed_at: '2026-01-01' }])
  expect(await destinatarioSemilla(sb as any, 'seed')).toBe('admin')
})

test('correo configurado en servidor permite otra cuenta confirmada', async () => {
  process.env.SEMILLA_CHAT_EMAIL = ' TEAM@SITE.COM '
  const sb = client([{ id: 'team', email: 'team@site.com', email_confirmed_at: '2026-01-01' }])
  expect(await destinatarioSemilla(sb as any, 'seed')).toBe('team')
})

test.each([
  [],
  [{ id: 'admin', email: 'gtrespana@gmail.com' }],
  [{ id: 'admin', email: 'gtrespana@gmail.com', email_confirmed_at: '2026-01-01', app_metadata: { semilla: true } }],
  [{ id: 'admin', email: 'gtrespana@gmail.com', email_confirmed_at: '2026-01-01', banned_until: '2099-01-01' }],
].map(users => [users]))('destino ausente, sin confirmar, ficticio o bloqueado: falla cerrado (%j)', async (users) => {
  await expect(destinatarioSemilla(client(users) as any, 'seed')).rejects.toThrow()
})

test('no basta un flag en producto o user_metadata para desviar un anuncio real', async () => {
  const sb = client()
  sb.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { semilla: false } } }, error: null })
  await expect(destinatarioSemilla(sb as any, 'real')).rejects.toThrow('no es una cuenta de semilla')
  expect(sb.auth.admin.listUsers).not.toHaveBeenCalled()
})

test('falla cerrado si no hay perfil real de atención', async () => {
  const sb = client([{ id: 'admin', email: 'gtrespana@gmail.com', email_confirmed_at: '2026-01-01' }])
  sb.query.maybeSingle.mockResolvedValueOnce({ data: { es_demo: true }, error: null })
  await expect(destinatarioSemilla(sb as any, 'seed')).rejects.toThrow('perfil real')
})

test('sin reservas de anuncios sembrados aunque se invoque la API directamente', () => {
  const product = { id: 'p', user_id: 'seed', activo: true, es_demo: true }
  expect(puedeReservar(product, null, 'buyer').ok).toBe(false)
})
