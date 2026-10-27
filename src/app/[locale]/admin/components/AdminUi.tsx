'use client'

import {useEffect, useMemo, useRef, type ReactNode, type ButtonHTMLAttributes} from 'react'
import clsx from 'clsx'
import { X,
  RefreshCw,
  Search,
  Loader2,
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Folder,
  Image as ImageIcon,
  Megaphone,
  Package,
  ShieldCheck,
  TrendingUp,
  Users, type LucideIcon } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* formatters                                                          */
/* ------------------------------------------------------------------ */

export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0'
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n)
}

export function formatMoney(value: number | string | null | undefined, decimals = 2): string {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '$0'
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals }).format(n)}`
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric' }).format(d)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit' }).format(d)
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.max(0, Math.floor(diff / 60000))
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days} d`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} meses`
  const years = Math.floor(months / 12)
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}

/* ------------------------------------------------------------------ */
/* badges                                                              */
/* ------------------------------------------------------------------ */

export type BadgeTone =
  | 'gray'
  | 'green'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'brand'
  | 'dark'

const TONES: Record<BadgeTone, string> = {
  gray: 'border-line bg-paper-2 text-ink/55',
  green: 'border-moss/30 bg-moss-soft text-moss',
  red: 'border-clay/35 bg-clay/[0.06] text-clay',
  yellow: 'border-signal-deep/40 bg-signal/20 text-ink/70',
  blue: 'border-line bg-paper-2 text-ink/55',
  purple: 'border-line bg-paper-2 text-ink/55',
  orange: 'border-signal-deep/40 bg-signal/15 text-ink/70',
  brand: 'border-ink/20 bg-ink/[0.06] text-ink',
  dark: 'border-ink bg-ink text-paper' }

export function Badge({
  children,
  tone = 'gray',
  className }: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={clsx(
        't-label inline-flex items-center gap-1 border px-1.5 py-1 leading-none whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* cards                                                               */
/* ------------------------------------------------------------------ */

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  padded = true }: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  padded?: boolean
}) {
  return (
    <section className={clsx('border border-line bg-[#FBFAF5]', className)}>
      {(title || actions) && (
        <header className="flex flex-col gap-2 border-b border-ink px-4 py-3 sm:flex-row sm:items-end sm:justify-between md:px-5">
          <div>
            {title && <h3 className="t-eyebrow text-ink">{title}</h3>}
            {subtitle && <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/45">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx(padded && 'p-4 md:p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  accent,
  onClick,
  trend,
  loading }: {
  label: string
  value: ReactNode
  helper?: ReactNode
  icon: LucideIcon
  accent?: string
  onClick?: () => void
  trend?: { value: string; positive: boolean }
  loading?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  const Icon = icon
  return (
    <Comp
      onClick={onClick}
      className={clsx(
        'group relative border border-line bg-[#FBFAF5] p-4 text-left transition-colors sm:p-5',
        onClick && 'cursor-pointer hover:border-ink',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Icon size={15} strokeWidth={1.6} className={clsx('shrink-0', accent || 'text-ink/30')} aria-hidden="true" />
        {trend && (
          <span
            className={clsx(
              't-label border px-1.5 py-1 leading-none',
              trend.positive ? 'border-moss/30 bg-moss-soft text-moss' : 'border-clay/35 bg-clay/[0.06] text-clay',
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="t-display t-num text-[1.6rem] leading-none text-ink">{loading ? '—' : value}</div>
        <div className="t-label mt-2 text-ink/45">{label}</div>
        {helper && <div className="mt-1.5 text-[11px] leading-snug text-ink/35">{helper}</div>}
      </div>
    </Comp>
  )
}

/* ------------------------------------------------------------------ */
/* loading / empty / search / refresh                                  */
/* ------------------------------------------------------------------ */

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="py-12" aria-busy="true">
      <p className="t-label text-ink/30">{label}</p>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  )
}

const EMOJI_ICONO: Record<string, LucideIcon> = {
  '📊': Activity,
  '👣': Activity,
  '📅': CalendarDays,
  '✅': CheckCircle2,
  '🎉': CheckCircle2,
  '🕵️': ShieldCheck,
  '🗂️': Folder,
  '📢': Megaphone,
  '⚠️': AlertTriangle,
  '📦': Package,
  '🖼️': ImageIcon,
  '👤': Users,
  '👥': Users,
  '📈': TrendingUp,
  '💳': CreditCard }

export function Empty({
  icon,
  title,
  subtitle,
  action }: {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {(() => {
        if (!icon) return null
        // Los estados vacíos llegan con un emoji heredado: se traduce a icono
        // de línea para no romper la retícula ni depender de la fuente emoji.
        const Icono = typeof icon === 'string' ? EMOJI_ICONO[icon] : null
        if (Icono) return <Icono size={20} strokeWidth={1.3} className="mb-1 text-ink/25" aria-hidden="true" />
        if (typeof icon === 'string') return null
        return <div className="mb-1 text-ink/25">{icon}</div>
      })()}
      <p className="text-[14px] font-semibold tracking-[-0.015em] text-ink">{title}</p>
      {subtitle && <p className="max-w-md text-[12.5px] leading-relaxed text-ink/50">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className }: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={clsx('relative', className)}>
      <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field h-9 pl-9 text-[13px]"
      />
    </div>
  )
}

export function RefreshButton({
  onClick,
  loading,
  title = 'Actualizar' }: {
  onClick: () => void
  loading?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={loading}
      className="inline-flex h-8 w-8 items-center justify-center border border-line bg-paper text-ink/50 transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
    >
      <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* segmented control                                                   */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  size = 'sm',
  className }: {
  items: Array<{ id: T; label: ReactNode }>
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div className={clsx('inline-flex flex-wrap border border-line bg-paper', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={clsx(
            't-label transition-colors',
            size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2',
            value === item.id
              ? 'bg-ink text-paper'
              : 'text-ink/50 hover:bg-paper-2 hover:text-ink',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* modal + confirm                                                     */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md' }: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl' }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={clsx('max-h-[92vh] w-full overflow-hidden border-t border-line-strong bg-[#FBFAF5] outline-none sm:border', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink px-4 py-3 md:px-5">
          <div>
            <h2 className="text-[14px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[11.5px] text-ink/45">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/40 transition-colors hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto px-4 py-4 md:px-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3 md:px-5">{footer}</div>}
      </div>
    </div>
  )
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  loading }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={clsx('btn btn-sm disabled:opacity-50', danger ? 'btn-clay' : 'btn-ink')}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-[13px] leading-relaxed text-ink/65">{message}</div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* table helpers                                                       */
/* ------------------------------------------------------------------ */

export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('overflow-x-auto border border-line bg-[#FBFAF5]', className)}>
      <table className="w-full min-w-[720px] text-left text-[12.5px]">{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="t-label border-b border-ink bg-paper-2/60 text-ink/45">{children}</thead>
}

export function Th({
  children,
  className,
  onClick,
  sortDir }: {
  children?: ReactNode
  className?: string
  onClick?: () => void
  sortDir?: 'asc' | 'desc' | null
}) {
  return (
    <th
      onClick={onClick}
      className={clsx('px-3 py-2.5 font-normal', onClick && 'cursor-pointer select-none hover:text-ink', className)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortDir && <span className="text-ink/60">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  )
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx('px-3 py-2.5 align-middle text-ink/70', className)}>{children}</td>
}

/* ------------------------------------------------------------------ */
/* mini bars / sparkline                                              */
/* ------------------------------------------------------------------ */

export function Sparkline({ points, color = '#0C0E0D' }: { points: number[]; color?: string }) {
  const path = useMemo(() => {
    const values = points.length >= 2 ? points : Array.from({ length: 7 }, () => 0)
    const max = Math.max(...values, 1)
    const h = 34
    const w = 96
    const step = w / Math.max(1, values.length - 1)
    return values
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (p / max) * h).toFixed(1)}`)
      .join(' ')
  }, [points])

  return (
    <svg width="96" height="34" viewBox="0 0 96 34" className="overflow-visible" aria-hidden="true">
      <polyline points={path.replace(/[ML]/g, '$& ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <line x1="0" y1="34" x2="96" y2="34" stroke="#DCD6C8" strokeWidth="1" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* generic button                                                      */
/* ------------------------------------------------------------------ */

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
  size?: 'xs' | 'sm' | 'md'
}) {
  const variants = {
    primary: 'btn-ink',
    secondary: 'border border-ink/25 bg-ink/[0.06] text-ink hover:bg-ink/10',
    ghost: 'text-ink/55 hover:bg-paper-2 hover:text-ink',
    danger: 'btn-clay',
    success: 'border border-moss bg-moss text-paper hover:opacity-90',
    outline: 'btn-outline' }
  const sizes = {
    xs: 'h-6 px-2 text-[10.5px]',
    sm: 'h-7 px-2.5 text-[11px]',
    md: 'h-9 px-3.5 text-[12.5px]' }
  return (
    <button
      className={clsx('inline-flex items-center justify-center gap-1.5 font-medium tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50', sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}
