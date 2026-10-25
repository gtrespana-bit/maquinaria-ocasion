/** @type {import('tailwindcss').Config} */
// Paleta MaquinariaOcasión — rediseño «señalética industrial»:
// grafito profundo + amarillo de seguridad (señal) + ámbar/naranja de avisos.
// `brand.signal` es el color-voltaje: CTA primarios, kickers y reglas de acento.
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0F172A',   // Grafito / pizarra oscuro
          dark: '#16203A',      // Pizarra (nav/header/footer)
          accent: '#F59E0B',    // Ámbar (acento secundario de la marca)
          'accent-dark': '#B45309',
          'accent-light': '#FCD34D',
          orange: '#EA580C',    // Naranja cálido (avisos y destacados)
          'orange-dark': '#C2410C',
          signal: '#FFC60C',    // Amarillo de seguridad — color-voltaje CTA
          'signal-dark': '#D9A400',
          gray: '#F5F5F5',
          darkNav: '#0A0F1E',   // Negro azulado (bandas oscuras)
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,15,30,0.06), 0 4px 16px -8px rgba(10,15,30,0.10)',
        'card-hover': '0 8px 28px -8px rgba(10,15,30,0.22), 0 2px 6px rgba(10,15,30,0.06)',
        panel: '0 24px 60px -20px rgba(10,15,30,0.45)',
        'signal-glow': '0 10px 30px -8px rgba(255,198,12,0.55)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
