/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
      colors: {
        space: { 950: '#050914', 900: '#080D1B', 850: '#0B1220', 800: '#101A2E', 700: '#131F35', 600: '#192640' },
        accent: { DEFAULT: '#2563EB', 400: '#3B82F6', cyan: '#38BDF8' },
      },
      boxShadow: {
        panel: '0 1px 0 rgba(148,163,184,0.06) inset, 0 12px 32px -16px rgba(2,6,23,0.9)',
        glow: '0 0 0 1px rgba(56,189,248,0.25), 0 8px 24px -8px rgba(37,99,235,0.45)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: { 'fade-up': 'fade-up 0.35s ease-out both', shimmer: 'shimmer 1.6s linear infinite' },
    },
  },
  plugins: [],
};
