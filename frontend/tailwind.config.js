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
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-fg': 'var(--primary-fg)',
        royal: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 20px -4px rgba(67, 56, 202, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'indigo-glow': '0 0 20px -2px rgba(67, 56, 202, 0.25)',
      },
      animation: {
        'drop-in': 'dropIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.35s ease-out forwards',
      },
      keyframes: {
        dropIn: {
          '0%': { opacity: '0', transform: 'translateY(-14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
