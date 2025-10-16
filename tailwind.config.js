/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background-color)',
        card: 'var(--card-background-color)',
        text: 'var(--text-color)',
        'text-light': 'var(--text-light-color)',
        border: 'var(--border-color)',
        primary: 'rgb(var(--color-primary))',
        'primary-hover': 'rgb(var(--color-primary-hover))',
        secondary: 'var(--secondary-color)',
        'secondary-hover': 'var(--secondary-hover-color)',
        success: 'var(--success-color)',
        danger: 'var(--danger-color)',
      }
    },
  },
  plugins: [],
}
