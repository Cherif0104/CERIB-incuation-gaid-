/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cerip: {
          green: '#22c55e',
          pink: '#ec4899',
          blue: '#2563eb',
        },
      },
    },
  },
  plugins: [],
};
