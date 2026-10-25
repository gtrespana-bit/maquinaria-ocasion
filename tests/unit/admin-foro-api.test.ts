/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/foro/route'
import { requireAdmin } from '@/lib/require-auth'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/require-auth', () => ({ requireAdmin: jest.fn() }))

const HILO = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const MSG = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
let tables: Record<string, any>
let results: Record<string, any[]>

function req(body?: any) {
  return new NextRequest('https://site.test/api/admin/foro', body
    ? { method: 'POST', body: JSON.stringify(body) }
    : { method: 'GET' })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAdmin as jest.Mock).mockResolvedValue({ user: { id: 'admin-1' } })
  results = {
    foro_hilos: [{ data: null }],
    foro_mensajes: [{ data: null }],
    perfiles: [{ data: [] }],
  }
  tables = {}
  ;(createClient as jest.Mock).mockReturnValue({
    from: (table: string) => {
      if (!tables[table]) {
        const q: any = {}
        for (const method of ['select', 'eq', 'in', 'order', 'insert', 'update', 'delete']) {
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

test('GET: sin admin → no toca la base', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ response: new Response(null, { status: 403 }) })
  const res = await GET(req())
  expect(res.status).toBe(403)
  expect(createClient).not.toHaveBeenCalled()
})

test('GET: devuelve hilos con categoría y autor resueltos', async () => {
  results.foro_hilos = [{
    data: [{
      id: HILO, titulo: 'Hilo de prueba', cuerpo: 'cuerpo', estado_moderacion: 'pendiente',
      motivo_moderacion: 'términos', cerrado: false, mensajes_count: 2,
      actualizado_en: '2026-10-25T10:00:00Z', creado_en: '2026-10-24T10:00:00Z',
      user_id: 'u1', foro_categorias: { nombre_es: 'Compra', nombre_en: 'Buying', icono: '❓', slug: 'compra' },
    }],
  }]
  results.foro_mensajes = [{ data: [] }]
  results.perfiles = [{ data: [{ id: 'u1', nombre: 'Gtrespana' }] }]

  const res = await GET(req())
  expect(res.status).toBe(200)
  const json = await res.json()
  expect(json.ok).toBe(true)
  expect(json.hilos).toHaveLength(1)
  expect(json.hilos[0]).toMatchObject({ autor: 'Gtrespana', estado_moderacion: 'pendiente' })
  expect(json.hilos[0].categoria.slug).toBe('compra')
})

test('POST: acción inválida → 400', async () => {
  const res = await POST(req({ action: 'volar', id: HILO }))
  expect(res.status).toBe(400)
})

test('POST: aprobar hilo → update a aprobado', async () => {
  results.foro_hilos = [{ data: null }]
  const res = await POST(req({ action: 'aprobar', id: HILO }))
  expect(res.status).toBe(200)
  expect(tables.foro_hilos.update).toHaveBeenCalledWith({
    estado_moderacion: 'aprobado',
    motivo_moderacion: null,
  })
})

test('POST: cerrar y abrir hilo → toggles de cerrado', async () => {
  results.foro_hilos = [{ data: null }, { data: null }]
  expect((await POST(req({ action: 'cerrar', id: HILO }))).status).toBe(200)
  expect(tables.foro_hilos.update).toHaveBeenLastCalledWith({ cerrado: true })
  expect((await POST(req({ action: 'abrir', id: HILO }))).status).toBe(200)
  expect(tables.foro_hilos.update).toHaveBeenLastCalledWith({ cerrado: false })
})

test('POST: eliminar hilo → delete en foro_hilos', async () => {
  results.foro_hilos = [{ data: null }]
  const res = await POST(req({ action: 'eliminar', id: HILO }))
  expect(res.status).toBe(200)
  expect(tables.foro_hilos.delete).toHaveBeenCalled()
})

test('POST: eliminar-mensaje → borra y baja el contador del hilo', async () => {
  results.foro_mensajes = [
    { data: { id: MSG, hilo_id: HILO, foro_hilos: { mensajes_count: 3 } } },
    { data: null },
  ]
  results.foro_hilos = [{ data: null }]
  const res = await POST(req({ action: 'eliminar-mensaje', id: MSG }))
  expect(res.status).toBe(200)
  expect(tables.foro_mensajes.delete).toHaveBeenCalled()
  expect(tables.foro_hilos.update).toHaveBeenCalledWith({ mensajes_count: 2 })
})

test('POST: aprobar-mensaje → update del estado', async () => {
  results.foro_mensajes = [{ data: null }]
  const res = await POST(req({ action: 'aprobar-mensaje', id: MSG }))
  expect(res.status).toBe(200)
  expect(tables.foro_mensajes.update).toHaveBeenCalledWith({
    estado_moderacion: 'aprobado',
    motivo_moderacion: null,
  })
})
