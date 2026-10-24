/** @type {import('tailwindcss').Config} */
// Paleta MaquinariaOcasión: grafito/pizarra + ámbar + naranja de avisos.
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
          dark: '#1E293B',      // Pizarra (nav/header/footer)
          accent: '#F59E0B',    // Ámbar (acento de la marca)
          'accent-dark': '#B45309',
          'accent-light': '#FCD34D',
          orange: '#EA580C',    // Naranja cálido (avisos y destacados)
          'orange-dark': '#C2410C',
          gray: '#F5F5F5',
          darkNav: '#0B1120',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
