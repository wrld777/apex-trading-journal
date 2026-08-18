/** @type {import('tailwindcss').Config} */

/**
 * Il tema è la proiezione di `src/design-system/tokens.css`: qui non si
 * definiscono valori, si espongono i token come utility.
 *
 * I colori passano da `rgb(var(--token) / <alpha-value>)` — è la forma che
 * tiene vivi i modificatori di opacità (`bg-surface/50`, `border-pos/20`),
 * usati in tutto il progetto.
 */

const withAlpha = (token) => `rgb(var(${token}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:          withAlpha('--c-bg'),
        surface: {
          DEFAULT:   withAlpha('--c-surface'),
          2:         withAlpha('--c-surface-2'),
          3:         withAlpha('--c-surface-3'),
        },
        content: {
          strong:    withAlpha('--c-text-strong'),
          DEFAULT:   withAlpha('--c-text'),
          secondary: withAlpha('--c-text-secondary'),
          muted:     withAlpha('--c-text-muted'),
          faint:     withAlpha('--c-text-faint'),
        },
        line: {
          DEFAULT:   withAlpha('--c-border'),
          2:         withAlpha('--c-border-2'),
          control:   withAlpha('--c-control'),
        },
        brand: {
          DEFAULT:   withAlpha('--c-brand'),
          ink:       withAlpha('--c-brand-ink'),
        },
        pos:         withAlpha('--c-pos'),
        neg: {
          DEFAULT:   withAlpha('--c-neg'),
          solid:     withAlpha('--c-neg-solid'),
          ink:       withAlpha('--c-on-neg'),
        },
        warn:        withAlpha('--c-warn'),
        neutral2:    withAlpha('--c-neutral'),
      },
      fontFamily: {
        sans:  'var(--font-sans)',
        mono:  'var(--font-mono)',
        brand: 'var(--font-brand)',
      },
      fontSize: {
        '2xs': 'var(--text-2xs)',
        xs:    'var(--text-xs)',
        sm:    'var(--text-sm)',
        md:    'var(--text-md)',
        lg:    'var(--text-lg)',
        xl:    'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
      },
      borderRadius: {
        sm:     'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md:     'var(--radius)',
        lg:     'var(--radius-lg)',
        full:   'var(--radius-full)',
      },
      zIndex: {
        sticky: 'var(--z-sticky)',
        drawer: 'var(--z-drawer)',
        modal:  'var(--z-modal)',
        toast:  'var(--z-toast)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease)',
      },
      transitionDuration: {
        DEFAULT: 'var(--duration)',
      },
    },
  },
  plugins: [],
}
