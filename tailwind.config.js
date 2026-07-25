/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 30px rgba(56, 189, 248, 0.35)',
        'glow-lg': '0 0 50px rgba(99, 102, 241, 0.4)',
        'card': '0 4px 24px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 8px 32px rgba(15, 23, 42, 0.14)',
      },
    },
  },
  plugins: [],
};
