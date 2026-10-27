'use client'

import { usePathname } from 'next/navigation'
import LocalLink from '@/components/LocalLink'
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Navegación inferior (móvil).
 *
 * Barra de papel con filete superior, iconos de 1,5 px y una única acción
 * destacada: publicar, en placa de señal. Se muestra también en navegador
 * (no solo en PWA) porque la mayoría del tráfico móvil llega por enlace.
 */
export default function BottomTabNav() {
  const pathname = usePathname()
  const t = useTranslations()

  const items = [
    { href: '/', icon: Home, label: t('bottomNav.home') },
    { href: '/catalogo', icon: Search, label: t('bottomNav.search') },
    { href: '/publicar', icon: Plus, label: t('bottomNav.publish'), primary: true },
    { href: '/chat', icon: MessageCircle, label: t('bottomNav.chat') },
    { href: '/dashboard', icon: User, label: t('bottomNav.profile') },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      aria-label="Navegación principal"
    >
      <div className="flex h-[58px] items-stretch">
        {items.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)

          if (item.primary) {
            return (
              <LocalLink
                key={item.href}
                href={item.href}
                className="relative flex flex-1 items-center justify-center"
                aria-label={item.label}
              >
                <span className="flex h-11 w-11 -translate-y-[3px] items-center justify-center bg-signal text-ink shadow-signal-glow">
                  <Icon size={22} strokeWidth={2.2} />
                </span>
              </LocalLink>
            )
          }

          return (
            <LocalLink
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1"
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={active ? 1.9 : 1.5} className={active ? 'text-ink' : 'text-ink/45'} />
              <span
                className={`text-[9.5px] font-medium uppercase tracking-[0.12em] ${
                  active ? 'text-ink' : 'text-ink/40'
                }`}
              >
                {item.label}
              </span>
              {active && <span aria-hidden="true" className="absolute top-0 h-px w-6 bg-ink" />}
            </LocalLink>
          )
        })}
      </div>
    </nav>
  )
}
