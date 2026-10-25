/**
 * Comparador de ofertas: añadir/quitar, límite FIFO y vaciado.
 * El estado vive en localStorage y se sincroniza con un evento propio.
 */
import {
  COMPARAR_KEY,
  COMPARAR_MAX,
  alternarItem,
  leerComparar,
  quitarItem,
  vaciarComparar,
  type ItemComparar,
} from '@/lib/comparar'

const item = (n: number): ItemComparar => ({
  id: `id-${n}`,
  slug: `anuncio-${n}`,
  titulo: `Máquina ${n}`,
  precio_usd: 1000 * n,
  imagen_url: null,
})

beforeEach(() => {
  window.localStorage.clear()
})

test('empieza vacío y alternar añade', () => {
  expect(leerComparar()).toEqual([])
  alternarItem(item(1))
  expect(leerComparar()).toHaveLength(1)
  expect(leerComparar()[0].titulo).toBe('Máquina 1')
})

test('alternar el mismo anuncio lo quita (toggle)', () => {
  alternarItem(item(1))
  alternarItem(item(1))
  expect(leerComparar()).toEqual([])
})

test(`no supera ${COMPARAR_MAX}: sale el más antiguo (FIFO)`, () => {
  for (let n = 1; n <= COMPARAR_MAX + 2; n++) alternarItem(item(n))
  const lista = leerComparar()
  expect(lista).toHaveLength(COMPARAR_MAX)
  expect(lista.map(x => x.id)).not.toContain('id-1')
  expect(lista.map(x => x.id)).not.toContain('id-2')
  expect(lista[lista.length - 1].id).toBe(`id-${COMPARAR_MAX + 2}`)
})

test('quitarItem y vaciarComparar limpian la lista', () => {
  alternarItem(item(1))
  alternarItem(item(2))
  quitarItem('id-1')
  expect(leerComparar().map(x => x.id)).toEqual(['id-2'])
  vaciarComparar()
  expect(leerComparar()).toEqual([])
})

test('cada cambio emite el evento de sincronización', () => {
  const listener = jest.fn()
  window.addEventListener('maquinariaocasion:comparar', listener)
  alternarItem(item(1))
  alternarItem(item(2))
  expect(listener).toHaveBeenCalledTimes(2)
  window.removeEventListener('maquinariaocasion:comparar', listener)
})

test('datos corruptos en localStorage devuelven lista vacía sin lanzar', () => {
  window.localStorage.setItem(COMPARAR_KEY, '{no-json')
  expect(leerComparar()).toEqual([])
  window.localStorage.setItem(COMPARAR_KEY, '{"no":"array"}')
  expect(leerComparar()).toEqual([])
})
