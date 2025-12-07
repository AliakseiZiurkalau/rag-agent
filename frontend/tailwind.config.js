/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1e40af',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      }
    },
  },
  plugins: [],
}
