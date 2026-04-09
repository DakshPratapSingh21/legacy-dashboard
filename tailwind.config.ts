import type { Config } from 'tailwindcss';

/* =================================================================
   Tailwind Config — Impeccable + UI/UX Pro Max design tokens
   Font: DM Sans (distinctive, not Inter/Roboto/Open Sans)
   Spacing: 8px grid
   Colors: OKLCH semantic tokens via CSS vars
   ================================================================= */

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
    },
    fontSize: {
      xs: ['var(--text-xs)', { lineHeight: '1.5' }],
      sm: ['var(--text-sm)', { lineHeight: '1.5' }],
      base: ['var(--text-base)', { lineHeight: '1.6' }],
      lg: ['var(--text-lg)', { lineHeight: '1.5' }],
      xl: ['var(--text-xl)', { lineHeight: '1.3' }],
      '2xl': ['var(--text-2xl)', { lineHeight: '1.2' }],
    },
    borderRadius: {
      none: '0',
      sm: 'var(--radius-sm)',
      DEFAULT: 'var(--radius-md)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      full: '9999px',
    },
    extend: {
      colors: {
        bg: {
          root: 'var(--bg-root)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        positive: {
          DEFAULT: 'var(--positive)',
          muted: 'var(--positive-muted)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          muted: 'var(--warning-muted)',
        },
        critical: {
          DEFAULT: 'var(--critical)',
          muted: 'var(--critical-muted)',
        },
        chart: {
          landmark: 'var(--chart-landmark)',
          broadway: 'var(--chart-broadway)',
          legacy: 'var(--chart-legacy)',
          grid: 'var(--chart-grid)',
        },
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
      },
      boxShadow: {
        'card': '0 1px 3px oklch(5% 0.01 240 / 0.2), 0 4px 16px oklch(5% 0.01 240 / 0.15)',
        'card-hover': '0 2px 6px oklch(5% 0.01 240 / 0.25), 0 8px 24px oklch(5% 0.01 240 / 0.2)',
        'glow': '0 0 24px oklch(65% 0.14 250 / 0.15)',
      },
      animation: {
        'fade': 'fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slide': 'slideUp 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'scale': 'scaleIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
    },
  },
  plugins: [],
};
export default config;
