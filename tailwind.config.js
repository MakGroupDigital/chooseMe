/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#208050',
        },
        secondary: {
          green: '#19DB8A',
        },
        accent: {
          orange: '#FF8A3C',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        readex: ['Readex Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
