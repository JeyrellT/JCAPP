/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Cascadia Mono', 'Segoe UI Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.03em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.01em' }],
        sm: ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.006em' }],
        lg: ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.011em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.014em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.018em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.021em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.024em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.028em' }],
      },
      colors: {
        app: rgb('--jc-bg-app'),
        subtle: rgb('--jc-bg-subtle'),
        surface: {
          DEFAULT: rgb('--jc-surface'),
          raised: rgb('--jc-surface-raised'),
          sunken: rgb('--jc-surface-sunken'),
        },
        line: {
          DEFAULT: rgb('--jc-line'),
          subtle: rgb('--jc-line-subtle'),
          strong: rgb('--jc-line-strong'),
        },
        content: {
          DEFAULT: rgb('--jc-content'),
          secondary: rgb('--jc-content-secondary'),
          muted: rgb('--jc-content-muted'),
          inverse: rgb('--jc-content-inverse'),
        },
        brand: {
          DEFAULT: rgb('--jc-brand'),
          hover: rgb('--jc-brand-hover'),
          contrast: rgb('--jc-brand-contrast'),
        },
        ring: rgb('--jc-ring'),
        primary: {
          50: '#EDFBF8', 100: '#D2F5EE', 200: '#A7EADF', 300: '#6FD8C9', 400: '#38BEAF',
          500: '#189C90', 600: '#0C7C72', 700: '#0A635C', 800: '#0B4F4A', 900: '#0C413E', 950: '#042726',
        },
        secondary: {
          50: '#EEF0FF', 100: '#E0E4FF', 200: '#C6CCFF', 300: '#A3ABFC', 400: '#8189F6',
          500: '#6366E8', 600: '#4F46D6', 700: '#3F35B4', 800: '#332C90', 900: '#2B2775', 950: '#1A1747',
        },
        accent: {
          50: '#FEF6E7', 100: '#FCE9C2', 300: '#F7C065', 400: '#F5A524',
          500: '#E08700', 600: '#B86A00', 700: '#9A5800',
        },
        neutral: {
          0: '#FFFFFF', 25: '#FBFCFD', 50: '#F6F8FA', 100: '#EDF0F4', 200: '#DFE4EA', 300: '#C7CED8',
          400: '#9AA5B4', 500: '#6B7787', 600: '#4D5766', 700: '#39424E', 800: '#252C36',
          850: '#1B222B', 900: '#141A22', 950: '#0C1116',
        },
        // Alias: mejora sola la deuda de ~2.541 clases gray-* sin reescribirlas.
        gray: {
          50: '#F6F8FA', 100: '#EDF0F4', 200: '#DFE4EA', 300: '#C7CED8', 400: '#9AA5B4',
          500: '#6B7787', 600: '#4D5766', 700: '#39424E', 800: '#252C36', 900: '#141A22', 950: '#0C1116',
        },
        success: { DEFAULT: rgb('--jc-success'), soft: rgb('--jc-success-soft'), on: rgb('--jc-success-on') },
        warning: { DEFAULT: rgb('--jc-warning'), soft: rgb('--jc-warning-soft'), on: rgb('--jc-warning-on') },
        danger:  { DEFAULT: rgb('--jc-danger'),  soft: rgb('--jc-danger-soft'),  on: rgb('--jc-danger-on') },
        info:    { DEFAULT: rgb('--jc-info'),    soft: rgb('--jc-info-soft'),    on: rgb('--jc-info-on') },
        phase: {
          define:  { DEFAULT: rgb('--jc-phase-define'),  soft: rgb('--jc-phase-define-soft'),  on: rgb('--jc-phase-define-on') },
          measure: { DEFAULT: rgb('--jc-phase-measure'), soft: rgb('--jc-phase-measure-soft'), on: rgb('--jc-phase-measure-on') },
          analyze: { DEFAULT: rgb('--jc-phase-analyze'), soft: rgb('--jc-phase-analyze-soft'), on: rgb('--jc-phase-analyze-on') },
          improve: { DEFAULT: rgb('--jc-phase-improve'), soft: rgb('--jc-phase-improve-soft'), on: rgb('--jc-phase-improve-on') },
          control: { DEFAULT: rgb('--jc-phase-control'), soft: rgb('--jc-phase-control-soft'), on: rgb('--jc-phase-control-on') },
        },
      },
      borderRadius: {
        DEFAULT: '4px', sm: '6px', md: '8px', lg: '10px', xl: '14px', '2xl': '20px', '3xl': '28px',
      },
      boxShadow: {
        xs: 'var(--jc-shadow-xs)',
        sm: 'var(--jc-shadow-sm)',
        DEFAULT: 'var(--jc-shadow-sm)',
        md: 'var(--jc-shadow-md)',
        lg: 'var(--jc-shadow-lg)',
        xl: 'var(--jc-shadow-xl)',
        overlay: 'var(--jc-shadow-overlay)',
        focus: '0 0 0 4px rgb(12 124 114 / .16)',
        'focus-danger': '0 0 0 4px rgb(220 38 38 / .16)',
      },
      spacing: { 18: '4.5rem', 88: '22rem', 100: '25rem', 112: '28rem', 128: '32rem' },
      maxWidth: { page: '1280px', form: '1024px' },
      zIndex: { sticky: '10', sidebar: '30', navbar: '40', backdrop: '50', modal: '60', dropdown: '70', tooltip: '80', toast: '90' },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        decelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        accelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: { instant: '80ms', fast: '140ms', base: '200ms', slow: '280ms' },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-500px 0' }, '100%': { backgroundPosition: '500px 0' } },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
