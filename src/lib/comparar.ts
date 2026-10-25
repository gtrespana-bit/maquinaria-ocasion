'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Lista de anuncios a comparar (comparador de ofertas, §3 del roadmap).
 *
 * Los IDs viven en `localStorage` (invitados y usuarios, sin cuenta) y los
 * datos frescos se piden en /comparar al abrirlo: así el precio y la ficha
 * que se comparan son los de ahora, no una copia guardada. Máximo
 * `COMPARAR_MAX` anuncios; al llenarse, sale el más antiguo (FIFO).
 *
 * La sincronización entre componentes (tarjetas, barra flotante, ficha) se
 * hace con un evento propio + evento `storage` para otras pestañas.
 */

export interface ItemComparar {
  id: string
  slug: string | null
  titulo: string
  precio_usd: number | null
  imagen_url: string | null
}

export const COMPARAR_MAX = 4
export const COMPARAR_KEY = 'maquinariaocasion_comparar'

const EVT = 'maquinariaocasion:comparar'

export function leerComparar(): ItemComparar[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(COMPARAR_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is ItemComparar =>
        !!x && typeof x.id === 'string' && typeof x.titulo === 'string'
    ).slice(-COMPARAR_MAX)
  } catch {
    return []
  }
}

function escribir(lista: ItemComparar[]) {
  try {
    window.localStorage.setItem(COMPARAR_KEY, JSON.stringify(lista.slice(-COMPARAR_MAX)))
  } catch {
    // localStorage lleno o bloqueado (modo privado): el comparador no rompe la web
  }
  window.dispatchEvent(new Event(EVT))
}

/** Añade o quita un anuncio. Lleno → sale el más antiguo. */
export function alternarItem(item: ItemComparar) {
  const actual = leerComparar()
  const sinEste = actual.filter(x => x.id !== item.id)
  if (sinEste.length === actual.length) {
    escribir([...actual, item])
  } else {
    escribir(sinEste)
  }
}

export function quitarItem(id: string) {
  escribir(leerComparar().filter(x => x.id !== id))
}

export function vaciarComparar() {
  escribir([])
}

export function useComparar() {
  const [lista, setLista] = useState<ItemComparar[]>([])

  useEffect(() => {
    const sync = () => setLista(leerComparar())
    sync()
    const onStorage = (e: StorageEvent) => {
      if (e.key === COMPARAR_KEY || e.key === null) sync()
    }
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const alternar = useCallback((item: ItemComparar) => alternarItem(item), [])
  const quitar = useCallback((id: string) => quitarItem(id), [])
  const vaciar = useCallback(() => vaciarComparar(), [])

  return { lista, alternar, quitar, vaciar }
}
