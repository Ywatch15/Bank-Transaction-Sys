/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Banking primary: Navy blue
        primary: {
          50: '#f0f5fb',
          100: '#d9e5f7',
          200: '#b3cbef',
          300: '#7da9e0',
          400: '#5a8dd4',
          500: '#3d72c9',
          600: '#2857a6',
          700: '#1f4283',
          800: '#0b3d91', // Primary navy
          900: '#092d6d',
          950: '#051c47',
        },
        // Slate for surfaces & text
        surface: {
          50: '#f8f9fa',
          100: '#eff0f3',
          200: '#e2e3e8',
          300: '#cfd0d7',
          400: '#b4b5bd',
          500: '#8d8f9a',
          600: '#6b6e7f',
          700: '#56586a',
          800: '#3f414f',
          900: '#2a2d36',
        },
        // Credit: soft green
        credit: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          500: '#22c55e',
          600: '#1f8a4c', // Primary soft green
          700: '#15803d',
          800: '#166534',
        },
        // Debit: soft red
        debit: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          500: '#ef4444',
          600: '#bf3b3b', // Primary soft red
          700: '#b91c1c',
          800: '#991b1b',
        },
        // Neutral backgrounds
        neutral: {
          0: '#ffffff',
          50: '#f6f7fb',
          100: '#f1f3f7',
          200: '#e5e8f0',
          300: '#d8dae5',
          400: '#bec1cc',
          500: '#8793a1',
          600: '#6b7280',
          700: '#4b5563',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
      },
      spacing: {
        // 8px base spacing
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'elevation': '0 8px 16px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '6px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '16px',
          sm: '16px',
          md: '24px',
          lg: '32px',
        },
        screens: {
          sm: '100%',
          md: '728px',
          lg: '960px',
          xl: '1200px',
          '2xl': '1280px',
        },
      },
    },
  },
  plugins: [],
};

