'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

/**
 * Revelado al hacer scroll con escalonado.
 *
 * IntersectionObserver + clase CSS (sin librerías de animación): el estado
 * inicial lo pinta el CSS, así que no hay salto ni parpadeo, y si el usuario
 * pide menos movimiento el CSS lo desactiva.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
  once = true }: {
  children: ReactNode
  as?: ElementType
  /** Retardo en ms (se aplica por CSS con transition-delay). */
  delay?: number
  className?: string
  once?: boolean
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once])

  return (
    <Tag
      ref={ref as any}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  )
}

/**
 * Contador que sube cuando entra en pantalla. Para cifras de confianza
 * (anuncios, vendedores, provincias) con cifras tabulares.
 */
export function CountUp({
  to,
  duration = 1100,
  suffix = '',
  className = '',
  locale = 'es-ES' }: {
  to: number
  duration?: number
  suffix?: string
  className?: string
  locale?: string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setValue(to)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration)
          // easeOutExpo
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
          setValue(Math.round(to * eased))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        io.disconnect()
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={`t-num ${className}`}>
      {new Intl.NumberFormat(locale).format(value)}
      {suffix}
    </span>
  )
}

/**
 * Foco de luz que sigue al cursor en el héroe. Un solo listener sobre el
 * contenedor, con requestAnimationFrame y variables CSS: no re-renderiza React.
 */
export function Spotlight({
  children,
  className = '',
  radius = 520,
  color = 'rgba(255,255,255,0.09)' }: {
  children: ReactNode
  className?: string
  radius?: number
  color?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(hover: none)').matches) return
    let frame = 0
    let x = 0
    let y = 0
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      x = e.clientX - rect.left
      y = e.clientY - rect.top
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        el.style.setProperty('--sx', `${x}px`)
        el.style.setProperty('--sy', `${y}px`)
      })
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden md:block"
        style={{
          background: `radial-gradient(${radius}px circle at var(--sx, 70%) var(--sy, 20%), ${color}, transparent 68%)` }}
      />
      {children}
    </div>
  )
}
