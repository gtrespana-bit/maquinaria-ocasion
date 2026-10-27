/** @type {import('tailwindcss').Config} */
// ─────────────────────────────────────────────────────────────────────────────
// Escalas de reemplazo (ver `colors` más abajo)
// ─────────────────────────────────────────────────────────────────────────────
const WARM = {
  50: '#FBFAF5', 100: '#F5F2EB', 200: '#EDE9E0', 300: '#DCD6C8',
  400: '#C4BCA9', 500: '#6E6B61', 600: '#5A574E', 700: '#3D3F38',
  800: '#20251F', 900: '#0C0E0D', 950: '#0C0E0D',
}
const MOSS = {
  50: '#EFF4EC', 100: '#E7EFE4', 200: '#C9DCC3', 300: '#A3C29A',
  400: '#6E9B62', 500: '#3E7047', 600: '#2C5535', 700: '#24452B',
  800: '#1D3722', 900: '#172C1B', 950: '#0F1D12',
}
const CLAY = {
  50: '#F9EEE9', 100: '#F2DDD3', 200: '#E4BBAA', 300: '#D2947C',
  400: '#C4643F', 500: '#B4441F', 600: '#9C3B1B', 700: '#8E3417',
  800: '#73290F', 900: '#5C200C', 950: '#3F1608',
}
const SIGNAL = {
  50: '#FFFBE6', 100: '#FFF5BF', 200: '#FFEC80', 300: '#FFE24D',
  400: '#FFD91A', 500: '#FFD400', 600: '#E5BC00', 700: '#B89600',
  800: '#8A7000', 900: '#5C4A00', 950: '#332900',
}
const NEUTRAL = WARM

// ─────────────────────────────────────────────────────────────────────────────
// MaquinariaOcasión — sistema de diseño «CATÁLOGO DE MÁQUINAS»
//
// Dirección de arte: editorial industrial. Papel hueso + tinta grafito +
// amarillo de señal (el amarillo de las máquinas de obra). Hairlines de 1px en
// lugar de sombras, esquinas casi rectas, tipografía grande y numerals
// tabulares, micro-etiquetas en monoespaciada.
//
// Los tokens `brand.*` se conservan (y apuntan a la nueva paleta) porque hay
// cientos de usos heredados en admin, dashboard y formularios: así toda la app
// cambia de piel a la vez sin dejar piezas con el look antiguo.
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tinta: casi negro, ligeramente cálido para no chocar con el papel.
        ink: {
          DEFAULT: '#0C0E0D',
          2: '#151917',
          3: '#20251F',
          4: '#333A34',
        },
        // Papel: hueso, no blanco puro (el blanco puro es lo que hace que todo
        // parezca una plantilla).
        paper: {
          DEFAULT: '#F5F2EB',
          2: '#EDE9E0',
          3: '#E3DED2',
          4: '#CFC8B7',
        },
        line: {
          DEFAULT: '#DCD6C8',
          strong: '#C4BCA9',
          dark: '#2A302A',
        },
        signal: {
          DEFAULT: '#FFD400',
          deep: '#E5BC00',
          soft: '#FFF1A6',
        },
        clay: { DEFAULT: '#B4441F', deep: '#8E3417' },
        moss: { DEFAULT: '#2C5535', soft: '#E7EFE4' },
        muted: '#6E6B61',

        // ── Paletas del sistema alineadas con la dirección de arte ──────────
        // Admin, dashboard, chat y formularios heredados usan `gray/slate/…`
        // de Tailwind. En vez de reescribir 6.000 líneas de UI interna, se
        // reasignan esas escalas a la paleta cálida del sistema: el gris azulado
        // de plantilla desaparece y todo pasa a papel + tinta de un golpe.
        gray: WARM,
        slate: WARM,
        zinc: WARM,
        neutral: WARM,
        stone: WARM,
        // Semánticos: verde = musgo, rojo = arcilla, ámbar = señal.
        emerald: MOSS,
        green: MOSS,
        lime: MOSS,
        teal: MOSS,
        red: CLAY,
        rose: CLAY,
        orange: CLAY,
        amber: SIGNAL,
        yellow: SIGNAL,
        // Azules y violetas: fuera. Es el tell más claro de «plantilla SaaS».
        sky: NEUTRAL,
        blue: NEUTRAL,
        indigo: NEUTRAL,
        violet: NEUTRAL,
        purple: NEUTRAL,
        fuchsia: NEUTRAL,
        pink: NEUTRAL,

        // ── Compatibilidad con el tema anterior (no usar en código nuevo) ──
        brand: {
          primary: '#0C0E0D',
          dark: '#151917',
          darkNav: '#0C0E0D',
          accent: '#FFD400',
          'accent-dark': '#E5BC00',
          'accent-light': '#FFE566',
          orange: '#B4441F',
          'orange-dark': '#8E3417',
          signal: '#FFD400',
          'signal-dark': '#E5BC00',
          gray: '#F5F2EB',
        },
      },
      fontFamily: {
        display: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      // Esquinas: casi rectas. `rounded-xl` y `rounded-2xl` se redefinen a
      // propósito para que las pantallas heredadas (admin, dashboard,
      // formularios) adopten el mismo lenguaje sin reescribirlas.
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '3px',
        DEFAULT: '3px',
        md: '4px',
        lg: '5px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '6px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(12,14,13,0.04)',
        'card-hover': '0 24px 48px -32px rgba(12,14,13,0.45)',
        panel: '0 32px 64px -40px rgba(12,14,13,0.55)',
        'signal-glow': '0 12px 32px -18px rgba(255,212,0,0.85)',
        none: 'none',
      },
      maxWidth: {
        content: '1440px',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
        snap: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      letterSpacing: {
        tightest: '-0.05em',
        label: '0.18em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(-50%,0,0)' },
        },
        'line-in': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        marquee: 'marquee 38s linear infinite',
      },
    },
  },
  plugins: [],
}
