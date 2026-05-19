/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './tree-removal/**/*.html',
    './lawn-care/**/*.html',
    './snow-removal/**/*.html',
    './service-areas/**/*.html',
    './gallery.html',
    './gallery_fragment.html',
    './src/**/*.{html,js,ts,tsx}',
    './assets/js/**/*.{js,ts}',
    './tests/**/*.{js,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
