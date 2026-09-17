/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        // Tipografía del logo; con respaldo al sistema si Google Fonts no carga
        marca: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        color1: '#f46c2d', // Naranja
        color2: '#fcbc7c', // Melocotón
        color3: '#202e48', // Azul oscuro
        color4: '#5d7ba2', // Azul
        color5: '#a4cbd1', // Azul claro
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
}