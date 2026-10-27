import LocalLink from '@/components/LocalLink'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

/** Micro-etiqueta monoespaciada con regla de señal opcional. */
export function Eyebrow({
  children,
  tone = 'ink',
  marker = 'rule',
  className = '' }: {
  children: ReactNode
  tone?: 'ink' | 'light' | 'signal'
  marker?: 'rule' | 'dot' | 'none'
  className?: string
}) {
  const color =
    tone === 'light' ? 'text-paper/70' : tone === 'signal' ? 'text-signal' : 'text-ink/70'
  const markColor = tone === 'light' ? 'bg-paper/40' : 'bg-signal'
  return (
    <span className={`t-eyebrow inline-flex items-center gap-2.5 ${color} ${className}`}>
      {marker === 'rule' && <span aria-hidden="true" className={`h-px w-6 ${markColor}`} />}
      {marker === 'dot' && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${markColor}`} />}
      {children}
    </span>
  )
}

/** Enlace de acción con flecha: el recurso de navegación secundaria. */
export function ArrowLink({
  href,
  children,
  tone = 'ink',
  className = '',
  arrow = 'right' }: {
  href: string
  children: ReactNode
  tone?: 'ink' | 'light' | 'signal'
  className?: string
  arrow?: 'right' | 'up-right'
}) {
  const color = tone === 'light' ? 'text-paper' : tone === 'signal' ? 'text-signal' : 'text-ink'
  const Icon = arrow === 'up-right' ? ArrowUpRight : ArrowRight
  return (
    <LocalLink
      href={href}
      className={`group/al t-eyebrow inline-flex items-center gap-2.5 ${color} ${className}`}
    >
      <span className="relative">
        {children}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-100 bg-current opacity-30 transition-all duration-500 group-hover/al:opacity-100"
        />
      </span>
      <Icon
        size={14}
        strokeWidth={1.75}
        className="transition-transform duration-300 group-hover/al:translate-x-1 group-hover/al:-translate-y-0.5"
      />
    </LocalLink>
  )
}

/**
 * Cabecera de sección: número de orden, titular, entradilla y acción.
 * La regla superior y el índice numérico son la firma del sistema.
 */
export function SectionHead({
  index,
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel,
  tone = 'ink',
  align = 'split',
  className = '' }: {
  index?: string
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  href?: string
  linkLabel?: string
  tone?: 'ink' | 'light'
  align?: 'split' | 'stack'
  className?: string
}) {
  const light = tone === 'light'
  return (
    <div className={`border-t pt-6 md:pt-7 ${light ? 'border-line-dark' : 'border-line'} ${className}`}>
      <div
        className={`flex flex-col gap-6 ${
          align === 'split' ? 'md:flex-row md:items-end md:justify-between' : ''
        }`}
      >
        <div className="max-w-3xl">
          {(eyebrow || index) && (
            <div className="mb-4 flex items-baseline gap-3">
              {index && (
                <span className={`t-label ${light ? 'text-signal' : 'text-ink/50'}`}>{index}</span>
              )}
              {eyebrow && <Eyebrow tone={light ? 'light' : 'ink'}>{eyebrow}</Eyebrow>}
            </div>
          )}
          <h2
            className={`t-display t-display-md ${light ? 'text-paper' : 'text-ink'}`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-4 max-w-xl text-[0.95rem] leading-relaxed ${
                light ? 'text-paper/65' : 'text-muted'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {href && linkLabel && (
          <div className="shrink-0 md:pb-1">
            <ArrowLink href={href} tone={light ? 'light' : 'ink'}>
              {linkLabel}
            </ArrowLink>
          </div>
        )}
      </div>
    </div>
  )
}

/** Banda de marquesina infinita (marcas, claims, servicios). */
export function Ticker({
  items,
  tone = 'light',
  className = '',
  speed = '',
  separator = '◆' }: {
  items: string[]
  tone?: 'light' | 'dark'
  className?: string
  speed?: '' | 'marquee-fast'
  separator?: string
}) {
  const dark = tone === 'dark'
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center">
          <span
            className={`t-eyebrow whitespace-nowrap px-5 ${
              dark ? 'text-paper/75' : 'text-ink/70'
            }`}
          >
            {item}
          </span>
          <span aria-hidden="true" className={`text-[0.6rem] ${dark ? 'text-signal' : 'text-ink/25'}`}>
            {separator}
          </span>
        </span>
      ))}
    </div>
  )
  return (
    <div className={`marquee-mask overflow-hidden ${className}`} aria-hidden="true">
      <div className={`marquee ${speed}`}>
        {row}
        {row}
      </div>
    </div>
  )
}

/** Ficha de dato: etiqueta mono + valor grande. Se usa en franjas de cifras. */
export function StatBlock({
  label,
  value,
  suffix,
  tone = 'light',
  className = '' }: {
  label: string
  value: ReactNode
  suffix?: string
  tone?: 'light' | 'dark'
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className={`t-display t-display-sm t-num ${dark ? 'text-paper' : 'text-ink'}`}>
        {value}
        {suffix && <span className="ml-0.5 text-[0.62em] align-baseline">{suffix}</span>}
      </span>
      <span className={`t-label ${dark ? 'text-paper/50' : 'text-muted'}`}>{label}</span>
    </div>
  )
}
