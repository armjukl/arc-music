/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        eq: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        eq: 'eq 1s ease-in-out infinite',
        'eq-2': 'eq 1s ease-in-out 0.2s infinite',
        'eq-3': 'eq 1s ease-in-out 0.4s infinite',
      },
    },
  },
  plugins: [],
};
