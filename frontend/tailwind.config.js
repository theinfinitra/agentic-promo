/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        trust: '#0066CC',
        success: '#00A86B', 
        urgency: '#FF6B35',
        neutral: '#F8F6F3',
        primary: {
          50: '#eff6ff',
          500: '#0066CC',
          600: '#0052A3',
          700: '#003d7a'
        },
        secondary: '#6B7280'
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
