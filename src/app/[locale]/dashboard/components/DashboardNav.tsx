'use client'

import { BarChart3,
  Package,
  MessageSquare,
  CreditCard,
  Heart,
  Handshake,
  Store,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  LogOut, type LucideIcon } from 'lucide-react'

export type DashboardTab =
  | 'resumen'
  | 'productos'
  | 'rendimiento'
  | 'importar'
  | 'mensajes'
  | 'creditos'
  | 'tratos'
  | 'tienda'
  | 'favoritos'
  | 'plan'
  | 'cuenta'

const GRUPOS: { titulo: string; items: { id: DashboardTab; label: string; icon: LucideIcon }[] }[] = [
  {
    titulo: '',
    items: [{ id: 'resumen', label: 'Inicio', icon: BarChart3 }] },
  {
    titulo: 'Venta',
    items: [
      { id: 'productos', label: 'Anuncios', icon: Package },
      { id: 'rendimiento', label: 'Rendimiento', icon: TrendingUp },
      { id: 'importar', label: 'Importar stock', icon: FileSpreadsheet },
      { id: 'tienda', label: 'Mi tienda', icon: Store },
      { id: 'creditos', label: 'Créditos', icon: CreditCard },
    ] },
  {
    titulo: 'Actividad',
    items: [
      { id: 'mensajes', label: 'Mensajes', icon: MessageSquare },
      { id: 'tratos', label: 'Tratos', icon: Handshake },
      { id: 'favoritos', label: 'Guardados', icon: Heart },
    ] },
  {
    titulo: 'Cuenta',
    items: [
      { id: 'plan', label: 'Mi plan', icon: Sparkles },
      { id: 'cuenta', label: 'Confianza y perfil', icon: ShieldCheck },
    ] },
]

export const TABS_VALIDOS: DashboardTab[] = GRUPOS.flatMap(g => g.items.map(i => i.id))

/** Tabs antiguas del query string → las nuevas. */
export function normalizarTab(raw: string | null): DashboardTab {
  if (!raw) return 'resumen'
  if (raw === 'reservas' || raw === 'inspecciones') return 'tratos'
  if (raw === 'verificacion' || raw === 'reputacion') return 'cuenta'
  if ((TABS_VALIDOS as string[]).includes(raw)) return raw as DashboardTab
  return 'resumen'
}

export default function DashboardNav({
  active,
  onChange,
  onLogout }: {
  active: DashboardTab
  onChange: (tab: DashboardTab) => void
  onLogout: () => void
}) {
  const boton = (item: { id: DashboardTab; label: string; icon: LucideIcon }) => {
    const Icon = item.icon
    const on = active === item.id
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onChange(item.id)}
        aria-current={on ? 'page' : undefined}
        className={`flex w-full items-center gap-2.5 border-l-2 px-3 py-2 text-left text-[13px] font-medium transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper
          ${on
            ? 'border-signal bg-ink text-paper'
            : 'border-transparent text-ink/60 hover:border-line-strong hover:bg-[#FBFAF5] hover:text-ink'
          }`}
      >
        <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
        {item.label}
      </button>
    )
  }

  return (
    <>
      {/* Móvil: chips en una sola fila, agrupados visualmente por color no por 10 tabs. */}
      <nav
        aria-label="Secciones del panel"
        className="hide-scrollbar -mx-5 mb-6 overflow-x-auto border-b border-line px-5 pb-2 md:-mx-8 md:px-8 lg:hidden"
      >
        <div className="flex min-w-min gap-1.5">
          {GRUPOS.flatMap(g => g.items).map(item => {
            const Icon = item.icon
            const on = active === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={on ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-3 py-2 text-[13px] font-medium transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink
                  ${on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink/60'}`}
              >
                <Icon size={13} strokeWidth={1.6} aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 whitespace-nowrap border border-line px-3 py-2 text-[13px] font-medium text-ink/45 transition-colors hover:border-clay hover:text-clay"
          >
            <LogOut size={15} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Escritorio: menú lateral fijo, el patrón de un panel profesional. */}
      <aside className="sticky top-[var(--header-offset)] hidden w-56 shrink-0 self-start lg:flex lg:flex-col">
        <nav aria-label="Secciones del panel" className="space-y-5">
          {GRUPOS.map((grupo, i) => (
            <div key={grupo.titulo || 'inicio'}>
              {grupo.titulo ? (
                <p className="t-label mb-2 px-3 text-ink/30">
                  {grupo.titulo}
                </p>
              ) : null}
              <div className="space-y-0.5">{grupo.items.map(boton)}</div>
              {i === 0 && <div className="mt-4 border-t border-line" />}
            </div>
          ))}
        </nav>
        <button
          type="button"
          onClick={onLogout}
          className="mt-8 flex items-center gap-2 border-t border-line px-3 py-3 text-[13px] font-medium text-ink/45 transition-colors hover:text-clay"
        >
          <LogOut size={16} aria-hidden="true" />
          Cerrar sesión
        </button>
      </aside>
    </>
  )
}
