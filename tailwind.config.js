/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './es/**/*.html',
    './tree-removal/**/*.html',
    './emergency-tree-removal/**/*.html',
    './tree-trimming-stump-grinding/**/*.html',
    './lawn-care/**/*.html',
    './snow-removal/**/*.html',
    './landscaping-design/**/*.html',
    './leaf-removal/**/*.html',
    './gutter-cleaning/**/*.html',
    './pressure-washing/**/*.html',
    './service-areas/**/*.html',
    './gallery/**/*.html',
    './videos/**/*.html',
    './gallery.html',
    './videos.html',
    './src/**/*.{html,js,ts,tsx}',
    './assets/js/**/*.{js,ts}',
    './tests/**/*.{js,ts,tsx}',
  ],
  theme: {
    extend: {
      // "Growth Rings" (2026-09-23): evergreen/leaf/moss greens and warm limestone-to-bark
      // neutrals replace Tailwind's defaults, so every existing utility follows the new palette.
      colors: {
        green: {
          50: '#f1f6ef', 100: '#dfeadb', 200: '#bfd5b8', 300: '#b8d98f', 400: '#9dbb52',
          500: '#3f7d4a', 600: '#2f6f4f', 700: '#245a40', 800: '#1c4a35', 900: '#153b2f', 950: '#0c2a20',
        },
        gray: {
          50: '#f7f5ef', 100: '#efebe1', 200: '#e3dccd', 300: '#cfc6b3', 400: '#a39a88',
          500: '#766d5e', 600: '#5d554a', 700: '#473f36', 800: '#2f2a24', 900: '#1f1b17', 950: '#14110e',
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', '"Public Sans Fallback"', 'system-ui', 'sans-serif'],
        display: ['"Big Shoulders Display"', '"Arial Narrow"', 'sans-serif'],
        stencil: ['"Big Shoulders Stencil Display"', '"Big Shoulders Display"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
