import LocalLink from '@/components/LocalLink'

/**
 * Marca MaquinariaOcasión.
 *
 * El símbolo es una placa de señal industrial con la «M» construida como una
 * correa de transmisión: se lee a 20 px y no depende de ningún archivo de
 * imagen (nítida en cualquier pantalla, cero peticiones).
 *
 * La palabra mezcla grotesca (Maquinaria) y serif itálica (Ocasión): el
 * contrapunto que distingue una marca editorial de un logo de plantilla.
 */
type BrandLogoProps = {
  tone?: 'light' | 'dark'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** `true` siempre, `false` nunca, `'sm'` a partir de 640 px. */
  showText?: boolean | 'sm' | 'md'
  href?: string | null
  className?: string
  priority?: boolean
  /** Solo la placa (favicon, watermarks, badges). */
  monogramOnly?: boolean
}

const SIZES = {
  xs: { plate: 24, text: 'text-[15px]', gap: 'gap-2' },
  sm: { plate: 30, text: 'text-lg', gap: 'gap-2.5' },
  md: { plate: 36, text: 'text-[22px]', gap: 'gap-3' },
  lg: { plate: 52, text: 'text-3xl', gap: 'gap-3.5' } } as const

export function BrandMark({
  size = 36,
  tone = 'dark',
  className = '' }: {
  size?: number
  tone?: 'light' | 'dark'
  className?: string
}) {
  // tone="light" → la placa va sobre fondo oscuro, así que se invierte
  // (placa papel, M tinta) para mantener el contraste.
  const plate = tone === 'light' ? '#F5F2EB' : '#0C0E0D'
  const glyph = tone === 'light' ? '#0C0E0D' : '#FFD400'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
      shapeRendering="geometricPrecision"
    >
      <rect width="40" height="40" rx="1.5" fill={plate} />
      {/* Correa en «M»: trazos gruesos con el vértice central descendido */}
      <path
        d="M6.4 30.2V9.8h5.1L20 21.6 28.5 9.8h5.1v20.4h-4.9V17.9L20 29.6l-8.7-11.7v12.3H6.4Z"
        fill={glyph}
      />
      {/* Muescas de banda de rodadura en el borde inferior */}
      <g fill={glyph} opacity="0.5">
        <rect x="6.4" y="33.2" width="3.4" height="1.5" />
        <rect x="12.2" y="33.2" width="3.4" height="1.5" />
        <rect x="24.4" y="33.2" width="3.4" height="1.5" />
        <rect x="30.2" y="33.2" width="3.4" height="1.5" />
      </g>
    </svg>
  )
}

export default function BrandLogo({
  tone = 'dark',
  size = 'md',
  showText = true,
  href = '/',
  className = '',
  monogramOnly = false }: BrandLogoProps) {
  const s = SIZES[size]
  const isLight = tone === 'light'
  const textVisibility =
    showText === 'sm' ? 'hidden sm:block' : showText === 'md' ? 'hidden md:block' : ''

  const content = (
    <>
      <BrandMark size={s.plate} tone={tone} className="shrink-0" />
      {!monogramOnly && showText !== false && (
        <span
          className={`${s.text} leading-none ${textVisibility} ${isLight ? 'text-paper' : 'text-ink'}`}
        >
          <span className="font-bold tracking-[-0.03em] [font-stretch:104%]">Maquinaria</span>
          <span className="t-serif-italic ml-[0.06em] text-[1.06em] tracking-[-0.01em]">
            <span className={isLight ? 'text-signal' : 'text-ink'}>Ocasión</span>
          </span>
        </span>
      )}
    </>
  )

  const classes = `inline-flex items-center ${s.gap} ${className}`

  if (!href) return <span className={classes}>{content}</span>

  return (
    <LocalLink href={href} className={`${classes} group/logo`} aria-label="MaquinariaOcasión — inicio">
      {content}
    </LocalLink>
  )
}
