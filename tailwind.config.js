/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial']
      },
      boxShadow: {
        soft: '0 20px 60px rgba(33, 26, 21, 0.08)',
        card: '0 12px 35px rgba(33, 26, 21, 0.07)'
      },
      colors: {
        cream: '#FAF7F2',
        ink: '#241C15',
        muted: '#7A6F66',
        orange: '#F15A24'
      }
    }
  },
  plugins: []
}
