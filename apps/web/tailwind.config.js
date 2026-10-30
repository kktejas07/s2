/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  // Dark variants follow the in-app theme switcher (html.dark), not the OS setting
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        iqe: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0084bf', // Official IQE Logo Primary Blue
          600: '#0075ab',
          700: '#00618e',
          800: '#004b6e',
          900: '#003752',
          950: '#002235',
        },
        iqeOrange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#e35f14', // Official IQE Logo Top Arrow Orange
          600: '#cc500c',
          700: '#a83c07',
          800: '#86300c',
          900: '#70280d',
          950: '#431405',
        },
        // Alias brand to iqe so brand-500 etc default to IQE Logo Blue
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0084bf',
          600: '#0075ab',
          700: '#00618e',
          800: '#004b6e',
          900: '#003752',
          950: '#002235',
        },
        royal: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#00a5e8',
          500: '#0084bf',
          600: '#0075ab',
          700: '#00618e',
          800: '#004b6e',
          900: '#003752',
          950: '#002235',
        },
        slateDark: '#0b1325',
        navyDark: '#001a2c',
      },
      fontFamily: {
        sans: [`var(--font-inter, Roboto, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif)`],
        heading: [`var(--font-heading, var(--font-inter, Roboto, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif))`],
        mono: [`var(--font-mono, 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace)`],
      },
      fontWeight: {
        // 800 read as shouty across 600+ labels; cap "extrabold" at bold
        extrabold: '700',
      },
      spacing: {
        88: '22rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(0, 75, 110, 0.18)',
        lift: '0 2px 4px rgba(15, 23, 42, 0.04), 0 18px 40px -16px rgba(0, 75, 110, 0.35)',
        'glow-blue': '0 8px 28px -8px rgba(0, 132, 191, 0.55)',
        'glow-orange': '0 8px 28px -8px rgba(227, 95, 20, 0.55)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-up': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'dropdown-in': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.08)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%) scaleX(0.3)' },
          '50%': { transform: 'translateX(20%) scaleX(0.6)' },
          '100%': { transform: 'translateX(100%) scaleX(0.3)' },
        },
        'ping-soft': {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        in: 'fade-in 0.25s ease-out both',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'page-in': 'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'fade-down': 'fade-down 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-up': 'scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'dropdown-in': 'dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'progress-indeterminate': 'progress-indeterminate 1.1s ease-in-out infinite',
        'ping-soft': 'ping-soft 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};


