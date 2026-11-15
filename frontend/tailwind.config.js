/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
      colors: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        'on-accent': 'var(--text-on-accent)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        'surface-sunken': 'var(--surface-sunken)',
        'border-subtle': 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'accent-link': 'var(--accent-link)',
        space: {
          950: 'rgb(var(--bg-page-rgb) / <alpha-value>)',
          900: 'rgb(var(--bg-page-alt-rgb) / <alpha-value>)',
          850: 'rgb(var(--surface-alt-rgb) / <alpha-value>)',
          800: 'rgb(var(--surface-rgb) / <alpha-value>)',
          700: 'rgb(var(--surface-raised-rgb) / <alpha-value>)',
          600: 'rgb(var(--surface-alt-rgb) / <alpha-value>)',
        },
        accent: { DEFAULT: 'rgb(var(--accent) / <alpha-value>)', 400: 'rgb(var(--accent-strong) / <alpha-value>)', cyan: 'rgb(var(--accent-strong) / <alpha-value>)' },
        status: {
          critical: { DEFAULT: 'var(--status-critical-text)', bg: 'var(--status-critical-bg)', border: 'var(--status-critical-border)' },
          attention: { DEFAULT: 'var(--status-attention-text)', bg: 'var(--status-attention-bg)', border: 'var(--status-attention-border)' },
          ok: { DEFAULT: 'var(--status-ok-text)', bg: 'var(--status-ok-bg)', border: 'var(--status-ok-border)' },
          info: { DEFAULT: 'var(--status-info-text)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)' },
          neutral: { DEFAULT: 'var(--status-neutral-text)', bg: 'var(--status-neutral-bg)', border: 'var(--status-neutral-border)' },
          violet: { DEFAULT: 'var(--status-violet-text)', bg: 'var(--status-violet-bg)', border: 'var(--status-violet-border)' },
        },
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        glow: 'var(--shadow-glow)',
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
