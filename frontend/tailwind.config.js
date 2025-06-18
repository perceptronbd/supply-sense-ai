const { heroui } = require('@heroui/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
    '../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: [
          'var(--font-display)',
          'Manrope',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        sans: [
          'var(--font-sans)',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'JetBrains Mono',
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'Source Code Pro',
          'monospace',
        ],
        data: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bigStone: {
          50: '#75AFD7',
          100: '#699FC6',
          200: '#5181A2',
          300: '#3A627F',
          400: '#22445B',
          500: '#0A2538',
          600: '#081E2D',
          700: '#061622',
          800: '#040F16',
          900: '#02070B',
          950: '#010406',
        },
        pomegranate: {
          50: '#FDEDEA',
          100: '#FADBD5',
          200: '#F6B7AB',
          300: '#F19282',
          400: '#ED6E58',
          500: '#E84A2E',
          600: '#BA3B25',
          700: '#8B2C1C',
          800: '#5D1E12',
          900: '#2E0F09',
          950: '#170705',
        },
        pavlova: {
          50: '#FCFAF5',
          100: '#F9F5EB',
          200: '#F3EBD7',
          300: '#EEE0C4',
          400: '#E8D6B0',
          500: '#E2CC9C',
          600: '#C2AE81',
          700: '#A28F66',
          800: '#83714A',
          900: '#63522F',
          950: '#534322',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      addCommonColors: true,
      themes: {
        light: {
          layout: {
            fontSize: {
              tiny: '0.75rem',
              small: '0.875rem',
              medium: '1rem',
              large: '1.125rem',
            },
            lineHeight: {
              tiny: '1rem',
              small: '1.25rem',
              medium: '1.5rem',
              large: '1.75rem',
            },
            radius: {
              small: '8px',
              medium: '12px',
              large: '14px',
            },
            borderWidth: {
              small: '1px',
              medium: '2px',
              large: '3px',
            },
            disabledOpacity: '0.5',
          },
          colors: {
            default: {
              50: '#f1f1f1',
              100: '#dddddd',
              200: '#cacaca',
              300: '#b6b6b6',
              400: '#a3a3a3',
              500: '#8f8f8f',
              600: '#767676',
              700: '#5d5d5d',
              800: '#444444',
              900: '#2b2b2b',
              foreground: '#000',
              DEFAULT: '#8f8f8f',
            },
            primary: {
              50: '#dfdfdf',
              100: '#b3b3b3',
              200: '#868686',
              300: '#595959',
              400: '#2d2d2d',
              500: '#000000',
              600: '#000000',
              700: '#000000',
              800: '#000000',
              900: '#000000',
              foreground: '#fff',
              DEFAULT: '#000000',
            },
            secondary: {
              50: '#FDEDEA', // pomegranate.50
              100: '#FADBD5', // pomegranate.100
              200: '#F6B7AB', // pomegranate.200
              300: '#F19282', // pomegranate.300
              400: '#ED6E58', // pomegranate.400
              500: '#E84A2E', // pomegranate.500
              600: '#BA3B25', // pomegranate.600
              700: '#8B2C1C', // pomegranate.700
              800: '#5D1E12', // pomegranate.800
              900: '#2E0F09', // pomegranate.900
              foreground: '#FCFAF5', // pavlova.50
              DEFAULT: '#E84A2E', // pomegranate.500
            },

            background: '#ffffff',
            foreground: '#4a4a4a',
            content1: {
              DEFAULT: '#f0f0f0',
              foreground: '#000',
            },
            content2: {
              DEFAULT: '#e6e6e6',
              foreground: '#000',
            },
            content3: {
              DEFAULT: '#dcdcdc',
              foreground: '#000',
            },
            content4: {
              DEFAULT: '#d2d2d2',
              foreground: '#000',
            },
            focus: '#ED6E58',
            overlay: '#000000',
          },
        },
        dark: {
          layout: {
            fontSize: {
              tiny: '0.75rem',
              small: '0.875rem',
              medium: '1rem',
              large: '1.125rem',
            },
            lineHeight: {
              tiny: '1rem',
              small: '1.25rem',
              medium: '1.5rem',
              large: '1.75rem',
            },
            radius: {
              small: '8px',
              medium: '12px',
              large: '14px',
            },
            borderWidth: {
              small: '1px',
              medium: '2px',
              large: '3px',
            },
            disabledOpacity: '0.5',
          },
          colors: {
            default: {
              50: '#02070B', // bigStone.900 (inverted)
              100: '#040F16', // bigStone.800
              200: '#061622', // bigStone.700
              300: '#081E2D', // bigStone.600
              400: '#0A2538', // bigStone.500
              500: '#22445B', // bigStone.400
              600: '#3A627F', // bigStone.300
              700: '#5181A2', // bigStone.200
              800: '#699FC6', // bigStone.100
              900: '#75AFD7', // bigStone.50
              foreground: '#F9F5EB', // pavlova.100
              DEFAULT: '#22445B', // bigStone.400
            },
            primary: {
              50: '#63522F', // pavlova.900 (inverted for dark)
              100: '#83714A', // pavlova.800
              200: '#A28F66', // pavlova.700
              300: '#C2AE81', // pavlova.600
              400: '#E2CC9C', // pavlova.500
              500: '#E8D6B0', // pavlova.400
              600: '#EEE0C4', // pavlova.300
              700: '#F3EBD7', // pavlova.200
              800: '#F9F5EB', // pavlova.100
              900: '#FCFAF5', // pavlova.50
              foreground: '#63522F', // pavlova.900
              DEFAULT: '#C2AE81', // pavlova.600
            },
            secondary: {
              50: '#2E0F09', // pomegranate.900 (inverted for dark)
              100: '#5D1E12', // pomegranate.800
              200: '#8B2C1C', // pomegranate.700
              300: '#BA3B25', // pomegranate.600
              400: '#E84A2E', // pomegranate.500
              500: '#ED6E58', // pomegranate.400
              600: '#F19282', // pomegranate.300
              700: '#F6B7AB', // pomegranate.200
              800: '#FADBD5', // pomegranate.100
              900: '#FDEDEA', // pomegranate.50
              foreground: '#FDEDEA', // pomegranate.50
              DEFAULT: '#BA3B25', // pomegranate.600
            },

            background: '#02070B', // bigStone.900 for dark background
            foreground: '#F9F5EB', // pavlova.100 for readable text
            content1: {
              DEFAULT: '#040F16', // bigStone.800
              foreground: '#F9F5EB',
            },
            content2: {
              DEFAULT: '#061622', // bigStone.700
              foreground: '#F9F5EB',
            },
            content3: {
              DEFAULT: '#081E2D', // bigStone.600
              foreground: '#F9F5EB',
            },
            content4: {
              DEFAULT: '#0A2538', // bigStone.500
              foreground: '#F9F5EB',
            },
            focus: '#ED6E58',
            overlay: '#ffffff',
          },
        },
      },
    }),
  ],
};
