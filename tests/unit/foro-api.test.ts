/** @jest-environment node */
import { NextRequest } from 'next/server'
import { POST as crearHilo } from '@/app/api/foro/hilos/route'
import { POST as crearMensaje } from '@/app/api/foro/mensajes/route'
import { requireUser } from '@/lib/require-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(async () => ({ ok: true, remaining: 4, resetIn: 0, limit: 5 })),
  getClientIp: () => '127.0.0.1',
}))

const USER = '11111111-1111-4111-8111-111111111111'
const HILO = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const CAT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
let tables: Record<string, any>
let results: Record<string, any[]>

function req(body: any) {
  return new NextRequest('https://site.test/api/foro/hilos', { method: 'POST', body: JSON.stringify(body) })
}

const hiloValido = {
  titulo: '¿Cuánto vale un John Deere 6120 del 2015?',
  cuerpo: 'Estoy valorando comprar uno con 4.200 horas y quiero saber si el precio es razonable.',
  categoria_id: CAT,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireUser as jest.Mock).mockResolvedValue({ user: { id: USER } })
  ;(checkRateLimit as jest.Mock).mockResolvedValue({ ok: true, remaining: 4, resetIn: 0, limit: 5 })
  results = {
    foro_categorias: [{ data: { id: CAT } }],
    foro_hilos: [{ data: { id: HILO, estado_moderacion: 'aprobado' } }],
    foro_mensajes: [{ data: { id: 'mensaje-1', estado_moderacion: 'aprobado' } }],
  }
  tables = {}
  ;(createClient as jest.Mock).mockReturnValue({
    from: (table: string) => {
      if (!tables[table]) {
        const q: any = {}
        for (const method of ['select', 'eq', 'in', 'or', 'order', 'insert', 'update', 'delete']) {
          q[method] = jest.fn(() => q)
        }
        const resolve = () => Promise.resolve(results[table]?.shift() || { data: null, error: null })
        q.maybeSingle = jest.fn(resolve)
        q.single = jest.fn(resolve)
        q.limit = jest.fn(resolve)
        q.then = (fn: any) => resolve().then(fn)
        tables[table] = q
      }
      return tables[table]
    },
  })
})

test('crear hilo: happy path → 201 aprobado', async () => {
  const res = await crearHilo(req(hiloValido))
  expect(res.status).toBe(201)
  expect(await res.json()).toMatchObject({ id: HILO, estado: 'aprobado' })
  expect(tables.foro_hilos.insert).toHaveBeenCalledWith(expect.objectContaining({
    categoria_id: CAT,
    user_id: USER,
    estado_moderacion: 'aprobado',
    titulo: hiloValido.titulo,
  }))
})

test('crear hilo: título corto → 400', async () => {
  const res = await crearHilo(req({ ...hiloValido, titulo: 'corto' }))
  expect(res.status).toBe(400)
})

test('crear hilo: supera el límite → 429', async () => {
  ;(checkRateLimit as jest.Mock).mockResolvedValue({ ok: false, remaining: 0, resetIn: 60000, limit: 5 })
  const res = await crearHilo(req(hiloValido))
  expect(res.status).toBe(429)
})

test('crear hilo: sin sesión → 401 y no toca la base', async () => {
  ;(requireUser as jest.Mock).mockResolvedValue({ response: new Response(null, { status: 401 }) })
  const res = await crearHilo(req(hiloValido))
  expect(res.status).toBe(401)
  expect(createClient).not.toHaveBeenCalled()
})

test('responder: hilo inexistente → 404', async () => {
  results.foro_hilos = [{ data: null }]
  const res = await crearMensaje(req({ hilo_id: HILO, cuerpo: 'Primera respuesta al hilo con suerte.' }))
  expect(res.status).toBe(404)
})

test('responder: hilo cerrado → 409', async () => {
  results.foro_hilos = [{ data: { id: HILO, cerrado: true, mensajes_count: 3 } }]
  const res = await crearMensaje(req({ hilo_id: HILO, cuerpo: 'Primera respuesta al hilo con suerte.' }))
  expect(res.status).toBe(409)
  expect(tables.foro_mensajes?.insert).toBeUndefined()
})

test('responder: contenido prohibido → 400', async () => {
  results.foro_hilos = [{ data: { id: HILO, cerrado: false, mensajes_count: 2 } }]
  const res = await crearMensaje(req({ hilo_id: HILO, cuerpo: 'Venta de rifle y entrega en mano, escribid por privado.' }))
  expect(res.status).toBe(400)
  expect(tables.foro_mensajes?.insert).toBeUndefined()
})

test('responder: happy path → ok y actualiza el hilo', async () => {
  results.foro_hilos = [
    { data: { id: HILO, cerrado: false, mensajes_count: 2 } },
    { data: null },
  ]
  const res = await crearMensaje(req({ hilo_id: HILO, cuerpo: 'Yo tengo uno del 2013 y el precio es similar.' }))
  expect(res.status).toBe(201)
  expect(await res.json()).toMatchObject({ id: 'mensaje-1', estado: 'aprobado' })
  expect(tables.foro_mensajes.insert).toHaveBeenCalledWith(expect.objectContaining({
    hilo_id: HILO,
    user_id: USER,
    estado_moderacion: 'aprobado',
  }))
  expect(tables.foro_hilos.update).toHaveBeenCalledWith(expect.objectContaining({
    mensajes_count: 3,
    actualizado_en: expect.any(String),
  }))
})
